import type { ReactNode } from "react";
import { MobileNav } from "./MobileNav";
import { SideNav } from "./SideNav";
import type { NavLink } from "./nav-links";

export type { NavLink };

type Props = {
  variant: "home" | "index" | "detail";
  links?: NavLink[];
  back?: NavLink;
  children: ReactNode;
};

export function SiteShell({ variant, links, back, children }: Props) {
  return (
    <>
      <MobileNav links={links} back={back} />
      <div className="md:grid md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[400px_minmax(0,1fr)]">
        <SideNav variant={variant} links={links} back={back} />
        <main id="content" className="px-4 py-10 md:px-0 md:py-16">
          <div className="max-w-[760px]">{children}</div>
        </main>
      </div>
    </>
  );
}
