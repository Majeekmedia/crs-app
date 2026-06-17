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

    // Get the payment
    const { data: payment } = await supabase
      .from('payments')
      .select('amount')
      .eq('id', paymentId)
      .single();

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Save each allocation
    let totalAllocated = 0;

    for (const alloc of allocations) {
      const { error } = await supabase.from('payment_allocations').insert({
        payment_id: paymentId,
        plan_id: alloc.plan_id,
        amount_allocated: alloc.amount_allocated,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      totalAllocated += alloc.amount_allocated;
    }

    // Update payment status
    const paymentAmount = parseFloat(String(payment.amount));
    const newStatus = totalAllocated >= paymentAmount ? 'allocated' : 'partial';

    await supabase.from('payments').update({ status: newStatus }).eq('id', paymentId);

    revalidatePath('/payments');
    revalidatePath('/');
    revalidatePath('/reconciliation');

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
