import "server-only";
import path from "node:path";
import { createElement } from "react";
import { Document, Font, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { paragraphs, toBlocks } from "./blocks";
import { formatMoney } from "./money";
import { defaultOption, formatDate } from "./snapshot";
import type { InvoiceDetails } from "./invoice-types";
import type { Snapshot } from "./types";

/* eslint-disable jsx-a11y/alt-text -- react-pdf <Image> has no alt attribute */
// Noto Sans (SIL Open Font License) covers ₦ and typographic quotes; the built-in Helvetica does not.
const FONTS = path.join(process.cwd(), "lib", "proposals", "fonts");
Font.register({
  family: "Noto Sans",
  fonts: [
    { src: path.join(FONTS, "NotoSans-Regular.ttf"), fontWeight: 400 },
    { src: path.join(FONTS, "NotoSans-SemiBold.ttf"), fontWeight: 600 },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

export type PdfSignature = {
  role: "client" | "provider";
  optionId: string | null;
  name: string;
  email: string;
  title: string | null;
  method: "typed" | "drawn";
  signedAt: Date;
  ip: string | null;
  userAgent: string | null;
  contentSha256: string;
  image: Buffer | null;
};

const ink = "#171614";
const muted = "#5d5b55";
const line = "#dfdcd6";

const s = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 56, paddingHorizontal: 52, fontFamily: "Noto Sans", fontSize: 10, lineHeight: 1.5, color: ink },
  brands: { flexDirection: "row", alignItems: "center", marginBottom: 28 },
  wordmark: { fontSize: 15, fontWeight: 600, lineHeight: 1 },
  x: { marginHorizontal: 12, color: muted, fontSize: 13 },
  logo: { width: 34, height: 34, objectFit: "contain" },
  title: { fontSize: 20, fontWeight: 600, lineHeight: 1.25 },
  meta: { marginTop: 6, color: muted, fontSize: 9 },
  h2: { fontSize: 11, fontWeight: 600, marginTop: 22, marginBottom: 6 },
  h3: { fontSize: 10, fontWeight: 600, marginTop: 10, marginBottom: 2 },
  p: { marginBottom: 6 },
  muted: { color: muted },
  li: { flexDirection: "row", marginBottom: 3 },
  bullet: { width: 12, color: muted },
  liText: { flex: 1 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderTopWidth: 0.5, borderTopColor: line },
  rowTitle: { flex: 1, paddingRight: 16 },
  total: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, borderTopWidth: 1, borderTopColor: ink, fontWeight: 600 },
  sigs: { flexDirection: "row", marginTop: 8 },
  sig: { flex: 1, marginRight: 16, paddingTop: 6 },
  sigImg: { height: 54, objectFit: "contain", objectPositionX: 0, marginBottom: 4 },
  sigLine: { borderTopWidth: 0.5, borderTopColor: muted, paddingTop: 4 },
  foot: { position: "absolute", bottom: 24, left: 52, right: 52, fontSize: 8, color: muted, flexDirection: "row", justifyContent: "space-between" },
  mono: { fontSize: 8, color: ink },
  auditRow: { flexDirection: "row", paddingVertical: 4, borderTopWidth: 0.5, borderTopColor: line },
  auditKey: { width: 110, color: muted },
  auditVal: { flex: 1 },
});

function Blocks({ text }: { text: string }) {
  return (
    <View>
      {toBlocks(text).map((b, i) =>
        b.type === "h" ? (
          <Text key={i} style={s.h3}>
            {b.text}
          </Text>
        ) : b.type === "ul" ? (
          <View key={i} style={{ marginBottom: 6 }}>
            {b.items.map((it, j) => (
              <View key={j} style={s.li}>
                <Text style={s.bullet}>–</Text>
                <Text style={s.liText}>{it}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text key={i} style={s.p}>
            {b.text}
          </Text>
        ),
      )}
    </View>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <View style={{ marginBottom: 6 }}>
      {items.map((it, i) => (
        <View key={i} style={s.li}>
          <Text style={s.bullet}>–</Text>
          <Text style={s.liText}>{it}</Text>
        </View>
      ))}
    </View>
  );
}

function SignatureBlock({ sig, label }: { sig: PdfSignature | undefined; label: string }) {
  return (
    <View style={s.sig} wrap={false}>
      {sig?.image ? <Image src={sig.image} style={s.sigImg} /> : <View style={{ height: 58 }} />}
      <View style={s.sigLine}>
        <Text style={{ fontWeight: 600 }}>{sig ? sig.name : label}</Text>
        {sig?.title ? <Text style={s.muted}>{sig.title}</Text> : null}
        <Text style={s.muted}>{sig ? `Signed ${formatDate(sig.signedAt)}` : "Not signed yet"}</Text>
      </View>
    </View>
  );
}

const utc = (d: Date) => d.toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");

function ProposalPdf({
  snapshot: snap,
  logo,
  signatures,
  contentSha256,
}: {
  snapshot: Snapshot;
  logo: Buffer | null;
  signatures: PdfSignature[];
  contentSha256: string;
}) {
  const money = (m: number) => formatMoney(m, snap.currency);
  const provider = signatures.find((x) => x.role === "provider");
  const client = signatures.find((x) => x.role === "client");
  const chosen = client ? (snap.options.find((o) => o.id === client.optionId) ?? defaultOption(snap.options)) : null;
  // A signed PDF shows only what was agreed; before signing, every option.
  const options = chosen ? [chosen] : snap.options;
  const contractOption = chosen ?? defaultOption(snap.options);
  const foot = (
    <View style={s.foot} fixed>
      <Text>
        Proposal for {snap.client.name} · version {snap.version}
      </Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );

  return (
    <Document title={`Proposal for ${snap.client.name}`} author={snap.provider.name} creator={snap.provider.website}>
      <Page size="A4" style={s.page}>
        <View style={s.brands}>
          <Text style={s.wordmark}>{snap.provider.name}</Text>
          <Text style={s.x}>×</Text>
          {logo ? <Image src={logo} style={s.logo} /> : <Text style={s.wordmark}>{snap.client.name}</Text>}
        </View>
        <Text style={s.title}>Proposal for {snap.client.name}</Text>
        <Text style={s.meta}>
          Issued {formatDate(snap.issuedAt)}
          {snap.expiresAt ? ` · Valid until ${formatDate(snap.expiresAt)}` : ""} · Version {snap.version}
        </Text>

        {snap.intro ? (
          <View style={{ marginTop: 18 }}>
            {paragraphs(snap.intro).map((p) => (
              <Text key={p} style={s.p}>
                {p}
              </Text>
            ))}
          </View>
        ) : null}

        <Text style={s.h2}>In your words</Text>
        {paragraphs(snap.brief).map((p) => (
          <Text key={p} style={s.p}>
            {p}
          </Text>
        ))}

        {snap.objectives.length ? (
          <>
            <Text style={s.h2}>What success looks like</Text>
            <Bullets items={snap.objectives} />
          </>
        ) : null}

        {snap.work.length ? (
          <>
            <Text style={s.h2}>Relevant work</Text>
            {snap.work.map((w) => (
              <View key={w.key} style={{ marginBottom: 6 }} wrap={false}>
                <Text style={{ fontWeight: 600 }}>{w.name}</Text>
                <Text style={s.muted}>{w.note || w.summary}</Text>
                {w.caseStudyUrl || w.liveUrl ? <Text style={s.mono}>{[w.caseStudyUrl, w.liveUrl].filter(Boolean).join("  ·  ")}</Text> : null}
              </View>
            ))}
          </>
        ) : null}

        <Text style={s.h2}>{chosen ? `Chosen option: ${chosen.name}` : options.length > 1 ? "Options" : "Scope and price"}</Text>
        {options.map((o) => (
          <View key={o.id} style={{ marginBottom: 12 }} wrap={false}>
            <View style={s.total}>
              <Text>
                {o.name}
                {o.recommended && !chosen && options.length > 1 ? "  (recommended)" : ""}
              </Text>
              <Text>{money(o.priceMinor)}</Text>
            </View>
            {o.summary ? <Text style={[s.muted, { marginBottom: 4 }]}>{o.summary}</Text> : null}
            {o.deliverables.map((d, i) => (
              <View key={i} style={s.li}>
                <Text style={s.bullet}>–</Text>
                <Text style={s.liText}>
                  <Text style={{ fontWeight: 600 }}>{d.title}</Text>
                  {d.description ? `: ${d.description}` : ""}
                  {d.format ? ` · ${d.format}` : ""}
                </Text>
              </View>
            ))}
            {o.timeline.length ? (
              <Text style={[s.muted, { marginTop: 3 }]}>
                {o.timeline.map((t) => (t.day ? `Day ${t.day}: ${t.title}` : t.title)).join("  ·  ")}
              </Text>
            ) : null}
            {snap.terms && o.depositMinor > 0 ? (
              <Text style={[s.muted, { marginTop: 3 }]}>
                Deposit {money(o.depositMinor)} · balance {money(o.balanceMinor)}
                {o.workingDays ? ` · ${o.workingDays} working days from deposit` : ""}
              </Text>
            ) : null}
          </View>
        ))}

        {snap.outOfScope.length ? (
          <>
            <Text style={s.h2}>Not included</Text>
            <Bullets items={snap.outOfScope} />
          </>
        ) : null}
        {snap.responsibilities.length ? (
          <>
            <Text style={s.h2}>What I’ll need from you</Text>
            <Bullets items={snap.responsibilities.map((r) => (r.by ? `${r.item} (by ${r.by})` : r.item))} />
          </>
        ) : null}
        {snap.acceptance.length ? (
          <>
            <Text style={s.h2}>How we’ll agree it’s finished</Text>
            <Bullets items={snap.acceptance} />
          </>
        ) : null}
        {foot}
      </Page>

      <Page size="A4" style={s.page}>
        <Text style={s.title}>Agreement</Text>
        {!chosen && options.length > 1 ? (
          <Text style={s.meta}>Shown for the {contractOption.name} option. The agreement adapts to the option chosen when signing.</Text>
        ) : null}
        <View style={{ marginTop: 10 }}>
          <Blocks text={contractOption.contract} />
        </View>
        <Text style={s.h2}>Signatures</Text>
        <View style={s.sigs}>
          <SignatureBlock sig={provider} label={snap.provider.name} />
          <SignatureBlock sig={client} label={snap.client.contactName || snap.client.name} />
        </View>
        {foot}
      </Page>

      {client ? (
        <Page size="A4" style={s.page}>
          <Text style={s.title}>Audit record</Text>
          <Text style={[s.meta, { marginBottom: 14 }]}>
            The fingerprint is a SHA-256 hash of the exact proposal both parties signed: every option with its contract text, prices, scope and timeline, the parties and the version.
            Any change to that content gives a different fingerprint.
          </Text>
          <AuditRow k="Proposal" v={`Proposal for ${snap.client.name}, version ${snap.version}`} />
          {chosen ? <AuditRow k="Option chosen" v={`${chosen.name} (${money(chosen.priceMinor)})`} /> : null}
          <AuditRow k="Issued" v={utc(new Date(snap.issuedAt))} />
          <AuditRow k="Fingerprint" v={contentSha256} mono />
          {[provider, client].filter((x): x is PdfSignature => Boolean(x)).map((x) => (
            <View key={x.role} style={{ marginTop: 14 }} wrap={false}>
              <Text style={s.h3}>{x.role === "provider" ? "Provider" : "Client"}</Text>
              <AuditRow k="Name" v={x.name} />
              {x.title ? <AuditRow k="Title" v={x.title} /> : null}
              <AuditRow k="Email" v={x.email} />
              <AuditRow k="Signed at" v={utc(x.signedAt)} />
              <AuditRow k="Method" v={x.method === "typed" ? "Typed name" : "Drawn signature"} />
              <AuditRow k="IP address" v={x.ip ?? "not recorded"} />
              <AuditRow k="Browser" v={x.userAgent ?? "not recorded"} />
              <AuditRow k="Fingerprint signed" v={x.contentSha256} mono />
            </View>
          ))}
          {foot}
        </Page>
      ) : null}
    </Document>
  );
}

function AuditRow({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <View style={s.auditRow}>
      <Text style={s.auditKey}>{k}</Text>
      <Text style={[s.auditVal, mono ? s.mono : {}]}>{v}</Text>
    </View>
  );
}

/** react-pdf reads PNG and JPEG only; other logo types are left out of the PDF. */
export const pdfImage = (file: { body: Buffer; contentType: string } | null) =>
  file && (file.contentType === "image/png" || file.contentType === "image/jpeg") ? file.body : null;

export async function buildProposalPdf(input: {
  snapshot: Snapshot;
  logo: Buffer | null;
  signatures: PdfSignature[];
  contentSha256: string;
}): Promise<Buffer> {
  return renderToBuffer(createElement(ProposalPdf, input) as never);
}

// ---------- Invoices ----------

type InvoicePdfInput = {
  number: string;
  kind: "deposit" | "balance";
  issuedAt: Date;
  dueAt: Date;
  paidAt: Date | null;
  state: "paid" | "void" | "unpaid" | "overdue";
  amountMinor: number;
  details: InvoiceDetails;
};

function InvoicePdf({ inv }: { inv: InvoicePdfInput }) {
  const d = inv.details;
  const money = (m: number) => formatMoney(m, d.currency);
  const row = (k: string, v: React.ReactNode) => (
    <View style={s.auditRow}>
      <Text style={s.auditKey}>{k}</Text>
      <View style={s.auditVal}>{typeof v === "string" ? <Text>{v}</Text> : v}</View>
    </View>
  );
  return (
    <Document title={`Invoice ${inv.number}`} author={d.from.businessName}>
      <Page size="A4" style={s.page}>
        <Text style={s.wordmark}>{d.from.businessName}</Text>
        <Text style={[s.meta, { marginBottom: 22 }]}>{[d.from.phone, d.from.email, d.from.address].filter(Boolean).join(" · ")}</Text>
        <Text style={s.title}>Invoice {inv.number}</Text>
        <Text style={s.meta}>{inv.state === "paid" && inv.paidAt ? `Paid ${formatDate(inv.paidAt)}` : inv.state === "overdue" ? "Overdue" : "Unpaid"}</Text>

        <View style={{ marginTop: 18 }}>
          {row("Invoice no.", inv.number)}
          {row("Issued", formatDate(inv.issuedAt))}
          {row("Due", formatDate(inv.dueAt))}
          {row("Billed to", `${d.client.name}${d.client.contactName ? ` · ${d.client.contactName}` : ""}`)}
          {row(
            "For",
            <View>
              <Text style={{ fontWeight: 600 }}>{d.forTitle}</Text>
              {d.forLines.map((l) => (
                <Text key={l} style={s.muted}>
                  {l}
                </Text>
              ))}
            </View>,
          )}
        </View>

        <Text style={s.h2}>Amount</Text>
        <View style={s.row}>
          <Text>Project total</Text>
          <Text>{money(d.amounts.totalMinor)}</Text>
        </View>
        {d.amounts.depositPaidMinor > 0 ? (
          <View style={s.row}>
            <Text>Deposit paid</Text>
            <Text>−{money(d.amounts.depositPaidMinor)}</Text>
          </View>
        ) : null}
        <View style={s.total}>
          <Text>{inv.kind === "deposit" ? "Deposit due now" : "Balance due"}</Text>
          <Text>{money(inv.amountMinor)}</Text>
        </View>
        {d.amounts.balanceAfterMinor > 0 ? (
          <View style={s.row}>
            <Text style={s.muted}>Balance after this, on acceptance</Text>
            <Text style={s.muted}>{money(d.amounts.balanceAfterMinor)}</Text>
          </View>
        ) : null}

        <Text style={s.h2}>How to pay</Text>
        <Text style={s.p}>Pay online from the invoice link you were sent (card or transfer through Paystack), or by bank transfer:</Text>
        {d.from.bankName ? (
          <View>
            {row("Bank", d.from.bankName)}
            {row("Account name", d.from.accountName)}
            {row("Account no.", d.from.accountNumber)}
            {row("Reference", inv.number)}
          </View>
        ) : null}
        <Text style={[s.muted, { marginTop: 14 }]}>{d.terms}</Text>
      </Page>
    </Document>
  );
}

export async function buildInvoicePdf(inv: InvoicePdfInput): Promise<Buffer> {
  return renderToBuffer(createElement(InvoicePdf, { inv }) as never);
}
