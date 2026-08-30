#include "bencode.hpp"
#include <charconv>

namespace torrent {

BencodeValue BencodeParser::decode(std::string_view data) {
    return parse(data);
}

BencodeValue BencodeParser::parse(std::string_view& data) {
    if (data.empty()) throw std::invalid_argument("Unexpected end of bencode data");

    char c = data.front();
    if (c == 'i') return BencodeValue(parse_int(data));
    if (c == 'l') return BencodeValue(parse_list(data));
    if (c == 'd') return BencodeValue(parse_dict(data));
    if (c >= '0' && c <= '9') return BencodeValue(parse_string(data));

    throw std::invalid_argument(std::string("Invalid bencode character: ") + c);
}

BencodeInt BencodeParser::parse_int(std::string_view& data) {
    data.remove_prefix(1); // remove 'i'
    size_t e_pos = data.find('e');
    if (e_pos == std::string_view::npos) throw std::invalid_argument("Unterminated integer");

    BencodeInt value = 0;
    auto [ptr, ec] = std::from_chars(data.data(), data.data() + e_pos, value);
    if (ec != std::errc()) throw std::invalid_argument("Invalid integer format");

    data.remove_prefix(e_pos + 1); // remove up to and including 'e'
    return value;
}

BencodeString BencodeParser::parse_string(std::string_view& data) {
    size_t colon_pos = data.find(':');
    if (colon_pos == std::string_view::npos) throw std::invalid_argument("Unterminated string length");

    size_t length = 0;
    auto [ptr, ec] = std::from_chars(data.data(), data.data() + colon_pos, length);
    if (ec != std::errc()) throw std::invalid_argument("Invalid string length format");

    data.remove_prefix(colon_pos + 1); // remove length and ':'
    
    if (data.size() < length) throw std::invalid_argument("String data shorter than specified length");

    BencodeString str(data.data(), length);
    data.remove_prefix(length);
    return str;
}

BencodeList BencodeParser::parse_list(std::string_view& data) {
    data.remove_prefix(1); // remove 'l'
    BencodeList list;
    while (!data.empty() && data.front() != 'e') {
        list.push_back(parse(data));
    }
    if (data.empty()) throw std::invalid_argument("Unterminated list");
    data.remove_prefix(1); // remove 'e'
    return list;
}

BencodeDict BencodeParser::parse_dict(std::string_view& data) {
    data.remove_prefix(1); // remove 'd'
    BencodeDict dict;
    while (!data.empty() && data.front() != 'e') {
        BencodeValue key = parse(data);
        if (key.type != BencodeValue::Type::String) {
            throw std::invalid_argument("Dictionary key must be a string");
        }
        BencodeValue value = parse(data);
        dict[key.s] = std::move(value);
    }
    if (data.empty()) throw std::invalid_argument("Unterminated dictionary");
    data.remove_prefix(1); // remove 'e'
    return dict;
}

std::string BencodeParser::encode(const BencodeValue& value) {
    std::string result;
    switch (value.type) {
        case BencodeValue::Type::Integer:
            result += "i" + std::to_string(value.i) + "e";
            break;
        case BencodeValue::Type::String:
            result += std::to_string(value.s.size()) + ":" + value.s;
            break;
        case BencodeValue::Type::List:
            result += "l";
            for (const auto& item : *value.l) {
                result += encode(item);
            }
            result += "e";
            break;
        case BencodeValue::Type::Dict:
            result += "d";
            for (const auto& [k, v] : *value.d) {
                // Encode key
                BencodeValue key_val(k);
                result += encode(key_val);
                // Encode value
                result += encode(v);
            }
            result += "e";
            break;
    }
    return result;
}

} // namespace torrent
