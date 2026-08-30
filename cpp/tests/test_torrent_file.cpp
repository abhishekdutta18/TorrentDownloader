#include <catch2/catch_test_macros.hpp>
#include "torrent_file.hpp"
#include "bencode.hpp"

TEST_CASE("TorrentFile Parsing", "[torrent_file]") {
    using namespace torrent;

    SECTION("Parse Single File Torrent") {
        // Construct a simple bencoded torrent file string
        // d8:announce13:http://url...4:infod6:lengthi1024e4:name8:test.txt12:piece lengthi512e6:pieces40:...ee
        std::string pieces(40, 'a'); // 2 dummy pieces (40 bytes total)
        std::string bencoded = "d8:announce22:http://tracker.com/ann4:infod6:lengthi1024e4:name8:test.txt12:piece lengthi512e6:pieces40:" + pieces + "ee";
        
        TorrentFile tf = TorrentFile::from_string(bencoded);
        
        REQUIRE(tf.announce == "http://tracker.com/ann");
        REQUIRE(tf.name == "test.txt");
        REQUIRE(tf.piece_length == 512);
        REQUIRE(tf.pieces.size() == 2);
        REQUIRE(tf.files.size() == 1);
        REQUIRE(tf.files[0].length == 1024);
        REQUIRE(tf.files[0].path[0] == "test.txt");
        REQUIRE(tf.total_size() == 1024);
        REQUIRE(tf.info_hash.size() == 20); // Info hash correctly calculated
    }

    SECTION("Parse Multi File Torrent") {
        std::string pieces(20, 'b'); // 1 piece
        std::string bencoded = "d8:announce22:http://tracker.com/ann4:infod5:filesld6:lengthi100e4:pathl5:file1eed6:lengthi200e4:pathl4:dir15:file2eee4:name8:test_dir12:piece lengthi512e6:pieces20:" + pieces + "ee";
        
        TorrentFile tf = TorrentFile::from_string(bencoded);
        
        REQUIRE(tf.announce == "http://tracker.com/ann");
        REQUIRE(tf.name == "test_dir");
        REQUIRE(tf.piece_length == 512);
        REQUIRE(tf.pieces.size() == 1);
        REQUIRE(tf.files.size() == 2);
        
        REQUIRE(tf.files[0].length == 100);
        REQUIRE(tf.files[0].path.size() == 1);
        REQUIRE(tf.files[0].path[0] == "file1");

        REQUIRE(tf.files[1].length == 200);
        REQUIRE(tf.files[1].path.size() == 2);
        REQUIRE(tf.files[1].path[0] == "dir1");
        REQUIRE(tf.files[1].path[1] == "file2");
        
        REQUIRE(tf.total_size() == 300);
    }
}
