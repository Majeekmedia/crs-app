import { createServerSupabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getReconciliationData() {
  const supabase = await createServerSupabase();

  const [plansRes, paymentsRes, allocationsRes] = await Promise.all([
    supabase.from('plans').select('*').order('name'),
    supabase.from('payments').select('amount, status, received_at, members(name)').order('received_at', { ascending: false }).limit(20),
    supabase.from('payment_allocations').select('amount_allocated, plan_id, plans(name, contribution_amount, total_slots)'),
  ]);

  const plans = plansRes.data ?? [];
  const payments = paymentsRes.data ?? [];
  const allocations = allocationsRes.data ?? [];

  // Calculate totals
  const totalPayments = payments.reduce((sum, p) => sum + parseFloat(String(p.amount)), 0);
  const totalAllocated = allocations.reduce((sum, a) => sum + parseFloat(String(a.amount_allocated)), 0);
  const unallocated = totalPayments - totalAllocated;

  // Group payments by allocation status for the donut chart
  const fullyAllocatedAmount = payments
    .filter((p) => p.status === 'allocated')
    .reduce((sum, p) => sum + parseFloat(String(p.amount)), 0);
  const partiallyAllocatedAmount = payments
    .filter((p) => p.status === 'partial')
    .reduce((sum, p) => sum + parseFloat(String(p.amount)), 0);
  const unallocatedAmount = payments
    .filter((p) => p.status === 'unallocated')
    .reduce((sum, p) => sum + parseFloat(String(p.amount)), 0);

  // Per-plan breakdown
  const planBreakdown = plans.map((plan) => {
    const totalExpected = plan.total_slots * parseFloat(String(plan.contribution_amount));
    const planAllocations = allocations.filter(
      (a) => (a.plans as unknown as { id: string })?.id === plan.id || a.plan_id === plan.id
    );
    const received = planAllocations.reduce((sum, a) => sum + parseFloat(String(a.amount_allocated)), 0);
    const variance = totalExpected - received;
    const variancePct = totalExpected > 0 ? ((variance / totalExpected) * 100) : 0;

    return {
      plan_id: plan.id,
      plan_name: plan.name,
      totalExpected,
      received,
      variance,
      variancePct,
      status: plan.status,
    };
  });

  // Allocation status
  // Allocation donut: mutually exclusive slices by payment status
  const allocatedPct = totalPayments > 0 ? (fullyAllocatedAmount / totalPayments) * 100 : 0;
  const partialPct = totalPayments > 0 ? (partiallyAllocatedAmount / totalPayments) * 100 : 0;
  const unallocatedPct = totalPayments > 0 ? (unallocatedAmount / totalPayments) * 100 : 0;

  return {
    planBreakdown,
    payments: payments.slice(0, 10),
    totalPayments,
    totalAllocated,
    unallocated,
    allocatedPct,
    unallocatedPct,
    partialPct,
  };
}

export default async function ReconciliationPage() {
  const data = await getReconciliationData();

  return (
    <>
      {/* Page Header */}
      <div className="mb-xl flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-background">Reconciliation Overview</h2>
          <p className="text-body-lg text-secondary mt-1">Real-time status of funds received vs. expected allocations.</p>
        </div>
        <div className="flex items-center gap-sm">
          <span className="text-label-caps text-secondary uppercase">Auto-reconciled</span>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Bank View */}
        <div className="lg:col-span-8 flex flex-col gap-gutter">
          {/* Total Money Metric */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg">
            <div className="flex justify-between items-start mb-md">
              <h3 className="font-headline-md text-headline-md text-on-background">Bank View</h3>
              <span className="px-3 py-1 bg-surface-container-low text-secondary text-label-caps rounded-full border border-outline-variant">
                Operating Account
              </span>
            </div>
            <div>
              <p className="text-body-md text-secondary mb-1">Total Money in System</p>
              <div className="flex items-baseline gap-sm">
                <span className="font-display text-[32px] leading-[40px] font-semibold text-on-background tracking-tight">
                  {formatCurrency(data.totalPayments)}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Payments */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg flex-1">
            <div className="p-lg border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-headline-md text-headline-md text-on-background">Recent Payments</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-container-high bg-surface-container-low/50">
                    <th className="py-sm px-lg text-label-caps text-secondary uppercase tracking-wider">Date</th>
                    <th className="py-sm px-lg text-label-caps text-secondary uppercase tracking-wider">Member</th>
                    <th className="py-sm px-lg text-label-caps text-secondary uppercase tracking-wider">Amount</th>
                    <th className="py-sm px-lg text-label-caps text-secondary uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="text-numeric-data text-on-surface">
                  {data.payments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-lg px-lg text-center text-secondary text-body-md">
                        No payments recorded yet.
                      </td>
                    </tr>
                  ) : (
                    data.payments.map((payment, idx) => {
                      const memberName = (payment.members as unknown as { name: string })?.name ?? 'Unknown';
                      const isAllocated = payment.status !== 'unallocated';

                      return (
                        <tr key={idx} className="border-b border-surface-container-high hover:bg-surface-container-lowest transition-colors">
                          <td className="py-md px-lg">
                            {new Date(payment.received_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-md px-lg text-secondary">{memberName}</td>
                          <td className="py-md px-lg font-medium">{formatCurrency(payment.amount)}</td>
                          <td className="py-md px-lg">
                            {isAllocated ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]">
                                Matched
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-surface-container-high text-secondary border border-outline-variant">
                                Unallocated
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Allocation Status (Right Column) */}
        <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-lg p-lg flex flex-col">
          <div className="mb-lg">
            <h3 className="font-headline-md text-headline-md text-on-background">Allocation Status</h3>
            <p className="text-body-md text-secondary mt-1">System-wide fund distribution.</p>
          </div>

          {/* Donut Chart Representation */}
          <div className="flex-1 flex flex-col items-center justify-center mb-xl relative">
            {/* Simplified visual: stacked bar instead of actual donut */}
            <div className="w-full h-48 flex flex-col items-center justify-center">
              <div className="w-48 h-48 rounded-full overflow-hidden relative mb-lg" style={{
                background: `conic-gradient(
                  #166534 0% ${data.allocatedPct}%,
                  #9A3412 ${data.allocatedPct}% ${data.allocatedPct + data.partialPct}%,
                  #991B1B ${data.allocatedPct + data.partialPct}% 100%
                )`
              }}>
                <div className="absolute inset-4 bg-surface-container-lowest rounded-full flex flex-col items-center justify-center">
                  <span className="text-numeric-data text-secondary">Total</span>
                  <span className="font-headline-md text-headline-md text-on-background font-semibold">100%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-md mt-auto">
            <div className="flex justify-between items-center p-sm rounded bg-surface-container-low border border-outline-variant/50">
              <div className="flex items-center gap-sm">
                <div className="w-3 h-3 rounded-full bg-[#166534]"></div>
                <span className="text-body-md text-on-surface">Fully Allocated</span>
              </div>
              <div className="text-right">
                <div className="text-numeric-data text-on-background">{Math.round(data.allocatedPct)}%</div>
                <div className="text-label-caps text-secondary">{formatCurrency(data.totalAllocated)}</div>
              </div>
            </div>

            <div className="flex justify-between items-center p-sm rounded bg-surface-container-low border border-outline-variant/50">
              <div className="flex items-center gap-sm">
                <div className="w-3 h-3 rounded-full bg-[#9A3412]"></div>
                <span className="text-body-md text-on-surface">Partially Allocated</span>
              </div>
              <div className="text-right">
                <div className="text-numeric-data text-on-background">{Math.round(data.partialPct)}%</div>
                <div className="text-label-caps text-secondary">{formatCurrency(0)}</div>
              </div>
            </div>

            <div className="flex justify-between items-center p-sm rounded bg-[rgba(153,27,27,0.1)] border border-[rgba(153,27,27,0.3)]">
              <div className="flex items-center gap-sm">
                <div className="w-3 h-3 rounded-full bg-[#991B1B]"></div>
                <span className="text-body-md text-[#991B1B] font-medium">Unallocated</span>
              </div>
              <div className="text-right">
                <div className="text-numeric-data text-[#991B1B] font-bold">{Math.round(data.unallocatedPct)}%</div>
                <div className="text-label-caps text-[rgba(153,27,27,0.8)]">{formatCurrency(data.unallocated)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Breakdown (Full width bottom) */}
        <div className="lg:col-span-12 bg-surface-container-lowest border border-outline-variant rounded-lg p-lg">
          <div className="mb-lg flex justify-between items-end border-b border-outline-variant pb-md">
            <div>
              <h3 className="font-headline-md text-headline-md text-on-background">Plan Breakdown</h3>
              <p className="text-body-md text-secondary mt-1">Expected vs. Received variance analysis.</p>
            </div>
            <div className="flex gap-md hidden sm:flex">
              <div className="flex items-center gap-xs">
                <div className="w-2 h-4 bg-surface-variant rounded-sm"></div>
                <span className="text-label-caps text-secondary">Expected</span>
              </div>
              <div className="flex items-center gap-xs">
                <div className="w-2 h-4 bg-primary rounded-sm"></div>
                <span className="text-label-caps text-secondary">Received</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {data.planBreakdown.length === 0 ? (
              <div className="col-span-full text-center text-secondary text-body-md py-lg">
                No plans created yet. Create a plan to start reconciling.
              </div>
            ) : (
              data.planBreakdown.map((plan) => {
                const expectedPct = plan.totalExpected > 0 ? 100 : 0;
                const receivedPct = plan.totalExpected > 0 ? (plan.received / plan.totalExpected) * 100 : 0;

                const isWarning = plan.variancePct > 5 && plan.variancePct <= 30;
                const isCritical = plan.variancePct > 30;

                const borderClass = isCritical
                  ? 'border-[rgba(153,27,27,0.3)] bg-[rgba(153,27,27,0.05)]'
                  : isWarning
                  ? 'border-outline-variant/50 bg-surface'
                  : 'border-outline-variant/50 bg-surface';

                const statusIcon = isCritical
                  ? 'error'
                  : isWarning
                  ? 'warning'
                  : 'check_circle';

                const statusColor = isCritical
                  ? '#991B1B'
                  : isWarning
                  ? '#9A3412'
                  : '#166534';

                const receivedBarColor = isCritical
                  ? 'bg-[#991B1B]'
                  : isWarning
                  ? 'bg-[#9A3412]'
                  : 'bg-primary';

                return (
                  <div key={plan.plan_id} className={`p-md rounded border ${borderClass}`}>
                    <div className="flex justify-between items-start mb-md">
                      <h4 className="text-numeric-data text-on-background font-semibold">{plan.plan_name}</h4>
                      <span className="material-symbols-outlined" style={{ color: statusColor }}>
                        {statusIcon}
                      </span>
                    </div>
                    <div className="flex flex-col gap-sm mb-md">
                      <div>
                        <div className="flex justify-between text-label-caps text-secondary mb-1">
                          <span>Expected</span>
                          <span>{formatCurrency(plan.totalExpected)}</span>
                        </div>
                        <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                          <div className="h-full bg-surface-variant w-full"></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-label-caps text-secondary mb-1">
                          <span>Received</span>
                          <span className="text-on-background">{formatCurrency(plan.received)}</span>
                        </div>
                        <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden relative">
                          <div
                            className={`h-full ${receivedBarColor} absolute left-0 top-0`}
                            style={{ width: `${receivedPct}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-outline-variant/50 pt-sm mt-sm flex justify-between items-center">
                      <span className="text-label-caps text-secondary">Variance</span>
                      <span
                        className={`text-numeric-data font-medium ${
                          isCritical
                            ? 'text-[#991B1B]'
                            : isWarning
                            ? 'text-[#9A3412]'
                            : 'text-[#166534]'
                        }`}
                      >
                        {plan.variancePct >= 0 ? '-' : '+'}
                        {Math.abs(plan.variancePct).toFixed(1)}% ({formatCurrency(Math.abs(plan.variance))})
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
