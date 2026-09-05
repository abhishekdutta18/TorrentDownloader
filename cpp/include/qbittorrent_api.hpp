#pragma once

#include <httplib.h>
#include <string>
#include <vector>
#include <nlohmann/json.hpp>
#include "engine.hpp"

namespace torrent {

class QBittorrentApi {
public:
    static std::string to_qbittorrent_state(const TorrentState& state);
    static std::vector<std::string> parse_hashes_param(const std::string& hashes_str);
    static nlohmann::json format_torrent_info(const TorrentState& state, const std::string& category = "");
    static void set_torrent_category(const std::string& hash, const std::string& category);
    static std::string get_torrent_category(const std::string& hash);
    static std::unordered_map<std::string, std::string> get_all_categories();
    static void load_categories(const std::unordered_map<std::string, std::string>& categories);
    static void setup_routes(httplib::Server& svr, Engine& engine);
};

void setup_qbittorrent_routes(httplib::Server& svr, Engine& engine);

} // namespace torrent
