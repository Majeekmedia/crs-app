import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const { paymentId, allocations } = await request.json();

    if (!paymentId || !allocations || !Array.isArray(allocations) || allocations.length === 0) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const supabase = await createServerSupabase();

    // Get the payment with member info
    const { data: payment } = await supabase
      .from('payments')
      .select('amount, member_id')
      .eq('id', paymentId)
      .single();

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const memberId = payment.member_id;

    // Save each allocation and track overpayments
    let totalAllocated = 0;
    let excessToBalance = 0;

    for (const alloc of allocations) {
      let amountToAllocate = alloc.amount_allocated;

      // If cycle_number is provided, check if this would exceed the contribution amount
      if (alloc.cycle_number && alloc.plan_id) {
        const { data: plan } = await supabase
          .from('plans')
          .select('contribution_amount')
          .eq('id', alloc.plan_id)
          .single();

        if (plan) {
          const contribution = parseFloat(String(plan.contribution_amount));

          // Count how many slots this member has in this plan
          // (so we can allow up to slotCount × contribution_amount per cycle)
          const { count: slotCount } = await supabase
            .from('plan_members')
            .select('*', { count: 'exact', head: true })
            .eq('plan_id', alloc.plan_id)
            .eq('member_id', memberId);

          const perCycleLimit = contribution * Math.max(1, slotCount ?? 1);

          // Get existing allocations for this cycle from this member only
          const { data: existingAllocations } = await supabase
            .from('payment_allocations')
            .select('amount_allocated, payments!inner(member_id)')
            .eq('plan_id', alloc.plan_id)
            .eq('cycle_number', alloc.cycle_number)
            .eq('payments.member_id', memberId);

          const existingTotal = existingAllocations
            ?.reduce((sum, a) => sum + parseFloat(String(a.amount_allocated)), 0) ?? 0;

          const newTotal = existingTotal + amountToAllocate;
          if (newTotal > perCycleLimit) {
            // Excess beyond contribution: put the extra into member balance
            const excess = newTotal - perCycleLimit;
            excessToBalance += excess;
            amountToAllocate -= excess;
          }

          // Guard: skip allocation if amount would be zero or negative
          // (e.g. when existing allocations already meet the per-cycle limit)
          if (amountToAllocate <= 0) {
            continue;
          }
        }
      }

      const { error } = await supabase.from('payment_allocations').insert({
        payment_id: paymentId,
        plan_id: alloc.plan_id,
        amount_allocated: amountToAllocate,
        cycle_number: alloc.cycle_number ?? null,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      totalAllocated += amountToAllocate;
    }

    // Add excess to member's balance
    if (excessToBalance > 0) {
      const { data: member } = await supabase
        .from('members')
        .select('balance')
        .eq('id', memberId)
        .single();

      const currentBalance = parseFloat(String(member?.balance ?? 0));
      await supabase
        .from('members')
        .update({ balance: currentBalance + excessToBalance })
        .eq('id', memberId);
    }

    // Update payment status
    const paymentAmount = parseFloat(String(payment.amount));
    const newStatus = totalAllocated >= paymentAmount ? 'allocated' : 'partial';

    await supabase.from('payments').update({ status: newStatus }).eq('id', paymentId);

    revalidatePath('/payments');
    revalidatePath('/');
    revalidatePath('/reconciliation');

    return NextResponse.json({
      success: true,
      status: newStatus,
      excess_credited: excessToBalance > 0 ? excessToBalance : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
