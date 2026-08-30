#include <catch2/catch_test_macros.hpp>
#include "bencode.hpp"

TEST_CASE("Bencode Decoding", "[bencode]") {
    using namespace torrent;

    SECTION("Decode Integer") {
        auto val = BencodeParser::decode("i42e");
        REQUIRE(val.type == BencodeValue::Type::Integer);
        REQUIRE(val.get_int() == 42);

        auto val_neg = BencodeParser::decode("i-42e");
        REQUIRE(val_neg.get_int() == -42);
        
        auto val_zero = BencodeParser::decode("i0e");
        REQUIRE(val_zero.get_int() == 0);
    }

    SECTION("Decode String") {
        auto val = BencodeParser::decode("4:spam");
        REQUIRE(val.type == BencodeValue::Type::String);
        REQUIRE(val.get_string() == "spam");

        auto val_empty = BencodeParser::decode("0:");
        REQUIRE(val_empty.get_string() == "");
    }

    SECTION("Decode List") {
        auto val = BencodeParser::decode("l4:spami42ee");
        REQUIRE(val.type == BencodeValue::Type::List);
        auto list = val.get_list();
        REQUIRE(list.size() == 2);
        REQUIRE(list[0].get_string() == "spam");
        REQUIRE(list[1].get_int() == 42);
    }

    SECTION("Decode Dictionary") {
        auto val = BencodeParser::decode("d3:bar4:spam3:fooi42ee");
        REQUIRE(val.type == BencodeValue::Type::Dict);
        auto dict = val.get_dict();
        REQUIRE(dict.size() == 2);
        REQUIRE(dict.at("bar").get_string() == "spam");
        REQUIRE(dict.at("foo").get_int() == 42);
    }
}

TEST_CASE("Bencode Encoding", "[bencode]") {
    using namespace torrent;

    SECTION("Encode Integer") {
        REQUIRE(BencodeParser::encode(BencodeValue(static_cast<BencodeInt>(42))) == "i42e");
        REQUIRE(BencodeParser::encode(BencodeValue(static_cast<BencodeInt>(-42))) == "i-42e");
    }

    SECTION("Encode String") {
        REQUIRE(BencodeParser::encode(BencodeValue(BencodeString("spam"))) == "4:spam");
    }

    SECTION("Encode List") {
        BencodeList list;
        list.push_back(BencodeValue(BencodeString("spam")));
        list.push_back(BencodeValue(static_cast<BencodeInt>(42)));
        REQUIRE(BencodeParser::encode(BencodeValue(list)) == "l4:spami42ee");
    }

    SECTION("Encode Dictionary") {
        BencodeDict dict;
        dict["bar"] = BencodeValue(BencodeString("spam"));
        dict["foo"] = BencodeValue(static_cast<BencodeInt>(42));
        REQUIRE(BencodeParser::encode(BencodeValue(dict)) == "d3:bar4:spam3:fooi42ee");
    }
}
