#pragma once

#include <libtorrent/session.hpp>
#include <libtorrent/add_torrent_params.hpp>
#include <libtorrent/torrent_handle.hpp>
#include <libtorrent/torrent_status.hpp>
#include <string>
#include <vector>
#include <mutex>
#include <atomic>
#include <thread>

namespace torrent {

struct TorrentState {
    std::string info_hash;
    std::string name;
    std::string save_path;
    float progress = 0.0f; // 0.0 to 1.0
    int download_rate = 0; // bytes per second
    int upload_rate = 0; // bytes per second
    int num_peers = 0;
    int num_seeds = 0;
    std::string state;
    std::int64_t total_done = 0;
    std::int64_t total_wanted = 0;
    std::int64_t total_upload = 0;
    std::string magnet_uri;
    int eta_seconds = 0;
    bool is_paused = false;
    bool is_finished = false;
    bool is_seeding = false;
};

class Engine {
public:
    Engine();
    ~Engine();

    std::string version() const;
    void enable_dht_and_pex();
    std::string add_torrent_file(const std::string& filepath, const std::string& save_path);
    std::string add_magnet_link(const std::string& magnet_uri, const std::string& save_path);
    std::vector<std::string> get_active_torrents() const;
    TorrentState get_torrent_state(const std::string& info_hash) const;
    std::vector<TorrentState> get_all_torrent_states() const;

    // New features:
    void pause_torrent(const std::string& info_hash);
    void resume_torrent(const std::string& info_hash);
    void stop_torrent(const std::string& info_hash);
    void pause_all_torrents();
    void resume_all_torrents();
    void stop_all_torrents();
    void remove_torrent(const std::string& info_hash, bool delete_files = true);
    void prioritize_for_streaming(const std::string& info_hash, int file_index);
    void prioritize_range(const std::string& info_hash, int file_index, std::int64_t byte_offset, std::int64_t byte_length = 10 * 1024 * 1024);
    void set_download_limit(int limit_kbps);
    void set_upload_limit(int limit_kbps);
    int get_download_limit() const;
    int get_upload_limit() const;


    void save_session_state();
    void load_resume_data();

    struct PieceInfo {
        int num_pieces = 0;
        int piece_length = 0;
        std::string bitfield; // '1' if downloaded, '0' if missing
        std::vector<int> availability; // Swarm peer availability per piece
    };
    PieceInfo get_piece_info(const std::string& info_hash) const;

    struct SessionStats {
        int dht_nodes = 0;
        int dht_torrents = 0;
        int num_peers = 0;
        std::int64_t total_download = 0;
        std::int64_t total_upload = 0;
        int download_rate = 0;
        int upload_rate = 0;
        int disk_write_queue = 0;
        int disk_read_queue = 0;
        int listen_port = 0;
    };
    SessionStats get_session_stats() const;

    struct FileInfo {
        int index;
        std::string name;
        std::string save_path;
        std::string path;
        long long size;
        float progress;
        int priority;
        std::string security_status = "untested"; // "clean", "suspicious", "infected", "scanning", "untested"
        std::string threat_name = "";
        std::string sha256 = "";
        bool is_risky_type = false;
        bool is_double_extension = false;
        std::string security_details = "";
    };
    std::vector<FileInfo> get_torrent_files(const std::string& info_hash) const;
    void prioritize_files(const std::string& info_hash, const std::vector<int>& priorities);
    void scan_torrent_file_async(const std::string& info_hash, int file_index);

    struct PeerInfo {
        std::string ip;
        std::string client;
        int down_speed = 0;
        int up_speed = 0;
        float progress = 0.0f;
        std::string flags;
        std::string source;
        std::int64_t total_download = 0;
        std::int64_t total_upload = 0;
    };
    std::vector<PeerInfo> get_peer_info(const std::string& info_hash) const;

    struct TrackerInfo {
        std::string url;
        std::string status;
        std::string message;
        int num_peers = 0;
        int num_seeds = 0;
        int num_downloads = 0;
    };
    std::vector<TrackerInfo> get_trackers(const std::string& info_hash) const;
    void force_reannounce(const std::string& info_hash);
    void add_tracker(const std::string& info_hash, const std::string& tracker_url);

    void set_sequential_download(const std::string& info_hash, bool sequential);

    void set_proxy(int proxy_type, const std::string& hostname, int port);
    void set_encryption(bool require_encryption);
    void set_listen_interfaces(const std::string& interfaces);
    int get_proxy_type() const;
    bool get_require_encryption() const;
    std::string get_listen_interfaces() const;
    void poll_alerts_loop();

private:
    std::string hash_to_string(const lt::info_hash_t& ih) const;

    mutable std::mutex mutex_;
    lt::session session_;
    std::atomic<bool> running_;
    std::thread alert_thread_;
};

} // namespace torrent
