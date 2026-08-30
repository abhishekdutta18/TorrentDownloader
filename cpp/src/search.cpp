#include "search.hpp"
#include <httplib.h>
#include <nlohmann/json.hpp>
#include <iostream>
#include <iomanip>
#include <algorithm>
#include <cctype>

namespace torrent {

SearchEngine::SearchEngine() : engine_(nullptr) {}
SearchEngine::SearchEngine(Engine& engine) : engine_(&engine) {}

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

static uint64_t safe_stoull(const std::string& s, uint64_t default_val = 0ULL) {
    try {
        if (s.empty()) return default_val;
        return std::stoull(s);
    } catch (...) {
        return default_val;
    }
}

static int safe_stoi(const std::string& s, int default_val = 0) {
    try {
        if (s.empty()) return default_val;
        return std::stoi(s);
    } catch (...) {
        return default_val;
    }
}

static std::string extract_info_hash(const std::string& magnet) {
    const std::string needle = "xt=urn:btih:";
    size_t pos = magnet.find(needle);
    if (pos == std::string::npos) return "";
    size_t start = pos + needle.length();
    size_t end = magnet.find('&', start);
    std::string hash = (end == std::string::npos) ? magnet.substr(start) : magnet.substr(start, end - start);
    std::transform(hash.begin(), hash.end(), hash.begin(), ::tolower);
    return hash;
}

static const std::vector<std::string> default_trackers = {
    "udp://tracker.opentrackr.org:1337/announce",
    "udp://open.stealth.si:80/announce",
    "udp://tracker.torrent.eu.org:451/announce",
    "udp://tracker.bittor.pw:1337/announce",
    "udp://public.popcorn-tracker.org:6969/announce",
    "udp://tracker.dler.org:6969/announce",
    "udp://exodus.desync.com:6969/announce",
    "udp://open.demonii.com:1337/announce",
    "udp://tracker.coppersurfer.tk:6969/announce",
    "udp://p4p.arenabg.com:1337/announce"
};

static std::vector<SearchResult> search_apibay(const std::string& query) {
    std::vector<SearchResult> results;
    try {
        std::cout << "[Search] Querying APIBay for: " << query << std::endl;
        httplib::Client cli("https://apibay.org");
        cli.set_connection_timeout(5, 0);
        cli.set_read_timeout(10, 0);

        httplib::Headers headers = {
            {"User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"},
            {"Accept", "application/json, text/plain, */*"}
        };

        std::string path = "/q.php?q=" + url_encode(query) + "&_=" + std::to_string(time(nullptr));
        auto res = cli.Get(path.c_str(), headers);

        if (res && res->status == 200) {
            auto json_res = nlohmann::json::parse(res->body);
            if (!json_res.is_array()) return results;

            for (const auto& item : json_res) {
                std::string name = item.value("name", "");
                if (name == "No results returned" || name.empty()) continue;

                std::string info_hash = item.value("info_hash", "");
                if (info_hash.empty() || info_hash == "0000000000000000000000000000000000000000") continue;

                std::transform(info_hash.begin(), info_hash.end(), info_hash.begin(), ::tolower);

                std::string trackers;
                for (const auto& tr : default_trackers) {
                    trackers += "&tr=" + url_encode(tr);
                }

                SearchResult r;
                r.name = name;
                r.info_hash = info_hash;
                r.magnet_uri = "magnet:?xt=urn:btih:" + info_hash + "&dn=" + url_encode(r.name) + trackers;
                r.size_bytes = safe_stoull(item.value("size", "0"));
                r.seeders = safe_stoi(item.value("seeders", "0"));
                r.leechers = safe_stoi(item.value("leechers", "0"));
                r.source = "The Pirate Bay";
                results.push_back(r);
            }
        } else {
            std::cerr << "[Search] APIBay query failed, status: " << (res ? std::to_string(res->status) : "connection error") << std::endl;
        }
    } catch (const std::exception& e) {
        std::cerr << "[Search] APIBay parsing error: " << e.what() << std::endl;
    }
    return results;
}

std::vector<SearchResult> SearchEngine::search(const std::string& query) {
    if (query.empty()) return {};

    std::vector<SearchResult> results;

    // 1. Try Jackett if configured
    if (!jackett_instances_.empty()) {
        size_t idx = current_instance_.fetch_add(1) % jackett_instances_.size();
        auto instance = jackett_instances_[idx];
        std::string jackett_url_ = instance.first;
        std::string jackett_api_key_ = instance.second;

        std::cout << "[Search] Querying Jackett node " << idx + 1 << "/" << jackett_instances_.size() << " (" << jackett_url_ << ")" << std::endl;

        try {
            httplib::Client cli(jackett_url_.c_str());
            cli.set_connection_timeout(5, 0);
            cli.set_read_timeout(15, 0);

            std::string path = "/api/v2.0/indexers/all/results?apikey=" + jackett_api_key_ + "&Query=" + url_encode(query);
            auto res = cli.Get(path.c_str());
            if (res && res->status == 200) {
                auto json_res = nlohmann::json::parse(res->body);
                if (json_res.contains("Results") && json_res["Results"].is_array()) {
                    for (const auto& item : json_res["Results"]) {
                        SearchResult r;
                        r.name = item.value("Title", "Unknown");

                        if (item.contains("MagnetUri") && item["MagnetUri"].is_string()) {
                            r.magnet_uri = item["MagnetUri"].get<std::string>();
                        } else if (item.contains("Link") && item["Link"].is_string()) {
                            r.magnet_uri = item["Link"].get<std::string>();
                        }

                        if (r.magnet_uri.empty()) continue;
                        r.info_hash = extract_info_hash(r.magnet_uri);

                        if (item.contains("Size") && item["Size"].is_number()) {
                            r.size_bytes = item["Size"].get<uint64_t>();
                        }
                        if (item.contains("Seeders") && item["Seeders"].is_number()) {
                            r.seeders = item["Seeders"].get<int>();
                        }
                        int peers = item.contains("Peers") && item["Peers"].is_number() ? item["Peers"].get<int>() : 0;
                        r.leechers = std::max(0, peers - r.seeders);
                        r.source = "Jackett (" + item.value("Tracker", "Unknown") + ")";
                        results.push_back(r);
                    }
                }
            } else {
                std::cerr << "[Search] Jackett request failed. HTTP Status: " << (res ? std::to_string(res->status) : "connection error") << std::endl;
            }
        } catch (const std::exception& e) {
            std::cerr << "[Search] Jackett query error: " << e.what() << std::endl;
        }

        // If Jackett produced results, return them
        if (!results.empty()) {
            return results;
        }
        std::cout << "[Search] Jackett produced no results, falling back to public APIBay search..." << std::endl;
    }

    // 2. Fallback to APIBay
    return search_apibay(query);
}

} // namespace torrent
