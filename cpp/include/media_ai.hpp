#pragma once

#include <string>
#include <vector>
#include <optional>
#include <nlohmann/json.hpp>

namespace torrent {

struct MediaMetadata {
    std::string raw_title;
    std::string clean_title;
    std::string media_type = "unknown"; // "movie", "tv", "software", "music", "other"
    int season = 0;                     // e.g. 5
    int episode = 0;                    // e.g. 14
    int year = 0;                       // e.g. 2023
    std::string resolution;             // "4K", "1080p", "720p", "480p"
    std::string source;                 // "BluRay", "WEBRip", "WEB-DL", "HDTV", etc.
    std::string video_codec;            // "x265", "HEVC", "x264", "AV1"
    std::string audio_format;           // "Atmos", "DTS", "AAC", "AC3", "5.1"
    std::string release_group;          // e.g. "ROVERS"
    std::string extension;              // e.g. "mkv"
    std::string suggested_filename;     // Standardized clean name
    std::string plex_relative_path;     // Standardized library relative path

    nlohmann::json to_json() const;
};

class MediaParser {
public:
    static MediaMetadata parse(const std::string& input_name);
    static std::string clean_whitespace_and_dots(const std::string& str);
};

} // namespace torrent
