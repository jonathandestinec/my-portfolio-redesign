/** Calendar helpers for due dates and working days (Monday to Friday, UTC). */

export const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86_400_000);

const isWeekday = (d: Date) => d.getUTCDay() !== 0 && d.getUTCDay() !== 6;

/** Working days strictly after `from`, up to and including `to`. */
export function workingDaysBetween(from: Date, to: Date): number {
  if (to <= from) return 0;
  let n = 0;
  const day = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
  while (day < end) {
    day.setUTCDate(day.getUTCDate() + 1);
    if (isWeekday(day)) n++;
  }
  return n;
}

export function addWorkingDays(from: Date, days: number): Date {
  const d = new Date(from.getTime());
  let left = days;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (isWeekday(d)) left--;
  }
  return d;
}
