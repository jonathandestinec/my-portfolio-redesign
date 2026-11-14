import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { renderRichText } from "@/components/hero/Lead";

test("renderRichText links", () => {
  render(
    <p>
      {renderRichText(["Now: ", { text: "AgroHub", href: "/work/agrohub" }])}
    </p>,
  );
  expect(screen.getByRole("link", { name: "AgroHub" })).toHaveAttribute(
    "href",
    "/work/agrohub",
  );
});

test("a noted link carries the handwritten note inside it", () => {
  const { container } = render(
    <p>
      {renderRichText([
        "It's called ",
        { text: "AgroHub", href: "/work/agrohub", note: "check this out :)" },
      ])}
    </p>,
  );
  const link = container.querySelector("a.note__link");
  expect(link?.getAttribute("href")).toBe("/work/agrohub");
  expect(link?.querySelector(".note__text")?.textContent).toBe("check this out :)");
  expect(link?.querySelector(".note")?.getAttribute("aria-hidden")).toBe("true");
});
