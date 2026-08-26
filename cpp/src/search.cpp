#include "search.hpp"
#include <httplib.h>
#include <nlohmann/json.hpp>
#include <iostream>
#include <iomanip>

namespace torrent {

SearchEngine::SearchEngine(Engine& engine) : engine_(engine) {}

void SearchEngine::add_jackett_instance(const std::string& url, const std::string& api_key) {
    std::string safe_url = url;
    if (!safe_url.empty() && safe_url.back() == '/') {
        safe_url.pop_back();
    }
    jackett_instances_.push_back({safe_url, api_key});
}

// Simple URL encoding helper
static std::string url_encode(const std::string& value) {
    std::ostringstream escaped;
    escaped.fill('0');
    escaped << std::hex;
    for (char c : value) {
        if (isalnum(c) || c == '-' || c == '_' || c == '.' || c == '~') {
            escaped << c;
        } else {
            escaped << std::uppercase;
            escaped << '%' << std::setw(2) << int((unsigned char)c);
            escaped << std::nouppercase;
        }
    }
    return escaped.str();
}

static const std::vector<std::string> default_trackers = {
    "udp://tracker.opentrackr.org:1337/announce",
    "udp://open.stealth.si:80/announce",
    "udp://tracker.torrent.eu.org:451/announce",
    "udp://tracker.bittor.pw:1337/announce",
    "udp://public.popcorn-tracker.org:6969/announce",
    "udp://tracker.dler.org:6969/announce",
    "udp://exodus.desync.com:6969/announce",
    "udp://open.demonii.com:1337/announce"
};

std::vector<SearchResult> SearchEngine::search(const std::string& query) {
    std::vector<SearchResult> results;
    
    if (jackett_instances_.empty()) {
        std::cout << "No Jackett instances configured, falling back to public APIBay search..." << std::endl;
        httplib::Client cli("https://apibay.org");
        cli.set_connection_timeout(5, 0);
        cli.set_read_timeout(15, 0);
        
        std::string path = "/q.php?q=" + url_encode(query);
        auto res = cli.Get(path.c_str());
        
        if (res && res->status == 200) {
            try {
                auto json_res = nlohmann::json::parse(res->body);
                for (const auto& item : json_res) {
                    if (item.value("name", "") == "No results returned") continue;
                    
                    SearchResult r;
                    r.name = item.value("name", "Unknown");
                    
                    std::string info_hash = item.value("info_hash", "");
                    if (info_hash.empty()) continue;
                    
                    std::string trackers;
                    for (const auto& tr : default_trackers) {
                        trackers += "&tr=" + url_encode(tr);
                    }
                    r.magnet_uri = "magnet:?xt=urn:btih:" + info_hash + "&dn=" + url_encode(r.name) + trackers;
                    
                    r.size_bytes = std::stoull(item.value("size", "0"));
                    r.seeders = std::stoi(item.value("seeders", "0"));
                    r.leechers = std::stoi(item.value("leechers", "0"));
                    r.source = "The Pirate Bay (Public)";
                    results.push_back(r);
                }
            } catch (const std::exception& e) {
                std::cerr << "Failed to parse APIBay JSON: " << e.what() << std::endl;
            }
        }
        return results;
    }

    // Round-robin load balancing
    size_t idx = current_instance_.fetch_add(1) % jackett_instances_.size();
    auto instance = jackett_instances_[idx];
    std::string jackett_url_ = instance.first;
    std::string jackett_api_key_ = instance.second;

    std::cout << "Querying Jackett node " << idx + 1 << "/" << jackett_instances_.size() << " (" << jackett_url_ << ")" << std::endl;

    httplib::Client cli(jackett_url_.c_str());
    cli.set_connection_timeout(10, 0);
    cli.set_read_timeout(60, 0); // 60 seconds because querying 90 sites takes time!
    
    std::string path = "/api/v2.0/indexers/all/results?apikey=" + jackett_api_key_ + "&Query=" + url_encode(query);
    
    auto res = cli.Get(path.c_str());
    if (!res || res->status != 200) {
        std::cerr << "Jackett request failed. HTTP Status: " << (res ? res->status : -1) << std::endl;
        return results;
    }
    
    try {
        auto json_res = nlohmann::json::parse(res->body);
        if (json_res.contains("Results")) {
            for (const auto& item : json_res["Results"]) {
                SearchResult r;
                r.name = item.value("Title", "Unknown");
                
                if (item.contains("MagnetUri") && item["MagnetUri"].is_string()) {
                    r.magnet_uri = item["MagnetUri"].get<std::string>();
                } else if (item.contains("Link") && item["Link"].is_string()) {
                    r.magnet_uri = item["Link"].get<std::string>();
                }
                
                if (r.magnet_uri.empty()) continue; 
                
                r.size_bytes = item.value("Size", 0ULL);
                r.seeders = item.value("Seeders", 0);
                r.leechers = item.value("Peers", 0) - r.seeders;
                if (r.leechers < 0) r.leechers = 0;
                
                r.source = "Jackett (" + item.value("Tracker", "Unknown") + ")";
                results.push_back(r);
            }
        }
    } catch (const std::exception& e) {
        std::cerr << "Failed to parse Jackett JSON: " << e.what() << std::endl;
    }
    
    return results;
}

} // namespace torrent
