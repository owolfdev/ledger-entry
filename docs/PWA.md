## Progressive Web App (PWA)

This app is configured to work as a PWA in production builds. It includes a Web App Manifest, service worker with safe caching, an offline fallback page, and middleware exclusions for SW assets.

### How to test locally

1. Build and start production server:
   ```bash
   npm run build && npm start
   ```
2. Open http://localhost:3000
3. In Chrome DevTools > Application:
   - Verify Manifest is valid and icons resolve
   - Check Service Workers → should be activated with scope '/'

### Icons

- Expected files:
  - `public/icons/icon-192.png`
  - `public/icons/icon-512.png`
- You can generate from an SVG or large PNG using `pwa-asset-generator`:
  ```bash
  npx pwa-asset-generator ./path/to/logo.svg ./public/icons \
    -i ./public/manifest.webmanifest -a --opaque false --background "transparent" \
    --manifest --favicon
  ```
  Or using `sharp` in a quick Node script.

### Caching strategy (high level)

- Precache build assets (handled by next-pwa/Workbox)
- Runtime caching:
  - Google Fonts: CacheFirst, 1 year
  - Remote images (GitHub avatars): StaleWhileRevalidate, 30 days
  - Same-origin images/assets: StaleWhileRevalidate, 30 days
  - Same-origin API GETs: NetworkFirst, 10 minutes
  - Exclusions: `/api/auth/**`, `/api/github/**`, token endpoints, POST/PUT/PATCH/DELETE

### Offline behavior

- Navigation requests fall back to `/offline` when the network is unavailable
- Auth and GitHub sync will not function offline

### Middleware exclusions

`middleware.ts` excludes service worker files, manifest, and icons from interception to avoid breaking SW scope.

### Dev tips

- PWA is disabled in development to avoid cache churn. Always test with a production build.
- To reset: Application → Service Workers → Unregister; then Application → Clear storage → Clear site data.
