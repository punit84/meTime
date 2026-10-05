/**
 * Skin Care helpers — defaults, labels, progress, history display.
 * Not a medical system; just a gentle personal ritual.
 */
import type {
  SkinCareCategory,
  SkinCareDayRecord,
  SkinCarePeriod,
  SkinCareStep,
} from './types';

export const CATEGORY_LABELS: Record<SkinCareCategory, string> = {
  cleanser: 'Cleanser',
  toner: 'Toner',
  serum: 'Serum',
  treatment: 'Treatment',
  moisturizer: 'Moisturizer',
  sunscreen: 'Sunscreen',
  'eye-care': 'Eye care',
  other: 'Other',
};

export const CATEGORY_ICONS: Record<
  SkinCareCategory,
  | 'water-outline'
  | 'flask-outline'
  | 'color-filter-outline'
  | 'leaf-outline'
  | 'flower-outline'
  | 'sunny-outline'
  | 'eye-outline'
  | 'sparkles-outline'
> = {
  cleanser: 'water-outline',
  toner: 'flask-outline',
  serum: 'color-filter-outline',
  treatment: 'leaf-outline',
  moisturizer: 'flower-outline',
  sunscreen: 'sunny-outline',
  'eye-care': 'eye-outline',
  other: 'sparkles-outline',
};

/** Today's date as YYYY-MM-DD in local time. */
export function localDateKey(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function createDefaultSteps(): SkinCareStep[] {
  const now = Date.now();
  const morning: Omit<SkinCareStep, 'id'>[] = [
    {
      period: 'morning',
      name: 'Cleanser',
      productName: 'Gentle Cleanser',
      notes: null,
      category: 'cleanser',
      sortOrder: 0,
    },
    {
      period: 'morning',
      name: 'Moisturizer',
      productName: 'Daily Moisturizer',
      notes: null,
      category: 'moisturizer',
      sortOrder: 1,
    },
    {
      period: 'morning',
      name: 'Sunscreen',
      productName: 'SPF 50',
      notes: null,
      category: 'sunscreen',
      sortOrder: 2,
    },
  ];
  const evening: Omit<SkinCareStep, 'id'>[] = [
    {
      period: 'evening',
      name: 'Cleanser',
      productName: 'Gentle Cleanser',
      notes: null,
      category: 'cleanser',
      sortOrder: 0,
    },
    {
      period: 'evening',
      name: 'Treatment / Serum',
      productName: null,
      notes: null,
      category: 'serum',
      sortOrder: 1,
    },
    {
      period: 'evening',
      name: 'Moisturizer',
      productName: 'Night Moisturizer',
      notes: null,
      category: 'moisturizer',
      sortOrder: 2,
    },
  ];

  return [
    ...morning.map((step, i) => ({
      ...step,
      id: `skin_${now}_m${i}`,
    })),
    ...evening.map((step, i) => ({
      ...step,
      id: `skin_${now}_e${i}`,
    })),
  ];
}

export function stepsForPeriod(
  steps: SkinCareStep[],
  period: SkinCarePeriod,
): SkinCareStep[] {
  return steps
    .filter((s) => s.period === period)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export type PeriodProgress = {
  period: SkinCarePeriod;
  total: number;
  completed: number;
  done: boolean;
};

export function periodProgress(
  steps: SkinCareStep[],
  completedStepIds: string[],
  period: SkinCarePeriod,
): PeriodProgress {
  const periodSteps = stepsForPeriod(steps, period);
  const total = periodSteps.length;
  const completed = periodSteps.filter((s) =>
    completedStepIds.includes(s.id),
  ).length;
  return {
    period,
    total,
    completed,
    done: total > 0 && completed >= total,
  };
}

export function dayCompletionPercent(
  steps: SkinCareStep[],
  record: SkinCareDayRecord | null | undefined,
): number {
  if (!steps.length) return 0;
  // Count only ids that still exist in the routine
  const validCompleted = (record?.completedStepIds ?? []).filter((id) =>
    steps.some((s) => s.id === id),
  ).length;
  return Math.round((validCompleted / steps.length) * 100);
}

/** Friendly history label: Today, Yesterday, or weekday name. */
export function historyDayLabel(dateKey: string): string {
  const today = localDateKey();
  if (dateKey === today) return 'Today';

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKey === localDateKey(yesterday)) return 'Yesterday';

  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return date.toLocaleDateString(undefined, { weekday: 'long' });
}

export function formatReminderTime(hhmm: string): string {
  const [hRaw, mRaw] = hhmm.split(':');
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Simple preset times for reminder picker (no DateTimePicker dependency). */
export const REMINDER_TIME_OPTIONS = [
  '06:00',
  '07:00',
  '07:30',
  '08:00',
  '08:30',
  '09:00',
  '12:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
] as const;
