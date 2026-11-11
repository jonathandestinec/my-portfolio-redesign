"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Ctx = { hidden: boolean; adjust: (delta: 1 | -1) => void };

const NavVisibilityContext = createContext<Ctx>({ hidden: false, adjust: () => {} });

export function NavVisibilityProvider({ children }: { children: ReactNode }) {
  // Count of zones currently crossing the band, so overlapping zones can't un-hide early.
  const [count, setCount] = useState(0);
  const adjust = useCallback((delta: 1 | -1) => setCount((c) => Math.max(0, c + delta)), []);
  const value = useMemo(() => ({ hidden: count > 0, adjust }), [count, adjust]);
  return <NavVisibilityContext.Provider value={value}>{children}</NavVisibilityContext.Provider>;
}

export function useNavHidden(): boolean {
  return useContext(NavVisibilityContext).hidden;
}

export function HideNavZone({ children }: { children: ReactNode }) {
  const { adjust } = useContext(NavVisibilityContext);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let inside = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const now = entries[entries.length - 1].isIntersecting;
        if (now === inside) return;
        inside = now;
        adjust(now ? 1 : -1);
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (inside) adjust(-1);
    };
  }, [adjust]);

  return <div ref={ref}>{children}</div>;
}
