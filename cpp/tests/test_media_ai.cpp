#include <catch2/catch_test_macros.hpp>
#include "media_ai.hpp"

TEST_CASE("MediaParser Scene Release Intelligence", "[media_ai]") {
    SECTION("Parses TV Series Episode with full scene tags") {
        std::string raw = "Breaking.Bad.S05E14.1080p.BluRay.x264-ROVERS.mkv";
        auto meta = torrent::MediaParser::parse(raw);

        REQUIRE(meta.media_type == "tv");
        REQUIRE(meta.clean_title == "Breaking Bad");
        REQUIRE(meta.season == 5);
        REQUIRE(meta.episode == 14);
        REQUIRE(meta.resolution == "1080p");
        REQUIRE(meta.source == "BluRay");
        REQUIRE(meta.video_codec == "x264");
        REQUIRE(meta.release_group == "ROVERS");
        REQUIRE(meta.extension == "mkv");
        REQUIRE(meta.suggested_filename == "Breaking Bad - S05E14 [1080p BluRay x264].mkv");
        REQUIRE(meta.plex_relative_path == "TV Shows/Breaking Bad/Season 05/Breaking Bad - S05E14 [1080p BluRay x264].mkv");
    }

    SECTION("Parses 4K UHD HDR Movie Release") {
        std::string raw = "Oppenheimer.2023.IMAX.2160p.UHD.x265.Atmos-FLUX.mkv";
        auto meta = torrent::MediaParser::parse(raw);

        REQUIRE(meta.media_type == "movie");
        REQUIRE(meta.clean_title == "Oppenheimer");
        REQUIRE(meta.year == 2023);
        REQUIRE(meta.resolution == "4K");
        REQUIRE(meta.video_codec == "x265");
        REQUIRE(meta.audio_format == "Atmos");
        REQUIRE(meta.release_group == "FLUX");
        REQUIRE(meta.suggested_filename == "Oppenheimer (2023) [4K x265].mkv");
        REQUIRE(meta.plex_relative_path == "Movies/Oppenheimer (2023)/Oppenheimer (2023) [4K x265].mkv");
    }

    SECTION("Parses Classic TV format (e.g. 3x08)") {
        std::string raw = "The.Office.US.3x08.The.Merger.720p.HDTV.x264.mkv";
        auto meta = torrent::MediaParser::parse(raw);

        REQUIRE(meta.media_type == "tv");
        REQUIRE(meta.clean_title == "The Office US");
        REQUIRE(meta.season == 3);
        REQUIRE(meta.episode == 8);
        REQUIRE(meta.resolution == "720p");
        REQUIRE(meta.source == "HDTV");
        REQUIRE(meta.suggested_filename == "The Office US - S03E08 [720p HDTV x264].mkv");
    }

    SECTION("Parses Linux Distribution ISO / Software") {
        std::string raw = "Ubuntu.24.04.LTS.Desktop.amd64.iso";
        auto meta = torrent::MediaParser::parse(raw);

        REQUIRE(meta.media_type == "software");
        REQUIRE(meta.extension == "iso");
        REQUIRE(meta.suggested_filename == "Ubuntu 24 04 LTS Desktop amd64.iso");
        REQUIRE(meta.plex_relative_path == "Downloads/Ubuntu 24 04 LTS Desktop amd64.iso");
    }
}
