import { createServerSupabase } from '@/lib/supabase';
import { formatCurrency, cycleLabels } from '@/lib/utils';
import Link from 'next/link';
import { deletePlan } from '@/lib/server-actions';

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

      {/* Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
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
                          <div className="text-body-md text-secondary text-[12px]">ID: {plan.id.slice(0, 8).toUpperCase()}</div>
                        </Link>
                      </td>
                      <td className="py-sm px-gutter text-numeric-data text-on-surface">
                        {formatCurrency(plan.contribution_amount)}
                      </td>
                      <td className="py-sm px-gutter text-body-md text-on-surface">
                        {cycleLabels[plan.cycle_duration] || plan.cycle_duration}
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
                          <form action={deletePlan.bind(null, plan.id)}>
                            <button
                              type="submit"
                              className="text-secondary hover:text-error p-[4px] rounded hover:bg-surface-variant transition-colors"
                              onClick={(e) => {
                                if (!confirm('Delete this plan? This cannot be undone.')) {
                                  e.preventDefault();
                                }
                              }}
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
