import { createServerSupabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import MembersListClient from '@/components/members/MembersListClient';

export const dynamic = 'force-dynamic';

async function getMembers() {
  const supabase = await createServerSupabase();

  const { data: members } = await supabase
    .from('members')
    .select(`
      *,
      plan_members(count),
      payments(amount)
    `)
    .order('name');

  if (!members) return [];

  return members.map((m) => {
    const totalContributed = (m.payments as unknown as { amount: number }[])?.reduce((sum, p) => sum + parseFloat(String(p.amount)), 0) ?? 0;
    const activePlans = (m.plan_members as unknown as { count: number }[])?.[0]?.count ?? 0;

    return {
      ...m,
      totalContributed,
      activePlans,
    };
  });
}

export default async function MembersPage() {
  const members = await getMembers();

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-xl">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Members Directory</h2>
          <p className="font-body-md text-body-md text-secondary">Manage registered members, their active plans, and financial standing.</p>
        </div>
        <div className="flex items-center gap-sm">
          <Link
            href="/members/new"
            className="bg-primary text-on-primary text-body-md px-4 py-2 rounded-lg hover:bg-primary-container transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            New Member
          </Link>
        </div>
      </div>

      <MembersListClient members={members} />
    </>
  );
}
