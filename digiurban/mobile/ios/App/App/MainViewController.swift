import UIKit
import WebKit
import Capacitor

/// Tela principal: a mesma do Capacitor, com a regra de links externos registrada.
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(ExternalLinksPlugin())
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
