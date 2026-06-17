import { createServerSupabase } from '@/lib/supabase';
import { formatCurrency, formatDate, getInitials, cycleLabels } from '@/lib/utils';
import { assignMemberToPlan, removeMemberFromPlan, processPayout, deletePlan, startNextCycle } from '@/lib/server-actions';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getPlanDetail(id: string) {
  const supabase = await createServerSupabase();

  const { data: plan } = await supabase
    .from('plans')
    .select('*')
    .eq('id', id)
    .single();

  if (!plan) return null;

  const { data: planMembers } = await supabase
    .from('plan_members')
    .select('*, members(id, name)')
    .eq('plan_id', id)
    .order('slot_number');

  const { data: allocations } = await supabase
    .from('payment_allocations')
    .select('*, payments!inner(member_id, members!inner(name))')
    .eq('plan_id', id);

  const { data: payouts } = await supabase
    .from('payouts')
    .select('*, members(name)')
    .eq('plan_id', id)
    .order('cycle_number');

  const { data: allMembers } = await supabase
    .from('members')
    .select('*')
    .order('name');

  // Calculate totals
  const totalExpected = plan.total_slots * parseFloat(String(plan.contribution_amount));
  const totalAllocated = allocations?.reduce(
    (sum, a) => sum + parseFloat(String(a.amount_allocated)),
    0
  ) ?? 0;
  const outstanding = totalExpected - totalAllocated;

  return {
    plan,
    members: planMembers ?? [],
    allocations: allocations ?? [],
    payouts: payouts ?? [],
    allMembers: allMembers ?? [],
    totalExpected,
    totalAllocated,
    outstanding,
  };
}

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getPlanDetail(id);

  if (!data) notFound();

  const { plan, members, payouts, allMembers, totalExpected, totalAllocated, outstanding, allocations } = data;
  const progressPct = totalExpected > 0 ? Math.min(100, (totalAllocated / totalExpected) * 100) : 0;

  // Track which members have paid (have allocations to this plan)
  const paidMemberIds = new Set(
    allocations
      .filter((a) => a.payments?.member_id)
      .map((a) => a.payments.member_id)
  );

  // Cycle-aware payout tracking
  // Count how many completed payouts each member has across all cycles
  const memberPayoutCount = new Map<string, number>();
  for (const p of payouts) {
    if (p.status === 'completed') {
      memberPayoutCount.set(p.member_id, (memberPayoutCount.get(p.member_id) || 0) + 1);
    }
  }

  // Members who haven't been paid yet in the current cycle
  const membersNotPaidInCycle = members.filter((m) => {
    const count = memberPayoutCount.get(m.member_id) || 0;
    return count < plan.current_cycle;
  });

  const nextSlot = membersNotPaidInCycle.length > 0 ? membersNotPaidInCycle[0] : null;
  const allPaidInCycle = members.length > 0 && membersNotPaidInCycle.length === 0;

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-end border-b border-outline-variant pb-md mb-xl">
        <div>
          <span className="font-label-caps text-label-caps text-secondary uppercase tracking-wider mb-xs block">
            {plan.status === 'active' ? 'Active Plan' : plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
          </span>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">{plan.name}</h2>
        </div>
        <div className="flex gap-sm">
          <Link
            href={`/payments/new?member_id=&plan_id=${plan.id}`}
            className="px-md py-sm bg-primary text-on-primary rounded-lg text-body-md hover:bg-primary-container transition-colors"
          >
            Record Payment
          </Link>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Members List */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-lg p-lg">
          <div className="flex justify-between items-center mb-md pb-sm border-b border-surface-container-high">
            <h3 className="font-headline-md text-headline-md text-on-surface">Members &amp; Status</h3>
            <span className="text-numeric-data bg-secondary-container text-on-secondary-container px-sm py-xs rounded-full">
              {members.length} Total
            </span>
          </div>

          {/* Assign Member Form */}
          <div className="mb-md p-sm bg-surface rounded-lg border border-outline-variant">
            <form action={assignMemberToPlan} className="flex items-end gap-sm">
              <input type="hidden" name="plan_id" value={plan.id} />
              <div className="flex-1">
                <label className="block text-label-caps text-secondary uppercase mb-xs text-[10px]">Add Member</label>
                <select
                  name="member_id"
                  required
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded px-sm py-sm text-body-md focus:outline-none focus:border-primary"
                >
                  <option value="">Select member...</option>
                  {allMembers
                    .filter((m) => !members.some((pm) => pm.member_id === m.id))
                    .map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                </select>
              </div>
              <div className="w-24">
                <label className="block text-label-caps text-secondary uppercase mb-xs text-[10px]">Slot #</label>
                <input
                  name="slot_number"
                  type="number"
                  min="1"
                  max={plan.total_slots}
                  required
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded px-sm py-sm text-body-md focus:outline-none focus:border-primary"
                  placeholder="#"
                />
              </div>
              <button
                type="submit"
                className="bg-primary text-on-primary px-md py-sm rounded-lg text-body-md hover:bg-primary-container transition-colors"
              >
                Add
              </button>
            </form>
          </div>

          {/* Members Table */}
          {members.length === 0 ? (
            <p className="text-center text-secondary text-body-md py-lg">No members assigned yet.</p>
          ) : (
            <div>
              <div className="grid grid-cols-4 gap-sm py-sm border-b border-surface-container-high text-label-caps text-secondary">
                <div className="col-span-2">Member Name</div>
                <div>Slot</div>
                <div className="text-right">Status</div>
              </div>
              {members.map((pm) => {
                const memberName = (pm.members as unknown as { name: string })?.name ?? 'Unknown';
                const hasPaid = paidMemberIds.has(pm.member_id);
                return (
                  <div key={pm.id} className="grid grid-cols-4 gap-sm py-sm border-b border-surface-container-high items-center hover:bg-surface-container-low transition-colors">
                    <div className="col-span-2 flex items-center gap-sm">
                      <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-label-caps text-on-surface-variant">
                        {getInitials(memberName)}
                      </div>
                      <span className="text-body-md text-on-surface">{memberName}</span>
                    </div>
                    <div className="text-numeric-data text-secondary">#{String(pm.slot_number).padStart(2, '0')}</div>
                    <div className="text-right flex items-center justify-end gap-xs">
                      <span className="material-symbols-outlined text-[18px]" style={{ color: hasPaid ? '#10B981' : '#EF4444' }}>
                        {hasPaid ? 'check_circle' : 'cancel'}
                      </span>
                      <form action={removeMemberFromPlan.bind(null, pm.id, plan.id)}>
                        <button type="submit" className="text-secondary hover:text-error p-1 rounded hover:bg-surface-variant transition-colors">
                          <span className="material-symbols-outlined text-[16px]">remove_circle</span>
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-gutter">
          {/* Contribution Cycle Tracker */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg">
            <div className="mb-md">
              <span className="text-label-caps text-secondary uppercase tracking-wider block mb-xs">Progress</span>
              <div className="flex items-end gap-sm">
                <h3 className="font-display text-[32px] leading-[40px] font-semibold text-on-surface">
                  {formatCurrency(totalAllocated)}
                </h3>
                <span className="text-body-md text-secondary mb-1">of {formatCurrency(totalExpected)}</span>
              </div>
            </div>
            <div className="w-full h-2 bg-surface-container-high rounded-full mb-md overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${progressPct}%` }}></div>
            </div>
            <div className="flex flex-col gap-sm">
              <div className="flex justify-between items-center">
                <span className="text-body-md text-secondary">Allocated</span>
                <span className="text-numeric-data text-on-surface">{formatCurrency(totalAllocated)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-body-md text-secondary">Outstanding</span>
                <span className="text-numeric-data text-on-surface">{formatCurrency(outstanding)}</span>
              </div>
            </div>
          </div>

          {/* Payout Tracker */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg">
            <div className="flex items-center justify-between mb-md pb-sm border-b border-surface-container-high">
              <h3 className="font-headline-md text-headline-md text-on-surface">
                Payout Tracker
              </h3>
              <span className="text-label-caps text-secondary bg-surface-container-high px-sm py-xs rounded-full">
                Cycle {plan.current_cycle}
              </span>
            </div>

            {/* Current Recipient */}
            <div className="mb-md p-md bg-surface border border-outline-variant rounded-lg">
              <div>
                <span className="text-label-caps text-secondary block mb-xs">Next Recipient</span>
                <span className="text-numeric-data text-on-surface block">
                  {nextSlot
                    ? `#${String(nextSlot.slot_number).padStart(2, '0')} ${(nextSlot.members as unknown as { name: string })?.name ?? 'Unknown'}`
                    : allPaidInCycle
                      ? `Cycle ${plan.current_cycle} — All paid out`
                      : 'No members assigned'}
                </span>
              </div>
              {nextSlot && (
                <form action={processPayout} className="mt-sm">
                  <input type="hidden" name="plan_id" value={plan.id} />
                  <input type="hidden" name="member_id" value={nextSlot.member_id} />
                  <input type="hidden" name="cycle_number" value={plan.current_cycle} />
                  <input type="hidden" name="amount" value={plan.payout_amount} />
                  <button
                    type="submit"
                    className="w-full mt-sm bg-primary text-on-primary text-body-md py-sm rounded-lg hover:bg-primary-container transition-colors"
                  >
                    Process Payout
                  </button>
                </form>
              )}
              {allPaidInCycle && (
                <form action={startNextCycle.bind(null, plan.id)} className="mt-sm">
                  <button
                    type="submit"
                    className="w-full mt-sm bg-secondary-container text-on-secondary-container text-body-md py-sm rounded-lg hover:bg-surface-variant transition-colors border border-outline-variant"
                  >
                    Start Next Cycle
                  </button>
                </form>
              )}
            </div>

            {/* Completed Payouts */}
            <div>
              <span className="text-label-caps text-secondary uppercase tracking-wider block mb-sm">Completed Payouts</span>
              {payouts.length === 0 ? (
                <p className="text-body-md text-secondary">No payouts yet.</p>
              ) : (
                <div className="flex flex-col gap-xs">
                  {payouts.map((p) => (
                    <div key={p.id} className="flex justify-between py-xs border-b border-surface-container-high">
                      <span className="text-body-md text-secondary">
                        #{p.cycle_number} {(p.members as unknown as { name: string })?.name ?? 'Unknown'}
                      </span>
                      <div className="flex items-center gap-xs">
                        <span className="text-numeric-data text-secondary">{formatCurrency(p.amount)}</span>
                        <span className="material-symbols-outlined text-[16px]" style={{ color: '#10B981' }}>done_all</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
