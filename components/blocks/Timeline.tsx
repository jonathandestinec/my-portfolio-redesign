import type { Timeline as TimelineData } from "@/content/types";

export function Timeline({ t }: { t: TimelineData }) {
  const n = t.columns.length;
  const inner = { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` };
  const lines = t.columns.map((c, i) => (
    <span
      key={c}
      aria-hidden="true"
      className="pointer-events-none border-l border-line"
      style={{ gridColumn: `${i + 1}`, gridRow: 1 }}
    />
  ));
  return (
    <div className="overflow-x-auto rounded-[14px] border border-line">
      <div className="min-w-[560px]">
        <div className="grid grid-cols-[120px_1fr] border-b border-line">
          <div />
          <div className="grid" style={inner}>
            {t.columns.map((c) => (
              <div key={c} className="px-3 py-2.5 text-[12px] text-ink-faint">
                {c}
              </div>
            ))}
          </div>
        </div>
        {t.rows.map((r) => (
          <div
            key={r.track}
            className="grid grid-cols-[120px_1fr] border-b border-line last:border-b-0"
          >
            <div className="px-3 py-3 text-[15px] text-ink">{r.track}</div>
            <div className="relative grid items-center py-2" style={inner}>
              <div
                className="pointer-events-none absolute inset-0 grid"
                style={inner}
                aria-hidden="true"
              >
                {lines}
              </div>
              <div
                data-bar
                className="relative h-7 rounded-md border border-line bg-paper-raised"
                style={{ gridColumn: `${r.start} / span ${r.span}`, gridRow: 1 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
