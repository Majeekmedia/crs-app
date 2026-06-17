import { createServerSupabase } from './supabase';

/**
 * Allocation Engine - Core Business Logic
 *
 * When a payment is recorded, this engine:
 * 1. Fetches all active plans for the member
 * 2. Determines unpaid obligations per plan
 * 3. Allocates payment in priority order (oldest due plan first)
 * 4. Splits amount across plans if needed
 * 5. Persists allocation records
 */

interface AllocationResult {
  success: boolean;
  message: string;
  allocations: { plan_id: string; plan_name: string; amount: number }[];
  remaining: number;
}

export async function allocatePayment(
  paymentId: string,
  memberId: string
): Promise<AllocationResult> {
  const supabase = await createServerSupabase();

  // 1. Get the payment
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single();

  if (paymentError || !payment) {
    return { success: false, message: 'Payment not found', allocations: [], remaining: 0 };
  }

  let remainingAmount = parseFloat(payment.amount);
  const allocations: { plan_id: string; plan_name: string; amount: number }[] = [];

  // 2. Get all active plans for the member with their slot info
  const { data: planMembers, error: planMemberError } = await supabase
    .from('plan_members')
    .select(`
      plan_id,
      plans!inner (
        id,
        name,
        contribution_amount,
        status
      )
    `)
    .eq('member_id', memberId)
    .eq('plans.status', 'active');

  if (planMemberError) {
    return { success: false, message: 'Error fetching member plans', allocations: [], remaining: 0 };
  }

  if (!planMembers || planMembers.length === 0) {
    return {
      success: false,
      message: 'Member has no active plans',
      allocations: [],
      remaining: remainingAmount,
    };
  }

  // 3. For each plan, determine the outstanding balance
  // We calculate: (contribution_amount * total_slots) - total_allocated_to_plan
  for (const pm of planMembers) {
    if (remainingAmount <= 0) break;

    const plan = pm.plans as unknown as {
      id: string;
      name: string;
      contribution_amount: number;
      status: string;
    };

    // Get total allocated to this plan so far
    const { data: allocatedData } = await supabase
      .from('payment_allocations')
      .select('amount_allocated')
      .eq('plan_id', plan.id);

    const totalAllocated = allocatedData?.reduce(
      (sum, a) => sum + parseFloat(a.amount_allocated as unknown as string),
      0
    ) ?? 0;

    // Get total expected for this plan
    const { data: planData } = await supabase
      .from('plans')
      .select('total_slots, contribution_amount')
      .eq('id', plan.id)
      .single();

    const totalExpected =
      (planData?.total_slots ?? 0) * parseFloat(String(planData?.contribution_amount ?? 0));
    const outstanding = totalExpected - totalAllocated;

    if (outstanding <= 0) continue;

    // Allocate to this plan
    const allocationAmount = Math.min(remainingAmount, outstanding);
    remainingAmount -= allocationAmount;

    // Check if member already has an allocation for this plan from this payment
    const { data: existingAllocation } = await supabase
      .from('payment_allocations')
      .select('id, amount_allocated')
      .eq('payment_id', paymentId)
      .eq('plan_id', plan.id)
      .single();

    if (existingAllocation) {
      // Update existing allocation
      const newAmount = parseFloat(existingAllocation.amount_allocated as unknown as string) + allocationAmount;
      await supabase
        .from('payment_allocations')
        .update({ amount_allocated: newAmount })
        .eq('id', existingAllocation.id);
    } else {
      // Create new allocation
      await supabase.from('payment_allocations').insert({
        payment_id: paymentId,
        plan_id: plan.id,
        amount_allocated: allocationAmount,
      });
    }

    allocations.push({
      plan_id: plan.id,
      plan_name: plan.name,
      amount: allocationAmount,
    });
  }

  // 4. Update payment status
  const newStatus = remainingAmount <= 0 ? 'allocated' : 'partial';
  await supabase
    .from('payments')
    .update({ status: newStatus })
    .eq('id', paymentId);

  return {
    success: true,
    message:
      remainingAmount <= 0
        ? 'Payment fully allocated'
        : `Payment partially allocated. $${remainingAmount.toFixed(2)} remaining.`,
    allocations,
    remaining: remainingAmount,
  };
}

/**
 * Calculate outstanding balance for a plan
 */
export async function getPlanOutstanding(planId: string): Promise<number> {
  const supabase = await createServerSupabase();

  // Get plan details
  const { data: plan } = await supabase
    .from('plans')
    .select('total_slots, contribution_amount')
    .eq('id', planId)
    .single();

  if (!plan) return 0;

  const totalExpected = plan.total_slots * parseFloat(String(plan.contribution_amount));

  // Get total allocated
  const { data: allocations } = await supabase
    .from('payment_allocations')
    .select('amount_allocated')
    .eq('plan_id', planId);

  const totalAllocated =
    allocations?.reduce(
      (sum, a) => sum + parseFloat(a.amount_allocated as unknown as string),
      0
    ) ?? 0;

  return totalExpected - totalAllocated;
}

/**
 * Get member's outstanding obligations across all active plans
 */
export async function getMemberOutstanding(memberId: string) {
  const supabase = await createServerSupabase();

  const { data: planMembers } = await supabase
    .from('plan_members')
    .select(`
      plan_id,
      plans (id, name, contribution_amount, status)
    `)
    .eq('member_id', memberId);

  if (!planMembers) return [];

  const results = [];

  for (const pm of planMembers) {
    const plan = pm.plans as unknown as {
      id: string;
      name: string;
      contribution_amount: number;
      status: string;
    };

    if (plan.status !== 'active') continue;

    const outstanding = await getPlanOutstanding(plan.id);
    results.push({
      plan_id: plan.id,
      plan_name: plan.name,
      contribution_amount: plan.contribution_amount,
      outstanding,
    });
  }

  return results;
}
