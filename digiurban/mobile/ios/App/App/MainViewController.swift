import UIKit
import WebKit
import Capacitor

/// Tela principal: a mesma do Capacitor, com a regra de links externos registrada.
class MainViewController: CAPBridgeViewController {
    // o WKWebView guarda o delegate sem segurar: quem segura é esta tela
    private var navigationFilter: OfflineOnlyFilter?

    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(ExternalLinksPlugin())
        if let original = webView?.navigationDelegate {
            navigationFilter = OfflineOnlyFilter(original)
            webView?.navigationDelegate = navigationFilter
        }
    }
}

/// O Capacitor abre a tela "Você está offline" para QUALQUER navegação que falha, inclusive
/// a que foi só interrompida (com a internet ligada). Foi o que a Apple viu na revisão de
/// 13/11/2026 (recusa 2.1): o site respondia e o app mostrava "offline". Aqui só falha de
/// conexão de verdade chega ao Capacitor; o resto é ignorado e a página segue na tela.
final class OfflineOnlyFilter: NSObject, WKNavigationDelegate {
    private let original: WKNavigationDelegate

    init(_ original: WKNavigationDelegate) {
        self.original = original
    }

    /// Falha de rede (sem internet, servidor fora, tempo esgotado), menos a navegação cancelada
    static func isConnectionFailure(_ error: Error) -> Bool {
        let error = error as NSError
        return error.domain == NSURLErrorDomain && error.code != NSURLErrorCancelled
    }

    // tudo o que não é falha de navegação segue para o Capacitor
    override func responds(to aSelector: Selector!) -> Bool {
        super.responds(to: aSelector) || original.responds(to: aSelector)
    }

    override func forwardingTarget(for aSelector: Selector!) -> Any? {
        original
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        if OfflineOnlyFilter.isConnectionFailure(error) {
            original.webView?(webView, didFail: navigation, withError: error)
        }
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        if OfflineOnlyFilter.isConnectionFailure(error) {
            original.webView?(webView, didFailProvisionalNavigation: navigation, withError: error)
        }
    }
}

/// O console da plataforma (/super-admin) não é do app: abre no navegador do sistema.
@objc(ExternalLinksPlugin)
class ExternalLinksPlugin: CAPInstancePlugin, CAPBridgedPlugin {
    let identifier = "ExternalLinksPlugin"
    let jsName = "ExternalLinks"
    let pluginMethods: [CAPPluginMethod] = []

    static func opensOutside(_ url: URL) -> Bool {
        url.path == "/super-admin" || url.path.hasPrefix("/super-admin/")
    }

    override func shouldOverrideLoad(_ navigationAction: WKNavigationAction) -> NSNumber? {
        guard navigationAction.targetFrame?.isMainFrame != false,
              let url = navigationAction.request.url,
              ExternalLinksPlugin.opensOutside(url) else { return nil }
        DispatchQueue.main.async { UIApplication.shared.open(url) }
        return NSNumber(value: true)
    }
}
