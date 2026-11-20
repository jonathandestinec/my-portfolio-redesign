/** The five market-survey questions, with what to listen for. */
export const DISCOVERY_QUESTIONS = [
  { key: "q1", question: "Walk me through how an order reaches you now.", hint: "Listen for the step done by hand." },
  { key: "q2", question: "What part of that goes wrong most often?", hint: "Their words for the problem. Write them down exactly." },
  { key: "q3", question: "How often does that happen, and what does it cost you when it does?", hint: "Your value number. Push gently for a figure." },
  { key: "q4", question: "Who else would have to agree before you tried something new?", hint: "Find the decision-maker now, not after the proposal." },
  { key: "q5", question: "If I showed you something next week, would you look at it?", hint: "A soft yes is all you came for." },
] as const;

export type DiscoveryKey = (typeof DISCOVERY_QUESTIONS)[number]["key"];

export type DiscoveryNotes = {
  contactName: string;
  contactRole: string;
  contactEmail: string;
  contactPhone: string;
  metOn: string;
  answers: Record<DiscoveryKey, string>;
  /** The figure from question 3, e.g. "~20 missed orders a week, about ₦300,000". */
  valueNumber: string;
  /** From question 4. */
  decisionMaker: string;
  followUp: "" | "yes" | "maybe" | "no";
  followUpOn: string;
  notes: string;
};

export const emptyDiscovery = (): DiscoveryNotes => ({
  contactName: "",
  contactRole: "",
  contactEmail: "",
  contactPhone: "",
  metOn: "",
  answers: { q1: "", q2: "", q3: "", q4: "", q5: "" },
  valueNumber: "",
  decisionMaker: "",
  followUp: "",
  followUpOn: "",
  notes: "",
});
