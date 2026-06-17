import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const memberId = request.nextUrl.searchParams.get('memberId');

  if (!memberId) {
    return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
  }

  const supabase = await createServerSupabase();

  // Get member's active plans
  const { data: planMembers } = await supabase
    .from('plan_members')
    .select(`
      plan_id,
      plans!inner (id, name, contribution_amount, status, total_slots)
    `)
    .eq('member_id', memberId)
    .eq('plans.status', 'active');

  if (!planMembers) {
    return NextResponse.json([]);
  }

  const results = [];

  for (const pm of planMembers) {
    const plan = pm.plans as unknown as {
      id: string;
      name: string;
      contribution_amount: number;
      status: string;
      total_slots: number;
    };

    const totalExpected = plan.total_slots * parseFloat(String(plan.contribution_amount));

    const { data: allocations } = await supabase
      .from('payment_allocations')
      .select('amount_allocated')
      .eq('plan_id', plan.id);

    const totalAllocated =
      allocations?.reduce((sum, a) => sum + parseFloat(String(a.amount_allocated)), 0) ?? 0;

    const outstanding = totalExpected - totalAllocated;

    if (outstanding > 0) {
      results.push({
        plan_id: plan.id,
        plan_name: plan.name,
        contribution_amount: parseFloat(String(plan.contribution_amount)),
        outstanding,
      });
    }
  }

  return NextResponse.json(results);
}
