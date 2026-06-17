'use client';

import { usePathname } from 'next/navigation';

const pageTitles: Record<string, { title: string; description: string }> = {
  '/': { title: 'Overview', description: 'System-wide financial summary' },
  '/plans': { title: 'Contribution Plans', description: 'Manage and monitor all active and upcoming financial contribution cycles.' },
  '/plans/new': { title: 'Create New Plan', description: 'Set up a new contribution plan.' },
  '/payments': { title: 'Payments Log', description: 'Review and allocate incoming member funds.' },
  '/payments/new': { title: 'Record Payment', description: 'Log an incoming member payment.' },
  '/members': { title: 'Members Directory', description: 'Manage registered members, their active plans, and financial standing.' },
  '/members/new': { title: 'Add New Member', description: 'Register a new member.' },
  '/reconciliation': { title: 'Reconciliation Overview', description: 'Real-time status of funds received vs. expected allocations.' },
};

export default function PageHeader() {
  const pathname = usePathname();

  const info = pageTitles[pathname] || { title: 'Page', description: '' };

  return (
    <div className="mb-xl">
      <h2 className="font-headline-lg text-headline-lg text-on-background">{info.title}</h2>
      {info.description && (
        <p className="font-body-md text-body-md text-secondary mt-1">{info.description}</p>
      )}
    </div>
  );
}
