"use client";

import { createContext, use, useState, type ReactNode } from "react";

/** Which option the client is looking at and will sign for. Shared by the option cards, the agreement and the sign form. */
const ChoiceContext = createContext<{ selected: string; select: (id: string) => void } | null>(null);

export function ChoiceProvider({ initial, children }: { initial: string; children: ReactNode }) {
  const [selected, select] = useState(initial);
  return <ChoiceContext value={{ selected, select }}>{children}</ChoiceContext>;
}

export function useChoice() {
  const ctx = use(ChoiceContext);
  if (!ctx) throw new Error("useChoice needs a ChoiceProvider");
  return ctx;
}

export type OptionCardData = {
  id: string;
  name: string;
  recommended: boolean;
  /** Server-rendered body (summary, deliverables, timeline, price). */
  body: ReactNode;
};

/** The options as selectable cards. A real radio group, so it works with a keyboard and screen readers. */
export function OptionCards({ options, locked }: { options: OptionCardData[]; locked?: boolean }) {
  const { selected, select } = useChoice();
  return (
    <div className="pp-options" role={locked ? undefined : "radiogroup"} aria-label={locked ? undefined : "Options"}>
      {options.map((o) => {
        const on = o.id === selected;
        return (
          <label key={o.id} className={`pp-option card${on ? " is-on" : ""}${locked ? " is-locked" : ""}`}>
            {locked ? null : (
              <input type="radio" name="option" value={o.id} checked={on} onChange={() => select(o.id)} className="sr-only" />
            )}
            <div className="card__body">
              <div className="pp-option__head">
                <span className="pp-option__name">{o.name}</span>
                {o.recommended && !locked ? <span className="chip pp-option__rec">Recommended</span> : null}
                {locked ? null : (
                  <span className="pp-option__radio" aria-hidden="true">
                    {on ? "Selected" : "Choose"}
                  </span>
                )}
              </div>
              {o.body}
            </div>
          </label>
        );
      })}
    </div>
  );
}

/** Shows the agreement filled in for the selected option. */
export function ChosenContract({ contracts }: { contracts: { id: string; node: ReactNode }[] }) {
  const { selected } = useChoice();
  return <>{(contracts.find((c) => c.id === selected) ?? contracts[0])?.node}</>;
}

/** Text that depends on the selected option (e.g. the deposit amount in "How to say yes"). */
export function ChosenText({ values }: { values: Record<string, string> }) {
  const { selected } = useChoice();
  return <>{values[selected] ?? Object.values(values)[0]}</>;
}
