#include "qbittorrent_api.hpp"
#include <sstream>
#include <iostream>
#include <algorithm>
#include <filesystem>
#include <fstream>

using json = nlohmann::json;

namespace torrent {

std::string QBittorrentApi::to_qbittorrent_state(const TorrentState& state) {
    if (state.is_paused) {
        return state.is_finished ? "pausedUP" : "pausedDL";
    }
    if (state.is_finished) {
        return (state.upload_rate > 0) ? "uploading" : "stalledUP";
    }
    if (state.state == "checking_files" || state.state == "checking_resume_data") {
        return "checkingDL";
    }
    if (state.download_rate > 0) {
        return "downloading";
    }
    return "stalledDL";
}

std::vector<std::string> QBittorrentApi::parse_hashes_param(const std::string& hashes_str) {
    std::vector<std::string> hashes;
    if (hashes_str.empty()) return hashes;
    if (hashes_str == "all") return hashes;

    std::stringstream ss(hashes_str);
    std::string item;
    while (std::getline(ss, item, '|')) {
        // Trim whitespace
        while (!item.empty() && std::isspace(item.front())) item.erase(item.begin());
        while (!item.empty() && std::isspace(item.back())) item.pop_back();
        if (!item.empty()) {
            hashes.push_back(item);
        }
    }
    return hashes;
}

static std::unordered_map<std::string, std::string> s_torrent_categories;
static std::mutex s_category_mutex;

void QBittorrentApi::set_torrent_category(const std::string& hash, const std::string& category) {
    std::lock_guard<std::mutex> lock(s_category_mutex);
    if (category.empty()) {
        s_torrent_categories.erase(hash);
    } else {
        s_torrent_categories[hash] = category;
    }
}

std::string QBittorrentApi::get_torrent_category(const std::string& hash) {
    std::lock_guard<std::mutex> lock(s_category_mutex);
    auto it = s_torrent_categories.find(hash);
    return (it != s_torrent_categories.end()) ? it->second : "";
}

std::unordered_map<std::string, std::string> QBittorrentApi::get_all_categories() {
    std::lock_guard<std::mutex> lock(s_category_mutex);
    return s_torrent_categories;
}

void QBittorrentApi::load_categories(const std::unordered_map<std::string, std::string>& categories) {
    std::lock_guard<std::mutex> lock(s_category_mutex);
    s_torrent_categories = categories;
}

json QBittorrentApi::format_torrent_info(const TorrentState& state, const std::string& category) {
    int64_t amount_left = std::max<int64_t>(0, state.total_wanted - state.total_done);
    double ratio = state.total_done > 0 ? static_cast<double>(state.total_upload) / state.total_done : 0.0;

    return {
        {"added_on", 1700000000},
        {"amount_left", amount_left},
        {"auto_tmm", false},
        {"category", category},
        {"completed", state.total_done},
        {"completion_on", state.is_finished ? 1700001000 : -1},
        {"dlspeed", state.download_rate},
        {"downloaded", state.total_done},
        {"downloaded_session", state.total_done},
        {"eta", state.eta_seconds},
        {"f_l_piece_prio", false},
        {"force_start", false},
        {"hash", state.info_hash},
        {"infohash_v1", state.info_hash},
        {"infohash_v2", ""},
        {"last_activity", 1700000000},
        {"magnet_uri", state.magnet_uri},
        {"max_ratio", -1},
        {"max_seeding_time", -1},
        {"name", state.name.empty() ? "Fetching Metadata..." : state.name},
        {"num_complete", state.num_seeds},
        {"num_incomplete", state.num_peers},
        {"num_leechs", state.num_peers},
        {"num_seeds", state.num_seeds},
        {"priority", 0},
        {"progress", state.progress},
        {"ratio", ratio},
        {"ratio_limit", -2},
        {"save_path", state.save_path},
        {"seeding_time", 0},
        {"seeding_time_limit", -2},
        {"seen_complete", -1},
        {"seq_dl", false},
        {"size", state.total_wanted},
        {"state", to_qbittorrent_state(state)},
        {"super_seeding", false},
        {"tags", ""},
        {"time_active", 0},
        {"total_size", state.total_wanted},
        {"tracker", ""},
        {"up_limit", -1},
        {"uploaded", state.total_upload},
        {"uploaded_session", state.total_upload},
        {"upspeed", state.upload_rate}
    };
}

void QBittorrentApi::setup_routes(httplib::Server& svr, Engine& engine) {
    // 1. Application info & version
    svr.Get("/api/v2/app/version", [](const httplib::Request&, httplib::Response& res) {
        res.set_content("v4.6.5", "text/plain");
    });

    svr.Get("/api/v2/app/webapiVersion", [](const httplib::Request&, httplib::Response& res) {
        res.set_content("2.9.3", "text/plain");
    });

    // 2. Authentication
    svr.Post("/api/v2/auth/login", [](const httplib::Request&, httplib::Response& res) {
        res.set_header("Set-Cookie", "SID=omniflux-local-session; HttpOnly; path=/; SameSite=Lax");
        res.set_content("Ok.", "text/plain");
    });

    svr.Post("/api/v2/auth/logout", [](const httplib::Request&, httplib::Response& res) {
        res.set_header("Set-Cookie", "SID=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/");
        res.set_content("Ok.", "text/plain");
    });

    // 3. Global transfer info
    svr.Get("/api/v2/transfer/info", [&engine](const httplib::Request&, httplib::Response& res) {
        auto stats = engine.get_session_stats();
        json j = {
            {"connection_status", "connected"},
            {"dht_nodes", stats.dht_nodes},
            {"dl_info_data", stats.total_download},
            {"dl_info_speed", stats.download_rate},
            {"up_info_data", stats.total_upload},
            {"up_info_speed", stats.upload_rate},
            {"dl_rate_limit", engine.get_download_limit() * 1024},
            {"up_rate_limit", engine.get_upload_limit() * 1024}
        };
        res.set_content(j.dump(), "application/json");
    });

    // 4. Torrents info list (Sonarr / Radarr polling)
    svr.Get("/api/v2/torrents/info", [&engine](const httplib::Request& req, httplib::Response& res) {
        std::string filter = req.has_param("filter") ? req.get_param_value("filter") : "all";
        std::string hashes_param = req.has_param("hashes") ? req.get_param_value("hashes") : "";
        std::string category = req.has_param("category") ? req.get_param_value("category") : "";

        auto target_hashes = parse_hashes_param(hashes_param);
        json torrents_array = json::array();

        for (const auto& st : engine.get_all_torrent_states()) {
            if (!target_hashes.empty()) {
                bool found = false;
                for (const auto& h : target_hashes) {
                    if (st.info_hash == h) {
                        found = true;
                        break;
                    }
                }
                if (!found) continue;
            }

            std::string qb_state = to_qbittorrent_state(st);

            if (filter == "downloading" && qb_state != "downloading") continue;
            if (filter == "completed" && !st.is_finished) continue;
            if (filter == "paused" && !st.is_paused) continue;
            if (filter == "active" && st.download_rate == 0 && st.upload_rate == 0) continue;
            if (filter == "inactive" && (st.download_rate > 0 || st.upload_rate > 0)) continue;

            std::string cat = get_torrent_category(st.info_hash);
            if (!category.empty() && cat != category) continue;

            torrents_array.push_back(format_torrent_info(st, cat));
        }

        res.set_content(torrents_array.dump(), "application/json");
    });

    // 5. Add torrent(s)
    svr.Post("/api/v2/torrents/add", [&engine](const httplib::Request& req, httplib::Response& res) {
        try {
            std::string urls;
            std::string save_path;
            std::string category;
            bool paused = false;

            if (req.has_param("urls")) urls = req.get_param_value("urls");
            if (req.has_param("savepath")) save_path = req.get_param_value("savepath");
            if (req.has_param("category")) category = req.get_param_value("category");
            if (req.has_param("paused")) {
                std::string p = req.get_param_value("paused");
                paused = (p == "true" || p == "1");
            }

            const char* home_env = getenv("HOME");
            std::string default_base = home_env ? std::string(home_env) + "/Downloads" : "/tmp";
            if (save_path.empty()) {
                save_path = default_base;
                if (!category.empty()) {
                    save_path += "/" + category;
                }
            }

            // A. Handle URL/Magnet links
            if (!urls.empty()) {
                std::stringstream ss(urls);
                std::string line;
                while (std::getline(ss, line)) {
                    // Trim line
                    while (!line.empty() && (line.front() == ' ' || line.front() == '\r')) line.erase(line.begin());
                    while (!line.empty() && (line.back() == ' ' || line.back() == '\r')) line.pop_back();
                    if (line.empty()) continue;

                    std::string hash = engine.add_magnet_link(line, save_path);
                    if (!category.empty()) {
                        set_torrent_category(hash, category);
                    }
                    if (paused) {
                        engine.pause_torrent(hash);
                    }
                }
            }

            // B. Handle multipart uploaded .torrent file
            if (req.has_file("torrents")) {
                auto f = req.get_file_value("torrents");
                if (!f.content.empty()) {
                    std::string temp_path = std::filesystem::temp_directory_path().string() + "/qb_upload_" + std::to_string(time(nullptr)) + ".torrent";
                    std::ofstream out(temp_path, std::ios::binary);
                    out.write(f.content.data(), f.content.size());
                    out.close();

                    try {
                        std::string hash = engine.add_torrent_file(temp_path, save_path);
                        if (!category.empty()) {
                            set_torrent_category(hash, category);
                        }
                        if (paused) {
                            engine.pause_torrent(hash);
                        }
                    } catch (...) {}
                    std::filesystem::remove(temp_path);
                }
            }

            res.set_content("Ok.", "text/plain");
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(e.what(), "text/plain");
        }
    });

    // 6. Set category for torrents
    svr.Post("/api/v2/torrents/setCategory", [](const httplib::Request& req, httplib::Response& res) {
        std::string hashes_param = req.has_param("hashes") ? req.get_param_value("hashes") : "";
        std::string category = req.has_param("category") ? req.get_param_value("category") : "";
        auto hashes = parse_hashes_param(hashes_param);
        for (const auto& h : hashes) {
            set_torrent_category(h, category);
        }
        res.status = 200;
        res.set_content("", "text/plain");
    });

    // 6. Pause torrents
    svr.Post("/api/v2/torrents/pause", [&engine](const httplib::Request& req, httplib::Response& res) {
        std::string hashes_param = req.has_param("hashes") ? req.get_param_value("hashes") : "";
        if (hashes_param == "all") {
            engine.pause_all_torrents();
        } else {
            for (const auto& h : parse_hashes_param(hashes_param)) {
                engine.pause_torrent(h);
            }
        }
        res.set_content("Ok.", "text/plain");
    });

    // 7. Resume torrents
    svr.Post("/api/v2/torrents/resume", [&engine](const httplib::Request& req, httplib::Response& res) {
        std::string hashes_param = req.has_param("hashes") ? req.get_param_value("hashes") : "";
        if (hashes_param == "all") {
            engine.resume_all_torrents();
        } else {
            for (const auto& h : parse_hashes_param(hashes_param)) {
                engine.resume_torrent(h);
            }
        }
        res.set_content("Ok.", "text/plain");
    });

    // 8. Delete torrents
    svr.Post("/api/v2/torrents/delete", [&engine](const httplib::Request& req, httplib::Response& res) {
        std::string hashes_param = req.has_param("hashes") ? req.get_param_value("hashes") : "";
        bool delete_files = false;
        if (req.has_param("deleteFiles")) {
            std::string df = req.get_param_value("deleteFiles");
            delete_files = (df == "true" || df == "1");
        }

        for (const auto& h : parse_hashes_param(hashes_param)) {
            engine.remove_torrent(h, delete_files);
        }
        res.set_content("Ok.", "text/plain");
    });

    // 9. Files list for a torrent
    svr.Get("/api/v2/torrents/files", [&engine](const httplib::Request& req, httplib::Response& res) {
        std::string hash = req.has_param("hash") ? req.get_param_value("hash") : "";
        if (hash.empty()) {
            res.status = 400;
            res.set_content("[]", "application/json");
            return;
        }

        try {
            auto files = engine.get_torrent_files(hash);
            json file_list = json::array();
            for (const auto& f : files) {
                file_list.push_back({
                    {"index", f.index},
                    {"name", f.name},
                    {"size", f.size},
                    {"progress", f.progress},
                    {"priority", f.priority},
                    {"is_seed", f.progress >= 1.0f}
                });
            }
            res.set_content(file_list.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 404;
            res.set_content("[]", "application/json");
        }
    });

    // 10. Trackers list for a torrent
    svr.Get("/api/v2/torrents/trackers", [&engine](const httplib::Request& req, httplib::Response& res) {
        std::string hash = req.has_param("hash") ? req.get_param_value("hash") : "";
        if (hash.empty()) {
            res.status = 400;
            res.set_content("[]", "application/json");
            return;
        }

        try {
            auto trackers = engine.get_trackers(hash);
            json tracker_list = json::array();
            for (const auto& t : trackers) {
                tracker_list.push_back({
                    {"url", t.url},
                    {"status", t.status},
                    {"num_peers", t.num_peers},
                    {"num_seeds", t.num_seeds},
                    {"num_downloaded", t.num_downloads},
                    {"msg", t.message}
                });
            }
            res.set_content(tracker_list.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 404;
            res.set_content("[]", "application/json");
        }
    });
}

void setup_qbittorrent_routes(httplib::Server& svr, Engine& engine) {
    QBittorrentApi::setup_routes(svr, engine);
}

} // namespace torrent
