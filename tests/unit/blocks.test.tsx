import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import { Accordion } from "@/components/blocks/Accordion";
import { InfoGrid } from "@/components/blocks/InfoGrid";
import { MetaTable } from "@/components/blocks/MetaTable";
import { RowList } from "@/components/blocks/RowList";
import { Timeline } from "@/components/blocks/Timeline";
import { ScrollBlur } from "@/components/motion/ScrollBlur";

test("RowList renders link rows in a list", () => {
  const { container } = render(
    <RowList rows={[{ label: "2026", title: "X", href: "/x", tag: "new" }]} />,
  );
  expect(screen.getByRole("link", { name: /X/ })).toHaveAttribute("href", "/x");
  expect(container.querySelectorAll("ul > li")).toHaveLength(1);
});

test("RowList external links open in a new tab", () => {
  render(<RowList rows={[{ label: "a", title: "Ext", href: "https://e.com" }]} />);
  const a = screen.getByRole("link", { name: /Ext/ });
  expect(a).toHaveAttribute("target", "_blank");
  expect(a).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
});

test("Timeline places bars", () => {
  const { container } = render(
    <Timeline
      t={{ columns: ["a", "b", "c"], rows: [{ track: "Build", start: 2, span: 2 }] }}
    />,
  );
  expect(container.querySelector("[data-bar]")).toHaveStyle({
    gridColumn: "2 / span 2",
  });
});

test("InfoGrid, MetaTable, Accordion render", () => {
  render(
    <>
      <InfoGrid items={[{ title: "T1", body: "B1" }]} />
      <MetaTable rows={[["Role", "Dev"]]} />
      <Accordion items={[{ q: "Why?", a: "Because" }]} />
    </>,
  );
  expect(screen.getByText("T1")).toBeInTheDocument();
  expect(screen.getByText("Dev")).toBeInTheDocument();
  expect(screen.getByText("Why?").closest("details")).not.toBeNull();
});

test("ScrollBlur SSR output has no blur", () => {
  expect(renderToString(<ScrollBlur><img alt="" /></ScrollBlur>)).not.toMatch(
    /blur|opacity|style/,
  );
});
