package br.com.digiurban.app;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ExternalLinksPlugin.class);
        super.onCreate(savedInstanceState);
        WebView webView = getBridge().getWebView();

        // Voltar: anda no histórico do site; na primeira página, sai do app.
        // (o tratamento do @capacitor/app fica desligado em capacitor.config.json porque, sem
        // listener no JS, ele engole o toque na raiz e o app nunca sai)
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    finish();
                }
            }
        });

        // Reserva: o WebView ignora downloads. O site (lib/native-app.ts) baixa pelo Filesystem;
        // se algum escapar, abre no navegador do sistema (só http/https).
        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) -> {
            Uri uri = Uri.parse(url);
            String scheme = uri.getScheme();
            if (!"https".equalsIgnoreCase(scheme) && !"http".equalsIgnoreCase(scheme)) return;
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
            } catch (ActivityNotFoundException ignored) {
                // sem navegador instalado: não há o que fazer
            }
        });
    }
}
