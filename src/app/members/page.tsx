import { createServerSupabase } from '@/lib/supabase';
import { formatCurrency, getInitials } from '@/lib/utils';
import Link from 'next/link';
import { deleteMember } from '@/lib/server-actions';

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
    const totalContributed = (m.payments as unknown as { amount: number }[])?.
      reduce((sum, p) => sum + parseFloat(String(p.amount)), 0) ?? 0;
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

      {/* Desktop Members Table */}
      <div className="hidden md:block bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface text-label-caps text-secondary border-b border-surface-container-high">
            <tr>
              <th className="px-md py-sm font-semibold tracking-wider w-1/4">Member Info</th>
              <th className="px-md py-sm font-semibold tracking-wider">Phone Number</th>
              <th className="px-md py-sm font-semibold tracking-wider text-center">Active Plans</th>
              <th className="px-md py-sm font-semibold tracking-wider text-right">Total Contributed</th>
              <th className="px-md py-sm w-12 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high">
            {members.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-xl text-center text-secondary text-body-md">
                  No members yet.{" "}
                  <Link href="/members/new" className="text-primary underline">Add your first member</Link>
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className="hover:bg-surface-container-low transition-colors group cursor-pointer">
                  <td className="px-md py-sm">
                    <div className="flex items-center gap-sm">
                      <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-label-caps text-on-surface-variant font-medium">
                        {getInitials(member.name)}
                      </div>
                      <div>
                        <div className="text-body-md font-medium text-on-surface">{member.name}</div>
                        <div className="text-label-caps text-secondary mt-0.5">ID: {member.id.slice(0, 8).toUpperCase()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-md py-sm text-numeric-data text-on-surface-variant">
                    {member.phone ? (
                      <div className="flex items-center gap-1">
                        <span>{member.phone}</span>
                        <a
                          href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Dear ${member.name}, this is a reminder about your contribution. Please make your payment at your earliest convenience. Thank you.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-secondary hover:text-primary p-0.5 rounded hover:bg-surface-variant transition-colors"
                          title="Send WhatsApp reminder"
                        >
                          <span className="material-symbols-outlined text-[16px]">chat</span>
                        </a>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-md py-sm text-center">
                    <span className="inline-flex items-center justify-center bg-surface-variant text-on-surface-variant text-numeric-data rounded-full px-2.5 py-0.5 min-w-[24px]">
                      {member.activePlans}
                    </span>
                  </td>
                  <td className="px-md py-sm text-right text-numeric-data text-on-surface">
                    {formatCurrency(member.totalContributed)}
                  </td>
                  <td className="px-md py-sm text-center">
                    <div className="flex items-center justify-end gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      <form action={deleteMember.bind(null, member.id)}>
                        <button
                          type="submit"
                          className="text-secondary hover:text-error p-1 rounded hover:bg-surface-variant transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Member Cards */}
      <div className="md:hidden space-y-sm">
        {members.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg text-center text-secondary text-body-md">
            No members yet.{" "}
            <Link href="/members/new" className="text-primary underline">Add your first member</Link>
          </div>
        ) : (
          members.map((member) => (
            <div key={member.id} className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md">
              <div className="flex items-center justify-between mb-sm">
                <div className="flex items-center gap-sm">
                  <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-label-caps text-on-surface-variant font-medium">
                    {getInitials(member.name)}
                  </div>
                  <div>
                    <div className="text-body-md font-medium text-on-surface">{member.name}</div>
                    <div className="text-label-sm text-secondary">ID: {member.id.slice(0, 8).toUpperCase()}</div>
                  </div>
                </div>
                <form action={deleteMember.bind(null, member.id)}>
                  <button type="submit" className="text-secondary hover:text-error p-1 rounded hover:bg-surface-variant transition-colors">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </form>
              </div>
              <div className="grid grid-cols-2 gap-x-md gap-y-1 pt-sm border-t border-surface-variant">
                <div className="flex justify-between">
                  <span className="text-label-sm text-secondary">Phone</span>
                  <span className="text-label-sm text-on-surface font-medium">
                    {member.phone ? (
                      <span className="inline-flex items-center gap-1">
                        {member.phone}
                        <a
                          href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Dear ${member.name}, this is a reminder about your contribution. Please make your payment at your earliest convenience. Thank you.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-secondary hover:text-primary"
                          title="Send WhatsApp reminder"
                        >
                          <span className="material-symbols-outlined text-[14px]">chat</span>
                        </a>
                      </span>
                    ) : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-label-sm text-secondary">Active Plans</span>
                  <span className="inline-flex items-center justify-center bg-surface-variant text-on-surface-variant text-numeric-data rounded-full px-2 py-0.5 text-[12px] font-medium">
                    {member.activePlans}
                  </span>
                </div>
                <div className="flex justify-between col-span-2 pt-xs border-t border-surface-variant mt-xs">
                  <span className="text-label-sm text-secondary">Total Contributed</span>
                  <span className="text-label-sm text-on-surface font-medium">{formatCurrency(member.totalContributed)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
