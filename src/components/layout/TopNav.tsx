'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useMobileMenu } from '@/lib/mobile-menu-context';

const pageTitles: Record<string, string> = {
  '/': 'Overview',
  '/plans': 'Contribution Plans',
  '/payments': 'Payments Log',
  '/members': 'Members Directory',
  '/reconciliation': 'Reconciliation Overview',
};

const pageDescriptions: Record<string, string> = {
  '/': 'System-wide financial summary',
  '/plans': 'Manage and monitor all active and upcoming financial contribution cycles.',
  '/payments': 'Review and allocate incoming member funds.',
  '/members': 'Manage registered members, their active plans, and financial standing.',
  '/reconciliation': 'Real-time status of funds received vs. expected allocations.',
};

function Dropdown({
  trigger,
  children,
  align = 'right',
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container-low transition-all duration-200 relative"
      >
        {trigger}
      </button>
      {open && (
        <div
          className={`absolute top-full mt-sm ${align === 'right' ? 'right-0' : 'left-0'} w-72 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg z-50 p-md`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default function TopNav() {
  const pathname = usePathname();
  const { toggle } = useMobileMenu();

  // Find the matching base path
  const basePath = Object.keys(pageTitles).find((key) =>
    pathname === key || pathname.startsWith(key + '/')
  );

  return (
    <header className="bg-surface border-b border-outline-variant sticky top-0 z-40 transition-all duration-200">
      <div className="flex items-center justify-between h-16 px-margin-mobile md:px-margin-desktop max-w-[1600px] mx-auto">
        {/* Left: Hamburger + Search */}
        <div className="flex items-center gap-md flex-1 max-w-md">
          {/* Mobile menu toggle */}
          <button
            onClick={toggle}
            className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container-low transition-all duration-200"
            aria-label="Toggle navigation menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

          {/* Search Bar */}
          <div className="relative w-full group">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors text-[20px]">
              search
            </span>
            <input
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-md py-sm pl-xl pr-sm text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-secondary"
              placeholder="Search..."
              type="text"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-md">
          <Dropdown
            trigger={
              <>
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error"></span>
              </>
            }
          >
            <div className="text-center py-md">
              <span className="material-symbols-outlined text-[32px] text-secondary">notifications_off</span>
              <p className="text-body-md text-on-surface font-medium mt-sm">No new notifications</p>
              <p className="text-body-md text-secondary mt-xs">You&apos;re all caught up.</p>
            </div>
          </Dropdown>

          <Dropdown
            trigger={
              <span className="material-symbols-outlined">settings</span>
            }
          >
            <div className="text-center py-md">
              <span className="material-symbols-outlined text-[32px] text-secondary">construction</span>
              <p className="text-body-md text-on-surface font-medium mt-sm">Settings</p>
              <p className="text-body-md text-secondary mt-xs">Coming soon in a future update.</p>
            </div>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
