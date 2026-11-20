import { expect, test } from "vitest";
import { resolveTheme } from "@/lib/theme";

test("stored value wins", () => {
  expect(resolveTheme("dark", false)).toBe("dark");
  expect(resolveTheme("light", true)).toBe("light");
});
test("falls back to system", () => {
  expect(resolveTheme(null, true)).toBe("dark");
  expect(resolveTheme(null, false)).toBe("light");
});
test("ignores junk", () => {
  expect(resolveTheme("purple", false)).toBe("light");
});
