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
        let windowRect = NSRect(x: 0, y: 0, width: 1000, height: 800)
        window = NSWindow(contentRect: windowRect,
                          styleMask: [.titled, .closable, .miniaturizable, .resizable],
                          backing: .buffered,
                          defer: false)
        window.isReleasedWhenClosed = false
        window.center()
        window.title = "FluxTorrent"
        window.makeKeyAndOrderFront(nil)

        let webConfiguration = WKWebViewConfiguration()
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
        appMenu.addItem(NSMenuItem(title: "Quit FluxTorrent", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q"))
        
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
            button.title = "FluxTorrent"
        }

        let menu = NSMenu()
        let showItem = NSMenuItem(title: "Show FluxTorrent", action: #selector(showAppWindow), keyEquivalent: "")
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
                        self.webView.load(URLRequest(url: appURL))
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
        return false
    }

    func applicationWillTerminate(_ notification: Notification) {
        backendProcess?.terminate()
        try? FileManager.default.removeItem(atPath: "/tmp/fluxtorrent_port.txt")
    }
}



let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
_ = NSApplicationMain(CommandLine.argc, CommandLine.unsafeArgv)
