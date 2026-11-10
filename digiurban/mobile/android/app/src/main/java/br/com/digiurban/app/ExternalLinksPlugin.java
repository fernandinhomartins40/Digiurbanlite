package br.com.digiurban.app;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;

/** O console da plataforma (/super-admin) não é do app: abre no navegador do sistema. */
@CapacitorPlugin(name = "ExternalLinks")
public class ExternalLinksPlugin extends Plugin {

    static boolean opensOutside(Uri url) {
        String path = url.getPath();
        return path != null && (path.equals("/super-admin") || path.startsWith("/super-admin/"));
    }

    @Override
    public Boolean shouldOverrideLoad(Uri url) {
        if (!opensOutside(url)) return null; // segue a regra normal (allowNavigation)
        try {
            getActivity().startActivity(new Intent(Intent.ACTION_VIEW, url));
        } catch (ActivityNotFoundException ignored) {
            // sem navegador: só não abre
        }
        return true;
    }
}
