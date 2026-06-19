import { createServerSupabase } from '@/lib/supabase';
import Link from 'next/link';
import PlansListClient from '@/components/plans/PlansListClient';

export const dynamic = 'force-dynamic';

async function getPlans() {
  const supabase = await createServerSupabase();
  const { data: plans } = await supabase
    .from('plans')
    .select('*, plan_members(count)')
    .order('created_at', { ascending: false });

  return plans ?? [];
}

export default async function PlansPage() {
  const plans = await getPlans();

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-xl">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Contribution Plans</h2>
          <p className="font-body-md text-body-md text-secondary">Manage and monitor all active and upcoming financial contribution cycles.</p>
        </div>
        <Link
          href="/plans/new"
          className="bg-primary text-on-primary text-body-md font-medium py-sm px-lg rounded-full hover:bg-on-surface-variant transition-colors flex items-center justify-center gap-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Create New Plan
        </Link>
      </div>

      <PlansListClient plans={plans} />
    </>
  );
}
