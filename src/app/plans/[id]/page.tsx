import { createServerSupabase } from '@/lib/supabase';
import {
  formatCurrency, formatDate, formatCycleDuration, getInitials,
  getCurrentCycle, getPayeeForCycle, isStartDateLocked
} from '@/lib/utils';
import { assignMemberToPlan, removeMemberFromPlan, processPayout, deletePlan } from '@/lib/server-actions';
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
    .select('*, members(id, name, phone)')
    .eq('plan_id', id)
    .order('slot_number');

  // Get allocations with cycle_number joined with payments for member info
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

  // Build per-member per-cycle payment map: memberId -> { cycleNumber -> totalPaid }
  const memberCyclePayments: Record<string, Record<number, number>> = {};
  for (const alloc of allocations ?? []) {
    const memberId = (alloc.payments as unknown as { member_id: string })?.member_id;
    if (!memberId) continue;
    if (!memberCyclePayments[memberId]) memberCyclePayments[memberId] = {};
    const cycleNum = alloc.cycle_number ?? 0;
    memberCyclePayments[memberId][cycleNum] =
      (memberCyclePayments[memberId][cycleNum] ?? 0) + parseFloat(String(alloc.amount_allocated));
  }

  return {
    plan,
    members: planMembers ?? [],
    allocations: allocations ?? [],
    payouts: payouts ?? [],
    allMembers: allMembers ?? [],
    totalExpected,
    totalAllocated,
    outstanding,
    memberCyclePayments,
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

  const { plan, members, payouts, allMembers, totalExpected, totalAllocated, outstanding, allocations, memberCyclePayments } = data;
  const progressPct = totalExpected > 0 ? Math.min(100, (totalAllocated / totalExpected) * 100) : 0;

  // Calculate current cycle from dates
  const currentCycle = plan.start_date && plan.cycle_days
    ? getCurrentCycle(plan.start_date, plan.cycle_days)
    : 0;
  const totalCycles = plan.total_slots;
  const startDateLocked = plan.start_date && plan.cycle_days
    ? isStartDateLocked(plan.start_date, plan.cycle_days)
    : false;

  // Determine which slot should be paid this cycle
  const currentPayeeSlotNumber = currentCycle > 0
    ? getPayeeForCycle(currentCycle, totalCycles)
    : null;

  // Track which members have paid (have allocations to this plan)
  const paidMemberIds = new Set(
    allocations
      .filter((a) => a.payments?.member_id)
      .map((a) => a.payments.member_id)
  );

  // Find the member who should be paid this cycle (by slot number)
  const currentPayeeMember = currentPayeeSlotNumber
    ? members.find((m) => m.slot_number === currentPayeeSlotNumber) ?? null
    : null;

  // Check if the current payee has already been paid
  const currentPayeePaid = currentPayeeMember
    ? payouts.some((p) => p.member_id === currentPayeeMember.member_id && p.cycle_number === currentCycle)
    : false;

  // All payouts done for this cycle
  const allPaidInCycle = members.length > 0 && members.every((m) =>
    payouts.some((p) => p.member_id === m.member_id && p.cycle_number === currentCycle)
  );

  // Determine which cycles to show for payment status
  const cyclesToShow = plan.start_date && plan.cycle_days && totalCycles > 0
    ? Array.from(
        { length: Math.min(currentCycle + 2, totalCycles) },
        (_, i) => i + 1
      )
    : [];

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-end border-b border-outline-variant pb-md mb-xl">
        <div>
          <span className="font-label-caps text-label-caps text-secondary uppercase tracking-wider mb-xs block">
            {plan.status === 'active' ? 'Active Plan' : plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
          </span>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">{plan.name}</h2>
          <div className="flex items-center gap-md mt-xs">
            <span className="text-body-md text-secondary">{formatCycleDuration(plan)}</span>
            <span className="text-secondary">·</span>
            <span className="text-body-md text-secondary">Started {formatDate(plan.start_date)}</span>
            {startDateLocked && (
              <>
                <span className="text-secondary">·</span>
                <span className="text-body-sm text-secondary italic">Start date locked</span>
              </>
            )}
          </div>
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
              <div className="hidden md:grid grid-cols-[auto_1fr_auto] gap-sm py-sm border-b border-surface-container-high text-label-caps text-secondary">
                <div>Slot</div>
                <div>Member Name</div>
                <div className="text-right">Payments</div>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-sm mb-sm">
                {members.map((pm) => {
                  const memberName = (pm.members as unknown as { name: string })?.name ?? 'Unknown';
                  const memberPhone = (pm.members as unknown as { phone?: string })?.phone ?? '';
                  const memberCycleData = memberCyclePayments[pm.member_id] ?? {};
                  const slotNum = String(pm.slot_number).padStart(2, '0');

                  const cycleStatuses = cyclesToShow.map((c) => {
                    const paid = memberCycleData[c] ?? 0;
                    const contribution = parseFloat(String(plan.contribution_amount));
                    if (paid >= contribution) return 'paid';
                    if (paid > 0) return 'partial';
                    return 'unpaid';
                  });

                  return (
                    <div key={pm.id} className="bg-surface border border-outline-variant rounded-lg p-sm">
                      <div className="flex items-center justify-between mb-xs">
                        <div className="flex items-center gap-sm">
                          <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-label-caps text-on-surface-variant flex-shrink-0">
                            {getInitials(memberName)}
                          </div>
                          <div>
                            <div className="text-body-md font-medium text-on-surface">{memberName}</div>
                            <div className="text-label-sm text-secondary">Slot #{slotNum}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-xs">
                          {memberPhone && (
                            <a
                              href={`https://wa.me/${memberPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Dear ${memberName}, this is a reminder about your contribution for ${plan.name}. Please make your payment. Thank you.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-secondary hover:text-primary p-1 rounded hover:bg-surface-variant transition-colors"
                              title="Send WhatsApp reminder"
                            >
                              <span className="material-symbols-outlined text-[18px]">chat</span>
                            </a>
                          )}
                          <form action={removeMemberFromPlan.bind(null, pm.id, plan.id)}>
                            <button type="submit" className="text-secondary hover:text-error p-1 rounded hover:bg-surface-variant transition-colors">
                              <span className="material-symbols-outlined text-[18px]">remove_circle</span>
                            </button>
                          </form>
                        </div>
                      </div>
                      {/* Cycle Payment Indicators */}
                      {cyclesToShow.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-xs pt-xs border-t border-surface-variant">
                          {cycleStatuses.map((status, idx) => {
                            const cycleNum = cyclesToShow[idx];
                            let icon: string;
                            let color: string;
                            let label: string;
                            if (status === 'paid') {
                              icon = 'check_circle';
                              color = '#10B981';
                              label = `Cycle ${cycleNum}: Fully paid`;
                            } else if (status === 'partial') {
                              icon = 'radio_button_partial';
                              color = '#F59E0B';
                              label = `Cycle ${cycleNum}: Partially paid (${formatCurrency(memberCycleData[cycleNum] ?? 0)})`;
                            } else {
                              icon = 'radio_button_unchecked';
                              color = '#9CA3AF';
                              label = `Cycle ${cycleNum}: Unpaid`;
                            }
                            return (
                              <span
                                key={cycleNum}
                                className="inline-flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded-full border"
                                style={{
                                  borderColor: status === 'paid' ? '#A7F3D0' : status === 'partial' ? '#FDE68A' : '#E5E7EB',
                                  backgroundColor: status === 'paid' ? '#ECFDF5' : status === 'partial' ? '#FFFBEB' : '#F9FAFB',
                                  color: status === 'paid' ? '#065F46' : status === 'partial' ? '#92400E' : '#6B7280',
                                }}
                                title={label}
                              >
                                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                  {icon === 'radio_button_unchecked' ? 'circle' : icon === 'radio_button_partial' ? 'circle' : icon}
                                </span>
                                C{cycleNum}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table Rows */}
              <div className="hidden md:block">
                {members.map((pm) => {
                  const memberName = (pm.members as unknown as { name: string })?.name ?? 'Unknown';
                  const memberPhone = (pm.members as unknown as { phone?: string })?.phone ?? '';
                  const memberCycleData = memberCyclePayments[pm.member_id] ?? {};

                  const cycleStatuses = cyclesToShow.map((c) => {
                    const paid = memberCycleData[c] ?? 0;
                    const contribution = parseFloat(String(plan.contribution_amount));
                    if (paid >= contribution) return 'paid';
                    if (paid > 0) return 'partial';
                    return 'unpaid';
                  });

                  return (
                    <div key={pm.id} className="grid grid-cols-[auto_1fr_auto] gap-sm py-sm border-b border-surface-container-high items-center hover:bg-surface-container-low transition-colors">
                      <div className="text-numeric-data text-secondary font-medium">#{String(pm.slot_number).padStart(2, '0')}</div>
                      <div className="flex items-center gap-sm min-w-0">
                        <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-label-caps text-on-surface-variant flex-shrink-0">
                          {getInitials(memberName)}
                        </div>
                        <span className="text-body-md text-on-surface truncate">{memberName}</span>
                        {memberPhone && (
                          <a
                            href={`https://wa.me/${memberPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Dear ${memberName}, this is a reminder about your contribution for ${plan.name}. Please make your payment. Thank you.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-secondary hover:text-primary p-0.5 rounded hover:bg-surface-variant transition-colors flex-shrink-0"
                            title="Send WhatsApp reminder"
                          >
                            <span className="material-symbols-outlined text-[16px]">chat</span>
                          </a>
                        )}
                        {/* Cycle Payment Indicators - Desktop */}
                        {cyclesToShow.length > 0 && (
                          <div className="flex items-center gap-0.5 ml-sm flex-shrink-0" title="Cycle payment status">
                            {cycleStatuses.map((status, idx) => {
                              const cycleNum = cyclesToShow[idx];
                              let icon: string;
                              let color: string;
                              let label: string;
                              if (status === 'paid') {
                                icon = 'check_circle';
                                color = '#10B981';
                                label = `Cycle ${cycleNum}: Fully paid`;
                              } else if (status === 'partial') {
                                icon = 'radio_button_partial';
                                color = '#F59E0B';
                                label = `Cycle ${cycleNum}: Partially paid (${formatCurrency(memberCycleData[cycleNum] ?? 0)})`;
                              } else {
                                icon = 'radio_button_unchecked';
                                color = '#9CA3AF';
                                label = `Cycle ${cycleNum}: Unpaid`;
                              }
                              return (
                                <span
                                  key={cycleNum}
                                  className="material-symbols-outlined text-[14px]"
                                  style={{ color }}
                                  title={label}
                                >
                                  {icon}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex items-center justify-end gap-xs">
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
                {currentCycle > 0 ? `Cycle ${currentCycle} of ${totalCycles}` : 'Not started'}
              </span>
            </div>

            {/* Current Recipient */}
            <div className="mb-md p-md bg-surface border border-outline-variant rounded-lg">
              {currentCycle > 0 && currentCycle <= totalCycles ? (
                <>
                  <div>
                    <span className="text-label-caps text-secondary block mb-xs">
                      {currentPayeePaid ? 'Last Payout' : 'Current Recipient'}
                    </span>
                    <span className="text-numeric-data text-on-surface block">
                      {currentPayeeMember
                        ? `#${String(currentPayeeMember.slot_number).padStart(2, '0')} ${(currentPayeeMember.members as unknown as { name: string })?.name ?? 'Unknown'}`
                        : 'No member assigned to this slot'}
                    </span>
                    {currentPayeeMember && (currentPayeeMember.members as unknown as { phone?: string })?.phone && (
                      <a
                        href={`https://wa.me/${String((currentPayeeMember.members as unknown as { phone: string })?.phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Dear ${(currentPayeeMember.members as unknown as { name: string })?.name}, your payout is ready for collection. Please check your account. Thank you.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-xs text-body-sm text-secondary hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">chat</span>
                        Remind via WhatsApp
                      </a>
                    )}
                  </div>
                  {currentPayeeMember && !currentPayeePaid && (
                    <form action={processPayout} className="mt-sm">
                      <input type="hidden" name="plan_id" value={plan.id} />
                      <input type="hidden" name="member_id" value={currentPayeeMember.member_id} />
                      <input type="hidden" name="cycle_number" value={currentCycle} />
                      <input type="hidden" name="amount" value={plan.payout_amount} />
                      <button
                        type="submit"
                        className="w-full mt-sm bg-primary text-on-primary text-body-md py-sm rounded-lg hover:bg-primary-container transition-colors"
                      >
                        Process Payout
                      </button>
                    </form>
                  )}
                  {currentPayeePaid && (
                    <p className="text-body-sm text-secondary mt-sm flex items-center gap-xs">
                      <span className="material-symbols-outlined text-[16px]" style={{ color: '#10B981' }}>check_circle</span>
                      Paid this cycle
                    </p>
                  )}
                </>
              ) : currentCycle > totalCycles ? (
                <p className="text-body-md text-secondary">All cycles complete — every member has received their payout.</p>
              ) : (
                <p className="text-body-md text-secondary">Plan starts {formatDate(plan.start_date)}.</p>
              )}
            </div>

            {/* Cycle Timeline */}
            {plan.start_date && plan.cycle_days && (
              <div className="mb-md">
                <span className="text-label-caps text-secondary uppercase tracking-wider block mb-sm">Cycle Timeline</span>
                <div className="flex flex-col gap-xs">
                  {Array.from({ length: Math.min(totalCycles, 12) }, (_, i) => {
                    const cycleNum = i + 1;
                    const slotNum = getPayeeForCycle(cycleNum, totalCycles);
                    const isPast = cycleNum < currentCycle;
                    const isCurrent = cycleNum === currentCycle;
                    const payee = members.find((m) => m.slot_number === slotNum);
                    const payeeName = payee
                      ? (payee.members as unknown as { name: string })?.name ?? `Slot #${slotNum}`
                      : `Slot #${slotNum}`;

                    return (
                      <div
                        key={cycleNum}
                        className={`flex items-center gap-sm px-sm py-xs rounded-md text-body-sm ${
                          isCurrent
                            ? 'bg-primary-container text-on-primary-container'
                            : isPast
                            ? 'text-secondary'
                            : 'text-on-surface'
                        }`}
                      >
                        <span className="font-medium w-6">#{cycleNum}</span>
                        <span className="flex-1">{payeeName}</span>
                        {isPast && (
                          <span className="material-symbols-outlined text-[14px]" style={{ color: '#10B981' }}>check_circle</span>
                        )}
                        {isCurrent && (
                          <span className="material-symbols-outlined text-[14px]" style={{ color: '#6366F1' }}>arrow_right</span>
                        )}
                      </div>
                    );
                  })}
                  {totalCycles > 12 && (
                    <p className="text-body-sm text-secondary mt-xs">...and {totalCycles - 12} more cycles</p>
                  )}
                </div>
              </div>
            )}

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
