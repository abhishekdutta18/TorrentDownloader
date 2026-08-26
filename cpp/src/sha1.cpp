#include "sha1.hpp"
#include <iomanip>
#include <sstream>
#include <cstring>

namespace torrent {

namespace {
    uint32_t left_rotate(uint32_t value, size_t count) {
        return (value << count) | (value >> (32 - count));
    }
}

SHA1::SHA1() {
    digest_[0] = 0x67452301;
    digest_[1] = 0xefcdab89;
    digest_[2] = 0x98badcfe;
    digest_[3] = 0x10325476;
    digest_[4] = 0xc3d2e1f0;
    transforms_ = 0;
}

void SHA1::update(const std::string &s) {
    update(reinterpret_cast<const uint8_t*>(s.c_str()), s.size());
}

void SHA1::update(const uint8_t* data, size_t size) {
    while (size > 0) {
        size_t needed = 64 - buffer_.size();
        size_t chunk_size = std::min(size, needed);
        buffer_.append(reinterpret_cast<const char*>(data), chunk_size);
        data += chunk_size;
        size -= chunk_size;

        if (buffer_.size() == 64) {
            process_block(reinterpret_cast<const uint8_t*>(buffer_.data()));
            buffer_.clear();
            transforms_++;
        }
    }
}

void SHA1::process_block(const uint8_t* block) {
    uint32_t w[80];
    for (int i = 0; i < 16; i++) {
        w[i] = (block[i*4] << 24) | (block[i*4+1] << 16) | (block[i*4+2] << 8) | (block[i*4+3]);
    }
    for (int i = 16; i < 80; i++) {
        w[i] = left_rotate(w[i-3] ^ w[i-8] ^ w[i-14] ^ w[i-16], 1);
    }

    uint32_t a = digest_[0];
    uint32_t b = digest_[1];
    uint32_t c = digest_[2];
    uint32_t d = digest_[3];
    uint32_t e = digest_[4];

    for (int i = 0; i < 80; ++i) {
        uint32_t f, k;
        if (i < 20) {
            f = (b & c) | ((~b) & d);
            k = 0x5A827999;
        } else if (i < 40) {
            f = b ^ c ^ d;
            k = 0x6ED9EBA1;
        } else if (i < 60) {
            f = (b & c) | (b & d) | (c & d);
            k = 0x8F1BBCDC;
        } else {
            f = b ^ c ^ d;
            k = 0xCA62C1D6;
        }

        uint32_t temp = left_rotate(a, 5) + f + e + k + w[i];
        e = d;
        d = c;
        c = left_rotate(b, 30);
        b = a;
        a = temp;
    }

    digest_[0] += a;
    digest_[1] += b;
    digest_[2] += c;
    digest_[3] += d;
    digest_[4] += e;
}

std::vector<uint8_t> SHA1::digest() {
    uint64_t total_bits = (transforms_ * 64 + buffer_.size()) * 8;
    
    buffer_ += (char)0x80;
    if (buffer_.size() > 56) {
        while (buffer_.size() < 64) {
            buffer_ += (char)0x00;
        }
        process_block(reinterpret_cast<const uint8_t*>(buffer_.data()));
        buffer_.clear();
    }
    
    while (buffer_.size() < 56) {
        buffer_ += (char)0x00;
    }

    for (int i = 7; i >= 0; i--) {
        buffer_ += (char)((total_bits >> (i * 8)) & 0xFF);
    }

    process_block(reinterpret_cast<const uint8_t*>(buffer_.data()));

    std::vector<uint8_t> result(20);
    for (int i = 0; i < 5; i++) {
        result[i*4]   = (digest_[i] >> 24) & 0xFF;
        result[i*4+1] = (digest_[i] >> 16) & 0xFF;
        result[i*4+2] = (digest_[i] >> 8) & 0xFF;
        result[i*4+3] = (digest_[i] >> 0) & 0xFF;
    }
    return result;
}

std::string SHA1::hex_digest() {
    auto d = digest();
    std::stringstream ss;
    for (uint8_t byte : d) {
        ss << std::hex << std::setw(2) << std::setfill('0') << (int)byte;
    }
    return ss.str();
}

std::vector<uint8_t> SHA1::hash(const std::string& data) {
    SHA1 sha1;
    sha1.update(data);
    return sha1.digest();
}

std::vector<uint8_t> SHA1::hash(const std::vector<uint8_t>& data) {
    SHA1 sha1;
    sha1.update(data.data(), data.size());
    return sha1.digest();
}

} // namespace torrent
