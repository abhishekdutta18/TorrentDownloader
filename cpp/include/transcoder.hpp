#pragma once

#include <string>
#include <vector>
#include <cstdint>
#include <httplib.h>
#include "engine.hpp"

namespace torrent {

class TranscoderEngine {
public:
    static bool is_ffmpeg_available();
    static std::string find_ffmpeg_binary();
    static bool should_transcode(const std::string& filepath);
    static std::string build_ffmpeg_command(
        const std::string& ffmpeg_path,
        const std::string& input_path,
        int64_t start_seconds = 0
    );
};

void setup_transcoder_routes(httplib::Server& svr, Engine& engine);

} // namespace torrent
