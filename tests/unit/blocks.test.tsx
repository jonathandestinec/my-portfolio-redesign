import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { EducationList, RoleList } from "@/components/blocks/Entries";
import { Facts } from "@/components/blocks/Facts";
import { Timeline } from "@/components/blocks/Timeline";
import { Actions } from "@/components/cta/Actions";
import { education, experience } from "@/content/experience";
import { site } from "@/content/site";

test("Timeline places bars", () => {
  const { container } = render(
    <Timeline
      t={{
        columns: ["a", "b", "c"],
        rows: [{ track: "Build", start: 2, span: 2 }],
      }}
    />,
  );
  expect(container.querySelector("[data-bar]")).toHaveStyle({
    gridColumn: "2 / span 2",
  });
});

test("Facts renders key/value rows", () => {
  render(<Facts rows={[["Role", "Dev"]]} />);
  expect(screen.getByText("Role").tagName).toBe("DT");
  expect(screen.getByText("Dev").tagName).toBe("DD");
});

test("roles are closed <details> cards with a logo and a details link", () => {
  const { container } = render(<RoleList roles={experience} />);
  const cards = container.querySelectorAll("details.entry");
  expect(cards).toHaveLength(experience.length);
  cards.forEach((c) => expect((c as HTMLDetailsElement).open).toBe(false));
  expect(container.querySelectorAll(".logo-mark")).toHaveLength(experience.length);
  expect(
    screen.getAllByRole("link", { name: /Full details/ })[0],
  ).toHaveAttribute("href", `/experience#${experience[0].slug}`);
});

test("full role list shows every highlight and the stack", () => {
  render(<RoleList roles={experience} full />);
  for (const h of experience[2].highlights) expect(screen.getByText(h)).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /Full details/ })).toBeNull();
});

test("education cards link to the education page", () => {
  render(<EducationList items={education} />);
  expect(
    screen.getAllByRole("link", { name: /Full details/ })[0],
  ).toHaveAttribute("href", `/education#${education[0].slug}`);
});

test("CTA lays out every action at once (no reveal)", () => {
  render(<Actions />);
  expect(screen.getByRole("link", { name: "Book a call" })).toHaveAttribute("href", site.calendarUrl);
  expect(screen.getByRole("link", { name: "Email me" })).toHaveAttribute("href", `mailto:${site.email}`);
  expect(screen.getByRole("link", { name: /Résumé/ })).toHaveAttribute("href", "/resume.pdf");
  expect(screen.queryByRole("button")).toBeNull();
});
