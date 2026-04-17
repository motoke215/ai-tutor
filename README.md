# 私塾·AI家教 Android 项目

## 快速构建

### 方法一：Android Studio（推荐）
1. 解压 `ai-tutor-android.zip`
2. 打开 Android Studio → File → Open → 选择解压目录
3. 等待 Gradle 同步完成
4. 菜单：Build → Build Bundle(s) / APK(s) → Build APK(s)
5. APK 路径：`app/build/outputs/apk/debug/app-debug.apk`

### 方法二：命令行
```bash
# 确保已安装 Android SDK（ANDROID_HOME 已设置）
chmod +x gradlew
./gradlew assembleDebug
# APK 在：app/build/outputs/apk/debug/app-debug.apk
```

## 使用说明

### 首次使用
1. 安装 APK 后打开应用
2. 在「Anthropic API Key」框输入你的 Key
   - 获取地址：https://console.anthropic.com/
   - Key 仅存储在本地设备，不会上传
3. 选择学习主题和水平 → 开始学习

### 功能特色
- 🌙 4种主题：暗夜琥珀 / 白日书院 / 深海墨水 / 竹林清风
- 🧑‍🏫 7位专属教师：Alex(编程)、Sarah(外语)、王老师(理科)、陈老师(文科)、李老师(商科)、林老师(生命科学)、孔老师(通才)
- 🎙️ 实时语音输入输出（中英文自动切换）
- 📊 苏格拉底教学法 + 实时掌握率追踪（80%才推进）

## 需求
- Android 7.0+ (API 24+)
- 网络权限（调用 Anthropic API）
- 麦克风权限（语音功能）

## 项目结构
```
app/src/main/
├── assets/index.html      ← 完整 Web 应用
├── java/com/aitutor/app/
│   └── MainActivity.java  ← WebView 宿主
└── AndroidManifest.xml
```
