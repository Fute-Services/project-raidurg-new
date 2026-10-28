import { useEffect, useState } from 'react';

/**
 * iPad/iPhone-only install hint.
 *
 * Safari has no `beforeinstallprompt` event, so no site can show a working
 * "Install" button on iOS — including third-party browsers there, which all
 * run on WebKit. The only route is Share → Add to Home Screen, so all we can
 * do is point at it.
 *
 * Deliberately narrow: iOS only, only while the app is not already installed,
 * and dismissable for good. Desktop and Android show nothing (Chrome puts its
 * own install icon in the address bar).
 */

const DISMISS_KEY = 'iosInstallHintDismissed';

const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  // iPadOS 13+ identifies itself as a Mac, but a Mac has no touch points
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export default function IosInstallHint() {
  const [visible, setVisible] = useState(false);
  // Offline caching needs a service worker, which browsers only allow in a
  // secure context. On a plain http:// LAN address nothing gets cached, and
  // the app would look installed while being useless without a network.
  const [insecure, setInsecure] = useState(false);

  useEffect(() => {
    if (!isIos() || isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === '1') return;
    setInsecure(!window.isSecureContext || !('serviceWorker' in navigator));
    setVisible(true);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[300] w-[min(92vw,420px)] select-none">
      <div className="rounded-2xl bg-[#0b2540]/95 backdrop-blur-md border border-white/15 shadow-2xl px-4 py-3 text-white">
        {insecure ? (
          <p className="text-[13px] leading-relaxed">
            <span className="font-semibold text-amber-300">Offline mode unavailable.</span>{' '}
            This page is not being served over <span className="font-semibold">https</span>, so
            nothing can be saved for offline use. Open the deployed https link instead.
          </p>
        ) : (
          <p className="text-[13px] leading-relaxed">
            <span className="font-semibold">Install for offline use:</span> tap{' '}
            <span className="font-semibold">Share</span> in Safari, scroll down, then choose{' '}
            <span className="font-semibold">Add to Home Screen</span>.
          </p>
        )}
        <button
          onClick={dismiss}
          className="mt-2 text-[11px] text-white/55 underline underline-offset-2 cursor-pointer"
        >
          Don't show again
        </button>
      </div>
    </div>
  );
}
