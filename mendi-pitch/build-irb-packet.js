// Generate the EEGBase × Mendi IRB packet (sample) as a .docx
// Run: NODE_PATH=$(npm root -g) node build-irb-packet.js

const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageOrientation, Header, Footer, PageNumber,
} = require("docx");

// ─────────────────────────────────────────────────────────────
const NAVY = "0F172A";
const VIOLET = "7C3AED";
const MUTED = "64748B";
const BORDER_COLOR = "CBD5E1";

const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR };
const allBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const p = (text, opts = {}) =>
  new Paragraph({
    spacing: { after: opts.after ?? 100, before: opts.before ?? 0 },
    alignment: opts.align,
    children: [new TextRun({ text, bold: opts.bold, italics: opts.italics, color: opts.color, size: opts.size ?? 22 })],
  });

const h1 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 180 },
    children: [new TextRun({ text, bold: true, size: 32, color: NAVY })],
  });

const h2 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 26, color: NAVY })],
  });

const bullet = (text) =>
  new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 22 })],
  });

const richBullet = (runs) =>
  new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 80 },
    children: runs.map((r) => new TextRun({ ...r, size: 22 })),
  });

const tableCell = (text, opts = {}) =>
  new TableCell({
    borders: allBorders,
    width: { size: opts.w, type: WidthType.DXA },
    shading: opts.bg ? { fill: opts.bg, type: ShadingType.CLEAR } : undefined,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    children: [new Paragraph({
      alignment: opts.align,
      children: [new TextRun({ text, bold: opts.bold, size: opts.size ?? 20, color: opts.color })],
    })],
  });

// ─────────────────────────────────────────────────────────────
// CONTENT
// ─────────────────────────────────────────────────────────────
const headerPara = () =>
  new Paragraph({
    spacing: { after: 0 },
    children: [
      new TextRun({ text: "EEGBase × Mendi", bold: true, size: 18, color: NAVY }),
      new TextRun({ text: "  ·  IRB Application Packet (sample)", size: 18, color: MUTED }),
    ],
  });

const footerPara = () =>
  new Paragraph({
    spacing: { after: 0 },
    children: [
      new TextRun({ text: "Confidential · NDA-gated · ", size: 16, color: MUTED }),
      new TextRun({ text: "Page ", size: 16, color: MUTED }),
      new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUTED }),
      new TextRun({ text: " of ", size: 16, color: MUTED }),
      new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: MUTED }),
    ],
  });

const doc = new Document({
  creator: "EEGBase",
  title: "EEGBase × Mendi IRB Application Packet (Sample)",
  description: "Sample IRB packet for the proposed multi-clinic registry of fNIRS neurofeedback in adolescent ADHD",
  styles: {
    default: { document: { run: { font: "Calibri", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Calibri", color: NAVY },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Calibri", color: NAVY },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
    }],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
      },
    },
    headers: { default: new Header({ children: [headerPara()] }) },
    footers: { default: new Footer({ children: [footerPara()] }) },
    children: [
      // ── Title
      new Paragraph({
        spacing: { before: 240, after: 120 },
        children: [new TextRun({ text: "IRB APPLICATION PACKET (SAMPLE)", bold: true, size: 18, color: VIOLET, characterSpacing: 4 })],
      }),
      new Paragraph({
        spacing: { after: 180 },
        children: [new TextRun({ text: "Home-use fNIRS Neurofeedback in Adolescent ADHD: A Multi-Clinic Naturalistic Registry", bold: true, size: 36, color: NAVY })],
      }),
      new Paragraph({
        spacing: { after: 360 },
        children: [
          new TextRun({ text: "Sponsor: ", color: MUTED }),
          new TextRun({ text: "EEGBase, Inc.  ", bold: true }),
          new TextRun({ text: "Co-sponsor: ", color: MUTED }),
          new TextRun({ text: "Mendi (proposed)  ", bold: true }),
          new TextRun({ text: "Version: ", color: MUTED }),
          new TextRun({ text: "v0.4 · sample", bold: true }),
        ],
      }),

      // ── Cover summary table
      new Table({
        width: { size: 10080, type: WidthType.DXA },
        columnWidths: [3024, 7056],
        rows: [
          new TableRow({ children: [
            tableCell("Study title", { w: 3024, bold: true, bg: "F1F5F9" }),
            tableCell("Home-use fNIRS Neurofeedback in Adolescent ADHD: A 412-clinic Naturalistic Registry", { w: 7056 }),
          ]}),
          new TableRow({ children: [
            tableCell("Design", { w: 3024, bold: true, bg: "F1F5F9" }),
            tableCell("Naturalistic, multi-site, prospective registry. Pre-registered on OSF. Q3 2026 → Q4 2026.", { w: 7056 }),
          ]}),
          new TableRow({ children: [
            tableCell("Population", { w: 3024, bold: true, bg: "F1F5F9" }),
            tableCell("Adolescents ages 12–17 with DSM-5 ADHD diagnosis. Target N = 2,840 across 412 clinics.", { w: 7056 }),
          ]}),
          new TableRow({ children: [
            tableCell("Intervention", { w: 3024, bold: true, bg: "F1F5F9" }),
            tableCell("Home-use Mendi fNIRS prefrontal alpha up-train, 20-session protocol, 25 Hz sampling.", { w: 7056 }),
          ]}),
          new TableRow({ children: [
            tableCell("Primary outcome", { w: 3024, bold: true, bg: "F1F5F9" }),
            tableCell("ADHD-RS-IV total score change from baseline at session 20.", { w: 7056 }),
          ]}),
          new TableRow({ children: [
            tableCell("Secondary outcomes", { w: 3024, bold: true, bg: "F1F5F9" }),
            tableCell("PHQ-9, GAD-7, sleep efficiency (Oura), reward-score trajectory, ΔHbO at Fp1/Fp2.", { w: 7056 }),
          ]}),
          new TableRow({ children: [
            tableCell("Risk level", { w: 3024, bold: true, bg: "F1F5F9" }),
            tableCell("Minimal — no investigational device, no investigational drug, software-only data aggregation.", { w: 7056 }),
          ]}),
          new TableRow({ children: [
            tableCell("Funding", { w: 3024, bold: true, bg: "F1F5F9" }),
            tableCell("EEGBase research credits 2026 Q2 + Mendi MDF (proposed).", { w: 7056 }),
          ]}),
        ],
      }),

      h1("1 · Specific Aims"),
      p("This registry will assess real-world effectiveness, safety, and adherence of home-use Mendi fNIRS neurofeedback in adolescent ADHD when paired with weekly clinic supervision via the EEGBase clinical platform."),
      p("Specific aims:", { bold: true, after: 80 }),
      bullet("Aim 1 — Quantify ADHD-RS change at 20 sessions across a heterogeneous community-clinic population (n ≈ 2,840 adolescents)."),
      bullet("Aim 2 — Identify pre-treatment predictors of response (baseline theta/beta z-score, sleep efficiency, medication status, family history)."),
      bullet("Aim 3 — Characterize adherence patterns: dropout rates, session-completion velocity, between-session check-in frequency."),
      bullet("Aim 4 — Establish a BIDS-fNIRS-compliant registry (BEP-030) for downstream secondary analyses by Mendi's science team and contributing clinics."),

      h1("2 · Background & Significance"),
      p("Recent meta-analyses of fNIRS-based neurofeedback for ADHD demonstrate small-to-moderate effects on inhibitory control and ADHD symptom reduction, with effect sizes comparable to standard EEG neurofeedback (Sitaram et al., 2017; Arns et al., 2014). Mendi's own working-memory validation (2023) demonstrated signal fidelity against research-grade fNIRS in adult subjects."),
      p("What is missing from the literature is a real-world, multi-clinic registry that captures the full distribution of patients seen in community practice, rather than the highly-selected samples typical of single-site academic trials. This registry directly addresses that gap."),

      h1("3 · Study Procedures"),
      h2("3.1 Recruitment"),
      bullet("Participants are referred from contributing community clinics already prescribing Mendi neurofeedback as part of standard care."),
      bullet("Eligible families are invited to consent to having their de-identified clinic data contributed to the registry."),
      bullet("Mendi-attached clinics are recruited via the EEGBase Partner Program; participation is voluntary and clinic-level opt-in."),

      h2("3.2 Inclusion criteria"),
      bullet("Age 12–17 at enrollment"),
      bullet("DSM-5 ADHD diagnosis confirmed by treating clinician"),
      bullet("Parent/guardian + assenting adolescent agree to data contribution"),
      bullet("Ability to comply with 20-session home protocol over 8–12 weeks"),

      h2("3.3 Exclusion criteria"),
      bullet("Comorbid psychotic disorder, current substance-use disorder, or head injury within prior 12 months"),
      bullet("Active suicidal ideation requiring higher level of care"),
      bullet("Prior neurofeedback treatment within 90 days"),

      h2("3.4 Intervention protocol"),
      p("Standard Mendi prefrontal alpha up-train protocol delivered at home: 20 sessions, 22 minutes each, paced 2–3 times per week. Each session is automatically streamed to EEGBase via Bluetooth + cloud sync. Weekly clinic visits (in-person or telehealth) for clinical oversight, protocol adjustment, and safety monitoring."),

      h2("3.5 Outcome measures"),
      bullet("ADHD-RS-IV at baseline, session 10, session 20 (primary)"),
      bullet("PHQ-9, GAD-7 at baseline, session 10, session 20"),
      bullet("In-app daily mood + sleep self-report (Likert 1–10)"),
      bullet("Apple Health / Oura passive sleep efficiency, HRV (consented subset)"),
      bullet("All session-level neurofeedback signals (Fp1, Fp2 OxyHb/DeoxyHb at 25 Hz)"),

      h1("4 · Data Management"),
      h2("4.1 Storage architecture"),
      richBullet([
        { text: "Site-of-care retention: ", bold: true },
        { text: "Raw waveforms remain on the contributing clinic's EEGBase instance. EEGBase, Inc. and Mendi receive only de-identified BIDS-compatible exports." },
      ]),
      richBullet([
        { text: "Region: ", bold: true },
        { text: "Registry data hosted on AWS us-east-1 (Tier IV) with encrypted cross-region replication to ca-central-1. EU clinics use eu-west-3 (Frankfurt) under Schrems II SCCs (2021/914)." },
      ]),
      richBullet([
        { text: "Encryption: ", bold: true },
        { text: "AES-256-GCM at rest. TLS 1.3 with forward secrecy in transit." },
      ]),

      h2("4.2 De-identification"),
      bullet("HIPAA Safe Harbor + Expert Determination per 45 CFR § 164.514"),
      bullet("Direct identifiers stripped at site-of-care prior to upload"),
      bullet("Linkage IDs are hashed pseudonyms; key held only by contributing clinic"),
      bullet("Geographic precision limited to first 3 zip-code digits per Safe Harbor"),

      h2("4.3 BIDS-fNIRS schema"),
      p("All exports conform to BIDS Extension Proposal 30 (BEP-030) for fNIRS data. Each session produces (a) a SNIRF binary file with raw signals and (b) a JSON sidecar with metadata, motion-artifact statistics, preprocessing pipeline, and outcome scores. A sample sidecar is included as Appendix A and available at eegbase.vercel.app/downloads."),

      h2("4.4 Data sharing"),
      bullet("Mendi science team receives a quarterly de-identified BIDS export under the registry DUA"),
      bullet("Contributing clinics receive their own dataset + access to aggregate statistics across the registry"),
      bullet("Public release of aggregate-level findings via OSF after publication; individual-level data not released"),

      h1("5 · Risks & Benefits"),
      h2("5.1 Risks"),
      bullet("Minimal physical risk: Mendi headband is FDA general-wellness, CE Class I, non-invasive"),
      bullet("Privacy risk mitigated by Safe Harbor + Expert Determination + DUA"),
      bullet("Psychological risk: standard for adolescent ADHD treatment; no greater than usual care"),

      h2("5.2 Benefits"),
      bullet("Direct: clinical outcomes from improved ADHD symptom management (per existing evidence)"),
      bullet("Indirect: contribution to scientific literature; benefits future patients"),
      bullet("No financial compensation; no inducement"),

      h1("6 · Informed Consent / Assent"),
      p("Three documents are provided to participants:"),
      bullet("Parent/Guardian Consent (long form, plain language, 8th-grade reading level, English + Spanish)"),
      bullet("Adolescent Assent (age-appropriate, explains what data is shared and why)"),
      bullet("Optional Research Consent (separate from clinical consent, freely revocable)"),
      p("All consent forms are administered in EEGBase's HIPAA-compliant electronic consent flow. Time-stamped audit logs of consent events are retained for 7 years."),

      h1("7 · Data & Safety Monitoring Plan (DSMP)"),
      p("A Data & Safety Monitoring Board (DSMB) of 3 external members reviews aggregate data quarterly. The DSMB has authority to recommend protocol modification or registry pause if any of the following thresholds are crossed:"),
      bullet("Adverse event rate > 2× baseline community standard"),
      bullet("Drop-out rate > 35% at session 10"),
      bullet("Any serious adverse event requiring hospitalization"),
      p("Public DSMB charter and quarterly summaries published at eegbase.vercel.app/status."),

      h1("8 · Statistical Analysis Plan"),
      bullet("Primary: ADHD-RS change from baseline analyzed via mixed-effects model with random effects for clinic + clinician"),
      bullet("Secondary: PHQ-9, GAD-7 change tested with bonferroni-corrected paired t-tests"),
      bullet("Pre-registered effect size: clinically meaningful improvement defined as ADHD-RS reduction ≥ 30%"),
      bullet("Powered to detect effect size d ≥ 0.40 at α = 0.01 with n = 2,840"),

      h1("9 · Investigator Team"),
      new Table({
        width: { size: 10080, type: WidthType.DXA },
        columnWidths: [3024, 4032, 3024],
        rows: [
          new TableRow({ children: [
            tableCell("Role", { w: 3024, bold: true, bg: "F1F5F9" }),
            tableCell("Name", { w: 4032, bold: true, bg: "F1F5F9" }),
            tableCell("Affiliation", { w: 3024, bold: true, bg: "F1F5F9" }),
          ]}),
          new TableRow({ children: [
            tableCell("Principal Investigator", { w: 3024 }),
            tableCell("[Insert name, PhD/MD]", { w: 4032 }),
            tableCell("EEGBase, Inc.", { w: 3024 }),
          ]}),
          new TableRow({ children: [
            tableCell("Co-Investigator (clinical)", { w: 3024 }),
            tableCell("[Insert clinical advisor name, BCN]", { w: 4032 }),
            tableCell("Cedar Valley NF (proposed)", { w: 3024 }),
          ]}),
          new TableRow({ children: [
            tableCell("Co-Investigator (research)", { w: 3024 }),
            tableCell("[Insert research advisor name, PhD]", { w: 4032 }),
            tableCell("[Insert academic affiliation]", { w: 3024 }),
          ]}),
          new TableRow({ children: [
            tableCell("Mendi science team rep", { w: 3024 }),
            tableCell("[Mendi designate]", { w: 4032 }),
            tableCell("Mendi (proposed)", { w: 3024 }),
          ]}),
          new TableRow({ children: [
            tableCell("DPO / Compliance counsel", { w: 3024 }),
            tableCell("[Insert DPO name]", { w: 4032 }),
            tableCell("EEGBase, Inc.", { w: 3024 }),
          ]}),
        ],
      }),

      h1("10 · Conflicts of Interest"),
      p("EEGBase, Inc. is a commercial company that operates the platform on which the registry runs. Mendi (proposed co-sponsor) is the manufacturer of the hardware studied. These conflicts are disclosed to the IRB, to participants in the consent form, and in any resulting publication. The DSMB membership is independent of both companies."),

      h1("11 · Timeline"),
      bullet("Q3 2026 — IRB submission, site recruitment, registry build-out"),
      bullet("Q4 2026 — Enrollment starts (target 200 sites enrolled, 800 participants)"),
      bullet("Q1 2027 — Mid-registry interim analysis and DSMB review"),
      bullet("Q2 2027 — Full target enrollment (n = 2,840)"),
      bullet("Q3 2027 — 20-session follow-up complete on cohort 1"),
      bullet("Q4 2027 — Primary analysis + Frontiers in Human Neuroscience submission"),

      h1("12 · Appendices (referenced separately)"),
      bullet("Appendix A — Sample BIDS-fNIRS sidecar (sub-021_ses-08_task-focus_nirs.json)"),
      bullet("Appendix B — Parent/Guardian consent form (8th-grade reading level)"),
      bullet("Appendix C — Adolescent assent form"),
      bullet("Appendix D — Data Use Agreement (EEGBase ↔ Mendi ↔ Site)"),
      bullet("Appendix E — DSMB charter + quarterly review template"),
      bullet("Appendix F — Recruitment materials (clinic + family-facing)"),
      bullet("Appendix G — Data safety + breach response runbook"),

      // ── Closing
      new Paragraph({ spacing: { before: 480, after: 120 }, children: [new TextRun({ text: "—", color: MUTED })] }),
      new Paragraph({
        children: [
          new TextRun({ text: "Sample IRB packet for the EEGBase × Mendi partnership pitch. ", bold: true, color: NAVY, size: 20 }),
          new TextRun({ text: "Replace bracketed placeholders with real personnel before submitting to your IRB of record. The intellectual content is provided as-is and reflects EEGBase's recommended structure based on common neurofeedback registry IRB approvals (BCIA, ISNR, AAPB-style review boards).", color: MUTED, size: 20 }),
        ],
      }),
      new Paragraph({
        spacing: { before: 240 },
        children: [
          new TextRun({ text: "Contact: ", color: MUTED, size: 20 }),
          new TextRun({ text: "research@eegbase.com  ·  ", bold: true, size: 20 }),
          new TextRun({ text: "github.com/jpiscool/eegbase  ·  ", color: MUTED, size: 20 }),
          new TextRun({ text: "eegbase.vercel.app/mendi", color: MUTED, size: 20 }),
        ],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  const out = path.join(__dirname, "..", "public", "downloads", "EEGBase-Mendi-IRB-Packet-Sample.docx");
  fs.writeFileSync(out, buf);
  console.log(`✓ Built ${out} (${buf.length} bytes)`);
});
