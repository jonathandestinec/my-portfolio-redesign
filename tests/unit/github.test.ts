import { describe, expect, test, vi } from "vitest";
import {
  SAMPLE_END,
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
