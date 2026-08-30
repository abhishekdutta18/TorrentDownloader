#pragma once
#include <string>
#include <vector>
#include "engine.hpp"

namespace torrent {

struct SearchResult {
    std::string name;
    std::string info_hash;
    std::string magnet_uri;
    uint64_t size_bytes{0};
    int seeders{0};
    int leechers{0};
    std::string source; // e.g. "The Pirate Bay (Public)" or "Jackett"
};

class SearchEngine {
public:
    SearchEngine();
    explicit SearchEngine(Engine& engine);
    
    // Configure one or more Jackett instances for load-balancing
    void add_jackett_instance(const std::string& url, const std::string& api_key);
    
    // Core search function
    std::vector<SearchResult> search(const std::string& query);

private:
    Engine* engine_{nullptr};
    std::vector<std::pair<std::string, std::string>> jackett_instances_;
    std::atomic<size_t> current_instance_{0};
};

} // namespace torrent
