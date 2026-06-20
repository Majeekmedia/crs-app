'use client';

import { useEffect, useState } from 'react';

export default function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<'ios' | 'android' | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Register service worker immediately (no load event wrapper — component mounts after load)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW registration failed — app works without it
      });
    }

    // Already installed — hide banner permanently
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // iOS detection
    const ua = navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua)
      || (navigator.userAgent.includes('Mac') && 'ontouchend' in document);

    if (isIos) {
      // iOS: show banner immediately with instructions (no beforeinstallprompt on iOS)
      const dismissedAt = localStorage.getItem('pwa-dismissed');
      if (!dismissedAt || Date.now() - parseInt(dismissedAt, 10) > 3 * 24 * 60 * 60 * 1000) {
        setPlatform('ios');
        setShowBanner(true);
      }
      return;
    }

    // Android / desktop Chrome: wait for beforeinstallprompt before showing banner
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissedAt = localStorage.getItem('pwa-dismissed');
      if (!dismissedAt || Date.now() - parseInt(dismissedAt, 10) > 3 * 24 * 60 * 60 * 1000) {
        setPlatform('android');
        setShowBanner(true);
      }
    };

    const handleInstalled = () => {
      setShowBanner(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const onInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const onDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-dismissed', Date.now().toString());
  };

  if (!showBanner || !platform) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:bottom-4 md:max-w-sm">
      <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-neutral-200 p-5 relative overflow-hidden">
        {/* Accent bar */}
        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary rounded-l-2xl" />

        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1.5 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100 transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-neutral-900">Install Precision Ledger</h4>
              <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">App Experience</p>
            </div>
          </div>

          {platform === 'android' ? (
            <div className="space-y-3">
              <p className="text-sm text-neutral-600 leading-relaxed">
                Add to your home screen for faster access and a native app experience.
              </p>
              <button
                onClick={onInstall}
                className="w-full py-3 bg-primary text-white rounded-xl text-sm font-bold tracking-wide hover:bg-primary/90 transition-colors shadow-sm"
              >
                Install Now
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-neutral-600 leading-relaxed font-medium">
                Install this app on your iPhone for the best experience:
              </p>
              <div className="bg-neutral-50 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center gap-3 text-sm font-semibold text-neutral-700">
                  <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-sm text-primary">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </div>
                  <span>Tap the <span className="text-primary">Share</span> icon</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-semibold text-neutral-700">
                  <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-sm text-primary">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span>Select <span className="text-primary">Add to Home Screen</span></span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onDismiss}
            className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-center hover:text-neutral-700 transition-colors"
          >
            Not now, maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
