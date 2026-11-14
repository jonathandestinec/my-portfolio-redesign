import type { ReactNode } from "react";

// Typography for MDX output. Styled via descendant selectors so MDX needs no
// component overrides. Shiki dual-theme spans carry --shiki-light/--shiki-dark.
const cls = [
  "max-w-[540px] text-[15px] leading-[24px] text-ink",
  "[&_p]:my-[24px] [&_p]:text-pretty",
  "[&_h2]:mt-14 [&_h2]:mb-2 [&_h2]:text-[15px] [&_h2]:font-medium [&_h2]:text-ink",
  "[&_h3]:mt-8 [&_h3]:mb-2 [&_h3]:text-[15px] [&_h3]:font-medium [&_h3]:text-ink-muted",
  "[&_a]:text-ink [&_a]:underline [&_a]:decoration-dotted [&_a]:underline-offset-[0.2em]",
  "[&_strong]:font-medium [&_strong]:text-ink",
  "[&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1.5",
  "[&_blockquote]:my-6 [&_blockquote]:border-l [&_blockquote]:border-line [&_blockquote]:pl-4 [&_blockquote]:text-ink-faint",
  "[&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-paper-raised [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[0.9em]",
  "[&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-[10px] [&_pre]:border [&_pre]:border-line [&_pre]:bg-paper-raised [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-[14px] [&_pre]:leading-[1.6]",
].join(" ");

export function Prose({ children }: { children: ReactNode }) {
  return <article className={cls}>{children}</article>;
}
