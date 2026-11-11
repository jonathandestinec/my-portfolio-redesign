import { describe, expect, test, vi } from "vitest";
import {
  SAMPLE_END,
  cellPositions,
  contributionLabel,
  dayRow,
  monthLabels,
  fetchContributions,
  parseGithubCalendar,
  sampleCalendar,
} from "@/lib/github";
import fixture from "./fixtures/github-calendar.json";

describe("github calendar", () => {
  test("parses GraphQL", () => {
    const c = parseGithubCalendar(fixture);
    expect(c.total).toBe(517);
    expect(c.weeks[0][0].level).toBe(0);
    expect(c.weeks[0][4].level).toBe(4);
    expect(c.isSample).toBe(false);
  });

  test("parse throws on bad shape", () => {
    expect(() => parseGithubCalendar({ data: null })).toThrow();
  });

  test("sample is deterministic and 53 weeks", () => {
    const a = sampleCalendar("x", SAMPLE_END);
    const b = sampleCalendar("x", SAMPLE_END);
    expect(a).toEqual(b);
    expect(a.weeks).toHaveLength(53);
    expect(a.weeks.every((w) => w.length === 7)).toBe(true);
    expect(a.weeks.at(-1)!.at(-1)!.date).toBe(SAMPLE_END);
    expect(a.isSample).toBe(true);
  });

  test("no token → sample, no fetch, silent", async () => {
    const f = vi.fn();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect((await fetchContributions("u", undefined, f as never)).isSample).toBe(true);
    expect(f).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  test("API failure → sample, never throws, warns once", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const f = vi.fn().mockResolvedValue(new Response("nope", { status: 502 }));
    expect((await fetchContributions("u", "t", f)).isSample).toBe(true);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  test("thrown fetch and errors array → sample", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const boom = vi.fn().mockRejectedValue(new Error("net"));
    expect((await fetchContributions("u", "t", boom)).isSample).toBe(true);
    const errs = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ errors: [{ message: "x" }] }), { status: 200 }));
    expect((await fetchContributions("u", "t", errs)).isSample).toBe(true);
    warn.mockRestore();
  });

  test("success returns real calendar and sends auth", async () => {
    const f = vi.fn().mockResolvedValue(new Response(JSON.stringify(fixture), { status: 200 }));
    const c = await fetchContributions("u", "tok", f);
    expect(c.isSample).toBe(false);
    const [url, init] = f.mock.calls[0];
    expect(url).toBe("https://api.github.com/graphql");
    expect(init.headers.Authorization).toBe("bearer tok");
    expect(JSON.parse(init.body).variables).toEqual({ login: "u" });
  });
});

describe("grid layout helpers", () => {
  const day = (date: string) => ({ date, count: 1, level: 1 as const });
  // First week is partial: starts Wednesday 2026-10-28.
  const partial = [
    ["2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31"].map(day),
    ["2026-11-01", "2026-11-02"].map(day),
  ];

  test("dayRow is the UTC weekday", () => {
    expect(dayRow("2026-10-28")).toBe(3);
    expect(dayRow("2026-11-01")).toBe(0);
    expect(dayRow(SAMPLE_END)).toBe(6);
  });

  test("partial first week lands on its true rows", () => {
    const pos = cellPositions(partial);
    expect(pos[0]).toEqual({ date: "2026-10-28", col: 0, row: 3 });
    expect(pos[3]).toEqual({ date: "2026-10-31", col: 0, row: 6 });
    expect(pos[4]).toEqual({ date: "2026-11-01", col: 1, row: 0 });
  });

  test("labels pluralise correctly", () => {
    expect(contributionLabel(1, "2026-11-07")).toBe("1 contribution on Nov 7, 2026");
    expect(contributionLabel(0, "2026-11-07")).toBe("0 contributions on Nov 7, 2026");
  });

  test("monthLabels marks new months and skips labels under 3 weeks apart", () => {
    const sun = (d: string) => [day(d)];
    // weeks start: Oct 25, Nov 1, Nov 8, Nov 15, Dec 6 (Nov->Dec) , Dec 13
    const weeks = ["2026-10-25", "2026-11-01", "2026-11-08", "2026-11-15", "2026-11-22", "2026-11-29", "2026-12-06"].map(sun);
    // Oct@0 labelled, Nov@1 skipped (1 week after), Dec@6 labelled.
    expect(monthLabels(weeks)).toEqual([
      { week: 0, label: "Oct" },
      { week: 6, label: "Dec" },
    ]);
    const spaced = ["2026-09-27", "2026-10-04", "2026-10-11", "2026-10-18", "2026-10-25", "2026-11-01"].map(sun);
    expect(monthLabels(spaced).map((m) => m.label)).toEqual(["Sep", "Nov"]) // Oct is 1 week after Sep, skipped;
  });
});
