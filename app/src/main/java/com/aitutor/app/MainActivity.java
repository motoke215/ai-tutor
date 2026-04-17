package com.aitutor.app;

import android.annotation.SuppressLint;
import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.speech.RecognizerIntent;
import java.util.ArrayList;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.WindowManager;
import android.graphics.Color;
import android.os.Build;
import android.view.Window;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private static final int REQUEST_RECORD_AUDIO = 1001;
    private static final int REQUEST_SPEECH_RECOGNITION = 1002;
    private PermissionRequest pendingPermissionRequest = null;
    private String pendingSpeechCallback = null;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Enable edge-to-edge display
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Window window = getWindow();
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS | WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.TRANSPARENT);
            window.setNavigationBarColor(Color.parseColor("#0f0d0a"));
            window.setLayout(WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.MATCH_PARENT);
        }

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return false;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                String[] resources = request.getResources();
                for (String resource : resources) {
                    if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {
                        if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECORD_AUDIO)
                                != PackageManager.PERMISSION_GRANTED) {
                            pendingPermissionRequest = request;
                            ActivityCompat.requestPermissions(MainActivity.this,
                                    new String[]{Manifest.permission.RECORD_AUDIO},
                                    REQUEST_RECORD_AUDIO);
                            return;
                        }
                    }
                }
                request.grant(request.getResources());
            }
        });

        // JS interface for requesting audio permission and speech recognition
        webView.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void requestAudioPermission() {
                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECORD_AUDIO)
                        != PackageManager.PERMISSION_GRANTED) {
                    runOnUiThread(() -> {
                        pendingPermissionRequest = null;
                        ActivityCompat.requestPermissions(MainActivity.this,
                                new String[]{Manifest.permission.RECORD_AUDIO},
                                REQUEST_RECORD_AUDIO);
                    });
                }
            }

            @JavascriptInterface
            public void startSpeechRecognition(String callbackFunc) {
                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECORD_AUDIO)
                        != PackageManager.PERMISSION_GRANTED) {
                    pendingSpeechCallback = callbackFunc;
                    runOnUiThread(() -> {
                        ActivityCompat.requestPermissions(MainActivity.this,
                                new String[]{Manifest.permission.RECORD_AUDIO},
                                REQUEST_RECORD_AUDIO);
                    });
                    return;
                }
                pendingSpeechCallback = callbackFunc;
                runOnUiThread(() -> {
                    Intent intent = new Intent(android.speech.RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                    intent.putExtra(android.speech.RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                            android.speech.RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                    intent.putExtra(android.speech.RecognizerIntent.EXTRA_LANGUAGE, "zh-CN");
                    intent.putExtra(android.speech.RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);
                    intent.putExtra(android.speech.RecognizerIntent.EXTRA_MAX_RESULTS, 1);
                    startActivityForResult(intent, REQUEST_SPEECH_RECOGNITION);
                });
            }
        }, "AndroidPermission");

        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_RECORD_AUDIO) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                // Permission granted
            } else {
                runOnUiThread(() -> {
                    Toast.makeText(this, "需要麦克风权限才能使用语音功能", Toast.LENGTH_LONG).show();
                });
            }
            if (pendingPermissionRequest != null) {
                pendingPermissionRequest.grant(pendingPermissionRequest.getResources());
                pendingPermissionRequest = null;
            }
            // If speech recognition was pending, retry it now that permission is granted
            if (pendingSpeechCallback != null && grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                final String callback = pendingSpeechCallback;
                pendingSpeechCallback = null;
                runOnUiThread(() -> {
                    Intent intent = new Intent(android.speech.RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                    intent.putExtra(android.speech.RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                            android.speech.RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                    intent.putExtra(android.speech.RecognizerIntent.EXTRA_LANGUAGE, "zh-CN");
                    intent.putExtra(android.speech.RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);
                    intent.putExtra(android.speech.RecognizerIntent.EXTRA_MAX_RESULTS, 1);
                    startActivityForResult(intent, REQUEST_SPEECH_RECOGNITION);
                });
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_SPEECH_RECOGNITION) {
            pendingSpeechCallback = null;
            if (webView == null || isFinishing()) return;
            if (resultCode == RESULT_OK && data != null) {
                ArrayList<String> results = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
                if (results != null && results.size() > 0) {
                    String recognizedText = results.get(0);
                    final String js = "if (typeof window.onSpeechRecognitionResult === 'function') { window.onSpeechRecognitionResult('" + recognizedText.replace("'", "\\'") + "'); } else { console.log('Callback onSpeechRecognitionResult not found'); }";
                    webView.post(() -> webView.evaluateJavascript(js, null));
                }
            } else {
                final String js = "if (typeof window.onSpeechRecognitionError === 'function') { window.onSpeechRecognitionError('no_result'); }";
                webView.post(() -> webView.evaluateJavascript(js, null));
            }
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        webView.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
    }

    @Override
    protected void onDestroy() {
        webView.destroy();
        super.onDestroy();
    }
}
