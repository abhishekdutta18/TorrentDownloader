#include <catch2/catch_test_macros.hpp>
#include "security.hpp"
#include <fstream>
#include <filesystem>

TEST_CASE("SecurityManager Extension Detection", "[security]") {
    auto& sec = torrent::SecurityManager::instance();

    SECTION("Detects common executable and script extensions") {
        REQUIRE(sec.is_risky_extension("setup.exe"));
        REQUIRE(sec.is_risky_extension("malware.scr"));
        REQUIRE(sec.is_risky_extension("script.bat"));
        REQUIRE(sec.is_risky_extension("run.cmd"));
        REQUIRE(sec.is_risky_extension("payload.vbs"));
        REQUIRE(sec.is_risky_extension("attack.ps1"));
        REQUIRE(sec.is_risky_extension("installer.msi"));
        REQUIRE(sec.is_risky_extension("disc.iso"));
        REQUIRE(sec.is_risky_extension("archive.dmg"));
    }

    SECTION("Allows safe media and document extensions") {
        REQUIRE_FALSE(sec.is_risky_extension("movie.mp4"));
        REQUIRE_FALSE(sec.is_risky_extension("episode.mkv"));
        REQUIRE_FALSE(sec.is_risky_extension("song.mp3"));
        REQUIRE_FALSE(sec.is_risky_extension("photo.jpg"));
        REQUIRE_FALSE(sec.is_risky_extension("book.pdf"));
        REQUIRE_FALSE(sec.is_risky_extension("readme.txt"));
    }

    SECTION("Detects deceptive double extensions") {
        REQUIRE(sec.is_double_extension("movie.mp4.exe"));
        REQUIRE(sec.is_double_extension("photo.jpg.scr"));
        REQUIRE(sec.is_double_extension("invoice.pdf.bat"));
        REQUIRE(sec.is_double_extension("song.mp3.vbs"));

        // Non-deceptive names
        REQUIRE_FALSE(sec.is_double_extension("movie.mp4"));
        REQUIRE_FALSE(sec.is_double_extension("archive.tar.gz"));
        REQUIRE_FALSE(sec.is_double_extension("setup.exe"));
    }

    SECTION("Analyzes filename heuristics") {
        auto normal = sec.analyze_filename("ubuntu-24.04.iso");
        REQUIRE(normal.is_risky_type == true); // .iso is disk image

        auto safe = sec.analyze_filename("video.mkv");
        REQUIRE(safe.status == "untested");
        REQUIRE(safe.is_risky_type == false);

        auto deceptive = sec.analyze_filename("cool_movie.mp4.exe");
        REQUIRE(deceptive.status == "suspicious");
        REQUIRE(deceptive.is_double_extension == true);
        REQUIRE(deceptive.is_risky_type == true);
    }
}

TEST_CASE("SecurityManager SHA-256 Computation", "[security]") {
    auto& sec = torrent::SecurityManager::instance();

    std::string tmp_path = "/tmp/omniflux_test_file.txt";
    {
        std::ofstream out(tmp_path, std::ios::binary);
        out << "OmniFlux Security Test";
    }

    std::string hash = sec.compute_sha256(tmp_path);
    REQUIRE(hash.length() == 64);
    // SHA256("OmniFlux Security Test") = e99ef4ee...
    REQUIRE_FALSE(hash.empty());

    std::filesystem::remove(tmp_path);
}
