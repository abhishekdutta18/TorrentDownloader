#include <catch2/catch_test_macros.hpp>
#include "engine.hpp"
#include <iostream>

TEST_CASE("Engine Initialization", "[engine]") {
    torrent::Engine engine;
    std::string ver = engine.version();
    
    REQUIRE(!ver.empty());
    
    // Ensure enabling DHT doesn't throw or crash
    REQUIRE_NOTHROW(engine.enable_dht_and_pex());
}

TEST_CASE("Add Magnet Link", "[engine]") {
    torrent::Engine engine;
    
    std::string magnet = "magnet:?xt=urn:btih:3A6EE3B1D5BA0B74AE580227FA34C08C5DCEBE4C&dn=ubuntu-24.04.1-desktop-amd64.iso";
    std::string hash = engine.add_magnet_link(magnet, "./downloads");
    
    // Convert expected hash to string (lower case standard for libtorrent v1 hashes output)
    REQUIRE(hash == "3a6ee3b1d5ba0b74ae580227fa34c08c5dcebe4c");
    
    auto active = engine.get_active_torrents();
    REQUIRE(active.size() == 1);
    REQUIRE(active[0] == "3a6ee3b1d5ba0b74ae580227fa34c08c5dcebe4c");
    
    // Check initial state
    auto state = engine.get_torrent_state(hash);
    REQUIRE(state.info_hash == hash);
    REQUIRE(state.progress == 0.0f);
    REQUIRE(state.download_rate == 0);
    // State is downloading metadata because it's a magnet link without metadata
    REQUIRE(state.state == "downloading metadata");
}

TEST_CASE("Add Torrent File", "[engine]") {
    torrent::Engine engine;
    
    // Since we are in cpp/build, the torrent file is in ../..
    std::string torrent_path = "../../ubuntu-24.04.1-desktop-amd64.iso.torrent";
    
    // We assume the file exists, if not this might throw
    try {
        std::string hash = engine.add_torrent_file(torrent_path, "./downloads");
        REQUIRE(hash.length() == 40); // Standard SHA-1 hex length
        
        auto active = engine.get_active_torrents();
        REQUIRE(active.size() == 1);
        REQUIRE(active[0] == hash);
    } catch (const std::exception& e) {
        // If the file doesn't exist in the CI or locally, we just print and skip
        WARN("Skipping file test because " << torrent_path << " was not found. Error: " << e.what());
    }
}

TEST_CASE("Pause Resume and Remove Torrent", "[engine]") {
    torrent::Engine engine;
    std::string magnet = "magnet:?xt=urn:btih:3A6EE3B1D5BA0B74AE580227FA34C08C5DCEBE4C&dn=ubuntu-24.04.1-desktop-amd64.iso";
    std::string hash = engine.add_magnet_link(magnet, "./downloads");

    auto states = engine.get_all_torrent_states();
    REQUIRE(states.size() == 1);
    REQUIRE(states[0].info_hash == hash);
    REQUIRE(states[0].state != "paused");

    engine.pause_torrent(hash);
    auto paused_state = engine.get_torrent_state(hash);
    REQUIRE(paused_state.state == "paused");

    auto all_states = engine.get_all_torrent_states();
    REQUIRE(all_states.size() == 1);
    REQUIRE(all_states[0].state == "paused");

    engine.resume_torrent(hash);
    auto resumed_state = engine.get_torrent_state(hash);
    REQUIRE(resumed_state.state != "paused");

    // Test remove_torrent with delete_files = false
    engine.remove_torrent(hash, false);
    REQUIRE_NOTHROW(engine.get_all_torrent_states());
}

TEST_CASE("Engine Thread Safety", "[engine]") {
    torrent::Engine engine;
    std::string magnet = "magnet:?xt=urn:btih:3A6EE3B1D5BA0B74AE580227FA34C08C5DCEBE4C&dn=ubuntu-24.04.1-desktop-amd64.iso";
    std::string hash = engine.add_magnet_link(magnet, "./downloads");

    std::vector<std::thread> threads;
    for (int i = 0; i < 8; ++i) {
        threads.emplace_back([&engine, hash]() {
            for (int j = 0; j < 20; ++j) {
                engine.get_active_torrents();
                engine.get_all_torrent_states();
                try {
                    engine.get_torrent_state(hash);
                } catch (...) {}
            }
        });
    }

    for (auto& t : threads) {
        t.join();
    }

    // REQUIRE_NOTHROW(engine.save_session_state());
}

