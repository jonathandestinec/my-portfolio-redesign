import "server-only";
import path from "node:path";
import { createElement } from "react";
import { Document, Font, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { paragraphs, toBlocks } from "./blocks";
import { formatMoney } from "./money";
import { formatDate } from "./snapshot";
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

        <Text style={s.h2}>What you need</Text>
        {paragraphs(snap.brief).map((p) => (
          <Text key={p} style={s.p}>
            {p}
          </Text>
        ))}

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

        {snap.scope.length ? (
          <>
            <Text style={s.h2}>Scope</Text>
            {snap.scope.map((it, i) => (
              <View key={i} style={s.li}>
                <Text style={s.bullet}>–</Text>
                <Text style={s.liText}>
                  <Text style={{ fontWeight: 600 }}>{it.title}</Text>
                  {it.description ? `: ${it.description}` : ""}
                </Text>
              </View>
            ))}
          </>
        ) : null}

        <Text style={s.h2}>Milestones and price</Text>
        {snap.milestones.map((m, i) => (
          <View key={i} style={s.row} wrap={false}>
            <View style={s.rowTitle}>
              <Text style={{ fontWeight: 600 }}>{m.title}</Text>
              {m.description ? <Text style={s.muted}>{m.description}</Text> : null}
              {m.due ? <Text style={s.muted}>{m.due}</Text> : null}
            </View>
            <Text>{money(m.amountMinor)}</Text>
          </View>
        ))}
        <View style={s.total}>
          <Text>Total</Text>
          <Text>{money(snap.totalMinor)}</Text>
        </View>
        {foot}
      </Page>

      <Page size="A4" style={s.page}>
        <Text style={s.title}>Agreement</Text>
        <View style={{ marginTop: 10 }}>
          <Blocks text={snap.contract} />
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
            The fingerprint is a SHA-256 hash of the exact proposal both parties signed: contract text, prices, scope, parties and version.
            Any change to that content gives a different fingerprint.
          </Text>
          <AuditRow k="Proposal" v={`Proposal for ${snap.client.name}, version ${snap.version}`} />
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
