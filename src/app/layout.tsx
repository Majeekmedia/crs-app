import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import DashboardShell from '@/components/layout/DashboardShell';
import { MobileMenuProvider } from '@/lib/mobile-menu-context';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Precision Ledger - CRS',
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
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-background font-body-md antialiased min-h-screen">
        <MobileMenuProvider>
          <DashboardShell>{children}</DashboardShell>
        </MobileMenuProvider>
      </body>
    </html>
  );
}
