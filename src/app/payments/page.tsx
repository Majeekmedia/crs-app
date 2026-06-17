import { createServerSupabase } from '@/lib/supabase';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import Link from 'next/link';
import { deletePayment } from '@/lib/server-actions';
import AllocationModal from '@/components/payments/AllocationModal';

export const dynamic = 'force-dynamic';

async function getPayments() {
  const supabase = await createServerSupabase();

  const { data: payments } = await supabase
    .from('payments')
    .select('*, members(name), payment_allocations(amount_allocated)')
    .order('received_at', { ascending: false });

  return payments ?? [];
}

async function getMetrics() {
  const supabase = await createServerSupabase();

  const { data: payments } = await supabase.from('payments').select('amount, status');

  if (!payments) return { totalReceived: 0, unallocatedFunds: 0, allocatedPct: 0 };

  const totalReceived = payments.reduce((sum, p) => sum + parseFloat(String(p.amount)), 0);
  const unallocatedFunds = payments
    .filter((p) => p.status === 'unallocated')
    .reduce((sum, p) => sum + parseFloat(String(p.amount)), 0);
  const allocatedPct = totalReceived > 0 ? ((totalReceived - unallocatedFunds) / totalReceived) * 100 : 0;

  return { totalReceived, unallocatedFunds, allocatedPct };
}

export default async function PaymentsPage() {
  const [payments, metrics] = await Promise.all([getPayments(), getMetrics()]);

  return (
    <>
      {/* Page Header */}
      <div className="flex justify-between items-end mb-xl">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-background">Payments Log</h2>
          <p className="font-body-md text-body-md text-secondary">Review and allocate incoming member funds.</p>
        </div>
        <div className="flex gap-md">
          <Link
            href="/payments/new"
            className="px-md py-sm rounded-md bg-primary text-on-primary hover:bg-primary-container transition-colors flex items-center gap-xs font-medium shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Log Payment
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-gutter mb-xl">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg">
          <p className="font-label-caps text-label-caps text-secondary mb-sm uppercase">Total Received</p>
          <p className="font-display text-[32px] leading-[40px] font-semibold text-on-surface tracking-tight">
            {formatCurrency(metrics.totalReceived)}
          </p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg">
          <p className="font-label-caps text-label-caps text-secondary mb-sm uppercase">Unallocated Funds</p>
          <p className="font-display text-[32px] leading-[40px] font-semibold text-on-surface tracking-tight">
            {formatCurrency(metrics.unallocatedFunds)}
          </p>
          <p className="text-body-md text-secondary mt-xs flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px] text-primary">warning</span>
            Requires attention
          </p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg flex flex-col justify-center items-start">
          <p className="font-label-caps text-label-caps text-secondary mb-sm uppercase">Allocation Rate</p>
          <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden mb-xs">
            <div
              className="bg-primary h-full rounded-full"
              style={{ width: `${metrics.allocatedPct}%` }}
            ></div>
          </div>
          <p className="text-body-md text-on-surface">{Math.round(metrics.allocatedPct)}% of deposits allocated.</p>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
        <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface">
          <h3 className="font-headline-md text-headline-md text-on-surface">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-bright">
                <th className="px-lg py-sm font-label-caps text-label-caps text-secondary uppercase tracking-wider">Member Name</th>
                <th className="px-lg py-sm font-label-caps text-label-caps text-secondary uppercase tracking-wider">Amount Received</th>
                <th className="px-lg py-sm font-label-caps text-label-caps text-secondary uppercase tracking-wider">Date</th>
                <th className="px-lg py-sm font-label-caps text-label-caps text-secondary uppercase tracking-wider">Allocation Status</th>
                <th className="px-lg py-sm"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-xl text-center text-secondary text-body-md">
                    No payments recorded yet.{" "}
                    <Link href="/payments/new" className="text-primary underline">Record a payment</Link>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const memberName = (payment.members as unknown as { name: string })?.name ?? 'Unknown';
                  const isUnallocated = payment.status === 'unallocated';

                  return (
                    <tr key={payment.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="px-lg py-md flex items-center gap-sm">
                        <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-[12px]">
                          {getInitials(memberName)}
                        </div>
                        <span className="text-body-md text-on-surface font-medium">{memberName}</span>
                      </td>
                      <td className="px-lg py-md text-numeric-data text-on-surface">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-lg py-md text-numeric-data text-secondary">
                        {formatDate(payment.received_at)}
                      </td>
                      <td className="px-lg py-md">
                        {isUnallocated ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-surface-variant text-on-surface-variant text-label-caps font-bold border border-outline-variant">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary mr-1.5"></span>
                            Unallocated
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-secondary-container text-on-secondary-container text-label-caps font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5"></span>
                            Allocated
                          </span>
                        )}
                      </td>
                      <td className="px-lg py-sm">
                        <div className="flex items-center gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          {isUnallocated && (
                            <Link
                              href={`/payments?allocate=${payment.id}`}
                              className="text-primary hover:underline text-body-md"
                            >
                              Allocate
                            </Link>
                          )}
                          <form action={deletePayment.bind(null, payment.id)}>
                            <button
                              type="submit"
                              className="text-secondary hover:text-error p-1 rounded hover:bg-surface-variant transition-colors"
                              onClick={(e) => {
                                if (!confirm('Delete this payment?')) e.preventDefault();
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
