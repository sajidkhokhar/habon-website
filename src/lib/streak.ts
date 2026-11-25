import { addDays, diffDays, startOfWeek, ymd, parse, pad, DOW } from './dates';

export type DayStats = {
  current: number; longest: number; total: number; missed: number; span: number;
  completion: number; first: string | null; last: string | null; daysSinceLast: number | null;
  longestRange: [string, string] | null; byWeekday: number[]; bestWeekday: number | null; worstWeekday: number | null;
};

/** Streak statistics for a set of completed dates (YYYY-MM-DD). The current streak survives if today is not yet done but yesterday was. */
export function dayStats(dates: Iterable<string>, today: string, startFrom?: string): DayStats {
  const set = new Set([...dates].filter((d) => d <= today && (!startFrom || d >= startFrom)));
  const sorted = [...set].sort();
  const byWeekday = [0, 0, 0, 0, 0, 0, 0];
  let longest = 0, run = 0, runStart = '', best: [string, string] | null = null, prev = '';
  for (const d of sorted) {
    byWeekday[parse(d).getDay()]++;
    if (prev && diffDays(prev, d) === 1) run++; else { run = 1; runStart = d; }
    if (run > longest) { longest = run; best = [runStart, d]; }
    prev = d;
  }
  let cur = 0;
  let cursor = set.has(today) ? today : addDays(today, -1);
  while (set.has(cursor)) { cur++; cursor = addDays(cursor, -1); }
  const first = startFrom ?? sorted[0] ?? null;
  const span = first ? Math.max(1, diffDays(first, today) + 1) : 0;
  const total = set.size;
  const max = Math.max(...byWeekday), min = Math.min(...byWeekday);
  return {
    current: cur, longest, total, span, missed: Math.max(0, span - total), completion: span ? total / span : 0,
    first, last: sorted.at(-1) ?? null, daysSinceLast: sorted.length ? diffDays(sorted.at(-1)!, today) : null,
    longestRange: best, byWeekday, bestWeekday: total && max > 0 ? byWeekday.indexOf(max) : null, worstWeekday: total && max !== min ? byWeekday.indexOf(min) : null,
  };
}

export type Unit = 'day' | 'week' | 'month';
const bucketOf = (d: string, unit: Unit, ws: number) => (unit === 'day' ? d : unit === 'week' ? startOfWeek(d, ws) : d.slice(0, 7));
const nextBucket = (b: string, unit: Unit) => {
  if (unit === 'day') return addDays(b, 1);
  if (unit === 'week') return addDays(b, 7);
  const [y, m] = b.split('-').map(Number); return m === 12 ? `${y + 1}-01` : `${y}-${pad(m + 1)}`;
};

/** Streak of consecutive periods in which a habit was done at least `target` times. */
export function periodStreak(checks: Iterable<string>, unit: Unit, target: number, today: string, ws = 0, createdOn?: string) {
  const counts = new Map<string, number>();
  let first = createdOn ? bucketOf(createdOn, unit, ws) : '';
  for (const d of checks) { if (d > today) continue; const b = bucketOf(d, unit, ws); counts.set(b, (counts.get(b) ?? 0) + 1); if (!first || b < first) first = b; }
  if (!first) return { current: 0, longest: 0, currentCount: 0, periodsMet: 0, periods: 0 };
  const curB = bucketOf(today, unit, ws);
  let longest = 0, run = 0, met = 0, periods = 0;
  for (let b = first; b <= curB; b = nextBucket(b, unit)) {
    periods++;
    if ((counts.get(b) ?? 0) >= target) { run++; met++; longest = Math.max(longest, run); } else if (b !== curB) run = 0;
  }
  // An unfinished, unmet current period does not break the streak: it continues from the previous period.
  return { current: run, longest, currentCount: counts.get(curB) ?? 0, periodsMet: met, periods };
}

export const weekdayName = (i: number | null) => (i === null ? '–' : DOW[i]);
export const pct = (x: number) => `${Math.round(x * 100)}%`;
export { ymd };
