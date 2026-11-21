import type { Currency } from "./types";

/** Your business details shown on invoices. Edited in /desk/settings, stored in the database (not the public repo). */
export type BusinessSettings = {
  businessName: string;
  phone: string;
  email: string;
  address: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
};

export const emptyBusiness = (): BusinessSettings => ({
  businessName: "",
  phone: "",
  email: "",
  address: "",
  bankName: "",
  accountName: "",
  accountNumber: "",
});

/** Everything printed on one invoice, frozen when it is issued (the nine lines). */
export type InvoiceDetails = {
  from: BusinessSettings;
  client: { name: string; contactName: string; contactEmail: string };
  /** "What it is for": the offer and what was (or will be) delivered. */
  forTitle: string;
  forLines: string[];
  amounts: { totalMinor: number; depositPaidMinor: number; thisInvoiceMinor: number; balanceAfterMinor: number };
  currency: Currency;
  terms: string;
};
