
import SwiftUI
import WebKit

struct ContentView: View {
    var body: some View {
        WeShouldWebView()
            .ignoresSafeArea()
    }
}

struct WeShouldWebView: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let webView = WKWebView()

        let url = URL(
            string: "https://weshould.mit-sdg.dev"
        )!

        webView.load(URLRequest(url: url))
        return webView
    }

    func updateUIView(
        _ uiView: WKWebView,
        context: Context
    ) {}
}
