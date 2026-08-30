#include "engine.hpp"
#include "security.hpp"
#include <libtorrent/version.hpp>
#include <libtorrent/torrent_info.hpp>
#include <libtorrent/magnet_uri.hpp>
#include <libtorrent/error_code.hpp>
#include <libtorrent/torrent_flags.hpp>
#include <libtorrent/kademlia/dht_settings.hpp>
#include <libtorrent/write_resume_data.hpp>
#include <libtorrent/read_resume_data.hpp>
#include <libtorrent/alert_types.hpp>
#include <libtorrent/session_stats.hpp>
#include <libtorrent/announce_entry.hpp>
#include <filesystem>
#include <fstream>
#include <iomanip>
#include <stdexcept>
#include <iostream>
#include <chrono>
#include <vector>

namespace torrent {

static std::atomic<int> g_dht_nodes{0};
static std::atomic<int> g_dht_torrents{0};
static std::atomic<int> g_num_peers{0};
static std::atomic<int> g_disk_write_queue{0};
static std::atomic<int> g_disk_read_queue{0};

Engine::Engine() : session_(), running_(true) {
    lt::settings_pack pack;
    pack.set_int(lt::settings_pack::alert_mask,
        lt::alert_category::error |
        lt::alert_category::storage |
        lt::alert_category::status |
        lt::alert_category::peer |
        lt::alert_category::tracker |
        lt::alert_category::dht |
        lt::alert_category::stats |
        lt::alert_category::torrent_log);

    // Optimized multi-torrent throughput limits & DHT bootstrapping
    pack.set_int(lt::settings_pack::active_downloads, 30);
    pack.set_int(lt::settings_pack::active_seeds, 30);
    pack.set_int(lt::settings_pack::active_limit, 60);
    pack.set_int(lt::settings_pack::connections_limit, 600);
    pack.set_int(lt::settings_pack::max_peerlist_size, 5000);
    pack.set_bool(lt::settings_pack::enable_dht, true);
    pack.set_str(lt::settings_pack::dht_bootstrap_nodes,
        "router.bittorrent.com:6881,dht.transmissionbt.com:6881,router.utorrent.com:6881,dht.libtorrent.org:25401");

    // Apple Silicon NVMe SSD & Disk I/O Concurrency
    pack.set_int(lt::settings_pack::aio_threads, 8);               // 8 async disk I/O workers for APFS NVMe
    pack.set_int(lt::settings_pack::hashing_threads, 4);           // 4 dedicated SHA-1 hashing threads on M-series cores
    pack.set_int(lt::settings_pack::disk_io_write_mode, lt::settings_pack::enable_os_cache);
    pack.set_int(lt::settings_pack::disk_io_read_mode, lt::settings_pack::enable_os_cache);

    // Cache line & buffer tuning (capped RAM & high throughput)
    pack.set_int(lt::settings_pack::read_cache_line_size, 32);     // 32 * 16 KiB = 512 KiB read-ahead cache line
    pack.set_int(lt::settings_pack::write_cache_line_size, 32);    // 512 KiB write cache line for fast APFS block writes
    pack.set_int(lt::settings_pack::checking_mem_usage, 2048);     // 32 MB hash checking buffer

    // High-Throughput Network Socket Buffers (2-3 MB)
    pack.set_int(lt::settings_pack::send_buffer_watermark, 3 * 1024 * 1024);     // 3 MB
    pack.set_int(lt::settings_pack::recv_socket_buffer_size, 2 * 1024 * 1024);   // 2 MB
    pack.set_int(lt::settings_pack::send_socket_buffer_size, 2 * 1024 * 1024);   // 2 MB
    pack.set_int(lt::settings_pack::max_peer_recv_buffer_size, 2 * 1024 * 1024);

    // Transport Protocols & Speed Optimization
    pack.set_bool(lt::settings_pack::enable_incoming_utp, true);
    pack.set_bool(lt::settings_pack::enable_outgoing_utp, true);
    pack.set_bool(lt::settings_pack::enable_incoming_tcp, true);
    pack.set_bool(lt::settings_pack::enable_outgoing_tcp, true);
    pack.set_int(lt::settings_pack::mixed_mode_algorithm, lt::settings_pack::prefer_tcp);

    session_.apply_settings(pack);

    load_resume_data();
    alert_thread_ = std::thread(&Engine::poll_alerts_loop, this);
}

Engine::~Engine() {
    running_ = false;
    if (alert_thread_.joinable()) {
        alert_thread_.join();
    }
    save_session_state();
}

std::string Engine::hash_to_string(const lt::info_hash_t& ih) const {
    const auto& h = ih.get_best();
    static constexpr char hex_chars[] = "0123456789abcdef";
    std::string result;
    result.reserve(h.size() * 2);
    for (char c : h) {
        auto byte = static_cast<unsigned char>(c);
        result.push_back(hex_chars[(byte >> 4) & 0x0f]);
        result.push_back(hex_chars[byte & 0x0f]);
    }
    return result;
}

std::string Engine::version() const {
    return lt::version();
}

void Engine::enable_dht_and_pex() {
    std::lock_guard<std::mutex> lock(mutex_);
    lt::settings_pack pack;
    
    // DHT settings
    pack.set_bool(lt::settings_pack::enable_dht, true);
    
    // TCP/UTP transport settings
    pack.set_bool(lt::settings_pack::enable_outgoing_utp, true);
    pack.set_bool(lt::settings_pack::enable_incoming_utp, true);
    pack.set_bool(lt::settings_pack::enable_outgoing_tcp, true);
    pack.set_bool(lt::settings_pack::enable_incoming_tcp, true);

    // LSD (Local Service Discovery) settings
    pack.set_bool(lt::settings_pack::enable_lsd, true);

    // PEX is enabled by default via libtorrent's ut_pex extension

    session_.apply_settings(pack);
}

std::string Engine::add_torrent_file(const std::string& filepath, const std::string& save_path) {
    std::lock_guard<std::mutex> lock(mutex_);
    lt::error_code ec;
    auto info = std::make_shared<lt::torrent_info>(filepath, ec);
    if (ec) {
        throw std::runtime_error("Failed to parse torrent file: " + ec.message());
    }

    std::string final_save_path = save_path;
    if (final_save_path.empty()) {
        const char* home = std::getenv("HOME");
        final_save_path = home ? std::string(home) + "/Downloads" : "/tmp";
    }

    lt::add_torrent_params params;
    params.save_path = final_save_path;
    params.ti = info;
    params.flags &= ~lt::torrent_flags::paused;

    lt::torrent_handle handle = session_.add_torrent(params, ec);
    if (ec) {
        throw std::runtime_error("Failed to add torrent: " + ec.message());
    }

    return hash_to_string(handle.info_hashes());
}

std::string Engine::add_magnet_link(const std::string& magnet_uri, const std::string& save_path) {
    std::lock_guard<std::mutex> lock(mutex_);
    lt::error_code ec;
    lt::add_torrent_params params = lt::parse_magnet_uri(magnet_uri, ec);
    if (ec) {
        throw std::runtime_error("Failed to parse magnet link: " + ec.message());
    }
    
    std::string final_save_path = save_path;
    if (final_save_path.empty()) {
        const char* home = std::getenv("HOME");
        final_save_path = home ? std::string(home) + "/Downloads" : "/tmp";
    }

    params.save_path = final_save_path;
    params.flags &= ~lt::torrent_flags::paused;
    lt::torrent_handle handle = session_.add_torrent(params, ec);
    if (ec) {
        throw std::runtime_error("Failed to add magnet link: " + ec.message());
    }

    return hash_to_string(handle.info_hashes());
}

std::vector<std::string> Engine::get_active_torrents() const {
    std::lock_guard<std::mutex> lock(mutex_);
    std::vector<std::string> active;
    for (const auto& handle : session_.get_torrents()) {
        active.push_back(hash_to_string(handle.info_hashes()));
    }
    return active;
}

static std::string state_to_string(lt::torrent_status::state_t s) {
    switch (s) {
        case lt::torrent_status::checking_files: return "checking files";
        case lt::torrent_status::downloading_metadata: return "downloading metadata";
        case lt::torrent_status::downloading: return "downloading";
        case lt::torrent_status::finished: return "finished";
        case lt::torrent_status::seeding: return "seeding";
        case lt::torrent_status::checking_resume_data: return "checking resume";
        default: return "unknown";
    }
}

static TorrentState build_torrent_state(const lt::torrent_handle& handle, const lt::torrent_status& status, const std::string& info_hash) {
    TorrentState state;
    state.info_hash = info_hash;
    
    if (handle.torrent_file()) {
        state.name = handle.torrent_file()->name();
    } else {
        state.name = status.name;
    }
    
    state.save_path = status.save_path;
    state.progress = status.progress;
    state.download_rate = status.download_rate;
    state.upload_rate = status.upload_rate;
    state.num_peers = status.num_peers;
    state.num_seeds = status.num_seeds;
    state.total_done = status.total_done;
    state.total_wanted = status.total_wanted;
    state.total_upload = status.total_upload;
    state.is_paused = static_cast<bool>(status.flags & lt::torrent_flags::paused);
    state.is_seeding = status.is_seeding;
    state.is_finished = status.is_finished || (status.total_wanted > 0 && status.total_done >= status.total_wanted);
    
    state.magnet_uri = "magnet:?xt=urn:btih:" + info_hash;
    if (!state.name.empty()) {
        state.magnet_uri += "&dn=" + state.name;
    }

    std::int64_t remaining = 0;
    if (state.total_wanted > state.total_done) {
        remaining = state.total_wanted - state.total_done;
    } else if (state.total_wanted == 0 && handle.torrent_file() && handle.torrent_file()->total_size() > state.total_done) {
        remaining = handle.torrent_file()->total_size() - state.total_done;
    }

    if (state.download_rate > 0 && remaining > 0) {
        state.eta_seconds = static_cast<int>(remaining / state.download_rate);
    } else {
        state.eta_seconds = 0;
    }

    state.state = state_to_string(status.state);
    if (state.is_paused) {
        state.state = "paused";
        state.download_rate = 0;
        state.upload_rate = 0;
        state.eta_seconds = 0;
    } else if (state.is_seeding) {
        state.state = "seeding";
    } else if (state.is_finished) {
        state.state = "finished";
    }

    return state;
}

TorrentState Engine::get_torrent_state(const std::string& info_hash) const {
    std::lock_guard<std::mutex> lock(mutex_);
    for (const auto& handle : session_.get_torrents()) {
        if (hash_to_string(handle.info_hashes()) == info_hash) {
            return build_torrent_state(handle, handle.status(), info_hash);
        }
    }
    throw std::runtime_error("Torrent not found: " + info_hash);
}

std::vector<TorrentState> Engine::get_all_torrent_states() const {
    std::lock_guard<std::mutex> lock(mutex_);
    std::vector<TorrentState> states;
    for (const auto& handle : session_.get_torrents()) {
        try {
            std::string info_hash = hash_to_string(handle.info_hashes());
            states.push_back(build_torrent_state(handle, handle.status(), info_hash));
        } catch (...) {
            continue;
        }
    }
    return states;
}

void Engine::pause_torrent(const std::string& info_hash) {
    std::lock_guard<std::mutex> lock(mutex_);
    auto torrents = session_.get_torrents();
    for (auto& t : torrents) {
        if (hash_to_string(t.info_hashes()) == info_hash) {
            t.unset_flags(lt::torrent_flags::auto_managed);
            t.pause();
            break;
        }
    }
}

void Engine::resume_torrent(const std::string& info_hash) {
    std::lock_guard<std::mutex> lock(mutex_);
    auto torrents = session_.get_torrents();
    for (auto& t : torrents) {
        if (hash_to_string(t.info_hashes()) == info_hash) {
            t.set_flags(lt::torrent_flags::auto_managed);
            t.resume();
            break;
        }
    }
}

void Engine::stop_torrent(const std::string& info_hash) {
    std::lock_guard<std::mutex> lock(mutex_);
    auto torrents = session_.get_torrents();
    for (auto& t : torrents) {
        if (hash_to_string(t.info_hashes()) == info_hash) {
            t.unset_flags(lt::torrent_flags::auto_managed);
            t.pause();
            break;
        }
    }
}

void Engine::pause_all_torrents() {
    std::lock_guard<std::mutex> lock(mutex_);
    for (auto& t : session_.get_torrents()) {
        t.unset_flags(lt::torrent_flags::auto_managed);
        t.pause();
    }
}

void Engine::resume_all_torrents() {
    std::lock_guard<std::mutex> lock(mutex_);
    for (auto& t : session_.get_torrents()) {
        t.set_flags(lt::torrent_flags::auto_managed);
        t.resume();
    }
}

void Engine::stop_all_torrents() {
    std::lock_guard<std::mutex> lock(mutex_);
    for (auto& t : session_.get_torrents()) {
        t.unset_flags(lt::torrent_flags::auto_managed);
        t.pause();
    }
}

void Engine::remove_torrent(const std::string& info_hash, bool delete_files) {
    // Delete resume file if it exists
    const char* home = std::getenv("HOME");
    if (home) {
        std::filesystem::path resume_path = std::filesystem::path(home) / ".fluxtorrent" / "resume" / (info_hash + ".resume");
        std::error_code ec;
        std::filesystem::remove(resume_path, ec);
    }
    std::lock_guard<std::mutex> lock(mutex_);
    auto torrents = session_.get_torrents();
    for (auto& t : torrents) {
        if (hash_to_string(t.info_hashes()) == info_hash) {
            session_.remove_torrent(t, delete_files ? lt::session::delete_files : lt::remove_flags_t{});
            break;
        }
    }
}

void Engine::save_session_state() {
    std::lock_guard<std::mutex> lock(mutex_);
    const char* home = std::getenv("HOME");
    if (!home) return;

    std::filesystem::path resume_dir = std::filesystem::path(home) / ".fluxtorrent" / "resume";
    std::error_code ec;
    std::filesystem::create_directories(resume_dir, ec);
    if (ec) {
        std::cerr << "Failed to create resume directory: " << ec.message() << std::endl;
        return;
    }

    auto torrents = session_.get_torrents();
    int num_outstanding = 0;
    for (auto& h : torrents) {
        if (!h.is_valid()) continue;
        h.save_resume_data(lt::torrent_handle::save_info_dict);
        ++num_outstanding;
    }

    auto start_time = std::chrono::steady_clock::now();
    while (num_outstanding > 0) {
        if (std::chrono::duration_cast<std::chrono::seconds>(
                std::chrono::steady_clock::now() - start_time).count() > 5) {
            break;
        }

        session_.wait_for_alert(lt::milliseconds(100));
        std::vector<lt::alert*> alerts;
        session_.pop_alerts(&alerts);
        for (auto* a : alerts) {
            if (auto* rd = lt::alert_cast<lt::save_resume_data_alert>(a)) {
                --num_outstanding;
                auto buf = lt::write_resume_data_buf(rd->params);
                std::string hash_hex = hash_to_string(rd->handle.info_hashes());
                std::filesystem::path file_path = resume_dir / (hash_hex + ".resume");
                std::ofstream out(file_path, std::ios::binary);
                if (out.is_open()) {
                    out.write(buf.data(), static_cast<std::streamsize>(buf.size()));
                }
            } else if (auto* fail = lt::alert_cast<lt::save_resume_data_failed_alert>(a)) {
                --num_outstanding;
            }
        }
    }
}

void Engine::load_resume_data() {
    std::lock_guard<std::mutex> lock(mutex_);
    const char* home = std::getenv("HOME");
    if (!home) return;

    std::filesystem::path resume_dir = std::filesystem::path(home) / ".fluxtorrent" / "resume";
    if (!std::filesystem::exists(resume_dir) || !std::filesystem::is_directory(resume_dir)) {
        return;
    }

    for (const auto& entry : std::filesystem::directory_iterator(resume_dir)) {
        if (entry.is_regular_file() && entry.path().extension() == ".resume") {
            try {
                std::ifstream in(entry.path(), std::ios::binary);
                if (!in.is_open()) continue;

                std::vector<char> buffer((std::istreambuf_iterator<char>(in)),
                                         std::istreambuf_iterator<char>());
                if (buffer.empty()) continue;

                lt::error_code ec;
                lt::add_torrent_params params = lt::read_resume_data(buffer, ec);
                if (ec) {
                    std::cerr << "Failed to read resume data from " << entry.path() << ": " << ec.message() << std::endl;
                    continue;
                }

                if (params.flags & lt::torrent_flags::paused) {
                    params.flags &= ~lt::torrent_flags::auto_managed;
                }

                session_.add_torrent(params, ec);
                if (ec) {
                    std::cerr << "Failed to add torrent from resume data: " << ec.message() << std::endl;
                }
            } catch (const std::exception& e) {
                std::cerr << "Exception loading resume data " << entry.path() << ": " << e.what() << std::endl;
            }
        }
    }
}

} // namespace torrent

namespace torrent {

void Engine::set_download_limit(int limit_kbps) {
    std::lock_guard<std::mutex> lock(mutex_);
    lt::settings_pack pack;
    pack.set_int(lt::settings_pack::download_rate_limit, limit_kbps > 0 ? limit_kbps * 1024 : 0);
    session_.apply_settings(pack);
}

void Engine::set_upload_limit(int limit_kbps) {
    std::lock_guard<std::mutex> lock(mutex_);
    lt::settings_pack pack;
    pack.set_int(lt::settings_pack::upload_rate_limit, limit_kbps > 0 ? limit_kbps * 1024 : 0);
    session_.apply_settings(pack);
}

int Engine::get_download_limit() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return session_.get_settings().get_int(lt::settings_pack::download_rate_limit) / 1024;
}

int Engine::get_upload_limit() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return session_.get_settings().get_int(lt::settings_pack::upload_rate_limit) / 1024;
}

std::vector<Engine::FileInfo> Engine::get_torrent_files(const std::string& info_hash) const {
    std::lock_guard<std::mutex> lock(mutex_);
    std::vector<FileInfo> files;
    for (const auto& handle : session_.get_torrents()) {
        if (hash_to_string(handle.info_hashes()) == info_hash) {
            if (auto tf = handle.torrent_file()) {
                std::vector<int64_t> progress;
                handle.file_progress(progress);
                std::vector<lt::download_priority_t> priorities = handle.get_file_priorities();

                std::string torrent_save_path = handle.status().save_path;
                for (int i = 0; i < tf->num_files(); ++i) {
                    FileInfo fi;
                    fi.index = i;
                    fi.name = std::string(tf->files().file_name(lt::file_index_t(i)));
                    fi.path = tf->files().file_path(lt::file_index_t(i));
                    fi.save_path = torrent_save_path;
                    fi.size = tf->files().file_size(lt::file_index_t(i));
                    fi.progress = fi.size > 0 ? static_cast<float>(progress[i]) / fi.size : 1.0f;
                    fi.priority = (i < priorities.size()) ? static_cast<uint8_t>(priorities[i]) : 1;

                    auto sec = SecurityManager::instance().get_status(info_hash, i);
                    if (sec.status == "untested" || sec.status.empty()) {
                        sec = SecurityManager::instance().analyze_filename(fi.name);
                        SecurityManager::instance().set_status(info_hash, i, sec);
                    }
                    fi.security_status = sec.status;
                    fi.threat_name = sec.threat_name;
                    fi.sha256 = sec.sha256;
                    fi.is_risky_type = sec.is_risky_type;
                    fi.is_double_extension = sec.is_double_extension;
                    fi.security_details = sec.details;

                    files.push_back(fi);
                }
            }
            break;
        }
    }
    return files;
}

void Engine::scan_torrent_file_async(const std::string& info_hash, int file_index) {
    std::lock_guard<std::mutex> lock(mutex_);
    for (auto& handle : session_.get_torrents()) {
        if (hash_to_string(handle.info_hashes()) == info_hash) {
            if (auto tf = handle.torrent_file()) {
                if (file_index >= 0 && file_index < tf->num_files()) {
                    std::string full_path = handle.status().save_path + "/" + tf->files().file_path(lt::file_index_t(file_index));
                    SecurityManager::instance().scan_file_async(info_hash, file_index, full_path, SecurityManager::instance().is_cloud_lookup_enabled());
                }
            }
            break;
        }
    }
}

void Engine::prioritize_files(const std::string& info_hash, const std::vector<int>& priorities) {
    std::lock_guard<std::mutex> lock(mutex_);
    for (auto& handle : session_.get_torrents()) {
        if (hash_to_string(handle.info_hashes()) == info_hash) {
            std::vector<lt::download_priority_t> lt_priorities;
            lt_priorities.reserve(priorities.size());
            for (int p : priorities) {
                lt_priorities.push_back(lt::download_priority_t(static_cast<uint8_t>(p)));
            }
            handle.prioritize_files(lt_priorities);
            break;
        }
    }
}

Engine::PieceInfo Engine::get_piece_info(const std::string& info_hash) const {
    std::lock_guard<std::mutex> lock(mutex_);
    PieceInfo info;
    for (const auto& handle : session_.get_torrents()) {
        if (hash_to_string(handle.info_hashes()) == info_hash) {
            auto status = handle.status(lt::torrent_handle::query_pieces);
            if (auto tf = handle.torrent_file()) {
                info.num_pieces = tf->num_pieces();
                info.piece_length = tf->piece_length();
            } else {
                info.num_pieces = static_cast<int>(status.pieces.size());
                info.piece_length = 0;
            }

            info.bitfield.reserve(status.pieces.size());
            for (int i = 0; i < status.pieces.size(); ++i) {
                info.bitfield.push_back(status.pieces[lt::piece_index_t(i)] ? '1' : '0');
            }

            std::vector<int> avail;
            handle.piece_availability(avail);
            info.availability = avail;
            break;
        }
    }
    return info;
}

Engine::SessionStats Engine::get_session_stats() const {
    std::lock_guard<std::mutex> lock(mutex_);
    SessionStats stats;
    stats.dht_nodes = g_dht_nodes.load();
    stats.dht_torrents = g_dht_torrents.load();
    stats.num_peers = g_num_peers.load();
    stats.disk_write_queue = g_disk_write_queue.load();
    stats.disk_read_queue = g_disk_read_queue.load();

    int total_down_rate = 0;
    int total_up_rate = 0;
    std::int64_t total_dl = 0;
    std::int64_t total_ul = 0;
    int active_peers = 0;

    for (const auto& h : session_.get_torrents()) {
        try {
            auto st = h.status();
            total_down_rate += st.download_rate;
            total_up_rate += st.upload_rate;
            total_dl += st.total_done;
            total_ul += st.total_upload;
            active_peers += st.num_peers;
        } catch (...) {}
    }

    stats.download_rate = total_down_rate;
    stats.upload_rate = total_up_rate;
    stats.total_download = total_dl;
    stats.total_upload = total_ul;
    if (stats.num_peers == 0) stats.num_peers = active_peers;
    stats.listen_port = session_.listen_port();

    return stats;
}

std::vector<Engine::PeerInfo> Engine::get_peer_info(const std::string& info_hash) const {
    std::lock_guard<std::mutex> lock(mutex_);
    std::vector<PeerInfo> peers;
    for (const auto& handle : session_.get_torrents()) {
        if (hash_to_string(handle.info_hashes()) == info_hash) {
            std::vector<lt::peer_info> lt_peers;
            handle.get_peer_info(lt_peers);
            for (const auto& pi : lt_peers) {
                PeerInfo p;
                try {
                    auto ep = pi.remote_endpoint();
                    p.ip = ep.address().to_string() + ":" + std::to_string(ep.port());
                } catch (...) {
                    p.ip = "Peer";
                }
                p.client = pi.client.empty() ? "BitTorrent Client" : pi.client;
                p.down_speed = pi.down_speed;
                p.up_speed = pi.up_speed;
                p.progress = pi.progress;
                p.total_download = pi.total_download;
                p.total_upload = pi.total_upload;

                std::vector<std::string> flag_list;
                if (pi.flags & lt::peer_info::seed) flag_list.push_back("Seed");
                if (pi.flags & lt::peer_info::interesting) flag_list.push_back("Interesting");
                if (pi.flags & lt::peer_info::choked) flag_list.push_back("Choked");
                if (pi.flags & lt::peer_info::remote_interested) flag_list.push_back("Remote Interested");
                if (pi.flags & lt::peer_info::remote_choked) flag_list.push_back("Remote Choked");
                if (pi.flags & lt::peer_info::optimistic_unchoke) flag_list.push_back("Optimistic");
                if (pi.flags & lt::peer_info::utp_socket) flag_list.push_back("uTP");
                if (pi.flags & lt::peer_info::rc4_encrypted || pi.flags & lt::peer_info::plaintext_encrypted) flag_list.push_back("Encrypted");

                std::string flags_str;
                for (size_t fi = 0; fi < flag_list.size(); ++fi) {
                    if (fi > 0) flags_str += ", ";
                    flags_str += flag_list[fi];
                }
                p.flags = flags_str;

                if (pi.source & lt::peer_info::dht) p.source = "DHT";
                else if (pi.source & lt::peer_info::pex) p.source = "PEX";
                else if (pi.source & lt::peer_info::tracker) p.source = "Tracker";
                else if (pi.source & lt::peer_info::lsd) p.source = "LSD";
                else p.source = "Incoming";

                peers.push_back(p);
            }
            break;
        }
    }
    return peers;
}

std::vector<Engine::TrackerInfo> Engine::get_trackers(const std::string& info_hash) const {
    std::lock_guard<std::mutex> lock(mutex_);
    std::vector<TrackerInfo> trackers;
    for (const auto& handle : session_.get_torrents()) {
        if (hash_to_string(handle.info_hashes()) == info_hash) {
            std::vector<lt::announce_entry> trs = handle.trackers();
            for (const auto& tr : trs) {
                TrackerInfo ti;
                ti.url = tr.url;
                ti.status = "Not contacted";
                ti.message = "";
                ti.num_peers = 0;
                ti.num_seeds = 0;
                ti.num_downloads = 0;

                for (const auto& ep : tr.endpoints) {
                    for (const auto& aih : ep.info_hashes) {
                        if (aih.is_working()) {
                            ti.status = "Working";
                        } else if (aih.fails > 0) {
                            ti.status = "Error: " + aih.last_error.message();
                        } else if (aih.updating) {
                            ti.status = "Updating...";
                        }
                        if (!aih.message.empty()) {
                            ti.message = aih.message;
                        }
                        if (aih.scrape_incomplete >= 0) ti.num_peers = std::max(ti.num_peers, aih.scrape_incomplete);
                        if (aih.scrape_complete >= 0) ti.num_seeds = std::max(ti.num_seeds, aih.scrape_complete);
                        if (aih.scrape_downloaded >= 0) ti.num_downloads = std::max(ti.num_downloads, aih.scrape_downloaded);
                    }
                }
                trackers.push_back(ti);
            }
            break;
        }
    }
    return trackers;
}

void Engine::force_reannounce(const std::string& info_hash) {
    std::lock_guard<std::mutex> lock(mutex_);
    for (auto& handle : session_.get_torrents()) {
        if (hash_to_string(handle.info_hashes()) == info_hash) {
            handle.force_reannounce();
            handle.force_dht_announce();
            break;
        }
    }
}

void Engine::add_tracker(const std::string& info_hash, const std::string& tracker_url) {
    std::lock_guard<std::mutex> lock(mutex_);
    for (auto& handle : session_.get_torrents()) {
        if (hash_to_string(handle.info_hashes()) == info_hash) {
            lt::announce_entry ae(tracker_url);
            handle.add_tracker(ae);
            handle.force_reannounce();
            break;
        }
    }
}

void Engine::set_sequential_download(const std::string& info_hash, bool sequential) {
    std::lock_guard<std::mutex> lock(mutex_);
    for (auto& handle : session_.get_torrents()) {
        if (hash_to_string(handle.info_hashes()) == info_hash) {
            handle.set_flags(sequential ? lt::torrent_flags::sequential_download : lt::torrent_flags_t{}, lt::torrent_flags::sequential_download);
            break;
        }
    }
}

void Engine::set_proxy(int proxy_type, const std::string& hostname, int port) {
    std::lock_guard<std::mutex> lock(mutex_);
    lt::settings_pack pack;
    pack.set_int(lt::settings_pack::proxy_type, proxy_type);
    if (!hostname.empty()) {
        pack.set_str(lt::settings_pack::proxy_hostname, hostname);
        pack.set_int(lt::settings_pack::proxy_port, port);
    }
    session_.apply_settings(pack);
}

void Engine::set_encryption(bool require_encryption) {
    std::lock_guard<std::mutex> lock(mutex_);
    lt::settings_pack pack;
    pack.set_int(lt::settings_pack::out_enc_policy, require_encryption ? lt::settings_pack::pe_forced : lt::settings_pack::pe_enabled);
    pack.set_int(lt::settings_pack::in_enc_policy, require_encryption ? lt::settings_pack::pe_forced : lt::settings_pack::pe_enabled);
    session_.apply_settings(pack);
}

void Engine::set_listen_interfaces(const std::string& interfaces) {
    std::lock_guard<std::mutex> lock(mutex_);
    lt::settings_pack pack;
    pack.set_str(lt::settings_pack::listen_interfaces, interfaces);
    session_.apply_settings(pack);
}

int Engine::get_proxy_type() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return session_.get_settings().get_int(lt::settings_pack::proxy_type);
}

bool Engine::get_require_encryption() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return session_.get_settings().get_int(lt::settings_pack::out_enc_policy) == lt::settings_pack::pe_forced;
}

std::string Engine::get_listen_interfaces() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return session_.get_settings().get_str(lt::settings_pack::listen_interfaces);
}

void Engine::prioritize_for_streaming(const std::string& info_hash, int file_index) {
    std::lock_guard<std::mutex> lock(mutex_);
    for (auto const& t : session_.get_torrents()) {
        if (hash_to_string(t.info_hashes()) == info_hash) {
            if (auto tinfo = t.torrent_file()) {
                if (file_index < 0 || file_index >= tinfo->num_files()) return;

                // Turn on sequential download for steady forward stream progress
                t.set_flags(lt::torrent_flags::sequential_download, lt::torrent_flags::sequential_download);
                
                // Prioritize this target file to maximum download priority
                t.file_priority(lt::file_index_t{file_index}, lt::download_priority_t{7});

                // Find piece boundaries for this file
                auto files = tinfo->files();
                int64_t file_offset = files.file_offset(lt::file_index_t(file_index));
                int64_t file_size = files.file_size(lt::file_index_t(file_index));
                int piece_len = tinfo->piece_length();

                if (piece_len > 0 && file_size > 0) {
                    int start_piece = static_cast<int>(file_offset / piece_len);
                    int end_piece = static_cast<int>((file_offset + file_size - 1) / piece_len);

                    // 1. Prioritize first 30 pieces with highest priority 7 & deadline 0 (headers, moov atom, codecs)
                    for (int p = start_piece; p <= std::min(end_piece, start_piece + 30); ++p) {
                        t.piece_priority(lt::piece_index_t(p), lt::download_priority_t(7));
                        t.set_piece_deadline(lt::piece_index_t(p), 0);
                    }

                    // 2. Prioritize last 20 pieces with highest priority 7 & deadline 0 (moov atom at EOF, MKV Cues/seek table)
                    for (int p = std::max(start_piece, end_piece - 20); p <= end_piece; ++p) {
                        t.piece_priority(lt::piece_index_t(p), lt::download_priority_t(7));
                        t.set_piece_deadline(lt::piece_index_t(p), 0);
                    }
                }
                return;
            }
        }
    }
}

void Engine::prioritize_range(const std::string& info_hash, int file_index, std::int64_t byte_offset, std::int64_t byte_length) {
    std::lock_guard<std::mutex> lock(mutex_);
    for (auto const& t : session_.get_torrents()) {
        if (hash_to_string(t.info_hashes()) == info_hash) {
            if (auto tinfo = t.torrent_file()) {
                if (file_index < 0 || file_index >= tinfo->num_files()) return;
                auto files = tinfo->files();
                int64_t file_base = files.file_offset(lt::file_index_t(file_index));
                int64_t file_size = files.file_size(lt::file_index_t(file_index));
                int piece_len = tinfo->piece_length();
                if (piece_len <= 0 || file_size <= 0) return;

                int64_t target_start = file_base + std::max<int64_t>(0, byte_offset);
                int64_t target_end = file_base + std::min<int64_t>(file_size - 1, byte_offset + byte_length);

                int start_piece = static_cast<int>(target_start / piece_len);
                int end_piece = static_cast<int>(target_end / piece_len);

                for (int p = start_piece; p <= end_piece && p < tinfo->num_pieces(); ++p) {
                    t.piece_priority(lt::piece_index_t(p), lt::download_priority_t(7));
                    t.set_piece_deadline(lt::piece_index_t(p), 0);
                }
                return;
            }
        }
    }
}

void Engine::poll_alerts_loop() {
    const char* home = std::getenv("HOME");
    std::string resume_dir_str = home ? std::string(home) + "/.fluxtorrent/resume" : "/tmp/fluxtorrent_resume";
    std::filesystem::path resume_dir(resume_dir_str);
    std::error_code ec;
    std::filesystem::create_directories(resume_dir, ec);

    auto last_stats_post = std::chrono::steady_clock::now();
    auto last_resume_save = std::chrono::steady_clock::now();

    while (running_) {
        // Post stats every 1 second
        auto now = std::chrono::steady_clock::now();
        if (std::chrono::duration_cast<std::chrono::seconds>(now - last_stats_post).count() >= 1) {
            last_stats_post = now;
            session_.post_session_stats();
        }

        // Auto-save resume data every 30 seconds
        if (std::chrono::duration_cast<std::chrono::seconds>(now - last_resume_save).count() >= 30) {
            last_resume_save = now;
            std::lock_guard<std::mutex> lock(mutex_);
            for (auto& h : session_.get_torrents()) {
                if (h.is_valid()) {
                    h.save_resume_data(lt::torrent_handle::save_info_dict);
                }
            }
        }

        session_.wait_for_alert(lt::milliseconds(500));
        std::vector<lt::alert*> alerts;
        session_.pop_alerts(&alerts);

        for (lt::alert* a : alerts) {
            if (auto* rd = lt::alert_cast<lt::save_resume_data_alert>(a)) {
                try {
                    auto buf = lt::write_resume_data_buf(rd->params);
                    std::string hash_hex = hash_to_string(rd->handle.info_hashes());
                    std::filesystem::path file_path = resume_dir / (hash_hex + ".resume");
                    std::ofstream out(file_path, std::ios::binary);
                    if (out.is_open()) {
                        out.write(buf.data(), static_cast<std::streamsize>(buf.size()));
                    }
                } catch (...) {}
            } else if (auto* mra = lt::alert_cast<lt::metadata_received_alert>(a)) {
                std::string ih = hash_to_string(mra->handle.info_hashes());
                std::cout << "[Alert] Metadata received for: " << ih << std::endl;
                mra->handle.save_resume_data(lt::torrent_handle::save_info_dict);

                if (SecurityManager::instance().is_enabled()) {
                    if (auto tf = mra->handle.torrent_file()) {
                        std::vector<lt::download_priority_t> current_priorities = mra->handle.get_file_priorities();
                        bool auto_skip = SecurityManager::instance().is_auto_skip_risky();
                        bool modified_priorities = false;

                        for (int i = 0; i < tf->num_files(); ++i) {
                            std::string fname = std::string(tf->files().file_name(lt::file_index_t(i)));
                            auto sec = SecurityManager::instance().analyze_filename(fname);
                            SecurityManager::instance().set_status(ih, i, sec);

                            if (auto_skip && sec.is_risky_type) {
                                if (i < static_cast<int>(current_priorities.size())) {
                                    current_priorities[i] = lt::dont_download;
                                    modified_priorities = true;
                                    std::cout << "[Security] Auto-skipping risky file: " << fname << std::endl;
                                }
                            }
                        }
                        if (modified_priorities) {
                            mra->handle.prioritize_files(current_priorities);
                        }
                    }
                }
            } else if (auto* fca = lt::alert_cast<lt::file_completed_alert>(a)) {
                std::string ih = hash_to_string(fca->handle.info_hashes());
                int file_idx = static_cast<int>(fca->index);
                std::cout << "[Alert] File completed: " << file_idx << " in " << ih << std::endl;
                if (SecurityManager::instance().is_enabled()) {
                    if (auto tf = fca->handle.torrent_file()) {
                        std::string rel_path = tf->files().file_path(fca->index);
                        std::string save_p = fca->handle.status().save_path;
                        std::string full_p = save_p + "/" + rel_path;
                        SecurityManager::instance().scan_file_async(ih, file_idx, full_p, SecurityManager::instance().is_cloud_lookup_enabled());
                    }
                }
            } else if (auto* tfa = lt::alert_cast<lt::torrent_finished_alert>(a)) {
                std::string ih = hash_to_string(tfa->handle.info_hashes());
                std::cout << "[Alert] Torrent finished: " << ih << std::endl;
                tfa->handle.save_resume_data(lt::torrent_handle::save_info_dict);

                if (SecurityManager::instance().is_enabled()) {
                    if (auto tf = tfa->handle.torrent_file()) {
                        std::string save_p = tfa->handle.status().save_path;
                        for (int i = 0; i < tf->num_files(); ++i) {
                            std::string rel_path = tf->files().file_path(lt::file_index_t(i));
                            std::string full_p = save_p + "/" + rel_path;
                            SecurityManager::instance().scan_file_async(ih, i, full_p, SecurityManager::instance().is_cloud_lookup_enabled());
                        }
                    }
                }
            } else if (auto* ssa = lt::alert_cast<lt::session_stats_alert>(a)) {
                static const int dht_nodes_idx = lt::find_metric_idx("dht.dht_nodes");
                static const int dht_torrents_idx = lt::find_metric_idx("dht.dht_torrents");
                static const int peers_connected_idx = lt::find_metric_idx("peer.num_peers_connected");
                static const int disk_write_idx = lt::find_metric_idx("disk.disk_write_queue");
                static const int disk_read_idx = lt::find_metric_idx("disk.disk_read_queue");

                auto const& counters = ssa->counters();
                if (dht_nodes_idx >= 0 && dht_nodes_idx < counters.size()) {
                    g_dht_nodes.store(static_cast<int>(counters[dht_nodes_idx]));
                }
                if (dht_torrents_idx >= 0 && dht_torrents_idx < counters.size()) {
                    g_dht_torrents.store(static_cast<int>(counters[dht_torrents_idx]));
                }
                if (peers_connected_idx >= 0 && peers_connected_idx < counters.size()) {
                    g_num_peers.store(static_cast<int>(counters[peers_connected_idx]));
                }
                if (disk_write_idx >= 0 && disk_write_idx < counters.size()) {
                    g_disk_write_queue.store(static_cast<int>(counters[disk_write_idx]));
                }
                if (disk_read_idx >= 0 && disk_read_idx < counters.size()) {
                    g_disk_read_queue.store(static_cast<int>(counters[disk_read_idx]));
                }
            } else if (auto* dht_ann = lt::alert_cast<lt::dht_announce_alert>(a)) {
                std::string dht_index_path = home ? std::string(home) + "/.fluxtorrent/dht_index.txt" : "/tmp/dht_index.txt";
                std::ofstream out(dht_index_path, std::ios::app);
                out << hash_to_string(lt::info_hash_t(dht_ann->info_hash)) << std::endl;
            } else if (auto* dht_get = lt::alert_cast<lt::dht_get_peers_alert>(a)) {
                std::string dht_index_path = home ? std::string(home) + "/.fluxtorrent/dht_index.txt" : "/tmp/dht_index.txt";
                std::ofstream out(dht_index_path, std::ios::app);
                out << hash_to_string(lt::info_hash_t(dht_get->info_hash)) << std::endl;
            }
        }
    }
}

} // namespace torrent
