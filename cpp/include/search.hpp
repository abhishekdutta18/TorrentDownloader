#pragma once
#include <string>
#include <vector>
#include "engine.hpp"

namespace torrent {

struct SearchResult {
    std::string name;
    std::string magnet_uri;
    uint64_t size_bytes;
    int seeders;
    int leechers;
    std::string source; // e.g. "DHT" or "Jackett"
};

class SearchEngine {
public:
    SearchEngine(Engine& engine);
    
    // Configure one or more Jackett instances for load-balancing
    void add_jackett_instance(const std::string& url, const std::string& api_key);
    
    // Core search function
    std::vector<SearchResult> search(const std::string& query);

private:
    Engine& engine_;
    std::vector<std::pair<std::string, std::string>> jackett_instances_;
    std::atomic<size_t> current_instance_{0};
};

} // namespace torrent
