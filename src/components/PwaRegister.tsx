'use client';

import { useEffect, useState, useRef } from 'react';

export default function PwaRegister() {
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const dismissed = useRef(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Register service worker (NOT wrapped in load event — component mounts after load already fired)
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration failed - app still works without it
    });

    // If already in standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    // Show banner immediately on PWA-capable browsers — appears on ALL pages including login
    if (!dismissed.current) {
      setShowBanner(true);
    }

    // Capture beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    // Detect when app was installed
    const handleInstalled = () => {
      setInstalled(true);
      setShowBanner(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      // beforeinstallprompt event captured — use native install prompt
      (installPrompt as any).prompt();
      const result = await (installPrompt as any).userChoice;
      if (result.outcome === 'accepted') {
        setShowBanner(false);
      }
    } else {
      // beforeinstallprompt not yet fired — show quick guidance hint
      setShowHint(true);
      setTimeout(() => setShowHint(false), 5000);
    }
  };

  const handleDismiss = () => {
    dismissed.current = true;
    setShowBanner(false);
  };

  // Don't render anything if already installed or banner hidden
  if (installed || !showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:max-w-sm z-50 bg-primary text-on-primary rounded-xl shadow-lg p-md flex items-start gap-sm animate-slide-up">
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-medium">Install App</p>
        <p className="text-body-sm opacity-80">Install as app for offline access</p>
        {showHint && (
          <p className="text-body-xs opacity-90 mt-1 leading-tight">
            Opening browser menu → <strong>Install app</strong> adds it to your app list
          </p>
        )}
      </div>
      <button
        onClick={handleInstall}
        className="bg-white text-primary px-md py-sm rounded-lg text-body-sm font-medium hover:bg-surface-container-lowest transition-colors whitespace-nowrap shrink-0 mt-0.5"
      >
        Install
      </button>
      <button
        onClick={handleDismiss}
        className="text-on-primary opacity-70 hover:opacity-100 p-1 shrink-0 mt-0.5"
        aria-label="Dismiss"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
}
