#include "torrent_file.hpp"
#include "sha1.hpp"
#include <fstream>
#include <sstream>
#include <stdexcept>

namespace torrent {

TorrentFile TorrentFile::from_file(const std::string& path) {
    std::ifstream file(path, std::ios::binary);
    if (!file.is_open()) {
        throw std::runtime_error("Could not open .torrent file: " + path);
    }
    
    std::stringstream buffer;
    buffer << file.rdbuf();
    return from_string(buffer.str());
}

TorrentFile TorrentFile::from_string(const std::string& bencoded_data) {
    TorrentFile torrent;
    BencodeValue root = BencodeParser::decode(bencoded_data);
    torrent.parse(root, bencoded_data);
    return torrent;
}

void TorrentFile::parse(const BencodeValue& root, std::string_view original_bencoded_data) {
    if (root.type != BencodeValue::Type::Dict) {
        throw std::invalid_argument("Invalid torrent file format: root is not a dictionary");
    }
    
    const auto& root_dict = root.get_dict();
    
    if (root_dict.find("announce") != root_dict.end()) {
        announce = root_dict.at("announce").get_string();
    }
    
    if (root_dict.find("info") == root_dict.end()) {
        throw std::invalid_argument("Torrent file missing 'info' dictionary");
    }
    
    const BencodeValue& info = root_dict.at("info");
    const auto& info_dict = info.get_dict();
    
    // Hash the 'info' dictionary
    std::string encoded_info = BencodeParser::encode(info);
    info_hash = SHA1::hash(encoded_info);
    
    name = info_dict.at("name").get_string();
    piece_length = info_dict.at("piece length").get_int();
    
    std::string pieces_str = info_dict.at("pieces").get_string();
    if (pieces_str.length() % 20 != 0) {
        throw std::invalid_argument("Invalid pieces string length");
    }
    for (size_t i = 0; i < pieces_str.length(); i += 20) {
        std::vector<uint8_t> hash(pieces_str.begin() + i, pieces_str.begin() + i + 20);
        pieces.push_back(hash);
    }
    
    // Check for single-file vs multi-file
    if (info_dict.find("length") != info_dict.end()) {
        // Single file mode
        FileEntry entry;
        entry.length = info_dict.at("length").get_int();
        entry.path.push_back(name);
        files.push_back(entry);
    } else if (info_dict.find("files") != info_dict.end()) {
        // Multi-file mode
        const auto& files_list = info_dict.at("files").get_list();
        for (const auto& f_val : files_list) {
            const auto& f_dict = f_val.get_dict();
            FileEntry entry;
            entry.length = f_dict.at("length").get_int();
            
            const auto& path_list = f_dict.at("path").get_list();
            for (const auto& p_val : path_list) {
                entry.path.push_back(p_val.get_string());
            }
            files.push_back(entry);
        }
    } else {
        throw std::invalid_argument("Invalid torrent info dictionary: missing 'length' and 'files'");
    }
}

int64_t TorrentFile::total_size() const {
    int64_t sum = 0;
    for (const auto& f : files) {
        sum += f.length;
    }
    return sum;
}

} // namespace torrent
