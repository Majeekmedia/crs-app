'use client';

import { useState } from 'react';
import { formatCurrency, getInitials } from '@/lib/utils';
import Link from 'next/link';
import { deleteMember } from '@/lib/server-actions';
import Pagination from '@/components/Pagination';

interface Member {
  id: string;
  name: string;
  phone: string | null;
  totalContributed: number;
  activePlans: number;
}

export default function MembersListClient({ members }: { members: Member[] }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(search.toLowerCase())
  );

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const paginatedMembers = filteredMembers.slice((page - 1) * pageSize, page * pageSize);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <>
      {/* Search Bar */}
      <div className="mb-md">
        <div className="relative max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
            <span className="material-symbols-outlined text-[18px]">search</span>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
          {search && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
              aria-label="Clear search"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Desktop Members Table */}
      <div className="hidden md:block bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface text-label-caps text-on-surface-variant border-b border-surface-container-high">
            <tr>
              <th className="px-md py-sm font-semibold tracking-wider w-1/4">Member Info</th>
              <th className="px-md py-sm font-semibold tracking-wider">Phone Number</th>
              <th className="px-md py-sm font-semibold tracking-wider text-center">Active Plans</th>
              <th className="px-md py-sm font-semibold tracking-wider text-right">Total Contributed</th>
              <th className="px-md py-sm w-12 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high">
            {paginatedMembers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-xl text-center text-on-surface-variant text-body-md">
                  {search ? 'No members match your search.' : 'No members yet. '}
                  {!search && <Link href="/members/new" className="text-primary underline">Add your first member</Link>}
                </td>
              </tr>
            ) : (
              paginatedMembers.map((member) => (
                <tr key={member.id} className="hover:bg-surface-container-low transition-colors group cursor-pointer">
                  <td className="px-md py-sm">
                    <div className="flex items-center gap-sm">
                      <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-label-caps text-on-surface-variant font-medium">
                        {getInitials(member.name)}
                      </div>
                      <div>
                        <div className="text-body-md font-medium text-on-surface">{member.name}</div>
                        <div className="text-label-caps text-on-surface-variant mt-0.5">ID: {member.id.slice(0, 8).toUpperCase()}</div>
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
                          className="text-on-surface-variant hover:text-primary p-0.5 rounded hover:bg-surface-variant transition-colors"
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
                          className="text-on-surface-variant hover:text-error p-1 rounded hover:bg-surface-variant transition-colors"
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
        {paginatedMembers.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg text-center text-on-surface-variant text-body-md">
            {search ? 'No members match your search.' : 'No members yet. '}
            {!search && <Link href="/members/new" className="text-primary underline">Add your first member</Link>}
          </div>
        ) : (
          paginatedMembers.map((member) => (
            <div key={member.id} className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md">
              <div className="flex items-center justify-between mb-sm">
                <div className="flex items-center gap-sm">
                  <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-label-caps text-on-surface-variant font-medium">
                    {getInitials(member.name)}
                  </div>
                  <div>
                    <div className="text-body-md font-medium text-on-surface">{member.name}</div>
                    <div className="text-label-sm text-on-surface-variant">ID: {member.id.slice(0, 8).toUpperCase()}</div>
                  </div>
                </div>
                <form action={deleteMember.bind(null, member.id)}>
                  <button type="submit" className="text-on-surface-variant hover:text-error p-1 rounded hover:bg-surface-variant transition-colors">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </form>
              </div>
              <div className="grid grid-cols-2 gap-x-md gap-y-1 pt-sm border-t border-surface-variant">
                <div className="flex justify-between">
                  <span className="text-label-sm text-on-surface-variant">Phone</span>
                  <span className="text-label-sm text-on-surface font-medium">
                    {member.phone ? (
                      <span className="inline-flex items-center gap-1">
                        {member.phone}
                        <a
                          href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Dear ${member.name}, this is a reminder about your contribution. Please make your payment at your earliest convenience. Thank you.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-on-surface-variant hover:text-primary"
                          title="Send WhatsApp reminder"
                        >
                          <span className="material-symbols-outlined text-[14px]">chat</span>
                        </a>
                      </span>
                    ) : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-label-sm text-on-surface-variant">Active Plans</span>
                  <span className="inline-flex items-center justify-center bg-surface-variant text-on-surface-variant text-numeric-data rounded-full px-2 py-0.5 text-[12px] font-medium">
                    {member.activePlans}
                  </span>
                </div>
                <div className="flex justify-between col-span-2 pt-xs border-t border-surface-variant mt-xs">
                  <span className="text-label-sm text-on-surface-variant">Total Contributed</span>
                  <span className="text-label-sm text-on-surface font-medium">{formatCurrency(member.totalContributed)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </>
  );
}
