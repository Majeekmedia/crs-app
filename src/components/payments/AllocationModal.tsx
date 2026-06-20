'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCurrency } from '@/lib/utils';

interface CycleInfo {
  cycle_number: number;
  contribution: number;
  paid: number;
  outstanding: number;
  isPast?: boolean;
  isFuture?: boolean;
}

interface PlanWithCycles {
  plan_id: string;
  plan_name: string;
  contribution_amount: number;
  total_slots: number;
  current_cycle: number;
  outstanding: number;
  cycles: CycleInfo[];
  slot_count?: number;
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
        <div className="p-md md:p-lg flex-grow overflow-y-auto max-h-[75vh] md:max-h-[65vh]">
          {/* Payment Summary */}
          <div className="bg-surface border border-outline-variant rounded-lg p-md mb-xl flex flex-col md:flex-row md:items-center md:justify-between gap-sm">
            <div className="flex items-center gap-md">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shrink-0">
                <span className="material-symbols-outlined text-[20px] md:text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  account_balance
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-label-caps text-secondary uppercase">Incoming Payment</p>
                <p className="text-body-md text-on-surface font-medium mt-base truncate">{memberName}</p>
              </div>
            </div>
            <div className="text-right ml-auto md:ml-0">
              <p className="font-display text-[24px] md:text-[32px] leading-[32px] md:leading-[40px] tracking-[-0.01em] font-semibold text-primary">
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
                      <div className="bg-surface-bright px-md py-sm flex flex-col md:flex-row md:items-start gap-y-sm md:gap-x-md border-b border-outline-variant">
                        <div className="flex-1 min-w-0">
                          <p className="text-body-sm md:text-body-md text-on-surface font-medium break-words">{plan.plan_name}</p>
                          <p className="text-label-sm text-secondary mt-xs">
                            Cycle {plan.current_cycle}/{plan.total_slots} &middot;{' '}
                            {formatCurrency(plan.contribution_amount)}/slot{plan.slot_count && plan.slot_count > 1 ? ` · ${plan.slot_count} slots` : ''}
                          </p>
                        </div>
                        <div className="text-left md:text-right shrink-0 self-start">
                          <p className="text-numeric-data text-on-surface text-body-sm md:text-body-md">
                            {formatCurrency(planTotalAllocated)}
                          </p>
                          <p className="text-label-sm text-secondary">
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
                          const isPast = cycle.isPast && !isCurrentCycle;
                          const isFuture = cycle.isFuture && !isCurrentCycle;

                          const rowBg = isPast
                            ? 'bg-surface-container-low/30'
                            : isCurrentCycle
                            ? 'bg-primary-container/10'
                            : '';

                          const badge = isPast
                            ? { icon: 'history', label: 'Past cycle', color: 'text-secondary' }
                            : isCurrentCycle
                            ? { icon: 'play_arrow', label: 'Current cycle', color: 'text-primary' }
                            : isFuture
                            ? { icon: 'schedule', label: 'Upcoming cycle', color: 'text-secondary' }
                            : null;

                          return (
                            <div key={key} className={`px-md py-1.5 ${rowBg}`}>
                              {/* Cycle header - wrap on mobile */}
                              <div className="flex flex-row items-center justify-between gap-1 mb-0.5 flex-wrap">
                                <div className="flex items-center gap-1 min-w-0 flex-wrap">
                                  {badge && (
                                    <span className={`material-symbols-outlined text-[16px] shrink-0 ${badge.color}`} title={badge.label}>
                                      {badge.icon}
                                    </span>
                                  )}
                                  <span className="text-body-sm text-on-surface font-medium whitespace-nowrap">
                                    Cycle {cycle.cycle_number}
                                  </span>
                                  {cycle.paid > 0 && (
                                    <span className="text-label-sm text-secondary whitespace-nowrap">
                                      ({formatCurrency(cycle.paid)} paid)
                                    </span>
                                  )}
                                </div>
                                <span className="text-label-sm text-secondary shrink-0">
                                  {formatCurrency(cycle.outstanding)} outstanding
                                </span>
                              </div>
                              {/* Allocation input - inline on all screens */}
                              <div className="flex flex-row items-center gap-1.5 flex-wrap">
                                <span className="text-label-sm text-secondary shrink-0">Allocate:</span>
                                <div className="relative min-w-[80px] max-w-[140px] grow">
                                  <input
                                    type="number"
                                    min="0"
                                    max={Math.max(0, cycle.outstanding + allocValue)}
                                    step="100"
                                    value={allocValue}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value);
                                      handleAllocationChange(key, isNaN(val) ? 0 : Math.max(0, Math.min(val, cycle.outstanding + allocValue)));
                                    }}
                                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-2 py-1 text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    aria-label={`Allocate to ${plan.plan_name} Cycle ${cycle.cycle_number}`}
                                  />
                                </div>
                                <span className="text-label-sm text-secondary shrink-0">
                                  / {formatCurrency(cycle.outstanding)}
                                </span>
                                {cycle.outstanding > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleAllocationChange(key, Math.min(cycle.outstanding, cycle.outstanding + allocValue))}
                                    className="text-label-sm text-primary hover:text-primary-container px-1.5 py-0.5 rounded hover:bg-primary/5 transition-colors font-medium"
                                  >
                                    Max
                                  </button>
                                )}
                              </div>
                              {cycle.outstanding === 0 && cycle.paid > 0 && (
                                <p className="text-label-sm text-tertiary mt-0.5 flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
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
