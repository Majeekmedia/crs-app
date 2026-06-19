// ───────── Types ─────────

export interface CycleDateRange {
  cycleNumber: number;
  startDate: Date;
  endDate: Date;
  dueDate: Date;
}

// ───────── Formatting ─────────

// Format currency for display
export function formatCurrency(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(num);
}

// Format date for display
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Format date with time
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Generate initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Cycle duration display labels
export const cycleLabels: Record<string, string> = {
  daily: 'Daily',
  '5-day': '5-Day',
  weekly: 'Weekly',
  'bi-weekly': 'Bi-Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  custom: 'Custom',
};

// Format cycle duration for display (handles custom day counts)
export function formatCycleDuration(plan: {
  cycle_duration: string;
  cycle_days?: number | null;
}): string {
  if (plan.cycle_duration === 'custom' && plan.cycle_days) {
    return `Every ${plan.cycle_days} day${plan.cycle_days > 1 ? 's' : ''}`;
  }
  return cycleLabels[plan.cycle_duration] || plan.cycle_duration;
}

// ───────── Cycle Date Calculations ─────────

/** Get the current cycle number based on start date and cycle days.
 *  Returns 0 if the plan hasn't started yet. */
export function getCurrentCycle(start_date: string | Date, cycle_days: number): number {
  const start = new Date(start_date);
  const now = new Date();

  if (now < start) return 0;

  const diffMs = now.getTime() - start.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return Math.floor(diffDays / cycle_days) + 1;
}

/** Generate all cycle date ranges for a plan. */
export function getCycleDates(
  start_date: string | Date,
  cycle_days: number,
  total_slots: number
): CycleDateRange[] {
  const start = new Date(start_date);
  const cycles: CycleDateRange[] = [];

  for (let i = 0; i < total_slots; i++) {
    const cycleStart = new Date(start);
    cycleStart.setDate(cycleStart.getDate() + i * cycle_days);

    const cycleEnd = new Date(cycleStart);
    cycleEnd.setDate(cycleEnd.getDate() + cycle_days - 1);

    cycles.push({
      cycleNumber: i + 1,
      startDate: cycleStart,
      endDate: cycleEnd,
      dueDate: new Date(cycleEnd),
    });
  }

  return cycles;
}

/** Determine which slot number receives the payout for a given cycle.
 *  In a ROSCA, slots take turns in order: slot 1 → cycle 1, slot 2 → cycle 2, etc. */
export function getPayeeForCycle(cycleNumber: number, totalSlots: number): number {
  return ((cycleNumber - 1) % totalSlots) + 1;
}

/** Whether the start date is locked (plan has progressed past the first cycle). */
export function isStartDateLocked(start_date: string | Date, cycle_days: number): boolean {
  return getCurrentCycle(start_date, cycle_days) > 1;
}
