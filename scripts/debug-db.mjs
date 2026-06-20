import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tylvqzkshfjnpzngkbpe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5bHZxemtzaGZqbnB6bmdrYnBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2Mzg2NTIsImV4cCI6MjA5NzIxNDY1Mn0.ZyRqX-vyXYchWLFp4xTUqbTUkW0fD0K5ag-hZ1erKRU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'majeekmediaconcept@gmail.com',
    password: 'mypassword',
  });

  if (authError) {
    console.error('Auth error:', authError.message);
    process.exit(1);
  }

  console.log('Signed in as:', authData.user?.email);

  // 1. Check Favy's balance
  const { data: favy } = await supabase
    .from('members')
    .select('id, name, balance')
    .eq('name', 'Favy')
    .single();
  console.log('\nFavy:', JSON.stringify(favy));

  // 2. All allocations with payment details for the plan
  const { data: allocDetails } = await supabase
    .from('payment_allocations')
    .select(`
      id, payment_id, plan_id, amount_allocated, cycle_number, created_at,
      payments!inner(id, member_id, amount, status)
    `)
    .eq('plan_id', '5de2f30e-9df2-493f-8c00-ec5e4e258725')
    .order('created_at');
  
  console.log('\nAll allocations with payment details:');
  for (const a of allocDetails || []) {
    console.log(`  ${a.id.substring(0,8)}: payment=${a.payment_id.substring(0,8)} member=${a.payments.member_id.substring(0,8)} amt=${a.amount_allocated} cycle=${a.cycle_number} created=${a.created_at}`);
  }

  // 3. Simulate what member-outstanding API returns for Favy
  console.log('\n--- Member-Outstanding Simulation for Favy ---');
  
  const { data: allAllocs } = await supabase
    .from('payment_allocations')
    .select('amount_allocated, cycle_number')
    .eq('plan_id', '5de2f30e-9df2-493f-8c00-ec5e4e258725');
  
  const totalAllocated = allAllocs?.reduce((sum, a) => sum + parseFloat(String(a.amount_allocated)), 0) ?? 0;
  const totalExpected = 10 * 2200;
  console.log('Total allocated to plan:', totalAllocated, '/', totalExpected);

  // Favy's allocations via payments
  const { data: favyAllocs } = await supabase
    .from('payment_allocations')
    .select('amount_allocated, cycle_number, payments!inner(member_id)')
    .eq('plan_id', '5de2f30e-9df2-493f-8c00-ec5e4e258725')
    .eq('payments.member_id', favy?.id);
  
  console.log('\nFavy cycle status (1 slot x 2200 = 2200/cycle):');
  const memberCycleContribution = 2200;
  const cycleTotals = {};
  for (const a of favyAllocs || []) {
    cycleTotals[a.cycle_number] = (cycleTotals[a.cycle_number] || 0) + parseFloat(String(a.amount_allocated));
  }
  for (let c = 1; c <= 10; c++) {
    const paid = cycleTotals[c] || 0;
    const outstanding = Math.max(0, memberCycleContribution - paid);
    const status = paid >= memberCycleContribution ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'UNPAID');
    console.log(`  Cycle ${c}: paid=${paid}, outstanding=${outstanding} [${status}]`);
  }

  // 4. Cynthia's cycle status
  const { data: cynthia } = await supabase
    .from('members')
    .select('id, name, balance')
    .eq('name', 'Cynthia')
    .single();
  console.log('\nCynthia:', JSON.stringify(cynthia));

  const { data: cynthiaAllocs } = await supabase
    .from('payment_allocations')
    .select('amount_allocated, cycle_number, payments!inner(member_id)')
    .eq('plan_id', '5de2f30e-9df2-493f-8c00-ec5e4e258725')
    .eq('payments.member_id', cynthia?.id);
  
  console.log('\nCynthia cycle status (2 slots x 2200 = 4400/cycle):');
  const cynthiaCycleContribution = 4400;
  const cynthiaCycleTotals = {};
  for (const a of cynthiaAllocs || []) {
    cynthiaCycleTotals[a.cycle_number] = (cynthiaCycleTotals[a.cycle_number] || 0) + parseFloat(String(a.amount_allocated));
  }
  for (let c = 1; c <= 10; c++) {
    const paid = cynthiaCycleTotals[c] || 0;
    const outstanding = Math.max(0, cynthiaCycleContribution - paid);
    const status = paid >= cynthiaCycleContribution ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'UNPAID');
    console.log(`  Cycle ${c}: paid=${paid}, outstanding=${outstanding} [${status}]`);
  }

  console.log('\n--- DONE ---');
}

main().catch(console.error);
