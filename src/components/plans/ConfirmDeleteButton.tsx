'use client';

import { useRouter } from 'next/navigation';
import { startTransition } from 'react';
import { deletePlan } from '@/lib/server-actions';

interface ConfirmDeleteButtonProps {
  planId: string;
  label?: string;
  className?: string;
  iconOnly?: boolean;
}

export default function ConfirmDeleteButton({
  planId,
  label = 'Delete',
  className = '',
  iconOnly = false,
}: ConfirmDeleteButtonProps) {
  const router = useRouter();

  async function handleDelete() {
    const confirmed = window.confirm(
      'Are you sure you want to delete this plan?\n\n' +
      'This action cannot be undone. All associated members, payments, allocations, and payouts will also be removed.'
    );

    if (!confirmed) return;

    try {
      await deletePlan(planId);
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete plan');
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      title="Delete plan"
      className={`text-secondary hover:text-error p-[4px] rounded hover:bg-surface-variant transition-colors ${className}`}
    >
      {iconOnly ? (
        <span className="material-symbols-outlined text-[18px]">delete</span>
      ) : (
        <>
          <span className="material-symbols-outlined text-[18px] align-text-bottom">delete</span>
          <span className="ml-1">{label}</span>
        </>
      )}
    </button>
  );
}
