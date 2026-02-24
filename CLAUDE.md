# Rhea Mobile

Expo React Native Android App，4 个原生底部 Tab + WebView 混合架构。

## 技术栈

- Expo SDK 54 + React Native 0.81
- TypeScript
- @react-navigation/native + bottom-tabs + native-stack
- react-native-webview
- EAS Build 云端构建（无需本地 Android SDK）

## 项目结构

```
src/
├── components/
│   ├── WebViewScreen.tsx    # 通用 WebView 封装（加载状态、错误处理、返回键支持、Bridge 注入）
│   └── BottomModal.tsx      # 底部弹出 Modal（Animated 滑入 + 遮罩 + 标题栏）
├── hooks/
│   └── useWebBridge.ts      # 统一处理 WebView Bridge 消息（navigate / openModal / closeModal）
├── navigation/
│   └── AppNavigator.tsx     # 导航配置：Bottom Tabs + 每个 Tab 内嵌 Stack Navigator
├── screens/
│   ├── EarnScreen.tsx       # Earn Tab - 供应市场
│   ├── BorrowScreen.tsx     # Borrow Tab - 借贷市场
│   ├── SwapScreen.tsx       # Swap Tab - 跨链兑换
│   ├── MyEarnScreen.tsx     # My Tab - 我的资产
│   └── DetailScreen.tsx     # 二级页面（全屏 push）
web-demo/
├── index.html               # Web 端 Bridge 调用完整示例
└── modal-content.html       # Modal 内容页面示例
```

## 导航架构

- Bottom Tab Navigator: Earn / Borrow / Swap / My
- 每个 Tab 内嵌 Native Stack Navigator，均支持跳转 Detail 二级页面
- Android 硬件返回键支持 WebView 内部后退

## WebView 通信（RheaBridge）

WebView 启动时自动注入 `window.RheaBridge` 对象，Web 页面通过它与 RN 通信。

### Bridge API

```javascript
// 打开二级页面（全屏 push），title 不传则自动读取 document.title
RheaBridge.navigate(url, title?)

// 打开底部 Modal 弹框
RheaBridge.openModal({ title, url?, data? })

// 关闭当前 Modal
RheaBridge.closeModal()
```

### 底层消息格式（postMessage）

```json
// 打开二级页面
{ "type": "navigate", "url": "https://...", "title": "Supply USDC" }

// 打开 Modal
{ "type": "openModal", "title": "Supply Details", "url": "https://...", "data": { "token": "USDC" } }

// 关闭 Modal
{ "type": "closeModal" }
```

### Bridge 就绪事件

```javascript
window.addEventListener("RheaBridgeReady", function () {
  // Bridge 已就绪，可安全调用
});
```

## 开发命令

```bash
npm install             # 安装依赖
npx expo start          # 启动开发服务器
npx expo start --android  # Android 设备调试
```

## 构建 APK

```bash
eas build -p android --profile preview   # 云端构建 APK
```

## Tab URL 配置

当前 4 个 Tab 统一使用 `https://x.rhea.finance`，后续替换为各自对应的 URL：

- Earn: `src/screens/EarnScreen.tsx` 中的 `EARN_URL`
- Borrow: `src/screens/BorrowScreen.tsx` 中的 `BORROW_URL`
- Swap: `src/screens/SwapScreen.tsx` 中的 `SWAP_URL`
- My: `src/screens/MyEarnScreen.tsx` 中的 `MY_EARN_URL`
