'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCurrency } from '@/lib/utils';

interface CycleInfo {
  cycle_number: number;
  contribution: number;
  paid: number;
  outstanding: number;
}

interface PlanWithCycles {
  plan_id: string;
  plan_name: string;
  contribution_amount: number;
  total_slots: number;
  current_cycle: number;
  outstanding: number;
  cycles: CycleInfo[];
}

interface MemberOutstandingResponse {
  balance: number;
  plans: PlanWithCycles[];
}

interface AllocationModalProps {
  paymentId: string;
  memberId: string;
  memberName: string;
  amount: number;
  onClose: () => void;
  onAllocated: () => void;
}

/** Build a unique key for a plan+cycle combination */
function allocKey(planId: string, cycleNumber: number) {
  return `${planId}::${cycleNumber}`;
}

export default function AllocationModal({
  paymentId,
  memberId,
  memberName,
  amount,
  onClose,
  onAllocated,
}: AllocationModalProps) {
  const [data, setData] = useState<MemberOutstandingResponse | null>(null);
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalAllocated = Object.values(allocations).reduce((sum, v) => sum + (v || 0), 0);
  const remaining = amount - totalAllocated;
  const memberBalance = data?.balance ?? 0;

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch(`/api/member-outstanding?memberId=${memberId}`);
        const json: MemberOutstandingResponse = await res.json();
        setData(json);

        // Auto-suggest: fill cycles in order (current, next, etc.) across plans
        const suggested: Record<string, number> = {};
        let remainingAmount = amount + (json.balance > 0 ? json.balance : 0); // include balance as available credit

        for (const plan of json.plans) {
          if (remainingAmount <= 0) break;
          for (const cycle of plan.cycles) {
            if (remainingAmount <= 0) break;
            if (cycle.outstanding <= 0) continue;
            const alloc = Math.min(remainingAmount, cycle.outstanding);
            if (alloc > 0) {
              suggested[allocKey(plan.plan_id, cycle.cycle_number)] = alloc;
              remainingAmount -= alloc;
            }
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
    (key: string, value: number) => {
      setAllocations((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  async function handleConfirm() {
    setSaving(true);
    setError(null);

    try {
      // Build allocation payload with cycle_number
      const allocationPayload = Object.entries(allocations)
        .filter(([, v]) => v > 0)
        .map(([key, amountAllocated]) => {
          const [planId, cycleStr] = key.split('::');
          return {
            plan_id: planId,
            amount_allocated: amountAllocated,
            cycle_number: parseInt(cycleStr, 10),
          };
        });

      const res = await fetch('/api/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          allocations: allocationPayload,
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

  const plans = data?.plans ?? [];

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
            <p className="text-body-md text-secondary mt-xs">Distribute incoming funds to plans and cycles.</p>
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

          {/* Member Balance Badge */}
          {memberBalance > 0 && (
            <div className="mb-xl p-sm bg-tertiary-container/30 border border-tertiary-container rounded-lg flex items-center gap-sm">
              <span className="material-symbols-outlined text-[20px] text-tertiary">account_balance_wallet</span>
              <p className="text-body-md text-on-surface">
                <span className="font-medium">Credit balance: {formatCurrency(memberBalance)}</span> — available for future allocations.
              </p>
            </div>
          )}

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
                <h3 className="text-body-lg text-on-surface font-medium">Plans &amp; Cycles</h3>
                <span className="text-numeric-data text-secondary">
                  Remaining: {formatCurrency(remaining)}
                </span>
              </div>

              <div className="space-y-lg">
                {plans.map((plan) => {
                  const planTotalAllocated = plan.cycles
                    .filter((c) => allocations[allocKey(plan.plan_id, c.cycle_number)] > 0)
                    .reduce(
                      (sum, c) => sum + (allocations[allocKey(plan.plan_id, c.cycle_number)] || 0),
                      0
                    );

                  return (
                    <div key={plan.plan_id} className="border border-outline-variant rounded-lg overflow-hidden">
                      {/* Plan Header */}
                      <div className="bg-surface-bright px-md py-sm flex justify-between items-center border-b border-outline-variant">
                        <div>
                          <p className="text-body-md text-on-surface font-medium">{plan.plan_name}</p>
                          <p className="text-label-sm text-secondary mt-xs">
                            Cycle {plan.current_cycle}/{plan.total_slots} &middot;{' '}
                            {formatCurrency(plan.contribution_amount)} per cycle
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-numeric-data text-on-surface">
                            {formatCurrency(planTotalAllocated)}
                          </p>
                          <p className="text-label-sm text-secondary mt-xs">
                            of {formatCurrency(plan.outstanding)} outstanding
                          </p>
                        </div>
                      </div>

                      {/* Cycle Rows */}
                      <div className="divide-y divide-outline-variant/50">
                        {plan.cycles.map((cycle) => {
                          const key = allocKey(plan.plan_id, cycle.cycle_number);
                          const allocValue = allocations[key] || 0;
                          const isCurrentCycle = cycle.cycle_number === plan.current_cycle;

                          return (
                            <div
                              key={key}
                              className={`px-md py-sm ${isCurrentCycle ? 'bg-primary-container/10' : ''}`}
                            >
                              <div className="flex justify-between items-center mb-xs">
                                <div className="flex items-center gap-sm">
                                  {isCurrentCycle && (
                                    <span className="text-[14px]" title="Current cycle">▶</span>
                                  )}
                                  <span className="text-body-md text-on-surface font-medium">
                                    Cycle {cycle.cycle_number}
                                  </span>
                                  {cycle.paid > 0 && (
                                    <span className="text-label-sm text-secondary">
                                      ({formatCurrency(cycle.paid)} already paid)
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-md">
                                  <span className="text-numeric-data text-on-surface text-body-md">
                                    {formatCurrency(allocValue)}
                                  </span>
                                  <span className="text-label-sm text-secondary min-w-[60px] text-right">
                                    / {formatCurrency(cycle.outstanding)}
                                  </span>
                                </div>
                              </div>
                              <div className="relative pt-xs">
                                <input
                                  type="range"
                                  min="0"
                                  max={Math.max(0, cycle.outstanding + allocValue)}
                                  step="0.01"
                                  value={allocValue}
                                  onChange={(e) =>
                                    handleAllocationChange(key, parseFloat(e.target.value) || 0)
                                  }
                                  className="w-full"
                                  aria-label={`Allocate to ${plan.plan_name} Cycle ${cycle.cycle_number}`}
                                />
                              </div>
                              {cycle.outstanding === 0 && cycle.paid > 0 && (
                                <p className="text-label-sm text-tertiary mt-xs flex items-center gap-xs">
                                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                  Fully paid
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Notice */}
              <div className="mt-md flex items-start gap-sm p-sm bg-surface-container-low rounded-md border border-surface-variant">
                <span className="material-symbols-outlined text-secondary text-[20px]">lightbulb</span>
                <p className="text-body-md text-secondary">
                  Suggested split applied based on current cycle deficits. Adjust sliders to modify.
                  If allocation exceeds a cycle&apos;s contribution amount, the excess is automatically
                  credited to the member&apos;s balance.
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
