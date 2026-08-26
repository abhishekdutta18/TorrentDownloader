#pragma once

#include <cstdint>
#include <string>
#include <vector>

namespace torrent {

class SHA1 {
public:
    SHA1();
    
    void update(const std::string &s);
    void update(const uint8_t* data, size_t size);
    
    // Returns the 20-byte hash
    std::vector<uint8_t> digest();
    
    // Returns the hash as a 40-character hex string
    std::string hex_digest();

    // Static helper for one-shot hashing
    static std::vector<uint8_t> hash(const std::string& data);
    static std::vector<uint8_t> hash(const std::vector<uint8_t>& data);

private:
    void process_block(const uint8_t* block);
    
    uint32_t digest_[5];
    std::string buffer_;
    uint64_t transforms_;
};

} // namespace torrent
