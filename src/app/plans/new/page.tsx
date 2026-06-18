import PlanForm from './PlanForm';

export default function NewPlanPage() {
  return (
    <>
      <div className="mb-xl">
        <h2 className="font-headline-lg text-headline-lg text-on-surface">Create New Plan</h2>
        <p className="font-body-md text-body-md text-secondary mt-1">Set up a new contribution plan.</p>
      </div>

      <div className="max-w-2xl bg-surface-container-lowest border border-outline-variant rounded-xl p-lg">
        <PlanForm />
      </div>
    </>
  );
}
