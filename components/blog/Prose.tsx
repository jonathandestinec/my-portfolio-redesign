import type { ReactNode } from "react";

// Typography for MDX output. Styled via descendant selectors so MDX needs no
// component overrides. Shiki dual-theme spans carry --shiki-light/--shiki-dark.
const cls = [
  "prose max-w-[680px] text-[17px] leading-[1.7] text-ink-muted",
  "[&_p]:my-5",
  "[&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:font-display [&_h2]:text-[1.5rem] [&_h2]:font-semibold [&_h2]:leading-[1.25] [&_h2]:text-ink",
  "[&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:font-display [&_h3]:text-[1.2rem] [&_h3]:font-semibold [&_h3]:text-ink",
  "[&_a]:text-ink [&_a]:underline [&_a]:decoration-dotted [&_a]:underline-offset-[0.2em]",
  "[&_strong]:font-semibold [&_strong]:text-ink",
  "[&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1.5",
  "[&_blockquote]:my-6 [&_blockquote]:border-l [&_blockquote]:border-line [&_blockquote]:pl-4 [&_blockquote]:text-ink-faint",
  "[&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-paper-raised [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[0.9em]",
  "[&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-line [&_pre]:bg-paper-raised [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-[14px] [&_pre]:leading-[1.6]",
].join(" ");

export function Prose({ children }: { children: ReactNode }) {
  return <article className={cls}>{children}</article>;
}
