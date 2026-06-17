import { createPlan } from '@/lib/server-actions';

export default function NewPlanPage() {
  return (
    <>
      <div className="mb-xl">
        <h2 className="font-headline-lg text-headline-lg text-on-surface">Create New Plan</h2>
        <p className="font-body-md text-body-md text-secondary mt-1">Set up a new contribution plan.</p>
      </div>

      <div className="max-w-2xl bg-surface-container-lowest border border-outline-variant rounded-xl p-lg">
        <form action={createPlan} className="space-y-md">
          <div>
            <label htmlFor="name" className="block text-label-caps text-secondary uppercase mb-xs">Plan Name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-md py-sm text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="e.g., Q3 Savings Group"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div>
              <label htmlFor="contribution_amount" className="block text-label-caps text-secondary uppercase mb-xs">Contribution Amount ($)</label>
              <input
                id="contribution_amount"
                name="contribution_amount"
                type="number"
                step="0.01"
                min="0"
                required
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-md py-sm text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="100.00"
              />
            </div>
            <div>
              <label htmlFor="payout_amount" className="block text-label-caps text-secondary uppercase mb-xs">Payout Amount ($)</label>
              <input
                id="payout_amount"
                name="payout_amount"
                type="number"
                step="0.01"
                min="0"
                required
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-md py-sm text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="1200.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div>
              <label htmlFor="cycle_duration" className="block text-label-caps text-secondary uppercase mb-xs">Cycle Duration</label>
              <select
                id="cycle_duration"
                name="cycle_duration"
                required
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-md py-sm text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="daily">Daily</option>
                <option value="5-day">5-Day</option>
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
            <div>
              <label htmlFor="total_slots" className="block text-label-caps text-secondary uppercase mb-xs">Total Slots (Participants)</label>
              <input
                id="total_slots"
                name="total_slots"
                type="number"
                min="1"
                required
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-md py-sm text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="12"
              />
            </div>
          </div>

          <div className="pt-md border-t border-outline-variant flex items-center gap-md">
            <button
              type="submit"
              className="bg-primary text-on-primary font-medium px-lg py-sm rounded-md hover:bg-primary-container transition-colors"
            >
              Create Plan
            </button>
            <a
              href="/plans"
              className="text-secondary hover:text-primary transition-colors"
            >
              Cancel
            </a>
          </div>
        </form>
      </div>
    </>
  );
}
