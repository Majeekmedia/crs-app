'use server';

import { createServerSupabase } from './supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// ───────── AUTH ACTIONS ─────────

export async function signUp(formData: FormData) {
  const supabase = await createServerSupabase();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });
  if (error) throw new Error(error.message);

  revalidatePath('/', 'layout');

  // If a session was created immediately (email confirmation disabled),
  // go straight to dashboard instead of login page
  if (data.session) {
    redirect('/');
  } else {
    redirect('/auth/login?registered=true');
  }
}

export async function signIn(formData: FormData) {
  const supabase = await createServerSupabase();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectTo = (formData.get('redirect_to') as string) || '/';

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);

  revalidatePath('/', 'layout');
  redirect(redirectTo);
}

export async function signOut() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/auth/login');
}

// ───────── PLAN ACTIONS ─────────

export async function createPlan(formData: FormData) {
  const supabase = await createServerSupabase();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Not authenticated');

  const name = formData.get('name') as string;
  const contributionAmount = parseFloat(formData.get('contribution_amount') as string);
  const cycleDuration = formData.get('cycle_duration') as string;
  const cycleDaysStr = formData.get('cycle_days') as string;
  const cycleDays = cycleDaysStr ? parseInt(cycleDaysStr, 10) : null;
  const startDateStr = formData.get('start_date') as string;
  const startDate = startDateStr ? new Date(startDateStr).toISOString() : null;
  const payoutAmount = parseFloat(formData.get('payout_amount') as string);
  const totalSlots = parseInt(formData.get('total_slots') as string, 10);

  const { error } = await supabase.from('plans').insert({
    name,
    contribution_amount: contributionAmount,
    cycle_duration: cycleDuration,
    cycle_days: cycleDays,
    start_date: startDate,
    payout_amount: payoutAmount,
    total_slots: totalSlots,
    user_id: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath('/plans');
  redirect('/plans');
}

export async function updatePlan(formData: FormData) {
  const supabase = await createServerSupabase();
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const contributionAmount = parseFloat(formData.get('contribution_amount') as string);
  const cycleDuration = formData.get('cycle_duration') as string;
  const payoutAmount = parseFloat(formData.get('payout_amount') as string);
  const totalSlots = parseInt(formData.get('total_slots') as string, 10);
  const status = formData.get('status') as string;

  const { error } = await supabase
    .from('plans')
    .update({
      name,
      contribution_amount: contributionAmount,
      cycle_duration: cycleDuration,
      payout_amount: payoutAmount,
      total_slots: totalSlots,
      status,
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/plans');
  revalidatePath(`/plans/${id}`);
  redirect('/plans');
}

export async function deletePlan(id: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from('plans').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/plans');
}

// ───────── MEMBER ACTIONS ─────────

export async function createMember(formData: FormData) {
  const supabase = await createServerSupabase();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Not authenticated');

  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;

  const { error } = await supabase.from('members').insert({ name, phone, user_id: user.id });
  if (error) throw new Error(error.message);
  revalidatePath('/members');
  redirect('/members');
}

export async function updateMember(formData: FormData) {
  const supabase = await createServerSupabase();
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;

  const { error } = await supabase.from('members').update({ name, phone }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/members');
  redirect('/members');
}

export async function deleteMember(id: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from('members').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/members');
}

// ───────── PLAN-MEMBER ACTIONS ─────────

export async function assignMemberToPlan(formData: FormData) {
  const supabase = await createServerSupabase();
  const planId = formData.get('plan_id') as string;
  const memberId = formData.get('member_id') as string;
  const slotNumber = parseInt(formData.get('slot_number') as string, 10);

  const { error } = await supabase.from('plan_members').insert({
    plan_id: planId,
    member_id: memberId,
    slot_number: slotNumber,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/plans/${planId}`);
}

export async function removeMemberFromPlan(planMemberId: string, planId: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from('plan_members').delete().eq('id', planMemberId);
  if (error) throw new Error(error.message);
  revalidatePath(`/plans/${planId}`);
}

// ───────── PAYMENT ACTIONS ─────────

export async function recordPayment(formData: FormData) {
  const supabase = await createServerSupabase();
  const memberId = formData.get('member_id') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const notes = formData.get('notes') as string;

  const { data, error } = await supabase
    .from('payments')
    .insert({
      member_id: memberId,
      amount,
      status: 'unallocated',
      notes: notes || null,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/payments');
  revalidatePath('/');
  redirect(`/payments`);
}

export async function deletePayment(id: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from('payments').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/payments');
  revalidatePath('/');
}

// ───────── PAYOUT ACTIONS ─────────

export async function processPayout(formData: FormData) {
  const supabase = await createServerSupabase();
  const planId = formData.get('plan_id') as string;
  const memberId = formData.get('member_id') as string;
  const cycleNumber = parseInt(formData.get('cycle_number') as string, 10);
  const amount = parseFloat(formData.get('amount') as string);

  const { error } = await supabase.from('payouts').insert({
    plan_id: planId,
    member_id: memberId,
    cycle_number: cycleNumber,
    amount,
    status: 'completed',
    paid_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/plans/${planId}`);
}

export async function completePayout(payoutId: string, planId: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from('payouts')
    .update({ status: 'completed', paid_at: new Date().toISOString() })
    .eq('id', payoutId);

  if (error) throw new Error(error.message);
  revalidatePath(`/plans/${planId}`);
}

export async function startNextCycle(planId: string) {
  const supabase = await createServerSupabase();

  const { data: plan } = await supabase
    .from('plans')
    .select('current_cycle')
    .eq('id', planId)
    .single();

  if (!plan) throw new Error('Plan not found');

  const nextCycle = (plan.current_cycle || 1) + 1;

  const { error } = await supabase
    .from('plans')
    .update({ current_cycle: nextCycle })
    .eq('id', planId);

  if (error) throw new Error(error.message);
  revalidatePath(`/plans/${planId}`);
}
