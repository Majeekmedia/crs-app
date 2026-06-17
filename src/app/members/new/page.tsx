import { createMember } from '@/lib/server-actions';

export default function NewMemberPage() {
  return (
    <>
      <div className="mb-xl">
        <h2 className="font-headline-lg text-headline-lg text-on-surface">Add New Member</h2>
        <p className="font-body-md text-body-md text-secondary mt-1">Register a new member.</p>
      </div>

      <div className="max-w-lg bg-surface-container-lowest border border-outline-variant rounded-xl p-lg">
        <form action={createMember} className="space-y-md">
          <div>
            <label htmlFor="name" className="block text-label-caps text-secondary uppercase mb-xs">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-md py-sm text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="e.g., Jane Doe"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-label-caps text-secondary uppercase mb-xs">Phone Number</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-md py-sm text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div className="pt-md border-t border-outline-variant flex items-center gap-md">
            <button
              type="submit"
              className="bg-primary text-on-primary font-medium px-lg py-sm rounded-md hover:bg-primary-container transition-colors"
            >
              Add Member
            </button>
            <a href="/members" className="text-secondary hover:text-primary transition-colors">
              Cancel
            </a>
          </div>
        </form>
      </div>
    </>
  );
}
