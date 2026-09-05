#include "subtitles.hpp"
#include "media_ai.hpp"
#include "transcoder.hpp"
#include <iostream>
#include <fstream>
#include <sstream>
#include <regex>
#include <filesystem>
#include <algorithm>
#include <chrono>

namespace torrent {

namespace fs = std::filesystem;

std::string SubtitleEngine::compute_movie_hash(const std::string& filepath) {
    if (filepath.empty() || !fs::exists(filepath)) {
        return "";
    }

    std::ifstream file(filepath, std::ios::binary);
    if (!file.is_open()) {
        return "";
    }

    file.seekg(0, std::ios::end);
    uint64_t file_size = file.tellg();
    if (file_size < 131072) { // Minimum 128KB required by OpenSubtitles algorithm
        return "";
    }

    uint64_t hash = file_size;

    // First 64KB (65536 bytes = 8192 uint64_t values)
    std::vector<uint64_t> buffer(8192, 0);
    file.seekg(0, std::ios::beg);
    file.read(reinterpret_cast<char*>(buffer.data()), 65536);
    for (uint64_t val : buffer) {
        hash += val;
    }

    // Last 64KB
    std::fill(buffer.begin(), buffer.end(), 0);
    file.seekg(file_size - 65536, std::ios::beg);
    file.read(reinterpret_cast<char*>(buffer.data()), 65536);
    for (uint64_t val : buffer) {
        hash += val;
    }

    char hex_str[17];
    snprintf(hex_str, sizeof(hex_str), "%016llx", (unsigned long long)hash);
    return std::string(hex_str);
}

std::string SubtitleEngine::srt_to_webvtt(const std::string& srt_content) {
    std::string result = "WEBVTT\n\n";
    std::string input = srt_content;

    // Strip UTF-8 Byte Order Mark (BOM) if present
    if (input.size() >= 3 &&
        static_cast<unsigned char>(input[0]) == 0xEF &&
        static_cast<unsigned char>(input[1]) == 0xBB &&
        static_cast<unsigned char>(input[2]) == 0xBF) {
        input = input.substr(3);
    }

    // Regex matching SRT time format: 00:01:23,456 --> 00:01:26,789
    static const std::regex time_pattern(R"((\d{2}:\d{2}:\d{2}),(\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}),(\d{3}))");

    std::istringstream stream(input);
    std::string line;
    while (std::getline(stream, line)) {
        if (!line.empty() && line.back() == '\r') {
            line.pop_back();
        }
        std::string converted = std::regex_replace(line, time_pattern, "$1.$2 --> $3.$4");
        result += converted + "\n";
    }

    return result;
}

std::string SubtitleEngine::detect_language_from_path(const std::string& sub_path) {
    std::string lower = sub_path;
    std::transform(lower.begin(), lower.end(), lower.begin(), ::tolower);

    if (lower.find(".es.") != std::string::npos || lower.find(".spa.") != std::string::npos || lower.find("spanish") != std::string::npos) {
        return "es";
    }
    if (lower.find(".fr.") != std::string::npos || lower.find(".fre.") != std::string::npos || lower.find("french") != std::string::npos) {
        return "fr";
    }
    if (lower.find(".de.") != std::string::npos || lower.find(".ger.") != std::string::npos || lower.find("german") != std::string::npos) {
        return "de";
    }
    if (lower.find(".it.") != std::string::npos || lower.find(".ita.") != std::string::npos || lower.find("italian") != std::string::npos) {
        return "it";
    }
    if (lower.find(".pt.") != std::string::npos || lower.find(".por.") != std::string::npos || lower.find("portuguese") != std::string::npos) {
        return "pt";
    }
    return "en"; // Default
}

std::vector<SubtitleItem> SubtitleEngine::find_local_subtitles(const std::string& video_path) {
    std::vector<SubtitleItem> items;
    if (video_path.empty() || !fs::exists(video_path)) {
        return items;
    }

    try {
        fs::path vpath(video_path);
        fs::path parent = vpath.parent_path();
        std::string stem = vpath.stem().string();

        auto scan_dir = [&](const fs::path& dir) {
            if (!fs::exists(dir) || !fs::is_directory(dir)) return;
            for (const auto& entry : fs::directory_iterator(dir)) {
                if (!entry.is_regular_file()) continue;
                std::string ext = entry.path().extension().string();
                std::transform(ext.begin(), ext.end(), ext.begin(), ::tolower);

                if (ext == ".srt" || ext == ".vtt" || ext == ".sub") {
                    SubtitleItem item;
                    item.id = entry.path().filename().string();
                    item.release_name = entry.path().filename().string();
                    item.local_path = entry.path().string();
                    item.language = detect_language_from_path(item.local_path);
                    item.is_hash_match = true;
                    item.download_count = 1;
                    items.push_back(item);
                }
            }
        };

        // Scan current directory
        scan_dir(parent);

        // Scan optional Subs/ or Subtitles/ subdirectories
        if (fs::exists(parent / "Subs")) scan_dir(parent / "Subs");
        if (fs::exists(parent / "subtitles")) scan_dir(parent / "subtitles");
        if (fs::exists(parent / "Subtitles")) scan_dir(parent / "Subtitles");
    } catch (...) {}

    return items;
}

std::vector<SubtitleItem> SubtitleEngine::search_online(
    const std::string& movie_hash,
    const std::string& query,
    int season,
    int episode,
    const std::string& lang
) {
    std::vector<SubtitleItem> results;

    try {
        httplib::SSLClient cli("api.opensubtitles.com");
        cli.set_connection_timeout(5, 0);
        cli.set_read_timeout(8, 0);

        httplib::Headers headers = {
            {"User-Agent", "OmniFlux v1.0"},
            {"Accept", "application/json"}
        };

        std::string path = "/api/v1/subtitles?languages=" + (lang.empty() ? "en" : lang);
        if (!movie_hash.empty()) {
            path += "&moviehash=" + movie_hash;
        }
        if (!query.empty()) {
            // URL encode query
            std::string encoded_query;
            for (char c : query) {
                if (isalnum((unsigned char)c) || c == '-' || c == '_' || c == '.' || c == '~') {
                    encoded_query += c;
                } else if (c == ' ') {
                    encoded_query += "%20";
                } else {
                    char buf[4];
                    snprintf(buf, sizeof(buf), "%%%02X", (unsigned char)c);
                    encoded_query += buf;
                }
            }
            path += "&query=" + encoded_query;
        }
        if (season > 0) {
            path += "&season_number=" + std::to_string(season);
        }
        if (episode > 0) {
            path += "&episode_number=" + std::to_string(episode);
        }

        auto res = cli.Get(path.c_str(), headers);
        if (res && res->status == 200) {
            auto json = nlohmann::json::parse(res->body);
            if (json.contains("data") && json["data"].is_array()) {
                for (const auto& entry : json["data"]) {
                    if (!entry.contains("attributes")) continue;
                    const auto& attrs = entry["attributes"];
                    if (!attrs.contains("files") || !attrs["files"].is_array() || attrs["files"].empty()) continue;

                    int file_id = attrs["files"][0].value("file_id", 0);
                    if (file_id == 0) continue;

                    SubtitleItem item;
                    item.id = std::to_string(file_id);
                    item.release_name = attrs.value("release", query);
                    item.language = attrs.value("language", lang);
                    item.download_count = attrs.value("download_count", 0);
                    item.is_hash_match = !movie_hash.empty() && attrs.value("moviehash_match", false);
                    item.download_url = "https://api.opensubtitles.com/api/v1/download?file_id=" + std::to_string(file_id);
                    results.push_back(item);
                    if (results.size() >= 15) break;
                }
            }
        }
    } catch (const std::exception& e) {
        std::cerr << "OpenSubtitles search exception: " << e.what() << std::endl;
    }

    return results;
}

bool SubtitleEngine::download_and_save(
    const std::string& download_url,
    const std::string& destination_path
) {
    if (download_url.empty() || destination_path.empty()) {
        return false;
    }

    try {
        std::string actual_url = download_url;
        std::string srt_content;

        // If OpenSubtitles API download endpoint, make POST/GET to obtain actual download link
        if (download_url.find("api.opensubtitles.com/api/v1/download") != std::string::npos) {
            httplib::SSLClient cli("api.opensubtitles.com");
            cli.set_connection_timeout(5, 0);
            cli.set_read_timeout(8, 0);

            // Extract file_id parameter
            auto pos = download_url.find("file_id=");
            std::string file_id = (pos != std::string::npos) ? download_url.substr(pos + 8) : "";

            httplib::Headers headers = {
                {"User-Agent", "OmniFlux v1.0"},
                {"Content-Type", "application/json"},
                {"Accept", "application/json"}
            };

            nlohmann::json body = {{"file_id", std::stoi(file_id)}};
            auto res = cli.Post("/api/v1/download", headers, body.dump(), "application/json");
            if (res && res->status == 200) {
                auto resp_json = nlohmann::json::parse(res->body);
                if (resp_json.contains("link")) {
                    actual_url = resp_json["link"].get<std::string>();
                }
            }
        }

        // Parse host and path from actual_url
        std::string host, path;
        bool is_ssl = false;
        if (actual_url.find("https://") == 0) {
            is_ssl = true;
            auto rest = actual_url.substr(8);
            auto slash = rest.find('/');
            host = rest.substr(0, slash);
            path = (slash != std::string::npos) ? rest.substr(slash) : "/";
        } else if (actual_url.find("http://") == 0) {
            auto rest = actual_url.substr(7);
            auto slash = rest.find('/');
            host = rest.substr(0, slash);
            path = (slash != std::string::npos) ? rest.substr(slash) : "/";
        } else {
            return false;
        }

        httplib::Headers headers = {{"User-Agent", "OmniFlux v1.0"}};
        if (is_ssl) {
            httplib::SSLClient cli(host);
            cli.set_connection_timeout(5, 0);
            cli.set_read_timeout(10, 0);
            auto res = cli.Get(path.c_str(), headers);
            if (res && res->status == 200) {
                srt_content = res->body;
            }
        } else {
            httplib::Client cli(host);
            cli.set_connection_timeout(5, 0);
            cli.set_read_timeout(10, 0);
            auto res = cli.Get(path.c_str(), headers);
            if (res && res->status == 200) {
                srt_content = res->body;
            }
        }

        if (srt_content.empty()) {
            return false;
        }

        // Save to destination
        fs::create_directories(fs::path(destination_path).parent_path());
        std::ofstream out(destination_path, std::ios::binary);
        if (!out.is_open()) return false;
        out.write(srt_content.data(), srt_content.size());
        return true;
    } catch (const std::exception& e) {
        std::cerr << "Subtitle download exception: " << e.what() << std::endl;
        return false;
    }
}

bool SubtitleEngine::generate_ai_subtitles(
    const std::string& video_path,
    const std::string& groq_key,
    const std::string& lang,
    std::string& out_srt_path,
    std::string& out_vtt_content,
    std::string& error_msg
) {
    if (groq_key.empty()) {
        error_msg = "Groq API Key is required. Get one free at console.groq.com";
        return false;
    }

    if (video_path.empty() || !fs::exists(video_path)) {
        error_msg = "Video file not found on disk";
        return false;
    }

    // 1. Audio Extraction
    std::string temp_audio = "/tmp/groq_audio_" + std::to_string(std::chrono::system_clock::now().time_since_epoch().count()) + ".mp3";
    
    // Check FFmpeg first
    std::string ffmpeg_bin = TranscoderEngine::find_ffmpeg_binary();
    bool extraction_ok = false;
    
    if (!ffmpeg_bin.empty()) {
        std::string cmd = "\"" + ffmpeg_bin + "\" -y -hide_banner -loglevel error -i \"" + video_path + "\" -vn -ac 1 -ar 16000 -b:a 16k -f mp3 \"" + temp_audio + "\" 2>/dev/null";
        int ret = system(cmd.c_str());
        extraction_ok = (ret == 0) && fs::exists(temp_audio) && (fs::file_size(temp_audio) > 512);
    }
    
    // Fallback to VLC CLI if ffmpeg failed or not found
    if (!extraction_ok) {
        std::vector<std::string> vlc_candidates = {
            "/Applications/VLC.app/Contents/MacOS/VLC",
            "/opt/homebrew/bin/vlc",
            "/usr/local/bin/vlc"
        };
        for (const auto& vlc : vlc_candidates) {
            if (fs::exists(vlc)) {
                std::string cmd = "\"" + vlc + "\" -I dummy --no-repeat --no-loop \"" + video_path + "\" \":sout=#transcode{acodec=mp3,ab=16,channels=1,samplerate=16000}:standard{access=file,mux=raw,dst=" + temp_audio + "}\" vlc://quit 2>/dev/null";
                system(cmd.c_str());
                if (fs::exists(temp_audio) && fs::file_size(temp_audio) > 512) {
                    extraction_ok = true;
                    break;
                }
            }
        }
    }
    
    if (!extraction_ok || !fs::exists(temp_audio)) {
        error_msg = "Audio extraction failed. Please ensure FFmpeg or VLC is installed.";
        return false;
    }
    
    uintmax_t audio_size = fs::file_size(temp_audio);
    if (audio_size > 25 * 1024 * 1024) {
        fs::remove(temp_audio);
        error_msg = "Extracted audio exceeds Groq 25MB limit. Please use a shorter clip or lower bitrate.";
        return false;
    }
    
    std::ifstream audio_file(temp_audio, std::ios::binary);
    if (!audio_file.is_open()) {
        fs::remove(temp_audio);
        error_msg = "Failed to open extracted audio for upload";
        return false;
    }
    
    std::string audio_data((std::istreambuf_iterator<char>(audio_file)), std::istreambuf_iterator<char>());
    audio_file.close();
    fs::remove(temp_audio);
    
    // 2. Groq Whisper API Request
    try {
        httplib::SSLClient cli("api.groq.com");
        cli.set_connection_timeout(10, 0);
        cli.set_read_timeout(90, 0); // Transcription of audio can take up to 30-60 seconds
        
        httplib::Headers headers = {
            {"Authorization", "Bearer " + groq_key}
        };
        
        std::string target_lang = lang.empty() ? "en" : lang;
        httplib::UploadFormDataItems items = {
            {"model", "whisper-large-v3", "", ""},
            {"response_format", "srt", "", ""},
            {"language", target_lang, "", ""},
            {"file", audio_data, "audio.mp3", "audio/mpeg"}
        };
        
        auto res = cli.Post("/openai/v1/audio/transcriptions", headers, items);
        if (!res) {
            error_msg = "Failed to connect to Groq Whisper API (connection timed out)";
            return false;
        }
        
        if (res->status != 200) {
            std::string groq_err = "HTTP " + std::to_string(res->status);
            try {
                auto j = nlohmann::json::parse(res->body);
                if (j.contains("error") && j["error"].contains("message")) {
                    groq_err = j["error"]["message"].get<std::string>();
                }
            } catch (...) {}
            error_msg = "Groq Whisper API error: " + groq_err;
            return false;
        }
        
        std::string srt_content = res->body;
        if (srt_content.empty() || srt_content.find("-->") == std::string::npos) {
            error_msg = "Groq Whisper returned no speech dialogue or invalid SRT format";
            return false;
        }
        
        // 3. Save generated SRT to disk beside video
        fs::path vpath(video_path);
        std::string out_name = vpath.stem().string() + ".ai." + target_lang + ".srt";
        fs::path out_file = vpath.parent_path() / out_name;
        
        std::ofstream out(out_file, std::ios::binary);
        if (!out.is_open()) {
            error_msg = "Could not save subtitle file to disk";
            return false;
        }
        out.write(srt_content.data(), srt_content.size());
        out.close();
        
        out_srt_path = out_file.string();
        out_vtt_content = srt_to_webvtt(srt_content);
        return true;
    } catch (const std::exception& e) {
        error_msg = std::string("AI transcription error: ") + e.what();
        return false;
    }
}

void setup_subtitle_routes(httplib::Server& svr, Engine& engine) {
    // GET /api/torrents/:hash/files/:index/subtitles
    svr.Get(R"(/api/torrents/([^/]+)/files/(\d+)/subtitles)", [&engine](const httplib::Request& req, httplib::Response& res) {
        std::string hash = req.matches[1];
        int file_idx = std::stoi(req.matches[2]);
        std::string lang = req.has_param("lang") ? req.get_param_value("lang") : "en";

        try {
            auto files = engine.get_torrent_files(hash);
            if (file_idx < 0 || file_idx >= static_cast<int>(files.size())) {
                res.status = 404;
                res.set_content(R"({"status":"error","message":"File index out of range"})", "application/json");
                return;
            }

            const auto& file = files[file_idx];
            std::string video_path = file.path;
            std::string movie_hash = SubtitleEngine::compute_movie_hash(video_path);

            // 1. Discover local subtitles
            auto local_subs = SubtitleEngine::find_local_subtitles(video_path);

            // 2. Parse title with MediaParser
            auto meta = MediaParser::parse(file.name);

            // 3. Query online OpenSubtitles
            auto online_subs = SubtitleEngine::search_online(
                movie_hash,
                meta.clean_title,
                meta.season,
                meta.episode,
                lang
            );

            nlohmann::json local_arr = nlohmann::json::array();
            for (const auto& item : local_subs) {
                local_arr.push_back(item.to_json());
            }

            nlohmann::json online_arr = nlohmann::json::array();
            for (const auto& item : online_subs) {
                online_arr.push_back(item.to_json());
            }

            nlohmann::json response = {
                {"status", "success"},
                {"movie_hash", movie_hash},
                {"metadata", meta.to_json()},
                {"local_subtitles", local_arr},
                {"online_subtitles", online_arr}
            };

            res.status = 200;
            res.set_content(response.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 500;
            res.set_content(nlohmann::json{{"status", "error"}, {"message", e.what()}}.dump(), "application/json");
        }
    });

    // POST /api/torrents/:hash/files/:index/subtitles/download
    svr.Post(R"(/api/torrents/([^/]+)/files/(\d+)/subtitles/download)", [&engine](const httplib::Request& req, httplib::Response& res) {
        std::string hash = req.matches[1];
        int file_idx = std::stoi(req.matches[2]);

        try {
            auto body = nlohmann::json::parse(req.body);
            std::string download_url = body.value("download_url", "");
            std::string lang = body.value("language", "en");

            auto files = engine.get_torrent_files(hash);
            if (file_idx < 0 || file_idx >= static_cast<int>(files.size())) {
                res.status = 404;
                res.set_content(R"({"status":"error","message":"File index out of range"})", "application/json");
                return;
            }

            const auto& file = files[file_idx];
            fs::path vpath(file.path);
            std::string target_name = vpath.stem().string() + "." + lang + ".srt";
            fs::path target_path = vpath.parent_path() / target_name;

            bool ok = SubtitleEngine::download_and_save(download_url, target_path.string());
            if (ok) {
                res.status = 200;
                res.set_content(nlohmann::json{
                    {"status", "success"},
                    {"saved_path", target_path.string()},
                    {"language", lang}
                }.dump(), "application/json");
            } else {
                res.status = 502;
                res.set_content(R"({"status":"error","message":"Failed to download subtitle"})", "application/json");
            }
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(nlohmann::json{{"status", "error"}, {"message", e.what()}}.dump(), "application/json");
        }
    });

    // GET /api/torrents/:hash/files/:index/subtitles/stream
    svr.Get(R"(/api/torrents/([^/]+)/files/(\d+)/subtitles/stream)", [&engine](const httplib::Request& req, httplib::Response& res) {
        std::string hash = req.matches[1];
        int file_idx = std::stoi(req.matches[2]);

        std::string sub_path;
        if (req.has_param("path")) {
            sub_path = req.get_param_value("path");
        } else {
            // Find first local subtitle
            try {
                auto files = engine.get_torrent_files(hash);
                if (file_idx >= 0 && file_idx < static_cast<int>(files.size())) {
                    auto locals = SubtitleEngine::find_local_subtitles(files[file_idx].path);
                    if (!locals.empty()) {
                        sub_path = locals[0].local_path;
                    }
                }
            } catch (...) {}
        }

        if (sub_path.empty() || !fs::exists(sub_path)) {
            res.status = 404;
            res.set_content("WEBVTT\n\nNOTE No subtitle found\n", "text/vtt; charset=utf-8");
            return;
        }

        std::ifstream file(sub_path, std::ios::binary);
        if (!file.is_open()) {
            res.status = 404;
            res.set_content("WEBVTT\n\nNOTE Unable to open file\n", "text/vtt; charset=utf-8");
            return;
        }

        std::stringstream buffer;
        buffer << file.rdbuf();
        std::string raw_content = buffer.str();

        // Convert to WebVTT if file is .srt or doesn't start with WEBVTT
        std::string vtt_output;
        if (raw_content.find("WEBVTT") == 0) {
            vtt_output = raw_content;
        } else {
            vtt_output = SubtitleEngine::srt_to_webvtt(raw_content);
        }

        res.status = 200;
        res.set_header("Content-Type", "text/vtt; charset=utf-8");
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_content(vtt_output, "text/vtt; charset=utf-8");
    });

    // POST /api/torrents/:hash/files/:index/subtitles/ai_transcribe
    svr.Post(R"(/api/torrents/([^/]+)/files/(\d+)/subtitles/ai_transcribe)", [&engine](const httplib::Request& req, httplib::Response& res) {
        std::string hash = req.matches[1];
        int file_idx = std::stoi(req.matches[2]);

        try {
            auto body = nlohmann::json::parse(req.body);
            std::string groq_key = body.value("groq_api_key", "");
            std::string lang = body.value("language", "en");

            if (groq_key.empty()) {
                res.status = 400;
                res.set_content(R"({"status":"error","message":"Groq API Key is required"})", "application/json");
                return;
            }

            auto files = engine.get_torrent_files(hash);
            if (file_idx < 0 || file_idx >= static_cast<int>(files.size())) {
                res.status = 404;
                res.set_content(R"({"status":"error","message":"File index out of range"})", "application/json");
                return;
            }

            auto state = engine.get_torrent_state(hash);
            std::string full_path = state.save_path + "/" + files[file_idx].path;

            std::string out_srt_path;
            std::string out_vtt;
            std::string error_msg;

            bool ok = SubtitleEngine::generate_ai_subtitles(full_path, groq_key, lang, out_srt_path, out_vtt, error_msg);
            if (ok) {
                res.status = 200;
                res.set_content(nlohmann::json{
                    {"status", "success"},
                    {"saved_path", out_srt_path},
                    {"webvtt", out_vtt},
                    {"language", lang}
                }.dump(), "application/json");
            } else {
                res.status = 422;
                res.set_content(nlohmann::json{
                    {"status", "error"},
                    {"message", error_msg.empty() ? "AI subtitle generation failed" : error_msg}
                }.dump(), "application/json");
            }
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(nlohmann::json{{"status", "error"}, {"message", e.what()}}.dump(), "application/json");
        }
    });

    // POST /api/subtitles/convert
    svr.Post("/api/subtitles/convert", [](const httplib::Request& req, httplib::Response& res) {
        std::string vtt = SubtitleEngine::srt_to_webvtt(req.body);
        res.status = 200;
        res.set_header("Content-Type", "text/vtt; charset=utf-8");
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_content(vtt, "text/vtt; charset=utf-8");
    });
}

} // namespace torrent
