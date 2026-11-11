export function InfoGrid({
  items,
  cols = 2,
}: {
  items: { title: string; body: string }[];
  cols?: 2 | 3;
}) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-line">
      <div
        className={`-m-px grid grid-cols-1 ${cols === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}
      >
        {items.map((it) => (
          <div key={it.title} className="border border-line p-5">
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
