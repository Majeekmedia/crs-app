import { createServerSupabase } from '@/lib/supabase';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import Link from 'next/link';
import AllocationModal from '@/components/payments/AllocationModal';
import AllocationModalWrapper from '@/components/payments/AllocationModalWrapper';
import ConfirmDeletePayment from '@/components/payments/ConfirmDeletePayment';
import ViewNoteButton from '@/components/payments/ViewNoteButton';

export const dynamic = 'force-dynamic';

async function getPayments() {
  const supabase = await createServerSupabase();

  const { data: payments } = await supabase
    .from('payments')
    .select('*, members(id, name), payment_allocations(amount_allocated, cycle_number)')
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

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ allocate?: string }>;
}) {
  const [payments, metrics] = await Promise.all([getPayments(), getMetrics()]);
  const params = await searchParams;

  // Find payment to allocate if allocate param is present
  const allocatePaymentId = params.allocate;
  const allocatePayment = allocatePaymentId
    ? payments.find((p) => p.id === allocatePaymentId)
    : null;

  const allocateMember = allocatePayment
    ? (allocatePayment.members as unknown as { id: string; name: string })
    : null;

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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-gutter mb-xl">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg">
          <p className="font-label-caps text-label-caps text-secondary mb-sm uppercase">Total Received</p>
          <p className="font-display text-2xl md:text-[32px] md:leading-[40px] font-semibold text-on-surface tracking-tight break-all">
            {formatCurrency(metrics.totalReceived)}
          </p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg">
          <p className="font-label-caps text-label-caps text-secondary mb-sm uppercase">Unallocated Funds</p>
          <p className="font-display text-2xl md:text-[32px] md:leading-[40px] font-semibold text-on-surface tracking-tight break-all">
            {formatCurrency(metrics.unallocatedFunds)}
          </p>
          <p className="text-body-sm md:text-body-md text-secondary mt-xs flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px] text-primary shrink-0">warning</span>
            <span>Requires attention</span>
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
          <p className="text-body-sm md:text-body-md text-on-surface">{Math.round(metrics.allocatedPct)}% of deposits allocated.</p>
        </div>
      </div>

      {/* Desktop Payments Table */}
      <div className="hidden md:block bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
        <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface">
          <h3 className="font-headline-md text-headline-md text-on-surface">Recent Transactions</h3>
        </div>
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
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-secondary-container text-on-secondary-container text-label-caps font-bold w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5"></span>
                            Allocated
                          </span>
                          {(payment.payment_allocations as unknown as Array<{ amount_allocated: number; cycle_number: number | null }>)?.some((a) => a.cycle_number != null) && (
                            <span className="text-label-sm text-secondary mt-0.5">
                              Cycles: {(
                                payment.payment_allocations as unknown as Array<{ amount_allocated: number; cycle_number: number | null }>
                              )
                                .filter((a) => a.cycle_number != null)
                                .map((a) => `#${a.cycle_number}`)
                                .join(', ')}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-lg py-sm">
                      <div className="flex items-center gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        {payment.notes && (
                          <ViewNoteButton note={payment.notes} memberName={memberName} />
                        )}
                        {isUnallocated && (
                          <Link
                            href={`/payments?allocate=${payment.id}`}
                            className="text-primary hover:underline text-body-md"
                          >
                            Allocate
                          </Link>
                        )}
                        <ConfirmDeletePayment paymentId={payment.id} />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Payment Cards */}
      <div className="md:hidden space-y-sm">
        {payments.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg text-center text-secondary text-body-md">
            No payments recorded yet.{" "}
            <Link href="/payments/new" className="text-primary underline">Record a payment</Link>
          </div>
        ) : (
          payments.map((payment) => {
            const memberName = (payment.members as unknown as { name: string })?.name ?? 'Unknown';
            const isUnallocated = payment.status === 'unallocated';
            const cycles = (payment.payment_allocations as unknown as Array<{ amount_allocated: number; cycle_number: number | null }>)
              ?.filter((a) => a.cycle_number != null)
              .map((a) => `#${a.cycle_number}`) ?? [];

            return (
              <div key={payment.id} className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md">
                <div className="flex items-center justify-between mb-sm gap-sm">
                  <div className="flex items-center gap-sm min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-[12px] shrink-0">
                      {getInitials(memberName)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-body-md font-medium text-on-surface truncate">{memberName}</div>
                      <div className="text-label-sm text-secondary">{formatDate(payment.received_at)}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-body-md font-semibold text-on-surface">{formatCurrency(payment.amount)}</div>
                    {isUnallocated ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant text-[11px] font-medium border border-outline-variant">
                        Unallocated
                      </span>
                    ) : (
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-medium">
                          Allocated
                        </span>
                        {cycles.length > 0 && (
                          <span className="text-label-sm text-secondary">Cycles: {cycles.join(', ')}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {isUnallocated && (
                  <div className="flex gap-sm mt-sm pt-sm border-t border-surface-variant">
                    <Link
                      href={`/payments?allocate=${payment.id}`}
                      className="flex-1 text-center bg-primary text-on-primary text-body-sm py-sm rounded-lg hover:bg-primary-container transition-colors"
                    >
                      Allocate
                    </Link>
                    {payment.notes && (
                      <ViewNoteButton note={payment.notes} memberName={memberName} />
                    )}
                    <ConfirmDeletePayment paymentId={payment.id} />
                  </div>
                )}
                {!isUnallocated && (
                  <div className="flex justify-end mt-sm pt-sm border-t border-surface-variant">
                    {payment.notes && (
                      <ViewNoteButton note={payment.notes} memberName={memberName} />
                    )}
                    <ConfirmDeletePayment paymentId={payment.id} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Allocation Modal */}
      {allocatePayment && allocateMember && (
        <AllocationModalWrapper
          paymentId={allocatePayment.id}
          memberId={allocateMember.id}
          memberName={allocateMember.name}
          amount={parseFloat(String(allocatePayment.amount))}
        />
      )}
    </>
  );
}
