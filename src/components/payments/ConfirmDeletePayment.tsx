'use client';

import { useRouter } from 'next/navigation';
import { startTransition } from 'react';
import { deletePayment } from '@/lib/server-actions';

export default function ConfirmDeletePayment({ paymentId }: { paymentId: string }) {
  const router = useRouter();

  async function handleDelete() {
    const confirmed = window.confirm(
      'Are you sure you want to delete this payment?\n\n' +
      'This action cannot be undone. Any allocations linked to this payment will also be removed.'
    );

    if (!confirmed) return;

    try {
      await deletePayment(paymentId);
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete payment');
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      title="Delete payment"
      className="text-secondary hover:text-error p-1 rounded hover:bg-surface-variant transition-colors"
    >
      <span className="material-symbols-outlined text-[18px]">delete</span>
    </button>
  );
}
