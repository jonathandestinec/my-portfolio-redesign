import { cellPositions, contributionLabel, monthLabels, type Calendar } from "@/lib/github";
import { ContribTooltip } from "./ContribTooltip";

const CELL = 11;
const GAP = 3;
const PITCH = CELL + GAP;
const TOP = 16;
const EDGE = 30;

export function ContribGrid({ cal }: { cal: Calendar }) {
  const width = cal.weeks.length * PITCH - GAP;
  const height = TOP + 7 * PITCH - GAP;
  const n = cal.total;
  const pos = cellPositions(cal.weeks);
  let k = 0;
  return (
    <figure className="m-0">
      <ContribTooltip>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          role="img"
          aria-label={`GitHub contributions: ${n} in the last year`}
          tabIndex={0}
          className="contrib block h-auto w-full min-w-[640px] rounded outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          {monthLabels(cal.weeks).map((m) => (
            <text
              key={m.week}
              x={m.week * PITCH + (m.week * PITCH > width - EDGE ? CELL : 0)}
              y={10}
              fontSize={11}
              textAnchor={m.week * PITCH > width - EDGE ? "end" : "start"}
              fill="var(--ink-faint)"
            >
              {m.label}
            </text>
          ))}
          {cal.weeks.flat().map((d) => {
            const { col, row } = pos[k++];
            return (
              <rect
                key={d.date}
                x={col * PITCH}
                y={TOP + row * PITCH}
                width={CELL}
                height={CELL}
                rx={2}
                fill={`var(--contrib-${d.level})`}
                data-date={d.date}
                data-count={d.count}
                data-col={col}
                data-row={row}
              >
                <title>{contributionLabel(d.count, d.date)}</title>
              </rect>
            );
          })}
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
