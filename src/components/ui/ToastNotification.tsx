'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  message: string;
  type: ToastType;
}

export default function ToastNotification() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [toast, setToast] = useState<Toast | null>(null);
  const [visible, setVisible] = useState(false);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => setToast(null), 300);
  }, []);

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const info = searchParams.get('info');

    if (success || error || info) {
      if (success) setToast({ message: decodeURIComponent(success), type: 'success' });
      else if (error) setToast({ message: decodeURIComponent(error), type: 'error' });
      else if (info) setToast({ message: decodeURIComponent(info), type: 'info' });

      setVisible(true);

      // Clear search params from URL
      const newUrl = window.location.pathname;
      router.replace(newUrl, { scroll: false });

      // Auto dismiss after 4 seconds
      const timer = setTimeout(dismiss, 4000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router, dismiss]);

  if (!toast) return null;

  const bgColor =
    toast.type === 'success'
      ? 'bg-[#065F46]'
      : toast.type === 'error'
      ? 'bg-[#991B1B]'
      : 'bg-[#1E3A5F]';

  const icon =
    toast.type === 'success'
      ? 'check_circle'
      : toast.type === 'error'
      ? 'error'
      : 'info';

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] flex items-center gap-sm px-md py-sm rounded-lg shadow-lg text-white text-body-md transition-all duration-300 ${bgColor} ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
      role="alert"
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={dismiss}
        className="ml-sm p-0.5 rounded hover:bg-white/20 transition-colors"
        aria-label="Dismiss"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
}
