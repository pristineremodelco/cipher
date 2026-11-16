package com.pristineremodel.cipher;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView webView = getBridge().getWebView();
        // After each page, including the bundled fallback. The bridge is already
        // in the page by then, and a tap has not happened yet.
        webView.setWebViewClient(new CipherWebViewClient(getBridge(), readAsset("cipher-native.js")));
        // Back walks the web view, then leaves the app. The plugin's own
        // handler is switched off because it consumes the press at the root
        // and the activity never finishes.
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
    }

    private String readAsset(String name) {
        try (BufferedReader reader = new BufferedReader(
            new InputStreamReader(getAssets().open(name), StandardCharsets.UTF_8)
        )) {
            StringBuilder out = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                out.append(line).append('\n');
            }
            return out.toString();
        } catch (IOException ex) {
            return "";
        }
    }
}
