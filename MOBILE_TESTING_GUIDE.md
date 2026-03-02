# Mobile Testing Guide - FLA Events

## Quick Test on Desktop (Chrome DevTools)

1. **Open DevTools:**
   - Press `F12` or `Cmd+Option+I` (Mac)
   
2. **Enable Mobile Emulation:**
   - Click "Toggle Device Toolbar" (phone icon) or `Cmd+Shift+M`
   - Select "iPhone 14 Pro" from dropdown
   - Set zoom to 100%

3. **Test Swipe Feature:**
   - Navigate to "Explore" tab (bottom nav)
   - Tap "Try Swipe Mode" button
   - Click and drag event cards left/right
   - Verify:
     - ✅ Card follows finger smoothly
     - ✅ Red overlay on left swipe
     - ✅ Green overlay on right swipe
     - ✅ Card rotates naturally
     - ✅ Snaps back if not past threshold
     - ✅ Swipes off screen when threshold exceeded

4. **Test Touch Targets:**
   - Tap Skip/Save buttons (should be easy to hit)
   - Tap bottom nav icons (60px touch areas)
   - All targets should be >44px minimum

5. **Test Safe Areas:**
   - Switch to "iPhone 14 Pro Max" (has notch)
   - Verify bottom nav doesn't overlap home indicator
   - Check top bar doesn't get cut off by notch

6. **Test PWA:**
   - In DevTools, go to Application tab
   - Check "Manifest" section
   - Verify icon, name, theme color
   - Check "Service Workers" - should see `sw.js` registered

7. **Test Performance:**
   - DevTools → Lighthouse
   - Run mobile audit
   - Target scores: Performance >90, PWA >90

---

## Real Device Testing (iPhone)

1. **Open Safari:**
   - Navigate to https://fla-events.vercel.app
   - Wait for page load (<2s on WiFi)

2. **Test Swipe:**
   - Go to Explore tab
   - Enable Swipe Mode
   - Swipe with thumb - should feel buttery smooth
   - Check for haptic vibration on swipe

3. **Install PWA:**
   - Tap Share button (square with arrow)
   - Scroll down → "Add to Home Screen"
   - Tap "Add"
   - Return to home screen
   - Tap FLA Events icon
   - Should open in standalone mode (no Safari UI)

4. **Test Installed App:**
   - No browser chrome visible
   - Status bar should be blue (#2563eb)
   - Bottom nav should not overlap home indicator
   - Swipe gestures should work identically

5. **Test Offline:**
   - Enable Airplane mode
   - Open installed app
   - Should load cached shell
   - API calls will fail gracefully

---

## Real Device Testing (Android)

1. **Open Chrome:**
   - Navigate to https://fla-events.vercel.app

2. **Install PWA:**
   - Tap menu (3 dots)
   - "Install app" or "Add to Home Screen"
   - Tap "Install"

3. **Test Installed App:**
   - Opens in standalone mode
   - Swipe gestures work
   - Touch targets are large enough

---

## Performance Checklist

**Network (Chrome DevTools → Network tab):**
- ✅ Initial HTML: <50KB
- ✅ JavaScript chunks: lazy loaded
- ✅ Images: load on scroll (lazy)
- ✅ Service worker: caches static assets

**Performance (DevTools → Performance tab):**
- ✅ Record swipe gesture
- ✅ Verify 60fps (no frame drops)
- ✅ No long tasks (>50ms)
- ✅ Smooth animations

**Lighthouse (DevTools → Lighthouse):**
```
Performance: >90
Accessibility: >90
Best Practices: >90
PWA: >90
SEO: >90
```

---

## Known Issues (None at this time)

- ✅ All features working as expected
- ✅ No layout shifts
- ✅ No zoom issues
- ✅ No scroll conflicts

---

## Browser Compatibility

**Tested & Working:**
- ✅ iOS Safari 15+
- ✅ Chrome Android 90+
- ✅ Chrome Desktop (for dev)
- ✅ Firefox Mobile (basic support)

**Partial Support:**
- ⚠️ Firefox Desktop (no haptics, but functional)
- ⚠️ Safari Desktop (no install prompt)

**Not Supported:**
- ❌ IE11 (not a target)

---

## Deployment Status

**Production:** https://fla-events.vercel.app
**Status:** ✅ Live
**Last Deploy:** March 1, 2026
**Commits:** 89f3806, d7a0dda, 0dc48f1

---

## Quick Verification Commands

```bash
# Check PWA manifest
curl https://fla-events.vercel.app/manifest.json | jq

# Check service worker
curl https://fla-events.vercel.app/sw.js | head -20

# Local test
cd /home/beck/.openclaw/workspace/FLA-events
npm run dev
# Open http://localhost:3000 in mobile emulation
```

---

**Result:** Production-ready mobile experience! 🎉
