import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeAll, expect, test, vi } from "vitest";
import { StackGrid } from "@/components/stack/StackGrid";
import { StackIcon } from "@/components/stack/StackIcon";
import { stack } from "@/content/stack";

beforeAll(() => {
  // jsdom lacks IntersectionObserver, which HandNote's whileInView needs.
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

test("filtering to Tools shows n8n and hides React", async () => {
  render(<StackGrid items={stack} />);
  expect(screen.getByText("React")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: /^tools/i }));
  expect(await screen.findByText("n8n")).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByText("React")).not.toBeInTheDocument());
});

test("tabs expose selection and arrow keys move between them", () => {
  render(<StackGrid items={stack} />);
  const tabs = screen.getAllByRole("tab");
  expect(tabs).toHaveLength(5);
  expect(tabs[0]).toHaveAttribute("aria-selected", "true");
  expect(tabs[1]).toHaveAttribute("tabindex", "-1");
  fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
  expect(tabs[1]).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", tabs[1].id);
  fireEvent.keyDown(tabs[1], { key: "ArrowLeft" });
  fireEvent.keyDown(tabs[0], { key: "ArrowLeft" });
  expect(tabs[4]).toHaveAttribute("aria-selected", "true");
});

test("every stack icon resolves", () => {
  for (const s of stack) {
    expect(() => renderToString(<StackIcon slug={s.icon} />)).not.toThrow();
    expect(renderToString(<StackIcon slug={s.icon} />)).toContain("<svg");
  }
});
