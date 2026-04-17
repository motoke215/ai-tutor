package com.aitutor.app;

import android.annotation.SuppressLint;
import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.speech.RecognizerIntent;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.content.ActivityNotFoundException;
import android.media.AudioAttributes;
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
import java.util.ArrayList;
import java.util.Locale;
import java.util.HashMap;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private static final int REQ_RECORD_AUDIO = 1001;
    private static final int REQ_SPEECH_RECOGNITION = 1002;
    private PermissionRequest pendingPermissionRequest = null;
    private String pendingSttCallback = null;

    // ── Singleton TTS ───────────────────────────────────────────────────────
    private TextToSpeech tts = null;
    private boolean ttsReady = false;

    private void initTts() {
        tts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                ttsReady = true;
                // Force audio to speaker, not earpiece
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    AudioAttributes aa = new AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_MEDIA)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                            .build();
                    tts.setAudioAttributes(aa);
                }
                tts.setLanguage(Locale.CHINA);
                tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override public void onStart(String id) {
                        postJs("if(window._ttsOnStart)window._ttsOnStart()");
                    }
                    @Override public void onDone(String id) {
                        postJs("if(window._ttsOnEnd)window._ttsOnEnd()");
                    }
                    @Override public void onError(String id) {
                        postJs("if(window._ttsOnError)window._ttsOnError('err')");
                    }
                });
                postJs("if(window._ttsReady)window._ttsReady()");
            }
        });
    }

    private void postJs(String js) {
        if (webView == null || isFinishing() || isDestroyed()) return;
        webView.post(() -> webView.evaluateJavascript(js, null));
    }

    private boolean checkAudioPermission() {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
                == PackageManager.PERMISSION_GRANTED;
    }

    private void requestAudioPermission() {
        if (!checkAudioPermission()) {
            runOnUiThread(() -> ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.RECORD_AUDIO}, REQ_RECORD_AUDIO));
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Edge-to-edge display
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Window w = getWindow();
            w.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS
                    | WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
            w.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            w.setStatusBarColor(Color.TRANSPARENT);
            w.setNavigationBarColor(Color.parseColor("#0f0d0a"));
            w.setLayout(WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.MATCH_PARENT);
        }

        webView = new WebView(this);
        setContentView(webView);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setAllowFileAccessFromFileURLs(true);
        s.setAllowUniversalAccessFromFileURLs(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP)
            s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView v, String u) { return false; }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override public void onPermissionRequest(PermissionRequest req) {
                for (String r : req.getResources()) {
                    if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(r)) {
                        if (!checkAudioPermission()) {
                            pendingPermissionRequest = req;
                            requestAudioPermission();
                            return;
                        }
                    }
                }
                req.grant(req.getResources());
            }
        });

        // ── Initialize TTS once ─────────────────────────────────────────────
        initTts();

        // ── JS bridge: AndroidTutor ───────────────────────────────────────
        webView.addJavascriptInterface(new Object() {

            // TTS: speak text
            @JavascriptInterface
            public void ttsSpeak(String text) {
                if (text == null || text.isEmpty() || tts == null) return;
                runOnUiThread(() -> {
                    if (!ttsReady) return;
                    HashMap<String,String> p = new HashMap<>();
                    p.put(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, "uid_tts");
                    tts.speak(text, TextToSpeech.QUEUE_FLUSH, p);
                });
            }

            // TTS: stop speaking
            @JavascriptInterface
            public void ttsStop() {
                if (tts != null) tts.stop();
            }

            // TTS: check if ready
            @JavascriptInterface
            public boolean ttsIsReady() {
                return ttsReady;
            }

            // STT: start listening via system speech dialog
            @JavascriptInterface
            public void sttStart(String callbackId) {
                if (isFinishing() || isDestroyed()) return;
                pendingSttCallback = callbackId;
                if (!checkAudioPermission()) {
                    runOnUiThread(() -> ActivityCompat.requestPermissions(MainActivity.this,
                            new String[]{Manifest.permission.RECORD_AUDIO}, REQ_RECORD_AUDIO));
                    return;
                }
                runOnUiThread(() -> {
                    if (isFinishing() || isDestroyed()) return;
                    try {
                        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                                RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "zh-CN");
                        i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);
                        i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
                        startActivityForResult(i, REQ_SPEECH_RECOGNITION);
                    } catch (ActivityNotFoundException e) {
                        pendingSttCallback = null;
                        postJs("if(window._sttOnError)window._sttOnError('not_found','not_found')");
                    } catch (Exception e) {
                        pendingSttCallback = null;
                        postJs("if(window._sttOnError)window._sttOnError('error','error')");
                    }
                });
            }

            // STT: check if permission granted
            @JavascriptInterface
            public boolean sttHasPermission() {
                return checkAudioPermission();
            }

            // STT: request microphone permission
            @JavascriptInterface
            public void sttRequestPermission() {
                requestAudioPermission();
            }

        }, "AndroidTutor");

        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public void onRequestPermissionsResult(int reqCode, @NonNull String[] perms, @NonNull int[] results) {
        super.onRequestPermissionsResult(reqCode, perms, results);
        if (reqCode == REQ_RECORD_AUDIO) {
            if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) {
                // permission granted — retry STT if pending
                if (pendingSttCallback != null) {
                    runOnUiThread(() -> {
                        if (isFinishing() || isDestroyed()) return;
                        try {
                            Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                            i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                                    RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                            i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "zh-CN");
                            i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);
                            i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
                            startActivityForResult(i, REQ_SPEECH_RECOGNITION);
                        } catch (Exception e) {
                            pendingSttCallback = null;
                            postJs("if(window._sttOnError)window._sttOnError('error','error')");
                        }
                    });
                }
            } else {
                runOnUiThread(() -> Toast.makeText(this, "需要麦克风权限", Toast.LENGTH_LONG).show());
                pendingSttCallback = null;
                postJs("if(window._sttOnError)window._sttOnError('denied','permission_denied')");
            }
            if (pendingPermissionRequest != null) {
                pendingPermissionRequest.grant(pendingPermissionRequest.getResources());
                pendingPermissionRequest = null;
            }
        }
    }

    @Override
    protected void onActivityResult(int reqCode, int resultCode, Intent data) {
        super.onActivityResult(reqCode, resultCode, data);
        if (reqCode == REQ_SPEECH_RECOGNITION) {
            String cb = pendingSttCallback;
            pendingSttCallback = null;
            if (webView == null || isFinishing() || isDestroyed()) return;
            if (resultCode == RESULT_OK && data != null) {
                ArrayList<String> results = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
                if (results != null && !results.isEmpty()) {
                    String text = results.get(0).replace("'", "\\'");
                    postJs("if(window._sttOnResult)window._sttOnResult('" + cb + "','" + text + "')");
                    return;
                }
            }
            postJs("if(window._sttOnError)window._sttOnError('" + cb + "','no_result')");
        }
    }

    @Override public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override protected void onPause() {
        super.onPause();
        if (tts != null) tts.stop();
        if (webView != null) webView.onPause();
    }

    @Override protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }

    @Override protected void onDestroy() {
        if (tts != null) { tts.stop(); tts.shutdown(); tts = null; }
        if (webView != null) { webView.destroy(); webView = null; }
        super.onDestroy();
    }
}
