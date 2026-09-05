#pragma once

#include <string>
#include <vector>
#include <cstdint>
#include <httplib.h>
#include <nlohmann/json.hpp>
#include "engine.hpp"

namespace torrent {

struct SubtitleItem {
    std::string id;
    std::string language;
    std::string release_name;
    std::string download_url;
    bool is_hash_match = false;
    int download_count = 0;
    std::string local_path;

    nlohmann::json to_json() const {
        return {
            {"id", id},
            {"language", language},
            {"release_name", release_name},
            {"download_url", download_url},
            {"is_hash_match", is_hash_match},
            {"download_count", download_count},
            {"local_path", local_path}
        };
    }
};

class SubtitleEngine {
public:
    // OpenSubtitles 64-bit MovieHash calculation
    static std::string compute_movie_hash(const std::string& filepath);

    // Convert standard SubRip (.srt) syntax to HTML5 WebVTT (.vtt)
    static std::string srt_to_webvtt(const std::string& srt_content);

    // Discover existing subtitle files on disk near the video file
    static std::vector<SubtitleItem> find_local_subtitles(const std::string& video_path);

    // Search OpenSubtitles REST API by hash and/or parsed media query
    static std::vector<SubtitleItem> search_online(
        const std::string& movie_hash,
        const std::string& query,
        int season = 0,
        int episode = 0,
        const std::string& lang = "en"
    );

    // Download remote subtitle content and persist to disk beside video
    static bool download_and_save(
        const std::string& download_url,
        const std::string& destination_path
    );

    // Detect language code from filename (e.g. "movie.en.srt" -> "en")
    static std::string detect_language_from_path(const std::string& sub_path);
};

// Mount REST routes for subtitles onto httplib::Server
void setup_subtitle_routes(httplib::Server& svr, Engine& engine);

} // namespace torrent
