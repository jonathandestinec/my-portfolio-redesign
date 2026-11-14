import { describe, expect, test, vi } from "vitest";
import {
  SAMPLE_END,
  cellPositions,
  contributionLabel,
  dayRow,
  monthLabels,
  fetchContributions,
  parseGithubCalendar,
  parsePublicCalendar,
  sampleCalendar,
} from "@/lib/github";
import fixture from "./fixtures/github-calendar.json";

/** Mimics github.com/users/<login>/contributions: a row per weekday, tooltips after the table. */
function publicHtml(start = "2025-11-05", days = 371) {
  const t0 = Date.parse(start + "T00:00:00Z");
  const cells: string[] = [];
  const tips: string[] = [];
  let total = 0;
  for (let i = 0; i < days; i++) {
    const date = new Date(t0 + i * 86_400_000).toISOString().slice(0, 10);
    const count = i % 5 === 0 ? 0 : (i % 13) + 1;
    total += count;
    const level = count === 0 ? 0 : Math.min(4, Math.ceil(count / 4));
    const id = `contribution-day-component-${new Date(date).getUTCDay()}-${i}`;
    cells.push(
      `<td tabindex="0" data-ix="${i}" aria-selected="false" style="width: 10px" data-date="${date}" id="${id}" data-level="${level}" role="gridcell" data-view-component="true" class="ContributionCalendar-day"></td>`,
    );
    tips.push(
      `<tool-tip id="tooltip-${i}" for="${id}" popover="manual" data-direction="n" data-type="label" data-view-component="true" class="sr-only position-absolute">${
        count === 0 ? "No contributions" : `${count} contribution${count === 1 ? "" : "s"}`
      } on ${date}.</tool-tip>`,
    );
  }
  return {
    total,
    html: `<h2 id="js-contribution-activity-description" class="f4 text-normal mb-2">\n      ${total.toLocaleString("en-US")}\n      contributions\n        in the last year\n    </h2><table><tbody>${cells.join("")}</tbody></table>${tips.join("")}`,
  };
}

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

  test("parses the public contributions page", () => {
    const { html, total } = publicHtml();
    const c = parsePublicCalendar(html);
    expect(c.isSample).toBe(false);
    expect(c.total).toBe(total);
    expect(c.weeks.flat()).toHaveLength(371);
    // Weeks are Sunday-first; the partial first week starts on a Wednesday.
    expect(dayRow(c.weeks[0][0].date)).toBe(3);
    expect(c.weeks.slice(1).every((w) => dayRow(w[0].date) === 0)).toBe(true);
    expect(c.weeks[0][0]).toEqual({ date: "2025-11-05", count: 0, level: 0 });
    expect(c.weeks[0][1].count).toBe(2);
  });

  test("public page parse throws on an unrelated page", () => {
    expect(() => parsePublicCalendar("<html>sign in</html>")).toThrow();
  });

  test("no token → real calendar from the public page, no auth header", async () => {
    const { html } = publicHtml();
    const f = vi.fn().mockResolvedValue(new Response(html, { status: 200 }));
    const c = await fetchContributions("jonathandestinec", undefined, f);
    expect(c.isSample).toBe(false);
    const [url, init] = f.mock.calls[0];
    expect(url).toBe("https://github.com/users/jonathandestinec/contributions");
    expect(init.headers.Authorization).toBeUndefined();
  });

  test("token fails → falls back to the public page", async () => {
    const { html } = publicHtml();
    const f = vi
      .fn()
      .mockResolvedValueOnce(new Response("bad creds", { status: 401 }))
      .mockResolvedValueOnce(new Response(html, { status: 200 }));
    expect((await fetchContributions("u", "t", f)).isSample).toBe(false);
    expect(f).toHaveBeenCalledTimes(2);
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
