# APK 编译打包指南

## 环境要求

- Node.js >= 18
- npm
- Expo 账号（免费注册：https://expo.dev/signup）

**无需本地安装 Java、Android SDK、NDK。** 所有编译在 Expo 云端完成。

## 1. 安装依赖

```bash
npm install
```

## 2. 安装 EAS CLI

```bash
npm install -g eas-cli
```

## 3. 登录 Expo 账号

```bash
eas login
```

如果没有账号，先去 https://expo.dev/signup 注册一个（免费）。

## 4. 构建 APK（云端）

### Preview 版本（推荐测试用）

```bash
eas build -p android --profile preview
```

- 构建完成后终端会输出下载链接
- 也可以在 https://expo.dev 的 Dashboard 中找到构建产物
- 直接下载 `.apk` 文件传到 Android 手机安装即可

### Production 版本

```bash
eas build -p android --profile production
```

## 5. 安装到手机

下载 APK 后：

1. 将 APK 传输到 Android 手机（USB / 微信 / 网盘等）
2. 手机上点击 APK 文件安装
3. 如果提示「未知来源」，需要在系统设置中允许安装未知应用

## 构建配置说明

`eas.json` 中有三个 profile：

| Profile | 用途 | 产物 |
|---------|------|------|
| development | 开发调试 | 开发客户端 |
| preview | 内部测试 | APK |
| production | 正式发布 | APK |

## 常见问题

### 首次构建要多久？

首次构建约 10-15 分钟（需要在云端配置环境），后续构建会更快。

### 免费账号有限制吗？

Expo 免费账号每月有 30 次 build 额度，对测试完全够用。

### 如何查看构建状态？

```bash
eas build:list
```

或者直接访问 https://expo.dev 的 Dashboard。

### 本地开发预览（无需构建 APK）

在手机上安装 Expo Go app（Google Play 搜索 "Expo Go"），然后：

```bash
npx expo start
```

扫描终端显示的二维码即可在手机上实时预览。

**注意**：WebView 在 Expo Go 中可能有限制，完整测试请使用 EAS Build 构建的 APK。
