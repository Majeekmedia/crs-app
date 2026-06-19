import { createServerSupabase } from '@/lib/supabase';
import { formatCurrency, cycleLabels } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  const supabase = await createServerSupabase();

  const [plansRes, paymentsRes, allocationsRes] = await Promise.all([
    supabase.from('plans').select('*').order('created_at', { ascending: false }),
    supabase.from('payments').select('amount, status'),
    supabase.from('payment_allocations').select('amount_allocated, plan_id, plans(name, contribution_amount, total_slots)'),
  ]);

  const plans = plansRes.data ?? [];
  const payments = paymentsRes.data ?? [];
  const allocations = allocationsRes.data ?? [];

  // Calculate metrics
  const totalReceived = payments.reduce((sum, p) => sum + parseFloat(String(p.amount)), 0);
  const totalUnallocated = payments
    .filter((p) => p.status === 'unallocated')
    .reduce((sum, p) => sum + parseFloat(String(p.amount)), 0);

  const activePlans = plans.filter((p) => p.status === 'active');
  const totalExpected = activePlans.reduce(
    (sum, p) => sum + p.total_slots * parseFloat(String(p.contribution_amount)),
    0
  );

  const totalAllocated = allocations.reduce(
    (sum, a) => sum + parseFloat(String(a.amount_allocated)),
    0
  );

  const totalOutstanding = totalExpected - totalAllocated;

  // Profit estimate: (contribution_amount * total_slots - payout_amount) × total_slots (cycles)
  // Per cycle: members contribute ₦X each, winner gets payout, excess is profit
  // Total profit = per-cycle profit × number of cycles
  const profitEstimate = activePlans.reduce((sum, p) => {
    const perCycleCollection = p.total_slots * parseFloat(String(p.contribution_amount));
    const profitPerCycle = perCycleCollection - parseFloat(String(p.payout_amount));
    const totalProfit = profitPerCycle * p.total_slots; // profit over all cycles
    return sum + Math.max(0, totalProfit);
  }, 0);

  return {
    plans: activePlans,
    totalActivePlans: activePlans.length,
    totalReceived,
    totalUnallocated,
    totalOutstanding,
    profitEstimate,
    totalAllocated,
    totalExpected,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <>
      {/* Page Header */}
      <div className="mb-xl flex justify-between items-end">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-background">Overview</h2>
          <p className="font-body-md text-body-md text-secondary mt-1">System-wide financial summary</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-xl">
        <div className="bg-surface-container-lowest border border-outline-variant p-lg rounded-lg">
          <div className="flex justify-between items-start mb-md">
            <span className="font-label-caps text-label-caps text-secondary uppercase">Total Active Plans</span>
            <span className="material-symbols-outlined text-secondary">event_note</span>
          </div>
          <div className="font-display text-[32px] leading-[40px] font-semibold text-on-surface">
            {data.totalActivePlans}
          </div>
          <div className="mt-sm text-body-md text-secondary flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px] text-[#10B981]">trending_up</span>
            <span>Active contribution groups</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant p-lg rounded-lg">
          <div className="flex justify-between items-start mb-md">
            <span className="font-label-caps text-label-caps text-secondary uppercase">Total Money Received</span>
            <span className="material-symbols-outlined text-secondary">payments</span>
          </div>
          <div className="font-display text-[32px] leading-[40px] font-semibold text-on-surface">
            {formatCurrency(data.totalReceived)}
          </div>
          <div className="mt-sm text-body-md text-secondary flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px] text-[#10B981]">trending_up</span>
            <span>All time collections</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant p-lg rounded-lg">
          <div className="flex justify-between items-start mb-md">
            <span className="font-label-caps text-label-caps text-secondary uppercase">Total Outstanding</span>
            <span className="material-symbols-outlined text-secondary">account_balance_wallet</span>
          </div>
          <div className="font-display text-[32px] leading-[40px] font-semibold text-on-surface">
            {formatCurrency(data.totalOutstanding)}
          </div>
          <div className="mt-sm text-body-md text-secondary flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px] text-[#F59E0B]">warning</span>
            <span>Expected but not yet received</span>
          </div>
        </div>

        <div className="bg-primary text-on-primary border border-primary p-lg rounded-lg relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-md">
              <span className="font-label-caps text-label-caps text-primary-fixed-dim uppercase">Profit Estimate</span>
              <span className="material-symbols-outlined text-primary-fixed-dim">monitoring</span>
            </div>
            <div className="font-display text-[32px] leading-[40px] font-semibold text-surface-container-lowest">
              {formatCurrency(data.profitEstimate)}
            </div>
            <div className="mt-sm text-body-md text-primary-fixed-dim flex items-center gap-xs">
              <span>Projected total across all cycles</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Contribution Plans */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg">
        <div className="p-lg border-b border-outline-variant flex justify-between items-center">
          <h3 className="font-headline-md text-headline-md text-on-surface">Active Contribution Plans</h3>
          <Link
            href="/plans/new"
            className="bg-primary text-on-primary text-body-md px-md py-sm rounded-lg hover:bg-primary-container transition-colors inline-flex items-center gap-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Plan
          </Link>
        </div>

        <div>
          {/* Table Header - hidden on mobile */}
          <div className="hidden md:grid grid-cols-12 gap-gutter px-lg py-sm border-b border-outline-variant bg-surface font-label-caps text-label-caps text-secondary uppercase">
            <div className="col-span-4">Plan Name</div>
            <div className="col-span-3">Collected vs Expected</div>
            <div className="col-span-3">Cycle</div>
            <div className="col-span-2 text-right">Status</div>
          </div>

          {data.plans.length === 0 ? (
            <div className="p-lg text-center text-secondary text-body-md">
              No active plans yet.{" "}
              <Link href="/plans/new" className="text-primary underline">Create your first plan</Link>
            </div>
          ) : (
            data.plans.map((plan) => {
              const expected = plan.total_slots * parseFloat(String(plan.contribution_amount));
              const received = plan.total_slots * parseFloat(String(plan.contribution_amount)); // Simplified for now
              const progressPct = expected > 0 ? Math.min(100, (received / expected) * 100) : 0;

              return (
                <Link
                  key={plan.id}
                  href={`/plans/${plan.id}`}
                  className="block md:grid grid-cols-12 gap-gutter px-lg py-md border-b border-outline-variant items-center hover:bg-surface-container-low transition-colors"
                >
                  {/* Mobile: stacked card layout */}
                  <div className="md:hidden space-y-sm">
                    <div className="text-body-md font-medium text-on-surface">{plan.name}</div>
                    <div className="w-full bg-surface-container-high rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-body-md">
                      <span className="text-numeric-data text-secondary">
                        <span className="text-on-surface">{formatCurrency(received)}</span> / {formatCurrency(expected)}
                      </span>
                      <span className="text-on-surface">{cycleLabels[plan.cycle_duration] || plan.cycle_duration}</span>
                    </div>
                    <div className="flex justify-end">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-label-caps bg-[#D1FAE5] text-[#065F46]">
                        Active
                      </span>
                    </div>
                  </div>

                  {/* Desktop: grid columns */}
                  <div className="hidden md:contents">
                    <div className="col-span-4">
                      <div className="text-body-md font-medium text-on-surface mb-xs">{plan.name}</div>
                      <div className="w-full bg-surface-container-high rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${progressPct}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="col-span-3 text-numeric-data text-secondary">
                      <span className="text-on-surface">{formatCurrency(received)}</span> / {formatCurrency(expected)}
                    </div>
                    <div className="col-span-3 text-body-md text-on-surface">
                      {cycleLabels[plan.cycle_duration] || plan.cycle_duration}
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-label-caps bg-[#D1FAE5] text-[#065F46]">
                        Active
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
