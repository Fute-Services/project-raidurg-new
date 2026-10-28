import { useEffect, useState } from 'react';

// Chrome/Android fires `beforeinstallprompt` when the PWA is installable.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  // iOS Safari
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/**
 * Floating "Install App" button for Chrome/Edge (Android + desktop): triggers the
 * native install prompt, after which the app lands on the home screen and opens
 * standalone. Hidden once already installed.
 *
 * iOS is deliberately not handled here — Safari has no install API, so it gets
 * the Share → Add to Home Screen instructions from IosInstallHint instead.
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('installPromptDismissed') === '1');

  useEffect(() => {
    if (isStandalone()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferredPrompt(null);
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (isStandalone() || dismissed) return null;

  // No deferred event means the browser is not offering an install right now
  // (Safari, or already installed) — show nothing rather than a dead button.
  if (!deferredPrompt) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('installPromptDismissed', '1');
  };

  return (
    <div className="fixed bottom-4 right-4 z-[300] flex flex-col items-end gap-2 select-none">
      <div className="flex items-center gap-2">
        <button
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
          className="w-8 h-8 rounded-full bg-black/50 border border-white/20 text-white/70 text-xs flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors"
        >
          ✕
        </button>
        <button
          onClick={handleInstall}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[rgba(255,206,117,1)] text-[#483E2D] font-bold text-sm shadow-2xl cursor-pointer hover:scale-105 active:scale-95 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Install App
        </button>
      </div>
    </div>
  );
}
