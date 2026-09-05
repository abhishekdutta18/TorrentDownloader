#include <catch2/catch_test_macros.hpp>
#include "subtitles.hpp"
#include <fstream>
#include <filesystem>

namespace fs = std::filesystem;

TEST_CASE("SubtitleEngine: SRT to WebVTT conversion", "[subtitles]") {
    SECTION("Standard SRT conversion") {
        std::string srt = 
            "1\n"
            "00:01:20,000 --> 00:01:23,456\n"
            "Hello, world!\n"
            "\n"
            "2\n"
            "00:01:24,100 --> 00:01:27,890\n"
            "Second subtitle line.\n";

        std::string vtt = torrent::SubtitleEngine::srt_to_webvtt(srt);
        
        REQUIRE(vtt.find("WEBVTT") == 0);
        REQUIRE(vtt.find("00:01:20.000 --> 00:01:23.456") != std::string::npos);
        REQUIRE(vtt.find("00:01:24.100 --> 00:01:27.890") != std::string::npos);
        REQUIRE(vtt.find("Hello, world!") != std::string::npos);
        REQUIRE(vtt.find("Second subtitle line.") != std::string::npos);
    }

    SECTION("SRT with UTF-8 BOM") {
        std::string bom = "\xEF\xBB\xBF";
        std::string srt = bom + 
            "1\n"
            "00:00:05,500 --> 00:00:08,200\n"
            "Testing BOM removal\n";

        std::string vtt = torrent::SubtitleEngine::srt_to_webvtt(srt);
        REQUIRE(vtt.find("WEBVTT") == 0);
        REQUIRE(vtt.find("00:00:05.500 --> 00:00:08.200") != std::string::npos);
        REQUIRE(vtt.find("Testing BOM removal") != std::string::npos);
    }

    SECTION("Windows CRLF line endings") {
        std::string srt = 
            "1\r\n"
            "00:02:10,000 --> 00:02:15,000\r\n"
            "Line 1\r\n"
            "Line 2\r\n";

        std::string vtt = torrent::SubtitleEngine::srt_to_webvtt(srt);
        REQUIRE(vtt.find("WEBVTT") == 0);
        REQUIRE(vtt.find("00:02:10.000 --> 00:02:15.000") != std::string::npos);
        REQUIRE(vtt.find("Line 1\nLine 2") != std::string::npos);
    }
}

TEST_CASE("SubtitleEngine: Language detection", "[subtitles]") {
    REQUIRE(torrent::SubtitleEngine::detect_language_from_path("Interstellar.2014.en.srt") == "en");
    REQUIRE(torrent::SubtitleEngine::detect_language_from_path("Interstellar.2014.eng.srt") == "en");
    REQUIRE(torrent::SubtitleEngine::detect_language_from_path("Avatar.es.srt") == "es");
    REQUIRE(torrent::SubtitleEngine::detect_language_from_path("Avatar.spanish.vtt") == "es");
    REQUIRE(torrent::SubtitleEngine::detect_language_from_path("Amelie.fr.srt") == "fr");
    REQUIRE(torrent::SubtitleEngine::detect_language_from_path("Dark.de.srt") == "de");
    REQUIRE(torrent::SubtitleEngine::detect_language_from_path("Unknown.srt") == "en");
}

TEST_CASE("SubtitleEngine: MovieHash Calculation", "[subtitles]") {
    SECTION("Non-existent file returns empty") {
        REQUIRE(torrent::SubtitleEngine::compute_movie_hash("/non/existent/video.mkv") == "");
    }

    SECTION("File smaller than 128KB returns empty") {
        fs::path tmp_small = fs::temp_directory_path() / "test_small_video.mkv";
        std::ofstream out(tmp_small, std::ios::binary);
        std::string data(1000, 'A');
        out.write(data.data(), data.size());
        out.close();

        REQUIRE(torrent::SubtitleEngine::compute_movie_hash(tmp_small.string()) == "");
        fs::remove(tmp_small);
    }

    SECTION("File >= 128KB produces 16-char hex hash") {
        fs::path tmp_large = fs::temp_directory_path() / "test_large_video.mkv";
        std::ofstream out(tmp_large, std::ios::binary);
        // Write 150KB
        std::vector<char> dummy(150 * 1024, 0x42);
        out.write(dummy.data(), dummy.size());
        out.close();

        std::string hash = torrent::SubtitleEngine::compute_movie_hash(tmp_large.string());
        REQUIRE(hash.length() == 16);

        // Deterministic check: recalculating returns same hash
        std::string hash2 = torrent::SubtitleEngine::compute_movie_hash(tmp_large.string());
        REQUIRE(hash == hash2);

        fs::remove(tmp_large);
    }
}

TEST_CASE("SubtitleEngine: Local Subtitle Discovery", "[subtitles]") {
    fs::path temp_dir = fs::temp_directory_path() / "omniflux_sub_test";
    fs::create_directories(temp_dir);

    fs::path video_path = temp_dir / "Movie.2024.1080p.mkv";
    std::ofstream(video_path).close();

    fs::path srt1 = temp_dir / "Movie.2024.1080p.en.srt";
    std::ofstream(srt1).close();

    fs::path srt2 = temp_dir / "Movie.2024.1080p.es.srt";
    std::ofstream(srt2).close();

    auto subs = torrent::SubtitleEngine::find_local_subtitles(video_path.string());
    REQUIRE(subs.size() >= 2);

    bool found_en = false;
    bool found_es = false;
    for (const auto& s : subs) {
        if (s.language == "en") found_en = true;
        if (s.language == "es") found_es = true;
    }
    REQUIRE(found_en);
    REQUIRE(found_es);

    fs::remove_all(temp_dir);
}
