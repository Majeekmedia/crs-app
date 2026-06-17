'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import TopNav from '@/components/layout/TopNav';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/auth');

  // Auth pages: render children without sidebar/topnav
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Protected pages: render full app shell
  return (
    <>
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <TopNav />
        <main className="flex-1 p-margin-mobile md:p-margin-desktop overflow-y-auto max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </>
  );
}
