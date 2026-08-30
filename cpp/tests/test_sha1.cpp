#include <catch2/catch_test_macros.hpp>
#include "sha1.hpp"

TEST_CASE("SHA1 hashes match expected outputs", "[sha1]") {
    using namespace torrent;

    SECTION("Empty string") {
        SHA1 sha1;
        sha1.update("");
        REQUIRE(sha1.hex_digest() == "da39a3ee5e6b4b0d3255bfef95601890afd80709");
    }

    SECTION("Short string") {
        SHA1 sha1;
        sha1.update("abc");
        REQUIRE(sha1.hex_digest() == "a9993e364706816aba3e25717850c26c9cd0d89d");
    }

    SECTION("Longer string") {
        SHA1 sha1;
        sha1.update("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq");
        REQUIRE(sha1.hex_digest() == "84983e441c3bd26ebaae4aa1f95129e5e54670f1");
    }

    SECTION("Multiple updates") {
        SHA1 sha1;
        sha1.update("abc");
        sha1.update("dbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq");
        REQUIRE(sha1.hex_digest() == "84983e441c3bd26ebaae4aa1f95129e5e54670f1");
    }
}
