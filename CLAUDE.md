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
│   ├── WebViewScreen.tsx    # 通用 WebView 封装（Bridge 注入、下拉刷新、forwardRef）
│   └── BottomModal.tsx      # 底部弹出 Modal（Animated 滑入 + 遮罩）
├── contexts/
│   └── TabBarContext.tsx     # TabBar 显隐状态 Context
├── hooks/
│   └── useWebBridge.ts      # Bridge 消息处理（导航/Modal/回调/TabBar）
├── navigation/
│   └── AppNavigator.tsx     # 导航配置 + 自定义图标 + TabBar 显隐
├── screens/
│   ├── EarnScreen.tsx       # Earn Tab
│   ├── BorrowScreen.tsx     # Borrow Tab
│   ├── SwapScreen.tsx       # Swap Tab
│   ├── MyEarnScreen.tsx     # My Tab
│   └── DetailScreen.tsx     # 二级页面（全屏 push）
assets/
├── tab-icons/
│   ├── earn.png / earn-active.png
│   ├── borrow.png / borrow-active.png
│   ├── swap.png / swap-active.png
│   └── my.png / my-active.png
web-demo/
├── index.html               # Bridge 调用完整示例 Demo
└── modal-content.html       # Modal 内容页面示例
```

## 导航架构

- Bottom Tab Navigator: Earn / Borrow / Swap / My
- 每个 Tab 内嵌 Native Stack Navigator，均支持跳转 Detail 二级页面
- Android 硬件返回键支持 WebView 内部后退

## WebView 通信（RheaBridge）

WebView 启动时自动注入 `window.RheaBridge` 对象。

### Bridge API

```javascript
// 打开二级页面，支持回调
RheaBridge.navigate(url, { title?, callback? })

// 打开底部 Modal，支持回调
RheaBridge.openModal({ title, url?, data?, callback? })

// 返回上一页并传数据给 callback
RheaBridge.goBack(data?)

// 关闭当前 Modal
RheaBridge.closeModal()

// 通知下拉刷新完成
RheaBridge.refreshDone()

// 控制 TabBar 显隐
RheaBridge.setTabBarVisible(visible)
```

### 下拉刷新

```javascript
window.addEventListener("rheaRefresh", function () {
  fetchData().then(function () {
    RheaBridge.refreshDone(); // 超时 5s 自动回弹
  });
});
```

### Bridge 就绪事件

```javascript
window.addEventListener("RheaBridgeReady", function () {
  // Bridge 已就绪
});
```

## 开发命令

```bash
npm install               # 安装依赖
npx expo start            # 启动开发服务器
npx expo start --android  # Android 设备调试
npx expo start --web      # Web 模式调试
```

## 构建 APK

```bash
eas build -p android --profile preview
```

## Tab URL 配置

- Earn: `src/screens/EarnScreen.tsx` → `EARN_URL`
- Borrow: `src/screens/BorrowScreen.tsx` → `BORROW_URL`
- Swap: `src/screens/SwapScreen.tsx` → `SWAP_URL`
- My: `src/screens/MyEarnScreen.tsx` → `MY_EARN_URL`

## Tab 图标

图标文件放在 `assets/tab-icons/`，命名规则：

- `{name}.png` — 未选中状态
- `{name}-active.png` — 选中状态
- 建议尺寸 48x48px，PNG 透明背景
