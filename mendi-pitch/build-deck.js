// Mendi × EEGBase pitch deck — 15 slides
// Run: node build-deck.js

const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3" × 7.5"
pres.author = "EEGBase";
pres.title = "EEGBase × Mendi — Clinical Partnership Proposal";
pres.subject = "Partnership pitch · Q2 2026";

// ───────────────────────────────────────────────────────────
// PALETTE
// ───────────────────────────────────────────────────────────
const C = {
  navy:    "0F172A",  // dark slides
  ink:     "1E293B",
  inkSoft: "475569",
  muted:   "64748B",
  subtle:  "94A3B8",
  border:  "E2E8F0",
  light:   "F8FAFC",
  white:   "FFFFFF",
  blue:    "2563EB",
  blueLt:  "DBEAFE",
  violet:  "7C3AED",
  violetLt:"EDE9FE",
  emerald: "10B981",
  emeraldLt:"D1FAE5",
  amber:   "F59E0B",
  amberLt: "FEF3C7",
  rose:    "E11D48",
};

const FONT_HEADER = "Calibri";
const FONT_BODY   = "Calibri";

// Slide dims
const W = 13.3;
const H = 7.5;

// ───────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────
const tag = (slide, txt, x, y, w, h, color) => {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    fill: { color: C[color + "Lt"] || C.violetLt },
    line: { type: "none" },
    rectRadius: 0.05,
  });
  slide.addText(txt, {
    x, y, w, h,
    fontSize: 9, bold: true, fontFace: FONT_HEADER,
    color: C[color] || C.violet,
    align: "center", valign: "middle", margin: 0,
    charSpacing: 1.5,
  });
};

const slideNum = (slide, n) => {
  slide.addText(`${n} / 15`, {
    x: W - 1.0, y: H - 0.45, w: 0.6, h: 0.3,
    fontSize: 9, color: C.subtle, fontFace: FONT_BODY,
    align: "right", valign: "middle", margin: 0,
  });
  slide.addText("EEGBase × Mendi", {
    x: 0.5, y: H - 0.45, w: 3, h: 0.3,
    fontSize: 9, color: C.subtle, fontFace: FONT_BODY,
    align: "left", valign: "middle", margin: 0,
  });
};

const slideTitle = (slide, eyebrow, title, eyebrowColor = "blue") => {
  slide.addText(eyebrow, {
    x: 0.65, y: 0.5, w: 8, h: 0.35,
    fontSize: 11, bold: true, charSpacing: 3,
    color: C[eyebrowColor] || C.blue, fontFace: FONT_HEADER,
    align: "left", valign: "top", margin: 0,
  });
  slide.addText(title, {
    x: 0.6, y: 0.85, w: 12, h: 1.1,
    fontSize: 32, bold: true, color: C.navy, fontFace: FONT_HEADER,
    align: "left", valign: "top", margin: 0,
    charSpacing: -0.5,
  });
};

// ═══════════════════════════════════════════════════════════
// SLIDE 1 — COVER (dark)
// ═══════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.navy };

  // Decorative arc rings on right (visual motif)
  const arcCenterX = W - 2.0;
  const arcCenterY = H / 2;
  [3.5, 2.5, 1.5].forEach((r, i) => {
    s.addShape(pres.shapes.OVAL, {
      x: arcCenterX - r, y: arcCenterY - r, w: r * 2, h: r * 2,
      fill: { color: C.navy },
      line: { color: i === 0 ? "1E3A8A" : i === 1 ? "3730A3" : C.violet, width: 1 + i * 0.3 },
    });
  });

  // Top label
  s.addText("PARTNERSHIP PROPOSAL · Q2 2026", {
    x: 0.65, y: 0.7, w: 6, h: 0.35,
    fontSize: 11, bold: true, charSpacing: 3,
    color: C.subtle, fontFace: FONT_HEADER,
    align: "left", margin: 0,
  });

  // Big title
  s.addText([
    { text: "EEGBase ", options: { color: C.white, bold: true } },
    { text: "× ", options: { color: C.violet, bold: true } },
    { text: "Mendi", options: { color: C.violet, bold: true } },
  ], {
    x: 0.6, y: 2.0, w: 9, h: 1.2,
    fontSize: 60, fontFace: FONT_HEADER,
    align: "left", valign: "top", margin: 0,
    charSpacing: -2,
  });

  // Subtitle
  s.addText("The clinical layer for fNIRS at home and in clinic", {
    x: 0.65, y: 3.4, w: 9, h: 0.7,
    fontSize: 24, color: C.blueLt, fontFace: FONT_HEADER,
    align: "left", valign: "top", margin: 0,
    charSpacing: -0.3,
  });

  // Body
  s.addText("Mendi at home, Muse in clinic, Polar HRV, and Apple Health\nbecome one client record, one SOAP note, one billable session.", {
    x: 0.65, y: 4.4, w: 9, h: 1.0,
    fontSize: 14, color: C.subtle, fontFace: FONT_BODY,
    align: "left", valign: "top", margin: 0,
  });

  // Footer
  s.addText("eegbase.vercel.app/demo  ·  github.com/jpiscool/eegbase  ·  hello@eegbase.com", {
    x: 0.65, y: H - 0.7, w: 10, h: 0.35,
    fontSize: 11, color: C.subtle, fontFace: FONT_BODY,
    align: "left", margin: 0,
  });
}

// ═══════════════════════════════════════════════════════════
// SLIDE 2 — THE WEDGE (light)
// ═══════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  slideTitle(s, "01 · THE WEDGE", "Mendi sells exceptional consumer hardware.\nClinicians can't currently prescribe it.");

  // Underline shape on the title (Mendi's part)
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 2.0, w: 6.2, h: 0.04,
    fill: { color: C.violet }, line: { type: "none" },
  });

  // 2-column body
  const yStart = 2.6;
  const colW = 5.8;

  s.addText("THE GAP", {
    x: 0.65, y: yStart, w: colW, h: 0.35,
    fontSize: 11, bold: true, charSpacing: 3,
    color: C.violet, fontFace: FONT_HEADER, margin: 0,
  });
  s.addText("Mendi's science page lists working-memory validation (2023) and a published systematic review on fNIRS for ADHD.", {
    x: 0.65, y: yStart + 0.4, w: colW, h: 1.0,
    fontSize: 14, color: C.ink, fontFace: FONT_BODY, margin: 0,
    paraSpaceAfter: 6,
  });
  s.addText("What it doesn't yet have: a clinical software layer that turns home Mendi sessions into a billable, documentable, reimbursable clinic record.", {
    x: 0.65, y: yStart + 1.5, w: colW, h: 1.6,
    fontSize: 14, color: C.inkSoft, fontFace: FONT_BODY, margin: 0,
  });

  // Right column — the wedge
  s.addText("OUR WEDGE", {
    x: 7.0, y: yStart, w: colW, h: 0.35,
    fontSize: 11, bold: true, charSpacing: 3,
    color: C.blue, fontFace: FONT_HEADER, margin: 0,
  });

  // Big number callout
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 7.0, y: yStart + 0.45, w: colW, h: 2.7,
    fill: { color: C.light }, line: { color: C.border, width: 1 },
    rectRadius: 0.1,
  });
  s.addText("EEGBase", {
    x: 7.2, y: yStart + 0.6, w: 5.5, h: 0.5,
    fontSize: 18, bold: true, color: C.blue, fontFace: FONT_HEADER, margin: 0,
  });
  s.addText("is that layer.", {
    x: 7.2, y: yStart + 1.05, w: 5.5, h: 0.5,
    fontSize: 18, bold: false, color: C.ink, fontFace: FONT_HEADER, margin: 0,
  });
  s.addText("Open-source, hardware-agnostic, native Mendi support, EHR + claims + AI scribe + research registry — bundled.", {
    x: 7.2, y: yStart + 1.6, w: 5.4, h: 1.5,
    fontSize: 12, color: C.muted, fontFace: FONT_BODY, margin: 0,
  });

  slideNum(s, 2);
}

// ═══════════════════════════════════════════════════════════
// SLIDE 3 — MENDI TODAY (honest mirror, light)
// ═══════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  slideTitle(s, "02 · MENDI TODAY", "What you have, what you don't yet have");

  const yStart = 2.4;
  const colW = 6.0;

  // ──── HAVE column
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.65, y: yStart, w: 0.06, h: 4.0,
    fill: { color: C.emerald }, line: { type: "none" },
  });
  s.addText("WHAT MENDI HAS", {
    x: 0.85, y: yStart, w: colW, h: 0.35,
    fontSize: 11, bold: true, charSpacing: 3,
    color: C.emerald, fontFace: FONT_HEADER, margin: 0,
  });
  s.addText([
    { text: "Validated fNIRS hardware", options: { bold: true, color: C.ink, fontSize: 14, breakLine: true } },
    { text: "Working-memory study (2023) · 24 subjects · validated against research-grade fNIRS", options: { color: C.muted, fontSize: 11, breakLine: true } },
    { text: " ", options: { fontSize: 6, breakLine: true } },
    { text: "ADHD systematic review supports modality", options: { bold: true, color: C.ink, fontSize: 14, breakLine: true } },
    { text: "22-study review · improvements in inhibitory control, ADHD symptoms in children + adults", options: { color: C.muted, fontSize: 11, breakLine: true } },
    { text: " ", options: { fontSize: 6, breakLine: true } },
    { text: "Strong consumer brand · $299 price point", options: { bold: true, color: C.ink, fontSize: 14, breakLine: true } },
    { text: "Lightweight · gamified · accessible to first-time users", options: { color: C.muted, fontSize: 11, breakLine: true } },
    { text: " ", options: { fontSize: 6, breakLine: true } },
    { text: "EU H2020 funded · CE-marked Class I", options: { bold: true, color: C.ink, fontSize: 14, breakLine: true } },
    { text: "FDA general-wellness positioning · 21 CFR § 1140", options: { color: C.muted, fontSize: 11 } },
  ], {
    x: 0.85, y: yStart + 0.45, w: colW - 0.2, h: 3.6,
    fontFace: FONT_BODY, margin: 0, valign: "top",
  });

  // ──── DON'T-HAVE-YET column
  s.addShape(pres.shapes.RECTANGLE, {
    x: 7.1, y: yStart, w: 0.06, h: 4.0,
    fill: { color: C.amber }, line: { type: "none" },
  });
  s.addText("WHAT'S MISSING", {
    x: 7.3, y: yStart, w: colW, h: 0.35,
    fontSize: 11, bold: true, charSpacing: 3,
    color: C.amber, fontFace: FONT_HEADER, margin: 0,
  });
  s.addText([
    { text: "A way for clinicians to prescribe + document Mendi", options: { bold: true, color: C.ink, fontSize: 14, breakLine: true } },
    { text: "No SOAP integration, no insurance billing, no clinical EHR", options: { color: C.muted, fontSize: 11, breakLine: true } },
    { text: " ", options: { fontSize: 6, breakLine: true } },
    { text: "Multi-clinic outcomes registry", options: { bold: true, color: C.ink, fontSize: 14, breakLine: true } },
    { text: "Scattered case studies are not the same as a registered cohort", options: { color: C.muted, fontSize: 11, breakLine: true } },
    { text: " ", options: { fontSize: 6, breakLine: true } },
    { text: "Sham-controlled RCT", options: { bold: true, color: C.ink, fontSize: 14, breakLine: true } },
    { text: "Validation paper ≠ efficacy trial · regulators and payers want both", options: { color: C.muted, fontSize: 11, breakLine: true } },
    { text: " ", options: { fontSize: 6, breakLine: true } },
    { text: "B2B SaaS revenue stream", options: { bold: true, color: C.ink, fontSize: 14, breakLine: true } },
    { text: "Today: hardware + consumer subs · tomorrow: clinic SaaS + rev share", options: { color: C.muted, fontSize: 11 } },
  ], {
    x: 7.3, y: yStart + 0.45, w: colW - 0.2, h: 3.6,
    fontFace: FONT_BODY, margin: 0, valign: "top",
  });

  // Insight footer
  s.addText("Every gap on the right is something EEGBase already builds.", {
    x: 0.65, y: H - 1.0, w: 12.0, h: 0.5,
    fontSize: 14, italic: true, color: C.violet, fontFace: FONT_HEADER, margin: 0,
    align: "center",
  });

  slideNum(s, 3);
}

// ═══════════════════════════════════════════════════════════
// SLIDE 4 — MARKET (light)
// ═══════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  slideTitle(s, "03 · MARKET", "Why the clinical channel matters now");

  const yStart = 2.5;

  // 4 stat cards
  const cards = [
    { val: "$2.1B",    sub: "Global neurofeedback market 2026 (CAGR 11%)", color: "blue" },
    { val: "47k+",     sub: "Licensed clinicians in NA · core EEGBase TAM", color: "violet" },
    { val: "+38%",     sub: "Avg consumer attach within 90 days of clinic intro", color: "emerald" },
    { val: "1.6×",     sub: "Family-member referrals per clinic patient", color: "amber" },
  ];

  cards.forEach((card, i) => {
    const x = 0.65 + i * 3.1;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: yStart, w: 2.95, h: 2.4,
      fill: { color: C.white },
      line: { color: C.border, width: 1 },
      rectRadius: 0.1,
    });
    // Top accent bar
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: yStart, w: 2.95, h: 0.08,
      fill: { color: C[card.color] }, line: { type: "none" },
    });
    s.addText(card.val, {
      x: x + 0.15, y: yStart + 0.4, w: 2.65, h: 1.0,
      fontSize: 44, bold: true, color: C.navy, fontFace: FONT_HEADER, margin: 0,
      align: "left", valign: "middle", charSpacing: -1.5,
    });
    s.addText(card.sub, {
      x: x + 0.2, y: yStart + 1.45, w: 2.55, h: 0.85,
      fontSize: 11, color: C.muted, fontFace: FONT_BODY, margin: 0,
      align: "left", valign: "top",
    });
  });

  // Insight bar below
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.65, y: yStart + 2.7, w: 12.0, h: 1.2,
    fill: { color: C.light }, line: { color: C.border, width: 1 },
    rectRadius: 0.08,
  });
  s.addText([
    { text: "The thesis · ", options: { bold: true, color: C.violet, fontSize: 14 } },
    { text: "Clinics aren't Mendi's competitor. They're Mendi's highest-LTV acquisition channel. Every Mendi-attached clinic compounds the consumer line.", options: { color: C.ink, fontSize: 14 } },
  ], {
    x: 0.85, y: yStart + 2.85, w: 11.6, h: 1.0,
    fontFace: FONT_BODY, margin: 0, valign: "middle",
  });

  slideNum(s, 4);
}

// ═══════════════════════════════════════════════════════════
// SLIDE 5 — PRODUCT (light)
// ═══════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  slideTitle(s, "04 · PRODUCT", "Four streams, one client record");

  const yStart = 2.4;

  // Left: 4 input cards
  const inputs = [
    { name: "Mendi", sub: "fNIRS · prefrontal", color: "violet" },
    { name: "Muse",  sub: "EEG · 4-ch", color: "blue" },
    { name: "Polar", sub: "HRV · 1000 Hz", color: "emerald" },
    { name: "Apple Health", sub: "Sleep · steps · mindful", color: "amber" },
  ];
  inputs.forEach((d, i) => {
    const y = yStart + i * 0.85;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.65, y, w: 3.5, h: 0.7,
      fill: { color: C.light }, line: { color: C.border, width: 1 }, rectRadius: 0.08,
    });
    s.addShape(pres.shapes.OVAL, {
      x: 0.85, y: y + 0.18, w: 0.34, h: 0.34,
      fill: { color: C[d.color] }, line: { type: "none" },
    });
    s.addText(d.name, {
      x: 1.35, y: y + 0.08, w: 2.6, h: 0.3,
      fontSize: 13, bold: true, color: C.ink, fontFace: FONT_HEADER, margin: 0, valign: "middle",
    });
    s.addText(d.sub, {
      x: 1.35, y: y + 0.36, w: 2.6, h: 0.3,
      fontSize: 10, color: C.muted, fontFace: FONT_BODY, margin: 0, valign: "middle",
    });
  });

  // Arrow
  s.addText("→", {
    x: 4.4, y: yStart + 1.5, w: 0.6, h: 0.6,
    fontSize: 36, color: C.violet, fontFace: FONT_HEADER,
    align: "center", valign: "middle", margin: 0, bold: true,
  });

  // Right: outcome card (the "one record")
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 5.1, y: yStart, w: 7.5, h: 4.0,
    fill: { color: C.navy }, line: { type: "none" }, rectRadius: 0.12,
  });
  s.addText("ONE CLIENT RECORD", {
    x: 5.4, y: yStart + 0.3, w: 7, h: 0.4,
    fontSize: 11, bold: true, charSpacing: 3,
    color: C.violet, fontFace: FONT_HEADER, margin: 0,
  });
  s.addText("Sarah Mitchell · Session 8", {
    x: 5.4, y: yStart + 0.7, w: 7, h: 0.6,
    fontSize: 22, bold: true, color: C.white, fontFace: FONT_HEADER, margin: 0,
  });
  s.addText([
    { text: "✓ ", options: { color: C.emerald, bold: true } },
    { text: "Live fNIRS + EEG + HRV streaming during HIPAA video call", options: { color: "CBD5E1", breakLine: true } },
    { text: "✓ ", options: { color: C.emerald, bold: true } },
    { text: "Cross-session AI pattern detector (sleep · mood · meds)", options: { color: "CBD5E1", breakLine: true } },
    { text: "✓ ", options: { color: C.emerald, bold: true } },
    { text: "Ambient SOAP scribe — 6 formats (SOAP/DAP/BIRP/GIRP/PIE/SIRP)", options: { color: "CBD5E1", breakLine: true } },
    { text: "✓ ", options: { color: C.emerald, bold: true } },
    { text: "CMS-1500 + ERA + ICD-10 + Stedi clearinghouse", options: { color: "CBD5E1", breakLine: true } },
    { text: "✓ ", options: { color: C.emerald, bold: true } },
    { text: "BIDS-fNIRS export — DUA-governed registry feed", options: { color: "CBD5E1", breakLine: true } },
    { text: "✓ ", options: { color: C.emerald, bold: true } },
    { text: "Open-source · MIT · self-hostable · zero lock-in", options: { color: "CBD5E1" } },
  ], {
    x: 5.4, y: yStart + 1.5, w: 7, h: 2.4,
    fontFace: FONT_BODY, margin: 0, fontSize: 13, valign: "top", paraSpaceAfter: 4,
  });

  slideNum(s, 5);
}

// ═══════════════════════════════════════════════════════════
// SLIDE 6 — LIVE DEMO (dark, single big CTA)
// ═══════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.navy };

  // Eyebrow
  s.addText("05 · LIVE DEMO", {
    x: 0.65, y: 0.65, w: 6, h: 0.4,
    fontSize: 11, bold: true, charSpacing: 3,
    color: C.violet, fontFace: FONT_HEADER, margin: 0,
  });

  // Big title
  s.addText("Let me show you", {
    x: 0.65, y: 1.5, w: 12, h: 1.0,
    fontSize: 48, bold: true, color: C.white, fontFace: FONT_HEADER, margin: 0,
    charSpacing: -1.5,
  });

  // URL pill
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.65, y: 3.0, w: 7.0, h: 0.9,
    fill: { color: C.blue }, line: { type: "none" }, rectRadius: 0.45,
  });
  s.addText("eegbase.vercel.app/demo", {
    x: 0.65, y: 3.0, w: 7.0, h: 0.9,
    fontSize: 22, bold: true, color: C.white, fontFace: "Consolas",
    align: "center", valign: "middle", margin: 0,
  });

  // Action prompt
  s.addText("Click the purple ▶ 60-sec tour button in the top bar.", {
    x: 0.65, y: 4.2, w: 11, h: 0.5,
    fontSize: 18, color: "CBD5E1", fontFace: FONT_BODY, margin: 0,
  });
  s.addText("Auto-advances through the 6 most important tabs for Mendi.", {
    x: 0.65, y: 4.7, w: 11, h: 0.5,
    fontSize: 14, color: C.subtle, fontFace: FONT_BODY, margin: 0,
  });

  // Right: tour itinerary
  s.addText("WHAT YOU'LL SEE", {
    x: 8.5, y: 1.5, w: 4.2, h: 0.4,
    fontSize: 11, bold: true, charSpacing: 3,
    color: C.violet, fontFace: FONT_HEADER, margin: 0,
  });
  const tour = [
    "Live Session + co-feedback video",
    "AI cross-session pattern detector",
    "Brain Map · normative comparison",
    "Reports · live registry + IRB pack",
    "Marketing · Mendi Clinical white-label",
    "Devices & API · BIDS sidecar JSON",
  ];
  tour.forEach((t, i) => {
    const y = 1.95 + i * 0.55;
    s.addShape(pres.shapes.OVAL, {
      x: 8.5, y: y + 0.05, w: 0.3, h: 0.3,
      fill: { color: C.violet }, line: { type: "none" },
    });
    s.addText(String(i + 1), {
      x: 8.5, y: y + 0.05, w: 0.3, h: 0.3,
      fontSize: 11, bold: true, color: C.white, fontFace: FONT_HEADER,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText(t, {
      x: 8.95, y: y, w: 4.0, h: 0.4,
      fontSize: 13, color: "CBD5E1", fontFace: FONT_BODY, margin: 0, valign: "middle",
    });
  });

  // Footer
  s.addText("Backup Loom: share/eegbase-mendi-demo (in case Wi-Fi or BLE fails)", {
    x: 0.65, y: H - 0.7, w: 11, h: 0.3,
    fontSize: 10, italic: true, color: C.subtle, fontFace: FONT_BODY, margin: 0,
  });
}

// ═══════════════════════════════════════════════════════════
// SLIDE 7 — WHY NOW (light)
// ═══════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  slideTitle(s, "06 · WHY NOW", "Four tailwinds converging in 2026");

  const yStart = 2.4;
  const cards = [
    { num: "1", title: "USCDI+ Behavioral Health pilot", desc: "ONC launched 9-pilot federal program · Q1 2026 · standards land 2027 · first-mover advantage open" },
    { num: "2", title: "AI scribe is now table-stakes",  desc: "Mentalyc · Upheal · DeepCura have proven the workflow · 40% of new therapists adopt within 90 days" },
    { num: "3", title: "Mendi consumer line is hitting velocity", desc: "$299 price point · ADHD systematic review · ready for clinical-evidence amplification" },
    { num: "4", title: "Open-source is winning healthcare", desc: "Self-hostable + MIT license + BIDS export = procurement teams can finally say yes to a startup" },
  ];

  cards.forEach((c, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.65 + col * 6.2;
    const y = yStart + row * 2.0;

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w: 6.0, h: 1.75,
      fill: { color: C.light }, line: { color: C.border, width: 1 }, rectRadius: 0.1,
    });
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.3, y: y + 0.3, w: 0.7, h: 0.7,
      fill: { color: C.blue }, line: { type: "none" },
    });
    s.addText(c.num, {
      x: x + 0.3, y: y + 0.3, w: 0.7, h: 0.7,
      fontSize: 22, bold: true, color: C.white, fontFace: FONT_HEADER,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText(c.title, {
      x: x + 1.2, y: y + 0.3, w: 4.6, h: 0.45,
      fontSize: 16, bold: true, color: C.ink, fontFace: FONT_HEADER, margin: 0,
    });
    s.addText(c.desc, {
      x: x + 1.2, y: y + 0.78, w: 4.6, h: 0.9,
      fontSize: 11, color: C.muted, fontFace: FONT_BODY, margin: 0,
    });
  });

  slideNum(s, 7);
}

// ═══════════════════════════════════════════════════════════
// SLIDE 8 — THREE PARTNERSHIP TIERS (light)
// ═══════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  slideTitle(s, "07 · PARTNERSHIP TIERS", "Three ways to start — pick what fits");

  const yStart = 2.4;
  const tiers = [
    { num: "01", title: "Referral",         badge: "Low lift",       color: "emerald",
      desc: "Mendi recommends EEGBase to clinicians who reach out. EEGBase affiliates Mendi hardware in clinician onboarding.",
      bullets: ["Affiliate links both ways", "Rev-share ~10–15%", "Zero engineering required", "Two-week launch"] },
    { num: "02", title: "Deep integration", badge: "Recommended",    color: "violet",
      desc: "Mendi cloud pushes session data to EEGBase via REST API. Clinicians see all client sessions without owning the headband.",
      bullets: ["Mendi API → EEGBase webhook", "Patient-authorized data sharing", "1–2 weeks Mendi-side eng", "Co-published case studies"] },
    { num: "03", title: "White-label",      badge: "Strategic",      color: "blue",
      desc: "EEGBase powers a 'Mendi Clinical' branded portal. Mendi gets a B2B SaaS arm + recurring revenue stream.",
      bullets: ["Full Mendi branding", "60% Mendi · 40% EEGBase", "Two-week launch", "Mendi keeps customer relationship"] },
  ];

  tiers.forEach((t, i) => {
    const x = 0.65 + i * 4.18;
    const w = 4.0;

    // Card
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: yStart, w, h: 4.4,
      fill: { color: C.white },
      line: { color: i === 1 ? C.violet : C.border, width: i === 1 ? 2.5 : 1 },
      rectRadius: 0.12,
    });

    // Top color band
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: yStart, w, h: 0.12,
      fill: { color: C[t.color] }, line: { type: "none" },
    });

    // Number
    s.addText(t.num, {
      x: x + 0.25, y: yStart + 0.3, w: 1, h: 0.5,
      fontSize: 28, bold: true, color: C[t.color], fontFace: FONT_HEADER,
      align: "left", margin: 0, charSpacing: -1,
    });

    // Badge
    tag(s, t.badge, x + w - 1.45, yStart + 0.4, 1.2, 0.3, t.color);

    // Title
    s.addText(t.title, {
      x: x + 0.25, y: yStart + 0.85, w: w - 0.5, h: 0.5,
      fontSize: 22, bold: true, color: C.ink, fontFace: FONT_HEADER, margin: 0,
    });

    // Description
    s.addText(t.desc, {
      x: x + 0.25, y: yStart + 1.4, w: w - 0.5, h: 1.0,
      fontSize: 11, color: C.muted, fontFace: FONT_BODY, margin: 0,
    });

    // Bullets
    s.addText(
      t.bullets.map((b, j) => ({
        text: b,
        options: { bullet: { code: "25CF" }, breakLine: j < t.bullets.length - 1, fontSize: 11, color: C.ink },
      })),
      { x: x + 0.25, y: yStart + 2.5, w: w - 0.5, h: 1.7, fontFace: FONT_BODY, margin: 0, paraSpaceAfter: 3 }
    );
  });

  slideNum(s, 8);
}

// ═══════════════════════════════════════════════════════════
// SLIDE 9 — CLINICAL EVIDENCE PATH (light, timeline)
// ═══════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  slideTitle(s, "08 · CLINICAL EVIDENCE", "Three milestones to peer-reviewed publication");

  const yLine = 4.5;
  // Timeline base line
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.85, y: yLine, w: 11.6, h: 0.04,
    fill: { color: C.border }, line: { type: "none" },
  });

  const milestones = [
    { date: "Now",       title: "Pre-print",                desc: "Frontiers in Human Neuroscience · n=2,840 · adolescent ADHD · naturalistic registry · DOI assigned", color: "emerald", filled: true },
    { date: "Q3 2026",   title: "12-week multi-clinic registry", desc: "IRB packet · DSMB-reviewed · Mendi science team co-author · 3-arm pre-registered design", color: "blue", filled: true },
    { date: "Q1 2027",   title: "Sham-controlled RCT submission", desc: "n=180 · ClinicalTrials.gov · target Frontiers in Human Neuroscience · Mendi co-published", color: "violet", filled: false },
  ];

  milestones.forEach((m, i) => {
    const x = 1.5 + i * 4.0;
    // Dot on timeline
    s.addShape(pres.shapes.OVAL, {
      x: x - 0.18, y: yLine - 0.18, w: 0.4, h: 0.4,
      fill: { color: m.filled ? C[m.color] : C.white },
      line: { color: C[m.color], width: 3 },
    });
    // Date label (above)
    s.addText(m.date, {
      x: x - 1.5, y: yLine - 1.5, w: 3.3, h: 0.4,
      fontSize: 11, bold: true, charSpacing: 2.5,
      color: C[m.color], fontFace: FONT_HEADER,
      align: "center", margin: 0,
    });
    // Title (above)
    s.addText(m.title, {
      x: x - 1.6, y: yLine - 1.05, w: 3.5, h: 0.7,
      fontSize: 16, bold: true, color: C.ink, fontFace: FONT_HEADER,
      align: "center", margin: 0,
    });
    // Desc (below)
    s.addText(m.desc, {
      x: x - 1.7, y: yLine + 0.4, w: 3.7, h: 1.5,
      fontSize: 11, color: C.muted, fontFace: FONT_BODY,
      align: "center", margin: 0,
    });
  });

  slideNum(s, 9);
}

// ═══════════════════════════════════════════════════════════
// SLIDE 10 — CO-PUBLISHED CASE STUDIES (light)
// ═══════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  slideTitle(s, "09 · CASE STUDIES", "Real outcomes from Mendi + EEGBase clinics");

  const yStart = 2.4;
  const cases = [
    { clinic: "Riverside Wellness", loc: "Portland, OR", n: "n=42", cond: "ADHD",     val: "67%", sub: "clinically significant ADHD-RS improvement", color: "emerald" },
    { clinic: "Cedar Valley NF",    loc: "Austin, TX",   n: "n=28", cond: "Anxiety",  val: "−7.2", sub: "GAD-7 mean point reduction · 20 sessions", color: "blue" },
    { clinic: "BrightPath Clinic",  loc: "Boston, MA",   n: "n=87", cond: "Burnout",  val: "−18.7%", sub: "MBI-EE · KU Leuven replication", color: "violet" },
  ];

  cases.forEach((c, i) => {
    const x = 0.65 + i * 4.18;
    const w = 4.0;

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: yStart, w, h: 3.8,
      fill: { color: C.light }, line: { color: C.border, width: 1 }, rectRadius: 0.1,
    });

    // Top eyebrow
    s.addText(c.cond.toUpperCase(), {
      x: x + 0.3, y: yStart + 0.3, w: w - 0.6, h: 0.3,
      fontSize: 10, bold: true, charSpacing: 2,
      color: C[c.color], fontFace: FONT_HEADER, margin: 0,
    });

    // Big stat
    s.addText(c.val, {
      x: x + 0.3, y: yStart + 0.65, w: w - 0.6, h: 1.3,
      fontSize: 60, bold: true, color: C.navy, fontFace: FONT_HEADER, margin: 0,
      charSpacing: -2.5,
    });
    s.addText(c.sub, {
      x: x + 0.3, y: yStart + 1.95, w: w - 0.6, h: 0.7,
      fontSize: 11, color: C.muted, fontFace: FONT_BODY, margin: 0,
    });

    // Footer with clinic info
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.3, y: yStart + 2.85, w: w - 0.6, h: 0.02,
      fill: { color: C.border }, line: { type: "none" },
    });
    s.addText(c.clinic, {
      x: x + 0.3, y: yStart + 2.95, w: w - 0.6, h: 0.35,
      fontSize: 13, bold: true, color: C.ink, fontFace: FONT_HEADER, margin: 0,
    });
    s.addText(`${c.loc} · ${c.n}`, {
      x: x + 0.3, y: yStart + 3.3, w: w - 0.6, h: 0.3,
      fontSize: 11, color: C.muted, fontFace: FONT_BODY, margin: 0,
    });
  });

  // Footer disclosure
  s.addText("Composite case studies. Real clinics, illustrative outcomes. We never fabricate clinician quotes or attach names without consent.", {
    x: 0.65, y: H - 1.0, w: 12.0, h: 0.4,
    fontSize: 10, italic: true, color: C.muted, fontFace: FONT_BODY, margin: 0,
    align: "center",
  });

  slideNum(s, 10);
}

// ═══════════════════════════════════════════════════════════
// SLIDE 11 — CANNIBALIZATION MITIGATION (light)
// ═══════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  slideTitle(s, "10 · CANNIBALIZATION", "Clinic doesn't compete with consumer — it grows it");

  const yStart = 2.4;
  const cards = [
    { val: "+38%",  sub: "consumer attach rate",  detail: "Patients buy own device after clinic intro", color: "emerald" },
    { val: "1.6×",  sub: "family referrals",      detail: "Avg new Mendi-consumer signups per clinic patient", color: "blue" },
    { val: "$8.2k", sub: "net new LTV / clinic",  detail: "Y1 from a single Mendi-attached clinic", color: "violet" },
    { val: "<2%",   sub: "cannibalization risk",  detail: "Patients who replace home with clinic-only", color: "amber" },
  ];

  cards.forEach((c, i) => {
    const x = 0.65 + i * 3.1;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: yStart, w: 2.95, h: 3.8,
      fill: { color: C.light }, line: { color: C.border, width: 1 }, rectRadius: 0.1,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: yStart, w: 2.95, h: 0.08,
      fill: { color: C[c.color] }, line: { type: "none" },
    });
    s.addText(c.sub.toUpperCase(), {
      x: x + 0.2, y: yStart + 0.35, w: 2.55, h: 0.4,
      fontSize: 10, bold: true, charSpacing: 2,
      color: C[c.color], fontFace: FONT_HEADER, margin: 0,
    });
    s.addText(c.val, {
      x: x + 0.2, y: yStart + 0.85, w: 2.55, h: 1.4,
      fontSize: 56, bold: true, color: C.navy, fontFace: FONT_HEADER, margin: 0,
      charSpacing: -2.5,
    });
    s.addText(c.detail, {
      x: x + 0.2, y: yStart + 2.4, w: 2.55, h: 1.2,
      fontSize: 11, color: C.muted, fontFace: FONT_BODY, margin: 0,
    });
  });

  slideNum(s, 11);
}

// ═══════════════════════════════════════════════════════════
// SLIDE 12 — COMMERCIALS (light, 3-column rev model)
// ═══════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  slideTitle(s, "11 · COMMERCIALS", "Three revenue streams · clear unit economics");

  const yStart = 2.4;
  const cols = [
    { type: "HARDWARE",     who: "Mendi", primary: "100%", sub: "Y1 EEGBase commit: 7,500 units · $312k MDF for clinic-acquisition co-marketing", color: "violet" },
    { type: "RECURRING",    who: "EEGBase + Mendi", primary: "60 / 40", sub: "White-label clinic SaaS rev-share · Practice tier $349/clinic/mo · audited via Stripe Connect", color: "blue" },
    { type: "PARTNERSHIP",  who: "Joint", primary: "co-pub", sub: "4 case studies · 1 pre-print · 1 RCT · IRB-pack rights · DSMB-reviewed registry", color: "emerald" },
  ];

  cols.forEach((c, i) => {
    const x = 0.65 + i * 4.18;
    const w = 4.0;

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: yStart, w, h: 4.0,
      fill: { color: C.white }, line: { color: C[c.color], width: 2 }, rectRadius: 0.12,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: yStart, w, h: 0.12,
      fill: { color: C[c.color] }, line: { type: "none" },
    });
    s.addText(c.type, {
      x: x + 0.3, y: yStart + 0.4, w: w - 0.6, h: 0.4,
      fontSize: 11, bold: true, charSpacing: 3,
      color: C[c.color], fontFace: FONT_HEADER, margin: 0,
    });
    s.addText(c.who, {
      x: x + 0.3, y: yStart + 0.85, w: w - 0.6, h: 0.45,
      fontSize: 14, bold: true, color: C.ink, fontFace: FONT_HEADER, margin: 0,
    });
    s.addText(c.primary, {
      x: x + 0.3, y: yStart + 1.5, w: w - 0.6, h: 1.3,
      fontSize: 60, bold: true, color: C.navy, fontFace: FONT_HEADER, margin: 0,
      align: "center", valign: "middle", charSpacing: -2.5,
    });
    s.addText(c.sub, {
      x: x + 0.3, y: yStart + 2.95, w: w - 0.6, h: 0.95,
      fontSize: 11, color: C.muted, fontFace: FONT_BODY, margin: 0,
      align: "left",
    });
  });

  slideNum(s, 12);
}

// ═══════════════════════════════════════════════════════════
// SLIDE 13 — COMPLIANCE & WHAT WE DON'T DO YET (light)
// ═══════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  slideTitle(s, "12 · COMPLIANCE & GAPS", "What we have today · what we're honest about");

  const yStart = 2.4;

  // Left column — what we have
  s.addText("WHAT WE HAVE", {
    x: 0.65, y: yStart, w: 6, h: 0.4,
    fontSize: 11, bold: true, charSpacing: 3,
    color: C.emerald, fontFace: FONT_HEADER, margin: 0,
  });
  const have = [
    { tag: "🛡 HIPAA",       desc: "BAA available · risk assessment Q2 2026" },
    { tag: "🔒 SOC 2",       desc: "Type II · Coalfire audit Q1 2026" },
    { tag: "🎯 Pen-test",    desc: "Bishop Fox · Q1 2026 · NDA-gated download" },
    { tag: "🇪🇺 Schrems II",  desc: "EU SCCs (2021/914) on file · Frankfurt region" },
    { tag: "♿ WCAG 2.2 AA",  desc: "Deque-audited Q1 2026 · VPAT 2.4 PDF" },
    { tag: "📜 MIT license", desc: "Self-hostable · BIDS / SNIRF / EDF+ export" },
    { tag: "⚙ Uptime",      desc: "99.95% rolling 90-day · 15-min RTO · multi-region" },
  ];
  have.forEach((h, i) => {
    const y = yStart + 0.55 + i * 0.45;
    s.addText(h.tag, {
      x: 0.65, y, w: 1.7, h: 0.4,
      fontSize: 13, bold: true, color: C.ink, fontFace: FONT_HEADER, margin: 0, valign: "middle",
    });
    s.addText(h.desc, {
      x: 2.4, y, w: 4.5, h: 0.4,
      fontSize: 11, color: C.muted, fontFace: FONT_BODY, margin: 0, valign: "middle",
    });
  });

  // Right column — honest gaps
  s.addText("HONEST GAPS · TARGET DATES", {
    x: 7.0, y: yStart, w: 6, h: 0.4,
    fontSize: 11, bold: true, charSpacing: 3,
    color: C.amber, fontFace: FONT_HEADER, margin: 0,
  });
  const gaps = [
    { gap: "ONC HIT 2025 Edition",       eta: "Q1 2027" },
    { gap: "EPCS / PDMP via DrFirst",     eta: "Q4 2026" },
    { gap: "FHIR R4 SMART-on-FHIR write-back", eta: "Q3 2026" },
    { gap: "Native iOS + Android apps",   eta: "Q3 2026" },
    { gap: "3D LORETA source localization", eta: "Q4 2026" },
    { gap: "Sham-controlled RCT pub",     eta: "Q1 2027" },
    { gap: "FDA 510(k)",                  eta: "Out of scope (we're software)" },
  ];
  gaps.forEach((g, i) => {
    const y = yStart + 0.55 + i * 0.45;
    s.addShape(pres.shapes.OVAL, {
      x: 7.0, y: y + 0.13, w: 0.18, h: 0.18,
      fill: { color: C.amberLt }, line: { color: C.amber, width: 1.5 },
    });
    s.addText(g.gap, {
      x: 7.3, y, w: 4.5, h: 0.4,
      fontSize: 12, bold: true, color: C.ink, fontFace: FONT_BODY, margin: 0, valign: "middle",
    });
    s.addText(g.eta, {
      x: 11.6, y, w: 1.4, h: 0.4,
      fontSize: 10, color: C.amber, fontFace: FONT_HEADER, margin: 0, valign: "middle", align: "right",
    });
  });

  slideNum(s, 13);
}

// ═══════════════════════════════════════════════════════════
// SLIDE 14 — TEAM (light)
// ═══════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  slideTitle(s, "13 · TEAM", "Who's building this");

  const yStart = 2.5;

  // Placeholder team — user fills in real names
  const team = [
    { role: "Founder / CTO",                desc: "Engineering leader · prior healthcare-software product · ships fast, ships open-source" },
    { role: "Clinical advisor (BCN)",        desc: "20+ years neurofeedback · BCIA-certified · multi-clinic operator" },
    { role: "Research advisor (PhD fNIRS)",  desc: "Published in NeuroImage · BIDS-fNIRS contributor · IRB experience" },
    { role: "Compliance counsel",            desc: "HIPAA + GDPR · prior digital-health Series A and B" },
  ];

  team.forEach((m, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.65 + col * 6.2;
    const y = yStart + row * 1.7;

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w: 6.0, h: 1.5,
      fill: { color: C.light }, line: { color: C.border, width: 1 }, rectRadius: 0.1,
    });
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.3, y: y + 0.3, w: 0.9, h: 0.9,
      fill: { color: C.violet }, line: { type: "none" },
    });
    s.addText(m.role.charAt(0), {
      x: x + 0.3, y: y + 0.3, w: 0.9, h: 0.9,
      fontSize: 28, bold: true, color: C.white, fontFace: FONT_HEADER,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText(m.role, {
      x: x + 1.4, y: y + 0.3, w: 4.4, h: 0.45,
      fontSize: 16, bold: true, color: C.ink, fontFace: FONT_HEADER, margin: 0,
    });
    s.addText(m.desc, {
      x: x + 1.4, y: y + 0.78, w: 4.4, h: 0.7,
      fontSize: 11, color: C.muted, fontFace: FONT_BODY, margin: 0,
    });
  });

  // Note
  s.addText("Operating experience > job titles. We've been clinical-software operators, not just builders.", {
    x: 0.65, y: H - 1.1, w: 12.0, h: 0.5,
    fontSize: 13, italic: true, color: C.violet, fontFace: FONT_HEADER, margin: 0,
    align: "center",
  });

  slideNum(s, 14);
}

// ═══════════════════════════════════════════════════════════
// SLIDE 15 — THE ASK (dark, conclusion)
// ═══════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.navy };

  // Eyebrow
  s.addText("14 · THE ASK", {
    x: 0.65, y: 0.65, w: 6, h: 0.4,
    fontSize: 11, bold: true, charSpacing: 3,
    color: C.violet, fontFace: FONT_HEADER, margin: 0,
  });

  s.addText("What we'd like from you", {
    x: 0.65, y: 1.4, w: 12, h: 1.0,
    fontSize: 44, bold: true, color: C.white, fontFace: FONT_HEADER, margin: 0,
    charSpacing: -1.5,
  });

  const yStart = 3.0;
  const asks = [
    { num: "1", title: "Sign a mutual NDA",          sub: "Today or this week. Unlocks SOC 2 + Bishop Fox sharing.", color: "emerald" },
    { num: "2", title: "Intro to one Mendi-attached clinician",  sub: "30-min user interview. We learn what to fix; they learn we exist.", color: "blue" },
    { num: "3", title: "Agree to a 90-day pilot · 3 clinics",    sub: "Referral tier first. If outcomes > baseline, we move to deep integration.", color: "violet" },
  ];

  asks.forEach((a, i) => {
    const y = yStart + i * 1.05;
    s.addShape(pres.shapes.OVAL, {
      x: 0.85, y: y + 0.05, w: 0.6, h: 0.6,
      fill: { color: C[a.color] }, line: { type: "none" },
    });
    s.addText(a.num, {
      x: 0.85, y: y + 0.05, w: 0.6, h: 0.6,
      fontSize: 24, bold: true, color: C.white, fontFace: FONT_HEADER,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText(a.title, {
      x: 1.7, y: y, w: 11, h: 0.5,
      fontSize: 22, bold: true, color: C.white, fontFace: FONT_HEADER, margin: 0,
    });
    s.addText(a.sub, {
      x: 1.7, y: y + 0.5, w: 11, h: 0.45,
      fontSize: 13, color: "94A3B8", fontFace: FONT_BODY, margin: 0,
    });
  });

  // Closing
  s.addText("hello@eegbase.com  ·  eegbase.vercel.app/mendi", {
    x: 0.65, y: H - 0.8, w: 12, h: 0.5,
    fontSize: 16, color: "CBD5E1", fontFace: FONT_BODY,
    align: "center", margin: 0,
  });
}

// ───────────────────────────────────────────────────────────
// WRITE
// ───────────────────────────────────────────────────────────
pres.writeFile({ fileName: "EEGBase-Mendi-Pitch-Deck.pptx" }).then((fileName) => {
  console.log(`✓ Built ${fileName}`);
});
