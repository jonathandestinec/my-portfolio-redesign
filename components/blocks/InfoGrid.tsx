const span = { 1: "", 2: "md:col-span-2", 3: "md:col-span-3" } as const;

export function InfoGrid({
  items,
  cols = 2,
}: {
  items: { title: string; body: string }[];
  cols?: 2 | 3;
}) {
  // Let the last item fill any empty slots so the grid ends flush.
  const rem = items.length % cols;
  const lastSpan = (rem === 0 ? 1 : cols - rem + 1) as 1 | 2 | 3;
  return (
    <div className="overflow-hidden rounded-[14px] border border-line">
      <div
        className={`grid grid-cols-1 gap-px bg-line ${cols === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}
      >
        {items.map((it, i) => (
          <div
            key={it.title}
            className={`bg-paper p-5 ${i === items.length - 1 ? span[lastSpan] : ""}`}
          >
            <h3 className="text-[15px] font-medium text-ink">{it.title}</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-ink-muted">
              {it.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
