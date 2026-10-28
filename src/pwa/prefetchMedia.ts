/**
 * Background media prefetcher.
 *
 * The service worker precaches the app shell and the brochures (~27 MB) so the
 * app is installable fast and its core content is readable immediately. The
 * remaining weight is fetched here instead, warming the runtime caches so the
 * whole presentation works offline without the user having visited every page:
 *
 *   images  ~91 MB   →  media-cache
 *   VR      ~69 MB   →  media-cache
 *   videos ~543 MB   →  video-cache
 *
 * Downloads happen sequentially (one at a time) after the page has loaded and
 * the service worker controls the page, and are skipped when the browser
 * reports Data Saver mode or the device is offline. Called only for a signed-in
 * session (see src/main.tsx).
 */

// Hashed build URLs of every bundled image and video
const bundledUrls = Object.values(
  import.meta.glob('../assets/**/*.{png,jpg,jpeg,webp,mp4}', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
) as string[]

// Assets served from /public keep their literal paths, so they can't be
// discovered by import.meta.glob and have to be listed. Keep in sync with
// public/vr. (The PDFs under public/pdf are precached, so they are not listed
// here — the loop below would skip them as already-cached anyway.)
const publicUrls = [
  '/vr/top.webp',
  '/vr/reception.webp',
  '/vr/liftlobby.webp',
  '/vr/cafeteria.webp',
  '/vr/dropoff.webp',
  '/vr/dropoff_left.webp',
  '/vr/dropoff_right.webp',
  '/vr/arrow.png',
  '/vr/arrow1.png',
  '/vr/arrow2.png',
  '/vr/arrowfinal.png',
]

// Lightest first: the pages a client is most likely to open early are usable
// long before the ~543 MB of video finishes.
const prefetchUrls = [
  ...publicUrls,
  ...bundledUrls.filter((u) => !u.endsWith('.mp4')),
  ...bundledUrls.filter((u) => u.endsWith('.mp4')),
]

async function warmMediaCache(): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  if (conn?.saveData) return

  // Wait until a service worker controls the page so fetches go through
  // the CacheFirst routes and get stored in the cache.
  await navigator.serviceWorker.ready
  if (!navigator.serviceWorker.controller) {
    await new Promise<void>((resolve) => {
      navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true })
      // First-ever load: SW activates but doesn't control until next
      // navigation. Give it a moment, then proceed anyway — the SW still
      // intercepts nothing in that case, so retry on next visit.
      setTimeout(resolve, 4000)
    })
  }

  for (const url of prefetchUrls) {
    if (!navigator.onLine) return
    try {
      // Already cached on a previous visit? Skip — don't re-download it.
      if ('caches' in window) {
        const cached = await caches.match(url, { ignoreSearch: true, ignoreVary: true })
        if (cached) continue
      }
      // Full (non-range) request → 200 response → cached by the SW
      await fetch(url, { cache: 'no-store' })
    } catch {
      // Offline / aborted — stop; will retry on next load
      return
    }
  }
}

/**
 * Kick off prefetching once the app is idle after load.
 * `onDone` fires when the run finishes or gives up, so the caller can allow a
 * later sign-in to start a fresh run.
 */
export function schedulePrefetch(onDone?: () => void): void {
  const start = () => {
    const idle =
      'requestIdleCallback' in window
        ? (cb: () => void) => requestIdleCallback(cb, { timeout: 10_000 })
        : (cb: () => void) => setTimeout(cb, 3000)
    idle(() => {
      warmMediaCache().finally(() => onDone?.())
    })
  }
  if (document.readyState === 'complete') start()
  else window.addEventListener('load', start, { once: true })
}
