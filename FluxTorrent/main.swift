import AppKit
import WebKit

class AppDelegate: NSObject, NSApplicationDelegate {
    var window: NSWindow!
    var webView: WKWebView!
    
    class WebUIDelegate: NSObject, WKUIDelegate {
        func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
            let alert = NSAlert()
            alert.messageText = message
            alert.addButton(withTitle: "OK")
            alert.addButton(withTitle: "Cancel")
            let response = alert.runModal()
            completionHandler(response == .alertFirstButtonReturn)
        }
        func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
            let alert = NSAlert()
            alert.messageText = message
            alert.addButton(withTitle: "OK")
            alert.runModal()
            completionHandler()
        }
    }
    let uiDelegate = WebUIDelegate()
    var backendProcess: Process?
    var errorLabel: NSTextField?
    var isBackendReady = false
    var statusItem: NSStatusItem?

    func applicationDidFinishLaunching(_ notification: Notification) {
        print("App launched!")
        let windowRect = NSRect(x: 0, y: 0, width: 1060, height: 750)
        window = NSWindow(contentRect: windowRect,
                          styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
                          backing: .buffered,
                          defer: false)
        window.isReleasedWhenClosed = false
        window.center()
        window.title = "OmniFlux"
        window.titleVisibility = .hidden
        window.titlebarAppearsTransparent = true
        window.makeKeyAndOrderFront(nil)

        let contentController = WKUserContentController()
        contentController.add(self, name: "omniPlayer")
        
        let webConfiguration = WKWebViewConfiguration()
        webConfiguration.userContentController = contentController
        webView = WKWebView(frame: window.contentView!.bounds, configuration: webConfiguration)
        webView.uiDelegate = uiDelegate
        webView.autoresizingMask = [.width, .height]
        window.contentView?.addSubview(webView)

        setupMainMenu()
        setupStatusItem()
        
        NSAppleEventManager.shared().setEventHandler(self, andSelector: #selector(handleGetURLEvent(event:withReplyEvent:)), forEventClass: AEEventClass(kInternetEventClass), andEventID: AEEventID(kAEGetURL))
        
        startBackend()
        checkBackendHealth(startTime: Date())
    }

    func setupMainMenu() {
        let mainMenu = NSMenu()
        NSApp.mainMenu = mainMenu
        
        let appMenuItem = NSMenuItem()
        mainMenu.addItem(appMenuItem)
        let appMenu = NSMenu()
        appMenuItem.submenu = appMenu
        appMenu.addItem(NSMenuItem(title: "Quit OmniFlux", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q"))
        
        let editMenuItem = NSMenuItem()
        mainMenu.addItem(editMenuItem)
        let editMenu = NSMenu(title: "Edit")
        editMenuItem.submenu = editMenu
        editMenu.addItem(NSMenuItem(title: "Undo", action: NSSelectorFromString("undo:"), keyEquivalent: "z"))
        editMenu.addItem(NSMenuItem(title: "Redo", action: NSSelectorFromString("redo:"), keyEquivalent: "Z"))
        editMenu.addItem(NSMenuItem.separator())
        editMenu.addItem(NSMenuItem(title: "Cut", action: NSSelectorFromString("cut:"), keyEquivalent: "x"))
        editMenu.addItem(NSMenuItem(title: "Copy", action: NSSelectorFromString("copy:"), keyEquivalent: "c"))
        editMenu.addItem(NSMenuItem(title: "Paste", action: NSSelectorFromString("paste:"), keyEquivalent: "v"))
        editMenu.addItem(NSMenuItem(title: "Select All", action: NSSelectorFromString("selectAll:"), keyEquivalent: "a"))
    }

    func setupStatusItem() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        if let button = statusItem?.button {
            button.title = "OmniFlux"
        }

        let menu = NSMenu()
        let showItem = NSMenuItem(title: "Show OmniFlux", action: #selector(showAppWindow), keyEquivalent: "")
        showItem.target = self
        menu.addItem(showItem)

        menu.addItem(NSMenuItem.separator())

        let quitItem = NSMenuItem(title: "Quit", action: #selector(quitApp), keyEquivalent: "q")
        quitItem.target = self
        menu.addItem(quitItem)

        statusItem?.menu = menu
    }

    @objc func showAppWindow() {
        NSApp.activate(ignoringOtherApps: true)
        if let window = window {
            window.deminiaturize(nil)
            window.makeKeyAndOrderFront(nil)
        }
    }

    @objc func quitApp() {
        NSApp.terminate(nil)
    }

    @objc func handleGetURLEvent(event: NSAppleEventDescriptor, withReplyEvent replyEvent: NSAppleEventDescriptor) {
        guard let urlString = event.paramDescriptor(forKeyword: AEKeyword(keyDirectObject))?.stringValue else { return }
        
        let portFilePath = "/tmp/fluxtorrent_port.txt"
        guard FileManager.default.fileExists(atPath: portFilePath),
              let content = try? String(contentsOfFile: portFilePath, encoding: .utf8),
              let port = Int(content.trimmingCharacters(in: .whitespacesAndNewlines)),
              port > 0 else {
            return
        }
        
        guard let url = URL(string: "http://localhost:\(port)/api/torrents") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: String] = ["magnet": urlString]
        guard let httpBody = try? JSONSerialization.data(withJSONObject: body) else { return }
        request.httpBody = httpBody
        
        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("Error sending magnet link: \(error)")
            }
        }
        task.resume()
    }

    func checkBackendHealth(startTime: Date) {
        if isBackendReady { return }

        if Date().timeIntervalSince(startTime) >= 10.0 {
            print("Failed to start backend: Health check timed out after 10 seconds.")
            showError("Failed to start backend")
            return
        }

        let portFilePath = "/tmp/fluxtorrent_port.txt"
        guard FileManager.default.fileExists(atPath: portFilePath),
              let content = try? String(contentsOfFile: portFilePath, encoding: .utf8),
              let port = Int(content.trimmingCharacters(in: .whitespacesAndNewlines)),
              port > 0 else {
            // Port file doesn't exist yet or is empty, retry
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
                self?.checkBackendHealth(startTime: startTime)
            }
            return
        }

        guard let url = URL(string: "http://localhost:\(port)/api/torrents") else {
            showError("Failed to start backend")
            return
        }

        var request = URLRequest(url: url)
        request.timeoutInterval = 2.0

        let task = URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            guard let self = self else { return }

            var success = false
            if error == nil, let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) {
                success = true
            }

            DispatchQueue.main.async {
                if self.isBackendReady { return }

                if success {
                    self.isBackendReady = true
                    if let appURL = URL(string: "http://localhost:\(port)") {
                        var req = URLRequest(url: appURL); req.cachePolicy = .reloadIgnoringLocalCacheData; self.webView.load(req)
                    }
                } else {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        self.checkBackendHealth(startTime: startTime)
                    }
                }
            }
        }
        task.resume()
    }

    func showError(_ message: String = "Failed to start backend") {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let contentView = self.window?.contentView else { return }
            if self.errorLabel == nil {
                let label = NSTextField(labelWithString: message)
                label.textColor = .systemRed
                label.font = NSFont.systemFont(ofSize: 18, weight: .bold)
                label.alignment = .center
                label.isEditable = false
                label.isSelectable = false
                label.isBezeled = false
                label.drawsBackground = false

                let bounds = contentView.bounds
                label.frame = NSRect(x: 20, y: (bounds.height - 40) / 2, width: bounds.width - 40, height: 40)
                label.autoresizingMask = [.width, .minYMargin, .maxYMargin]

                contentView.addSubview(label, positioned: .above, relativeTo: nil)
                self.errorLabel = label
            } else {
                self.errorLabel?.stringValue = message
            }
        }
    }

    func startBackend() {
        guard let resourcePath = Bundle.main.resourcePath else { return }
        
        // Clean up any stale orphaned backend or player processes before starting
        let killTask = Process()
        killTask.executableURL = URL(fileURLWithPath: "/usr/bin/pkill")
        killTask.arguments = ["-9", "-f", "torrent_client|torrent_streamer|OmniPlayer.app|FluxTorrent.app|Torrent Downloader.app"]
        try? killTask.run()
        killTask.waitUntilExit()
        usleep(300000) // Allow OS to release descriptors

        // Remove stale port file before launching backend
        try? FileManager.default.removeItem(atPath: "/tmp/fluxtorrent_port.txt")

        let process = Process()
        process.executableURL = URL(fileURLWithPath: resourcePath + "/torrent_client")
        process.currentDirectoryURL = URL(fileURLWithPath: resourcePath)
        
        var env = ProcessInfo.processInfo.environment
        env["PATH"] = "/opt/homebrew/bin:" + (env["PATH"] ?? "")
        process.environment = env
        
        // Log to /tmp/fluxtorrent.log for debugging
        FileManager.default.createFile(atPath: "/tmp/fluxtorrent.log", contents: nil, attributes: nil)
        if let fileHandle = FileHandle(forWritingAtPath: "/tmp/fluxtorrent.log") {
            process.standardOutput = fileHandle
            process.standardError = fileHandle
        }
        
        do {
            try process.run()
            backendProcess = process
        } catch {
            print("Failed to start backend: \(error)")
            showError("Failed to start backend")
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }

    func applicationWillTerminate(_ notification: Notification) {
        if let bp = backendProcess, bp.isRunning {
            bp.terminate()
            usleep(100000)
            if bp.isRunning {
                kill(bp.processIdentifier, SIGKILL)
            }
        }
        try? FileManager.default.removeItem(atPath: "/tmp/fluxtorrent_port.txt")
    }
}

// MARK: - WebKit Script Message Handler (In-Process OmniPlayer Bridge)

extension AppDelegate: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "omniPlayer", let body = message.body as? [String: Any] else { return }
        let action = body["action"] as? String ?? ""
        
        if action == "playExternal" {
            let infoHash = body["infoHash"] as? String
            let fileIndex = body["fileIndex"] as? Int ?? 0
            if let hash = infoHash {
                let port = MagnetStreamManager.shared.activePort
                guard let url = URL(string: "http://127.0.0.1:\(port)/api/torrents/\(hash)/files/\(fileIndex)/play") else { return }
                var req = URLRequest(url: url)
                req.httpMethod = "POST"
                URLSession.shared.dataTask(with: req).resume()
            }
        } else if action == "openStudio" {
            OmniPlayerWindowController.shared.showPlayerWindow()
        } else if action == "stop" {
            OmniPlayerWindowController.shared.stop()
        }
    }
}

// MARK: - Single-Instance Application Guard & Entrypoint

let currentPid = ProcessInfo.processInfo.processIdentifier
let targetBundleIds = [
    Bundle.main.bundleIdentifier ?? "com.omniflux.OmniFlux",
    "com.omniflux.OmniFlux",
    "com.fluxtorrent.FluxTorrent"
]
var existingInstance: NSRunningApplication? = nil
for bid in targetBundleIds {
    let running = NSRunningApplication.runningApplications(withBundleIdentifier: bid)
    if let found = running.first(where: { $0.processIdentifier != currentPid }) {
        existingInstance = found
        break
    }
}

if let existingApp = existingInstance {
    print("Another instance of OmniFlux is already running (PID: \(existingApp.processIdentifier)). Focusing existing instance and exiting.")
    existingApp.activate(options: [.activateIgnoringOtherApps])
    exit(0)
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.activate(ignoringOtherApps: true)
app.run()
