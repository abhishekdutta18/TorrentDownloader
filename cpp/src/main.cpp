#include <iostream>
#include <fstream>
#include <thread>
#include <csignal>
#include <sstream>
#include <cstdlib>
#include <unordered_map>
#include <mutex>
#include <chrono>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <httplib.h>
#include <nlohmann/json.hpp>
#include <filesystem>
#include <sys/file.h>
#include <fcntl.h>
#include <libtorrent/magnet_uri.hpp>
#include <libtorrent/error_code.hpp>
#include "engine.hpp"
#include "search.hpp"
#include "rss_worker.hpp"
#include "security.hpp"
#include "media_ai.hpp"
#include <fstream>
#include <filesystem>

using json = nlohmann::json;

static httplib::Server* g_svr = nullptr;
static std::unordered_map<std::string, std::string> known_names;
static std::mutex known_names_mutex;

bool is_port_free(int port) {
    int sock = ::socket(AF_INET, SOCK_STREAM, 0);
    if (sock < 0) return false;
    int opt = 1;
    ::setsockopt(sock, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
    sockaddr_in addr{};
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
    addr.sin_port = htons(port);
    bool free = (::bind(sock, (struct sockaddr*)&addr, sizeof(addr)) == 0);
    ::close(sock);
    return free;
}

void signal_handler(int signum) {
    (void)signum;
    if (g_svr) {
        g_svr->stop();
    }
}

// Helper to auto-discover local Jackett configuration
void auto_discover_jackett(torrent::SearchEngine& search) {
    const char* home_env = getenv("HOME");
    if (!home_env) {
        std::cerr << "HOME environment variable not set. Skipping Jackett discovery." << std::endl;
        return;
    }
    std::string config_path = std::string(home_env) + "/Library/Application Support/Jackett/ServerConfig.json";
    std::ifstream file(config_path);
    if (file.is_open()) {
        try {
            json config = json::parse(file);
            std::string api_key = config.value("APIKey", "");
            if (!api_key.empty()) {
                std::cout << "Auto-discovered local Jackett API Key." << std::endl;
                search.add_jackett_instance("http://127.0.0.1:9117", api_key);
                return;
            }
        } catch (...) {}
    }
    std::cerr << "Failed to auto-discover Jackett API Key. Make sure Jackett is installed." << std::endl;
}


nlohmann::json global_settings;
void load_global_settings(torrent::Engine& engine, torrent::RssWorker& rss_worker) {
    std::string home = getenv("HOME") ? getenv("HOME") : "/tmp";
    std::string path = home + "/.fluxtorrent/settings.json";
    if (std::filesystem::exists(path)) {
        std::ifstream f(path);
        f >> global_settings;
    }
    if (global_settings.contains("downloadLimit")) engine.set_download_limit(global_settings["downloadLimit"].get<int>() / 1024);
    if (global_settings.contains("uploadLimit")) engine.set_upload_limit(global_settings["uploadLimit"].get<int>() / 1024);
    if (global_settings.contains("rssFeeds")) rss_worker.set_feeds(global_settings["rssFeeds"].get<std::vector<std::string>>());
    if (global_settings.contains("rssRules")) rss_worker.set_rules(global_settings["rssRules"].get<std::vector<std::string>>());
    if (global_settings.contains("enableMalwareProtection")) torrent::SecurityManager::instance().set_enabled(global_settings["enableMalwareProtection"].get<bool>());
    if (global_settings.contains("autoSkipRiskyFiles")) torrent::SecurityManager::instance().set_auto_skip_risky(global_settings["autoSkipRiskyFiles"].get<bool>());
    if (global_settings.contains("enableCloudLookup")) torrent::SecurityManager::instance().set_cloud_lookup_enabled(global_settings["enableCloudLookup"].get<bool>());
}
void save_global_settings() {
    std::string home = getenv("HOME") ? getenv("HOME") : "/tmp";
    std::ofstream f(home + "/.fluxtorrent/settings.json");
    f << global_settings.dump(4);
}

void setup_settings_routes(httplib::Server& svr, torrent::Engine& engine, torrent::RssWorker& rss_worker) {
    
    svr.Get("/api/settings", [&](const httplib::Request&, httplib::Response& res) {
        if (!global_settings.contains("downloadLimit")) global_settings["downloadLimit"] = engine.get_download_limit() * 1024;
        if (!global_settings.contains("uploadLimit")) global_settings["uploadLimit"] = engine.get_upload_limit() * 1024;
        if (!global_settings.contains("rssFeeds")) global_settings["rssFeeds"] = std::vector<std::string>();
        if (!global_settings.contains("rssRules")) global_settings["rssRules"] = std::vector<std::string>();
        if (!global_settings.contains("enableMalwareProtection")) global_settings["enableMalwareProtection"] = torrent::SecurityManager::instance().is_enabled();
        if (!global_settings.contains("autoSkipRiskyFiles")) global_settings["autoSkipRiskyFiles"] = torrent::SecurityManager::instance().is_auto_skip_risky();
        if (!global_settings.contains("enableCloudLookup")) global_settings["enableCloudLookup"] = torrent::SecurityManager::instance().is_cloud_lookup_enabled();
        res.set_content(global_settings.dump(), "application/json");
    });


    
    svr.Post("/api/settings", [&](const httplib::Request& req, httplib::Response& res) {
        try {
            auto body = json::parse(req.body);
            for (auto it = body.begin(); it != body.end(); ++it) {
                global_settings[it.key()] = it.value();
            }
            if (body.contains("downloadLimit")) engine.set_download_limit(body["downloadLimit"].get<int>() / 1024);
            if (body.contains("uploadLimit")) engine.set_upload_limit(body["uploadLimit"].get<int>() / 1024);
            if (body.contains("rssFeeds")) rss_worker.set_feeds(body["rssFeeds"].get<std::vector<std::string>>());
            if (body.contains("rssRules")) rss_worker.set_rules(body["rssRules"].get<std::vector<std::string>>());
            if (body.contains("enableMalwareProtection")) torrent::SecurityManager::instance().set_enabled(body["enableMalwareProtection"].get<bool>());
            if (body.contains("autoSkipRiskyFiles")) torrent::SecurityManager::instance().set_auto_skip_risky(body["autoSkipRiskyFiles"].get<bool>());
            if (body.contains("enableCloudLookup")) torrent::SecurityManager::instance().set_cloud_lookup_enabled(body["enableCloudLookup"].get<bool>());
            save_global_settings();
            res.set_content(global_settings.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(std::string("{\"error\":\"") + e.what() + "\"}", "application/json");
        }
    });


    svr.Options("/api/settings", [&](const httplib::Request&, httplib::Response& res) {
        res.set_content("", "text/plain");
    });
}



void setup_engine_routes(httplib::Server& svr, torrent::Engine& engine);

int main() {
    // Enforce strictly single daemon instance
    int lock_fd = ::open("/tmp/fluxtorrent_daemon.lock", O_CREAT | O_RDWR, 0666);
    if (lock_fd >= 0) {
        if (::flock(lock_fd, LOCK_EX | LOCK_NB) != 0) {
            std::cerr << "Another instance of FluxTorrent daemon is already active on this system. Exiting." << std::endl;
            return 0;
        }
    }

    std::cout << "Starting FluxTorrent Backend API..." << std::endl;

    httplib::Server svr;
    svr.new_task_queue = [] { return new httplib::ThreadPool(32); };
    g_svr = &svr;

    std::signal(SIGINT, signal_handler);
    std::signal(SIGTERM, signal_handler);
#ifdef SIGPIPE
    std::signal(SIGPIPE, SIG_IGN);
#endif
    
    torrent::Engine engine;
    engine.enable_dht_and_pex();
    torrent::SearchEngine search(engine);
    
    // Configure Jackett Load Balancer with Automated Discovery
    auto_discover_jackett(search);

    // API: Get all active torrents and their progress
    svr.Get("/api/torrents", [&](const httplib::Request&, httplib::Response& res) {
        json response = json::array();
        for (const auto& state : engine.get_all_torrent_states()) {
            std::string display_name = state.name;
            if (display_name.empty()) {
                std::lock_guard<std::mutex> lock(known_names_mutex);
                auto it = known_names.find(state.info_hash);
                if (it != known_names.end() && !it->second.empty()) {
                    display_name = it->second;
                } else {
                    display_name = "Fetching Metadata...";
                }
            }
            response.push_back({
                {"hash", state.info_hash},
                {"name", display_name},
                {"progress", state.progress * 100.0f},
                {"download_speed", state.download_rate},
                {"upload_speed", state.upload_rate},
                {"seeders", state.num_seeds},
                {"peers", state.num_peers},
                {"state", state.state},
                {"downloaded", state.total_done},
                {"length", state.total_wanted},
                {"uploaded", state.total_upload},
                {"save_path", state.save_path},
                {"magnet_uri", state.magnet_uri},
                {"eta", state.eta_seconds},
                {"paused", state.is_paused},
                {"done", state.is_finished}
            });
        }
        res.set_content(response.dump(), "application/json");
    });

    // API: Add a new torrent via magnet link
    svr.Post("/api/torrents", [&](const httplib::Request& req, httplib::Response& res) {
        try {
            auto body = json::parse(req.body);
            std::string magnet = body.value("magnet", "");
            std::string torrent_name = body.value("name", "");
            
            const char* home_env = getenv("HOME");
            std::string default_path = home_env ? std::string(home_env) + "/Downloads" : "/tmp";
            std::string base_path = body.value("save_path", default_path);

            std::string file_path = body.value("path", "");
            std::error_code fs_ec;
            if (file_path.empty() && !magnet.empty() && 
                magnet.rfind("magnet:", 0) != 0 && 
                magnet.rfind("http://", 0) != 0 && 
                magnet.rfind("https://", 0) != 0) {
                if (std::filesystem::exists(magnet, fs_ec) && !fs_ec) {
                    file_path = magnet;
                }
            }
            if (!file_path.empty() && std::filesystem::exists(file_path, fs_ec) && !fs_ec) {
                std::string hash = engine.add_torrent_file(file_path, base_path);
                if (!torrent_name.empty()) {
                    std::lock_guard<std::mutex> lock(known_names_mutex);
                    known_names[hash] = torrent_name;
                }
                json response = {{"status", "success"}, {"hash", hash}};
                res.set_content(response.dump(), "application/json");
                return;
            }
            
            // Check if it is an HTTP link instead of a magnet
            if (magnet.rfind("http://", 0) == 0 || magnet.rfind("https://", 0) == 0) {
                // Download the torrent file
                size_t host_end = magnet.find("/", 8);
                std::string host = magnet.substr(0, host_end);
                std::string path = magnet.substr(host_end);
                httplib::Client cli(host.c_str());
                
                auto dl_res = cli.Get(path.c_str());
                if (dl_res && (dl_res->status == 301 || dl_res->status == 302)) {
                    std::string loc = dl_res->get_header_value("Location");
                    if (loc.rfind("magnet:", 0) == 0) {
                        std::string hash = engine.add_magnet_link(loc, base_path);
                        if (!torrent_name.empty()) {
                            std::lock_guard<std::mutex> lock(known_names_mutex);
                            known_names[hash] = torrent_name;
                        }
                        json response = {{"status", "success"}, {"hash", hash}};
                        res.set_content(response.dump(), "application/json");
                        return;
                    }
                }
                if (dl_res && dl_res->status == 200) {
                    std::string temp_path = std::filesystem::temp_directory_path().string() + "/temp_" + std::to_string(time(nullptr)) + ".torrent";
                    std::ofstream out(temp_path, std::ios::binary);
                    out.write(dl_res->body.c_str(), dl_res->body.size());
                    out.close();
                    std::string hash = engine.add_torrent_file(temp_path, base_path);
                    std::filesystem::remove(temp_path);
                    if (!torrent_name.empty()) {
                        std::lock_guard<std::mutex> lock(known_names_mutex);
                        known_names[hash] = torrent_name;
                    }
                    json response = {{"status", "success"}, {"hash", hash}};
                    res.set_content(response.dump(), "application/json");
                    return;
                } else {
                    throw std::runtime_error("Failed to download torrent file from link");
                }
            }
            
            // Otherwise handle as standard magnet
            lt::error_code ec;
            lt::add_torrent_params params = lt::parse_magnet_uri(magnet, ec);
            if (!ec) {
                std::string target_hash = ([&](){ std::stringstream ss; ss << params.info_hashes.get_best(); return ss.str(); })();
                if (!target_hash.empty()) {
                    for (const auto& existing_hash : engine.get_active_torrents()) {
                        if (existing_hash == target_hash) {
                            res.status = 409;
                            json response = {{"status", "error"}, {"message", "Torrent already exists"}};
                            res.set_content(response.dump(), "application/json");
                            return;
                        }
                    }
                }
            }
            
            std::string hash = engine.add_magnet_link(magnet, base_path);
            if (!torrent_name.empty()) {
                std::lock_guard<std::mutex> lock(known_names_mutex);
                known_names[hash] = torrent_name;
            }
            json response = {{"status", "success"}, {"hash", hash}};
            res.set_content(response.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            json response = {{"status", "error"}, {"message", e.what()}};
            res.set_content(response.dump(), "application/json");
        }
    });
    svr.Post("/api/torrents/file", [&](const httplib::Request& req, httplib::Response& res) {
        try {
            if (!req.has_file("file")) {
                res.status = 400;
                json response = {{"status", "error"}, {"message", "Missing 'file' in upload request"}};
                res.set_content(response.dump(), "application/json");
                return;
            }

            auto file = req.get_file_value("file");
            if (file.content.empty()) {
                res.status = 400;
                json response = {{"status", "error"}, {"message", "Uploaded file is empty"}};
                res.set_content(response.dump(), "application/json");
                return;
            }

            // Write to temporary file
            std::string temp_filename = "upload_" + std::to_string(std::chrono::high_resolution_clock::now().time_since_epoch().count()) + ".torrent";
            std::filesystem::path temp_path = std::filesystem::temp_directory_path() / temp_filename;

            {
                std::ofstream ofs(temp_path, std::ios::binary);
                if (!ofs.is_open()) {
                    throw std::runtime_error("Failed to create temporary file");
                }
                ofs.write(file.content.data(), file.content.size());
            }

            const char* home_env = getenv("HOME");
            std::string default_path = home_env ? (std::string(home_env) + "/Downloads") : "/tmp";
            std::string save_path = req.has_param("save_path") ? req.get_param_value("save_path") : default_path;

            std::string hash;
            try {
                hash = engine.add_torrent_file(temp_path.string(), save_path);
            } catch (...) {
                std::filesystem::remove(temp_path);
                throw;
            }
            std::filesystem::remove(temp_path);

            if (!file.filename.empty()) {
                std::string fname = file.filename;
                if (fname.size() > 8 && fname.substr(fname.size() - 8) == ".torrent") {
                    fname = fname.substr(0, fname.size() - 8);
                }
                std::lock_guard<std::mutex> lock(known_names_mutex);
                known_names[hash] = fname;
            }

            json response = {{{"status", "success"}}, {"hash", hash}};
            res.set_content(response.dump(), "application/json");
        } catch (const std::exception& e) {
            json response = {{"status", "error"}, {"message", e.what()}};
            res.status = 400;
            res.set_content(response.dump(), "application/json");
        }
    });

    // API: Search Jackett/DHT (SSE Stream)
    svr.Get("/api/search", [&](const httplib::Request& req, httplib::Response& res) {
        if (!req.has_param("q")) {
            res.status = 400;
            res.set_content("{\"error\": \"Missing query parameter 'q'\"}", "application/json");
            return;
        }
        std::string query = req.get_param_value("q");
        
        res.set_chunked_content_provider("text/event-stream", [query, &search](size_t offset, httplib::DataSink &sink) {
            auto search_results = search.search(query);
            for (const auto& r : search_results) {
                json item = {
                    {"name", r.name},
                    {"infoHash", r.info_hash},
                    {"magnet", r.magnet_uri},
                    {"size", r.size_bytes},
                    {"seeders", r.seeders},
                    {"leechers", r.leechers},
                    {"source", r.source}
                };
                std::string sse_msg = "data: " + item.dump() + "\n\n";
                sink.write(sse_msg.c_str(), sse_msg.size());
            }
            sink.done();
            return true;
        });
    });

    // Handle CORS preflight
    svr.Options(R"(/api/.*)", [](const httplib::Request&, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "*");
        res.set_content("", "text/plain");
    });

    svr.set_post_routing_handler([](const httplib::Request&, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Headers", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    });

    setup_engine_routes(svr, engine);
    torrent::RssWorker rss_worker(engine);
    load_global_settings(engine, rss_worker);
    rss_worker.start();
    setup_settings_routes(svr, engine, rss_worker);

    // Serve static frontend files (Support both CLI build/ folder and macOS App Resources/ folder)
    if (std::filesystem::exists("./public")) {
        svr.set_mount_point("/", "./public");
    } else {
        svr.set_mount_point("/", "../public");
    }

    int chosen_port = -1;
    for (int p = 8080; p <= 8090; ++p) {
        if (!is_port_free(p)) {
            continue;
        }
        svr.stop();
        if (svr.bind_to_port("127.0.0.1", p)) {
            chosen_port = p;
            break;
        }
    }

    if (chosen_port == -1) {
        std::cerr << "Error: All ports in range 8080-8090 are in use." << std::endl;
        exit(1);
    }

    std::ofstream port_file("/tmp/fluxtorrent_port.txt");
    if (port_file.is_open()) {
        port_file << chosen_port << std::endl;
        port_file.close();
    }

    std::cout << "Backend API & Web UI running on http://localhost:" << chosen_port << std::endl;
    svr.listen_after_bind();
    
    return 0;
}




void setup_engine_routes(httplib::Server& svr, torrent::Engine& engine) {
    // API: Real Libtorrent Session Statistics
    svr.Get("/api/session/stats", [&engine](const httplib::Request&, httplib::Response& res) {
        auto stats = engine.get_session_stats();
        json j = {
            {"dht_nodes", stats.dht_nodes},
            {"dht_torrents", stats.dht_torrents},
            {"num_peers", stats.num_peers},
            {"total_download", stats.total_download},
            {"total_upload", stats.total_upload},
            {"download_rate", stats.download_rate},
            {"upload_rate", stats.upload_rate},
            {"disk_write_queue", stats.disk_write_queue},
            {"disk_read_queue", stats.disk_read_queue},
            {"listen_port", stats.listen_port}
        };
        res.set_content(j.dump(), "application/json");
    });

    // API: Real Piece Bitfield & Swarm Availability
    svr.Get(R"(/api/torrents/([^/]+)/pieces)", [&engine](const httplib::Request& req, httplib::Response& res) {
        std::string hash = req.matches[1];
        try {
            auto p = engine.get_piece_info(hash);
            json j = {
                {"num_pieces", p.num_pieces},
                {"piece_length", p.piece_length},
                {"bitfield", p.bitfield},
                {"availability", p.availability}
            };
            res.set_content(j.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 404;
            res.set_content(json{{"error", e.what()}}.dump(), "application/json");
        }
    });

    // API: HTTP 206 Partial Content (Range Request) Video Streaming with Chunked Provider (supporting files > 2GB)
    svr.Get(R"(/api/stream/([^/]+)/(\d+)(?:/(.*))?)", [&engine](const httplib::Request& req, httplib::Response& res) {
        std::string hash = req.matches[1];
        int file_index = std::stoi(req.matches[2]);
        engine.prioritize_for_streaming(hash, file_index);

        if (req.has_header("Range")) {
            std::string range_val = req.get_header_value("Range");
            size_t eq_pos = range_val.find('=');
            if (eq_pos != std::string::npos) {
                try {
                    int64_t start_byte = std::stoll(range_val.substr(eq_pos + 1));
                    engine.prioritize_range(hash, file_index, start_byte, 10 * 1024 * 1024);
                } catch (...) {}
            }
        }
        
        auto files = engine.get_torrent_files(hash);
        if (file_index < 0 || file_index >= static_cast<int>(files.size())) {
            res.status = 404;
            return;
        }

        std::string full = files[file_index].save_path + "/" + files[file_index].path;
        std::error_code stream_ec;
        if (!std::filesystem::exists(full, stream_ec) || stream_ec) {
            res.status = 503;
            res.set_content("Buffering media from swarm...", "text/plain");
            return;
        }

        std::string ext = full.substr(full.find_last_of(".") + 1);
        std::string mime = "video/mp4";
        if (ext == "mkv") mime = "video/x-matroska";
        else if (ext == "webm") mime = "video/webm";
        else if (ext == "mp3") mime = "audio/mpeg";
        else if (ext == "avi") mime = "video/x-msvideo";

        int raw_fd = ::open(full.c_str(), O_RDONLY);
        if (raw_fd < 0) {
            res.status = 500;
            return;
        }

        auto fd_holder = std::shared_ptr<int>(new int(raw_fd), [](int* p) {
            if (p) {
                if (*p >= 0) ::close(*p);
                delete p;
            }
        });

        size_t file_size = std::filesystem::file_size(full);
        res.set_header("Accept-Ranges", "bytes");
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Headers", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");

        res.set_content_provider(
            file_size, mime,
            [fd_holder, &engine, hash, file_index](size_t offset, size_t length, httplib::DataSink &sink) -> bool {
                engine.prioritize_range(hash, file_index, static_cast<int64_t>(offset), static_cast<int64_t>(std::max<size_t>(length, 10 * 1024 * 1024)));
                int fd = *fd_holder;
                const size_t CHUNK_SIZE = 256 * 1024;
                std::vector<char> buffer(CHUNK_SIZE);
                size_t remaining = length;
                size_t current_offset = offset;

                while (remaining > 0 && sink.is_writable()) {
                    size_t to_read = std::min(remaining, CHUNK_SIZE);
                    ssize_t bytes_read = ::pread(fd, buffer.data(), to_read, current_offset);
                    if (bytes_read <= 0) break;

                    if (!sink.write(buffer.data(), static_cast<size_t>(bytes_read))) {
                        return false;
                    }
                    current_offset += bytes_read;
                    remaining -= bytes_read;
                }
                return true;
            }
        );
    });

    svr.Post(R"(/api/torrents/([^/]+)/files/(\d+)/(?:play|play_external))", [&engine](const httplib::Request& req, httplib::Response& res) {
        std::string hash = req.matches[1];
        int file_index = std::stoi(req.matches[2]);
        auto files = engine.get_torrent_files(hash);
        if (file_index >= 0 && file_index < static_cast<int>(files.size())) {
            std::string full = files[file_index].save_path + "/" + files[file_index].path;
            system(("open \"" + full + "\"").c_str());
        }
        res.set_content(R"({"status":"success"})", "application/json");
    });

    svr.Post(R"(/api/torrents/([^/]+)/pause)", [&engine](const httplib::Request& req, httplib::Response& res) {
        std::string info_hash = req.matches[1];
        engine.pause_torrent(info_hash);
        res.set_content(R"({"status":"paused"})", "application/json");
    });

    svr.Post(R"(/api/torrents/([^/]+)/resume)", [&engine](const httplib::Request& req, httplib::Response& res) {
        std::string info_hash = req.matches[1];
        engine.resume_torrent(info_hash);
        res.set_content(R"({"status":"resumed"})", "application/json");
    });

    svr.Post(R"(/api/torrents/([^/]+)/stop)", [&engine](const httplib::Request& req, httplib::Response& res) {
        std::string info_hash = req.matches[1];
        engine.stop_torrent(info_hash);
        res.set_content(R"({"status":"stopped"})", "application/json");
    });

    svr.Post("/api/torrents/stop_all", [&engine](const httplib::Request&, httplib::Response& res) {
        engine.stop_all_torrents();
        res.set_content(R"({"status":"all_stopped"})", "application/json");
    });

    svr.Post("/api/torrents/pause_all", [&engine](const httplib::Request&, httplib::Response& res) {
        engine.pause_all_torrents();
        res.set_content(R"({"status":"all_paused"})", "application/json");
    });

    svr.Post("/api/torrents/resume_all", [&engine](const httplib::Request&, httplib::Response& res) {
        engine.resume_all_torrents();
        res.set_content(R"({"status":"all_resumed"})", "application/json");
    });

    svr.Delete(R"(/api/torrents/([^/]+))", [&engine](const httplib::Request& req, httplib::Response& res) {
        std::string info_hash = req.matches[1];
        bool delete_files = false;
        if (req.has_param("delete_files")) {
            std::string del_str = req.get_param_value("delete_files");
            if (del_str == "true" || del_str == "1") {
                delete_files = true;
            }
        }
        engine.remove_torrent(info_hash, delete_files);
        {
            std::lock_guard<std::mutex> lock(known_names_mutex);
            known_names.erase(info_hash);
        }
        res.set_content(R"({"status":"removed"})", "application/json");
    });

    svr.Get(R"(/api/torrents/([^/]+)/files)", [&engine](const httplib::Request& req, httplib::Response& res) {
        std::string info_hash = req.matches[1];
        auto files = engine.get_torrent_files(info_hash);
        json response = json::array();
        for (const auto& f : files) {
            response.push_back({
                {"index", f.index},
                {"name", f.name},
                {"path", f.path},
                {"size", f.size},
                {"progress", f.progress},
                {"priority", f.priority},
                {"security_status", f.security_status},
                {"threat_name", f.threat_name},
                {"sha256", f.sha256},
                {"is_risky_type", f.is_risky_type},
                {"is_double_extension", f.is_double_extension},
                {"security_details", f.security_details}
            });
        }
        res.set_content(response.dump(), "application/json");
    });

    svr.Post(R"(/api/torrents/([^/]+)/files/(\d+)/scan)", [&engine](const httplib::Request& req, httplib::Response& res) {
        std::string info_hash = req.matches[1];
        int file_index = std::stoi(req.matches[2]);
        engine.scan_torrent_file_async(info_hash, file_index);
        res.set_content(R"({"status":"scanning"})", "application/json");
    });

    svr.Post(R"(/api/torrents/([^/]+)/files)", [&engine](const httplib::Request& req, httplib::Response& res) {
        std::string info_hash = req.matches[1];
        try {
            auto body = json::parse(req.body);
            std::vector<int> priorities;
            if (body.contains("priorities") && body["priorities"].is_array()) {
                for (const auto& p : body["priorities"]) {
                    priorities.push_back(p.get<int>());
                }
                engine.prioritize_files(info_hash, priorities);
            }
            res.set_content(R"({"status":"success"})", "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(json{{"status", "error"}, {"message", e.what()}}.dump(), "application/json");
        }
    });

    svr.Get(R"(/api/torrents/([^/]+)/peers)", [&engine](const httplib::Request& req, httplib::Response& res) {
        std::string info_hash = req.matches[1];
        auto peers = engine.get_peer_info(info_hash);
        json response = json::array();
        for (const auto& p : peers) {
            response.push_back({
                {"ip", p.ip},
                {"client", p.client},
                {"down_speed", p.down_speed},
                {"up_speed", p.up_speed},
                {"progress", p.progress},
                {"flags", p.flags},
                {"source", p.source},
                {"total_download", p.total_download},
                {"total_upload", p.total_upload}
            });
        }
        res.set_content(response.dump(), "application/json");
    });

    svr.Get(R"(/api/torrents/([^/]+)/trackers)", [&engine](const httplib::Request& req, httplib::Response& res) {
        std::string info_hash = req.matches[1];
        auto trackers = engine.get_trackers(info_hash);
        json response = json::array();
        for (const auto& t : trackers) {
            response.push_back({
                {"url", t.url},
                {"status", t.status},
                {"message", t.message},
                {"peers", t.num_peers},
                {"seeds", t.num_seeds},
                {"downloads", t.num_downloads}
            });
        }
        res.set_content(response.dump(), "application/json");
    });

    svr.Post(R"(/api/torrents/([^/]+)/reannounce)", [&engine](const httplib::Request& req, httplib::Response& res) {
        std::string info_hash = req.matches[1];
        try {
            engine.force_reannounce(info_hash);
            res.set_content(R"({"status":"success"})", "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(json{{"status", "error"}, {"message", e.what()}}.dump(), "application/json");
        }
    });

    svr.Post(R"(/api/torrents/([^/]+)/trackers)", [&engine](const httplib::Request& req, httplib::Response& res) {
        std::string info_hash = req.matches[1];
        try {
            auto body = json::parse(req.body);
            std::string tracker_url = body.value("url", "");
            if (tracker_url.empty()) throw std::runtime_error("Tracker URL cannot be empty");
            engine.add_tracker(info_hash, tracker_url);
            res.set_content(R"({"status":"success"})", "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(json{{"status", "error"}, {"message", e.what()}}.dump(), "application/json");
        }
    });

    svr.Post(R"(/api/torrents/([^/]+)/sequential)", [&engine](const httplib::Request& req, httplib::Response& res) {
        std::string info_hash = req.matches[1];
        try {
            auto body = json::parse(req.body);
            if (body.contains("sequential")) {
                engine.set_sequential_download(info_hash, body["sequential"].get<bool>());
            }
            res.set_content(R"({"status":"success"})", "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(json{{"status", "error"}, {"message", e.what()}}.dump(), "application/json");
        }
    });

    svr.Post(R"(/api/torrents/([^/]+)/open_folder)", [&engine](const httplib::Request& req, httplib::Response& res) {
        std::string info_hash = req.matches[1];
        try {
            auto state = engine.get_torrent_state(info_hash);
            std::string full_path = state.save_path + "/" + state.name;
            std::error_code of_ec;
            if (!std::filesystem::exists(full_path, of_ec) || of_ec) {
                full_path = state.save_path;
            }
            std::string cmd = "open -R \"" + full_path + "\"";
            system(cmd.c_str());
            res.set_content(R"({"status":"success"})", "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(json{{"status", "error"}, {"message", e.what()}}.dump(), "application/json");
        }
    });

    svr.Post(R"(/api/torrents/([^/]+)/files/(\d+)/play_external)", [&engine](const httplib::Request& req, httplib::Response& res) {
        std::string info_hash = req.matches[1];
        int file_index = std::stoi(req.matches[2]);
        try {
            auto files = engine.get_torrent_files(info_hash);
            if (file_index >= 0 && file_index < static_cast<int>(files.size())) {
                auto state = engine.get_torrent_state(info_hash);
                std::string full_path = state.save_path + "/" + files[file_index].path;
                std::string cmd = "open \"" + full_path + "\"";
                system(cmd.c_str());
                res.set_content(R"({"status":"success"})", "application/json");
            } else {
                throw std::runtime_error("Invalid file index");
            }
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(json{{"status", "error"}, {"message", e.what()}}.dump(), "application/json");
        }
    });

    // API: Local AI Media Scene Parser
    svr.Post("/api/ai/parse_media", [](const httplib::Request& req, httplib::Response& res) {
        try {
            auto body = json::parse(req.body);
            std::string title = body.value("title", "");
            if (title.empty()) {
                res.status = 400;
                res.set_content(R"({"status":"error","message":"'title' parameter is required"})", "application/json");
                return;
            }
            auto meta = torrent::MediaParser::parse(title);
            json resp = {
                {"status", "success"},
                {"metadata", meta.to_json()}
            };
            res.set_content(resp.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(json{{"status", "error"}, {"message", e.what()}}.dump(), "application/json");
        }
    });

    // API: Local AI Metadata Analysis for Specific Torrent & Files
    svr.Get(R"(/api/torrents/([^/]+)/media_ai)", [&engine](const httplib::Request& req, httplib::Response& res) {
        std::string info_hash = req.matches[1];
        try {
            auto state = engine.get_torrent_state(info_hash);
            auto files = engine.get_torrent_files(info_hash);
            json parsed_files = json::array();
            for (const auto& f : files) {
                auto meta = torrent::MediaParser::parse(f.name);
                parsed_files.push_back({
                    {"index", f.index},
                    {"original_name", f.name},
                    {"path", f.path},
                    {"metadata", meta.to_json()}
                });
            }
            auto torrent_meta = torrent::MediaParser::parse(state.name);
            json response = {
                {"status", "success"},
                {"torrent_metadata", torrent_meta.to_json()},
                {"files", parsed_files}
            };
            res.set_content(response.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 404;
            res.set_content(json{{"status", "error"}, {"message", e.what()}}.dump(), "application/json");
        }
    });
}
