import UIKit
import SwiftUI
import UniformTypeIdentifiers
import Combine

// Target membership: WeShouldShareExtension only.
final class ShareViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()

        let model = WeShouldShareModel(context: extensionContext)
        let controller = UIHostingController(rootView: ShareForm(model: model))
        addChild(controller)
        view.addSubview(controller.view)
        controller.view.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            controller.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            controller.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            controller.view.topAnchor.constraint(equalTo: view.topAnchor),
            controller.view.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        controller.didMove(toParent: self)

        Task { await model.loadSharedURL() }
    }
}

@MainActor
final class WeShouldShareModel: ObservableObject {
    @Published var sourceURL = ""
    @Published var activityName = ""
    @Published var username = ""
    @Published var password = ""
    @Published var busy = false
    @Published var message = ""
    @Published var saved = false

    private weak var context: NSExtensionContext?
    private let apiBase = URL(string: "https://weshould.mit-sdg.dev/api/")!

    init(context: NSExtensionContext?) {
        self.context = context
    }

    func loadSharedURL() async {
        guard let items = context?.inputItems as? [NSExtensionItem] else {
            message = "Paste a link to save an activity."
            return
        }

        for item in items {
            for provider in item.attachments ?? [] {
                if provider.canLoadObject(ofClass: NSURL.self),
                   let shared = try? await provider.loadWebURL(),
                   ["http", "https"].contains(shared.scheme?.lowercased() ?? "") {
                    sourceURL = shared.absoluteString
                    return
                }

                if provider.canLoadObject(ofClass: NSString.self),
                   let text = try? await provider.loadSharedText(),
                   let shared = extractURL(from: text),
                   ["http", "https"].contains(shared.scheme?.lowercased() ?? "") {
                    sourceURL = shared.absoluteString
                    return
                }
            }
        }

        message = "No web link was included. You can paste the link below."
    }

    private func extractURL(from text: String) -> URL? {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        if let url = URL(string: trimmed),
           ["http", "https"].contains(url.scheme?.lowercased() ?? "") {
            return url
        }
        let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue)
        let range = NSRange(text.startIndex..<text.endIndex, in: text)
        return detector?.firstMatch(in: text, options: [], range: range)?.url
    }

    private func request(_ endpoint: String, json: [String: String]) async throws -> [String: Any] {
        let url = apiBase.appendingPathComponent(endpoint)
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: json)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw ShareError.badResponse
        }
        let object = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] ?? [:]
        guard (200..<300).contains(http.statusCode) else {
            let errorText = object["error"] as? String ?? "Request rejected (HTTP \(http.statusCode))."
            throw ShareError.server(errorText)
        }
        return object
    }

    func save() async {
        guard !busy, !saved else { return }
        let name = activityName.trimmingCharacters(in: .whitespacesAndNewlines)
        let link = sourceURL.trimmingCharacters(in: .whitespacesAndNewlines)

        guard !name.isEmpty, name.count <= 160,
              let url = URL(string: link),
              ["http", "https"].contains(url.scheme?.lowercased() ?? "") else {
            message = "Enter an activity name and a valid http or https link."
            return
        }
        guard !username.isEmpty, !password.isEmpty else {
            message = "Enter your WeShould account credentials to save."
            return
        }

        busy = true
        defer { busy = false }

        do {
            // Credentials and session remain in memory for this save only.
            let auth = try await request("auth/sign-in", json: [
                "username": username,
                "password": password
            ])
            guard let session = auth["session"] as? String else {
                throw ShareError.badResponse
            }
            _ = try await request("intentions/express", json: [
                "session": session,
                "name": name,
                "reference": url.absoluteString
            ])
            password = ""
            saved = true
            message = "Saved to I'd Go."
        } catch {
            password = ""
            message = error.localizedDescription
        }
    }

    func finish() {
        context?.completeRequest(returningItems: [], completionHandler: nil)
    }
}

private enum ShareError: LocalizedError {
    case badResponse
    case server(String)

    var errorDescription: String? {
        switch self {
        case .badResponse:
            return "The server returned an unexpected response."
        case .server(let detail):
            return "WeShould couldn't save this activity: \(detail)"
        }
    }
}

private extension NSItemProvider {
    func loadWebURL() async throws -> URL {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<URL, Error>) in
            loadObject(ofClass: NSURL.self) { value, error in
                if let error {
                    continuation.resume(throwing: error)
                } else if let url = value as? NSURL {
                    continuation.resume(returning: url as URL)
                } else {
                    continuation.resume(throwing: ShareError.badResponse)
                }
            }
        }
    }

    func loadSharedText() async throws -> String {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<String, Error>) in
            loadObject(ofClass: NSString.self) { value, error in
                if let error {
                    continuation.resume(throwing: error)
                } else if let text = value as? NSString {
                    continuation.resume(returning: text as String)
                } else {
                    continuation.resume(throwing: ShareError.badResponse)
                }
            }
        }
    }
}

struct ShareForm: View {
    @ObservedObject var model: WeShouldShareModel

    var body: some View {
        NavigationStack {
            Form {
                Section("Save an idea") {
                    TextField("Activity name (e.g. Wally's Cafe)", text: $model.activityName)
                    TextField("Shared URL", text: $model.sourceURL)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.URL)
                        .autocorrectionDisabled()
                }

                if !model.saved {
                    Section("WeShould account") {
                        TextField("Username", text: $model.username)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                        SecureField("Password", text: $model.password)
                        Text("Sign in is needed for this save. Your password is not stored by the extension.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                if !model.message.isEmpty {
                    Text(model.message)
                        .foregroundStyle(model.saved ? .green : .secondary)
                }

                Section {
                    if model.saved {
                        Button("Done") { model.finish() }
                    } else {
                        Button(model.busy ? "Saving…" : "I'd Go") {
                            Task { await model.save() }
                        }
                        .disabled(model.busy)
                    }
                }
            }
            .navigationTitle("WeShould")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Cancel") { model.finish() }
                }
            }
        }
    }
}
