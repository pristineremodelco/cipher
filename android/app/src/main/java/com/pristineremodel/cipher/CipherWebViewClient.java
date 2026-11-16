package com.pristineremodel.cipher;

import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;

/** The stock client, plus the native copy and share hook after each page. */
public class CipherWebViewClient extends BridgeWebViewClient {

    private final String script;

    public CipherWebViewClient(Bridge bridge, String script) {
        super(bridge);
        this.script = script;
    }

    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        if (script != null && !script.isEmpty()) {
            view.evaluateJavascript(script, null);
        }
    }
}
