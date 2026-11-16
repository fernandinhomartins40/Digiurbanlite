package br.com.digiurban.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Diz ao site o que este build sabe fazer. Sem google-services.json o Firebase não existe e
 * PushNotifications.register() derruba o app no código nativo (recusa da Google em 16/11/2026);
 * o site só registra os avisos quando push = true.
 */
@CapacitorPlugin(name = "NativeInfo")
public class NativeInfoPlugin extends Plugin {

    @PluginMethod
    public void capabilities(PluginCall call) {
        // O plugin google-services gera este texto a partir do google-services.json
        int firebase = getContext().getResources().getIdentifier("google_app_id", "string", getContext().getPackageName());
        JSObject result = new JSObject();
        result.put("push", firebase != 0);
        call.resolve(result);
    }
}
