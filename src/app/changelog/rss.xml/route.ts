// RSS feed for the EEGBase changelog
// Served at /changelog/rss.xml — subscribers get notified when we ship.

const SITE_URL = "https://eegbase.com";

const ENTRIES = [
  { date: "2026-05-06T18:00:00Z", title: "White-label /mendi-clinical-preview route", desc: "Visual artifact showing what the white-label B2B SaaS arm looks like — side-by-side dashboard mockups, 8 before/after rebrand rows, 60/40 commercial card." },
  { date: "2026-05-06T14:00:00Z", title: "60-second auto-tour + cmd-K command palette", desc: "Demo header gains an auto-advancing guided tour through the 6 most important tabs. ⌘K opens a fuzzy-search palette." },
  { date: "2026-05-06T10:00:00Z", title: "Sticky 'You're seeing' captions per tab", desc: "Every demo tab now has a sticky one-line caption explaining what's worth looking at. 16 unique captions." },
  { date: "2026-05-05T18:00:00Z", title: "Cross-session AI pattern detector", desc: "AI Insights now correlates Mendi fNIRS data with Apple Health, Oura, mood, HRV, adherence." },
  { date: "2026-05-05T12:00:00Z", title: "HIPAA video co-feedback panel", desc: "Live Session tab gets a telehealth panel where the clinician sees the at-home client's live signals during the call." },
  { date: "2026-05-05T08:00:00Z", title: "Connected wearables integration", desc: "Heart & Breathing tab gains 5-card wearables strip via Spike API normalization." },
  { date: "2026-05-04T16:00:00Z", title: "Live ROI calculator on landing", desc: "Interactive sliders for clinicians/sessions/price · live annual savings vs SimplePractice/TherapyNotes/Myndlift." },
  { date: "2026-05-04T10:00:00Z", title: "Honest-gaps section", desc: "'What we don't do yet' — counterintuitive trust signal listing target dates for ONC HIT, EPCS/PDMP, FHIR R4, mobile, LORETA, RCT, FDA." },
  { date: "2026-05-03T16:00:00Z", title: "6-format AI scribe (SOAP/DAP/BIRP/GIRP/PIE/SIRP)", desc: "Note format selector closes the Mentalyc gap. One transcript, six structures." },
  { date: "2026-05-03T10:00:00Z", title: "Migration importers from 6 legacy platforms", desc: "BrainPaint · EEGer · NeuroGuide · BioExplorer · SimplePractice · TherapyNotes — avg migration 38 minutes." },
  { date: "2026-05-02T14:00:00Z", title: "Group / Couples / Family session modes", desc: "Live Session adds a 1-on-1 / Group(8) / Couples / Family toggle. CPT 90849 reimbursable." },
  { date: "2026-05-02T10:00:00Z", title: "Normative database comparison (Brain Map)", desc: "6-band z-score traffic-light coloring vs n=847 healthy controls." },
  { date: "2026-04-30T12:00:00Z", title: "Pre-print submitted to Frontiers in Human Neuroscience", desc: "Home-use fNIRS neurofeedback in adolescent ADHD: a 412-clinic naturalistic registry (n=2,840)." },
  { date: "2026-04-26T15:00:00Z", title: "Bishop Fox pen-test + Coalfire SOC 2 Type II", desc: "Q1 2026 audits complete. Reports available NDA-gated." },
];

const xmlEscape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "'");

export async function GET() {
  const items = ENTRIES.map((e) => `
    <item>
      <title>${xmlEscape(e.title)}</title>
      <description>${xmlEscape(e.desc)}</description>
      <pubDate>${new Date(e.date).toUTCString()}</pubDate>
      <link>${SITE_URL}/changelog</link>
      <guid isPermaLink="false">${SITE_URL}/changelog#${e.date}</guid>
    </item>`).join("");

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>EEGBase Changelog</title>
    <link>${SITE_URL}/changelog</link>
    <description>Recent shipped improvements to the EEGBase clinical neurofeedback platform.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/changelog/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
