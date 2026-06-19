import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { getCurrentCycle, getPayeeForCycle } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const memberId = request.nextUrl.searchParams.get('memberId');

  if (!memberId) {
    return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
  }

  const supabase = await createServerSupabase();

  // Get member's balance
  const { data: member } = await supabase
    .from('members')
    .select('balance')
    .eq('id', memberId)
    .single();

  const balance = parseFloat(String(member?.balance ?? 0));

  // Get member's active plans (may have multiple rows per plan if member holds multiple slots)
  const { data: planMembers } = await supabase
    .from('plan_members')
    .select(`
      plan_id,
      slot_number,
      plans!inner (id, name, contribution_amount, status, total_slots, start_date, cycle_days)
    `)
    .eq('member_id', memberId)
    .eq('plans.status', 'active');

  if (!planMembers) {
    return NextResponse.json({ balance, plans: [] });
  }

  // Group by plan_id to count slots and avoid duplicate plan entries
  const planMap = new Map<string, {
    plan: { id: string; name: string; contribution_amount: number; status: string; total_slots: number; start_date: string; cycle_days: number };
    slotCount: number;
  }>();

  for (const pm of planMembers) {
    const p = pm.plans as unknown as {
      id: string; name: string; contribution_amount: number; status: string;
      total_slots: number; start_date: string; cycle_days: number;
    };
    if (!planMap.has(p.id)) {
      planMap.set(p.id, { plan: p, slotCount: 0 });
    }
    planMap.get(p.id)!.slotCount += 1;
  }

  const plans = [];

  const planEntries = Array.from(planMap.entries());
  for (let pi = 0; pi < planEntries.length; pi++) {
    const { plan, slotCount } = planEntries[pi][1];
    const contributionAmount = parseFloat(String(plan.contribution_amount));
    const totalExpected = plan.total_slots * contributionAmount;
    const memberCycleContribution = contributionAmount * slotCount;

    // Get all allocations for this plan (with cycle_number if available)
    const { data: allocations } = await supabase
      .from('payment_allocations')
      .select('amount_allocated, cycle_number')
      .eq('plan_id', plan.id);

    // Get allocations specifically from this member (via payments)
    const { data: memberAllocations } = await supabase
      .from('payment_allocations')
      .select('amount_allocated, cycle_number, payments!inner(member_id)')
      .eq('plan_id', plan.id)
      .eq('payments.member_id', memberId);

    const totalAllocated =
      allocations?.reduce((sum, a) => sum + parseFloat(String(a.amount_allocated)), 0) ?? 0;
    const outstanding = Math.max(0, totalExpected - totalAllocated);

    // Calculate per-cycle allocation for this member
    const currentCycle = plan.start_date && plan.cycle_days
      ? getCurrentCycle(plan.start_date, plan.cycle_days)
      : 0;

    const cycles = [];
    // Show cycles from current cycle onwards (including some future cycles for advance)
    const maxCycleToShow = Math.min(plan.total_slots, currentCycle + 5);

    for (let c = Math.max(1, currentCycle); c <= maxCycleToShow; c++) {
      // Sum allocations for this cycle and plan from this member
      const cycleAllocations = memberAllocations
        ?.filter((a) => a.cycle_number === c)
        .reduce((sum, a) => sum + parseFloat(String(a.amount_allocated)), 0) ?? 0;

      const cycleOutstanding = Math.max(0, memberCycleContribution - cycleAllocations);

      cycles.push({
        cycle_number: c,
        contribution: memberCycleContribution,
        paid: cycleAllocations,
        outstanding: cycleOutstanding,
      });
    }

    if (outstanding > 0 || cycles.some((c) => c.outstanding > 0)) {
      plans.push({
        plan_id: plan.id,
        plan_name: plan.name,
        contribution_amount: contributionAmount,
        total_slots: plan.total_slots,
        current_cycle: currentCycle,
        outstanding,
        cycles,
        slot_count: slotCount,
      });
    }
  }

  return NextResponse.json({ balance, plans });
}
