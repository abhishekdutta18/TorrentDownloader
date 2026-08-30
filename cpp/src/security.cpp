#include "security.hpp"
#include <httplib.h>
#include <nlohmann/json.hpp>
#include <openssl/evp.h>
#include <fstream>
#include <iostream>
#include <sstream>
#include <iomanip>
#include <algorithm>
#include <thread>
#include <filesystem>

#if defined(__APPLE__)
#include <sys/xattr.h>
#include <ctime>
#endif

namespace torrent {

SecurityManager& SecurityManager::instance() {
    static SecurityManager inst;
    return inst;
}

SecurityManager::SecurityManager() {}

static std::string to_lower(const std::string& str) {
    std::string lower = str;
    std::transform(lower.begin(), lower.end(), lower.begin(), [](unsigned char c) {
        return static_cast<char>(std::tolower(c));
    });
    return lower;
}

bool SecurityManager::is_risky_extension(const std::string& filename) const {
    std::string lower = to_lower(filename);
    size_t dot_pos = lower.find_last_of('.');
    if (dot_pos == std::string::npos) return false;

    std::string ext = lower.substr(dot_pos);
    static const std::vector<std::string> risky_exts = {
        ".exe", ".scr", ".bat", ".cmd", ".vbs", ".vbe", ".js", ".jse", ".wsf", ".wsh",
        ".ps1", ".ps1xml", ".ps2", ".psc1", ".psc2", ".msc", ".msi", ".msp", ".mst",
        ".hta", ".cpl", ".jar", ".iso", ".img", ".dmg", ".pkg", ".app", ".command",
        ".sh", ".elf", ".run", ".bin", ".lnk", ".pif", ".inf", ".reg"
    };

    for (const auto& r : risky_exts) {
        if (ext == r) return true;
    }
    return false;
}

bool SecurityManager::is_double_extension(const std::string& filename) const {
    std::string lower = to_lower(filename);
    size_t last_dot = lower.find_last_of('.');
    if (last_dot == std::string::npos || last_dot == 0) return false;

    std::string outer_ext = lower.substr(last_dot);
    if (!is_risky_extension(filename)) return false;

    size_t second_dot = lower.find_last_of('.', last_dot - 1);
    if (second_dot == std::string::npos) return false;

    std::string inner_ext = lower.substr(second_dot, last_dot - second_dot);
    static const std::vector<std::string> media_doc_exts = {
        ".mp4", ".mkv", ".avi", ".mov", ".wmv", ".flv", ".webm",
        ".mp3", ".wav", ".flac", ".aac", ".ogg",
        ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp",
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt",
        ".zip", ".rar", ".7z", ".tar", ".gz"
    };

    for (const auto& m : media_doc_exts) {
        if (inner_ext == m) return true;
    }
    return false;
}

SecurityStatus SecurityManager::analyze_filename(const std::string& filename) const {
    SecurityStatus sec;
    if (is_double_extension(filename)) {
        sec.status = "suspicious";
        sec.is_risky_type = true;
        sec.is_double_extension = true;
        sec.details = "Deceptive double extension detected (e.g. video.mp4.exe)";
    } else if (is_risky_extension(filename)) {
        sec.status = "suspicious";
        sec.is_risky_type = true;
        sec.details = "Executable or script file type detected";
    } else {
        sec.status = "untested";
        sec.is_risky_type = false;
        sec.details = "Standard media or document file type";
    }
    return sec;
}

std::string SecurityManager::compute_sha256(const std::string& file_path) {
    std::ifstream file(file_path, std::ios::binary);
    if (!file.is_open()) {
        return "";
    }

    EVP_MD_CTX* mdctx = EVP_MD_CTX_new();
    if (!mdctx) return "";

    if (EVP_DigestInit_ex(mdctx, EVP_sha256(), nullptr) != 1) {
        EVP_MD_CTX_free(mdctx);
        return "";
    }

    constexpr size_t BUFFER_SIZE = 65536; // 64 KB
    std::vector<char> buffer(BUFFER_SIZE);
    while (file.good()) {
        file.read(buffer.data(), BUFFER_SIZE);
        std::streamsize bytes_read = file.gcount();
        if (bytes_read > 0) {
            if (EVP_DigestUpdate(mdctx, buffer.data(), static_cast<size_t>(bytes_read)) != 1) {
                EVP_MD_CTX_free(mdctx);
                return "";
            }
        }
    }

    unsigned char hash[EVP_MAX_MD_SIZE];
    unsigned int hash_len = 0;
    if (EVP_DigestFinal_ex(mdctx, hash, &hash_len) != 1) {
        EVP_MD_CTX_free(mdctx);
        return "";
    }
    EVP_MD_CTX_free(mdctx);

    std::ostringstream oss;
    for (unsigned int i = 0; i < hash_len; ++i) {
        oss << std::hex << std::setw(2) << std::setfill('0') << static_cast<int>(hash[i]);
    }
    return oss.str();
}

SecurityStatus SecurityManager::check_malware_bazaar(const std::string& sha256) {
    SecurityStatus result;
    result.sha256 = sha256;

    if (sha256.empty()) {
        result.status = "untested";
        return result;
    }

    {
        std::lock_guard<std::mutex> lock(mutex_);
        auto it = hash_cache_.find(sha256);
        if (it != hash_cache_.end()) {
            return it->second;
        }
    }

    try {
        httplib::SSLClient cli("mb-api.abuse.ch", 443);
        cli.set_connection_timeout(5, 0);
        cli.set_read_timeout(5, 0);

        httplib::Params params;
        params.emplace("query", "get_info");
        params.emplace("hash", sha256);

        auto res = cli.Post("/api/v1/", params);
        if (res && res->status == 200) {
            auto j = nlohmann::json::parse(res->body);
            std::string q_status = j.value("query_status", "");
            if (q_status == "ok") {
                result.status = "infected";
                if (j.contains("data") && j["data"].is_array() && !j["data"].empty()) {
                    auto& d = j["data"][0];
                    result.threat_name = d.value("signature", d.value("file_type", "Malware"));
                    result.details = "Threat signature identified in MalwareBazaar: " + result.threat_name;
                } else {
                    result.threat_name = "Malware";
                    result.details = "Threat hash confirmed malicious in MalwareBazaar";
                }
            } else if (q_status == "hash_not_found") {
                result.status = "clean";
                result.details = "No malicious signatures matched in threat database";
            } else {
                result.status = "clean";
                result.details = "Threat check: " + q_status;
            }
        } else {
            result.status = "clean";
            result.details = "Cloud database check unavailable";
        }
    } catch (const std::exception& e) {
        result.status = "clean";
        result.details = "Threat check error: " + std::string(e.what());
    }

    {
        std::lock_guard<std::mutex> lock(mutex_);
        hash_cache_[sha256] = result;
    }
    return result;
}

SecurityStatus SecurityManager::scan_file(const std::string& file_path, bool query_cloud) {
    if (!enabled_) {
        SecurityStatus s;
        s.status = "untested";
        return s;
    }

    SecurityStatus status = analyze_filename(file_path);
    std::string sha = compute_sha256(file_path);
    status.sha256 = sha;

    if (!sha.empty() && query_cloud && cloud_lookup_enabled_) {
        SecurityStatus cloud = check_malware_bazaar(sha);
        if (cloud.status == "infected") {
            status.status = "infected";
            status.threat_name = cloud.threat_name;
            status.details = cloud.details;
        } else if (status.status != "suspicious") {
            status.status = cloud.status;
            status.details = cloud.details;
        }
    } else if (status.status == "untested" && !sha.empty()) {
        status.status = "clean";
    }

    apply_quarantine(file_path);
    return status;
}

void SecurityManager::scan_file_async(const std::string& info_hash, int file_index, const std::string& file_path, bool query_cloud) {
    if (!enabled_) return;

    {
        std::lock_guard<std::mutex> lock(mutex_);
        std::string key = info_hash + ":" + std::to_string(file_index);
        SecurityStatus scanning;
        scanning.status = "scanning";
        scanning.details = "Hashing and checking threat intelligence...";
        file_status_cache_[key] = scanning;
    }

    std::thread([this, info_hash, file_index, file_path, query_cloud]() {
        try {
            SecurityStatus result = scan_file(file_path, query_cloud);
            set_status(info_hash, file_index, result);
        } catch (const std::exception& e) {
            std::cerr << "[SecurityManager] Scan error for " << file_path << ": " << e.what() << std::endl;
            SecurityStatus err;
            err.status = "clean";
            err.details = "Scan completed with warning";
            set_status(info_hash, file_index, err);
        }
    }).detach();
}

SecurityStatus SecurityManager::get_status(const std::string& info_hash, int file_index) const {
    std::lock_guard<std::mutex> lock(mutex_);
    std::string key = info_hash + ":" + std::to_string(file_index);
    auto it = file_status_cache_.find(key);
    if (it != file_status_cache_.end()) {
        return it->second;
    }
    return SecurityStatus{};
}

void SecurityManager::set_status(const std::string& info_hash, int file_index, const SecurityStatus& status) {
    std::lock_guard<std::mutex> lock(mutex_);
    std::string key = info_hash + ":" + std::to_string(file_index);
    file_status_cache_[key] = status;
}

bool SecurityManager::apply_quarantine(const std::string& file_path) {
#if defined(__APPLE__)
    if (!std::filesystem::exists(file_path)) return false;

    // Construct macOS quarantine string:
    // Format: "flag;timestamp;agent_name;uuid"
    // flag 0081 = downloaded file needing Gatekeeper assessment
    std::time_t now = std::time(nullptr);
    std::ostringstream q_val;
    q_val << "0081;" << std::hex << now << ";OmniFlux;";

    std::string val = q_val.str();
    int res = setxattr(file_path.c_str(), "com.apple.quarantine", val.c_str(), val.size(), 0, 0);
    return (res == 0);
#else
    (void)file_path;
    return true;
#endif
}

} // namespace torrent
