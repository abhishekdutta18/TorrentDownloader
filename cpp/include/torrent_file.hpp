#pragma once

#include <string>
#include <vector>
#include <cstdint>
#include "bencode.hpp"

namespace torrent {

struct FileEntry {
    int64_t length;
    std::vector<std::string> path; // for multi-file, this is a list of directory/file names
};

class TorrentFile {
public:
    // Parses a .torrent file from the given file path
    static TorrentFile from_file(const std::string& path);
    // Parses a .torrent file from raw bencoded bytes
    static TorrentFile from_string(const std::string& bencoded_data);

    std::string announce;
    
    // Extracted from the 'info' dictionary
    std::string name;
    int64_t piece_length = 0;
    std::vector<std::vector<uint8_t>> pieces; // List of 20-byte SHA-1 hashes
    
    // Contains either a single file (for single-file torrents)
    // or multiple files (for multi-file torrents)
    std::vector<FileEntry> files;
    
    // The 20-byte info hash, calculated by taking the SHA-1 of the bencoded 'info' dictionary
    std::vector<uint8_t> info_hash;
    
    int64_t total_size() const;
    
private:
    TorrentFile() = default;
    void parse(const BencodeValue& root, std::string_view original_bencoded_data);
};

} // namespace torrent
