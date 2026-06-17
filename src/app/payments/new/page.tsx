import { createServerSupabase } from '@/lib/supabase';
import { recordPayment } from '@/lib/server-actions';

export const dynamic = 'force-dynamic';

async function getMembers() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from('members').select('id, name').order('name');
  return data ?? [];
}

export default async function NewPaymentPage() {
  const members = await getMembers();

  return (
    <>
      <div className="mb-xl">
        <h2 className="font-headline-lg text-headline-lg text-on-surface">Record Payment</h2>
        <p className="font-body-md text-body-md text-secondary mt-1">Log an incoming member payment.</p>
      </div>

      <div className="max-w-2xl bg-surface-container-lowest border border-outline-variant rounded-xl p-lg">
        <form action={recordPayment} className="space-y-md">
          <div>
            <label htmlFor="member_id" className="block text-label-caps text-secondary uppercase mb-xs">Member</label>
            <select
              id="member_id"
              name="member_id"
              required
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-md py-sm text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="">Select member...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="amount" className="block text-label-caps text-secondary uppercase mb-xs">Amount ($)</label>
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-md py-sm text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-label-caps text-secondary uppercase mb-xs">Notes (Optional)</label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-md py-sm text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="e.g., Bank transfer reference"
            />
          </div>

          <div className="pt-md border-t border-outline-variant flex items-center gap-md">
            <button
              type="submit"
              className="bg-primary text-on-primary font-medium px-lg py-sm rounded-md hover:bg-primary-container transition-colors"
            >
              Record Payment
            </button>
            <a href="/payments" className="text-secondary hover:text-primary transition-colors">
              Cancel
            </a>
          </div>
        </form>
      </div>
    </>
  );
}
