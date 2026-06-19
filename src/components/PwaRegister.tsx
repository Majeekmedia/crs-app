'use client';

import { useEffect, useState } from 'react';

export default function PwaRegister() {
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Register service worker
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Service worker registration failed - app still works without it
      });
    });

    // Capture beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    // Detect when app was already installed
    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    // Check if already in standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    (installPrompt as any).prompt();
    const result = await (installPrompt as any).userChoice;
    if (result.outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  // Don't render anything if already installed or no prompt available
  if (installed || !installPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:max-w-sm z-50 bg-primary text-on-primary rounded-xl shadow-lg p-md flex items-center gap-sm animate-slide-up">
      <div className="flex-1">
        <p className="text-body-sm font-medium">Install App</p>
        <p className="text-body-sm opacity-80">Add to home screen for quick access</p>
      </div>
      <button
        onClick={handleInstall}
        className="bg-white text-primary px-md py-sm rounded-lg text-body-sm font-medium hover:bg-surface-container-lowest transition-colors whitespace-nowrap"
      >
        Install
      </button>
      <button
        onClick={() => setInstallPrompt(null)}
        className="text-on-primary opacity-70 hover:opacity-100 p-1"
        aria-label="Dismiss"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
}
