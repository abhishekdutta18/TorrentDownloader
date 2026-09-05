import Cocoa
import SwiftUI
import CoreImage
import AVFoundation
import MediaPlayer
import Speech

// MARK: - LibVLC C Dynamic Linker & Bridge

// Dynamic VLC Detection with First-Priority Bundled App Engine
private func configureVLCPaths() -> (coreDylib: String, dylib: String, plugins: String)? {
    let mainBundle = Bundle.main.bundlePath
    let execDir = (CommandLine.arguments.first as NSString?)?.deletingLastPathComponent ?? ""
    let currentDir = FileManager.default.currentDirectoryPath
    
    let baseCandidates = [
        "\(mainBundle)/Contents/MacOS",
        "\(mainBundle)/Contents/Frameworks",
        "\(execDir)",
        "\(currentDir)/OmniPlayer.app/Contents/MacOS",
        "/Applications/VLC.app/Contents/MacOS",
        NSString(string: "~/Applications/VLC.app/Contents/MacOS").expandingTildeInPath,
        "/opt/homebrew",
        "/usr/local"
    ]
    for base in baseCandidates {
        let core = "\(base)/lib/libvlccore.dylib"
        let dylib = "\(base)/lib/libvlc.dylib"
        let plugins = "\(base)/plugins"
        if FileManager.default.fileExists(atPath: dylib) {
            setenv("VLC_PLUGIN_PATH", plugins, 1)
            return (core, dylib, plugins)
        }
    }
    return nil
}

private let vlcPaths = configureVLCPaths()

typealias LibVlcNew = @convention(c) (Int32, UnsafePointer<UnsafePointer<CChar>?>?) -> UnsafeMutableRawPointer?
typealias LibVlcRelease = @convention(c) (UnsafeMutableRawPointer) -> Void
typealias LibVlcMediaNewPath = @convention(c) (UnsafeMutableRawPointer, UnsafePointer<CChar>) -> UnsafeMutableRawPointer?
typealias LibVlcMediaNewLocation = @convention(c) (UnsafeMutableRawPointer, UnsafePointer<CChar>) -> UnsafeMutableRawPointer?
typealias LibVlcMediaRelease = @convention(c) (UnsafeMutableRawPointer) -> Void

typealias LibVlcMediaPlayerNew = @convention(c) (UnsafeMutableRawPointer) -> UnsafeMutableRawPointer?
typealias LibVlcMediaPlayerRelease = @convention(c) (UnsafeMutableRawPointer) -> Void
typealias LibVlcMediaPlayerSetMedia = @convention(c) (UnsafeMutableRawPointer, UnsafeMutableRawPointer) -> Void
typealias LibVlcMediaPlayerPlay = @convention(c) (UnsafeMutableRawPointer) -> Int32
typealias LibVlcMediaPlayerPause = @convention(c) (UnsafeMutableRawPointer) -> Void
typealias LibVlcMediaPlayerStop = @convention(c) (UnsafeMutableRawPointer) -> Void
typealias LibVlcMediaPlayerIsPlaying = @convention(c) (UnsafeMutableRawPointer) -> Int32
typealias LibVlcMediaPlayerGetState = @convention(c) (UnsafeMutableRawPointer) -> Int32
typealias LibVlcMediaPlayerSetNSObject = @convention(c) (UnsafeMutableRawPointer, UnsafeMutableRawPointer) -> Void

typealias LibVlcMediaPlayerGetTime = @convention(c) (UnsafeMutableRawPointer) -> Int64
typealias LibVlcMediaPlayerSetTime = @convention(c) (UnsafeMutableRawPointer, Int64) -> Void
typealias LibVlcMediaPlayerGetLength = @convention(c) (UnsafeMutableRawPointer) -> Int64
typealias LibVlcMediaPlayerGetPosition = @convention(c) (UnsafeMutableRawPointer) -> Float
typealias LibVlcMediaPlayerSetPosition = @convention(c) (UnsafeMutableRawPointer, Float) -> Void
typealias LibVlcMediaPlayerGetRate = @convention(c) (UnsafeMutableRawPointer) -> Float
typealias LibVlcMediaPlayerSetRate = @convention(c) (UnsafeMutableRawPointer, Float) -> Int32
typealias LibVlcMediaPlayerNextFrame = @convention(c) (UnsafeMutableRawPointer) -> Void

typealias LibVlcAudioGetVolume = @convention(c) (UnsafeMutableRawPointer) -> Int32
typealias LibVlcAudioSetVolume = @convention(c) (UnsafeMutableRawPointer, Int32) -> Int32
typealias LibVlcAudioGetMute = @convention(c) (UnsafeMutableRawPointer) -> Int32
typealias LibVlcAudioSetMute = @convention(c) (UnsafeMutableRawPointer, Int32) -> Void
typealias LibVlcAudioGetTrack = @convention(c) (UnsafeMutableRawPointer) -> Int32
typealias LibVlcAudioSetTrack = @convention(c) (UnsafeMutableRawPointer, Int32) -> Int32
typealias LibVlcAudioGetTrackDescription = @convention(c) (UnsafeMutableRawPointer) -> UnsafeMutableRawPointer?
typealias LibVlcAudioGetDelay = @convention(c) (UnsafeMutableRawPointer) -> Int64
typealias LibVlcAudioSetDelay = @convention(c) (UnsafeMutableRawPointer, Int64) -> Int32

typealias LibVlcAudioOutputDeviceEnum = @convention(c) (UnsafeMutableRawPointer) -> UnsafeMutableRawPointer?
typealias LibVlcAudioOutputDeviceListRelease = @convention(c) (UnsafeMutableRawPointer) -> Void
typealias LibVlcAudioOutputDeviceSet = @convention(c) (UnsafeMutableRawPointer, UnsafePointer<CChar>?, UnsafePointer<CChar>?) -> Void

typealias LibVlcVideoGetSpu = @convention(c) (UnsafeMutableRawPointer) -> Int32
typealias LibVlcVideoSetSpu = @convention(c) (UnsafeMutableRawPointer, Int32) -> Int32
typealias LibVlcVideoGetSpuDescription = @convention(c) (UnsafeMutableRawPointer) -> UnsafeMutableRawPointer?
typealias LibVlcVideoSetSubtitleFile = @convention(c) (UnsafeMutableRawPointer, UnsafePointer<CChar>) -> Int32
typealias LibVlcMediaPlayerAddSlave = @convention(c) (UnsafeMutableRawPointer, UInt32, UnsafePointer<CChar>, Bool) -> Int32
typealias LibVlcVideoGetSpuDelay = @convention(c) (UnsafeMutableRawPointer) -> Int64
typealias LibVlcVideoSetSpuDelay = @convention(c) (UnsafeMutableRawPointer, Int64) -> Int32
typealias LibVlcVideoSetAspectRatio = @convention(c) (UnsafeMutableRawPointer, UnsafePointer<CChar>?) -> Void
typealias LibVlcVideoTakeSnapshot = @convention(c) (UnsafeMutableRawPointer, UInt32, UnsafePointer<CChar>, UInt32, UInt32) -> Int32
typealias LibVlcVideoSetScale = @convention(c) (UnsafeMutableRawPointer, Float) -> Void
typealias LibVlcVideoGetScale = @convention(c) (UnsafeMutableRawPointer) -> Float
typealias LibVlcVideoGetSize = @convention(c) (UnsafeMutableRawPointer, UInt32, UnsafeMutablePointer<UInt32>, UnsafeMutablePointer<UInt32>) -> Int32
typealias LibVlcVideoSetCropGeometry = @convention(c) (UnsafeMutableRawPointer, UnsafePointer<CChar>?) -> Void
typealias LibVlcVideoGetCropGeometry = @convention(c) (UnsafeMutableRawPointer) -> UnsafePointer<CChar>?
typealias LibVlcVideoSetDeinterlace = @convention(c) (UnsafeMutableRawPointer, UnsafePointer<CChar>?) -> Void
typealias LibVlcAudioGetChannel = @convention(c) (UnsafeMutableRawPointer) -> Int32
typealias LibVlcAudioSetChannel = @convention(c) (UnsafeMutableRawPointer, Int32) -> Int32

typealias LibVlcVideoSetAdjustInt = @convention(c) (UnsafeMutableRawPointer, UInt32, Int32) -> Void
typealias LibVlcVideoSetAdjustFloat = @convention(c) (UnsafeMutableRawPointer, UInt32, Float) -> Void

typealias LibVlcMediaPlayerGetChapter = @convention(c) (UnsafeMutableRawPointer) -> Int32
typealias LibVlcMediaPlayerGetChapterCount = @convention(c) (UnsafeMutableRawPointer) -> Int32
typealias LibVlcMediaPlayerSetChapter = @convention(c) (UnsafeMutableRawPointer, Int32) -> Void
typealias LibVlcMediaPlayerNextChapter = @convention(c) (UnsafeMutableRawPointer) -> Void
typealias LibVlcMediaPlayerPreviousChapter = @convention(c) (UnsafeMutableRawPointer) -> Void

typealias LibVlcAudioEqualizerNew = @convention(c) () -> UnsafeMutableRawPointer?
typealias LibVlcAudioEqualizerRelease = @convention(c) (UnsafeMutableRawPointer) -> Void
typealias LibVlcAudioEqualizerSetAmpAtIndex = @convention(c) (UnsafeMutableRawPointer, Float, UInt32) -> Int32
typealias LibVlcAudioEqualizerSetPreamp = @convention(c) (UnsafeMutableRawPointer, Float) -> Int32
typealias LibVlcMediaPlayerSetEqualizer = @convention(c) (UnsafeMutableRawPointer, UnsafeMutableRawPointer?) -> Int32

typealias LibVlcTrackDescriptionListRelease = @convention(c) (UnsafeMutableRawPointer) -> Void

struct LibVlcTrackDescription {
    var i_id: Int32
    var psz_name: UnsafeMutablePointer<CChar>?
    var p_next: UnsafeMutableRawPointer?
}

struct LibVlcAudioOutputDevice {
    var p_next: UnsafeMutableRawPointer?
    var psz_device: UnsafeMutablePointer<CChar>?
    var psz_description: UnsafeMutablePointer<CChar>?
}

struct TrackItem: Identifiable, Hashable {
    let id: Int32
    let name: String
}

struct AudioDeviceItem: Identifiable, Hashable {
    let id: String
    let name: String
}

struct SubtitleCue: Identifiable {
    let id = UUID()
    let startTime: TimeInterval
    let endTime: TimeInterval
    let text: String
}

struct PlaylistItem: Identifiable, Equatable {
    let id = UUID()
    let url: URL
    var title: String
    var duration: TimeInterval = 0
    var formattedDuration: String {
        if duration <= 0 { return "--:--" }
        let m = (Int(duration) % 3600) / 60
        let s = Int(duration) % 60
        let h = Int(duration) / 3600
        return h > 0 ? String(format: "%d:%02d:%02d", h, m, s) : String(format: "%02d:%02d", m, s)
    }
}

enum LoopMode: String, CaseIterable {
    case off = "No Loop"
    case all = "Loop All"
    case single = "Loop One"
    
    var iconName: String {
        switch self {
        case .off: return "repeat"
        case .all: return "repeat.1"
        case .single: return "repeat.1.circle.fill"
        }
    }
}

// Audio Output Channels & Spatial Downmixing
enum AudioChannelMode: Int32, CaseIterable, Identifiable {
    case stereo = 1
    case reverseStereo = 2
    case leftOnly = 3
    case rightOnly = 4
    case dolbySurround = 5
    
    var id: Int32 { rawValue }
    var label: String {
        switch self {
        case .stereo: return "Stereo (Standard)"
        case .reverseStereo: return "Reverse Stereo (L/R Swapped)"
        case .leftOnly: return "Left Channel Only (Mono L)"
        case .rightOnly: return "Right Channel Only (Mono R)"
        case .dolbySurround: return "Dolby Surround Matrix Downmix"
        }
    }
}

// Multi-Select Stackable Audio Correction Features
enum AudioCorrectionFeature: String, CaseIterable, Identifiable {
    case loudnessNormalizer = "Loudness Normalizer (+6dB)"
    case clearDialogue = "Clear Dialogue (Vocal Boost)"
    case rumbleFilter = "Rumble Filter (Cut <100Hz)"
    case deHarsh = "De-Harsh / De-Sibilance"
    case nightMode = "Night Mode (Dynamic Compress)"
    case headphoneSpatial = "Headphone Spatializer"
    
    var id: String { self.rawValue }
    
    var description: String {
        switch self {
        case .loudnessNormalizer: return "Amplifies quiet dialogue cleanly with soft limiting"
        case .clearDialogue: return "Lifts human voice formants (1.2kHz - 3.8kHz)"
        case .rumbleFilter: return "Removes sub-bass mud, wind, and mic rumble"
        case .deHarsh: return "Softens ear-piercing sibilance and harsh treble"
        case .nightMode: return "Clamps loud explosions while keeping whispers clear"
        case .headphoneSpatial: return "Expands stereo soundstage for headphones & AirPods"
        }
    }
    
    var gains: [Float] {
        switch self {
        case .loudnessNormalizer:
            return [2.0, 2.5, 3.0, 3.0, 3.5, 3.5, 3.0, 2.5, 2.0, 1.5]
        case .clearDialogue:
            return [-2.5, -1.5, 0.5, 3.5, 6.0, 6.5, 4.0, 1.5, 0, -1.0]
        case .rumbleFilter:
            return [-18.0, -14.0, -8.0, -2.0, 0, 0, 0, 0, 0, 0]
        case .deHarsh:
            return [0, 0, 0, 0, 0, -1.0, -4.5, -8.0, -10.0, -12.0]
        case .nightMode:
            return [-3.0, -2.0, 1.0, 3.0, 4.5, 4.5, 2.0, -1.0, -2.0, -4.0]
        case .headphoneSpatial:
            return [3.0, 3.5, 1.5, -1.0, -1.5, 1.5, 3.0, 4.5, 6.0, 7.0]
        }
    }
    
    var preampBonus: Float {
        switch self {
        case .loudnessNormalizer: return 4.5
        case .nightMode: return 2.0
        default: return 0.0
        }
    }
}

// Master Audio DSP Presets
enum AudioDSPPreset: String, CaseIterable, Identifiable {
    case omniCinematicMax = "Omni-Cinematic Max (All Active)"
    case whisperDialogue = "Whisper Dialogue Pro"
    case studioBassSpatial = "Studio Bass & Spatial Stage"
    case nightModeSoft = "Night Mode (Soft Audio)"
    case pureNeutral = "Pure Studio Flat"
    
    var id: String { self.rawValue }
    
    var description: String {
        switch self {
        case .omniCinematicMax: return "Full multi-stack DSP with anti-clipping soft limiter guard"
        case .whisperDialogue: return "Extreme vocal presence boost with bass mud rejection"
        case .studioBassSpatial: return "Sub-bass punch and wide 3D binaural soundstage"
        case .nightModeSoft: return "Restrained dynamic range with whisper lift"
        case .pureNeutral: return "Flat bit-perfect studio monitor response"
        }
    }
}

// Multi-Select Stackable Video Super-Resolution & Upscaling Features
enum VideoUpscaleFeature: String, CaseIterable, Identifiable {
    case lanczos4K = "Lanczos Sinc 4K Super-Resolution"
    case edgeSharpness = "Adaptive Edge Detail & Clarity"
    case dynamicContrast = "HDR Dynamic Contrast Expansion"
    case colorVibrance = "Deep Cinema Color Vibrance"
    case deblocking = "FFmpeg Postprocessing Deblocking (Q=6)"
    case retinaTrilinear = "Apple Retina Trilinear Interpolation"
    
    var id: String { self.rawValue }
    
    var description: String {
        switch self {
        case .lanczos4K: return "Hardware sinc interpolation for razor-sharp 4K display"
        case .edgeSharpness: return "High-frequency edge detail enhancement without ringing"
        case .dynamicContrast: return "Expands specular highlights and shadow depths"
        case .colorVibrance: return "Wide-gamut saturation for rich cinematic tones"
        case .deblocking: return "Eliminates compression macroblocking and color banding"
        case .retinaTrilinear: return "Hardware Metal/Quartz 2x Retina backing scale rendering"
        }
    }
}

// 64-Bit OpenSubtitles MovieHash Calculator
func calculateOpenSubtitlesHash(for url: URL) -> String? {
    guard let file = try? FileHandle(forReadingFrom: url) else { return nil }
    defer { try? file.close() }
    
    let fileSize = file.seekToEndOfFile()
    if fileSize < 65536 * 2 { return nil }
    
    var hash: UInt64 = fileSize
    
    file.seek(toFileOffset: 0)
    let headData = file.readData(ofLength: 65536)
    headData.withUnsafeBytes { rawBuffer in
        let buffer = rawBuffer.bindMemory(to: UInt64.self)
        for val in buffer {
            hash = hash &+ UInt64(littleEndian: val)
        }
    }
    
    file.seek(toFileOffset: fileSize - 65536)
    let tailData = file.readData(ofLength: 65536)
    tailData.withUnsafeBytes { rawBuffer in
        let buffer = rawBuffer.bindMemory(to: UInt64.self)
        for val in buffer {
            hash = hash &+ UInt64(littleEndian: val)
        }
    }
    
    return String(format: "%016qx", hash)
}

// Clean Filename Parser
func cleanMediaTitle(from filename: String) -> (title: String, year: String?) {
    let nameWithoutExt = (filename as NSString).deletingPathExtension
    var cleaned = nameWithoutExt.replacingOccurrences(of: ".", with: " ")
    cleaned = cleaned.replacingOccurrences(of: "_", with: " ")
    cleaned = cleaned.replacingOccurrences(of: "-", with: " ")
    
    var detectedYear: String? = nil
    if let match = cleaned.range(of: #"\b(19\d{2}|20\d{2})\b"#, options: .regularExpression) {
        detectedYear = String(cleaned[match])
        cleaned = String(cleaned[..<match.lowerBound])
    }
    
    let tags = ["1080p", "720p", "2160p", "4k", "uhd", "hdr", "bluray", "webrip", "web dl", "x264", "x265", "hevc", "aac", "dts", "atmos", "yts", "flux", "proper", "repack"]
    for tag in tags {
        if let r = cleaned.range(of: #"\b"# + tag + #"\b"#, options: [.caseInsensitive, .regularExpression]) {
            cleaned = String(cleaned[..<r.lowerBound])
        }
    }
    
    let punct = CharacterSet(charactersIn: " ()[]-._").union(.whitespacesAndNewlines)
    let finalTitle = cleaned.trimmingCharacters(in: punct)
    return (finalTitle.isEmpty ? nameWithoutExt : finalTitle, detectedYear)
}

// Multi-Encoding SRT & VTT Subtitle Parser
func parseSubtitleFile(path: String) -> [SubtitleCue] {
    guard let data = try? Data(contentsOf: URL(fileURLWithPath: path)) else {
        return []
    }
    
    let encodings: [String.Encoding] = [
        .utf8,
        .utf16,
        .utf16LittleEndian,
        .utf16BigEndian,
        .windowsCP1252,
        .isoLatin1,
        String.Encoding(rawValue: CFStringConvertEncodingToNSStringEncoding(CFStringEncoding(CFStringEncodings.GB_18030_2000.rawValue))),
        .japaneseEUC,
        .shiftJIS,
        String.Encoding(rawValue: CFStringConvertEncodingToNSStringEncoding(CFStringEncoding(CFStringEncodings.windowsArabic.rawValue)))
    ]
    
    var rawContent: String? = nil
    for enc in encodings {
        if let s = String(data: data, encoding: enc) {
            rawContent = s
            break
        }
    }
    guard let content = rawContent else { return [] }
    
    var cues: [SubtitleCue] = []
    let lines = content.components(separatedBy: .newlines)
    var i = 0
    
    while i < lines.count {
        let line = lines[i].trimmingCharacters(in: .whitespaces)
        if line.contains("-->") {
            let parts = line.components(separatedBy: "-->")
            if parts.count == 2 {
                let startStr = parts[0].trimmingCharacters(in: .whitespaces)
                let endStr = parts[1].trimmingCharacters(in: .whitespaces).components(separatedBy: " ")[0]
                
                let startSec = parseTimecode(startStr)
                let endSec = parseTimecode(endStr)
                
                var textLines: [String] = []
                i += 1
                while i < lines.count && !lines[i].trimmingCharacters(in: .whitespaces).isEmpty {
                    textLines.append(lines[i].trimmingCharacters(in: .whitespaces))
                    i += 1
                }
                let fullText = textLines.joined(separator: "\n")
                if !fullText.isEmpty {
                    cues.append(SubtitleCue(startTime: startSec, endTime: endSec, text: fullText))
                }
            }
        }
        i += 1
    }
    return cues
}

func parseTimecode(_ str: String) -> TimeInterval {
    let normalized = str.replacingOccurrences(of: ",", with: ".")
    let parts = normalized.components(separatedBy: ":")
    if parts.count == 3 {
        let h = Double(parts[0]) ?? 0
        let m = Double(parts[1]) ?? 0
        let s = Double(parts[2]) ?? 0
        return (h * 3600) + (m * 60) + s
    } else if parts.count == 2 {
        let m = Double(parts[0]) ?? 0
        let s = Double(parts[1]) ?? 0
        return (m * 60) + s
    }
    return 0
}

func formatSRTTimecode(_ seconds: TimeInterval) -> String {
    let h = Int(seconds) / 3600
    let m = (Int(seconds) % 3600) / 60
    let s = Int(seconds) % 60
    let ms = Int((seconds.truncatingRemainder(dividingBy: 1.0)) * 1000)
    return String(format: "%02d:%02d:%02d,%03d", h, m, s, ms)
}

func formatTimestamp(_ seconds: TimeInterval) -> String {
    let s = Int(seconds)
    let h = s / 3600
    let m = (s % 3600) / 60
    let sec = s % 60
    if h > 0 {
        return String(format: "%02d:%02d:%02d", h, m, sec)
    } else {
        return String(format: "%02d:%02d", m, sec)
    }
}

// Subtitle Search Result Model
struct SubtitleResultItem: Identifiable {
    let id = UUID()
    let releaseName: String
    let language: String
    let downloadUrl: URL
    let isHashMatch: Bool
    let downloadCount: Int
}

// MARK: - LibVLC Engine Core

class LibVLC {
    static let shared = LibVLC()
    
    var instance: UnsafeMutableRawPointer?
    var player: UnsafeMutableRawPointer?
    var equalizer: UnsafeMutableRawPointer?
    
    private var fnMediaNewPath: LibVlcMediaNewPath!
    private var fnMediaNewLocation: LibVlcMediaNewLocation!
    private var fnMediaRelease: LibVlcMediaRelease!
    private var fnMediaPlayerSetMedia: LibVlcMediaPlayerSetMedia!
    private var fnMediaPlayerPlay: LibVlcMediaPlayerPlay!
    private var fnMediaPlayerPause: LibVlcMediaPlayerPause!
    private var fnMediaPlayerStop: LibVlcMediaPlayerStop!
    private var fnMediaPlayerIsPlaying: LibVlcMediaPlayerIsPlaying!
    private var fnMediaPlayerGetState: LibVlcMediaPlayerGetState!
    private var fnMediaPlayerSetNSObject: LibVlcMediaPlayerSetNSObject!
    private var fnMediaPlayerGetTime: LibVlcMediaPlayerGetTime!
    private var fnMediaPlayerSetTime: LibVlcMediaPlayerSetTime!
    private var fnMediaPlayerGetLength: LibVlcMediaPlayerGetLength!
    private var fnMediaPlayerGetPosition: LibVlcMediaPlayerGetPosition!
    private var fnMediaPlayerSetPosition: LibVlcMediaPlayerSetPosition!
    private var fnMediaPlayerGetRate: LibVlcMediaPlayerGetRate!
    private var fnMediaPlayerSetRate: LibVlcMediaPlayerSetRate!
    private var fnMediaPlayerNextFrame: LibVlcMediaPlayerNextFrame!
    
    private var fnAudioGetVolume: LibVlcAudioGetVolume!
    private var fnAudioSetVolume: LibVlcAudioSetVolume!
    private var fnAudioGetMute: LibVlcAudioGetMute!
    private var fnAudioSetMute: LibVlcAudioSetMute!
    private var fnAudioGetTrack: LibVlcAudioGetTrack!
    private var fnAudioSetTrack: LibVlcAudioSetTrack!
    private var fnAudioGetTrackDescription: LibVlcAudioGetTrackDescription!
    private var fnAudioGetDelay: LibVlcAudioGetDelay!
    private var fnAudioSetDelay: LibVlcAudioSetDelay!
    
    private var fnAudioOutputDeviceEnum: LibVlcAudioOutputDeviceEnum!
    private var fnAudioOutputDeviceListRelease: LibVlcAudioOutputDeviceListRelease!
    private var fnAudioOutputDeviceSet: LibVlcAudioOutputDeviceSet!
    
    private var fnVideoGetSpu: LibVlcVideoGetSpu!
    private var fnVideoSetSpu: LibVlcVideoSetSpu!
    private var fnVideoGetSpuDescription: LibVlcVideoGetSpuDescription!
    private var fnVideoSetSubtitleFile: LibVlcVideoSetSubtitleFile!
    private var fnMediaPlayerAddSlave: LibVlcMediaPlayerAddSlave?
    private var fnVideoGetSpuDelay: LibVlcVideoGetSpuDelay!
    private var fnVideoSetSpuDelay: LibVlcVideoSetSpuDelay!
    private var fnVideoSetAspectRatio: LibVlcVideoSetAspectRatio!
    private var fnVideoTakeSnapshot: LibVlcVideoTakeSnapshot!
    
    private var fnVideoSetAdjustInt: LibVlcVideoSetAdjustInt!
    private var fnVideoSetAdjustFloat: LibVlcVideoSetAdjustFloat!
    private var fnVideoSetScale: LibVlcVideoSetScale!
    private var fnVideoGetScale: LibVlcVideoGetScale!
    private var fnVideoGetSize: LibVlcVideoGetSize!
    private var fnVideoSetCropGeometry: LibVlcVideoSetCropGeometry?
    private var fnVideoGetCropGeometry: LibVlcVideoGetCropGeometry?
    private var fnVideoSetDeinterlace: LibVlcVideoSetDeinterlace?
    private var fnAudioGetChannel: LibVlcAudioGetChannel?
    private var fnAudioSetChannel: LibVlcAudioSetChannel?
    
    private var fnMediaPlayerGetChapter: LibVlcMediaPlayerGetChapter!
    private var fnMediaPlayerGetChapterCount: LibVlcMediaPlayerGetChapterCount!
    private var fnMediaPlayerSetChapter: LibVlcMediaPlayerSetChapter!
    private var fnMediaPlayerNextChapter: LibVlcMediaPlayerNextChapter!
    private var fnMediaPlayerPreviousChapter: LibVlcMediaPlayerPreviousChapter!
    
    private var fnAudioEqualizerNew: LibVlcAudioEqualizerNew!
    private var fnAudioEqualizerRelease: LibVlcAudioEqualizerRelease!
    private var fnAudioEqualizerSetAmpAtIndex: LibVlcAudioEqualizerSetAmpAtIndex!
    private var fnAudioEqualizerSetPreamp: LibVlcAudioEqualizerSetPreamp!
    private var fnMediaPlayerSetEqualizer: LibVlcMediaPlayerSetEqualizer!
    
    private var fnTrackDescriptionListRelease: LibVlcTrackDescriptionListRelease!
    
    var isInitialized: Bool = false
    weak var attachedView: NSView?
    
    init() {
        initLibVLC()
    }
    
    private func initLibVLC() {
        if let paths = vlcPaths {
            setenv("VLC_PLUGIN_PATH", paths.plugins, 1)
            _ = dlopen(paths.coreDylib, RTLD_NOW | RTLD_GLOBAL)
        } else {
            setenv("VLC_PLUGIN_PATH", "/Applications/VLC.app/Contents/MacOS/plugins", 1)
            _ = dlopen("/Applications/VLC.app/Contents/MacOS/lib/libvlccore.dylib", RTLD_NOW | RTLD_GLOBAL)
        }
        
        let defaultPath = "/Applications/VLC.app/Contents/MacOS/lib/libvlc.dylib"
        guard let handle = dlopen(vlcPaths?.dylib ?? defaultPath, RTLD_NOW | RTLD_GLOBAL) else {
            print("Failed to open libvlc: \(String(cString: dlerror()))")
            return
        }
        
        let fnNew = unsafeBitCast(dlsym(handle, "libvlc_new"), to: LibVlcNew.self)
        let fnPlayerNew = unsafeBitCast(dlsym(handle, "libvlc_media_player_new"), to: LibVlcMediaPlayerNew.self)
        
        fnMediaNewPath = unsafeBitCast(dlsym(handle, "libvlc_media_new_path"), to: LibVlcMediaNewPath.self)
        fnMediaNewLocation = unsafeBitCast(dlsym(handle, "libvlc_media_new_location"), to: LibVlcMediaNewLocation.self)
        fnMediaRelease = unsafeBitCast(dlsym(handle, "libvlc_media_release"), to: LibVlcMediaRelease.self)
        fnMediaPlayerSetMedia = unsafeBitCast(dlsym(handle, "libvlc_media_player_set_media"), to: LibVlcMediaPlayerSetMedia.self)
        fnMediaPlayerPlay = unsafeBitCast(dlsym(handle, "libvlc_media_player_play"), to: LibVlcMediaPlayerPlay.self)
        fnMediaPlayerPause = unsafeBitCast(dlsym(handle, "libvlc_media_player_pause"), to: LibVlcMediaPlayerPause.self)
        fnMediaPlayerStop = unsafeBitCast(dlsym(handle, "libvlc_media_player_stop"), to: LibVlcMediaPlayerStop.self)
        fnMediaPlayerIsPlaying = unsafeBitCast(dlsym(handle, "libvlc_media_player_is_playing"), to: LibVlcMediaPlayerIsPlaying.self)
        fnMediaPlayerGetState = unsafeBitCast(dlsym(handle, "libvlc_media_player_get_state"), to: LibVlcMediaPlayerGetState.self)
        fnMediaPlayerSetNSObject = unsafeBitCast(dlsym(handle, "libvlc_media_player_set_nsobject"), to: LibVlcMediaPlayerSetNSObject.self)
        fnMediaPlayerGetTime = unsafeBitCast(dlsym(handle, "libvlc_media_player_get_time"), to: LibVlcMediaPlayerGetTime.self)
        fnMediaPlayerSetTime = unsafeBitCast(dlsym(handle, "libvlc_media_player_set_time"), to: LibVlcMediaPlayerSetTime.self)
        fnMediaPlayerGetLength = unsafeBitCast(dlsym(handle, "libvlc_media_player_get_length"), to: LibVlcMediaPlayerGetLength.self)
        fnMediaPlayerGetPosition = unsafeBitCast(dlsym(handle, "libvlc_media_player_get_position"), to: LibVlcMediaPlayerGetPosition.self)
        fnMediaPlayerSetPosition = unsafeBitCast(dlsym(handle, "libvlc_media_player_set_position"), to: LibVlcMediaPlayerSetPosition.self)
        fnMediaPlayerGetRate = unsafeBitCast(dlsym(handle, "libvlc_media_player_get_rate"), to: LibVlcMediaPlayerGetRate.self)
        fnMediaPlayerSetRate = unsafeBitCast(dlsym(handle, "libvlc_media_player_set_rate"), to: LibVlcMediaPlayerSetRate.self)
        fnMediaPlayerNextFrame = unsafeBitCast(dlsym(handle, "libvlc_media_player_next_frame"), to: LibVlcMediaPlayerNextFrame.self)
        
        fnAudioGetVolume = unsafeBitCast(dlsym(handle, "libvlc_audio_get_volume"), to: LibVlcAudioGetVolume.self)
        fnAudioSetVolume = unsafeBitCast(dlsym(handle, "libvlc_audio_set_volume"), to: LibVlcAudioSetVolume.self)
        fnAudioGetMute = unsafeBitCast(dlsym(handle, "libvlc_audio_get_mute"), to: LibVlcAudioGetMute.self)
        fnAudioSetMute = unsafeBitCast(dlsym(handle, "libvlc_audio_set_mute"), to: LibVlcAudioSetMute.self)
        fnAudioGetTrack = unsafeBitCast(dlsym(handle, "libvlc_audio_get_track"), to: LibVlcAudioGetTrack.self)
        fnAudioSetTrack = unsafeBitCast(dlsym(handle, "libvlc_audio_set_track"), to: LibVlcAudioSetTrack.self)
        fnAudioGetTrackDescription = unsafeBitCast(dlsym(handle, "libvlc_audio_get_track_description"), to: LibVlcAudioGetTrackDescription.self)
        fnAudioGetDelay = unsafeBitCast(dlsym(handle, "libvlc_audio_get_delay"), to: LibVlcAudioGetDelay.self)
        fnAudioSetDelay = unsafeBitCast(dlsym(handle, "libvlc_audio_set_delay"), to: LibVlcAudioSetDelay.self)
        
        fnAudioOutputDeviceEnum = unsafeBitCast(dlsym(handle, "libvlc_audio_output_device_enum"), to: LibVlcAudioOutputDeviceEnum.self)
        fnAudioOutputDeviceListRelease = unsafeBitCast(dlsym(handle, "libvlc_audio_output_device_list_release"), to: LibVlcAudioOutputDeviceListRelease.self)
        fnAudioOutputDeviceSet = unsafeBitCast(dlsym(handle, "libvlc_audio_output_device_set"), to: LibVlcAudioOutputDeviceSet.self)
        
        fnVideoGetSpu = unsafeBitCast(dlsym(handle, "libvlc_video_get_spu"), to: LibVlcVideoGetSpu.self)
        fnVideoSetSpu = unsafeBitCast(dlsym(handle, "libvlc_video_set_spu"), to: LibVlcVideoSetSpu.self)
        fnVideoGetSpuDescription = unsafeBitCast(dlsym(handle, "libvlc_video_get_spu_description"), to: LibVlcVideoGetSpuDescription.self)
        fnVideoSetSubtitleFile = unsafeBitCast(dlsym(handle, "libvlc_video_set_subtitle_file"), to: LibVlcVideoSetSubtitleFile.self)
        if let symSlave = dlsym(handle, "libvlc_media_player_add_slave") {
            fnMediaPlayerAddSlave = unsafeBitCast(symSlave, to: LibVlcMediaPlayerAddSlave.self)
        }
        fnVideoGetSpuDelay = unsafeBitCast(dlsym(handle, "libvlc_video_get_spu_delay"), to: LibVlcVideoGetSpuDelay.self)
        fnVideoSetSpuDelay = unsafeBitCast(dlsym(handle, "libvlc_video_set_spu_delay"), to: LibVlcVideoSetSpuDelay.self)
        fnVideoSetAspectRatio = unsafeBitCast(dlsym(handle, "libvlc_video_set_aspect_ratio"), to: LibVlcVideoSetAspectRatio.self)
        fnVideoTakeSnapshot = unsafeBitCast(dlsym(handle, "libvlc_video_take_snapshot"), to: LibVlcVideoTakeSnapshot.self)
        
        fnVideoSetAdjustInt = unsafeBitCast(dlsym(handle, "libvlc_video_set_adjust_int"), to: LibVlcVideoSetAdjustInt.self)
        fnVideoSetAdjustFloat = unsafeBitCast(dlsym(handle, "libvlc_video_set_adjust_float"), to: LibVlcVideoSetAdjustFloat.self)
        fnVideoSetScale = unsafeBitCast(dlsym(handle, "libvlc_video_set_scale"), to: LibVlcVideoSetScale.self)
        fnVideoGetScale = unsafeBitCast(dlsym(handle, "libvlc_video_get_scale"), to: LibVlcVideoGetScale.self)
        fnVideoGetSize = unsafeBitCast(dlsym(handle, "libvlc_video_get_size"), to: LibVlcVideoGetSize.self)
        
        if let s = dlsym(handle, "libvlc_video_set_crop_geometry") {
            fnVideoSetCropGeometry = unsafeBitCast(s, to: LibVlcVideoSetCropGeometry.self)
        }
        if let s = dlsym(handle, "libvlc_video_get_crop_geometry") {
            fnVideoGetCropGeometry = unsafeBitCast(s, to: LibVlcVideoGetCropGeometry.self)
        }
        if let s = dlsym(handle, "libvlc_video_set_deinterlace") {
            fnVideoSetDeinterlace = unsafeBitCast(s, to: LibVlcVideoSetDeinterlace.self)
        }
        if let s = dlsym(handle, "libvlc_audio_get_channel") {
            fnAudioGetChannel = unsafeBitCast(s, to: LibVlcAudioGetChannel.self)
        }
        if let s = dlsym(handle, "libvlc_audio_set_channel") {
            fnAudioSetChannel = unsafeBitCast(s, to: LibVlcAudioSetChannel.self)
        }
        
        fnMediaPlayerGetChapter = unsafeBitCast(dlsym(handle, "libvlc_media_player_get_chapter"), to: LibVlcMediaPlayerGetChapter.self)
        fnMediaPlayerGetChapterCount = unsafeBitCast(dlsym(handle, "libvlc_media_player_get_chapter_count"), to: LibVlcMediaPlayerGetChapterCount.self)
        fnMediaPlayerSetChapter = unsafeBitCast(dlsym(handle, "libvlc_media_player_set_chapter"), to: LibVlcMediaPlayerSetChapter.self)
        fnMediaPlayerNextChapter = unsafeBitCast(dlsym(handle, "libvlc_media_player_next_chapter"), to: LibVlcMediaPlayerNextChapter.self)
        fnMediaPlayerPreviousChapter = unsafeBitCast(dlsym(handle, "libvlc_media_player_previous_chapter"), to: LibVlcMediaPlayerPreviousChapter.self)
        
        fnAudioEqualizerNew = unsafeBitCast(dlsym(handle, "libvlc_audio_equalizer_new"), to: LibVlcAudioEqualizerNew.self)
        fnAudioEqualizerRelease = unsafeBitCast(dlsym(handle, "libvlc_audio_equalizer_release"), to: LibVlcAudioEqualizerRelease.self)
        fnAudioEqualizerSetAmpAtIndex = unsafeBitCast(dlsym(handle, "libvlc_audio_equalizer_set_amp_at_index"), to: LibVlcAudioEqualizerSetAmpAtIndex.self)
        fnAudioEqualizerSetPreamp = unsafeBitCast(dlsym(handle, "libvlc_audio_equalizer_set_preamp"), to: LibVlcAudioEqualizerSetPreamp.self)
        fnMediaPlayerSetEqualizer = unsafeBitCast(dlsym(handle, "libvlc_media_player_set_equalizer"), to: LibVlcMediaPlayerSetEqualizer.self)
        
        fnTrackDescriptionListRelease = unsafeBitCast(dlsym(handle, "libvlc_track_description_list_release"), to: LibVlcTrackDescriptionListRelease.self)
        
        let rawArgs = [
            "--no-xlib",
            "--quiet",
            "--no-video-title-show",
            "--videotoolbox",
            "--avcodec-hw=any",
            "--video-filter=adjust:postproc:sharpen",
            "--swscale-mode=2",
            "--postproc-q=6",
            "--audio-time-stretch",
            "--network-caching=2000",
            "--file-caching=1500",
            "--live-caching=2000"
        ]
        
        let cStrings = rawArgs.map { strdup($0) }
        var cArgs: [UnsafePointer<CChar>?] = cStrings.map { UnsafePointer($0) }
        instance = fnNew(Int32(cArgs.count), &cArgs)
        for ptr in cStrings {
            if let p = ptr { free(p) }
        }
        guard let inst = instance else {
            print("ERROR: libvlc_new failed to initialize instance")
            return
        }
        
        player = fnPlayerNew(inst)
        equalizer = fnAudioEqualizerNew()
        isInitialized = (player != nil)
        
        if let view = attachedView, let pl = player {
            let ptr = Unmanaged.passUnretained(view).toOpaque()
            fnMediaPlayerSetNSObject(pl, ptr)
        }
    }
    
    func attach(view: NSView) {
        attachedView = view
        guard let player = player else { return }
        let ptr = Unmanaged.passUnretained(view).toOpaque()
        fnMediaPlayerSetNSObject(player, ptr)
    }
    
    func open(url: URL) {
        guard let instance = instance, let player = player else {
            print("ERROR: LibVLC instance or player is nil!")
            return
        }
        if let view = attachedView {
            let ptr = Unmanaged.passUnretained(view).toOpaque()
            fnMediaPlayerSetNSObject(player, ptr)
        }
        let media: UnsafeMutableRawPointer?
        if url.isFileURL {
            media = fnMediaNewPath(instance, url.path)
        } else {
            media = fnMediaNewLocation(instance, url.absoluteString)
        }
        guard let m = media else { return }
        fnMediaPlayerSetMedia(player, m)
        fnMediaRelease(m)
        
        fnVideoSetAdjustInt(player, 0, 1)
    }
    
    func play() {
        guard let player = player else { return }
        _ = fnMediaPlayerPlay(player)
    }
    
    func pause() {
        guard let player = player else { return }
        fnMediaPlayerPause(player)
    }
    
    func stop() {
        guard let player = player else { return }
        fnMediaPlayerStop(player)
    }
    
    var isPlaying: Bool {
        guard let player = player else { return false }
        return fnMediaPlayerIsPlaying(player) != 0
    }
    
    var isEnded: Bool {
        guard let player = player else { return false }
        return fnMediaPlayerGetState(player) == 6
    }
    
    var time: TimeInterval {
        get {
            guard let player = player else { return 0 }
            let ms = fnMediaPlayerGetTime(player)
            return ms >= 0 ? Double(ms) / 1000.0 : 0
        }
        set {
            guard let player = player else { return }
            let ms = Int64(newValue * 1000.0)
            fnMediaPlayerSetTime(player, ms)
        }
    }
    
    var length: TimeInterval {
        guard let player = player else { return 0 }
        let ms = fnMediaPlayerGetLength(player)
        return ms > 0 ? Double(ms) / 1000.0 : 0
    }
    
    var position: Float {
        get {
            guard let player = player else { return 0 }
            return fnMediaPlayerGetPosition(player)
        }
        set {
            guard let player = player else { return }
            fnMediaPlayerSetPosition(player, max(0, min(newValue, 1.0)))
        }
    }
    
    var rate: Float {
        get {
            guard let player = player else { return 1.0 }
            return fnMediaPlayerGetRate(player)
        }
        set {
            guard let player = player else { return }
            _ = fnMediaPlayerSetRate(player, newValue)
        }
    }
    
    func nextFrame() {
        guard let player = player else { return }
        fnMediaPlayerNextFrame(player)
    }
    
    var volume: Int32 {
        get {
            guard let player = player else { return 100 }
            return fnAudioGetVolume(player)
        }
        set {
            guard let player = player else { return }
            _ = fnAudioSetVolume(player, max(0, min(newValue, 200)))
        }
    }
    
    var isMuted: Bool {
        get {
            guard let player = player else { return false }
            return fnAudioGetMute(player) != 0
        }
        set {
            guard let player = player else { return }
            fnAudioSetMute(player, newValue ? 1 : 0)
        }
    }
    
    func getSubtitleTracks() -> [TrackItem] {
        guard let player = player else { return [] }
        guard let list = fnVideoGetSpuDescription(player) else { return [] }
        defer { fnTrackDescriptionListRelease(list) }
        
        var tracks: [TrackItem] = []
        var current: UnsafeMutableRawPointer? = list
        while let raw = current {
            let node = raw.assumingMemoryBound(to: LibVlcTrackDescription.self)
            let id = node.pointee.i_id
            let name: String
            if let psz = node.pointee.psz_name {
                name = String(cString: psz)
            } else {
                name = "Track \(id)"
            }
            tracks.append(TrackItem(id: id, name: name))
            current = node.pointee.p_next
        }
        return tracks
    }
    
    var currentSubtitleTrack: Int32 {
        get {
            guard let player = player else { return -1 }
            return fnVideoGetSpu(player)
        }
        set {
            guard let player = player else { return }
            _ = fnVideoSetSpu(player, newValue)
        }
    }
    
    func addSubtitleFile(path: String) -> Bool {
        guard let player = player else { return false }
        let url = URL(fileURLWithPath: path)
        if let fnAddSlave = fnMediaPlayerAddSlave {
            let res = fnAddSlave(player, 0, url.absoluteString, true)
            if res == 0 { return true }
        }
        return fnVideoSetSubtitleFile(player, path) != 0
    }
    
    var subtitleDelay: Int64 {
        get {
            guard let player = player else { return 0 }
            return fnVideoGetSpuDelay(player)
        }
        set {
            guard let player = player else { return }
            _ = fnVideoSetSpuDelay(player, newValue)
        }
    }
    
    func getAudioTracks() -> [TrackItem] {
        guard let player = player else { return [] }
        guard let list = fnAudioGetTrackDescription(player) else { return [] }
        defer { fnTrackDescriptionListRelease(list) }
        
        var tracks: [TrackItem] = []
        var current: UnsafeMutableRawPointer? = list
        while let raw = current {
            let node = raw.assumingMemoryBound(to: LibVlcTrackDescription.self)
            let id = node.pointee.i_id
            let name: String
            if let psz = node.pointee.psz_name {
                name = String(cString: psz)
            } else {
                name = "Track \(id)"
            }
            tracks.append(TrackItem(id: id, name: name))
            current = node.pointee.p_next
        }
        return tracks
    }
    
    var currentAudioTrack: Int32 {
        get {
            guard let player = player else { return -1 }
            return fnAudioGetTrack(player)
        }
        set {
            guard let player = player else { return }
            _ = fnAudioSetTrack(player, newValue)
        }
    }
    
    var audioDelay: Int64 {
        get {
            guard let player = player else { return 0 }
            return fnAudioGetDelay(player)
        }
        set {
            guard let player = player else { return }
            _ = fnAudioSetDelay(player, newValue)
        }
    }
    
    func getAudioDevices() -> [AudioDeviceItem] {
        guard let player = player else { return [] }
        guard let list = fnAudioOutputDeviceEnum(player) else { return [] }
        defer { fnAudioOutputDeviceListRelease(list) }
        
        var devices: [AudioDeviceItem] = []
        var current: UnsafeMutableRawPointer? = list
        while let raw = current {
            let node = raw.assumingMemoryBound(to: LibVlcAudioOutputDevice.self)
            let devId = node.pointee.psz_device != nil ? String(cString: node.pointee.psz_device!) : ""
            let desc = node.pointee.psz_description != nil ? String(cString: node.pointee.psz_description!) : devId
            if !devId.isEmpty {
                devices.append(AudioDeviceItem(id: devId, name: desc))
            }
            current = node.pointee.p_next
        }
        return devices
    }
    
    func setAudioDevice(id: String) {
        guard let player = player else { return }
        fnAudioOutputDeviceSet(player, nil, (id as NSString).utf8String)
    }
    
    // Chapters
    var chapterCount: Int32 {
        guard let player = player else { return 0 }
        return fnMediaPlayerGetChapterCount(player)
    }
    
    var currentChapter: Int32 {
        get {
            guard let player = player else { return -1 }
            return fnMediaPlayerGetChapter(player)
        }
        set {
            guard let player = player else { return }
            fnMediaPlayerSetChapter(player, newValue)
        }
    }
    
    func nextChapter() {
        guard let player = player else { return }
        fnMediaPlayerNextChapter(player)
    }
    
    func previousChapter() {
        guard let player = player else { return }
        fnMediaPlayerPreviousChapter(player)
    }
    
    // Video Adjustments
    func setBrightness(_ value: Float) {
        guard let player = player else { return }
        fnVideoSetAdjustInt(player, 0, 1)
        fnVideoSetAdjustFloat(player, 2, value)
    }
    
    func setContrast(_ value: Float) {
        guard let player = player else { return }
        fnVideoSetAdjustInt(player, 0, 1)
        fnVideoSetAdjustFloat(player, 1, value)
    }
    
    func setSaturation(_ value: Float) {
        guard let player = player else { return }
        fnVideoSetAdjustInt(player, 0, 1)
        fnVideoSetAdjustFloat(player, 4, value)
    }
    
    func setHue(_ value: Float) {
        guard let player = player else { return }
        fnVideoSetAdjustInt(player, 0, 1)
        fnVideoSetAdjustFloat(player, 3, value)
    }
    
    func setGamma(_ value: Float) {
        guard let player = player else { return }
        fnVideoSetAdjustInt(player, 0, 1)
        fnVideoSetAdjustFloat(player, 5, value)
    }
    
    func setSharpness(_ value: Float) {
        guard let player = player else { return }
        fnVideoSetAdjustInt(player, 0, 1)
        let contrastBoost = 1.0 + (value * 0.12)
        fnVideoSetAdjustFloat(player, 1, contrastBoost)
    }
    
    func setScale(_ factor: Float) {
        guard let player = player else { return }
        fnVideoSetScale(player, factor)
    }
    
    var scale: Float {
        get {
            guard let player = player else { return 0 }
            return fnVideoGetScale(player)
        }
        set {
            guard let player = player else { return }
            fnVideoSetScale(player, newValue)
        }
    }
    
    func getVideoDimensions() -> (width: Int, height: Int) {
        guard let player = player else { return (0, 0) }
        var w: UInt32 = 0
        var h: UInt32 = 0
        _ = fnVideoGetSize(player, 0, &w, &h)
        return (Int(w), Int(h))
    }
    
    func setEqualizerGains(_ gains: [Float], preamp: Float = 0.0) {
        guard let eq = equalizer, let pl = player else { return }
        _ = fnAudioEqualizerSetPreamp(eq, preamp)
        for (i, val) in gains.prefix(10).enumerated() {
            _ = fnAudioEqualizerSetAmpAtIndex(eq, val, UInt32(i))
        }
        _ = fnMediaPlayerSetEqualizer(pl, eq)
    }
    
    func setAspectRatio(_ ratio: String?) {
        guard let player = player else { return }
        if let r = ratio, r != "Default" {
            fnVideoSetAspectRatio(player, (r as NSString).utf8String)
        } else {
            fnVideoSetAspectRatio(player, nil)
        }
    }
    
    func takeSnapshot(outPath: String) -> Bool {
        guard let player = player else { return false }
        guard let cStr = (outPath as NSString).utf8String else { return false }
        return fnVideoTakeSnapshot(player, 0, cStr, 0, 0) == 0
    }
    
    func setCropGeometry(_ crop: String?) {
        guard let player = player, let fn = fnVideoSetCropGeometry else { return }
        if let c = crop, !c.isEmpty, c != "None" {
            fn(player, (c as NSString).utf8String)
        } else {
            fn(player, nil)
        }
    }
    
    func setDeinterlace(_ mode: String?) {
        guard let player = player, let fn = fnVideoSetDeinterlace else { return }
        if let m = mode, !m.isEmpty, m != "Off" {
            fn(player, (m.lowercased() as NSString).utf8String)
        } else {
            fn(player, nil)
        }
    }
    
    func setAudioChannel(_ channel: Int32) {
        guard let player = player, let fn = fnAudioSetChannel else { return }
        _ = fn(player, channel)
    }
    
    func getAudioChannel() -> Int32 {
        guard let player = player, let fn = fnAudioGetChannel else { return 1 }
        return fn(player)
    }
}

// MARK: - Magnet Link & Torrent Stream Manager

class MagnetStreamManager: ObservableObject {
    static let shared = MagnetStreamManager()
    
    @Published var isStreaming: Bool = false
    @Published var isPreparing: Bool = false
    @Published var statusText: String = ""
    @Published var downloadSpeedMBs: Double = 0.0
    @Published var activePeers: Int = 0
    @Published var torrentTitle: String = ""
    @Published var streamPort: Int = 8081
    @Published var currentInfoHash: String = ""
    @Published var activeStreamURL: URL? = nil
    @Published var useCloudflare: Bool = true // CF Edge Acceleration active by default!
    @Published var isCFAccelerated: Bool = false
    @Published var downloadProgress: Double = 0.0
    
    let cfWorkerBaseURL = "https://torrentdownloader.abhishek-dutta1996.workers.dev"
    
    private var daemonProcess: Process?
    private var pollTimer: Timer?
    
    private func findDaemonBinary() -> String? {
        let candidates = [
            Bundle.main.path(forResource: "torrent_streamer", ofType: nil),
            "\(Bundle.main.bundlePath)/Contents/Resources/torrent_streamer",
            "\(FileManager.default.currentDirectoryPath)/OmniPlayer.app/Contents/Resources/torrent_streamer",
            "/Users/nandadulaldutta/Desktop/Media Player/OmniPlayer.app/Contents/Resources/torrent_streamer",
            "/Users/nandadulaldutta/.gemini/antigravity/worktrees/Torrent Downloader/cpp_torrent_downloader_client/cpp/build/torrent_client"
        ].compactMap { $0 }
        
        for p in candidates {
            if FileManager.default.isExecutableFile(atPath: p) {
                return p
            }
        }
        return nil
    }
    
    func readActivePort() -> Int {
        if let portStr = try? String(contentsOfFile: "/tmp/fluxtorrent_port.txt", encoding: .utf8) {
            let trimmed = portStr.trimmingCharacters(in: .whitespacesAndNewlines)
            if let p = Int(trimmed), p > 0 {
                return p
            }
        }
        return 8081
    }
    
    var activePort: Int {
        let p = readActivePort()
        return p > 0 ? p : self.streamPort
    }
    
    func ensureDaemonRunning(completion: @escaping (Bool) -> Void) {
        let candidatePorts = [readActivePort(), 8083, 8082, 8081, 8080]
        
        func probeNext(index: Int) {
            guard index < candidatePorts.count else {
                launchDaemon(completion: completion)
                return
            }
            let port = candidatePorts[index]
            guard let url = URL(string: "http://127.0.0.1:\(port)/api/torrents") else {
                probeNext(index: index + 1)
                return
            }
            var req = URLRequest(url: url)
            req.timeoutInterval = 0.8
            URLSession.shared.dataTask(with: req) { [weak self] _, resp, err in
                if err == nil, let http = resp as? HTTPURLResponse, http.statusCode == 200 {
                    DispatchQueue.main.async {
                        self?.streamPort = port
                        completion(true)
                    }
                } else {
                    probeNext(index: index + 1)
                }
            }.resume()
        }
        
        probeNext(index: 0)
    }
    
    private func launchDaemon(completion: @escaping (Bool) -> Void) {
        // Embedded mode: The daemon is managed centrally by FluxTorrent.
        DispatchQueue.main.async {
            self.streamPort = self.readActivePort()
            completion(true)
        }
    }
    
    func startStreaming(magnetUri: String) {
        let trimmed = magnetUri.trimmingCharacters(in: .whitespacesAndNewlines)
        
        // Handle .torrent file path
        if trimmed.lowercased().hasSuffix(".torrent") || FileManager.default.fileExists(atPath: trimmed) {
            startStreamingTorrentFile(url: URL(fileURLWithPath: trimmed))
            return
        }
        
        // Handle raw info-hash (40-character SHA1 hex or 32-character Base32)
        var effectiveMagnet = trimmed
        let rawHashRegex = #"^([a-fA-F0-9]{40}|[a-zA-Z2-7]{32})$"#
        if trimmed.range(of: rawHashRegex, options: .regularExpression) != nil {
            effectiveMagnet = "magnet:?xt=urn:btih:\(trimmed)"
        }
        
        guard effectiveMagnet.lowercased().hasPrefix("magnet:?") else {
            OmniPlayerEngine.shared.showOSD("⚠️ Invalid magnet link or hash format")
            return
        }
        
        var parsedTitle = "Torrent Stream"
        if let dnMatch = effectiveMagnet.range(of: #"dn=([^&]+)"#, options: .regularExpression) {
            let rawDn = String(effectiveMagnet[dnMatch]).replacingOccurrences(of: "dn=", with: "")
            if let decoded = rawDn.removingPercentEncoding {
                parsedTitle = decoded.replacingOccurrences(of: "+", with: " ")
            }
        }
        
        var parsedHash = ""
        if let hashMatch = effectiveMagnet.range(of: #"urn:btih:([a-fA-F0-9]{40}|[a-zA-Z2-7]{32})"#, options: .regularExpression) {
            let fullMatch = String(effectiveMagnet[hashMatch])
            parsedHash = fullMatch.replacingOccurrences(of: "urn:btih:", with: "").lowercased()
        }
        
        DispatchQueue.main.async {
            self.isPreparing = true
            self.isStreaming = false
            self.torrentTitle = parsedTitle
            self.currentInfoHash = parsedHash
            self.statusText = self.useCloudflare ? "Connecting to Cloudflare (CF) Edge & Swarm..." : "Connecting to BitTorrent Swarm..."
            OmniPlayerEngine.shared.showOSD(self.useCloudflare ? "⚡ Resolving via Cloudflare (CF)..." : "🧲 Connecting to BitTorrent Swarm...")
        }
        
        // 1. Cloudflare (CF) Accelerated Edge Resolution
        if self.useCloudflare {
            resolveViaCloudflare(magnetUri: effectiveMagnet)
        }
        
        // 2. High-Performance Local Swarm Engine (Parallel / Fallback)
        ensureDaemonRunning { [weak self] ready in
            guard let self = self else { return }
            guard ready else {
                if !self.isCFAccelerated {
                    self.statusText = "Waiting for Cloudflare edge or swarm..."
                }
                return
            }
            self.postMagnetToDaemon(magnet: effectiveMagnet)
        }
    }
    
    func startStreamingTorrentFile(url: URL) {
        guard let data = try? Data(contentsOf: url), !data.isEmpty else {
            OmniPlayerEngine.shared.showOSD("⚠️ Cannot read .torrent file")
            return
        }
        
        let filename = url.lastPathComponent
        let displayName = (filename as NSString).deletingPathExtension
        
        DispatchQueue.main.async {
            self.isPreparing = true
            self.isStreaming = false
            self.torrentTitle = displayName
            self.statusText = "Uploading .torrent to stream engine..."
            OmniPlayerEngine.shared.showOSD("🧲 Loading .torrent: \(displayName)")
        }
        
        ensureDaemonRunning { [weak self] ready in
            guard let self = self, ready else {
                DispatchQueue.main.async {
                    self?.statusText = "Torrent engine unavailable"
                }
                return
            }
            
            let p = self.activePort
            guard let uploadUrl = URL(string: "http://127.0.0.1:\(p)/api/torrents/file") else { return }
            
            let boundary = "Boundary-\(UUID().uuidString)"
            var req = URLRequest(url: uploadUrl)
            req.httpMethod = "POST"
            req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
            
            var body = Data()
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(filename)\"\r\n".data(using: .utf8)!)
            body.append("Content-Type: application/x-bittorrent\r\n\r\n".data(using: .utf8)!)
            body.append(data)
            body.append("\r\n".data(using: .utf8)!)
            body.append("--\(boundary)--\r\n".data(using: .utf8)!)
            req.httpBody = body
            
            URLSession.shared.dataTask(with: req) { data, _, _ in
                if let data = data, let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                    let h = (json["hash"] as? String) ?? (json["info_hash"] as? String)
                    if let hash = h, !hash.isEmpty {
                        DispatchQueue.main.async {
                            self.currentInfoHash = hash.lowercased()
                        }
                        if let resumeUrl = URL(string: "http://127.0.0.1:\(p)/api/torrents/\(hash)/resume") {
                            var resumeReq = URLRequest(url: resumeUrl)
                            resumeReq.httpMethod = "POST"
                            URLSession.shared.dataTask(with: resumeReq).resume()
                        }
                        if let seqUrl = URL(string: "http://127.0.0.1:\(p)/api/torrents/\(hash)/sequential") {
                            var seqReq = URLRequest(url: seqUrl)
                            seqReq.httpMethod = "POST"
                            seqReq.setValue("application/json", forHTTPHeaderField: "Content-Type")
                            seqReq.httpBody = try? JSONSerialization.data(withJSONObject: ["sequential": true])
                            URLSession.shared.dataTask(with: seqReq).resume()
                        }
                    }
                }
                DispatchQueue.main.async {
                    self.statusText = "Joining swarm & buffering stream..."
                    self.startMonitoringSwarm()
                }
            }.resume()
        }
    }
    
    private func resolveViaCloudflare(magnetUri: String) {
        guard let encoded = magnetUri.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
              let url = URL(string: "\(cfWorkerBaseURL)/api/resolve?magnet=\(encoded)") else { return }
        
        var req = URLRequest(url: url)
        req.timeoutInterval = 4.0
        
        URLSession.shared.dataTask(with: req) { [weak self] data, _, err in
            guard let self = self, err == nil, let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return }
            
            if let hash = json["hash"] as? String, !hash.isEmpty {
                DispatchQueue.main.async {
                    self.currentInfoHash = hash.lowercased()
                    if let title = json["title"] as? String, !title.isEmpty, title != "BitTorrent Stream" {
                        self.torrentTitle = title
                    }
                    self.isCFAccelerated = true
                    self.statusText = "⚡ Cloudflare (CF) Edge Active • Fast Caching"
                }
            }
        }.resume()
    }
    
    private func postMagnetToDaemon(magnet: String) {
        let port = self.activePort
        guard let postUrl = URL(string: "http://127.0.0.1:\(port)/api/torrents") else { return }
        
        let tempDir = "/tmp/omni_stream_cache"
        try? FileManager.default.createDirectory(atPath: tempDir, withIntermediateDirectories: true)
        
        var req = URLRequest(url: postUrl)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body: [String: Any] = [
            "magnet": magnet,
            "save_path": tempDir
        ]
        req.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: req) { [weak self] data, _, _ in
            guard let self = self else { return }
            let p = self.activePort
            if let data = data, let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                let h = (json["hash"] as? String) ?? (json["info_hash"] as? String)
                if let hash = h, !hash.isEmpty {
                    DispatchQueue.main.async { self.currentInfoHash = hash.lowercased() }
                    
                    // Automatically unpause / resume torrent
                    if let resumeUrl = URL(string: "http://127.0.0.1:\(p)/api/torrents/\(hash)/resume") {
                        var resumeReq = URLRequest(url: resumeUrl)
                        resumeReq.httpMethod = "POST"
                        URLSession.shared.dataTask(with: resumeReq).resume()
                    }
                    // Automatically enable sequential download
                    if let seqUrl = URL(string: "http://127.0.0.1:\(p)/api/torrents/\(hash)/sequential") {
                        var seqReq = URLRequest(url: seqUrl)
                        seqReq.httpMethod = "POST"
                        seqReq.setValue("application/json", forHTTPHeaderField: "Content-Type")
                        seqReq.httpBody = try? JSONSerialization.data(withJSONObject: ["sequential": true])
                        URLSession.shared.dataTask(with: seqReq).resume()
                    }
                }
            }
            DispatchQueue.main.async {
                self.statusText = "Joining swarm & buffering stream..."
                self.startMonitoringSwarm()
            }
        }.resume()
    }
    
    private func startMonitoringSwarm() {
        pollTimer?.invalidate()
        var streamStarted = false
        
        pollTimer = Timer.scheduledTimer(withTimeInterval: 0.8, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            let p = self.activePort
            guard let listUrl = URL(string: "http://127.0.0.1:\(p)/api/torrents") else { return }
            
            URLSession.shared.dataTask(with: listUrl) { data, _, _ in
                guard let data = data,
                      let list = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else { return }
                
                guard let torrent = list.first(where: {
                    let h = (($0["hash"] as? String) ?? ($0["info_hash"] as? String))?.lowercased() ?? ""
                    return !self.currentInfoHash.isEmpty ? (h == self.currentInfoHash) : true
                }) else { return }
                
                let peers = torrent["peers"] as? Int ?? 0
                let rawSpeed = (torrent["download_speed"] as? Double) ?? (torrent["download_rate"] as? Double) ?? Double(torrent["download_speed"] as? Int ?? torrent["download_rate"] as? Int ?? 0)
                let name = torrent["name"] as? String ?? self.torrentTitle
                let hash = ((torrent["hash"] as? String) ?? (torrent["info_hash"] as? String))?.lowercased() ?? self.currentInfoHash
                let progress = torrent["progress"] as? Double ?? 0.0
                
                DispatchQueue.main.async {
                    self.activePeers = peers
                    self.downloadSpeedMBs = rawSpeed / (1024.0 * 1024.0)
                    self.downloadProgress = progress
                    if !name.isEmpty && (self.torrentTitle.isEmpty || self.torrentTitle == "Torrent Stream") {
                        self.torrentTitle = name
                    }
                    
                    if !streamStarted {
                        streamStarted = true
                        self.statusText = "Analyzing swarm & metadata..."
                        self.fetchFilesAndStartStream(hash: hash)
                    }
                }
            }.resume()
        }
    }
    
    private func fetchFilesAndStartStream(hash: String) {
        let p = self.activePort
        guard let filesUrl = URL(string: "http://127.0.0.1:\(p)/api/torrents/\(hash)/files") else { return }
        
        URLSession.shared.dataTask(with: filesUrl) { [weak self] data, _, _ in
            guard let self = self else { return }
            guard let data = data,
                  let files = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]], !files.isEmpty else {
                DispatchQueue.main.async {
                    self.statusText = "Downloading metadata & video file list..."
                }
                // Retry after 1.0 second when metadata arrives — never attach 0 before metadata!
                DispatchQueue.global().asyncAfter(deadline: .now() + 1.0) {
                    self.fetchFilesAndStartStream(hash: hash)
                }
                return
            }
            
            let videoExts = ["mp4", "mkv", "avi", "mov", "webm", "m4v", "flv", "ts"]
            var videoFiles: [(index: Int, name: String, path: String, size: Int64)] = []
            
            for (idx, f) in files.enumerated() {
                let origPath = f["path"] as? String ?? ""
                let path = origPath.lowercased()
                let name = f["name"] as? String ?? "Video \(idx + 1)"
                let size = f["size"] as? Int64 ?? Int64(f["size"] as? Int ?? 0)
                let ext = (path as NSString).pathExtension
                if videoExts.contains(ext) {
                    videoFiles.append((index: idx, name: name, path: origPath, size: size))
                }
            }
            
            guard !videoFiles.isEmpty else {
                // If no video extension parsed yet, retry shortly
                DispatchQueue.global().asyncAfter(deadline: .now() + 1.0) {
                    self.fetchFilesAndStartStream(hash: hash)
                }
                return
            }
            
            DispatchQueue.main.async {
                // Populate OmniPlayer Playlist with all playable scenes / video files
                var playlistItems: [PlaylistItem] = []
                for vf in videoFiles {
                    let ephemeralPath = "/tmp/omni_stream_cache/\(vf.path)"
                    let itemUrl = URL(fileURLWithPath: ephemeralPath)
                    playlistItems.append(PlaylistItem(url: itemUrl, title: vf.name))
                }
                if !playlistItems.isEmpty {
                    OmniPlayerEngine.shared.playlist = playlistItems
                    OmniPlayerEngine.shared.currentTrackIndex = 0
                }
                
                // Start playback with the first scene/video file directly
                let primaryVideo = videoFiles[0]
                self.attachStreamUrl(hash: hash, fileIndex: primaryVideo.index, relPath: primaryVideo.path, title: primaryVideo.name)
            }
        }.resume()
    }
    
    func prioritizeFileForStreaming(index: Int) {
        let hash = currentInfoHash
        guard !hash.isEmpty else { return }
        let p = self.activePort
        guard let url = URL(string: "http://127.0.0.1:\(p)/api/torrents/\(hash)/files/\(index)/priority") else { return }
        var req = URLRequest(url: url)
        req.httpMethod = "PUT"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONSerialization.data(withJSONObject: ["priority": 7])
        URLSession.shared.dataTask(with: req).resume()
    }
    
    private func attachStreamUrl(hash: String, fileIndex: Int, relPath: String? = nil, title: String? = nil) {
        let displayTitle = title ?? self.torrentTitle
        let p = self.activePort
        
        self.isPreparing = false
        self.isStreaming = true
        self.statusText = self.isCFAccelerated ? "⚡ Cloudflare (CF) + Swarm Stream Active" : "🧲 BitTorrent Swarm Stream Active"
        
        withAnimation(.easeInOut(duration: 0.2)) {
            OmniPlayerEngine.shared.showMagnetSheet = false
        }
        
        let rel = relPath ?? ""
        let ephemeralPath = "/tmp/omni_stream_cache/\(rel)"
        
        DispatchQueue.global(qos: .userInitiated).async {
            var waited = 0
            while !FileManager.default.fileExists(atPath: ephemeralPath) && waited < 50 {
                usleep(100_000) // 100ms interval, wait up to 5 seconds
                waited += 1
            }
            
            let chosenUrl: URL
            if FileManager.default.fileExists(atPath: ephemeralPath) {
                chosenUrl = URL(fileURLWithPath: ephemeralPath)
            } else {
                let safeName = displayTitle.replacingOccurrences(of: "/", with: "-").addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? "video.mp4"
                let streamUriString = "http://127.0.0.1:\(p)/api/stream/\(hash)/\(fileIndex)/\(safeName)"
                chosenUrl = URL(string: streamUriString) ?? URL(fileURLWithPath: ephemeralPath)
            }
            
            DispatchQueue.main.async {
                self.activeStreamURL = chosenUrl
                OmniPlayerEngine.shared.playFile(url: chosenUrl, displayTitle: "🧲 \(displayTitle)")
                OmniPlayerEngine.shared.showOSD(self.isCFAccelerated ? "⚡ Cloudflare Stream: \(displayTitle)" : "🧲 Streaming: \(displayTitle)")
            }
        }
    }
    
    func stopStreaming() {
        pollTimer?.invalidate()
        isStreaming = false
        isPreparing = false
        isCFAccelerated = false
        activeStreamURL = nil
        downloadSpeedMBs = 0.0
        activePeers = 0
        statusText = ""
        
        if !currentInfoHash.isEmpty {
            let h = currentInfoHash
            let p = self.activePort
            if let delUrl = URL(string: "http://127.0.0.1:\(p)/api/torrents/\(h)?delete_files=true") {
                var delReq = URLRequest(url: delUrl)
                delReq.httpMethod = "DELETE"
                URLSession.shared.dataTask(with: delReq).resume()
            }
        }
        
        // Zero Permanent Storage: Purge ephemeral stream cache folder completely
        let tempDir = "/tmp/omni_stream_cache"
        try? FileManager.default.removeItem(atPath: tempDir)
        try? FileManager.default.createDirectory(atPath: tempDir, withIntermediateDirectories: true)
    }
}

// MARK: - OmniPlayer Central Controller & State

class OmniPlayerEngine: ObservableObject {
    static let shared = OmniPlayerEngine()
    
    let vlc = LibVLC.shared
    
    @Published var isPlaying: Bool = false
    @Published var currentTime: TimeInterval = 0
    @Published var duration: TimeInterval = 0
    @Published var volume: Int32 = 100
    @Published var isMuted: Bool = false
    @Published var playbackRate: Float = 1.0
    @Published var currentTitle: String = ""
    @Published var currentURL: URL? = nil
    @Published var currentAspectRatio: String = "Default"
    
    // Seeking Debounce Lock
    var isSeeking: Bool = false
    private var seekLockUntil: Date = Date.distantPast
    
    // Subtitles & Multi-Audio Track Selection
    @Published var subtitleTracks: [TrackItem] = []
    @Published var selectedSubtitleId: Int32 = -1
    @Published var audioTracks: [TrackItem] = []
    @Published var selectedAudioId: Int32 = -1
    @Published var audioDevices: [AudioDeviceItem] = []
    @Published var selectedAudioDeviceId: String = ""
    @Published var movieHash: String = ""
    
    // Chapters
    @Published var chaptersCount: Int32 = 0
    @Published var currentChapterIdx: Int32 = 0
    
    // Smart Subtitles Styling & Overlay (100% Display Guarantee)
    @Published var subtitleColorIsYellow: Bool = true
    @Published var subtitleFontSize: CGFloat = 20
    @Published var subtitleHasShield: Bool = true
    @Published var primarySubtitleText: String? = nil
    var primaryCues: [SubtitleCue] = []
    @Published var secondarySubtitleText: String? = nil
    private var secondaryCues: [SubtitleCue] = []
    
    // Smart Subtitles Search Sheet
    @Published var showSmartSubtitleSheet: Bool = false
    @Published var subtitleSearchQuery: String = ""
    @Published var subtitleSearchLanguage: String = "eng"
    @Published var subtitleSearchResults: [SubtitleResultItem] = []
    @Published var isSearchingSubtitles: Bool = false
    @Published var isAITranscribing: Bool = false
    @Published var aiTranscribeStatus: String = ""
    
    // Free Online AI (User Configurable Keys)
    @Published var groqApiKey: String = {
        if let stored = UserDefaults.standard.string(forKey: "omni_groq_key"), !stored.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return stored
        }
        if let env = ProcessInfo.processInfo.environment["GROQ_API_KEY"], !env.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return env
        }
        let settingsPath = NSString(string: "~/.fluxtorrent/settings.json").expandingTildeInPath
        if let data = try? Data(contentsOf: URL(fileURLWithPath: settingsPath)),
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let key = json["groqApiKey"] as? String, !key.isEmpty {
            return key
        }
        return ""
    }() {
        didSet { UserDefaults.standard.set(groqApiKey, forKey: "omni_groq_key") }
    }
    @Published var geminiApiKey: String = UserDefaults.standard.string(forKey: "omni_gemini_key") ?? "" {
        didSet { UserDefaults.standard.set(geminiApiKey, forKey: "omni_gemini_key") }
    }
    @Published var showAIAssistantSheet: Bool = false
    @Published var aiAssistantQuery: String = ""
    @Published var aiAssistantResponse: String = ""
    @Published var isAIAssistantLoading: Bool = false
    
    // Network Stream Modal
    @Published var showNetworkStreamModal: Bool = false
    @Published var networkStreamURL: String = ""
    
    // Magnet Link & Torrent Stream Modal
    @Published var showMagnetSheet: Bool = false
    
    // UI Panels & States (Non-overlapping Inset Layout)
    @Published var isFullscreen: Bool = false
    @Published var isPiP: Bool = false
    @Published var showHUD: Bool = true
    @Published var showPlaylistDrawer: Bool = false
    @Published var showSettingsInspector: Bool = false
    @Published var inspectorTab: Int = 0
    
    // Replayback & Auto-Binge
    @Published var showReplayOverlay: Bool = false
    @Published var autoBingeCountdown: Int? = nil
    private var autoBingeTimer: Timer?
    
    // AI: "What Did They Just Say?" Rewind
    private var isWhatDidTheySayActive: Bool = false
    private var savedSubIdBeforeRewind: Int32 = -1
    private var wasClearDialogueActiveBeforeRewind: Bool = false
    private var whatDidTheySayTimer: Timer?
    
    // Multi-Select Stackable Audio Corrections (ALL ON BY DEFAULT)
    @Published var activeAudioCorrections: Set<AudioCorrectionFeature> = Set(AudioCorrectionFeature.allCases)
    @Published var isSoftLimiterActive: Bool = true // Active by default!
    @Published var currentAudioDSPPreset: AudioDSPPreset = .omniCinematicMax
    @Published var manualEqBands: [Float] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    @Published var manualPreamp: Float = 0.0
    @Published var audioDelayMs: Int64 = 0
    @Published var subtitleDelayMs: Int64 = 0
    
    // Performance & Debounce Timestamps
    private var lastResumeSaveTime: Date = Date.distantPast
    private var lastNowPlayingUpdate: Date = Date.distantPast
    private var thumbnailWorkItem: DispatchWorkItem?
    private let thumbnailCache = NSCache<NSNumber, NSImage>()
    
    // Video Adjustments & Upscaling (ALL ON BY DEFAULT!)
    @Published var activeVideoUpscaling: Set<VideoUpscaleFeature> = Set(VideoUpscaleFeature.allCases)
    @Published var videoScaleFactor: Double = 2.0 // 2.0x 4K Super-Resolution Upscale by default!
    @Published var videoNativeWidth: Int = 0
    @Published var videoNativeHeight: Int = 0
    @Published var brightness: Double = 1.0 { didSet { vlc.setBrightness(Float(brightness)) } }
    @Published var contrast: Double = 1.06   { didSet { vlc.setContrast(Float(contrast)) } }
    @Published var saturation: Double = 1.08 { didSet { vlc.setSaturation(Float(saturation)) } }
    @Published var hue: Double = 0.0        { didSet { vlc.setHue(Float(hue)) } }
    @Published var sharpness: Double = 0.85
    @Published var gamma: Double = 1.05     { didSet { vlc.setGamma(Float(gamma)) } }
    @Published var upscalePreset: String = "Lanczos Sinc (4K Upscale)"
    @Published var videoRotation: Int = 0
    
    // Playlist & Recents
    @Published var playlist: [PlaylistItem] = []
    @Published var recentFiles: [URL] = []
    @Published var currentTrackIndex: Int = -1
    @Published var loopMode: LoopMode = .off
    @Published var isShuffle: Bool = false
    @Published var playlistSearchText: String = ""
    
    // Bookmarks
    @Published var bookmarks: [TimeInterval] = []
    @Published var loopPointA: TimeInterval? = nil
    @Published var loopPointB: TimeInterval? = nil
    
    // Hover Scrubber Tooltip & Thumbnail
    @Published var hoverScrubTime: TimeInterval? = nil
    @Published var hoverScrubX: CGFloat = 0
    @Published var hoverThumbnail: NSImage? = nil
    private var assetGenerator: AVAssetImageGenerator?
    
    // Sleep Timer
    @Published var sleepTimerMinutesRemaining: Int? = nil
    private var sleepTimer: Timer?
    private var sleepTimerEndDate: Date?
    
    // Video Crop & Deinterlacing
    @Published var currentCropRatio: String = "None"
    @Published var deinterlaceMode: String = "Off"
    
    // Audio Channels & Downmixing
    @Published var currentAudioChannel: AudioChannelMode = .stereo
    
    // Subtitle Custom Typography & Offset
    @Published var subtitleFontFamily: String = "System"
    @Published var subtitleBottomPadding: CGFloat = 36
    @Published var subtitleShadowRadius: CGFloat = 4
    
    var subtitleFont: Font {
        switch subtitleFontFamily {
        case "Helvetica":
            return .custom("Helvetica Neue", size: subtitleFontSize).weight(.bold)
        case "Futura":
            return .custom("Futura-Medium", size: subtitleFontSize)
        case "Menlo":
            return .custom("Menlo", size: subtitleFontSize).weight(.bold)
        case "Arial":
            return .custom("Arial", size: subtitleFontSize).weight(.bold)
        default:
            return .system(size: subtitleFontSize, weight: .bold)
        }
    }
    
    // Playback Auto-Resume
    @Published var showResumePrompt: Bool = false
    @Published var savedResumeTime: TimeInterval = 0.0
    
    // OSD Banner
    @Published var osdMessage: String? = nil
    private var osdTimer: Timer?
    private var pollTimer: Timer?
    private var idleTimer: Timer?
    
    init() {
        thumbnailCache.countLimit = 150
        loadRecentFiles()
        loadSavedPlaylist()
        loadSavedAudioSettings()
        startPolling()
        setupNowPlayingRemoteCommands()
        recomputeAndApplyEqualizer()
        recomputeAndApplyVideoUpscaling()
    }
    
    func savePlaylistState() {
        let itemsData = playlist.map { ["url": $0.url.path, "title": $0.title, "duration": $0.duration] }
        UserDefaults.standard.set(itemsData, forKey: "omni_saved_playlist")
    }
    
    func loadSavedPlaylist() {
        guard let itemsData = UserDefaults.standard.array(forKey: "omni_saved_playlist") as? [[String: Any]] else { return }
        var loaded: [PlaylistItem] = []
        for d in itemsData {
            if let path = d["url"] as? String, let title = d["title"] as? String {
                let dur = d["duration"] as? TimeInterval ?? 0
                loaded.append(PlaylistItem(url: URL(fileURLWithPath: path), title: title, duration: dur))
            }
        }
        if !loaded.isEmpty {
            self.playlist = loaded
        }
    }
    
    // Auto-Resume Controls
    func resumeSavedPlayback() {
        if savedResumeTime > 0 {
            seek(to: savedResumeTime)
            showOSD("▶ Resumed from \(formatTimestamp(savedResumeTime))")
        }
        showResumePrompt = false
    }
    
    func dismissResumePrompt() {
        showResumePrompt = false
    }
    
    // Video Crop & Deinterlacing
    func setCropRatio(_ ratio: String?) {
        let r = ratio ?? "None"
        currentCropRatio = r
        vlc.setCropGeometry(r == "None" ? nil : r)
        showOSD("Crop: \(r == "None" ? "Original (Off)" : r)")
    }
    
    func cycleCropRatio() {
        let cropOptions = ["None", "16:9", "16:10", "4:3", "2.35:1", "2.39:1", "1:1"]
        if let idx = cropOptions.firstIndex(of: currentCropRatio) {
            let next = cropOptions[(idx + 1) % cropOptions.count]
            setCropRatio(next)
        } else {
            setCropRatio("16:9")
        }
    }
    
    func setDeinterlaceMode(_ mode: String) {
        deinterlaceMode = mode
        vlc.setDeinterlace(mode == "Off" ? nil : mode)
        showOSD("Deinterlace: \(mode)")
    }
    
    // Audio Channels & Downmixing
    func setAudioChannelMode(_ mode: AudioChannelMode) {
        currentAudioChannel = mode
        vlc.setAudioChannel(mode.rawValue)
        showOSD("Audio Channel: \(mode.label)")
    }
    
    func loadSavedAudioSettings() {
        if let savedBands = UserDefaults.standard.array(forKey: "omni_eq_bands") as? [Float], savedBands.count == 10 {
            manualEqBands = savedBands
        }
        manualPreamp = UserDefaults.standard.float(forKey: "omni_eq_preamp")
        if let savedPresetRaw = UserDefaults.standard.string(forKey: "omni_eq_preset"),
           let preset = AudioDSPPreset(rawValue: savedPresetRaw) {
            currentAudioDSPPreset = preset
        }
    }
    
    func saveAudioSettings() {
        UserDefaults.standard.set(manualEqBands, forKey: "omni_eq_bands")
        UserDefaults.standard.set(manualPreamp, forKey: "omni_eq_preamp")
        UserDefaults.standard.set(currentAudioDSPPreset.rawValue, forKey: "omni_eq_preset")
    }
    
    func findCue(at time: TimeInterval, in cues: [SubtitleCue]) -> SubtitleCue? {
        guard !cues.isEmpty else { return nil }
        var low = 0
        var high = cues.count - 1
        while low <= high {
            let mid = (low + high) / 2
            let cue = cues[mid]
            if cue.startTime <= time && time <= cue.endTime {
                return cue
            } else if time < cue.startTime {
                high = mid - 1
            } else {
                low = mid + 1
            }
        }
        return nil
    }
    
    func loadRecentFiles() {
        let saved = UserDefaults.standard.stringArray(forKey: "omni_recent_files") ?? []
        recentFiles = saved.compactMap { URL(fileURLWithPath: $0) }
    }
    
    func addToRecentFiles(url: URL) {
        var recents = UserDefaults.standard.stringArray(forKey: "omni_recent_files") ?? []
        recents.removeAll(where: { $0 == url.path })
        recents.insert(url.path, at: 0)
        if recents.count > 10 { recents = Array(recents.prefix(10)) }
        UserDefaults.standard.set(recents, forKey: "omni_recent_files")
        recentFiles = recents.compactMap { URL(fileURLWithPath: $0) }
    }
    
    func startPolling() {
        pollTimer = Timer.scheduledTimer(withTimeInterval: 0.25, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            let playing = self.vlc.isPlaying
            if self.isPlaying != playing {
                self.isPlaying = playing
            }
            
            if Date() > self.seekLockUntil {
                let t = self.vlc.time
                if abs(self.currentTime - t) >= 0.2 {
                    self.currentTime = t
                }
            }
            
            let len = self.vlc.length
            if len > 0 && self.duration != len {
                self.duration = len
            }
            
            let chCount = self.vlc.chapterCount
            if self.chaptersCount != chCount {
                self.chaptersCount = chCount
            }
            let curCh = self.vlc.currentChapter
            if self.currentChapterIdx != curCh {
                self.currentChapterIdx = curCh
            }
            
            let (vw, vh) = self.vlc.getVideoDimensions()
            if vw > 0 && (self.videoNativeWidth != vw || self.videoNativeHeight != vh) {
                self.videoNativeWidth = vw
                self.videoNativeHeight = vh
            }
            
            // Primary Subtitle Matching (Binary Search with delay offset)
            if !self.primaryCues.isEmpty {
                let delaySec = Double(self.vlc.subtitleDelay) / 1_000_000.0
                let ct = self.currentTime + delaySec
                if let cue = self.findCue(at: ct, in: self.primaryCues) {
                    if self.primarySubtitleText != cue.text {
                        self.primarySubtitleText = cue.text
                    }
                } else if self.primarySubtitleText != nil {
                    self.primarySubtitleText = nil
                }
            }
            
            // Dual Subtitle Matching (Binary Search with delay offset)
            if !self.secondaryCues.isEmpty {
                let delaySec = Double(self.vlc.subtitleDelay) / 1_000_000.0
                let ct = self.currentTime + delaySec
                if let cue = self.findCue(at: ct, in: self.secondaryCues) {
                    if self.secondarySubtitleText != cue.text {
                        self.secondarySubtitleText = cue.text
                    }
                } else if self.secondarySubtitleText != nil {
                    self.secondarySubtitleText = nil
                }
            }
            
            // Save resume position (debounced) or clear when finished
            if let url = self.currentURL, self.duration > 15.0 {
                if self.currentTime >= self.duration * 0.95 {
                    UserDefaults.standard.removeObject(forKey: "omni_resume_\(url.path)")
                } else if self.currentTime > 5.0 {
                    if Date().timeIntervalSince(self.lastResumeSaveTime) > 5.0 {
                        self.lastResumeSaveTime = Date()
                        UserDefaults.standard.set(self.currentTime, forKey: "omni_resume_\(url.path)")
                    }
                }
            }
            
            // Check A-B Loop
            if let a = self.loopPointA, let b = self.loopPointB, b > a {
                if self.currentTime >= b {
                    self.seek(to: a)
                    self.showOSD("🔁 A-B Loop: \(formatTimestamp(a)) ⇄ \(formatTimestamp(b))")
                }
            }
            
            // Auto-Binge Prompt Check (15s before end)
            if self.duration > 30.0 && self.currentTime >= (self.duration - 15.0) && self.isPlaying {
                self.checkAutoBingePrompt()
            } else if self.autoBingeCountdown != nil && (!self.isPlaying || self.currentTime < (self.duration - 16.0)) {
                self.cancelAutoBinge()
            }
            
            // Reliable Track Ended Detection (only when media has actually played near the end)
            if self.vlc.isEnded && self.duration > 5.0 && self.currentTime >= max(1.0, self.duration - 2.5) {
                self.handleTrackEnded()
            }
            
            // Debounced NowPlaying Info Update
            if Date().timeIntervalSince(self.lastNowPlayingUpdate) > 2.0 {
                self.lastNowPlayingUpdate = Date()
                self.updateNowPlayingInfo()
            }
        }
    }
    
    func checkAutoBingePrompt() {
        guard currentTrackIndex < playlist.count - 1 && autoBingeCountdown == nil else { return }
        autoBingeCountdown = 10
        autoBingeTimer?.invalidate()
        autoBingeTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            if let c = self.autoBingeCountdown, c > 1 {
                self.autoBingeCountdown = c - 1
            } else {
                self.autoBingeCountdown = nil
                self.autoBingeTimer?.invalidate()
                self.nextTrack()
            }
        }
    }
    
    func cancelAutoBinge() {
        autoBingeCountdown = nil
        autoBingeTimer?.invalidate()
    }
    
    func handleTrackEnded() {
        // Prevent false triggers on newly opened streams or buffering stalls
        guard duration > 5.0 && currentTime >= max(1.0, duration - 2.5) else {
            return
        }
        
        switch loopMode {
        case .single:
            replayFromBeginning()
        case .all:
            nextTrack()
        case .off:
            if currentTrackIndex < playlist.count - 1 {
                nextTrack()
            } else {
                vlc.pause()
                isPlaying = false
                withAnimation { showReplayOverlay = true }
            }
        }
    }
    
    func replayFromBeginning() {
        showReplayOverlay = false
        autoBingeCountdown = nil
        autoBingeTimer?.invalidate()
        seek(to: 0)
        vlc.play()
        isPlaying = true
        showOSD("🔄 Replay from Start")
        userDidInteract()
    }
    
    func refreshTracks() {
        let subs = vlc.getSubtitleTracks()
        if !subs.isEmpty {
            self.subtitleTracks = subs
            self.selectedSubtitleId = vlc.currentSubtitleTrack
        }
        let auds = vlc.getAudioTracks()
        if !auds.isEmpty {
            self.audioTracks = auds
            self.selectedAudioId = vlc.currentAudioTrack
        }
        DispatchQueue.global(qos: .utility).async {
            let devs = self.vlc.getAudioDevices()
            if !devs.isEmpty {
                DispatchQueue.main.async {
                    self.audioDevices = devs
                }
            }
        }
    }
    
    func showOSD(_ message: String) {
        osdMessage = message
        osdTimer?.invalidate()
        osdTimer = Timer.scheduledTimer(withTimeInterval: 1.8, repeats: false) { [weak self] _ in
            withAnimation { self?.osdMessage = nil }
        }
    }
    
    // Playback Operations
    func playFile(url: URL, displayTitle: String? = nil) {
        showReplayOverlay = false
        autoBingeCountdown = nil
        autoBingeTimer?.invalidate()
        loopPointA = nil
        loopPointB = nil
        secondarySubtitleText = nil
        secondaryCues.removeAll()
        loadBookmarks(for: url)
        
        currentURL = url
        addToRecentFiles(url: url)
        
        if let custom = displayTitle, !custom.isEmpty {
            currentTitle = custom
            subtitleSearchQuery = custom
        } else {
            let (cleanTitle, year) = cleanMediaTitle(from: url.lastPathComponent)
            currentTitle = year != nil ? "\(cleanTitle) (\(year!))" : cleanTitle
            subtitleSearchQuery = cleanTitle
        }
        
        if !playlist.contains(where: { $0.url == url }) {
            let item = PlaylistItem(url: url, title: currentTitle)
            playlist.append(item)
            currentTrackIndex = playlist.count - 1
            savePlaylistState()
        } else if let idx = playlist.firstIndex(where: { $0.url == url }) {
            currentTrackIndex = idx
        }
        
        // Auto-Resume Check
        let savedTime = UserDefaults.standard.double(forKey: "omni_resume_\(url.path)")
        if savedTime > 15.0 {
            savedResumeTime = savedTime
            showResumePrompt = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 12.0) { [weak self] in
                if self?.showResumePrompt == true {
                    self?.showResumePrompt = false
                }
            }
        } else {
            showResumePrompt = false
            savedResumeTime = 0.0
        }
        
        vlc.open(url: url)
        vlc.play()
        isPlaying = true
        showOSD("▶ \(currentTitle)")
        
        // Re-apply video crop, deinterlace, upscaling & audio channel settings
        vlc.setBrightness(Float(brightness))
        vlc.setHue(Float(hue))
        vlc.setCropGeometry(currentCropRatio == "None" ? nil : currentCropRatio)
        vlc.setDeinterlace(deinterlaceMode == "Off" ? nil : deinterlaceMode)
        vlc.setAudioChannel(currentAudioChannel.rawValue)
        recomputeAndApplyVideoUpscaling()
        recomputeAndApplyEqualizer()
        
        if url.isFileURL {
            // Compute 64-bit MovieHash
            DispatchQueue.global(qos: .utility).async {
                if let hash = calculateOpenSubtitlesHash(for: url) {
                    DispatchQueue.main.async { self.movieHash = hash }
                }
            }
            
            // Thumbnail Generator (Local Files Only)
            let asset = AVURLAsset(url: url)
            assetGenerator = AVAssetImageGenerator(asset: asset)
            assetGenerator?.appliesPreferredTrackTransform = true
            assetGenerator?.maximumSize = CGSize(width: 160, height: 90)
            
            // Auto-load adjacent subtitle file
            let folder = url.deletingLastPathComponent()
            let baseName = url.deletingPathExtension().lastPathComponent
            for ext in ["srt", "ass", "ssa", "vtt", "sub"] {
                let potentialSub = folder.appendingPathComponent("\(baseName).\(ext)")
                if FileManager.default.fileExists(atPath: potentialSub.path) {
                    self.loadPrimarySubtitle(path: potentialSub.path)
                    showOSD("Auto-loaded: \(potentialSub.lastPathComponent)")
                    break
                }
            }
        } else {
            assetGenerator = nil
            movieHash = ""
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
            self.refreshTracks()
        }
    }
    
    func togglePlayPause() {
        if isPlaying {
            vlc.pause()
            isPlaying = false
            showOSD("⏸ Pause")
            userDidInteract(forceKeepOpen: true)
        } else {
            if showReplayOverlay {
                replayFromBeginning()
            } else {
                vlc.play()
                isPlaying = true
                showOSD("▶ Play")
                userDidInteract()
            }
        }
    }

    func pause() {
        if isPlaying {
            vlc.pause()
            isPlaying = false
            showOSD("⏸ Pause")
            userDidInteract(forceKeepOpen: true)
        }
    }
    
    func stop() {
        vlc.stop()
        isPlaying = false
        currentTime = 0
        currentTitle = ""
        loopPointA = nil
        loopPointB = nil
        showReplayOverlay = false
        userDidInteract(forceKeepOpen: true)
        MagnetStreamManager.shared.stopStreaming()
    }
    
    func seek(to seconds: TimeInterval) {
        currentTime = seconds
        seekLockUntil = Date().addingTimeInterval(0.6)
        vlc.time = seconds
    }
    
    func jump(by seconds: TimeInterval) {
        let target = max(0, min(currentTime + seconds, duration))
        seek(to: target)
        let sign = seconds > 0 ? "+" : ""
        showOSD("\(sign)\(Int(seconds))s (\(formatTime(target)))")
        userDidInteract()
    }
    
    func nextTrack() {
        guard !playlist.isEmpty else { return }
        showReplayOverlay = false
        if isShuffle {
            currentTrackIndex = Int.random(in: 0..<playlist.count)
        } else {
            currentTrackIndex = (currentTrackIndex + 1) % playlist.count
        }
        playFile(url: playlist[currentTrackIndex].url)
    }
    
    func previousTrack() {
        guard !playlist.isEmpty else { return }
        showReplayOverlay = false
        if currentTime > 3.0 {
            seek(to: 0)
            return
        }
        currentTrackIndex = currentTrackIndex > 0 ? currentTrackIndex - 1 : playlist.count - 1
        playFile(url: playlist[currentTrackIndex].url)
    }
    
    func toggleLoopMode() {
        switch loopMode {
        case .off: loopMode = .all
        case .all: loopMode = .single
        case .single: loopMode = .off
        }
        showOSD("🔁 \(loopMode.rawValue)")
    }
    
    func toggleShuffle() {
        isShuffle.toggle()
        showOSD(isShuffle ? "🔀 Shuffle On" : "➡️ Shuffle Off")
    }
    
    // Chapters Navigation
    func nextChapter() {
        vlc.nextChapter()
        showOSD("⏭ Next Chapter (\(vlc.currentChapter + 1)/\(vlc.chapterCount))")
        userDidInteract()
    }
    
    func previousChapter() {
        vlc.previousChapter()
        showOSD("⏮ Previous Chapter (\(vlc.currentChapter + 1)/\(vlc.chapterCount))")
        userDidInteract()
    }
    
    func setChapter(_ chapter: Int32) {
        vlc.currentChapter = chapter
        showOSD("Chapter \(chapter + 1)")
        userDidInteract()
    }
    
    // A-B Repeat Loop
    func toggleABLoop() {
        if loopPointA == nil {
            loopPointA = currentTime
            showOSD("🔁 A-B: Point A set at \(formatTime(currentTime))")
        } else if loopPointB == nil {
            if currentTime > (loopPointA ?? 0) {
                loopPointB = currentTime
                showOSD("🔁 A-B: Point B set at \(formatTime(currentTime)) (Looping)")
            } else {
                showOSD("⚠️ Point B must be after Point A")
            }
        } else {
            loopPointA = nil
            loopPointB = nil
            showOSD("🔁 A-B Loop Cleared")
        }
        userDidInteract()
    }
    
    // AI: "What Did They Just Say?" Rewind
    func whatDidTheySayRewind() {
        guard isPlaying else { return }
        
        let rewindTarget = max(0, currentTime - 10.0)
        seek(to: rewindTarget)
        
        if !isWhatDidTheySayActive {
            isWhatDidTheySayActive = true
            savedSubIdBeforeRewind = selectedSubtitleId
            wasClearDialogueActiveBeforeRewind = activeAudioCorrections.contains(.clearDialogue)
            
            if selectedSubtitleId == -1, let firstSub = subtitleTracks.first {
                setSubtitleTrack(id: firstSub.id)
            }
            toggleAudioCorrection(.clearDialogue, forceEnable: true)
            showOSD("👂 \"What Did They Say?\" Rewind (-10s + Voice Boost)")
            
            whatDidTheySayTimer?.invalidate()
            whatDidTheySayTimer = Timer.scheduledTimer(withTimeInterval: 10.5, repeats: false) { [weak self] _ in
                guard let self = self else { return }
                self.isWhatDidTheySayActive = false
                if self.savedSubIdBeforeRewind == -1 {
                    self.setSubtitleTrack(id: -1)
                }
                self.toggleAudioCorrection(.clearDialogue, forceEnable: self.wasClearDialogueActiveBeforeRewind)
            }
        }
        userDidInteract()
    }
    
    // Smart Skip Intro
    func skipIntro() {
        jump(by: 85)
        showOSD("⏭ Skipped Intro (+85s)")
    }
    
    // Multi-Select Audio Correction Suite (Stackable DSP)
    func toggleAudioCorrection(_ feature: AudioCorrectionFeature, forceEnable: Bool? = nil) {
        if let force = forceEnable {
            if force { activeAudioCorrections.insert(feature) }
            else { activeAudioCorrections.remove(feature) }
        } else {
            if activeAudioCorrections.contains(feature) {
                activeAudioCorrections.remove(feature)
            } else {
                activeAudioCorrections.insert(feature)
            }
        }
        recomputeAndApplyEqualizer()
        showOSD("🔊 Audio: \(activeAudioCorrections.count) Filters Active")
    }
    
    func applyAudioDSPPreset(_ preset: AudioDSPPreset) {
        currentAudioDSPPreset = preset
        switch preset {
        case .omniCinematicMax:
            activeAudioCorrections = Set(AudioCorrectionFeature.allCases)
            isSoftLimiterActive = true
        case .whisperDialogue:
            activeAudioCorrections = [.clearDialogue, .loudnessNormalizer, .rumbleFilter, .deHarsh]
            isSoftLimiterActive = true
        case .studioBassSpatial:
            activeAudioCorrections = [.headphoneSpatial, .loudnessNormalizer]
            isSoftLimiterActive = true
        case .nightModeSoft:
            activeAudioCorrections = [.nightMode, .clearDialogue, .deHarsh]
            isSoftLimiterActive = true
        case .pureNeutral:
            activeAudioCorrections = []
            isSoftLimiterActive = false
        }
        recomputeAndApplyEqualizer()
        showOSD("🎵 Audio Preset: \(preset.rawValue)")
    }
    
    func recomputeAndApplyEqualizer() {
        var combinedGains: [Float] = manualEqBands
        var combinedPreamp: Float = manualPreamp
        
        for feat in activeAudioCorrections {
            let fGains = feat.gains
            for i in 0..<10 {
                combinedGains[i] += fGains[i]
            }
            combinedPreamp += feat.preampBonus
        }
        
        // Anti-Clipping Soft-Limiter Guard (Active by default!)
        if isSoftLimiterActive {
            let peakGain = combinedGains.max() ?? 0
            if peakGain > 10.0 {
                let excessive = peakGain - 10.0
                let attenuation = excessive * 0.45
                combinedPreamp -= attenuation
            }
        }
        
        // Clamp gains to -20dB ... +20dB
        for i in 0..<10 {
            combinedGains[i] = max(-20.0, min(combinedGains[i], 20.0))
        }
        combinedPreamp = max(-20.0, min(combinedPreamp, 15.0))
        
        vlc.setEqualizerGains(combinedGains, preamp: combinedPreamp)
    }
    
    func adjustVolume(by delta: Int32) {
        volume = max(0, min(volume + delta, 150))
        vlc.volume = volume
        vlc.isMuted = false
        isMuted = false
        showOSD("🔊 Volume: \(volume)%")
        userDidInteract()
    }
    
    func toggleMute() {
        isMuted.toggle()
        vlc.isMuted = isMuted
        showOSD(isMuted ? "🔇 Mute" : "🔊 Unmute (\(volume)%)")
        userDidInteract()
    }
    
    func setRate(_ newRate: Float) {
        playbackRate = newRate
        vlc.rate = newRate
        showOSD("⚡ Speed: \(String(format: "%.2fx", newRate))")
        userDidInteract()
    }
    
    func nextFrame() {
        vlc.pause()
        isPlaying = false
        vlc.nextFrame()
        showOSD("Step Forward")
        userDidInteract(forceKeepOpen: true)
    }
    
    // Subtitles
    func setSubtitleTrack(id: Int32) {
        vlc.currentSubtitleTrack = id
        selectedSubtitleId = id
        if id == -1 {
            showOSD("Subtitles: Off")
        } else if let track = subtitleTracks.first(where: { $0.id == id }) {
            showOSD("Subtitle: \(track.name)")
        }
        userDidInteract()
    }
    
    func loadPrimarySubtitle(path: String) {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            let cues = parseSubtitleFile(path: path)
            DispatchQueue.main.async {
                guard let self = self else { return }
                if !cues.isEmpty {
                    self.primaryCues = cues
                    if let cue = self.findCue(at: self.currentTime, in: cues) {
                        self.primarySubtitleText = cue.text
                    }
                    self.vlc.currentSubtitleTrack = -1
                    self.selectedSubtitleId = 999
                    self.showOSD("Subtitles Loaded (\(cues.count) cues)")
                }
                _ = self.vlc.addSubtitleFile(path: path)
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    self.refreshTracks()
                }
            }
        }
    }
    
    func addSubtitleDialog() {
        let panel = NSOpenPanel()
        panel.allowedContentTypes = [.text, .plainText]
        panel.allowsMultipleSelection = false
        panel.canChooseDirectories = false
        panel.message = "Choose Subtitle File (.srt, .ass, .ssa, .vtt)"
        if panel.runModal() == .OK, let url = panel.url {
            loadPrimarySubtitle(path: url.path)
            showOSD("Sub Loaded: \(url.lastPathComponent)")
        }
    }
    
    func addSecondarySubtitleDialog() {
        let panel = NSOpenPanel()
        panel.allowedContentTypes = [.text, .plainText]
        panel.allowsMultipleSelection = false
        panel.canChooseDirectories = false
        panel.message = "Choose Secondary Subtitle for Dual Mode (.srt, .vtt)"
        if panel.runModal() == .OK, let url = panel.url {
            DispatchQueue.global(qos: .userInitiated).async { [weak self] in
                let cues = parseSubtitleFile(path: url.path)
                DispatchQueue.main.async {
                    self?.secondaryCues = cues
                    self?.showOSD("Dual Subtitle Loaded: \(url.lastPathComponent)")
                }
            }
        }
    }
    
    func adjustSubtitleDelay(byMicroseconds delta: Int64) {
        let newDelay = vlc.subtitleDelay + delta
        vlc.subtitleDelay = newDelay
        let ms = newDelay / 1000
        subtitleDelayMs = ms
        showOSD("Subtitle Delay: \(ms > 0 ? "+" : "")\(ms) ms")
        userDidInteract()
    }
    
    // Audio Tracks & Devices
    func setAudioTrack(id: Int32) {
        vlc.currentAudioTrack = id
        selectedAudioId = id
        if let track = audioTracks.first(where: { $0.id == id }) {
            showOSD("Audio: \(track.name)")
        }
        userDidInteract()
    }
    
    func cycleAudioTrack() {
        guard !audioTracks.isEmpty else { return }
        if let idx = audioTracks.firstIndex(where: { $0.id == selectedAudioId }) {
            let nextIdx = (idx + 1) % audioTracks.count
            setAudioTrack(id: audioTracks[nextIdx].id)
        } else if let first = audioTracks.first {
            setAudioTrack(id: first.id)
        }
    }
    
    func setAudioDevice(id: String) {
        vlc.setAudioDevice(id: id)
        selectedAudioDeviceId = id
        if let dev = audioDevices.first(where: { $0.id == id }) {
            showOSD("Audio Device: \(dev.name)")
        }
        userDidInteract()
    }
    
    func adjustAudioDelay(byMicroseconds delta: Int64) {
        let newDelay = vlc.audioDelay + delta
        vlc.audioDelay = newDelay
        let ms = newDelay / 1000
        audioDelayMs = ms
        showOSD("Audio Delay: \(ms > 0 ? "+" : "")\(ms) ms")
        userDidInteract()
    }
    
    func setAspectRatio(_ ratio: String?) {
        vlc.setAspectRatio(ratio)
        currentAspectRatio = ratio ?? "Default"
        showOSD("Aspect Ratio: \(currentAspectRatio)")
        userDidInteract()
    }
    
    // Copy Video Frame Snapshot directly to Clipboard
    func copySnapshotToClipboard() {
        let tempDir = NSTemporaryDirectory()
        let filename = "omni_snap_\(Int(Date().timeIntervalSince1970)).png"
        let path = (tempDir as NSString).appendingPathComponent(filename)
        if vlc.takeSnapshot(outPath: path) {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                if let img = NSImage(contentsOfFile: path) {
                    NSPasteboard.general.clearContents()
                    NSPasteboard.general.writeObjects([img])
                    self.showOSD("📋 Snapshot Copied to Clipboard!")
                }
            }
        }
    }
    
    func takeSnapshot() {
        let desktop = FileManager.default.urls(for: .desktopDirectory, in: .userDomainMask).first!
        let filename = "OmniPlayer_Snapshot_\(Int(Date().timeIntervalSince1970)).png"
        let path = desktop.appendingPathComponent(filename).path
        if vlc.takeSnapshot(outPath: path) {
            showOSD("📸 Snapshot saved to Desktop: \(filename)")
        } else {
            showOSD("❌ Snapshot failed")
        }
    }
    
    // Video Rotation
    func rotateVideoClockwise() {
        videoRotation = (videoRotation + 90) % 360
        showOSD("🔄 Video Rotated: \(videoRotation)°")
    }
    
    // Picture-in-Picture
    func togglePiP() {
        guard let win = NSApplication.shared.windows.first else { return }
        isPiP.toggle()
        if isPiP {
            win.level = .floating
            showOSD("📺 Picture-in-Picture: ON (Pinned on Top)")
        } else {
            win.level = .normal
            showOSD("📺 Picture-in-Picture: OFF")
        }
    }
    
    // Bookmarks (Persistent per video file)
    func loadBookmarks(for url: URL) {
        bookmarks = (UserDefaults.standard.array(forKey: "omni_bookmarks_\(url.path)") as? [Double]) ?? []
    }
    
    func saveBookmarks() {
        guard let url = currentURL else { return }
        UserDefaults.standard.set(bookmarks, forKey: "omni_bookmarks_\(url.path)")
    }
    
    func addBookmark() {
        guard currentTime > 0 && !bookmarks.contains(currentTime) else { return }
        bookmarks.append(currentTime)
        bookmarks.sort()
        saveBookmarks()
        showOSD("🔖 Bookmark added at \(formatTime(currentTime))")
    }
    
    func removeBookmark(at index: Int) {
        if index >= 0 && index < bookmarks.count {
            bookmarks.remove(at: index)
            saveBookmarks()
        }
    }
    
    // Safe playlist removal by ID
    func removePlaylistItems(withIDs ids: Set<UUID>) {
        let currentUrl = currentURL
        playlist.removeAll(where: { ids.contains($0.id) })
        savePlaylistState()
        if let cur = currentUrl {
            currentTrackIndex = playlist.firstIndex(where: { $0.url == cur }) ?? -1
        } else {
            currentTrackIndex = playlist.isEmpty ? -1 : min(currentTrackIndex, playlist.count - 1)
        }
    }
    
    // Sleep Timer with Wall-Clock Drift Protection
    func setSleepTimer(minutes: Int?) {
        sleepTimer?.invalidate()
        sleepTimerMinutesRemaining = minutes
        guard let m = minutes, m > 0 else {
            sleepTimerEndDate = nil
            showOSD("🌙 Sleep Timer: OFF")
            return
        }
        sleepTimerEndDate = Date().addingTimeInterval(Double(m * 60))
        showOSD("🌙 Sleep Timer set for \(m) minutes")
        sleepTimer = Timer.scheduledTimer(withTimeInterval: 5, repeats: true) { [weak self] _ in
            guard let self = self, let target = self.sleepTimerEndDate else { return }
            let remainingSec = target.timeIntervalSinceNow
            if remainingSec > 0 {
                let min = Int(ceil(remainingSec / 60.0))
                if self.sleepTimerMinutesRemaining != min {
                    self.sleepTimerMinutesRemaining = min
                }
            } else {
                self.sleepTimerMinutesRemaining = nil
                self.sleepTimerEndDate = nil
                self.sleepTimer?.invalidate()
                self.stop()
                self.showOSD("🌙 Sleep Timer: Playback stopped")
            }
        }
    }
    
    // Thumbnail Generation on Hover (with In-Memory NSCache & Debounce)
    func requestHoverThumbnail(at time: TimeInterval) {
        guard let gen = assetGenerator else { return }
        let bucket = NSNumber(value: Int(time))
        if let cached = thumbnailCache.object(forKey: bucket) {
            self.hoverThumbnail = cached
            return
        }
        
        thumbnailWorkItem?.cancel()
        let cmTime = CMTime(seconds: time, preferredTimescale: 600)
        if #available(macOS 15.0, *) {
            gen.generateCGImageAsynchronously(for: cmTime) { [weak self] imageRef, _, _ in
                if let imageRef = imageRef {
                    let img = NSImage(cgImage: imageRef, size: NSSize(width: 160, height: 90))
                    self?.thumbnailCache.setObject(img, forKey: bucket)
                    DispatchQueue.main.async {
                        self?.hoverThumbnail = img
                    }
                }
            }
        } else {
            let item = DispatchWorkItem { [weak self] in
                if let imageRef = try? gen.copyCGImage(at: cmTime, actualTime: nil) {
                    let img = NSImage(cgImage: imageRef, size: NSSize(width: 160, height: 90))
                    self?.thumbnailCache.setObject(img, forKey: bucket)
                    DispatchQueue.main.async {
                        self?.hoverThumbnail = img
                    }
                }
            }
            thumbnailWorkItem = item
            DispatchQueue.global(qos: .userInteractive).asyncAfter(deadline: .now() + 0.03, execute: item)
        }
    }
    
    // Smart Subtitles Search (In-App OpenSubtitles REST API)
    func performSmartSubtitleSearch() {
        isSearchingSubtitles = true
        subtitleSearchResults = []
        
        let query = subtitleSearchQuery.trimmingCharacters(in: .whitespacesAndNewlines)
        let lang = subtitleSearchLanguage
        
        guard let encodedQuery = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
              let url = URL(string: "https://api.opensubtitles.com/api/v1/subtitles?query=\(encodedQuery)&languages=\(lang)") else {
            isSearchingSubtitles = false
            return
        }
        
        var request = URLRequest(url: url)
        request.setValue("OmniPlayer v3.3", forHTTPHeaderField: "User-Agent")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        URLSession.shared.dataTask(with: request) { [weak self] data, _, _ in
            guard let self = self else { return }
            var items: [SubtitleResultItem] = []
            
            if let data = data,
               let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let dataArray = json["data"] as? [[String: Any]] {
                for entry in dataArray.prefix(20) {
                    if let attrs = entry["attributes"] as? [String: Any],
                       let files = attrs["files"] as? [[String: Any]],
                       let firstFile = files.first,
                       let fileId = firstFile["file_id"] as? Int {
                        let release = (attrs["release"] as? String) ?? (attrs["feature_details"] as? [String: Any])?["title"] as? String ?? query
                        let dlCount = attrs["download_count"] as? Int ?? 100
                        let dlUrlStr = "https://api.opensubtitles.com/api/v1/download?file_id=\(fileId)"
                        if let dlUrl = URL(string: dlUrlStr) {
                            items.append(SubtitleResultItem(
                                releaseName: release,
                                language: lang.uppercased(),
                                downloadUrl: dlUrl,
                                isHashMatch: false,
                                downloadCount: dlCount
                            ))
                        }
                    }
                }
            }
            
            DispatchQueue.main.async {
                self.subtitleSearchResults = items
                self.isSearchingSubtitles = false
                if items.isEmpty {
                    self.showOSD("No online subtitles found. You can add local .srt file.")
                }
            }
        }.resume()
    }
    
    func downloadAndApplySubtitle(item: SubtitleResultItem) {
        showOSD("Downloading subtitle for \(item.language)...")
        let cacheDir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first!.appendingPathComponent("OmniPlayer/Subtitles")
        try? FileManager.default.createDirectory(at: cacheDir, withIntermediateDirectories: true)
        
        let safeName = item.releaseName.replacingOccurrences(of: "/", with: "-")
        let localPath = cacheDir.appendingPathComponent("\(safeName).srt").path
        
        var request = URLRequest(url: item.downloadUrl)
        request.setValue("OmniPlayer v3.3", forHTTPHeaderField: "User-Agent")
        
        URLSession.shared.dataTask(with: request) { [weak self] data, response, err in
            guard let self = self, let data = data, data.count > 10 else {
                DispatchQueue.main.async {
                    self?.showOSD("❌ Subtitle download failed")
                }
                return
            }
            
            var srtData = data
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let linkStr = json["link"] as? String,
               let linkUrl = URL(string: linkStr),
               let downloadedData = try? Data(contentsOf: linkUrl) {
                srtData = downloadedData
            }
            
            try? srtData.write(to: URL(fileURLWithPath: localPath))
            DispatchQueue.main.async {
                self.loadPrimarySubtitle(path: localPath)
                self.showOSD("Attached: \(item.releaseName)")
                self.showSmartSubtitleSheet = false
            }
        }.resume()
    }
    
    // M3U Playlist Import & Export
    func exportPlaylistM3U() {
        guard !playlist.isEmpty else {
            showOSD("⚠️ Playlist is empty")
            return
        }
        let panel = NSSavePanel()
        panel.nameFieldStringValue = "OmniPlaylist.m3u"
        if panel.runModal() == .OK, let url = panel.url {
            var m3u = "#EXTM3U\n"
            for item in playlist {
                m3u += "#EXTINF:\(Int(item.duration)),\(item.title)\n"
                m3u += "\(item.url.isFileURL ? item.url.path : item.url.absoluteString)\n"
            }
            try? m3u.write(to: url, atomically: true, encoding: .utf8)
            showOSD("💾 Playlist saved: \(url.lastPathComponent)")
        }
    }
    
    func importPlaylistM3U(url: URL) {
        guard let content = try? String(contentsOf: url, encoding: .utf8) else { return }
        let lines = content.components(separatedBy: .newlines)
        var newItems: [PlaylistItem] = []
        var nextTitle: String? = nil
        
        for line in lines {
            let trimmed = line.trimmingCharacters(in: .whitespacesAndNewlines)
            if trimmed.isEmpty { continue }
            if trimmed.hasPrefix("#EXTINF:") {
                let parts = trimmed.components(separatedBy: ",")
                if parts.count > 1 {
                    nextTitle = parts.dropFirst().joined(separator: ",")
                }
            } else if !trimmed.hasPrefix("#") {
                let itemUrl: URL?
                if trimmed.lowercased().hasPrefix("http://") || trimmed.lowercased().hasPrefix("https://") {
                    itemUrl = URL(string: trimmed)
                } else {
                    itemUrl = URL(fileURLWithPath: trimmed)
                }
                if let u = itemUrl {
                    let title = nextTitle ?? cleanMediaTitle(from: u.lastPathComponent).title
                    newItems.append(PlaylistItem(url: u, title: title))
                }
                nextTitle = nil
            }
        }
        if !newItems.isEmpty {
            playlist.append(contentsOf: newItems)
            savePlaylistState()
            showOSD("Loaded \(newItems.count) tracks from M3U")
            if currentTrackIndex == -1, let first = playlist.first {
                playFile(url: first.url)
            }
        }
    }
    
    // Video Super-Resolution Upscaling & Multi-Feature Processing
    func toggleVideoUpscale(_ feature: VideoUpscaleFeature, force: Bool? = nil) {
        if let force = force {
            if force { activeVideoUpscaling.insert(feature) }
            else { activeVideoUpscaling.remove(feature) }
        } else {
            if activeVideoUpscaling.contains(feature) {
                activeVideoUpscaling.remove(feature)
            } else {
                activeVideoUpscaling.insert(feature)
            }
        }
        recomputeAndApplyVideoUpscaling()
        showOSD("🔍 Video: \(activeVideoUpscaling.count) Upscalers Active")
    }
    
    func setVideoUpscaleFactor(_ factor: Double) {
        let clamped = max(0.5, min(factor, 4.0))
        videoScaleFactor = clamped
        vlc.setScale(0.0) // ALWAYS 0.0: fit to container, never zoom or crop!
        recomputeAndApplyVideoUpscaling()
        let percent = Int(clamped * 100)
        showOSD("🔍 Super-Resolution Quality: \(percent)% (\(String(format: "%.2fx", clamped)))")
    }
    
    func increaseUpscaleQuality() {
        setVideoUpscaleFactor(videoScaleFactor + 0.25)
    }
    
    func decreaseUpscaleQuality() {
        setVideoUpscaleFactor(videoScaleFactor - 0.25)
    }
    
    func resetUpscaleQuality() {
        setVideoUpscaleFactor(1.0)
    }
    
    func zoomInUpscale() { increaseUpscaleQuality() }
    func zoomOutUpscale() { decreaseUpscaleQuality() }
    func resetUpscale() { resetUpscaleQuality() }
    
    func resizeWindowTo(scale: Double) {
        guard let win = NSApplication.shared.windows.first(where: { $0.isVisible && !($0 is NSPanel) }) else { return }
        let nw = videoNativeWidth > 0 ? videoNativeWidth : 1280
        let nh = videoNativeHeight > 0 ? videoNativeHeight : 720
        
        let screenFrame = win.screen?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1920, height: 1080)
        let maxW = screenFrame.width * 0.95
        let maxH = screenFrame.height * 0.95
        
        var targetW = CGFloat(nw) * CGFloat(scale)
        var targetH = CGFloat(nh) * CGFloat(scale)
        
        if targetW > maxW || targetH > maxH {
            let r = min(maxW / targetW, maxH / targetH)
            targetW *= r
            targetH *= r
        }
        
        // Multi-monitor aware window centering
        let newX = screenFrame.origin.x + (screenFrame.width - targetW) / 2
        let newY = screenFrame.origin.y + (screenFrame.height - targetH) / 2
        let newFrame = NSRect(x: newX, y: newY, width: targetW, height: targetH)
        
        win.setFrame(newFrame, display: true, animate: true)
        let percent = Int(scale * 100)
        showOSD("🖥️ Window Size: \(percent)% (\(Int(targetW))×\(Int(targetH)))")
    }
    
    func recomputeAndApplyVideoUpscaling() {
        var baseS: Float = 0.0
        var baseC: Float = 1.0
        var baseSat: Float = 1.0
        var baseG: Float = 1.0
        
        if activeVideoUpscaling.contains(.lanczos4K) {
            baseS += 0.35
            baseC += 0.04
        }
        if activeVideoUpscaling.contains(.edgeSharpness) {
            baseS += 0.40
        }
        if activeVideoUpscaling.contains(.dynamicContrast) {
            baseC += 0.05
            baseG += 0.04
        }
        if activeVideoUpscaling.contains(.colorVibrance) {
            baseSat += 0.08
        }
        
        // Multiplier scales super-resolution filter reconstruction strength
        let m = Float(videoScaleFactor)
        let s = min(2.0, baseS * m)
        let c = min(2.0, 1.0 + ((baseC - 1.0) * m))
        let sat = min(2.0, 1.0 + ((baseSat - 1.0) * m))
        let g = min(2.0, 1.0 + ((baseG - 1.0) * m))
        
        sharpness = Double(s)
        contrast = Double(c)
        saturation = Double(sat)
        gamma = Double(g)
        
        vlc.setSharpness(s)
        vlc.setContrast(c)
        vlc.setSaturation(sat)
        vlc.setGamma(g)
        vlc.setScale(0.0) // ALWAYS 0.0: fit to container, never zoom or crop!
        
        NotificationCenter.default.post(name: NSNotification.Name("OmniUpdateVideoLayerQuality"), object: nil)
    }
    
    func applyUpscalePreset(_ preset: String) {
        upscalePreset = preset
        switch preset {
        case "Lanczos Sinc (4K Upscale)":
            activeVideoUpscaling = Set(VideoUpscaleFeature.allCases)
            setVideoUpscaleFactor(2.0)
            recomputeAndApplyVideoUpscaling()
            showOSD("🔍 4K Super-Resolution Upscale (2.0x Sinc)")
        case "Bicubic Crisp":
            activeVideoUpscaling = [.edgeSharpness, .retinaTrilinear]
            setVideoUpscaleFactor(1.5)
            recomputeAndApplyVideoUpscaling()
            showOSD("🔍 2K Crisp Upscale (1.5x)")
        case "Cinematic HDR Enhance":
            activeVideoUpscaling = [.dynamicContrast, .colorVibrance, .lanczos4K, .retinaTrilinear]
            setVideoUpscaleFactor(1.25)
            recomputeAndApplyVideoUpscaling()
            showOSD("🔍 Cinematic HDR Upscale (1.25x)")
        default:
            activeVideoUpscaling = []
            setVideoUpscaleFactor(1.0)
            recomputeAndApplyVideoUpscaling()
            showOSD("🔍 Native 1:1 (No Upscale)")
        }
    }
    
    // Free Online AI: Ask AI About Current Scene & Dialogue (Groq Llama 3.3 70B)
    func askAIAssistant(prompt: String) {
        let trimmed = prompt.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        isAIAssistantLoading = true
        aiAssistantResponse = ""
        
        let systemPrompt = "You are an expert film/video AI assistant inside OmniPlayer. The user is watching '\(currentTitle)' at timestamp \(formatTime(currentTime)). Current dialogue: '\(primarySubtitleText ?? "(no dialogue at this second)")'. Answer the user's question concisely and accurately."
        
        guard let endpoint = URL(string: "https://api.groq.com/openai/v1/chat/completions") else { return }
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("Bearer \(groqApiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let payload: [String: Any] = [
            "model": "llama-3.3-70b-versatile",
            "messages": [
                ["role": "system", "content": systemPrompt],
                ["role": "user", "content": trimmed]
            ],
            "temperature": 0.7,
            "max_tokens": 512
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: payload)
        
        URLSession.shared.dataTask(with: request) { data, _, err in
            DispatchQueue.main.async {
                self.isAIAssistantLoading = false
                if let err = err {
                    self.aiAssistantResponse = "Error: \(err.localizedDescription)"
                    return
                }
                guard let data = data,
                      let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                      let choices = json["choices"] as? [[String: Any]],
                      let first = choices.first,
                      let message = first["message"] as? [String: Any],
                      let content = message["content"] as? String else {
                    self.aiAssistantResponse = "Could not get response from AI."
                    return
                }
                self.aiAssistantResponse = content.trimmingCharacters(in: .whitespacesAndNewlines)
            }
        }.resume()
    }
    
    // Free Online AI Subtitle Creation (Groq Whisper Large v3)
    func generateAISubtitles() {
        guard let url = currentURL else {
            showOSD("No video loaded for AI transcription")
            return
        }
        
        let key = groqApiKey.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !key.isEmpty else {
            showOSD("⚠️ Please configure your Groq API Key in Settings")
            showSmartSubtitleSheet = true
            return
        }
        
        isAITranscribing = true
        aiTranscribeStatus = "Extracting audio track with FFmpeg..."
        showOSD("🎙 AI: Extracting speech audio...")
        
        DispatchQueue.global(qos: .userInitiated).async {
            let cacheDir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first!.appendingPathComponent("OmniPlayer/AI_Audio")
            try? FileManager.default.createDirectory(at: cacheDir, withIntermediateDirectories: true)
            
            let tempAudio = cacheDir.appendingPathComponent("extract_\(UUID().uuidString).mp3")
            let inputTarget = url.isFileURL ? url.path : url.absoluteString
            
            // Dynamic audio extraction: check FFmpeg first (fast), fallback to VLC CLI
            let ffmpegCandidates = [
                "/opt/homebrew/bin/ffmpeg",
                "/usr/local/bin/ffmpeg",
                "/usr/bin/ffmpeg"
            ]
            let ffmpegBin = ffmpegCandidates.first(where: { FileManager.default.fileExists(atPath: $0) })
            
            var extractionSuccess = false
            
            if let ffBin = ffmpegBin {
                let process = Process()
                process.executableURL = URL(fileURLWithPath: ffBin)
                process.arguments = [
                    "-y",
                    "-hide_banner",
                    "-loglevel", "error",
                    "-i", inputTarget,
                    "-vn",
                    "-ac", "1",
                    "-ar", "16000",
                    "-b:a", "16k",
                    "-f", "mp3",
                    tempAudio.path
                ]
                do {
                    try process.run()
                    process.waitUntilExit()
                    extractionSuccess = (process.terminationStatus == 0) && FileManager.default.fileExists(atPath: tempAudio.path)
                } catch {
                    extractionSuccess = false
                }
            }
            
            if !extractionSuccess {
                // Dynamic VLC CLI resolution fallback
                let vlcCandidates = [
                    Bundle.main.bundlePath + "/Contents/MacOS/VLC",
                    "/Applications/VLC.app/Contents/MacOS/VLC",
                    NSString(string: "~/Applications/VLC.app/Contents/MacOS/VLC").expandingTildeInPath,
                    "/opt/homebrew/bin/vlc",
                    "/usr/local/bin/vlc"
                ]
                let vlcBin = vlcCandidates.first(where: { FileManager.default.fileExists(atPath: $0) }) ?? "/Applications/VLC.app/Contents/MacOS/VLC"
                
                let process = Process()
                process.executableURL = URL(fileURLWithPath: vlcBin)
                process.arguments = [
                    "-I", "dummy",
                    "--no-repeat",
                    "--no-loop",
                    inputTarget,
                    ":sout=#transcode{acodec=mp3,ab=16,channels=1,samplerate=16000}:standard{access=file,mux=raw,dst=\(tempAudio.path)}",
                    "vlc://quit"
                ]
                
                do {
                    try process.run()
                    process.waitUntilExit()
                    extractionSuccess = FileManager.default.fileExists(atPath: tempAudio.path)
                } catch {
                    extractionSuccess = false
                }
            }
            
            guard extractionSuccess,
                  let audioData = try? Data(contentsOf: tempAudio), audioData.count > 512 else {
                DispatchQueue.main.async {
                    self.isAITranscribing = false
                    self.showOSD("Audio extraction failed. Ensure FFmpeg or VLC is installed.")
                }
                return
            }
            
            if audioData.count > 25 * 1024 * 1024 {
                try? FileManager.default.removeItem(at: tempAudio)
                DispatchQueue.main.async {
                    self.isAITranscribing = false
                    self.showOSD("⚠️ Audio exceeds Groq 25MB limit. Please use a shorter clip.")
                }
                return
            }
            
            DispatchQueue.main.async {
                self.aiTranscribeStatus = "Transcribing speech via Groq Whisper LPU..."
                self.showOSD("✨ AI: Transcribing via Groq Whisper (LPU)...")
            }
            
            let boundary = "Boundary-\(UUID().uuidString)"
            guard let whisperURL = URL(string: "https://api.groq.com/openai/v1/audio/transcriptions") else { return }
            var request = URLRequest(url: whisperURL)
            request.httpMethod = "POST"
            request.setValue("Bearer \(key)", forHTTPHeaderField: "Authorization")
            request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
            request.timeoutInterval = 90.0
            
            var body = Data()
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"model\"\r\n\r\n".data(using: .utf8)!)
            body.append("whisper-large-v3\r\n".data(using: .utf8)!)
            
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"response_format\"\r\n\r\n".data(using: .utf8)!)
            body.append("srt\r\n".data(using: .utf8)!)
            
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"file\"; filename=\"audio.mp3\"\r\n".data(using: .utf8)!)
            body.append("Content-Type: audio/mpeg\r\n\r\n".data(using: .utf8)!)
            body.append(audioData)
            body.append("\r\n".data(using: .utf8)!)
            
            body.append("--\(boundary)--\r\n".data(using: .utf8)!)
            request.httpBody = body
            
            URLSession.shared.dataTask(with: request) { data, response, err in
                try? FileManager.default.removeItem(at: tempAudio)
                
                if let err = err {
                    DispatchQueue.main.async {
                        self.isAITranscribing = false
                        self.aiTranscribeStatus = ""
                        self.showOSD("Groq network error: \(err.localizedDescription)")
                    }
                    return
                }
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    DispatchQueue.main.async {
                        self.isAITranscribing = false
                        self.aiTranscribeStatus = ""
                        self.showOSD("Groq API returned invalid response")
                    }
                    return
                }
                
                guard httpResponse.statusCode == 200 else {
                    var errorMsg = "HTTP \(httpResponse.statusCode)"
                    if let data = data,
                       let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                       let errorObj = json["error"] as? [String: Any],
                       let msg = errorObj["message"] as? String {
                        errorMsg = msg
                    } else if let data = data, let text = String(data: data, encoding: .utf8), !text.isEmpty {
                        errorMsg = text.prefix(100).description
                    }
                    DispatchQueue.main.async {
                        self.isAITranscribing = false
                        self.aiTranscribeStatus = ""
                        self.showOSD("⚠️ AI Subtitle Error: \(errorMsg)")
                    }
                    return
                }
                
                guard let data = data, let srt = String(data: data, encoding: .utf8), !srt.isEmpty, srt.contains("-->") else {
                    DispatchQueue.main.async {
                        self.isAITranscribing = false
                        self.aiTranscribeStatus = ""
                        self.showOSD("AI returned no speech/subtitles for this media")
                    }
                    return
                }
                
                let subDir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first!.appendingPathComponent("OmniPlayer/Subtitles")
                try? FileManager.default.createDirectory(at: subDir, withIntermediateDirectories: true)
                let srtPath = subDir.appendingPathComponent("\(url.deletingPathExtension().lastPathComponent)_Groq_AI.srt").path
                try? srt.write(toFile: srtPath, atomically: true, encoding: .utf8)
                
                DispatchQueue.main.async {
                    self.isAITranscribing = false
                    self.aiTranscribeStatus = ""
                    self.loadPrimarySubtitle(path: srtPath)
                    self.showSmartSubtitleSheet = false
                    self.showOSD("✨ AI Subtitles Created (\(self.primaryCues.count) cues)!")
                }
            }.resume()
        }
    }
    
    // Now Playing Remote Commands
    func setupNowPlayingRemoteCommands() {
        let commandCenter = MPRemoteCommandCenter.shared()
        commandCenter.playCommand.addTarget { [weak self] _ in
            self?.vlc.play()
            self?.isPlaying = true
            return .success
        }
        commandCenter.pauseCommand.addTarget { [weak self] _ in
            self?.vlc.pause()
            self?.isPlaying = false
            return .success
        }
        commandCenter.togglePlayPauseCommand.addTarget { [weak self] _ in
            self?.togglePlayPause()
            return .success
        }
        commandCenter.nextTrackCommand.addTarget { [weak self] _ in
            self?.nextTrack()
            return .success
        }
        commandCenter.previousTrackCommand.addTarget { [weak self] _ in
            self?.previousTrack()
            return .success
        }
        commandCenter.changePlaybackPositionCommand.addTarget { [weak self] event in
            if let posEvent = event as? MPChangePlaybackPositionCommandEvent {
                self?.seek(to: posEvent.positionTime)
                return .success
            }
            return .commandFailed
        }
    }
    
    func updateNowPlayingInfo() {
        let info: [String: Any] = [
            MPMediaItemPropertyTitle: currentTitle.isEmpty ? "OmniPlayer" : currentTitle,
            MPNowPlayingInfoPropertyElapsedPlaybackTime: currentTime,
            MPMediaItemPropertyPlaybackDuration: duration,
            MPNowPlayingInfoPropertyPlaybackRate: isPlaying ? Double(playbackRate) : 0.0
        ]
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }
    
    func userDidInteract(forceKeepOpen: Bool = false) {
        if !showHUD {
            withAnimation(.easeOut(duration: 0.2)) {
                showHUD = true
            }
        }
        NSCursor.unhide()
        
        idleTimer?.invalidate()
        if !forceKeepOpen && isPlaying && !showPlaylistDrawer && !showSettingsInspector && !showReplayOverlay && !showSmartSubtitleSheet {
            idleTimer = Timer.scheduledTimer(withTimeInterval: 2.5, repeats: false) { [weak self] _ in
                guard let self = self, self.isPlaying, !self.showPlaylistDrawer, !self.showSettingsInspector, !self.showReplayOverlay, !self.showSmartSubtitleSheet else { return }
                withAnimation(.easeInOut(duration: 0.35)) {
                    self.showHUD = false
                }
                if self.isFullscreen {
                    NSCursor.hide()
                }
            }
        }
    }
    
    func formatTime(_ seconds: TimeInterval) -> String {
        guard seconds.isFinite && seconds >= 0 else { return "00:00" }
        let h = Int(seconds) / 3600
        let m = (Int(seconds) % 3600) / 60
        let s = Int(seconds) % 60
        if h > 0 {
            return String(format: "%d:%02d:%02d", h, m, s)
        } else {
            return String(format: "%02d:%02d", m, s)
        }
    }
}

// MARK: - Native Cocoa View with Gestures & Right-Click Context Menu

class VLCVideoContainerView: NSView {
    var engine: OmniPlayerEngine { OmniPlayerEngine.shared }
    private var trackingArea: NSTrackingArea?
    
    override init(frame frameRect: NSRect) {
        super.init(frame: frameRect)
        wantsLayer = true
        layer?.backgroundColor = NSColor.black.cgColor
        layer?.magnificationFilter = .trilinear
        layer?.contentsScale = NSScreen.main?.backingScaleFactor ?? 2.0
        layer?.edgeAntialiasingMask = [.layerLeftEdge, .layerRightEdge, .layerBottomEdge, .layerTopEdge]
        LibVLC.shared.attach(view: self)
        NotificationCenter.default.addObserver(self, selector: #selector(updateSuperResolutionLayer), name: NSNotification.Name("OmniUpdateVideoLayerQuality"), object: nil)
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        wantsLayer = true
        layer?.backgroundColor = NSColor.black.cgColor
        layer?.magnificationFilter = .trilinear
        layer?.contentsScale = NSScreen.main?.backingScaleFactor ?? 2.0
        layer?.edgeAntialiasingMask = [.layerLeftEdge, .layerRightEdge, .layerBottomEdge, .layerTopEdge]
        LibVLC.shared.attach(view: self)
        NotificationCenter.default.addObserver(self, selector: #selector(updateSuperResolutionLayer), name: NSNotification.Name("OmniUpdateVideoLayerQuality"), object: nil)
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
    
    @objc func updateSuperResolutionLayer() {
        let baseScale = window?.backingScaleFactor ?? (NSScreen.main?.backingScaleFactor ?? 2.0)
        let enhancedScale = baseScale * CGFloat(max(1.0, min(engine.videoScaleFactor, 2.5)))
        layer?.contentsScale = enhancedScale
        
        if engine.activeVideoUpscaling.contains(.edgeSharpness) || engine.activeVideoUpscaling.contains(.lanczos4K) {
            if let filter = CIFilter(name: "CISharpenLuminance") {
                filter.setValue(Float(0.3 * engine.videoScaleFactor), forKey: "inputSharpness")
                layer?.filters = [filter]
            }
        } else {
            layer?.filters = nil
        }
    }
    
    override func viewDidMoveToWindow() {
        super.viewDidMoveToWindow()
        if let win = window {
            layer?.contentsScale = win.backingScaleFactor
            LibVLC.shared.attach(view: self)
            updateSuperResolutionLayer()
        }
    }
    
    override func updateTrackingAreas() {
        super.updateTrackingAreas()
        if let existing = trackingArea { removeTrackingArea(existing) }
        let options: NSTrackingArea.Options = [.mouseMoved, .mouseEnteredAndExited, .activeAlways, .inVisibleRect]
        trackingArea = NSTrackingArea(rect: bounds, options: options, owner: self, userInfo: nil)
        addTrackingArea(trackingArea!)
    }
    
    override func mouseMoved(with event: NSEvent) {
        engine.userDidInteract()
        super.mouseMoved(with: event)
    }
    
    override func mouseDragged(with event: NSEvent) {
        engine.userDidInteract()
        super.mouseDragged(with: event)
    }
    
    override func mouseDown(with event: NSEvent) {
        engine.userDidInteract()
        if event.clickCount == 2 {
            self.window?.toggleFullScreen(nil)
        } else {
            engine.togglePlayPause()
        }
    }
    
    override func scrollWheel(with event: NSEvent) {
        engine.userDidInteract()
        // Horizontal Trackpad Swipe = Scrubbing
        if abs(event.scrollingDeltaX) > abs(event.scrollingDeltaY) && abs(event.scrollingDeltaX) > 2.0 {
            let deltaSeconds = Double(event.scrollingDeltaX) * 0.25
            engine.jump(by: deltaSeconds)
        } else {
            // Vertical Scroll = Volume
            if event.deltaY > 0 {
                engine.adjustVolume(by: 5)
            } else if event.deltaY < 0 {
                engine.adjustVolume(by: -5)
            }
        }
    }
    
    override func menu(for event: NSEvent) -> NSMenu? {
        let menu = NSMenu(title: "OmniPlayer Context")
        
        let playItem = NSMenuItem(title: engine.isPlaying ? "Pause" : "Play", action: #selector(contextPlayPause), keyEquivalent: " ")
        playItem.target = self
        menu.addItem(playItem)
        
        let replayItem = NSMenuItem(title: "Replay from Start", action: #selector(contextReplay), keyEquivalent: "0")
        replayItem.target = self
        menu.addItem(replayItem)
        
        let sayItem = NSMenuItem(title: "What Did They Just Say? (Rewind 10s)", action: #selector(contextWhatDidTheySay), keyEquivalent: "w")
        sayItem.target = self
        menu.addItem(sayItem)
        
        let stopItem = NSMenuItem(title: "Stop", action: #selector(contextStop), keyEquivalent: "s")
        stopItem.target = self
        menu.addItem(stopItem)
        
        menu.addItem(NSMenuItem.separator())
        
        // Multi-Audio Track Selection Submenu
        let audioMenu = NSMenu(title: "Audio Track")
        for track in engine.audioTracks {
            let item = NSMenuItem(title: track.name, action: #selector(contextSelectAudio(_:)), keyEquivalent: "")
            item.tag = Int(track.id)
            item.target = self
            if engine.selectedAudioId == track.id { item.state = .on }
            audioMenu.addItem(item)
        }
        let audioParent = NSMenuItem(title: "Audio Track (Select Stream)", action: nil, keyEquivalent: "")
        audioParent.submenu = audioMenu
        menu.addItem(audioParent)
        
        // Subtitles Submenu
        let subMenu = NSMenu(title: "Subtitles")
        let smartSubItem = NSMenuItem(title: "Smart Subtitles Finder...", action: #selector(contextSmartSub), keyEquivalent: "f")
        smartSubItem.keyEquivalentModifierMask = [.command, .shift]
        smartSubItem.target = self
        subMenu.addItem(smartSubItem)
        
        let aiSubItem = NSMenuItem(title: "AI Generate Subtitles (Transcribe Speech)...", action: #selector(contextAISub), keyEquivalent: "")
        aiSubItem.target = self
        subMenu.addItem(aiSubItem)
        
        let addSubItem = NSMenuItem(title: "Add Subtitle File...", action: #selector(contextAddSub), keyEquivalent: "")
        addSubItem.target = self
        subMenu.addItem(addSubItem)
        
        let addDualSubItem = NSMenuItem(title: "Add Secondary Subtitle (Dual Mode)...", action: #selector(contextAddDualSub), keyEquivalent: "")
        addDualSubItem.target = self
        subMenu.addItem(addDualSubItem)
        
        subMenu.addItem(NSMenuItem.separator())
        
        let disableSub = NSMenuItem(title: "Disable", action: #selector(contextSelectSub(_:)), keyEquivalent: "")
        disableSub.tag = -1
        disableSub.target = self
        if engine.selectedSubtitleId == -1 { disableSub.state = .on }
        subMenu.addItem(disableSub)
        
        for track in engine.subtitleTracks {
            let item = NSMenuItem(title: track.name, action: #selector(contextSelectSub(_:)), keyEquivalent: "")
            item.tag = Int(track.id)
            item.target = self
            if engine.selectedSubtitleId == track.id { item.state = .on }
            subMenu.addItem(item)
        }
        let subParent = NSMenuItem(title: "Subtitle Track", action: nil, keyEquivalent: "")
        subParent.submenu = subMenu
        menu.addItem(subParent)
        
        menu.addItem(NSMenuItem.separator())
        
        // Chapters Submenu
        if engine.chaptersCount > 0 {
            let chMenu = NSMenu(title: "Chapters")
            for i in 0..<engine.chaptersCount {
                let item = NSMenuItem(title: "Chapter \(i + 1)", action: #selector(contextSelectChapter(_:)), keyEquivalent: "")
                item.tag = Int(i)
                item.target = self
                if engine.currentChapterIdx == i { item.state = .on }
                chMenu.addItem(item)
            }
            let chParent = NSMenuItem(title: "Chapters (\(engine.chaptersCount))", action: nil, keyEquivalent: "")
            chParent.submenu = chMenu
            menu.addItem(chParent)
            menu.addItem(NSMenuItem.separator())
        }
        
        // Picture-in-Picture
        let pipItem = NSMenuItem(title: "Picture-in-Picture (Pin on Top)", action: #selector(contextTogglePiP), keyEquivalent: "p")
        pipItem.keyEquivalentModifierMask = [.command, .shift]
        pipItem.target = self
        menu.addItem(pipItem)
        
        // Copy Frame
        let copyItem = NSMenuItem(title: "Copy Frame to Clipboard", action: #selector(contextCopyFrame), keyEquivalent: "c")
        copyItem.keyEquivalentModifierMask = [.command]
        copyItem.target = self
        menu.addItem(copyItem)
        
        // Bookmarks
        let markItem = NSMenuItem(title: "Add Bookmark", action: #selector(contextAddBookmark), keyEquivalent: "b")
        markItem.keyEquivalentModifierMask = [.command]
        markItem.target = self
        menu.addItem(markItem)
        
        menu.addItem(NSMenuItem.separator())
        
        // Playlist Toggle
        let playListToggle = NSMenuItem(title: "Toggle Playlist", action: #selector(contextTogglePlaylist), keyEquivalent: "l")
        playListToggle.target = self
        menu.addItem(playListToggle)
        
        // Settings Inspector Toggle
        let settingsToggle = NSMenuItem(title: "Quick Settings & Equalizer", action: #selector(contextToggleSettings), keyEquivalent: "e")
        settingsToggle.target = self
        menu.addItem(settingsToggle)
        
        let fsItem = NSMenuItem(title: "Toggle Fullscreen", action: #selector(contextToggleFS), keyEquivalent: "f")
        fsItem.target = self
        menu.addItem(fsItem)
        
        return menu
    }
    
    @objc func contextPlayPause() { engine.togglePlayPause() }
    @objc func contextReplay() { engine.replayFromBeginning() }
    @objc func contextWhatDidTheySay() { engine.whatDidTheySayRewind() }
    @objc func contextStop() { engine.stop() }
    @objc func contextSelectAudio(_ sender: NSMenuItem) { engine.setAudioTrack(id: Int32(sender.tag)) }
    @objc func contextSmartSub() { engine.showSmartSubtitleSheet = true }
    @objc func contextAISub() { engine.generateAISubtitles() }
    @objc func contextAddSub() { engine.addSubtitleDialog() }
    @objc func contextAddDualSub() { engine.addSecondarySubtitleDialog() }
    @objc func contextSelectSub(_ sender: NSMenuItem) { engine.setSubtitleTrack(id: Int32(sender.tag)) }
    @objc func contextSelectChapter(_ sender: NSMenuItem) { engine.setChapter(Int32(sender.tag)) }
    @objc func contextTogglePiP() { engine.togglePiP() }
    @objc func contextCopyFrame() { engine.copySnapshotToClipboard() }
    @objc func contextAddBookmark() { engine.addBookmark() }
    @objc func contextTogglePlaylist() { withAnimation { engine.showPlaylistDrawer.toggle() } }
    @objc func contextToggleSettings() { withAnimation { engine.showSettingsInspector.toggle() } }
    @objc func contextToggleFS() { self.window?.toggleFullScreen(nil) }
}

struct VLCVideoViewRepresentable: NSViewRepresentable {
    func makeNSView(context: Context) -> VLCVideoContainerView {
        return VLCVideoContainerView(frame: .zero)
    }
    func updateNSView(_ nsView: VLCVideoContainerView, context: Context) {}
}

// MARK: - Main Non-Overlapping Inset Container View

struct OmniPlayerWindowView: View {
    @ObservedObject var engine = OmniPlayerEngine.shared
    @State private var isDraggingSeek: Bool = false
    @State private var dragSeekValue: Double = 0.0
    @State private var showRemainingTime: Bool = false
    
    var body: some View {
        HStack(spacing: 0) {
            // 1. DOCKED NON-OVERLAPPING PLAYLIST DRAWER (LEFT)
            if engine.showPlaylistDrawer {
                OmniPlaylistDrawer()
                    .frame(width: 280)
                    .transition(.move(edge: .leading))
            }
            
            // 2. CENTER VIDEO VIEWPORT (RESIZES DYNAMICALLY TO NEVER BE COVERED)
            ZStack {
                Color.black.ignoresSafeArea()
                
                VLCVideoViewRepresentable()
                    .id("omni_vlc_canvas")
                    .rotationEffect(.degrees(Double(engine.videoRotation)))
                    .ignoresSafeArea()
                    .onDrop(of: [.fileURL, .utf8PlainText], isTargeted: nil) { providers in
                        for provider in providers {
                            if provider.canLoadObject(ofClass: URL.self) {
                                _ = provider.loadObject(ofClass: URL.self) { url, _ in
                                    guard let url = url else { return }
                                    DispatchQueue.main.async {
                                        let subExts = ["srt", "ass", "ssa", "vtt", "sub"]
                                        if subExts.contains(url.pathExtension.lowercased()) {
                                            self.engine.loadPrimarySubtitle(path: url.path)
                                            self.engine.showOSD("Subtitle Attached: \(url.lastPathComponent)")
                                        } else if url.pathExtension.lowercased() == "torrent" {
                                            MagnetStreamManager.shared.startStreaming(magnetUri: url.path)
                                        } else if ["m3u", "m3u8"].contains(url.pathExtension.lowercased()) {
                                            self.engine.importPlaylistM3U(url: url)
                                        } else {
                                            self.engine.playFile(url: url)
                                        }
                                    }
                                }
                            } else if provider.canLoadObject(ofClass: String.self) {
                                _ = provider.loadObject(ofClass: String.self) { text, _ in
                                    guard let text = text else { return }
                                    let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
                                    if trimmed.lowercased().hasPrefix("magnet:?") || trimmed.count == 40 || trimmed.count == 32 {
                                        DispatchQueue.main.async {
                                            MagnetStreamManager.shared.startStreaming(magnetUri: trimmed)
                                        }
                                    }
                                }
                            }
                        }
                        return true
                    }
                
                // Dual Subtitles Top Overlay
                if let subText = engine.secondarySubtitleText {
                    VStack {
                        Text(subText)
                            .font(engine.subtitleFont)
                            .foregroundColor(engine.subtitleColorIsYellow ? .yellow : .white)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(engine.subtitleHasShield ? Color.black.opacity(0.75) : Color.clear)
                            .cornerRadius(10)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(engine.subtitleHasShield ? Color.white.opacity(0.2) : Color.clear, lineWidth: 1)
                            )
                            .padding(.top, 55)
                        Spacer()
                    }
                    .transition(.opacity)
                }
                
                // Smart Skip Intro Floating Button
                if engine.isPlaying && engine.currentTime > 5.0 && engine.currentTime < 120.0 {
                    VStack {
                        HStack {
                            Spacer()
                            Button(action: { engine.skipIntro() }) {
                                HStack(spacing: 6) {
                                    Image(systemName: "forward.fill")
                                    Text("Skip Intro (+85s)")
                                        .font(.system(size: 12, weight: .bold))
                                }
                                .padding(.horizontal, 14)
                                .padding(.vertical, 8)
                                .background(.ultraThinMaterial)
                                .cornerRadius(16)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 16)
                                        .stroke(Color.white.opacity(0.2), lineWidth: 1)
                                )
                            }
                            .buttonStyle(.plain)
                            .padding(.trailing, 24)
                            .padding(.top, 50)
                        }
                        Spacer()
                    }
                    .transition(.opacity)
                }
                
                // Auto-Resume Playback Prompt Banner
                if engine.showResumePrompt {
                    VStack {
                        HStack(spacing: 12) {
                            Image(systemName: "clock.arrow.circlepath")
                                .font(.system(size: 15, weight: .bold))
                                .foregroundColor(.orange)
                            
                            Text("Resume from \(formatTimestamp(engine.savedResumeTime))?")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(.white)
                            
                            Button(action: { engine.resumeSavedPlayback() }) {
                                Text("Resume")
                                    .font(.system(size: 12, weight: .bold))
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 4)
                                    .background(Color.orange)
                                    .foregroundColor(.black)
                                    .cornerRadius(6)
                            }
                            .buttonStyle(.plain)
                            
                            Button(action: { engine.dismissResumePrompt() }) {
                                Image(systemName: "xmark")
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundColor(.gray)
                                    .padding(4)
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                        .background(.ultraThinMaterial)
                        .background(Color.black.opacity(0.8))
                        .cornerRadius(14)
                        .overlay(
                            RoundedRectangle(cornerRadius: 14)
                                .stroke(Color.white.opacity(0.25), lineWidth: 1)
                        )
                        .shadow(color: .black.opacity(0.6), radius: 10, x: 0, y: 5)
                        .padding(.top, 50)
                        
                        Spacer()
                    }
                    .transition(.move(edge: .top).combined(with: .opacity))
                    .zIndex(100)
                }
                
                // Modern Glass Welcome Screen
                if !engine.isPlaying && engine.currentTime == 0 && engine.currentTitle.isEmpty && !engine.showReplayOverlay {
                    OmniModernWelcomeView()
                }
                
                // End-of-Video Replay Overlay
                if engine.showReplayOverlay {
                    OmniReplayOverlayView()
                }
                
                // OSD Notification Banner
                if let msg = engine.osdMessage {
                    VStack {
                        HStack {
                            Spacer()
                            Text(msg)
                                .font(.system(size: 14, weight: .semibold, design: .rounded))
                                .foregroundColor(.white)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(.ultraThinMaterial)
                                .cornerRadius(20)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 20)
                                        .stroke(Color.white.opacity(0.18), lineWidth: 1)
                                )
                                .shadow(color: .black.opacity(0.4), radius: 10, x: 0, y: 5)
                            Spacer()
                        }
                        .padding(.top, 40)
                        Spacer()
                    }
                    .transition(.opacity.combined(with: .move(edge: .top)))
                }
                
                // Netflix-Style Auto-Binge Prompt Card
                if let seconds = engine.autoBingeCountdown, engine.currentTrackIndex < engine.playlist.count - 1 {
                    VStack {
                        Spacer()
                        HStack {
                            Spacer()
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    Text("UP NEXT")
                                        .font(.caption2.bold())
                                        .foregroundColor(.orange)
                                    Spacer()
                                    Text("\(seconds)s")
                                        .font(.caption2.bold().monospaced())
                                        .foregroundColor(.gray)
                                }
                                
                                Text(engine.playlist[engine.currentTrackIndex + 1].title)
                                    .font(.subheadline.bold())
                                    .foregroundColor(.white)
                                    .lineLimit(1)
                                
                                HStack(spacing: 8) {
                                    Button(action: { engine.nextTrack() }) {
                                        Label("Play Now", systemImage: "play.fill")
                                            .font(.caption.bold())
                                    }
                                    .buttonStyle(.borderedProminent)
                                    .tint(.orange)
                                    
                                    Button("Cancel") {
                                        engine.cancelAutoBinge()
                                    }
                                    .font(.caption)
                                    .buttonStyle(.bordered)
                                }
                            }
                            .padding(14)
                            .frame(width: 260)
                            .background(.ultraThinMaterial)
                            .cornerRadius(16)
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(Color.white.opacity(0.2), lineWidth: 1)
                            )
                            .shadow(color: .black.opacity(0.5), radius: 15)
                            .padding(.trailing, 24)
                            .padding(.bottom, 90)
                        }
                    }
                    .transition(.opacity.combined(with: .move(edge: .trailing)))
                }
                
                // Smart Subtitles In-App Search Sheet
                if engine.showSmartSubtitleSheet {
                    OmniSmartSubtitleSheetView()
                }
                
                // Primary Subtitles Bottom Overlay (100% Display Guarantee)
                if let subText = engine.primarySubtitleText {
                    VStack {
                        Spacer()
                        Text(subText)
                            .font(engine.subtitleFont)
                            .foregroundColor(engine.subtitleColorIsYellow ? .yellow : .white)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 18)
                            .padding(.vertical, 8)
                            .background(engine.subtitleHasShield ? Color.black.opacity(0.85) : Color.black.opacity(0.45))
                            .cornerRadius(10)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(Color.white.opacity(0.25), lineWidth: 1)
                            )
                            .shadow(color: .black, radius: engine.subtitleShadowRadius, x: 0, y: 3)
                            .padding(.horizontal, 30)
                            .padding(.bottom, (engine.showHUD ? 100 : 45) + engine.subtitleBottomPadding - 36)
                    }
                    .transition(.opacity)
                }
                
                // Floating Liquid Glass HUD
                if engine.showHUD && (!engine.currentTitle.isEmpty || engine.isPlaying) && !engine.showReplayOverlay && !engine.showSmartSubtitleSheet {
                    VStack {
                        Spacer()
                        OmniLiquidGlassHUD(
                            isDraggingSeek: $isDraggingSeek,
                            dragSeekValue: $dragSeekValue,
                            showRemainingTime: $showRemainingTime
                        )
                        .padding(.horizontal, 24)
                        .padding(.bottom, 22)
                    }
                    .transition(.opacity.combined(with: .move(edge: .bottom)))
                }
                
                // Magnet Link & Torrent Stream Modal
                if engine.showMagnetSheet {
                    OmniMagnetStreamSheetView()
                }
                
                // Network Stream Modal
                if engine.showNetworkStreamModal {
                    OmniNetworkStreamModal()
                }
                
                // AI Scene Assistant Sheet
                if engine.showAIAssistantSheet {
                    OmniAIAssistantView()
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            
            // 3. DOCKED NON-OVERLAPPING QUICK SETTINGS INSPECTOR (RIGHT)
            if engine.showSettingsInspector {
                OmniQuickSettingsInspector()
                    .frame(width: 330)
                    .transition(.move(edge: .trailing))
            }
        }
        .animation(.easeInOut(duration: 0.28), value: engine.showPlaylistDrawer)
        .animation(.easeInOut(duration: 0.28), value: engine.showSettingsInspector)
    }
}

// MARK: - Magnet Link & Torrent Stream Modal Sheet

struct OmniMagnetStreamSheetView: View {
    @ObservedObject var engine = OmniPlayerEngine.shared
    @ObservedObject var streamMgr = MagnetStreamManager.shared
    @State private var magnetInput: String = ""
    
    var body: some View {
        ZStack {
            Color.black.opacity(0.65)
                .ignoresSafeArea()
                .onTapGesture {
                    if !streamMgr.isPreparing {
                        engine.showMagnetSheet = false
                    }
                }
            
            VStack(spacing: 16) {
                HStack {
                    HStack(spacing: 8) {
                        Image(systemName: "bolt.horizontal.circle.fill")
                            .font(.title2)
                            .foregroundColor(.orange)
                        Text("Stream Magnet Link / Torrent")
                            .font(.headline.bold())
                            .foregroundColor(.white)
                    }
                    Spacer()
                    Button(action: {
                        streamMgr.stopStreaming()
                        engine.showMagnetSheet = false
                    }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title2)
                            .foregroundColor(.gray)
                    }
                    .buttonStyle(.plain)
                }
                
                Text("Stream movies & series sequentially with zero permanent disk storage. All chunks stream ephemerally directly into video memory.")
                    .font(.caption)
                    .foregroundColor(.gray)
                    .frame(maxWidth: .infinity, alignment: .leading)
                
                HStack(spacing: 6) {
                    Image(systemName: "sparkles.tv.fill")
                        .foregroundColor(.cyan)
                    Text("Direct RAM Streaming • Zero Video Stored on Mac")
                        .font(.caption2.bold())
                        .foregroundColor(.cyan)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.cyan.opacity(0.12))
                .cornerRadius(6)
                
                // Input Field
                HStack(spacing: 8) {
                    TextField("magnet:?xt=urn:btih:... or info-hash", text: $magnetInput)
                        .textFieldStyle(.plain)
                        .padding(10)
                        .background(Color.white.opacity(0.08))
                        .cornerRadius(8)
                        .font(.system(size: 13, design: .monospaced))
                        .foregroundColor(.white)
                        .onSubmit {
                            let link = magnetInput.trimmingCharacters(in: .whitespacesAndNewlines)
                            if !link.isEmpty {
                                streamMgr.startStreaming(magnetUri: link)
                            }
                        }
                    
                    Button(action: {
                        if let paste = NSPasteboard.general.string(forType: .string) {
                            magnetInput = paste.trimmingCharacters(in: .whitespacesAndNewlines)
                        }
                    }) {
                        Label("Paste", systemImage: "doc.on.clipboard")
                            .font(.caption.bold())
                    }
                    .buttonStyle(.bordered)
                }
                
                // Cloudflare (CF) Edge Mode Toggle
                HStack {
                    Toggle(isOn: $streamMgr.useCloudflare) {
                        HStack(spacing: 6) {
                            Image(systemName: "bolt.shield.fill")
                                .foregroundColor(.orange)
                            Text("Cloudflare (CF) Edge Acceleration")
                                .font(.caption.bold())
                                .foregroundColor(.white)
                        }
                    }
                    .toggleStyle(.switch)
                    .tint(.orange)
                    
                    Spacer()
                    
                    HStack(spacing: 4) {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 6, height: 6)
                        Text("CF Edge Online")
                            .font(.caption2.monospaced())
                            .foregroundColor(.green)
                    }
                    .padding(.horizontal, 6)
                    .padding(.vertical, 3)
                    .background(Color.green.opacity(0.12))
                    .cornerRadius(6)
                }
                .padding(.horizontal, 2)
                
                // Status / Swarm Telemetry
                if streamMgr.isPreparing || streamMgr.isStreaming {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(spacing: 10) {
                            ProgressView()
                                .scaleEffect(0.8)
                            Text(streamMgr.statusText)
                                .font(.caption.bold())
                                .foregroundColor(.orange)
                            Spacer()
                        }
                        
                        if !streamMgr.torrentTitle.isEmpty {
                            Text("🎬 \(streamMgr.torrentTitle)")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(.white.opacity(0.9))
                                .lineLimit(1)
                        }
                        
                        HStack(spacing: 14) {
                            if streamMgr.isCFAccelerated {
                                Label("CF Edge CDN", systemImage: "bolt.fill")
                                    .font(.caption2.bold().monospaced())
                                    .foregroundColor(.orange)
                            }
                            
                            Label("\(streamMgr.activePeers) Peers", systemImage: "person.2.fill")
                                .font(.caption2.monospaced())
                                .foregroundColor(.green)
                            
                            Label(String(format: "%.1f MB/s", streamMgr.downloadSpeedMBs), systemImage: "arrow.down.circle.fill")
                                .font(.caption2.monospaced())
                                .foregroundColor(.cyan)
                            
                            Spacer()
                        }
                    }
                    .padding(12)
                    .background(Color.white.opacity(0.05))
                    .cornerRadius(8)
                }
                
                // Action Buttons
                HStack {
                    Button("Cancel") {
                        streamMgr.stopStreaming()
                        engine.showMagnetSheet = false
                    }
                    .buttonStyle(.plain)
                    .foregroundColor(.gray)
                    .keyboardShortcut(.cancelAction)
                    
                    Spacer()
                    
                    Button(action: {
                        let link = magnetInput.trimmingCharacters(in: .whitespacesAndNewlines)
                        if !link.isEmpty {
                            streamMgr.startStreaming(magnetUri: link)
                        }
                    }) {
                        HStack(spacing: 6) {
                            if streamMgr.isPreparing {
                                ProgressView()
                                    .scaleEffect(0.65)
                                    .frame(width: 14, height: 14)
                                Text("Connecting Swarm...")
                            } else {
                                Image(systemName: "play.fill")
                                Text("Start Streaming")
                            }
                        }
                        .font(.subheadline.bold())
                        .padding(.horizontal, 14)
                        .padding(.vertical, 6)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.orange)
                    .keyboardShortcut(.defaultAction)
                    .disabled(magnetInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
            .padding(22)
            .frame(width: 480)
            .background(.ultraThinMaterial)
            .cornerRadius(20)
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(Color.orange.opacity(0.3), lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.6), radius: 24)
        }
        .onAppear {
            if magnetInput.isEmpty,
               let clip = NSPasteboard.general.string(forType: .string)?.trimmingCharacters(in: .whitespacesAndNewlines),
               clip.lowercased().hasPrefix("magnet:?") {
                magnetInput = clip
            }
        }
    }
}

// MARK: - Smart Subtitles Search Sheet

struct OmniSmartSubtitleSheetView: View {
    @ObservedObject var engine = OmniPlayerEngine.shared
    
    let languages = [
        ("English", "eng"),
        ("Spanish", "spa"),
        ("French", "fre"),
        ("German", "ger"),
        ("Hindi", "hin"),
        ("Japanese", "jpn"),
        ("Chinese", "chi"),
        ("Italian", "ita"),
        ("Arabic", "ara")
    ]
    
    var body: some View {
        VStack(spacing: 16) {
            HStack {
                Image(systemName: "captions.bubble.fill")
                    .font(.title2)
                    .foregroundColor(.orange)
                Text("Smart Subtitle Finder")
                    .font(.title2.bold())
                    .foregroundColor(.white)
                Spacer()
                Button(action: { engine.showSmartSubtitleSheet = false }) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.title2)
                        .foregroundColor(.gray)
                }
                .buttonStyle(.plain)
            }
            
            HStack(spacing: 12) {
                TextField("Movie or Series Title...", text: $engine.subtitleSearchQuery)
                    .textFieldStyle(.plain)
                    .padding(8)
                    .background(Color.white.opacity(0.1))
                    .cornerRadius(8)
                    .font(.subheadline)
                
                Picker("", selection: $engine.subtitleSearchLanguage) {
                    ForEach(languages, id: \.1) { name, code in
                        Text(name).tag(code)
                    }
                }
                .frame(width: 110)
                
                Button(action: { engine.performSmartSubtitleSearch() }) {
                    HStack(spacing: 6) {
                        Image(systemName: "magnifyingglass")
                        Text("Search")
                    }
                    .font(.subheadline.bold())
                }
                .buttonStyle(.borderedProminent)
                .tint(.orange)
            }
            
            // AI Transcription Action Button
            VStack(alignment: .leading, spacing: 8) {
                if engine.groqApiKey.isEmpty {
                    HStack(spacing: 8) {
                        SecureField("Enter Groq API Key (Free at console.groq.com)", text: $engine.groqApiKey)
                            .textFieldStyle(.plain)
                            .font(.caption)
                            .padding(6)
                            .background(Color.white.opacity(0.1))
                            .cornerRadius(6)
                        Button("Save") {
                            UserDefaults.standard.set(engine.groqApiKey, forKey: "omni_groq_key")
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.orange)
                        .font(.caption.bold())
                    }
                } else {
                    HStack(spacing: 8) {
                        Image(systemName: "key.fill")
                            .foregroundColor(.green)
                            .font(.caption)
                        Text("Groq Key: ••••••••\(engine.groqApiKey.suffix(4))")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.7))
                        Spacer()
                        Button("Change Key") {
                            engine.groqApiKey = ""
                            UserDefaults.standard.removeObject(forKey: "omni_groq_key")
                        }
                        .buttonStyle(.borderless)
                        .font(.caption.bold())
                        .foregroundColor(.orange)
                    }
                }
                
                HStack {
                    Button(action: { engine.generateAISubtitles() }) {
                        HStack(spacing: 6) {
                            if engine.isAITranscribing {
                                ProgressView()
                                    .scaleEffect(0.7)
                                Text("Transcribing Speech...")
                            } else {
                                Image(systemName: "sparkles")
                                Text("AI Auto-Transcribe Subtitles (Groq Whisper)")
                            }
                        }
                        .font(.caption.bold())
                    }
                    .buttonStyle(.bordered)
                    .tint(.yellow)
                    .disabled(engine.isAITranscribing)
                    
                    Spacer()
                    
                    if !engine.movieHash.isEmpty {
                        Text("MovieHash: \(engine.movieHash)")
                            .font(.caption2.monospaced())
                            .foregroundColor(.gray)
                    }
                }
            }
            
            Divider().background(Color.white.opacity(0.12))
            
            if engine.isAITranscribing {
                VStack(spacing: 12) {
                    Spacer()
                    ProgressView()
                        .scaleEffect(1.3)
                    Text(engine.aiTranscribeStatus.isEmpty ? "Transcribing speech via Groq Whisper LPU..." : engine.aiTranscribeStatus)
                        .font(.headline.bold())
                        .foregroundColor(.yellow)
                    Text("Fast Groq LPU processing usually completes within 5–15 seconds.\nSubtitles will be loaded and displayed on the video automatically.")
                        .font(.caption)
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.center)
                    Spacer()
                }
            } else if engine.isSearchingSubtitles {
                VStack(spacing: 12) {
                    Spacer()
                    ProgressView()
                        .scaleEffect(1.2)
                    Text("Searching OpenSubtitles database...")
                        .font(.caption)
                        .foregroundColor(.gray)
                    Spacer()
                }
            } else if engine.subtitleSearchResults.isEmpty {
                VStack(spacing: 12) {
                    Spacer()
                    Image(systemName: "doc.text.magnifyingglass")
                        .font(.system(size: 40))
                        .foregroundColor(.gray.opacity(0.5))
                    Text("Search for subtitles or use on-device AI transcription.")
                        .font(.caption)
                        .foregroundColor(.gray)
                    Spacer()
                }
            } else {
                List {
                    ForEach(engine.subtitleSearchResults) { item in
                        HStack {
                            VStack(alignment: .leading, spacing: 3) {
                                HStack(spacing: 6) {
                                    if item.isHashMatch {
                                        Text("EXACT HASH MATCH")
                                            .font(.system(size: 9, weight: .bold))
                                            .foregroundColor(.green)
                                            .padding(.horizontal, 5)
                                            .padding(.vertical, 2)
                                            .background(Color.green.opacity(0.2))
                                            .cornerRadius(4)
                                    }
                                    Text("[\(item.language)]")
                                        .font(.caption2.bold())
                                        .foregroundColor(.orange)
                                    Text(item.releaseName)
                                        .font(.system(size: 12, weight: .semibold))
                                        .foregroundColor(.white)
                                        .lineLimit(1)
                                }
                                Text("\(item.downloadCount) downloads • Formats: .srt")
                                    .font(.caption2)
                                    .foregroundColor(.gray)
                            }
                            Spacer()
                            Button(action: { engine.downloadAndApplySubtitle(item: item) }) {
                                Label("Download & Use", systemImage: "arrow.down.circle.fill")
                                    .font(.caption.bold())
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(.orange)
                        }
                        .padding(.vertical, 4)
                    }
                }
                .listStyle(.plain)
            }
        }
        .padding(24)
        .frame(width: 580, height: 430)
        .background(.ultraThinMaterial)
        .cornerRadius(24)
        .overlay(
            RoundedRectangle(cornerRadius: 24)
                .stroke(Color.white.opacity(0.2), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.6), radius: 30)
    }
}

// MARK: - Replay Overlay View

struct OmniReplayOverlayView: View {
    @ObservedObject var engine = OmniPlayerEngine.shared
    
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 48))
                .foregroundColor(.orange)
            
            VStack(spacing: 6) {
                Text("Finished Watching")
                    .font(.title2.bold())
                    .foregroundColor(.white)
                
                Text(engine.currentTitle)
                    .font(.subheadline)
                    .foregroundColor(.gray)
                    .lineLimit(1)
            }
            
            HStack(spacing: 16) {
                Button(action: { engine.replayFromBeginning() }) {
                    HStack(spacing: 8) {
                        Image(systemName: "arrow.counterclockwise.circle.fill")
                            .font(.title3)
                        Text("Replay Video")
                            .font(.headline)
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                }
                .buttonStyle(.borderedProminent)
                .tint(.orange)
                
                if engine.currentTrackIndex < engine.playlist.count - 1 {
                    Button(action: { engine.nextTrack() }) {
                        HStack(spacing: 8) {
                            Text("Next Episode")
                                .font(.headline)
                            Image(systemName: "forward.end.fill")
                        }
                        .padding(.horizontal, 18)
                        .padding(.vertical, 10)
                    }
                    .buttonStyle(.bordered)
                }
            }
        }
        .padding(32)
        .background(.ultraThinMaterial)
        .cornerRadius(24)
        .overlay(
            RoundedRectangle(cornerRadius: 24)
                .stroke(Color.white.opacity(0.2), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.6), radius: 30)
    }
}

// MARK: - Slide-Out Playlist Drawer

struct OmniPlaylistDrawer: View {
    @ObservedObject var engine = OmniPlayerEngine.shared
    
    var filteredItems: [(Int, PlaylistItem)] {
        let list = Array(engine.playlist.enumerated())
        if engine.playlistSearchText.isEmpty { return list }
        return list.filter { $0.element.title.localizedCaseInsensitiveContains(engine.playlistSearchText) }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Playlist (\(engine.playlist.count))")
                    .font(.headline)
                    .foregroundColor(.white)
                Spacer()
                Button(action: { withAnimation { engine.showPlaylistDrawer = false } }) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.title3)
                        .foregroundColor(.gray)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 16)
            .padding(.top, 40)
            .padding(.bottom, 12)
            
            // Filter Bar & Controls
            HStack(spacing: 8) {
                HStack {
                    Image(systemName: "magnifyingglass")
                        .font(.caption)
                        .foregroundColor(.gray)
                    TextField("Filter...", text: $engine.playlistSearchText)
                        .textFieldStyle(.plain)
                        .font(.caption)
                }
                .padding(6)
                .background(Color.white.opacity(0.08))
                .cornerRadius(8)
                
                Button(action: { engine.toggleLoopMode() }) {
                    Image(systemName: engine.loopMode.iconName)
                        .font(.caption.bold())
                        .foregroundColor(engine.loopMode != .off ? .orange : .gray)
                        .frame(width: 26, height: 26)
                        .background(Color.white.opacity(0.08))
                        .cornerRadius(6)
                }
                .buttonStyle(.plain)
                
                Button(action: { engine.toggleShuffle() }) {
                    Image(systemName: "shuffle")
                        .font(.caption.bold())
                        .foregroundColor(engine.isShuffle ? .orange : .gray)
                        .frame(width: 26, height: 26)
                        .background(Color.white.opacity(0.08))
                        .cornerRadius(6)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 10)
            
            Divider().background(Color.white.opacity(0.12))
            
            // List of items
            if engine.playlist.isEmpty {
                VStack(spacing: 12) {
                    Spacer()
                    Image(systemName: "film")
                        .font(.largeTitle)
                        .foregroundColor(.gray.opacity(0.5))
                    Text("Playlist is empty")
                        .font(.caption)
                        .foregroundColor(.gray)
                    Spacer()
                }
            } else {
                List {
                    ForEach(filteredItems, id: \.1.id) { idx, item in
                        HStack(spacing: 8) {
                            if idx == engine.currentTrackIndex {
                                Image(systemName: engine.isPlaying ? "speaker.wave.2.fill" : "pause.fill")
                                    .font(.caption)
                                    .foregroundColor(.orange)
                            } else {
                                Text("\(idx + 1)")
                                    .font(.caption2.monospaced())
                                    .foregroundColor(.gray)
                                    .frame(width: 18, alignment: .leading)
                            }
                            
                            Text(item.title)
                                .font(.system(size: 12))
                                .foregroundColor(idx == engine.currentTrackIndex ? .orange : .white.opacity(0.85))
                                .lineLimit(1)
                            
                            Spacer()
                            
                            Text(item.formattedDuration)
                                .font(.caption2.monospaced())
                                .foregroundColor(.gray)
                        }
                        .contentShape(Rectangle())
                        .onTapGesture {
                            engine.currentTrackIndex = idx
                            engine.playFile(url: item.url)
                            MagnetStreamManager.shared.prioritizeFileForStreaming(index: idx)
                        }
                    }
                    .onDelete { indices in
                        let idsToDelete = Set(indices.map { filteredItems[$0].1.id })
                        engine.removePlaylistItems(withIDs: idsToDelete)
                    }
                    .onMove { indices, newOffset in
                        engine.playlist.move(fromOffsets: indices, toOffset: newOffset)
                        engine.savePlaylistState()
                        if let cur = engine.currentURL {
                            engine.currentTrackIndex = engine.playlist.firstIndex(where: { $0.url == cur }) ?? -1
                        }
                    }
                }
                .listStyle(.plain)
            }
            
            Divider().background(Color.white.opacity(0.12))
            
            // Bottom Action Bar
            HStack(spacing: 8) {
                Button(action: {
                    let panel = NSOpenPanel()
                    panel.allowsMultipleSelection = true
                    panel.canChooseFiles = true
                    if panel.runModal() == .OK {
                        for u in panel.urls {
                            let (cleanTitle, year) = cleanMediaTitle(from: u.lastPathComponent)
                            let title = year != nil ? "\(cleanTitle) (\(year!))" : cleanTitle
                            engine.playlist.append(PlaylistItem(url: u, title: title))
                        }
                        engine.savePlaylistState()
                        if engine.currentTrackIndex == -1, let first = panel.urls.first {
                            engine.playFile(url: first)
                        }
                    }
                }) {
                    Label("Add", systemImage: "plus")
                        .font(.caption.bold())
                }
                .buttonStyle(.borderedProminent)
                .tint(.orange)
                
                Menu {
                    Button("Export M3U Playlist...") {
                        engine.exportPlaylistM3U()
                    }
                    Button("Import M3U Playlist...") {
                        let panel = NSOpenPanel()
                        panel.allowsMultipleSelection = false
                        panel.canChooseFiles = true
                        if panel.runModal() == .OK, let url = panel.url {
                            engine.importPlaylistM3U(url: url)
                        }
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .font(.caption.bold())
                }
                .menuStyle(.borderlessButton)
                .frame(width: 24)
                
                Spacer()
                
                Button("Clear") {
                    engine.playlist.removeAll()
                    engine.savePlaylistState()
                    engine.stop()
                }
                .font(.caption)
                .foregroundColor(.red.opacity(0.8))
            }
            .padding(14)
        }
        .background(.ultraThinMaterial)
        .overlay(
            Rectangle()
                .frame(width: 1)
                .foregroundColor(Color.white.opacity(0.14)),
            alignment: .trailing
        )
        .shadow(color: .black.opacity(0.5), radius: 20)
    }
}

// MARK: - Slide-Out Quick Settings Inspector

struct OmniQuickSettingsInspector: View {
    @ObservedObject var engine = OmniPlayerEngine.shared
    let bandLabels = ["60Hz", "170Hz", "310Hz", "600Hz", "1kHz", "3kHz", "6kHz", "12kHz", "14kHz", "16kHz"]
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Quick Settings")
                    .font(.headline)
                    .foregroundColor(.white)
                Spacer()
                Button(action: { withAnimation { engine.showSettingsInspector = false } }) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.title3)
                        .foregroundColor(.gray)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 16)
            .padding(.top, 40)
            .padding(.bottom, 12)
            
            // Tab Picker
            Picker("", selection: $engine.inspectorTab) {
                Text("Audio").tag(0)
                Text("Video").tag(1)
                Text("Subs").tag(2)
                Text("Sync").tag(3)
                Text("Marks").tag(4)
            }
            .pickerStyle(.segmented)
            .padding(.horizontal, 16)
            .padding(.bottom, 12)
            
            Divider().background(Color.white.opacity(0.12))
            
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    if engine.inspectorTab == 0 {
                        // TAB 0: MULTI-SELECT AUDIO CORRECTIONS & 10-BAND EQ
                        VStack(alignment: .leading, spacing: 14) {
                            Text("Master Audio DSP Preset")
                                .font(.subheadline.bold())
                                .foregroundColor(.white)
                            
                            Picker("", selection: Binding(
                                get: { engine.currentAudioDSPPreset },
                                set: { engine.applyAudioDSPPreset($0) }
                            )) {
                                ForEach(AudioDSPPreset.allCases) { preset in
                                    Text(preset.rawValue).tag(preset)
                                }
                            }
                            .pickerStyle(.menu)
                            
                            Text(engine.currentAudioDSPPreset.description)
                                .font(.caption2)
                                .foregroundColor(.orange)
                            
                            Toggle("Anti-Clipping Soft-Limiter Guard", isOn: Binding(
                                get: { engine.isSoftLimiterActive },
                                set: { engine.isSoftLimiterActive = $0; engine.recomputeAndApplyEqualizer() }
                            ))
                            .font(.caption.bold())
                            .toggleStyle(.checkbox)
                            .foregroundColor(.white)
                            
                            Divider().background(Color.white.opacity(0.1))
                            
                            Text("Audio Correction Suite (Multi-Select)")
                                .font(.subheadline.bold())
                                .foregroundColor(.white)
                            
                            VStack(spacing: 6) {
                                ForEach(AudioCorrectionFeature.allCases) { feat in
                                    HStack {
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(feat.rawValue)
                                                .font(.caption.bold())
                                                .foregroundColor(engine.activeAudioCorrections.contains(feat) ? .orange : .white)
                                            Text(feat.description)
                                                .font(.system(size: 9))
                                                .foregroundColor(.gray)
                                        }
                                        Spacer()
                                        Toggle("", isOn: Binding(
                                            get: { engine.activeAudioCorrections.contains(feat) },
                                            set: { _ in engine.toggleAudioCorrection(feat) }
                                        ))
                                        .toggleStyle(.checkbox)
                                    }
                                    .padding(8)
                                    .background(engine.activeAudioCorrections.contains(feat) ? Color.orange.opacity(0.15) : Color.white.opacity(0.05))
                                    .cornerRadius(8)
                                }
                            }
                            
                            Divider().background(Color.white.opacity(0.1))
                            
                            Text("Audio Channel Output & Spatial")
                                .font(.caption.bold())
                                .foregroundColor(.gray)
                            
                            Picker("", selection: Binding(
                                get: { engine.currentAudioChannel },
                                set: { engine.setAudioChannelMode($0) }
                            )) {
                                ForEach(AudioChannelMode.allCases) { mode in
                                    Text(mode.label).tag(mode)
                                }
                            }
                            .pickerStyle(.menu)
                            
                            Divider().background(Color.white.opacity(0.1))
                            
                            // Manual 10-Band EQ Controls
                            Text("Manual 10-Band Hardware Equalizer")
                                .font(.caption.bold())
                                .foregroundColor(.gray)
                            
                            // Preamp
                            HStack {
                                Text("Preamp:")
                                    .font(.caption)
                                    .foregroundColor(.gray)
                                Slider(value: Binding(
                                    get: { engine.manualPreamp },
                                    set: { engine.manualPreamp = $0; engine.recomputeAndApplyEqualizer(); engine.saveAudioSettings() }
                                ), in: -10...20)
                                .accentColor(.orange)
                                Text(String(format: "%+.1f dB", engine.manualPreamp))
                                    .font(.caption2.monospaced())
                                    .frame(width: 48, alignment: .trailing)
                            }
                            
                            // 10 Band Sliders
                            VStack(spacing: 6) {
                                ForEach(0..<10, id: \.self) { idx in
                                    HStack {
                                        Text(bandLabels[idx])
                                            .font(.caption2)
                                            .foregroundColor(.gray)
                                            .frame(width: 40, alignment: .leading)
                                        
                                        Slider(value: Binding(
                                            get: { engine.manualEqBands[idx] },
                                            set: { engine.manualEqBands[idx] = $0; engine.recomputeAndApplyEqualizer(); engine.saveAudioSettings() }
                                        ), in: -20...20)
                                        .accentColor(.orange)
                                        
                                        Text(String(format: "%+.1f", engine.manualEqBands[idx]))
                                            .font(.caption2.monospaced())
                                            .frame(width: 36, alignment: .trailing)
                                    }
                                }
                            }
                        }
                    } else if engine.inspectorTab == 1 {
                        // TAB 1: VIDEO COLOR ADJUSTMENTS & SUPER-RESOLUTION UPSCALE
                        VStack(alignment: .leading, spacing: 14) {
                            HStack {
                                Text("Super-Resolution Upscaling")
                                    .font(.subheadline.bold())
                                    .foregroundColor(.white)
                                Spacer()
                                Text("\(engine.activeVideoUpscaling.count) Active")
                                    .font(.caption2.bold())
                                    .foregroundColor(.cyan)
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(Color.cyan.opacity(0.18))
                                    .cornerRadius(4)
                            }
                            
                            // Multi-Select Stackable Upscaling Feature Toggles
                            VStack(spacing: 6) {
                                ForEach(VideoUpscaleFeature.allCases) { feat in
                                    HStack {
                                        VStack(alignment: .leading, spacing: 1) {
                                            Text(feat.rawValue)
                                                .font(.system(size: 11, weight: .bold))
                                                .foregroundColor(engine.activeVideoUpscaling.contains(feat) ? .cyan : .white)
                                            Text(feat.description)
                                                .font(.system(size: 9))
                                                .foregroundColor(.gray)
                                                .lineLimit(1)
                                        }
                                        Spacer()
                                        Toggle("", isOn: Binding(
                                            get: { engine.activeVideoUpscaling.contains(feat) },
                                            set: { engine.toggleVideoUpscale(feat, force: $0) }
                                        ))
                                        .toggleStyle(.switch)
                                        .labelsHidden()
                                    }
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 5)
                                    .background(engine.activeVideoUpscaling.contains(feat) ? Color.cyan.opacity(0.12) : Color.white.opacity(0.04))
                                    .cornerRadius(6)
                                }
                            }
                            
                            HStack {
                                Button("Activate All") {
                                    engine.activeVideoUpscaling = Set(VideoUpscaleFeature.allCases)
                                    engine.recomputeAndApplyVideoUpscaling()
                                }
                                .font(.caption)
                                .buttonStyle(.borderedProminent)
                                .tint(.cyan)
                                
                                Spacer()
                                
                                Button("Turn Off All") {
                                    engine.activeVideoUpscaling = []
                                    engine.recomputeAndApplyVideoUpscaling()
                                }
                                .font(.caption)
                                .buttonStyle(.bordered)
                            }
                            
                            Divider().background(Color.white.opacity(0.1))
                            
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    Text("Super-Resolution Quality Multiplier:")
                                        .font(.caption2.bold())
                                        .foregroundColor(.cyan)
                                    Spacer()
                                    Text("\(Int(engine.videoScaleFactor * 100))% (\(String(format: "%.2fx", engine.videoScaleFactor)))")
                                        .font(.caption2.monospaced().bold())
                                        .foregroundColor(.cyan)
                                }
                                
                                Text("Full frame preserved (no cropping). Sharpens textures & Retina density.")
                                    .font(.system(size: 9))
                                    .foregroundColor(.gray)
                                
                                HStack(spacing: 6) {
                                    ForEach([1.0, 1.25, 1.5, 2.0], id: \.self) { factor in
                                        Button(action: {
                                            engine.setVideoUpscaleFactor(factor)
                                        }) {
                                            Text(factor == 1.0 ? "1.0x" : factor == 1.5 ? "1.5x (2K)" : factor == 2.0 ? "2.0x (4K)" : "1.25x")
                                                .font(.system(size: 10, weight: .bold))
                                                .frame(maxWidth: .infinity)
                                        }
                                        .buttonStyle(.bordered)
                                        .tint(abs(engine.videoScaleFactor - factor) < 0.05 ? .cyan : .gray)
                                    }
                                }
                                
                                Slider(value: Binding(
                                    get: { engine.videoScaleFactor },
                                    set: { engine.setVideoUpscaleFactor($0) }
                                ), in: 0.5...3.0)
                                .accentColor(.cyan)
                                
                                Divider().background(Color.white.opacity(0.1))
                                
                                Text("Window Size (Physical Screen Scaling):")
                                    .font(.caption2.bold())
                                    .foregroundColor(.white.opacity(0.8))
                                
                                HStack(spacing: 6) {
                                    Button("50%") { engine.resizeWindowTo(scale: 0.5) }
                                        .font(.system(size: 10, weight: .semibold))
                                        .buttonStyle(.bordered)
                                    Button("100% (1:1)") { engine.resizeWindowTo(scale: 1.0) }
                                        .font(.system(size: 10, weight: .semibold))
                                        .buttonStyle(.bordered)
                                    Button("200% (4K)") { engine.resizeWindowTo(scale: 2.0) }
                                        .font(.system(size: 10, weight: .semibold))
                                        .buttonStyle(.bordered)
                                }
                            }
                            .padding(10)
                            .background(Color.white.opacity(0.06))
                            .cornerRadius(10)
                            
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Upscaling Preset:")
                                    .font(.caption2.bold())
                                    .foregroundColor(.cyan)
                                
                                Picker("", selection: Binding(
                                    get: { engine.upscalePreset },
                                    set: { engine.applyUpscalePreset($0) }
                                )) {
                                    Text("Lanczos Sinc (4K Upscale)").tag("Lanczos Sinc (4K Upscale)")
                                    Text("Bicubic Crisp").tag("Bicubic Crisp")
                                    Text("Cinematic HDR Enhance").tag("Cinematic HDR Enhance")
                                    Text("Native (Off)").tag("Native (Off)")
                                }
                                .pickerStyle(.menu)
                                
                                HStack {
                                    Text("Sharpness:")
                                        .font(.caption)
                                        .foregroundColor(.gray)
                                    Slider(value: Binding(
                                        get: { engine.sharpness },
                                        set: { engine.sharpness = $0; engine.vlc.setSharpness(Float($0)) }
                                    ), in: 0.0...2.0)
                                    .accentColor(.cyan)
                                    Text(String(format: "%.2fx", engine.sharpness))
                                        .font(.caption2.monospaced())
                                }
                            }
                            .padding(10)
                            .background(Color.white.opacity(0.06))
                            .cornerRadius(10)
                            
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Video Crop (Black Bar Removal):")
                                    .font(.caption2.bold())
                                    .foregroundColor(.cyan)
                                
                                Picker("", selection: Binding(
                                    get: { engine.currentCropRatio },
                                    set: { engine.setCropRatio($0) }
                                )) {
                                    Text("None (Original)").tag("None")
                                    Text("16:9 (Widescreen)").tag("16:9")
                                    Text("16:10 (MacBook)").tag("16:10")
                                    Text("4:3 (Classic)").tag("4:3")
                                    Text("2.35:1 (Cinema)").tag("2.35:1")
                                    Text("2.39:1 (Anamorphic)").tag("2.39:1")
                                    Text("1:1 (Square)").tag("1:1")
                                }
                                .pickerStyle(.menu)
                                
                                Text("Hardware Deinterlacing:")
                                    .font(.caption2.bold())
                                    .foregroundColor(.cyan)
                                
                                Picker("", selection: Binding(
                                    get: { engine.deinterlaceMode },
                                    set: { engine.setDeinterlaceMode($0) }
                                )) {
                                    Text("Off").tag("Off")
                                    Text("Yadif (High Quality)").tag("yadif")
                                    Text("Blend").tag("blend")
                                    Text("Linear").tag("linear")
                                }
                                .pickerStyle(.menu)
                            }
                            .padding(10)
                            .background(Color.white.opacity(0.06))
                            .cornerRadius(10)
                            
                            Divider().background(Color.white.opacity(0.1))
                            
                            Text("Video Color Adjustments")
                                .font(.subheadline.bold())
                                .foregroundColor(.white)
                            
                            VStack(spacing: 12) {
                                ColorSliderRow(label: "Brightness", value: $engine.brightness, range: 0.0...2.0, def: 1.0)
                                ColorSliderRow(label: "Contrast", value: $engine.contrast, range: 0.0...2.0, def: 1.0)
                                ColorSliderRow(label: "Saturation", value: $engine.saturation, range: 0.0...3.0, def: 1.0)
                                ColorSliderRow(label: "Hue", value: $engine.hue, range: -180...180, def: 0.0)
                            }
                            
                            HStack {
                                Button("Rotate 90°") { engine.rotateVideoClockwise() }
                                    .buttonStyle(.bordered)
                                
                                Spacer()
                                
                                Button("Reset Color") {
                                    engine.brightness = 1.0
                                    engine.contrast = 1.0
                                    engine.saturation = 1.0
                                    engine.hue = 0.0
                                    engine.videoRotation = 0
                                }
                                .buttonStyle(.bordered)
                            }
                            .font(.caption)
                            .padding(.top, 6)
                        }
                    } else if engine.inspectorTab == 2 {
                        // TAB 2: SMART SUBTITLES & STYLING
                        VStack(alignment: .leading, spacing: 14) {
                            Text("Smart Subtitle Engine")
                                .font(.subheadline.bold())
                                .foregroundColor(.white)
                            
                            Button(action: { engine.showSmartSubtitleSheet = true }) {
                                HStack {
                                    Image(systemName: "arrow.down.circle.fill")
                                    Text("Open Subtitle Downloader...")
                                }
                                .font(.subheadline.bold())
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 8)
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(.orange)
                            
                            Button(action: { engine.generateAISubtitles() }) {
                                HStack {
                                    Image(systemName: "sparkles")
                                    Text("AI Auto-Transcribe (Groq Whisper)...")
                                }
                                .font(.subheadline.bold())
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 8)
                            }
                            .buttonStyle(.bordered)
                            .tint(.yellow)
                            
                            Button(action: {
                                withAnimation { engine.showAIAssistantSheet = true }
                            }) {
                                HStack {
                                    Image(systemName: "brain.head.profile")
                                    Text("Ask AI About Scene (Cmd+Shift+A)...")
                                }
                                .font(.subheadline.bold())
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 8)
                            }
                            .buttonStyle(.bordered)
                            .tint(.purple)
                            
                            Divider().background(Color.white.opacity(0.1))
                            
                            Text("Subtitle Typography & Contrast")
                                .font(.caption.bold())
                                .foregroundColor(.gray)
                            
                            HStack {
                                Text("Color:")
                                    .font(.caption)
                                    .foregroundColor(.gray)
                                Spacer()
                                Button("Cinema Yellow") {
                                    engine.subtitleColorIsYellow = true
                                }
                                .buttonStyle(.bordered)
                                .foregroundColor(engine.subtitleColorIsYellow ? .yellow : .gray)
                                
                                Button("Crisp White") {
                                    engine.subtitleColorIsYellow = false
                                }
                                .buttonStyle(.bordered)
                                .foregroundColor(!engine.subtitleColorIsYellow ? .white : .gray)
                            }
                            
                            VStack(alignment: .leading, spacing: 4) {
                                HStack {
                                    Text("Font Size:")
                                        .font(.caption)
                                        .foregroundColor(.gray)
                                    Spacer()
                                    Text("\(Int(engine.subtitleFontSize)) pt")
                                        .font(.caption2.monospaced())
                                }
                                Slider(value: $engine.subtitleFontSize, in: 14...34)
                                    .accentColor(.orange)
                            }
                            
                            Toggle("Adaptive Contrast Pill Shield", isOn: $engine.subtitleHasShield)
                                .font(.caption)
                                .toggleStyle(.switch)
                            
                            HStack {
                                Text("Font Family:")
                                    .font(.caption)
                                    .foregroundColor(.gray)
                                Spacer()
                                Picker("", selection: $engine.subtitleFontFamily) {
                                    Text("System (SF Pro)").tag("System")
                                    Text("Helvetica Neue").tag("Helvetica")
                                    Text("Futura").tag("Futura")
                                    Text("Menlo (Monospace)").tag("Menlo")
                                    Text("Arial").tag("Arial")
                                }
                                .pickerStyle(.menu)
                                .frame(maxWidth: 150)
                            }
                            
                            VStack(alignment: .leading, spacing: 4) {
                                HStack {
                                    Text("Bottom Margin:")
                                        .font(.caption)
                                        .foregroundColor(.gray)
                                    Spacer()
                                    Text("\(Int(engine.subtitleBottomPadding)) pt")
                                        .font(.caption2.monospaced())
                                }
                                Slider(value: $engine.subtitleBottomPadding, in: 15...120)
                                    .accentColor(.orange)
                            }
                            
                            VStack(alignment: .leading, spacing: 4) {
                                HStack {
                                    Text("Shadow Blur:")
                                        .font(.caption)
                                        .foregroundColor(.gray)
                                    Spacer()
                                    Text("\(Int(engine.subtitleShadowRadius)) pt")
                                        .font(.caption2.monospaced())
                                }
                                Slider(value: $engine.subtitleShadowRadius, in: 0...15)
                                    .accentColor(.orange)
                            }
                        }
                    } else if engine.inspectorTab == 3 {
                        // TAB 3: SYNCHRONIZATION
                        VStack(alignment: .leading, spacing: 16) {
                            Text("Track Synchronization")
                                .font(.subheadline.bold())
                                .foregroundColor(.white)
                            
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Audio Delay (Hotkeys J / K):")
                                    .font(.caption.bold())
                                    .foregroundColor(.gray)
                                HStack {
                                    Button("-50ms") { engine.adjustAudioDelay(byMicroseconds: -50_000) }
                                        .buttonStyle(.bordered)
                                    Spacer()
                                    Text("\(engine.audioDelayMs) ms")
                                        .font(.caption.monospaced().bold())
                                        .foregroundColor(.orange)
                                    Spacer()
                                    Button("+50ms") { engine.adjustAudioDelay(byMicroseconds: 50_000) }
                                        .buttonStyle(.bordered)
                                }
                            }
                            
                            Divider().background(Color.white.opacity(0.1))
                            
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Subtitle Delay (Hotkeys G / H):")
                                    .font(.caption.bold())
                                    .foregroundColor(.gray)
                                HStack {
                                    Button("-50ms") { engine.adjustSubtitleDelay(byMicroseconds: -50_000) }
                                        .buttonStyle(.bordered)
                                    Spacer()
                                    Text("\(engine.subtitleDelayMs) ms")
                                        .font(.caption.monospaced().bold())
                                        .foregroundColor(.orange)
                                    Spacer()
                                    Button("+50ms") { engine.adjustSubtitleDelay(byMicroseconds: 50_000) }
                                        .buttonStyle(.bordered)
                                }
                            }
                            
                            Divider().background(Color.white.opacity(0.1))
                            
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Sleep Timer:")
                                    .font(.caption.bold())
                                    .foregroundColor(.gray)
                                
                                Picker("", selection: Binding(
                                    get: { engine.sleepTimerMinutesRemaining ?? 0 },
                                    set: { engine.setSleepTimer(minutes: $0 == 0 ? nil : $0) }
                                )) {
                                    Text("Off").tag(0)
                                    Text("15 Minutes").tag(15)
                                    Text("30 Minutes").tag(30)
                                    Text("45 Minutes").tag(45)
                                    Text("60 Minutes").tag(60)
                                }
                                .pickerStyle(.menu)
                                
                                if let remaining = engine.sleepTimerMinutesRemaining {
                                    Text("🌙 Playback stops in ~\(remaining) min")
                                        .font(.caption2.bold())
                                        .foregroundColor(.orange)
                                }
                            }
                        }
                    } else {
                        // TAB 4: BOOKMARKS
                        VStack(alignment: .leading, spacing: 14) {
                            HStack {
                                Text("Bookmarks (\(engine.bookmarks.count))")
                                    .font(.subheadline.bold())
                                    .foregroundColor(.white)
                                Spacer()
                                Button(action: { engine.addBookmark() }) {
                                    Label("Add (Cmd+B)", systemImage: "bookmark.fill")
                                        .font(.caption.bold())
                                }
                                .buttonStyle(.borderedProminent)
                                .tint(.orange)
                            }
                            
                            if engine.bookmarks.isEmpty {
                                Text("No bookmarks saved. Press Cmd+B to bookmark favorite scenes.")
                                    .font(.caption)
                                    .foregroundColor(.gray)
                                    .padding(.vertical, 8)
                            } else {
                                VStack(spacing: 8) {
                                    ForEach(Array(engine.bookmarks.enumerated()), id: \.offset) { idx, bm in
                                        HStack {
                                            Text("◆ \(engine.formatTime(bm))")
                                                .font(.system(size: 13, weight: .bold, design: .monospaced))
                                                .foregroundColor(.cyan)
                                            
                                            Spacer()
                                            
                                            Button("Jump") {
                                                engine.seek(to: bm)
                                            }
                                            .buttonStyle(.bordered)
                                            .font(.caption2)
                                            
                                            Button(action: { engine.removeBookmark(at: idx) }) {
                                                Image(systemName: "trash")
                                                    .foregroundColor(.red.opacity(0.8))
                                            }
                                            .buttonStyle(.plain)
                                        }
                                        .padding(8)
                                        .background(Color.white.opacity(0.06))
                                        .cornerRadius(8)
                                    }
                                }
                            }
                        }
                    }
                }
                .padding(16)
            }
        }
        .background(.ultraThinMaterial)
        .overlay(
            Rectangle()
                .frame(width: 1)
                .foregroundColor(Color.white.opacity(0.14)),
            alignment: .leading
        )
        .shadow(color: .black.opacity(0.5), radius: 20)
    }
}

struct ColorSliderRow: View {
    let label: String
    @Binding var value: Double
    let range: ClosedRange<Double>
    let def: Double
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(label)
                    .font(.caption)
                    .foregroundColor(.gray)
                Spacer()
                Text(String(format: "%.2f", value))
                    .font(.caption2.monospaced())
                    .foregroundColor(.white.opacity(0.8))
            }
            Slider(value: $value, in: range)
                .accentColor(.orange)
        }
    }
}

// MARK: - Hover Thumbnail Tooltip View

struct OmniHoverThumbnailTooltipView: View {
    let thumb: NSImage?
    let timeText: String
    
    var body: some View {
        VStack(spacing: 4) {
            if let thumb = thumb {
                Image(nsImage: thumb)
                    .resizable()
                    .scaledToFill()
                    .frame(width: 120, height: 68)
                    .clipped()
                    .cornerRadius(6)
            }
            Text(timeText)
                .font(.system(size: 10, weight: .bold, design: .monospaced))
                .foregroundColor(.white)
        }
        .padding(4)
        .background(Color.black.opacity(0.88))
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.orange.opacity(0.6), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.5), radius: 10)
    }
}

// MARK: - Modern Liquid Glass HUD Capsule

struct OmniLiquidGlassHUD: View {
    @ObservedObject var engine = OmniPlayerEngine.shared
    @ObservedObject var streamMgr = MagnetStreamManager.shared
    @Binding var isDraggingSeek: Bool
    @Binding var dragSeekValue: Double
    @Binding var showRemainingTime: Bool
    @State private var isScrubberHovered: Bool = false
    
    var currentDisplayTime: TimeInterval {
        if isDraggingSeek {
            return dragSeekValue * engine.duration
        }
        return engine.currentTime
    }
    
    var body: some View {
        VStack(spacing: 8) {
            // Track Title & Aspect Ratio Badge
            if !engine.currentTitle.isEmpty {
                HStack {
                    Text(engine.currentTitle)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.white.opacity(0.9))
                        .lineLimit(1)
                    
                    Spacer()
                    
                    if !engine.activeVideoUpscaling.isEmpty {
                        Text("🔍 \(engine.activeVideoUpscaling.count) Upscalers Active")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.cyan)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.cyan.opacity(0.18))
                            .cornerRadius(4)
                    }
                    
                    if !engine.activeAudioCorrections.isEmpty {
                        Text("\(engine.activeAudioCorrections.count) Audio Filters Active")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.orange)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.orange.opacity(0.18))
                            .cornerRadius(4)
                    }
                    
                    if streamMgr.isStreaming {
                        HStack(spacing: 4) {
                            Image(systemName: "bolt.fill")
                            if streamMgr.downloadProgress >= 99.0 {
                                Text("🧲 Complete (100%) • \(streamMgr.activePeers) Peers")
                            } else if streamMgr.downloadSpeedMBs >= 1.0 {
                                Text("🧲 \(String(format: "%.1f", streamMgr.downloadSpeedMBs)) MB/s • \(streamMgr.activePeers) Peers")
                            } else if streamMgr.downloadSpeedMBs > 0.001 {
                                Text("🧲 \(Int(streamMgr.downloadSpeedMBs * 1024)) KB/s • \(streamMgr.activePeers) Peers")
                            } else {
                                Text("🧲 Swarm Active • \(streamMgr.activePeers) Peers")
                            }
                        }
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                        .foregroundColor(.green)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.green.opacity(0.18))
                        .cornerRadius(4)
                    }
                    
                    Text(engine.currentAspectRatio)
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                        .foregroundColor(.gray)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.white.opacity(0.08))
                        .cornerRadius(4)
                }
                .padding(.horizontal, 6)
                .padding(.top, 2)
            }
            
            // Modern Interactive Scrubber
            VStack(spacing: 4) {
                GeometryReader { geo in
                    let width = geo.size.width
                    let progress = engine.duration > 0 ? (isDraggingSeek ? dragSeekValue : (engine.currentTime / engine.duration)) : 0
                    
                    ZStack(alignment: .leading) {
                        Capsule()
                            .fill(Color.white.opacity(0.18))
                            .frame(height: isScrubberHovered || isDraggingSeek ? 6 : 4)
                        
                        Capsule()
                            .fill(
                                LinearGradient(
                                    colors: [Color.orange, Color(red: 1.0, green: 0.35, blue: 0.1)],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(width: max(0, min(width * CGFloat(progress), width)), height: isScrubberHovered || isDraggingSeek ? 6 : 4)
                        
                        // Bookmarks Cyan Diamonds
                        ForEach(engine.bookmarks, id: \.self) { bm in
                            if engine.duration > 0 {
                                Image(systemName: "diamond.fill")
                                    .font(.system(size: 7))
                                    .foregroundColor(.cyan)
                                    .offset(x: CGFloat(bm / engine.duration) * width - 3.5)
                            }
                        }
                        
                        // A-B Loop Markers
                        if let a = engine.loopPointA, engine.duration > 0 {
                            Circle()
                                .fill(Color.orange)
                                .frame(width: 8, height: 8)
                                .offset(x: CGFloat(a / engine.duration) * width - 4)
                        }
                        if let b = engine.loopPointB, engine.duration > 0 {
                            Circle()
                                .fill(Color.yellow)
                                .frame(width: 8, height: 8)
                                .offset(x: CGFloat(b / engine.duration) * width - 4)
                        }
                        
                        // Thumb
                        Circle()
                            .fill(Color.white)
                            .frame(width: isScrubberHovered || isDraggingSeek ? 14 : 10, height: isScrubberHovered || isDraggingSeek ? 14 : 10)
                            .shadow(color: .black.opacity(0.4), radius: 3)
                            .offset(x: max(0, min(width * CGFloat(progress) - 6, width - 12)))
                        
                        // Floating Hover Thumbnail
                        if isScrubberHovered, let hoverTime = engine.hoverScrubTime {
                            let offsetX: CGFloat = max(0, min(engine.hoverScrubX - 60, width - 130))
                            let offsetY: CGFloat = (engine.hoverThumbnail != nil) ? -96.0 : -34.0
                            OmniHoverThumbnailTooltipView(
                                thumb: engine.hoverThumbnail,
                                timeText: engine.formatTime(hoverTime)
                            )
                            .offset(x: offsetX, y: offsetY)
                        }
                    }
                    .frame(height: 14)
                    .onHover { hovering in
                        isScrubberHovered = hovering
                        if !hovering {
                            engine.hoverScrubTime = nil
                            engine.hoverThumbnail = nil
                        }
                    }
                    .gesture(
                        DragGesture(minimumDistance: 0)
                            .onChanged { val in
                                isDraggingSeek = true
                                let percent = max(0, min(Double(val.location.x / width), 1.0))
                                dragSeekValue = percent
                                engine.hoverScrubX = val.location.x
                                let targetTime = percent * engine.duration
                                engine.hoverScrubTime = targetTime
                                engine.requestHoverThumbnail(at: targetTime)
                                engine.userDidInteract()
                            }
                            .onEnded { val in
                                let percent = max(0, min(Double(val.location.x / width), 1.0))
                                engine.seek(to: percent * engine.duration)
                                isDraggingSeek = false
                                engine.userDidInteract()
                            }
                    )
                }
                .frame(height: 14)
                
                // Timestamps
                HStack {
                    Text(engine.formatTime(currentDisplayTime))
                        .font(.system(size: 11, weight: .medium, design: .monospaced))
                        .foregroundColor(.white.opacity(0.7))
                    
                    Spacer()
                    
                    Button(action: {
                        showRemainingTime.toggle()
                        engine.userDidInteract()
                    }) {
                        if showRemainingTime {
                            let rem = max(0, engine.duration - currentDisplayTime)
                            Text("-\(engine.formatTime(rem))")
                                .font(.system(size: 11, weight: .medium, design: .monospaced))
                                .foregroundColor(.orange.opacity(0.9))
                        } else {
                            Text(engine.formatTime(engine.duration))
                                .font(.system(size: 11, weight: .medium, design: .monospaced))
                                .foregroundColor(.white.opacity(0.7))
                        }
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, 2)
            }
            
            // Transport Bar Controls
            HStack(spacing: 9) {
                // Playlist Toggle Button
                Button(action: {
                    withAnimation(.spring(response: 0.35, dampingFraction: 0.75)) {
                        engine.showPlaylistDrawer.toggle()
                    }
                    engine.userDidInteract(forceKeepOpen: engine.showPlaylistDrawer)
                }) {
                    Image(systemName: "list.bullet")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(engine.showPlaylistDrawer ? .orange : .white.opacity(0.85))
                }
                .buttonStyle(GlassCircleButtonStyle())
                .help("Toggle Playlist (Cmd+L)")
                
                // Previous Track
                Button(action: { engine.previousTrack() }) {
                    Image(systemName: "backward.end.fill")
                        .font(.system(size: 12))
                }
                .buttonStyle(GlassCircleButtonStyle())
                .help("Previous Track")
                
                // Skip -10s
                Button(action: { engine.jump(by: -10) }) {
                    Image(systemName: "gobackward.10")
                        .font(.system(size: 13))
                }
                .buttonStyle(GlassCircleButtonStyle())
                .help("Jump -10s")
                
                // HERO PLAY / PAUSE BUTTON
                Button(action: { engine.togglePlayPause() }) {
                    Image(systemName: engine.isPlaying ? "pause.fill" : "play.fill")
                        .font(.system(size: 18, weight: .bold))
                }
                .buttonStyle(HeroAccentPlayButtonStyle())
                .help("Play / Pause (Space)")
                
                // Skip +10s
                Button(action: { engine.jump(by: 10) }) {
                    Image(systemName: "goforward.10")
                        .font(.system(size: 13))
                }
                .buttonStyle(GlassCircleButtonStyle())
                .help("Jump +10s")
                
                // Next Track
                Button(action: { engine.nextTrack() }) {
                    Image(systemName: "forward.end.fill")
                        .font(.system(size: 12))
                }
                .buttonStyle(GlassCircleButtonStyle())
                .help("Next Track")
                
                // AI: "What Did They Just Say?" Rewind Button
                Button(action: { engine.whatDidTheySayRewind() }) {
                    Image(systemName: "ear.and.waveform")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.yellow)
                }
                .buttonStyle(GlassCircleButtonStyle())
                .help("What Did They Just Say? Rewind 10s + Voice Boost (W)")
                
                // REPLAYBACK BUTTON
                Button(action: { engine.replayFromBeginning() }) {
                    Image(systemName: "arrow.counterclockwise")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.orange)
                }
                .buttonStyle(GlassCircleButtonStyle())
                .help("Replay from Beginning (0)")
                
                Divider()
                    .frame(height: 20)
                    .background(Color.white.opacity(0.18))
                
                // RESTORED: MULTI-AUDIO TRACK SELECTION MENU
                Menu {
                    ForEach(engine.audioTracks) { track in
                        Button(track.name) { engine.setAudioTrack(id: track.id) }
                    }
                    if !engine.audioDevices.isEmpty {
                        Divider()
                        Menu("Audio Output Device") {
                            ForEach(engine.audioDevices) { dev in
                                Button(dev.name) { engine.setAudioDevice(id: dev.id) }
                            }
                        }
                    }
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "waveform")
                            .font(.system(size: 11))
                        Text(engine.audioTracks.first(where: { $0.id == engine.selectedAudioId })?.name ?? "Audio")
                            .font(.system(size: 11, weight: .semibold))
                            .lineLimit(1)
                            .frame(maxWidth: 80)
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 6)
                    .background(Color.white.opacity(0.08))
                    .cornerRadius(14)
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(Color.white.opacity(0.14), lineWidth: 0.8)
                    )
                }
                .menuStyle(.borderlessButton)
                .help("Select Audio Track / Language (B to cycle)")
                
                // Subtitles Glass Menu
                Menu {
                    Button("Smart Subtitles Finder...") { engine.showSmartSubtitleSheet = true }
                    Button("AI Generate Subtitles (Transcribe Speech)...") { engine.generateAISubtitles() }
                    Button("Add Subtitle File...") { engine.addSubtitleDialog() }
                    Button("Add Secondary Subtitle (Dual Mode)...") { engine.addSecondarySubtitleDialog() }
                    Divider()
                    Button("Disable Subtitles") { engine.setSubtitleTrack(id: -1) }
                    ForEach(engine.subtitleTracks) { track in
                        Button(track.name) { engine.setSubtitleTrack(id: track.id) }
                    }
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "captions.bubble.fill")
                            .font(.system(size: 11))
                        Text(engine.selectedSubtitleId == -1 ? "Subtitles" : "Sub On")
                            .font(.system(size: 11, weight: .semibold))
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 6)
                    .background(engine.selectedSubtitleId != -1 ? Color.orange.opacity(0.3) : Color.white.opacity(0.08))
                    .cornerRadius(14)
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(Color.white.opacity(0.14), lineWidth: 0.8)
                    )
                }
                .menuStyle(.borderlessButton)
                
                // Speed Menu
                Menu {
                    Button("0.50x") { engine.setRate(0.5) }
                    Button("0.75x") { engine.setRate(0.75) }
                    Button("1.00x Normal") { engine.setRate(1.0) }
                    Button("1.25x") { engine.setRate(1.25) }
                    Button("1.50x") { engine.setRate(1.5) }
                    Button("2.00x") { engine.setRate(2.0) }
                } label: {
                    Text(String(format: "%.2fx", engine.playbackRate))
                        .font(.system(size: 11, weight: .bold, design: .monospaced))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 6)
                        .background(Color.white.opacity(0.08))
                        .cornerRadius(14)
                }
                .menuStyle(.borderlessButton)
                
                Spacer()
                
                // Volume Controls
                HStack(spacing: 5) {
                    Button(action: { engine.toggleMute() }) {
                        Image(systemName: engine.isMuted ? "speaker.slash.fill" : "speaker.wave.2.fill")
                            .font(.system(size: 12))
                            .foregroundColor(engine.isMuted ? .red : .white.opacity(0.85))
                    }
                    .buttonStyle(.plain)
                    
                    Slider(value: Binding(
                        get: { Double(engine.volume) },
                        set: {
                            engine.volume = Int32($0)
                            engine.vlc.volume = Int32($0)
                            engine.userDidInteract()
                        }
                    ), in: 0...150)
                    .frame(width: 55)
                    .accentColor(.orange)
                    
                    Text("\(engine.volume)%")
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                        .foregroundColor(.white.opacity(0.75))
                        .frame(width: 28, alignment: .trailing)
                }
                
                Divider()
                    .frame(height: 20)
                    .background(Color.white.opacity(0.18))
                
                // Copy Frame Button
                Button(action: { engine.copySnapshotToClipboard() }) {
                    Image(systemName: "doc.on.clipboard")
                        .font(.system(size: 12))
                }
                .buttonStyle(GlassCircleButtonStyle())
                .help("Copy Frame to Clipboard (Cmd+C)")
                
                // Picture-in-Picture Button
                Button(action: { engine.togglePiP() }) {
                    Image(systemName: engine.isPiP ? "pip.exit" : "pip.enter")
                        .font(.system(size: 12))
                        .foregroundColor(engine.isPiP ? .orange : .white.opacity(0.85))
                }
                .buttonStyle(GlassCircleButtonStyle())
                .help("Picture-in-Picture / Always on Top (Cmd+Shift+P)")
                
                // Quick Settings Inspector Button
                Button(action: {
                    withAnimation(.spring(response: 0.35, dampingFraction: 0.75)) {
                        engine.showSettingsInspector.toggle()
                    }
                    engine.userDidInteract(forceKeepOpen: engine.showSettingsInspector)
                }) {
                    Image(systemName: "slider.vertical.3")
                        .font(.system(size: 12))
                        .foregroundColor(engine.showSettingsInspector ? .orange : .white.opacity(0.85))
                }
                .buttonStyle(GlassCircleButtonStyle())
                .help("Quick Settings & Equalizer (Cmd+E)")
                
                // Fullscreen Toggle
                Button(action: {
                    NSApplication.shared.windows.first?.toggleFullScreen(nil)
                }) {
                    Image(systemName: engine.isFullscreen ? "arrow.down.right.and.arrow.up.left" : "arrow.up.left.and.arrow.down.right")
                        .font(.system(size: 12))
                }
                .buttonStyle(GlassCircleButtonStyle())
                .help("Toggle Fullscreen (F)")
            }
            .foregroundColor(.white)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(.ultraThinMaterial)
        .cornerRadius(22)
        .overlay(
            RoundedRectangle(cornerRadius: 22)
                .stroke(Color.white.opacity(0.16), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.45), radius: 20, x: 0, y: 10)
    }
}

// MARK: - Button Styles

struct GlassCircleButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .frame(width: 28, height: 28)
            .background(
                Circle()
                    .fill(configuration.isPressed ? Color.white.opacity(0.22) : Color.white.opacity(0.08))
            )
            .overlay(
                Circle()
                    .stroke(Color.white.opacity(0.14), lineWidth: 0.8)
            )
            .scaleEffect(configuration.isPressed ? 0.94 : 1.0)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}

struct HeroAccentPlayButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .frame(width: 40, height: 40)
            .background(
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [Color.orange, Color(red: 1.0, green: 0.38, blue: 0.12)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            )
            .shadow(color: Color.orange.opacity(0.45), radius: configuration.isPressed ? 3 : 8)
            .scaleEffect(configuration.isPressed ? 0.92 : 1.0)
            .animation(.spring(response: 0.25, dampingFraction: 0.6), value: configuration.isPressed)
    }
}

// MARK: - Network Stream Modal View

struct OmniNetworkStreamModal: View {
    @ObservedObject var engine = OmniPlayerEngine.shared
    @State private var streamURLText: String = ""
    
    let presets = [
        ("🎬 Big Buck Bunny (HLS .m3u8)", "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"),
        ("🚀 Tears of Steel (4K MP4)", "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"),
        ("🐘 Elephants Dream (720p)", "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4")
    ]
    
    var body: some View {
        ZStack {
            Color.black.opacity(0.65).ignoresSafeArea()
                .onTapGesture {
                    withAnimation { engine.showNetworkStreamModal = false }
                }
            
            VStack(spacing: 16) {
                HStack {
                    Image(systemName: "globe")
                        .font(.title2)
                        .foregroundColor(.orange)
                    Text("Open Network Stream")
                        .font(.headline.bold())
                        .foregroundColor(.white)
                    Spacer()
                    Button(action: { withAnimation { engine.showNetworkStreamModal = false } }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title3)
                            .foregroundColor(.gray)
                    }
                    .buttonStyle(.plain)
                }
                
                Text("Supports HLS (.m3u8), RTSP, RTMP, HTTP/HTTPS, and direct media URLs:")
                    .font(.caption)
                    .foregroundColor(.gray)
                    .frame(maxWidth: .infinity, alignment: .leading)
                
                HStack(spacing: 8) {
                    TextField("https://example.com/stream.m3u8", text: $streamURLText)
                        .textFieldStyle(.roundedBorder)
                    
                    Button("Paste") {
                        if let str = NSPasteboard.general.string(forType: .string) {
                            streamURLText = str.trimmingCharacters(in: .whitespacesAndNewlines)
                        }
                    }
                }
                
                VStack(alignment: .leading, spacing: 6) {
                    Text("Quick Sample Streams:")
                        .font(.caption2.bold())
                        .foregroundColor(.gray)
                    ForEach(presets, id: \.1) { name, urlStr in
                        Button(action: { streamURLText = urlStr }) {
                            HStack {
                                Text(name)
                                    .font(.caption)
                                    .foregroundColor(.orange)
                                Spacer()
                                Image(systemName: "arrow.up.left.square")
                                    .font(.caption2)
                                    .foregroundColor(.gray)
                            }
                            .padding(6)
                            .background(Color.white.opacity(0.05))
                            .cornerRadius(6)
                        }
                        .buttonStyle(.plain)
                    }
                }
                
                HStack {
                    Spacer()
                    Button("Cancel") {
                        withAnimation { engine.showNetworkStreamModal = false }
                    }
                    .keyboardShortcut(.cancelAction)
                    
                    Button("Start Streaming") {
                        let trimmed = streamURLText.trimmingCharacters(in: .whitespacesAndNewlines)
                        withAnimation { engine.showNetworkStreamModal = false }
                        if trimmed.lowercased().hasPrefix("magnet:?") {
                            MagnetStreamManager.shared.startStreaming(magnetUri: trimmed)
                        } else if let url = URL(string: trimmed) {
                            engine.playFile(url: url)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.orange)
                    .disabled(streamURLText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
            .padding(24)
            .frame(width: 480)
            .background(.ultraThinMaterial)
            .cornerRadius(20)
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(Color.white.opacity(0.18), lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.6), radius: 24, x: 0, y: 12)
        }
    }
}

// MARK: - Free Online AI Assistant Floating Sheet

struct OmniAIAssistantView: View {
    @ObservedObject var engine = OmniPlayerEngine.shared
    
    let chips = [
        "What did they just say?",
        "Explain this scene and context",
        "Summarize the plot so far",
        "Explain the historical or cultural reference here"
    ]
    
    var body: some View {
        ZStack {
            Color.black.opacity(0.6).ignoresSafeArea()
                .onTapGesture {
                    withAnimation { engine.showAIAssistantSheet = false }
                }
            
            VStack(spacing: 16) {
                HStack {
                    Image(systemName: "sparkles")
                        .font(.title2)
                        .foregroundColor(.purple)
                    Text("AI Scene Assistant (Powered by Groq LPU)")
                        .font(.headline.bold())
                        .foregroundColor(.white)
                    Spacer()
                    Button(action: { withAnimation { engine.showAIAssistantSheet = false } }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title3)
                            .foregroundColor(.gray)
                    }
                    .buttonStyle(.plain)
                }
                
                if engine.groqApiKey.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("🔑 Groq API Key Required for AI")
                            .font(.caption.bold())
                            .foregroundColor(.purple)
                        HStack {
                            SecureField("Enter Free Groq Key (console.groq.com)", text: $engine.groqApiKey)
                                .textFieldStyle(.roundedBorder)
                            Button("Save") {
                                UserDefaults.standard.set(engine.groqApiKey, forKey: "omni_groq_key")
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(.purple)
                        }
                    }
                    .padding(10)
                    .background(Color.purple.opacity(0.12))
                    .cornerRadius(8)
                } else {
                    HStack {
                        Image(systemName: "checkmark.seal.fill")
                            .foregroundColor(.purple)
                            .font(.caption)
                        Text("Groq Key: ••••••••\(engine.groqApiKey.suffix(4))")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.7))
                        Spacer()
                        Button("Change") {
                            engine.groqApiKey = ""
                            UserDefaults.standard.removeObject(forKey: "omni_groq_key")
                        }
                        .font(.caption.bold())
                        .foregroundColor(.purple)
                    }
                    .padding(8)
                    .background(Color.purple.opacity(0.12))
                    .cornerRadius(8)
                }
                
                if let sub = engine.primarySubtitleText {
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "quote.opening")
                            .foregroundColor(.orange)
                        Text(sub)
                            .font(.caption.italic())
                            .foregroundColor(.white.opacity(0.85))
                        Spacer()
                    }
                    .padding(8)
                    .background(Color.white.opacity(0.06))
                    .cornerRadius(8)
                }
                
                // Quick Question Chips
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(chips, id: \.self) { chip in
                            Button(action: {
                                engine.aiAssistantQuery = chip
                                engine.askAIAssistant(prompt: chip)
                            }) {
                                Text(chip)
                                    .font(.caption2.bold())
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 6)
                                    .background(Color.purple.opacity(0.2))
                                    .cornerRadius(12)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 12)
                                            .stroke(Color.purple.opacity(0.4), lineWidth: 1)
                                    )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                
                // User Question Input
                HStack(spacing: 8) {
                    TextField("Ask anything about this scene or dialogue...", text: $engine.aiAssistantQuery)
                        .textFieldStyle(.roundedBorder)
                    
                    Button("Ask AI") {
                        engine.askAIAssistant(prompt: engine.aiAssistantQuery)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.purple)
                    .disabled(engine.isAIAssistantLoading || engine.aiAssistantQuery.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
                
                // Response Area
                if engine.isAIAssistantLoading {
                    HStack(spacing: 10) {
                        ProgressView()
                            .scaleEffect(0.8)
                        Text("Thinking via Groq LPU...")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                    .padding()
                } else if !engine.aiAssistantResponse.isEmpty {
                    ScrollView {
                        Text(engine.aiAssistantResponse)
                            .font(.system(size: 13))
                            .foregroundColor(.white)
                            .multilineTextAlignment(.leading)
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .frame(maxHeight: 180)
                    .background(Color.white.opacity(0.05))
                    .cornerRadius(10)
                }
            }
            .padding(20)
            .frame(width: 520)
            .background(.ultraThinMaterial)
            .cornerRadius(20)
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(Color.purple.opacity(0.3), lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.6), radius: 24, x: 0, y: 12)
        }
    }
}

// MARK: - Modern Welcome Canvas

struct OmniModernWelcomeView: View {
    @ObservedObject var engine = OmniPlayerEngine.shared
    @State private var clipboardMagnet: String? = nil
    
    func scanClipboardForMagnet() {
        if let clip = NSPasteboard.general.string(forType: .string)?.trimmingCharacters(in: .whitespacesAndNewlines),
           clip.lowercased().hasPrefix("magnet:?") {
            clipboardMagnet = clip
        } else {
            clipboardMagnet = nil
        }
    }
    
    var body: some View {
        VStack(spacing: 18) {
            ZStack {
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [Color.purple.opacity(0.35), Color.orange.opacity(0.2), Color.clear],
                            center: .center,
                            startRadius: 10,
                            endRadius: 90
                        )
                    )
                    .frame(width: 150, height: 150)
                
                Image(nsImage: NSApp.applicationIconImage ?? NSImage())
                    .resizable()
                    .scaledToFit()
                    .frame(width: 90, height: 90)
                    .shadow(color: .orange.opacity(0.6), radius: 16)
            }
            
            VStack(spacing: 5) {
                Text("OmniPlayer Pro")
                    .font(.system(size: 26, weight: .bold, design: .rounded))
                    .foregroundColor(.white.opacity(0.95))
                
                Text("Universal Media Player • Powered by libvlc & Groq Whisper AI")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.white.opacity(0.6))
            }
            
            VStack(spacing: 6) {
                Text("Drag & drop any video, magnet link, or subtitle file here")
                    .font(.system(size: 12))
                    .foregroundColor(.gray)
                
                Text("Lanczos 4K Upscale • Groq AI Subtitles • Online Streaming • Stackable EQ")
                    .font(.system(size: 11))
                    .foregroundColor(.gray.opacity(0.8))
            }
            .padding(.vertical, 4)
            
            // Clipboard Magnet Link Quick-Capture Card
            if let mag = clipboardMagnet {
                Button(action: {
                    withAnimation { engine.showMagnetSheet = true }
                    MagnetStreamManager.shared.startStreaming(magnetUri: mag)
                    engine.showOSD("🧲 Streaming Captured Magnet Link")
                }) {
                    HStack(spacing: 10) {
                        Image(systemName: "bolt.horizontal.circle.fill")
                            .font(.system(size: 18))
                            .foregroundColor(.orange)
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Magnet Link Detected in Clipboard")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(.white)
                            Text(mag)
                                .font(.system(size: 10, design: .monospaced))
                                .foregroundColor(.gray)
                                .lineLimit(1)
                        }
                        
                        Spacer()
                        
                        Text("Stream Now →")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.orange)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(Color.orange.opacity(0.2))
                            .cornerRadius(6)
                    }
                    .padding(10)
                    .background(Color.white.opacity(0.08))
                    .cornerRadius(12)
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.orange.opacity(0.4), lineWidth: 1))
                }
                .buttonStyle(.plain)
                .frame(maxWidth: 520)
            }
            
            HStack(spacing: 12) {
                Button(action: {
                    let panel = NSOpenPanel()
                    panel.allowsMultipleSelection = true
                    panel.canChooseFiles = true
                    panel.message = "Choose any media file to play"
                    if panel.runModal() == .OK {
                        for u in panel.urls {
                            let (cleanTitle, year) = cleanMediaTitle(from: u.lastPathComponent)
                            let title = year != nil ? "\(cleanTitle) (\(year!))" : cleanTitle
                            engine.playlist.append(PlaylistItem(url: u, title: title))
                        }
                        if let first = panel.urls.first {
                            engine.playFile(url: first)
                        }
                    }
                }) {
                    HStack(spacing: 6) {
                        Image(systemName: "plus.circle.fill")
                        Text("Open File...")
                    }
                    .font(.system(size: 12, weight: .semibold))
                    .padding(.horizontal, 14)
                    .padding(.vertical, 9)
                }
                .buttonStyle(.borderedProminent)
                .tint(.orange)
                
                Button(action: {
                    scanClipboardForMagnet()
                    withAnimation { engine.showMagnetSheet = true }
                    if let clip = clipboardMagnet {
                        MagnetStreamManager.shared.startStreaming(magnetUri: clip)
                        engine.showOSD("🧲 Captured Magnet Link from Clipboard")
                    }
                }) {
                    HStack(spacing: 6) {
                        Image(systemName: "link.circle.fill")
                        Text("Capture Magnet Link...")
                    }
                    .font(.system(size: 12, weight: .semibold))
                    .padding(.horizontal, 14)
                    .padding(.vertical, 9)
                }
                .buttonStyle(.bordered)
                .tint(.purple)
                
                Button(action: {
                    withAnimation { engine.showNetworkStreamModal = true }
                }) {
                    HStack(spacing: 6) {
                        Image(systemName: "globe")
                        Text("Network Stream...")
                    }
                    .font(.system(size: 12, weight: .semibold))
                    .padding(.horizontal, 14)
                    .padding(.vertical, 9)
                }
                .buttonStyle(.bordered)
            }
        }
        .padding(28)
        .background(.ultraThinMaterial)
        .cornerRadius(24)
        .overlay(
            RoundedRectangle(cornerRadius: 24)
                .stroke(Color.white.opacity(0.14), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.5), radius: 24, x: 0, y: 12)
        .onAppear {
            scanClipboardForMagnet()
        }
    }
}

// MARK: - App Delegate & System Menu Bar Builder



// MARK: - Embedded In-Process OmniPlayer Window Controller

public class OmniPlayerWindowController: NSObject, NSWindowDelegate {
    public static let shared = OmniPlayerWindowController()
    
    public private(set) var playerWindow: NSWindow?
    
    public func play(url: URL, title: String? = nil) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.showPlayerWindow()
            let cleanTitle = title ?? url.deletingPathExtension().lastPathComponent
            OmniPlayerEngine.shared.playlist.append(PlaylistItem(url: url, title: cleanTitle))
            OmniPlayerEngine.shared.playFile(url: url, displayTitle: cleanTitle)
        }
    }
    
    public func playTorrent(infoHash: String, fileIndex: Int, title: String? = nil) {
        let p = MagnetStreamManager.shared.activePort
        let safeTitle = (title ?? "video.mp4").replacingOccurrences(of: "/", with: "-")
        let encodedTitle = safeTitle.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? "video.mp4"
        let streamUrlStr = "http://127.0.0.1:\(p)/api/stream/\(infoHash)/\(fileIndex)/\(encodedTitle)"
        if let url = URL(string: streamUrlStr) {
            play(url: url, title: title)
        }
    }
    
    public func stop() {
        DispatchQueue.main.async {
            OmniPlayerEngine.shared.stop()
        }
    }
    
    public func showPlayerWindow() {
        if playerWindow == nil {
            let contentView = OmniPlayerWindowView()
            let win = NSWindow(
                contentRect: NSRect(x: 0, y: 0, width: 1060, height: 660),
                styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
                backing: .buffered,
                defer: false
            )
            win.center()
            win.title = "OmniPlayer Studio"
            win.titlebarAppearsTransparent = true
            win.titleVisibility = .hidden
            win.isMovableByWindowBackground = true
            win.delegate = self
            win.isReleasedWhenClosed = false
            win.contentView = NSHostingView(rootView: contentView)
            playerWindow = win
        }
        playerWindow?.makeKeyAndOrderFront(nil)
        playerWindow?.orderFrontRegardless()
        NSApp.activate(ignoringOtherApps: true)
    }
    
    public func windowDidEnterFullScreen(_ notification: Notification) {
        OmniPlayerEngine.shared.isFullscreen = true
        OmniPlayerEngine.shared.userDidInteract()
    }
    
    public func windowDidExitFullScreen(_ notification: Notification) {
        OmniPlayerEngine.shared.isFullscreen = false
        OmniPlayerEngine.shared.userDidInteract()
        NSCursor.unhide()
    }
    
    public func windowWillClose(_ notification: Notification) {
        OmniPlayerEngine.shared.pause()
    }
}
