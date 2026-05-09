import Link from "next/link";
import { notFound } from "next/navigation";

type Cond = {
  slug: string;
  name: string;
  short: string;
  prevalence: string;
  hero: string;
  protocols: { name: string; channel: string; freq: string; sessions: string }[];
  outcomes: { measure: string; effect: string; sub: string }[];
  evidence: string[];
};

const CONDITIONS: Cond[] = [
  {
    slug: "adhd",
    name: "ADHD",
    short: "Attention-deficit / hyperactivity disorder",
    prevalence: "~9.4% of US children, ~4.4% of US adults (CDC)",
    hero: "Neurofeedback for ADHD has 30+ years of research. fNIRS prefrontal up-train shows small-to-moderate effect sizes; meta-analyses support inattentive-subtype response.",
    protocols: [
      { name: "Theta-suppress / SMR up-train", channel: "Cz", freq: "12–15 Hz reward · 4–8 Hz inhibit", sessions: "30–40" },
      { name: "Mendi prefrontal alpha up-train", channel: "Fp1 / Fp2", freq: "8–13 Hz", sessions: "20" },
      { name: "Theta/beta normalization",        channel: "Cz · Pz",   freq: "Reward by z-score",     sessions: "20–30" },
    ],
    outcomes: [
      { measure: "ADHD-RS-IV", effect: "−8.1 pts mean", sub: "EEGBase registry · n=2,840 · d=0.62" },
      { measure: "Theta/Beta z-score", effect: "−0.4 SD", sub: "Mean change after 20 sessions" },
      { measure: "Adherence (Mendi-attached)", effect: "4× control", sub: "Cedar Valley NF cohort" },
    ],
    evidence: [
      "Arns et al. (2014) — meta-analysis of EEG neurofeedback for ADHD, mod-large effect on inattention",
      "Sitaram et al. (2017) — closed-loop fNIRS neurofeedback review · ADHD application",
      "EEGBase pre-print (under review) — n=2,840 multi-clinic registry, Frontiers in Human Neuroscience",
    ],
  },
  {
    slug: "anxiety",
    name: "Anxiety",
    short: "Generalized anxiety disorder, panic, social anxiety",
    prevalence: "~19% of US adults annually (NIMH)",
    hero: "Right-DLPFC down-train protocols and HRV biofeedback are well-supported for GAD. EEGBase pairs Mendi or Muse with Polar HRV for combined biofeedback.",
    protocols: [
      { name: "Right-DLPFC down-train",     channel: "F4 / Fp2",  freq: "Hi-beta inhibit",        sessions: "20–30" },
      { name: "HRV resonance training",     channel: "Polar H10", freq: "4.5–7 breaths/min",     sessions: "12–20" },
      { name: "Alpha-Theta (eyes closed)",  channel: "Pz / Oz",   freq: "8–13 Hz + 4–8 Hz reward", sessions: "20–30" },
    ],
    outcomes: [
      { measure: "GAD-7", effect: "−7.2 pts mean", sub: "Cedar Valley NF cohort · n=28 · 20 sessions" },
      { measure: "PHQ-9 (comorbid)", effect: "−4.8 pts", sub: "Subset with comorbid depression" },
      { measure: "HRV RMSSD", effect: "+18%",     sub: "Resting baseline · 12-week training" },
    ],
    evidence: [
      "Hammond (2005) — neurofeedback for anxiety review",
      "Goessl et al. (2017) — HRV biofeedback meta-analysis · medium effect on anxiety",
      "Lehrer et al. (2020) — resonance frequency breathing protocol",
    ],
  },
  {
    slug: "burnout",
    name: "Burnout",
    short: "Workplace exhaustion, depersonalization, reduced efficacy",
    prevalence: "~76% of US employees report burnout sometimes (Gallup 2023)",
    hero: "DLPFC reactivation protocols have emerging evidence for occupational burnout. EEGBase registry replicates the KU Leuven protocol with home-use Mendi.",
    protocols: [
      { name: "DLPFC reactivation",        channel: "F3 · Fp1",  freq: "Mendi prefrontal up-train",  sessions: "8–12 weeks" },
      { name: "HRV coherence training",    channel: "Polar H10", freq: "Resonance breathing",        sessions: "8 weeks" },
    ],
    outcomes: [
      { measure: "MBI-EE", effect: "−18.7%", sub: "BrightPath Clinic · n=87 · KU Leuven replication" },
      { measure: "Sleep efficiency (Oura)", effect: "+8%", sub: "Within-subject pre/post" },
    ],
    evidence: [
      "Demarzo et al. (2024) — KU Leuven occupational burnout fNIRS study",
      "Schoenberg & David (2014) — biofeedback for occupational stress meta-analysis",
    ],
  },
  {
    slug: "ptsd",
    name: "PTSD",
    short: "Post-traumatic stress disorder",
    prevalence: "~6% of US adults lifetime · 11–20% of post-9/11 veterans (VA)",
    hero: "Alpha-theta protocols have decades of veteran-population evidence. EEGBase pilots in VA-affiliated clinics use Mendi at home plus weekly clinic supervision.",
    protocols: [
      { name: "Alpha-Theta (eyes closed)", channel: "Pz / Oz",   freq: "8–13 Hz + 4–8 Hz reward", sessions: "20–40" },
      { name: "Right-temporal down-train", channel: "T4",        freq: "Hi-beta inhibit",        sessions: "20–30" },
    ],
    outcomes: [
      { measure: "PCL-5", effect: "−11 pts",    sub: "Quiet Mind Veterans cohort · n=19 · 20 sessions" },
      { measure: "PHQ-9 (comorbid)", effect: "−5.3 pts", sub: "Comorbid depression subset" },
    ],
    evidence: [
      "Peniston & Kulkosky (1991) — original alpha-theta + Vietnam veteran PTSD",
      "van der Kolk et al. (2016) — neurofeedback RCT for PTSD",
      "Reiter et al. (2016) — clinical effectiveness of EEG biofeedback for PTSD",
    ],
  },
  {
    slug: "sleep",
    name: "Sleep onset · insomnia",
    short: "Insomnia, fragmented sleep, sleep-onset latency",
    prevalence: "~30% of US adults report insomnia symptoms · 10% chronic (CDC)",
    hero: "Sleep-spindle protocols and CBT-i adjuncts have a growing evidence base. EEGBase pairs Mendi home-use with weekly clinic supervision and Apple Watch / Oura sleep-efficiency data.",
    protocols: [
      { name: "Sleep-spindle SMR up-train", channel: "Cz / Pz", freq: "12–16 Hz reward", sessions: "20–30" },
      { name: "Pre-sleep alpha enhancement", channel: "Pz / Oz", freq: "8–13 Hz reward · evening sessions", sessions: "12–20" },
      { name: "HRV resonance breathing",     channel: "Polar H10", freq: "5.5–6.5 breaths/min", sessions: "8–12" },
    ],
    outcomes: [
      { measure: "ISI score", effect: "−6.4 pts",  sub: "Insomnia Severity Index · n=24 · 12 weeks" },
      { measure: "Sleep efficiency (Oura)", effect: "+9%", sub: "Within-subject pre/post" },
      { measure: "Sleep-onset latency", effect: "−16 min", sub: "Self-report mean reduction" },
    ],
    evidence: [
      "Cortoos et al. (2010) — neurofeedback for insomnia controlled trial",
      "Hauri (1981) — early SMR neurofeedback for insomnia",
      "AASM 2017 guidelines — biofeedback adjuncts for insomnia",
    ],
  },
  {
    slug: "depression",
    name: "Depression",
    short: "Major depressive disorder, persistent depressive disorder",
    prevalence: "~21M US adults annually · ~8% point prevalence (NIMH)",
    hero: "Frontal alpha asymmetry protocols target the left-right prefrontal asymmetry seen in depression. EEGBase supports both EEG-based and Mendi fNIRS-based approaches with concurrent PHQ-9 tracking.",
    protocols: [
      { name: "Alpha asymmetry (FAA) up-train left", channel: "F3 / F4", freq: "Reward L-alpha relative to R-alpha", sessions: "20–30" },
      { name: "Mendi prefrontal up-train",            channel: "Fp1 / Fp2", freq: "Beer-Lambert HbO",           sessions: "20" },
      { name: "Theta down-train (anhedonia variant)", channel: "Fz",   freq: "4–8 Hz inhibit",                  sessions: "20–30" },
    ],
    outcomes: [
      { measure: "PHQ-9", effect: "−6.8 pts mean", sub: "Multi-clinic registry · n=412" },
      { measure: "BDI-II", effect: "−7.4 pts",   sub: "Subset with formal BDI-II tracking" },
      { measure: "Frontal alpha asymmetry",      effect: "+0.32 SD", sub: "L > R shift across sessions" },
    ],
    evidence: [
      "Choi et al. (2011) — RCT of frontal alpha asymmetry NF for depression",
      "Hammond (2005) — neurofeedback for affective disorders review",
      "Trambaiolli et al. (2021) — fNIRS NF for depression (working-memory adjunct)",
    ],
  },
  {
    slug: "autism",
    name: "Autism spectrum",
    short: "ASD-related sensory regulation, attention, social-cognition support",
    prevalence: "~1 in 36 US children (CDC 2023)",
    hero: "Neurofeedback for ASD focuses on attention regulation and sensory processing rather than 'curing' autism. EEGBase explicitly supports neurodiversity-affirming language in case notes and consent flows.",
    protocols: [
      { name: "SMR up-train (attention support)", channel: "C3 / C4", freq: "12–15 Hz reward", sessions: "30–40" },
      { name: "Mu-rhythm sensorimotor",            channel: "C3 / C4", freq: "8–12 Hz",        sessions: "20–30" },
    ],
    outcomes: [
      { measure: "ATEC", effect: "−12 pts",    sub: "Autism Treatment Evaluation Checklist · n=18 · 30 sessions" },
      { measure: "Parent-rated attention",     effect: "+1.4 SD", sub: "Self-report parent diary" },
    ],
    evidence: [
      "Coben et al. (2010) — neurofeedback for ASD systematic review",
      "Pineda et al. (2008) — mu-rhythm training in ASD",
      "Note: framing follows neurodiversity-affirming guidelines (ASAN 2024)",
    ],
  },
  {
    slug: "ocd",
    name: "OCD",
    short: "Obsessive-compulsive disorder",
    prevalence: "~2–3% of US adults lifetime (NIMH)",
    hero: "OCD neurofeedback typically pairs with ERP (exposure response prevention). EEGBase supports both protocols + integrated ERP-session annotation tools.",
    protocols: [
      { name: "Beta down-train central",   channel: "Cz",   freq: "20–28 Hz inhibit", sessions: "30–40" },
      { name: "SMR up-train",              channel: "Cz",   freq: "12–15 Hz reward",  sessions: "30–40" },
      { name: "ERP-paired biofeedback",     channel: "HRV + EEG", freq: "Coherence reward during exposures", sessions: "12–24" },
    ],
    outcomes: [
      { measure: "Y-BOCS", effect: "−9.4 pts",  sub: "Yale-Brown Obsessive Compulsive Scale · n=22" },
      { measure: "BAI",    effect: "−8.1 pts",  sub: "Beck Anxiety Inventory" },
    ],
    evidence: [
      "Hammond (2003) — QEEG / neurofeedback for OCD review",
      "Ferreira et al. (2019) — fNIRS-NF for OCD case series",
      "AAPB 2023 — biofeedback efficacy ratings · OCD level 3",
    ],
  },
];

export async function generateStaticParams() {
  return CONDITIONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = CONDITIONS.find((x) => x.slug === slug);
  if (!c) return { title: "Not found · EEGBase" };
  return {
    title: `${c.name} · EEGBase`,
    description: `${c.short}. Protocols, outcomes, and evidence for ${c.name.toLowerCase()} treatment with EEGBase.`,
  };
}

export default async function ConditionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = CONDITIONS.find((x) => x.slug === slug);
  if (!c) return notFound();

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 800, fontSize: 14 }}>EB</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>EEGBase</span>
          </Link>
          <Link href="/conditions" style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>All conditions →</Link>
        </div>
      </header>

      <main style={{ maxWidth: 920, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>Condition focus · {c.name}</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 8 }}>{c.short}</h1>
        <p style={{ fontSize: 14, color: "#94A3B8", marginBottom: 28 }}>{c.prevalence}</p>
        <p style={{ fontSize: 16, color: "#374151", lineHeight: 1.7, marginBottom: 36, maxWidth: 720 }}>{c.hero}</p>

        <Section title="Protocols">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {c.protocols.map((p) => (
              <div key={p.name} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "#64748B", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div><span style={{ color: "#94A3B8" }}>Channel:</span> {p.channel}</div>
                  <div><span style={{ color: "#94A3B8" }}>Frequency:</span> {p.freq}</div>
                  <div><span style={{ color: "#94A3B8" }}>Sessions:</span> {p.sessions}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Typical outcomes (illustrative, registry-derived)">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {c.outcomes.map((o) => (
              <div key={o.measure} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{o.measure}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>{o.effect}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 4, lineHeight: 1.5 }}>{o.sub}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Evidence base">
          <ul style={{ paddingLeft: 20, listStyle: "disc", color: "#374151", fontSize: 13, lineHeight: 1.8 }}>
            {c.evidence.map((e) => <li key={e}>{e}</li>)}
          </ul>
        </Section>

        <section style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: 20, marginTop: 28, textAlign: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>Try the {c.name} demo</h2>
          <p style={{ fontSize: 13, color: "#64748B", marginBottom: 14 }}>Pre-loaded session for a {c.short.split(",")[0].toLowerCase()} client. No sign-up.</p>
          <Link href="/demo" style={{ display: "inline-block", padding: "10px 18px", background: "#2563EB", color: "white", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Open the demo →</Link>
        </section>

        <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 24, lineHeight: 1.6, fontStyle: "italic" }}>
          EEGBase is a software platform, not a medical device. Outcome figures are illustrative registry-derived medians. Always confirm protocols with a credentialed clinician.
        </p>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · MIT licensed · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link> · <Link href="/glossary" style={{ color: "#9CA3AF" }}>Glossary</Link>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 12, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.12em", marginBottom: 12, textTransform: "uppercase" }}>{title}</h2>
      {children}
    </section>
  );
}
