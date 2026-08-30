#pragma once

#include <string>
#include <vector>
#include <unordered_map>
#include <mutex>
#include <memory>
#include <atomic>

namespace torrent {

struct SecurityStatus {
    std::string status = "untested"; // "clean", "suspicious", "infected", "scanning", "untested"
    std::string threat_name = "";
    std::string sha256 = "";
    bool is_risky_type = false;
    bool is_double_extension = false;
    std::string details = "";
};

class SecurityManager {
public:
    static SecurityManager& instance();

    // Extension and naming heuristics
    bool is_risky_extension(const std::string& filename) const;
    bool is_double_extension(const std::string& filename) const;
    SecurityStatus analyze_filename(const std::string& filename) const;

    // File hashing & scanning
    std::string compute_sha256(const std::string& file_path);
    SecurityStatus scan_file(const std::string& file_path, bool query_cloud = true);
    
    // Async file scanning
    void scan_file_async(const std::string& info_hash, int file_index, const std::string& file_path, bool query_cloud = true);
    
    // Query cache
    SecurityStatus get_status(const std::string& info_hash, int file_index) const;
    void set_status(const std::string& info_hash, int file_index, const SecurityStatus& status);

    // Settings
    void set_enabled(bool enabled) { enabled_ = enabled; }
    bool is_enabled() const { return enabled_; }
    void set_cloud_lookup_enabled(bool enabled) { cloud_lookup_enabled_ = enabled; }
    bool is_cloud_lookup_enabled() const { return cloud_lookup_enabled_; }
    void set_auto_skip_risky(bool skip) { auto_skip_risky_ = skip; }
    bool is_auto_skip_risky() const { return auto_skip_risky_; }

    // macOS Gatekeeper Quarantine
    static bool apply_quarantine(const std::string& file_path);

private:
    SecurityManager();
    ~SecurityManager() = default;

    SecurityStatus check_malware_bazaar(const std::string& sha256);

    std::atomic<bool> enabled_{true};
    std::atomic<bool> cloud_lookup_enabled_{true};
    std::atomic<bool> auto_skip_risky_{false};

    mutable std::mutex mutex_;
    // key: info_hash + ":" + std::to_string(file_index)
    std::unordered_map<std::string, SecurityStatus> file_status_cache_;
    // key: sha256
    std::unordered_map<std::string, SecurityStatus> hash_cache_;
};

} // namespace torrent
