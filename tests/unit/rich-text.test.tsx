import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { renderRichText } from "@/components/hero/PageHero";

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
