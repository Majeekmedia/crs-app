'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCurrency } from '@/lib/utils';

interface PlanOption {
  plan_id: string;
  plan_name: string;
  contribution_amount: number;
  outstanding: number;
}

interface AllocationModalProps {
  paymentId: string;
  memberId: string;
  memberName: string;
  amount: number;
  onClose: () => void;
  onAllocated: () => void;
}

export default function AllocationModal({
  paymentId,
  memberId,
  memberName,
  amount,
  onClose,
  onAllocated,
}: AllocationModalProps) {
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalAllocated = Object.values(allocations).reduce((sum, v) => sum + (v || 0), 0);
  const remaining = amount - totalAllocated;

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch(`/api/member-outstanding?memberId=${memberId}`);
        const data = await res.json();
        setPlans(data);

        // Auto-suggest: allocate to oldest plan first
        const suggested: Record<string, number> = {};
        let remainingAmount = amount;

        for (const plan of data) {
          if (remainingAmount <= 0) break;
          const alloc = Math.min(remainingAmount, plan.outstanding);
          if (alloc > 0) {
            suggested[plan.plan_id] = alloc;
            remainingAmount -= alloc;
          }
        }
        setAllocations(suggested);
      } catch {
        setError('Failed to load member plans');
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, [memberId, amount]);

  const handleAllocationChange = useCallback(
    (planId: string, value: number) => {
      setAllocations((prev) => ({ ...prev, [planId]: value }));
    },
    []
  );

  async function handleConfirm() {
    setSaving(true);
    setError(null);

    try {
      // Save allocations via server action API
      const res = await fetch('/api/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          allocations: Object.entries(allocations)
            .filter(([, v]) => v > 0)
            .map(([planId, amountAllocated]) => ({ plan_id: planId, amount_allocated: amountAllocated })),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Allocation failed');
      }

      onAllocated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save allocations');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-on-background/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant w-full max-w-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface-bright">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">Payment Allocation</h2>
            <p className="text-body-md text-secondary mt-xs">Distribute incoming funds to active plans.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-secondary hover:text-on-surface hover:bg-surface-container-low rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-lg flex-grow overflow-y-auto max-h-[60vh]">
          {/* Payment Summary */}
          <div className="bg-surface border border-outline-variant rounded-lg p-md mb-xl flex items-center justify-between">
            <div className="flex items-center gap-md">
              <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  account_balance
                </span>
              </div>
              <div>
                <p className="text-label-caps text-secondary uppercase">Incoming Payment</p>
                <p className="text-body-md text-on-surface font-medium mt-base">{memberName}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-[32px] leading-[40px] tracking-[-0.01em] font-semibold text-primary">
                {formatCurrency(amount)}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-md p-sm bg-error-container text-on-error-container rounded-lg text-body-md">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center text-secondary py-lg">Loading member plans...</div>
          ) : plans.length === 0 ? (
            <div className="text-center text-secondary py-lg">
              This member has no active plans with outstanding balances.
            </div>
          ) : (
            <div>
              {/* Allocation Section */}
              <div className="flex justify-between items-end mb-md">
                <h3 className="text-body-lg text-on-surface font-medium">Member&apos;s Active Plans</h3>
                <span className="text-numeric-data text-secondary">
                  Remaining: {formatCurrency(remaining)}
                </span>
              </div>

              <div className="space-y-md">
                {plans.map((plan) => (
                  <div key={plan.plan_id} className="border-b border-surface-variant pb-md">
                    <div className="flex justify-between items-center mb-sm">
                      <div>
                        <p className="text-body-md text-on-surface font-medium">{plan.plan_name}</p>
                        <p className="text-label-caps text-secondary mt-xs">
                          Outstanding: {formatCurrency(plan.outstanding)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-numeric-data text-on-surface">
                          {formatCurrency(allocations[plan.plan_id] || 0)}
                        </p>
                        <p className="text-label-caps text-secondary mt-xs">
                          {amount > 0
                            ? `${Math.round(((allocations[plan.plan_id] || 0) / amount) * 100)}% of total`
                            : '0% of total'}
                        </p>
                      </div>
                    </div>
                    <div className="relative pt-xs">
                      <input
                        type="range"
                        min="0"
                        max={Math.min(plan.outstanding, amount)}
                        step="0.01"
                        value={allocations[plan.plan_id] || 0}
                        onChange={(e) =>
                          handleAllocationChange(plan.plan_id, parseFloat(e.target.value) || 0)
                        }
                        className="w-full"
                        aria-label={`Allocate to ${plan.plan_name}`}
                      />
                      <div
                        className="absolute top-[10px] left-0 h-[4px] bg-primary rounded-l-[2px] pointer-events-none"
                        style={{
                          width: `${amount > 0 ? ((allocations[plan.plan_id] || 0) / amount) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Suggested Split Notice */}
              <div className="mt-md flex items-start gap-sm p-sm bg-surface-container-low rounded-md border border-surface-variant">
                <span className="material-symbols-outlined text-secondary text-[20px]">lightbulb</span>
                <p className="text-body-md text-secondary">
                  Suggested split applied based on current plan deficits. Adjust sliders to modify.
                  Total allocation should not exceed incoming amount.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-lg py-md border-t border-outline-variant bg-surface-bright flex justify-end gap-md items-center">
          <button
            onClick={onClose}
            className="text-body-md font-medium text-on-surface bg-surface-container-lowest border border-outline-variant px-lg py-sm rounded transition-colors hover:bg-surface-container-low"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving || remaining < 0 || totalAllocated === 0}
            className="text-body-md font-medium text-on-primary bg-primary border border-primary px-lg py-sm rounded transition-colors hover:bg-on-surface-variant disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Confirm Allocation'}
          </button>
        </div>
      </div>
    </div>
  );
}
