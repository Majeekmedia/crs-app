import { createServerSupabase } from '@/lib/supabase';
import { formatCurrency, formatCycleDuration } from '@/lib/utils';
import Link from 'next/link';
import ConfirmDeleteButton from '@/components/plans/ConfirmDeleteButton';

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

      {/* Desktop Table */}
      <div className="hidden md:block bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-surface-container-highest">
              <th className="font-label-caps text-label-caps text-secondary py-md px-gutter uppercase">Plan Name</th>
              <th className="font-label-caps text-label-caps text-secondary py-md px-gutter uppercase">Contribution</th>
              <th className="font-label-caps text-label-caps text-secondary py-md px-gutter uppercase">Cycle</th>
              <th className="font-label-caps text-label-caps text-secondary py-md px-gutter uppercase">Members</th>
              <th className="font-label-caps text-label-caps text-secondary py-md px-gutter uppercase text-right">Total Expected</th>
              <th className="font-label-caps text-label-caps text-secondary py-md px-gutter uppercase text-right">Payout/Cycle</th>
              <th className="font-label-caps text-label-caps text-secondary py-md px-gutter uppercase text-center">Status</th>
              <th className="py-md px-gutter"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low">
            {plans.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-xl text-center text-secondary text-body-md">
                  No plans created yet.{" "}
                  <Link href="/plans/new" className="text-primary underline">Create your first plan</Link>
                </td>
              </tr>
            ) : (
              plans.map((plan) => {
                const memberCount = (plan.plan_members as unknown as { count: number }[])?.[0]?.count ?? 0;
                const totalExpected = plan.total_slots * parseFloat(String(plan.contribution_amount));
                const statusColor =
                  plan.status === 'active'
                    ? 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]'
                    : plan.status === 'paused'
                    ? 'bg-[#fffbeb] text-[#d97706] border-[#fde68a]'
                    : 'bg-surface-container-high text-secondary border-outline-variant';

                return (
                  <tr key={plan.id} className="hover:bg-surface-container-low transition-colors group cursor-pointer">
                    <td className="py-sm px-gutter">
                      <Link href={`/plans/${plan.id}`} className="block">
                        <div className="text-body-md font-medium text-on-surface">{plan.name}</div>
                      </Link>
                    </td>
                    <td className="py-sm px-gutter text-numeric-data text-on-surface">
                      {formatCurrency(plan.contribution_amount)}
                    </td>
                    <td className="py-sm px-gutter text-body-md text-on-surface">
                      {formatCycleDuration(plan)}
                    </td>
                    <td className="py-sm px-gutter text-numeric-data text-on-surface">{memberCount}</td>
                    <td className="py-sm px-gutter text-numeric-data text-on-surface text-right">
                      {formatCurrency(totalExpected)}
                    </td>
                    <td className="py-sm px-gutter text-numeric-data text-[#059669] text-right">
                      {formatCurrency(plan.payout_amount)}
                    </td>
                    <td className="py-sm px-gutter text-center">
                      <span className={`inline-flex items-center px-sm py-[2px] rounded-full text-label-caps border ${statusColor}`}>
                        {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-sm px-gutter text-right">
                      <div className="flex items-center justify-end gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/plans/${plan.id}`}
                          className="text-secondary hover:text-primary p-[4px] rounded hover:bg-surface-variant transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </Link>
                        <ConfirmDeleteButton planId={plan.id} iconOnly />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-sm">
        {plans.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg text-center text-secondary text-body-md">
            No plans created yet.{" "}
            <Link href="/plans/new" className="text-primary underline">Create your first plan</Link>
          </div>
        ) : (
          plans.map((plan) => {
            const memberCount = (plan.plan_members as unknown as { count: number }[])?.[0]?.count ?? 0;
            const totalExpected = plan.total_slots * parseFloat(String(plan.contribution_amount));
            const statusColors: Record<string, string> = {
              active: 'text-[#059669] bg-[#ecfdf5]',
              paused: 'text-[#d97706] bg-[#fffbeb]',
              completed: 'text-secondary bg-surface-container-high',
            };
            const statusClass = statusColors[plan.status] || 'text-secondary bg-surface-container-high';

            return (
              <div
                key={plan.id}
                className="block bg-surface-container-lowest border border-outline-variant rounded-xl p-md hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-center justify-between mb-sm">
                  <Link href={`/plans/${plan.id}`} className="text-body-md font-medium text-on-surface hover:text-primary transition-colors flex-1 min-w-0 truncate">
                    {plan.name}
                  </Link>
                  <div className="flex items-center gap-xs shrink-0 ml-sm">
                    <ConfirmDeleteButton planId={plan.id} iconOnly />
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${statusClass}`}>
                      {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                    </span>
                  </div>
                </div>
                <Link href={`/plans/${plan.id}`} className="block">
                  <div className="grid grid-cols-2 gap-x-md gap-y-1">
                    <div className="flex justify-between">
                      <span className="text-label-sm text-secondary">Contribution</span>
                      <span className="text-label-sm text-on-surface font-medium">{formatCurrency(plan.contribution_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-label-sm text-secondary">Cycle</span>
                      <span className="text-label-sm text-on-surface font-medium">{formatCycleDuration(plan)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-label-sm text-secondary">Members</span>
                      <span className="text-label-sm text-on-surface font-medium">{memberCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-label-sm text-secondary">Expected</span>
                      <span className="text-label-sm text-on-surface font-medium">{formatCurrency(totalExpected)}</span>
                    </div>
                    <div className="flex justify-between col-span-2 pt-xs border-t border-surface-variant mt-xs">
                      <span className="text-label-sm text-secondary">Payout/Cycle</span>
                      <span className="text-label-sm text-[#059669] font-medium">{formatCurrency(plan.payout_amount)}</span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
