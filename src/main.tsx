import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { schedulePrefetch } from './pwa/prefetchMedia'

// The service worker is registered for every visitor, signed in or not. It has
// to be: a browser only treats the site as installable ("Add to Home Screen",
// opens standalone, works offline) once a service worker is already registered
// at page load. Gating registration behind the login screen made the app
// permanently non-installable, because the install prompt never fires on the
// first load and the login page had no worker at all.
//
// What registration alone downloads is just the app shell (JS/CSS/icons/PDFs) —
// the ~800 MB of video is NOT precached (see workbox config in vite.config.ts),
// so an anonymous visitor still pulls next to nothing. The actual content stays
// behind RequireAuth either way.
const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return
    // Re-check for updates every 60s while open, and on every return to the
    // app, so installed PWAs pick up new deploys instead of serving a stale
    // cached version forever.
    const check = () => {
      if (navigator.onLine) registration.update().catch(() => { })
    }
    setInterval(check, 60_000)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check()
    })
  },
})
void updateSW

// The heavy part — ~770 MB of media — is still only fetched for a signed-in
// session. Sessions expire after 20 minutes, so this runs again on each fresh
// sign-in: a run cut short by going offline gets another chance, and
// already-cached files are skipped, so re-running is cheap.
let mediaRunning = false

function startMediaDownload() {
  if (mediaRunning) return
  mediaRunning = true

  // With ~770 MB cached, the browser is otherwise free to evict the whole
  // origin under disk pressure, which silently breaks offline mode. Chrome
  // grants this without a prompt for installed PWAs; elsewhere it's a no-op.
  navigator.storage?.persist?.().catch(() => { })

  // Warm the offline media cache in the background
  schedulePrefetch(() => { mediaRunning = false })
}

startMediaDownload()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
