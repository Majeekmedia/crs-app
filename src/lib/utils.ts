// Format currency for display
export function formatCurrency(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
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
