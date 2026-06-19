import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import DashboardShell from '@/components/layout/DashboardShell';
import { MobileMenuProvider } from '@/lib/mobile-menu-context';
import { Suspense } from 'react';
import ToastNotification from '@/components/ui/ToastNotification';
import PwaRegister from '@/components/PwaRegister';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Nengi's Precision Ledger - CRS",
  description: 'Contribution Reconciliation System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#14213d" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Precision Ledger" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
      </head>
      <body className="bg-background text-on-background font-body-md antialiased min-h-screen">
        <MobileMenuProvider>
          <DashboardShell>{children}</DashboardShell>
        </MobileMenuProvider>
        <Suspense fallback={null}>
          <ToastNotification />
        </Suspense>
        <PwaRegister />
      </body>
    </html>
  );
}
