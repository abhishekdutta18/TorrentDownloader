#pragma once

#include <string>
#include <vector>
#include <map>
#include <memory>
#include <variant>
#include <stdexcept>
#include <string_view>

namespace torrent {

struct BencodeValue;

using BencodeInt = int64_t;
using BencodeString = std::string;
using BencodeList = std::vector<BencodeValue>;
using BencodeDict = std::map<std::string, BencodeValue>;

struct BencodeValue {
    enum class Type { Integer, String, List, Dict };
    Type type;
    
    // Using a smart pointer to a variant to handle recursive incomplete types easily,
    // or we can just use std::shared_ptr for List and Dict.
    // For simplicity, we'll store pointers to the complex types.
    BencodeInt i = 0;
    BencodeString s;
    std::shared_ptr<BencodeList> l;
    std::shared_ptr<BencodeDict> d;

    BencodeValue() : type(Type::Integer), i(0) {}
    explicit BencodeValue(BencodeInt val) : type(Type::Integer), i(val) {}
    explicit BencodeValue(BencodeString val) : type(Type::String), s(std::move(val)) {}
    explicit BencodeValue(BencodeList val) : type(Type::List), l(std::make_shared<BencodeList>(std::move(val))) {}
    explicit BencodeValue(BencodeDict val) : type(Type::Dict), d(std::make_shared<BencodeDict>(std::move(val))) {}

    // Convenience accessors
    BencodeInt get_int() const { if (type != Type::Integer) throw std::bad_cast(); return i; }
    BencodeString get_string() const { if (type != Type::String) throw std::bad_cast(); return s; }
    const BencodeList& get_list() const { if (type != Type::List) throw std::bad_cast(); return *l; }
    const BencodeDict& get_dict() const { if (type != Type::Dict) throw std::bad_cast(); return *d; }
};

class BencodeParser {
public:
    static BencodeValue decode(std::string_view data);
    static std::string encode(const BencodeValue& value);

private:
    static BencodeValue parse(std::string_view& data);
    static BencodeInt parse_int(std::string_view& data);
    static BencodeString parse_string(std::string_view& data);
    static BencodeList parse_list(std::string_view& data);
    static BencodeDict parse_dict(std::string_view& data);
};

} // namespace torrent
