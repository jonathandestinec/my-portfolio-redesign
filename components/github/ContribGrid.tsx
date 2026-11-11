import type { Calendar } from "@/lib/github";
import { ContribTooltip } from "./ContribTooltip";

const CELL = 11;
const GAP = 3;
const PITCH = CELL + GAP;
const TOP = 16;

const fmt = (date: string) =>
  new Date(date + "T00:00:00Z").toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const monthName = (date: string) =>
  new Date(date + "T00:00:00Z").toLocaleDateString("en-US", { timeZone: "UTC", month: "short" });

export function monthLabels(weeks: Calendar["weeks"]): { week: number; label: string }[] {
  const out: { week: number; label: string }[] = [];
  let prevMonth = "";
  let lastWeek = -Infinity;
  weeks.forEach((w, i) => {
    const first = w[0]?.date;
    if (!first) return;
    const month = first.slice(0, 7);
    if (month === prevMonth) return;
    prevMonth = month;
    if (i - lastWeek < 3) return;
    lastWeek = i;
    out.push({ week: i, label: monthName(first) });
  });
  return out;
}

export function ContribGrid({ cal }: { cal: Calendar }) {
  const width = cal.weeks.length * PITCH - GAP;
  const height = TOP + 7 * PITCH - GAP;
  const n = cal.total;
  return (
    <figure className="m-0">
      <ContribTooltip>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          role="img"
          aria-label={`GitHub contributions: ${n} in the last year`}
          tabIndex={0}
          className="block h-auto w-full rounded outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          {monthLabels(cal.weeks).map((m) => (
            <text key={m.week} x={m.week * PITCH} y={10} fontSize={11} fill="var(--ink-faint)">
              {m.label}
            </text>
          ))}
          {cal.weeks.map((week, wi) =>
            week.map((d, di) => (
              <rect
                key={d.date}
                x={wi * PITCH}
                y={TOP + di * PITCH}
                width={CELL}
                height={CELL}
                rx={2}
                fill={`var(--contrib-${d.level})`}
                data-date={d.date}
                data-count={d.count}
                tabIndex={-1}
              >
                <title>{`${d.count} contribution${d.count === 1 ? "" : "s"} on ${fmt(d.date)}`}</title>
              </rect>
            )),
          )}
        </svg>
      </ContribTooltip>
      <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-[13px] text-ink-muted">
        <span>
          {n} contributions in the last year
          {cal.isSample ? <span className="text-ink-faint"> · sample data</span> : null}
        </span>
        <span className="flex items-center gap-1.5 text-ink-faint" aria-hidden>
          Less
          {[0, 1, 2, 3, 4].map((l) => (
            <span
              key={l}
              className="inline-block size-[11px] rounded-[2px]"
              style={{ background: `var(--contrib-${l})` }}
            />
          ))}
          More
        </span>
      </figcaption>
    </figure>
  );
}
