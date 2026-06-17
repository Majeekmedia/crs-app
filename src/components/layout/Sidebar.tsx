'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMobileMenu } from '@/lib/mobile-menu-context';
import { signOut } from '@/lib/server-actions';

const navItems = [
  { href: '/', label: 'Dashboard', icon: 'dashboard' },
  { href: '/plans', label: 'Contribution Plans', icon: 'event_note' },
  { href: '/payments', label: 'Payments', icon: 'payments' },
  { href: '/members', label: 'Members', icon: 'group' },
  { href: '/reconciliation', label: 'Reconciliation', icon: 'account_balance_wallet' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useMobileMenu();

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <nav
        className={`
          fixed left-0 top-0 z-50 h-screen w-64
          bg-surface border-r border-outline-variant
          flex flex-col py-lg px-md
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:flex
        `}
      >
        {/* Close button (mobile only) */}
        <div className="flex items-center justify-between mb-xl px-sm md:hidden">
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
              Precision Ledger
            </h1>
            <p className="text-secondary text-body-md mt-xs">Financial Admin</p>
          </div>
          <button
            onClick={close}
            className="w-10 h-10 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container-low transition-all duration-200"
            aria-label="Close navigation menu"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Logo / Brand (desktop) */}
        <div className="mb-xl px-sm hidden md:block">
          <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
            Precision Ledger
          </h1>
          <p className="text-secondary text-body-md mt-xs">Financial Admin</p>
        </div>

        {/* Navigation Links */}
        <ul className="flex flex-col gap-sm flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={close}
                  className={`flex items-center gap-md px-md py-sm rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'text-primary font-bold border-r-4 border-primary bg-surface-container-low'
                      : 'text-secondary hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                    {item.icon}
                  </span>
                  <span className="text-body-md">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* User Profile */}
        <div className="mt-auto pt-lg border-t border-outline-variant">
          <div className="flex items-center justify-between gap-md px-sm">
            <div className="flex items-center gap-md">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold">
                A
              </div>
              <div>
                <p className="text-body-md font-medium text-on-surface">Admin User</p>
                <p className="text-label-caps text-secondary">System Admin</p>
              </div>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="text-secondary hover:text-error p-1.5 rounded-lg hover:bg-surface-variant transition-colors"
                title="Sign out"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            </form>
          </div>
        </div>
      </nav>
    </>
  );
}
