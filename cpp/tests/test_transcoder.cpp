#include <catch2/catch_test_macros.hpp>
#include "transcoder.hpp"

TEST_CASE("TranscoderEngine: Format and container checks", "[transcoder]") {
    SECTION("Containers requiring transcoding") {
        REQUIRE(torrent::TranscoderEngine::should_transcode("Movie.2024.1080p.mkv") == true);
        REQUIRE(torrent::TranscoderEngine::should_transcode("video.avi") == true);
        REQUIRE(torrent::TranscoderEngine::should_transcode("recording.ts") == true);
        REQUIRE(torrent::TranscoderEngine::should_transcode("clip.wmv") == true);
        REQUIRE(torrent::TranscoderEngine::should_transcode("animation.flv") == true);
    }

    SECTION("Web-native containers not requiring transcoding") {
        REQUIRE(torrent::TranscoderEngine::should_transcode("video.mp4") == false);
        REQUIRE(torrent::TranscoderEngine::should_transcode("stream.webm") == false);
        REQUIRE(torrent::TranscoderEngine::should_transcode("clip.m4v") == false);
        REQUIRE(torrent::TranscoderEngine::should_transcode("audio.mp3") == false);
    }
}

TEST_CASE("TranscoderEngine: Command construction", "[transcoder]") {
    SECTION("Command without initial seek") {
        std::string cmd = torrent::TranscoderEngine::build_ffmpeg_command("/usr/bin/ffmpeg", "/path/to/movie.mkv", 0);
        REQUIRE(cmd.find("/usr/bin/ffmpeg") != std::string::npos);
        REQUIRE(cmd.find("-i \"/path/to/movie.mkv\"") != std::string::npos);
        REQUIRE(cmd.find("-c:v copy -c:a aac") != std::string::npos);
        REQUIRE(cmd.find("-movflags frag_keyframe+empty_moov -f mp4 pipe:1") != std::string::npos);
        REQUIRE(cmd.find("-ss") == std::string::npos);
    }

    SECTION("Command with seek offset") {
        std::string cmd = torrent::TranscoderEngine::build_ffmpeg_command("/opt/homebrew/bin/ffmpeg", "/path/to/movie.mkv", 120);
        REQUIRE(cmd.find("-ss 120") != std::string::npos);
        REQUIRE(cmd.find("-i \"/path/to/movie.mkv\"") != std::string::npos);
    }
}
