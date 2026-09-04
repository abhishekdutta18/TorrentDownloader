#include <catch2/catch_test_macros.hpp>
#include "qbittorrent_api.hpp"

TEST_CASE("QBittorrentApi State Translation", "[qbittorrent]") {
    SECTION("Paused States") {
        torrent::TorrentState s1;
        s1.is_paused = true;
        s1.is_finished = false;
        REQUIRE(torrent::QBittorrentApi::to_qbittorrent_state(s1) == "pausedDL");

        torrent::TorrentState s2;
        s2.is_paused = true;
        s2.is_finished = true;
        REQUIRE(torrent::QBittorrentApi::to_qbittorrent_state(s2) == "pausedUP");
    }

    SECTION("Active Download & Seeding States") {
        torrent::TorrentState s1;
        s1.is_paused = false;
        s1.is_finished = false;
        s1.download_rate = 1048576;
        REQUIRE(torrent::QBittorrentApi::to_qbittorrent_state(s1) == "downloading");

        torrent::TorrentState s2;
        s2.is_paused = false;
        s2.is_finished = false;
        s2.download_rate = 0;
        REQUIRE(torrent::QBittorrentApi::to_qbittorrent_state(s2) == "stalledDL");

        torrent::TorrentState s3;
        s3.is_paused = false;
        s3.is_finished = true;
        s3.upload_rate = 524288;
        REQUIRE(torrent::QBittorrentApi::to_qbittorrent_state(s3) == "uploading");

        torrent::TorrentState s4;
        s4.is_paused = false;
        s4.is_finished = true;
        s4.upload_rate = 0;
        REQUIRE(torrent::QBittorrentApi::to_qbittorrent_state(s4) == "stalledUP");
    }

    SECTION("Checking States") {
        torrent::TorrentState s;
        s.state = "checking_files";
        REQUIRE(torrent::QBittorrentApi::to_qbittorrent_state(s) == "checkingDL");
    }
}

TEST_CASE("QBittorrentApi Parameter Parsing", "[qbittorrent]") {
    SECTION("Parses pipe-delimited hashes") {
        std::string input = "aabbcc|ddeeff|112233";
        auto hashes = torrent::QBittorrentApi::parse_hashes_param(input);
        REQUIRE(hashes.size() == 3);
        REQUIRE(hashes[0] == "aabbcc");
        REQUIRE(hashes[1] == "ddeeff");
        REQUIRE(hashes[2] == "112233");
    }

    SECTION("Trims whitespace from hashes") {
        std::string input = "  aabbcc |  ddeeff  ";
        auto hashes = torrent::QBittorrentApi::parse_hashes_param(input);
        REQUIRE(hashes.size() == 2);
        REQUIRE(hashes[0] == "aabbcc");
        REQUIRE(hashes[1] == "ddeeff");
    }

    SECTION("Handles empty or 'all' keyword") {
        REQUIRE(torrent::QBittorrentApi::parse_hashes_param("").empty());
        REQUIRE(torrent::QBittorrentApi::parse_hashes_param("all").empty());
    }
}

TEST_CASE("QBittorrentApi Torrent Info Formatting", "[qbittorrent]") {
    torrent::TorrentState s;
    s.info_hash = "dd8255ecdc7ca55fb0bbf81323d87062db1f6d1c";
    s.name = "Big Buck Bunny";
    s.progress = 0.75f;
    s.total_wanted = 1000;
    s.total_done = 750;
    s.download_rate = 250000;
    s.upload_rate = 50000;

    auto formatted = torrent::QBittorrentApi::format_torrent_info(s, "tv-sonarr");

    REQUIRE(formatted["hash"] == "dd8255ecdc7ca55fb0bbf81323d87062db1f6d1c");
    REQUIRE(formatted["name"] == "Big Buck Bunny");
    REQUIRE(formatted["category"] == "tv-sonarr");
    REQUIRE(formatted["amount_left"] == 250);
    REQUIRE(formatted["completed"] == 750);
    REQUIRE(formatted["dlspeed"] == 250000);
    REQUIRE(formatted["state"] == "downloading");
}
