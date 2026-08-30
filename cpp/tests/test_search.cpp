#include <catch2/catch_test_macros.hpp>
#include "search.hpp"

TEST_CASE("SearchEngine Empty Query", "[search]") {
    torrent::SearchEngine search;
    auto results = search.search("");
    REQUIRE(results.empty());
}

TEST_CASE("SearchEngine Fallback Graceful Handling", "[search]") {
    torrent::SearchEngine search;

    // Dummy Jackett instance should fail gracefully and fall back to APIBay
    search.add_jackett_instance("http://127.0.0.1:1", "dummy_api_key");
    
    auto results = search.search("nonexistent_torrent_query_abcdef_123456789");
    REQUIRE(results.empty());
}

TEST_CASE("SearchEngine Result Validation", "[search]") {
    torrent::SearchEngine search;

    // Search for a well-known query
    auto results = search.search("ubuntu");
    for (const auto& r : results) {
        REQUIRE(!r.name.empty());
        REQUIRE(!r.magnet_uri.empty());
        REQUIRE(r.magnet_uri.rfind("magnet:?xt=urn:btih:", 0) == 0);
        REQUIRE(!r.info_hash.empty());
    }
}

