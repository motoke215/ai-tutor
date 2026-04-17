package com.aitutor.app;

import android.annotation.SuppressLint;
import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.speech.RecognizerIntent;
import android.speech.tts.TextToSpeech;
import android.content.ActivityNotFoundException;
import java.util.ArrayList;
import java.util.Locale;
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
                        if (isFinishing() || isDestroyed()) return;
                        pendingPermissionRequest = null;
                        ActivityCompat.requestPermissions(MainActivity.this,
                                new String[]{Manifest.permission.RECORD_AUDIO},
                                REQUEST_RECORD_AUDIO);
                    });
                }
            }

            @JavascriptInterface
            public void startSpeechRecognition(String callbackFunc) {
                if (isFinishing() || isDestroyed()) return;
                try {
                    if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECORD_AUDIO)
                            != PackageManager.PERMISSION_GRANTED) {
                        pendingSpeechCallback = callbackFunc;
                        runOnUiThread(() -> {
                            if (isFinishing() || isDestroyed()) return;
                            ActivityCompat.requestPermissions(MainActivity.this,
                                    new String[]{Manifest.permission.RECORD_AUDIO},
                                    REQUEST_RECORD_AUDIO);
                        });
                        return;
                    }
                    pendingSpeechCallback = callbackFunc;
                    runOnUiThread(() -> {
                        if (isFinishing() || isDestroyed()) return;
                        try {
                            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                                    RecognizerIntent.EXTRA_LANGUAGE_MODEL_FREE_FORM);
                            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "zh-CN");
                            intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);
                            intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
                            startActivityForResult(intent, REQUEST_SPEECH_RECOGNITION);
                        } catch (ActivityNotFoundException e) {
                            pendingSpeechCallback = null;
                            if (webView != null) {
                                webView.post(() -> webView.evaluateJavascript(
                                        "if (typeof window.onSpeechRecognitionError === 'function') { window.onSpeechRecognitionError('not_found'); }", null));
                            }
                        } catch (Exception e) {
                            pendingSpeechCallback = null;
                        }
                    });
                } catch (Exception e) {
                    pendingSpeechCallback = null;
                }
            }

            @JavascriptInterface
            public void speakText(String text) {
                if (isFinishing() || isDestroyed()) return;
                runOnUiThread(() -> {
                    try {
                        android.speech.tts.TextToSpeech tts = new android.speech.tts.TextToSpeech(MainActivity.this, status -> {
                            if (status == android.speech.tts.TextToSpeech.SUCCESS) {
                                tts.setLanguage(Locale.CHINA);
                                tts.speak(text, android.speech.tts.TextToSpeech.QUEUE_FLUSH, null, "tts_utterance_id");
                            }
                        });
                    } catch (Exception e) {
                        // TTS not available
                    }
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
            // Retry speech recognition if it was pending
            if (pendingSpeechCallback != null && grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                final String callback = pendingSpeechCallback;
                pendingSpeechCallback = null;
                runOnUiThread(() -> {
                    if (isFinishing() || isDestroyed()) return;
                    try {
                        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                                RecognizerIntent.EXTRA_LANGUAGE_MODEL_FREE_FORM);
                        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "zh-CN");
                        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);
                        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
                        startActivityForResult(intent, REQUEST_SPEECH_RECOGNITION);
                    } catch (Exception e) {
                        pendingSpeechCallback = null;
                        if (webView != null) {
                            webView.post(() -> webView.evaluateJavascript(
                                    "if (typeof window.onSpeechRecognitionError === 'function') { window.onSpeechRecognitionError('not_found'); }", null));
                        }
                    }
                });
            } else if (pendingSpeechCallback != null) {
                // Permission denied — notify error
                final String callback = pendingSpeechCallback;
                pendingSpeechCallback = null;
                runOnUiThread(() -> {
                    if (webView != null) {
                        webView.post(() -> webView.evaluateJavascript(
                                "if (typeof window.onSpeechRecognitionError === 'function') { window.onSpeechRecognitionError('permission_denied'); }", null));
                    }
                });
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_SPEECH_RECOGNITION) {
            pendingSpeechCallback = null;
            if (webView == null || isFinishing() || isDestroyed()) return;
            if (resultCode == RESULT_OK && data != null) {
                ArrayList<String> results = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
                if (results != null && results.size() > 0) {
                    String recognizedText = results.get(0);
                    final String js = "if (typeof window.onSpeechRecognitionResult === 'function') { window.onSpeechRecognitionResult('" + recognizedText.replace("'", "\\'") + "'); } else { console.log('Callback not found'); }";
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
        if (webView != null) webView.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
