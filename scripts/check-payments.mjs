import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tylvqzkshfjnpzngkbpe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5bHZxemtzaGZqbnB6bmdrYnBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2Mzg2NTIsImV4cCI6MjA5NzIxNDY1Mn0.ZyRqX-vyXYchWLFp4xTUqbTUkW0fD0K5ag-hZ1erKRU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  // Sign in as the test admin user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'testadmin@crsapp.com',
    password: 'TestPass123!',
  });

  if (authError) {
    console.error('Auth error:', authError.message);
    process.exit(1);
  }

  console.log('Signed in as:', authData.user?.email);

  const PLAN_ID = '5de2f30e-9df2-493f-8c00-ec5e4e258725';

  // 1. Get plan details
  console.log('\n--- PLAN INFO ---');
  const { data: plan, error: planErr } = await supabase
    .from('plans')
    .select('*')
    .eq('id', PLAN_ID)
    .single();

  if (planErr) {
    console.error('Plan error:', planErr);
  } else {
    console.log('Plan:', plan.name);
    console.log('Contribution:', plan.contribution_amount);
    console.log('Total slots:', plan.total_slots);
    console.log('Start date:', plan.start_date);
  }

  // 2. Get plan members with member info
  console.log('\n--- PLAN MEMBERS ---');
  const { data: members, error: membersErr } = await supabase
    .from('plan_members')
    .select('*, members!inner(name, phone)')
    .eq('plan_id', PLAN_ID)
    .order('slot_number');

  if (membersErr) {
    console.error('Members error:', membersErr);
  } else {
    for (const m of members) {
      console.log(`Slot ${m.slot_number}: ${m.members.name} (member_id: ${m.member_id})`);
    }
  }

  // 3. Get all payments for this plan's members
  const memberIds = members?.map(m => m.member_id) || [];
  console.log('\n--- PAYMENTS ---');
  const { data: payments, error: payErr } = await supabase
    .from('payments')
    .select('*')
    .in('member_id', memberIds)
    .order('created_at');

  if (payErr) {
    console.error('Payments error:', payErr);
  } else {
    for (const p of payments) {
      console.log(`Payment ${p.id}: member_id=${p.member_id}, amount=${p.amount}, status=${p.status}, created=${p.created_at}`);
    }
  }

  // 4. Get payment allocations
  console.log('\n--- PAYMENT ALLOCATIONS ---');
  const paymentIds = payments?.map(p => p.id) || [];
  if (paymentIds.length > 0) {
    const { data: allocations, error: allocErr } = await supabase
      .from('payment_allocations')
      .select('*')
      .in('payment_id', paymentIds)
      .order('created_at');

    if (allocErr) {
      console.error('Allocations error:', allocErr);
    } else {
      for (const a of allocations) {
        console.log(`Alloc ${a.id}: payment_id=${a.payment_id}, plan_id=${a.plan_id}, member_id=${a.member_id}, cycle_number=${a.cycle_number}, amount=${a.amount}`);
      }
    }
  }

  console.log('\n--- DONE ---');
}

main().catch(console.error);
