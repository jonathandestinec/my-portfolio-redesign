/** Plain-text contract → blocks, shared by the web page and the PDF. "# " starts a heading, "- " a list item. */
export type Block = { type: "h"; text: string } | { type: "p"; text: string } | { type: "ul"; items: string[] };

export function toBlocks(text: string): Block[] {
  const out: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) out.push({ type: "p", text: para.join(" ") });
    para = [];
  };
  for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    if (line.startsWith("# ")) {
      flush();
      out.push({ type: "h", text: line.slice(2).trim() });
    } else if (line.startsWith("- ")) {
      flush();
      const last = out[out.length - 1];
      if (last?.type === "ul") last.items.push(line.slice(2).trim());
      else out.push({ type: "ul", items: [line.slice(2).trim()] });
    } else {
      para.push(line);
    }
  }
  flush();
  return out;
}

/** Splits free text (brief, intro) into paragraphs on blank lines. */
export const paragraphs = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
