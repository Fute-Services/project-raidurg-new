import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['K_Raheja_Corp 1.png', 'apple-touch-icon.png', 'favicon-64x64.png'],
      manifest: {
        name: 'CIGNUS by K Raheja Corp',
        short_name: 'CIGNUS',
        description: 'CIGNUS — premium commercial project by K Raheja Corp. Explore the project, amenities, gallery, walkthroughs and VR views.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the app shell + the brochures (~27 MB). The service worker is
        // registered for every visitor (it has to be, or the browser never
        // treats the site as installable), so the precache is what an anonymous
        // visitor on the login screen downloads — keeping it small is what makes
        // installing near-instant.
        //
        // The rest — images (~91 MB), VR panoramas (~69 MB) and videos
        // (~543 MB) — is cached at runtime instead (see runtimeCaching below)
        // and pulled in the background by src/pwa/prefetchMedia.ts, which only
        // runs for a signed-in session.
        globPatterns: [
          '**/*.{js,mjs,wasm,css,html,ico,svg,woff,woff2}',
          // pdf.js runtime data: CMaps (.bcmap), the standard fonts (.pfb for
          // the Foxit set, .ttf for Liberation Sans) and the colour profile
          // (~3.6 MB). Without these, a PDF that doesn't embed its fonts, or
          // uses CJK/encoded text, fails to render once offline. The .ttf half
          // of the standard font set was previously left out.
          '**/*.{bcmap,pfb,ttf,icc}',
          // The brochures (~20 MB). These are core content and must be readable
          // the moment the app is installed, so they belong in the precache
          // rather than the background prefetch — relying on the prefetch meant
          // opening the brochure offline before it had finished showed
          // "Failed to load the brochure".
          'pdf/*.pdf',
          // Install/launch icons — needed for the home-screen icon and splash
          // to work offline, and small enough to belong in the shell.
          'pwa-*.png',
          'apple-touch-icon.png',
          'favicon-*.png',
        ],
        globIgnores: ['**/node_modules/**/*'],
        // Largest non-video asset is ~21 MB (PDF brochures / VR panoramas)
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
        // SPA offline navigation: serve index.html for all route navigations
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Walkthrough / drone / construction videos — cache on first use,
            // serve byte-range requests from cache so <video> seeking works offline
            urlPattern: /\.(?:mp4|webm)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'video-cache',
              rangeRequests: true,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 40 },
            },
          },
          {
            // Google Fonts stylesheets
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            // Google Fonts webfont files
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            // Safety net: any same-origin image/PDF that slipped past precache
            urlPattern: /\.(?:png|jpg|jpeg|webp|svg|gif|pdf)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'media-cache',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 500 },
            },
          },
        ],
      },
    }),
  ],
})
