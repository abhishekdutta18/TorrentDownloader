#include "transcoder.hpp"
#include <filesystem>
#include <iostream>
#include <sstream>
#include <algorithm>
#include <array>
#include <memory>
#include <cstdio>
#include <nlohmann/json.hpp>

namespace torrent {

namespace fs = std::filesystem;
using json = nlohmann::json;

static std::string s_cached_ffmpeg_path;
static bool s_checked_ffmpeg = false;

std::string TranscoderEngine::find_ffmpeg_binary() {
    if (s_checked_ffmpeg) return s_cached_ffmpeg_path;
    s_checked_ffmpeg = true;

    // Check standard Homebrew and Unix paths
    const std::vector<std::string> search_paths = {
        "/opt/homebrew/bin/ffmpeg",
        "/usr/local/bin/ffmpeg",
        "/usr/bin/ffmpeg"
    };

    for (const auto& p : search_paths) {
        if (fs::exists(p)) {
            s_cached_ffmpeg_path = p;
            return s_cached_ffmpeg_path;
        }
    }

    // Check PATH via which
    std::array<char, 256> buffer;
    std::string result;
    FILE* pipe = ::popen("which ffmpeg 2>/dev/null", "r");
    if (pipe) {
        while (::fgets(buffer.data(), buffer.size(), pipe) != nullptr) {
            result += buffer.data();
        }
        ::pclose(pipe);
        while (!result.empty() && (result.back() == '\n' || result.back() == '\r')) {
            result.pop_back();
        }
        if (!result.empty() && fs::exists(result)) {
            s_cached_ffmpeg_path = result;
            return s_cached_ffmpeg_path;
        }
    }

    s_cached_ffmpeg_path = "";
    return "";
}

bool TranscoderEngine::is_ffmpeg_available() {
    return !find_ffmpeg_binary().empty();
}

bool TranscoderEngine::should_transcode(const std::string& filepath) {
    if (filepath.empty()) return false;
    std::string ext = fs::path(filepath).extension().string();
    std::transform(ext.begin(), ext.end(), ext.begin(), ::tolower);

    // Containers and codecs that standard web browsers struggle with natively
    static const std::vector<std::string> transcode_exts = {
        ".mkv", ".avi", ".wmv", ".flv", ".ts", ".vob", ".divx", ".iso", ".mov"
    };

    return std::find(transcode_exts.begin(), transcode_exts.end(), ext) != transcode_exts.end();
}

std::string TranscoderEngine::build_ffmpeg_command(
    const std::string& ffmpeg_path,
    const std::string& input_path,
    int64_t start_seconds
) {
    std::ostringstream cmd;
    cmd << "\"" << ffmpeg_path << "\" -hide_banner -loglevel error ";
    if (start_seconds > 0) {
        cmd << "-ss " << start_seconds << " ";
    }
    cmd << "-i \"" << input_path << "\" ";
    cmd << "-c:v copy -c:a aac -b:a 192k ";
    cmd << "-movflags frag_keyframe+empty_moov -f mp4 pipe:1";
    return cmd.str();
}

void setup_transcoder_routes(httplib::Server& svr, Engine& engine) {
    // GET /api/transcoder/status
    svr.Get("/api/transcoder/status", [](const httplib::Request&, httplib::Response& res) {
        bool avail = TranscoderEngine::is_ffmpeg_available();
        std::string path = TranscoderEngine::find_ffmpeg_binary();
        json j = {
            {"status", "success"},
            {"available", avail},
            {"binary_path", path},
            {"install_hint", "Install with 'brew install ffmpeg' for on-the-fly browser transcoding."}
        };
        res.set_content(j.dump(), "application/json");
    });

    // GET /api/stream/:hash/:index/transcode
    svr.Get(R"(/api/stream/([^/]+)/(\d+)/transcode)", [&engine](const httplib::Request& req, httplib::Response& res) {
        std::string hash = req.matches[1];
        int file_index = std::stoi(req.matches[2]);

        auto files = engine.get_torrent_files(hash);
        if (file_index < 0 || file_index >= static_cast<int>(files.size())) {
            res.status = 404;
            res.set_content(R"({"status":"error","message":"File index out of range"})", "application/json");
            return;
        }

        std::string full_path = files[file_index].save_path + "/" + files[file_index].path;
        if (!fs::exists(full_path)) {
            res.status = 503;
            res.set_content("Buffering media from swarm...", "text/plain");
            return;
        }

        if (!TranscoderEngine::is_ffmpeg_available()) {
            res.status = 501;
            json j = {
                {"status", "error"},
                {"message", "FFmpeg not available for server-side transcoding. Use system player or install FFmpeg via 'brew install ffmpeg'."}
            };
            res.set_content(j.dump(), "application/json");
            return;
        }

        int64_t start_sec = 0;
        if (req.has_param("start")) {
            try {
                start_sec = std::stoll(req.get_param_value("start"));
            } catch (...) {}
        }

        std::string ffmpeg_bin = TranscoderEngine::find_ffmpeg_binary();
        std::string cmd = TranscoderEngine::build_ffmpeg_command(ffmpeg_bin, full_path, start_sec);

        FILE* pipe = ::popen(cmd.c_str(), "r");
        if (!pipe) {
            res.status = 500;
            res.set_content(R"({"status":"error","message":"Failed to start ffmpeg process"})", "application/json");
            return;
        }

        auto pipe_holder = std::shared_ptr<FILE>(pipe, [](FILE* p) {
            if (p) ::pclose(p);
        });

        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Headers", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");

        res.set_chunked_content_provider(
            "video/mp4",
            [pipe_holder](size_t /*offset*/, httplib::DataSink &sink) -> bool {
                FILE* fp = pipe_holder.get();
                const size_t BUF_SIZE = 64 * 1024;
                std::vector<char> buffer(BUF_SIZE);

                size_t bytes_read = ::fread(buffer.data(), 1, BUF_SIZE, fp);
                if (bytes_read > 0 && sink.is_writable()) {
                    return sink.write(buffer.data(), bytes_read);
                }
                return false; // EOF or not writable
            }
        );
    });
}

} // namespace torrent
