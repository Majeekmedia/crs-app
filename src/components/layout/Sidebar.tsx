'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useMobileMenu } from '@/lib/mobile-menu-context';
import { signOut } from '@/lib/server-actions';
import { createBrowserClient } from '@supabase/ssr';

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
  const [userName, setUserName] = useState('User');
  const [userInitial, setUserInitial] = useState('U');

  useEffect(() => {
    async function loadUser() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
        setUserName(name);
        setUserInitial(name.charAt(0).toUpperCase());
      }
    }
    loadUser();
  }, []);

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
          <div className="flex items-center gap-sm">
            <Image
              src="/icons/nengilogo_dark.png"
              alt="Nengi's Precision Ledger"
              width={36}
              height={36}
              className="block dark:hidden"
            />
            <Image
              src="/icons/nengilogo_light.png"
              alt="Nengi's Precision Ledger"
              width={36}
              height={36}
              className="hidden dark:block"
            />
            <div>
              <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
                Nengi's Precision Ledger
              </h1>
              <p className="text-secondary text-body-md mt-xs">Financial Admin</p>
            </div>
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
          <div className="flex items-center gap-sm mb-xs">
            <Image
              src="/icons/nengilogo_dark.png"
              alt="Nengi's Precision Ledger"
              width={40}
              height={40}
              className="block dark:hidden"
            />
            <Image
              src="/icons/nengilogo_light.png"
              alt="Nengi's Precision Ledger"
              width={40}
              height={40}
              className="hidden dark:block"
            />
            <div>
              <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
                Nengi's Precision Ledger
              </h1>
              <p className="text-secondary text-body-md mt-xs">Financial Admin</p>
            </div>
          </div>
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
                {userInitial}
              </div>
              <div>
                <p className="text-body-md font-medium text-on-surface">{userName}</p>
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
