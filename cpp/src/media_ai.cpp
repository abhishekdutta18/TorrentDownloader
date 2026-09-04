#include "media_ai.hpp"
#include <regex>
#include <algorithm>
#include <sstream>
#include <iomanip>

namespace torrent {

nlohmann::json MediaMetadata::to_json() const {
    return {
        {"raw_title", raw_title},
        {"clean_title", clean_title},
        {"media_type", media_type},
        {"season", season},
        {"episode", episode},
        {"year", year},
        {"resolution", resolution},
        {"source", source},
        {"video_codec", video_codec},
        {"audio_format", audio_format},
        {"release_group", release_group},
        {"extension", extension},
        {"suggested_filename", suggested_filename},
        {"plex_relative_path", plex_relative_path}
    };
}

std::string MediaParser::clean_whitespace_and_dots(const std::string& str) {
    std::string result;
    bool last_was_space = true;
    for (char c : str) {
        if (c == '.' || c == '_' || c == '-' || c == '+' || std::isspace(c)) {
            if (!last_was_space && !result.empty()) {
                result.push_back(' ');
                last_was_space = true;
            }
        } else {
            result.push_back(c);
            last_was_space = false;
        }
    }
    while (!result.empty() && (result.back() == ' ' || result.back() == '-')) {
        result.pop_back();
    }
    while (!result.empty() && result.front() == ' ') {
        result.erase(result.begin());
    }
    return result;
}

MediaMetadata MediaParser::parse(const std::string& input_name) {
    MediaMetadata meta;
    meta.raw_title = input_name;

    std::string working = input_name;

    // 1. Extract file extension if present
    size_t last_dot = working.find_last_of('.');
    if (last_dot != std::string::npos && last_dot > 0 && last_dot + 1 < working.size()) {
        std::string ext = working.substr(last_dot + 1);
        std::string ext_lower = ext;
        std::transform(ext_lower.begin(), ext_lower.end(), ext_lower.begin(), ::tolower);
        if (ext_lower == "mkv" || ext_lower == "mp4" || ext_lower == "avi" ||
            ext_lower == "mov" || ext_lower == "wmv" || ext_lower == "iso" ||
            ext_lower == "flac" || ext_lower == "mp3" || ext_lower == "zip") {
            meta.extension = ext_lower;
            working = working.substr(0, last_dot);
        }
    }

    // 2. Extract release group (e.g. -ROVERS or -FLUX at the end)
    std::regex group_regex(R"(-([A-Za-z0-9_]+)$)");
    std::smatch group_match;
    if (std::regex_search(working, group_match, group_regex)) {
        meta.release_group = group_match[1].str();
        working = group_match.prefix().str();
    }

    // 3. Detect TV Season and Episode (e.g. S05E14 or 5x14)
    std::regex tv_s_e_regex(R"(\b[Ss](\d{1,2})[Ee](\d{1,3})\b)");
    std::regex tv_x_regex(R"(\b(\d{1,2})x(\d{1,3})\b)");
    std::smatch tv_match;
    size_t title_cutoff = working.size();

    if (std::regex_search(working, tv_match, tv_s_e_regex)) {
        meta.media_type = "tv";
        meta.season = std::stoi(tv_match[1].str());
        meta.episode = std::stoi(tv_match[2].str());
        title_cutoff = std::min(title_cutoff, static_cast<size_t>(tv_match.position()));
    } else if (std::regex_search(working, tv_match, tv_x_regex)) {
        meta.media_type = "tv";
        meta.season = std::stoi(tv_match[1].str());
        meta.episode = std::stoi(tv_match[2].str());
        title_cutoff = std::min(title_cutoff, static_cast<size_t>(tv_match.position()));
    }

    // 4. Detect Year (1920 - 2099)
    std::regex year_regex(R"(\b(19\d{2}|20\d{2})\b)");
    std::smatch year_match;
    if (std::regex_search(working, year_match, year_regex)) {
        int found_year = std::stoi(year_match[1].str());
        // If not already classified as TV, year marks potential movie
        if (meta.media_type == "unknown") {
            meta.media_type = "movie";
            title_cutoff = std::min(title_cutoff, static_cast<size_t>(year_match.position()));
        }
        meta.year = found_year;
    }

    // 5. Detect Resolution
    std::regex res_4k(R"(\b(2160p|4[Kk]|UHD)\b)");
    std::regex res_1080p(R"(\b(1080p|1080i|FHD)\b)");
    std::regex res_720p(R"(\b(720p|HD)\b)");
    std::regex res_480p(R"(\b(480p|SD)\b)");

    if (std::regex_search(working, res_4k)) {
        meta.resolution = "4K";
    } else if (std::regex_search(working, res_1080p)) {
        meta.resolution = "1080p";
    } else if (std::regex_search(working, res_720p)) {
        meta.resolution = "720p";
    } else if (std::regex_search(working, res_480p)) {
        meta.resolution = "480p";
    }

    // 6. Detect Source
    std::regex src_bluray(R"(\b(BluRay|BDRip|BRRip)\b)", std::regex_constants::icase);
    std::regex src_web(R"(\b(WEB-DL|WEBRip|WEB)\b)", std::regex_constants::icase);
    std::regex src_hdtv(R"(\b(HDTV|PDTV)\b)", std::regex_constants::icase);
    std::regex src_dvd(R"(\b(DVDRip|DVD)\b)", std::regex_constants::icase);

    if (std::regex_search(working, src_bluray)) meta.source = "BluRay";
    else if (std::regex_search(working, src_web)) meta.source = "WEBRip";
    else if (std::regex_search(working, src_hdtv)) meta.source = "HDTV";
    else if (std::regex_search(working, src_dvd)) meta.source = "DVDRip";

    // 7. Detect Video Codec
    std::regex codec_hevc(R"(\b(x265|h265|HEVC|10bit)\b)", std::regex_constants::icase);
    std::regex codec_avc(R"(\b(x264|h264|AVC)\b)", std::regex_constants::icase);
    std::regex codec_av1(R"(\b(AV1)\b)", std::regex_constants::icase);

    if (std::regex_search(working, codec_hevc)) meta.video_codec = "x265";
    else if (std::regex_search(working, codec_avc)) meta.video_codec = "x264";
    else if (std::regex_search(working, codec_av1)) meta.video_codec = "AV1";

    // 8. Detect Audio Format
    std::regex audio_atmos(R"(\b(Atmos|TrueHD)\b)", std::regex_constants::icase);
    std::regex audio_dts(R"(\b(DTS-HD|DTS)\b)", std::regex_constants::icase);
    std::regex audio_dd(R"(\b(DD\+?5\.1|5\.1|AC3)\b)", std::regex_constants::icase);
    std::regex audio_aac(R"(\b(AAC|FLAC|MP3)\b)", std::regex_constants::icase);

    if (std::regex_search(working, audio_atmos)) meta.audio_format = "Atmos";
    else if (std::regex_search(working, audio_dts)) meta.audio_format = "DTS";
    else if (std::regex_search(working, audio_dd)) meta.audio_format = "5.1";
    else if (std::regex_search(working, audio_aac)) meta.audio_format = "AAC";

    // 9. Detect Software / OS / Music if still unknown
    if (meta.media_type == "unknown") {
        if (meta.extension == "iso" || working.find("Desktop") != std::string::npos || working.find("amd64") != std::string::npos) {
            meta.media_type = "software";
        } else if (meta.extension == "flac" || meta.extension == "mp3") {
            meta.media_type = "music";
        }
    }

    // 10. Extract Clean Title
    std::string raw_title_part = working.substr(0, title_cutoff);
    meta.clean_title = clean_whitespace_and_dots(raw_title_part);
    if (meta.clean_title.empty()) {
        meta.clean_title = clean_whitespace_and_dots(working);
    }

    // 11. Build Suggested Filename & Plex Library Path
    std::ostringstream fn;
    std::string ext_str = meta.extension.empty() ? "mkv" : meta.extension;

    if (meta.media_type == "tv") {
        fn << meta.clean_title << " - S";
        if (meta.season < 10) fn << "0";
        fn << meta.season << "E";
        if (meta.episode < 10) fn << "0";
        fn << meta.episode;

        std::vector<std::string> tags;
        if (!meta.resolution.empty()) tags.push_back(meta.resolution);
        if (!meta.source.empty()) tags.push_back(meta.source);
        if (!meta.video_codec.empty()) tags.push_back(meta.video_codec);
        
        if (!tags.empty()) {
            fn << " [";
            for (size_t i = 0; i < tags.size(); ++i) {
                if (i > 0) fn << " ";
                fn << tags[i];
            }
            fn << "]";
        }
        fn << "." << ext_str;
        meta.suggested_filename = fn.str();

        std::ostringstream ppath;
        ppath << "TV Shows/" << meta.clean_title << "/Season ";
        if (meta.season < 10) ppath << "0";
        ppath << meta.season << "/" << meta.suggested_filename;
        meta.plex_relative_path = ppath.str();

    } else if (meta.media_type == "movie") {
        fn << meta.clean_title;
        if (meta.year > 0) {
            fn << " (" << meta.year << ")";
        }

        std::vector<std::string> tags;
        if (!meta.resolution.empty()) tags.push_back(meta.resolution);
        if (!meta.source.empty()) tags.push_back(meta.source);
        if (!meta.video_codec.empty()) tags.push_back(meta.video_codec);

        if (!tags.empty()) {
            fn << " [";
            for (size_t i = 0; i < tags.size(); ++i) {
                if (i > 0) fn << " ";
                fn << tags[i];
            }
            fn << "]";
        }
        fn << "." << ext_str;
        meta.suggested_filename = fn.str();

        std::ostringstream ppath;
        ppath << "Movies/" << meta.clean_title;
        if (meta.year > 0) ppath << " (" << meta.year << ")";
        ppath << "/" << meta.suggested_filename;
        meta.plex_relative_path = ppath.str();

    } else {
        fn << meta.clean_title;
        if (!meta.extension.empty()) {
            fn << "." << meta.extension;
        }
        meta.suggested_filename = fn.str();
        meta.plex_relative_path = "Downloads/" + meta.suggested_filename;
    }

    return meta;
}

} // namespace torrent
