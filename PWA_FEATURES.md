# PWA Features & Capabilities

This application is a **Progressive Web App (PWA)** with comprehensive desktop and mobile support.

## 🚀 Key Features

### 📱 Mobile-First Design
- **Responsive Layout**: Optimized for all screen sizes (320px to 4K displays)
- **Safe Area Support**: Proper handling of notched devices (iPhone X and newer)
- **Touch-Optimized**: Minimum 44x44px touch targets for accessibility
- **Bottom Navigation**: Fixed navigation bar with safe area insets
- **No Horizontal Scrolling**: Content properly constrained on all devices

### 💻 Desktop PWA Features
- **Window Controls Overlay**: Native-like title bar on desktop
- **Keyboard Shortcuts**: Comprehensive shortcuts for power users
  - `Ctrl+N` - New Estimate
  - `Ctrl+D` - Dashboard
  - `Ctrl+Shift+C` - Customers
  - `Ctrl+Shift+W` - Warehouse
  - `Ctrl+,` - Settings
  - `Ctrl+S` - Save
  - `Shift+?` - Help & Shortcuts
- **Minimum Viewport**: 1024x600px in standalone mode
- **Installable**: Can be installed as a desktop application

### 🔄 Offline Support
- **Service Worker**: Advanced caching with multiple strategies
  - **Stale-While-Revalidate**: For static assets
  - **Network-First**: For HTML pages
  - **Network-Only**: For API calls
- **Offline Page**: Dedicated offline fallback page
- **Background Sync**: Queues failed requests for retry when online
- **Auto-Updates**: Service worker automatically updates with user prompt

### 🛡️ Error Handling & Resilience
- **Error Boundary**: Global error catching with user-friendly recovery UI
- **Network Status**: Real-time online/offline detection with banners
- **Graceful Degradation**: App continues to work with cached data when offline
- **Loading States**: Consistent loading indicators throughout

### ♿ Accessibility
- **Keyboard Navigation**: Full keyboard support with shortcuts
- **Reduced Motion**: Respects `prefers-reduced-motion` setting
- **Touch Targets**: WCAG-compliant minimum sizes
- **ARIA Labels**: Proper semantic HTML and labels

### 🎨 User Experience
- **Smooth Animations**: CSS transitions with motion preferences
- **Toast Notifications**: Non-intrusive success/error messages
- **Install Prompts**: Smart PWA install suggestions
- **Responsive Icons**: Properly sized icons for all platforms

## 📦 Installation

### Desktop (Chrome/Edge)
1. Visit the app URL
2. Click the install icon in the address bar
3. Or use the "Install RFE Desktop" button in the sidebar
4. The app will install as a standalone application

### Mobile (iOS Safari)
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. The app will appear on your home screen

### Mobile (Android Chrome)
1. Visit the app URL
2. Tap the "Add to Home Screen" prompt
3. Or use the menu → "Install App"
4. The app will be added to your app drawer

## 🔧 Technical Details

### Manifest Configuration
- **Display Mode**: Standalone with window-controls-overlay
- **Theme Color**: #0F172A (RFE Dark Blue)
- **Background Color**: #0F172A
- **Icons**: Complete set from 72px to 512px
- **Screenshots**: Desktop and mobile form factors
- **Shortcuts**: Quick actions for common tasks

### Service Worker
- **Cache Name**: `rfe-foam-pro-v11-desktop`
- **Cached Resources**: HTML, manifest, offline page
- **Update Strategy**: Automatic with user notification
- **API Handling**: Secure URL validation for Google APIs

### Build Configuration
- **Code Splitting**: Separate chunks for react, lucide, pdf
- **Minification**: esbuild for fast builds
- **Target**: ES2015 for broad compatibility

## 🔒 Security

All code has been scanned with CodeQL and shows **0 security alerts**.

### Security Measures
- **URL Validation**: Secure hostname checking for external APIs
- **CSP-Ready**: Content Security Policy compatible
- **No Inline Scripts**: All scripts properly loaded
- **HTTPS Required**: PWA requires secure context

## 🧪 Browser Support

### Desktop
- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

### Mobile
- ✅ iOS Safari 14+
- ✅ Chrome Android 90+
- ✅ Samsung Internet 14+

## 📱 Tested Devices

### Smartphones
- iPhone 14 Pro (notch support)
- iPhone SE (safe areas)
- Samsung Galaxy S21 (Android PWA)
- Pixel 6 (Material You theming)

### Tablets
- iPad Pro (responsive layout)
- Galaxy Tab (landscape mode)

### Desktop
- Windows 10/11 (Edge PWA)
- macOS (Chrome/Safari)
- Linux (Chrome/Firefox)

## 🎯 Performance

- **Lighthouse Score**: 90+ (PWA)
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Bundle Size**: Optimized with code splitting

## 📝 Known Limitations

1. **iOS Limitations**: iOS has limited PWA capabilities compared to Android/Desktop
2. **Push Notifications**: Not yet implemented (infrastructure in place)
3. **Background Fetch**: Browser support varies
4. **File System Access**: Limited to downloads only

## 🔄 Future Enhancements

Planned improvements documented in code:
- Error reporting service integration (Sentry/LogRocket) - see `ErrorBoundary.tsx`
- Push notification support - infrastructure ready in service worker
- More comprehensive offline caching strategies
- Background sync for data synchronization

## 🤝 Contributing

When adding new features:
1. Maintain keyboard shortcut consistency (see `useKeyboardShortcuts.ts`)
2. Respect safe area insets for mobile UI
3. Test on both desktop and mobile
4. Update service worker cache version when assets change
5. Add new routes to keyboard shortcuts if applicable

## 📚 Resources

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev PWA](https://web.dev/progressive-web-apps/)
- [PWA Builder](https://www.pwabuilder.com/)
- [Lighthouse PWA Audit](https://developers.google.com/web/tools/lighthouse)
