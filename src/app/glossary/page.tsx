import Link from "next/link";

export const metadata = {
  title: "Glossary · EEGBase",
  description: "Plain-English definitions for the neurofeedback terms used in the EEGBase demo.",
};

const TERMS = [
  { term: "ADHD-RS-IV", short: "Clinical scale for ADHD severity in children and adults.",
    long: "ADHD Rating Scale, 4th edition. 18 items mapped to DSM-5 ADHD criteria. Scored 0–54 with subscale splits for inattentive vs hyperactive-impulsive. Used as a primary outcome measure in our registry." },
  { term: "Alpha (8–13 Hz)",  short: "Brain rhythm associated with relaxed alertness, eyes-closed rest.",
    long: "Alpha rhythm. Most prominent posteriorly when awake with eyes closed. Reduces under task or anxiety. Up-train protocols can target alpha enhancement at Pz/Oz." },
  { term: "Alpha-Theta",     short: "A protocol that trains a balance between alpha and theta — used for trauma + creativity.",
    long: "Combined alpha (8–13 Hz) and theta (4–8 Hz) up-train at Pz/Oz, eyes closed. Originally developed for alcohol-use-disorder treatment (Peniston & Kulkosky, 1989). Now common in PTSD + creative-state work." },
  { term: "BAA",             short: "Business Associate Agreement — HIPAA contract between two parties handling PHI.",
    long: "Required by HIPAA before a vendor (us) can handle Protected Health Information from a covered entity (your clinic). EEGBase ships a standard BAA on signup." },
  { term: "BCIA",            short: "Biofeedback Certification International Alliance.",
    long: "The credentialing body for biofeedback and neurofeedback clinicians. BCN = Board Certified in Neurofeedback (the most common certification)." },
  { term: "Beta (13–30 Hz)", short: "Higher-frequency rhythm tied to focused attention and active thinking.",
    long: "Beta rhythm. Up-train at Cz can support attention; high-beta excess (especially central) is associated with anxiety and hypervigilance." },
  { term: "BIDS-fNIRS",      short: "Open standard for organizing fNIRS research data.",
    long: "BIDS Extension Proposal 30 (BEP-030). Standardizes file naming + JSON sidecar metadata for fNIRS sessions. EEGBase exports every session in BIDS-fNIRS format. Sample at /downloads." },
  { term: "BIRP",            short: "Note format: Behavior · Intervention · Response · Plan.",
    long: "Common community-mental-health note structure. Available as one of 6 note formats in the EEGBase ambient scribe (alongside SOAP, DAP, GIRP, PIE, SIRP)." },
  { term: "CMS-1500",        short: "Standard US insurance claim form.",
    long: "Paper or electronic form used by non-institutional providers to bill Medicare and most commercial payers. EEGBase auto-generates CMS-1500 from session data." },
  { term: "Cohen's d",        short: "Standardized measure of effect size.",
    long: "Difference between two means divided by pooled standard deviation. d = 0.2 small, 0.5 medium, 0.8 large. EEGBase outcome reports include Cohen's d." },
  { term: "DAP",             short: "Note format: Data · Assessment · Plan.",
    long: "Compact alternative to SOAP. Available in the EEGBase ambient scribe." },
  { term: "DPF",             short: "Differential pathlength factor — fNIRS calibration constant.",
    long: "Used in the modified Beer-Lambert law to convert optical-density change into hemoglobin concentration change. Age-dependent. EEGBase auto-adjusts DPF based on subject age." },
  { term: "DSMB",            short: "Data & Safety Monitoring Board — independent study oversight.",
    long: "External committee that reviews aggregate trial data quarterly with authority to recommend protocol modification or pause. Required for our sham-controlled RCT." },
  { term: "DSMP",            short: "Data & Safety Monitoring Plan.",
    long: "Section of an IRB application describing how a study will monitor safety, define stopping rules, and assemble a DSMB." },
  { term: "DUA",             short: "Data Use Agreement — contract governing data sharing between parties.",
    long: "Bilateral or multilateral contract specifying allowed uses, restrictions, and obligations for shared research data. EEGBase + Mendi co-stewardship operates under signed DUA." },
  { term: "EDF+",            short: "European Data Format Plus — open file format for biosignals.",
    long: "Extension of EDF supporting annotations and discontinuous recordings. EEGBase imports + exports EDF+ for raw EEG interoperability with BrainPaint, EEGer, NeuroGuide." },
  { term: "FHIR",            short: "Standard for exchanging healthcare data.",
    long: "Fast Healthcare Interoperability Resources. R4 is the current widely-adopted version. EEGBase ships FHIR R4 SMART-on-FHIR write-back to Epic / Athena Q3 2026." },
  { term: "fNIRS",           short: "Optical method for measuring brain activity from outside the head.",
    long: "Functional near-infrared spectroscopy. Uses two near-IR wavelengths (typically 760 + 850 nm) to measure changes in oxyhemoglobin and deoxyhemoglobin. Mendi is a consumer-grade fNIRS headband." },
  { term: "GAD-7",           short: "7-item self-report anxiety scale.",
    long: "Generalized Anxiety Disorder scale. Scored 0–21. ≥10 = moderate anxiety, ≥15 = severe. Used as a routine pre/post measure in EEGBase." },
  { term: "GIRP",            short: "Note format: Goal · Intervention · Response · Plan.",
    long: "Goal-oriented variant of BIRP. Available in the EEGBase ambient scribe." },
  { term: "HbO / HbR",       short: "Oxyhemoglobin / Deoxyhemoglobin — what fNIRS measures.",
    long: "Concentration changes in oxygenated (HbO) and deoxygenated (HbR) hemoglobin in cortical tissue. Increased neural activity drives HbO up and HbR down (the BOLD response in fNIRS form)." },
  { term: "HIPAA",           short: "US federal law governing healthcare privacy.",
    long: "Health Insurance Portability and Accountability Act. EEGBase operates as a Business Associate under signed BAA. See /security for technical posture." },
  { term: "ICD-10",          short: "Standard codes for diagnoses on insurance claims.",
    long: "International Classification of Diseases, 10th revision. F90.0 = ADHD predominantly inattentive. EEGBase auto-suggests ICD-10 codes per session." },
  { term: "IRB",             short: "Institutional Review Board — ethics approval for human research.",
    long: "Federally-mandated committee that reviews and approves human-subjects research. Sample IRB packet at /downloads." },
  { term: "LORETA",          short: "3D source localization for EEG.",
    long: "Low-Resolution Electromagnetic Tomography. Estimates 3D current sources from scalp EEG. NeuroGuide pioneered the desktop tool. Web-based LORETA in EEGBase ships Q4 2026." },
  { term: "MAR",             short: "Motion artifact rejection — cleaning fNIRS data.",
    long: "Algorithms (wavelet, TDDR, spline) that detect and correct motion artifacts in fNIRS signals. EEGBase MAR accuracy: 96.4% with FPR 0.8%." },
  { term: "MBI-EE",          short: "Maslach Burnout Inventory · Emotional Exhaustion subscale.",
    long: "Most-cited burnout measure. EE subscale ranges 0–54. Used as a registry outcome for our burnout-recovery cohort (KU Leuven replication)." },
  { term: "OxyHb",           short: "Synonym for HbO. Same thing — oxygenated hemoglobin.",
    long: "See HbO." },
  { term: "PHI",             short: "Protected Health Information — HIPAA-protected patient data.",
    long: "Any individually-identifiable health information. EEGBase encrypts at rest (AES-256) and in transit (TLS 1.3). Self-hosting keeps PHI on your own infrastructure." },
  { term: "PHQ-9",           short: "9-item self-report depression scale.",
    long: "Patient Health Questionnaire-9. Scored 0–27. ≥10 = moderate, ≥20 = severe. Standard pre/post measure in EEGBase." },
  { term: "PIE",             short: "Note format: Problem · Intervention · Evaluation.",
    long: "Compact 3-section note style. Available in the EEGBase ambient scribe." },
  { term: "qEEG",            short: "Quantitative EEG — statistical analysis of brain rhythms.",
    long: "Compares a client's EEG against an age-matched normative database. Used to identify deviations (z-scores) and select training targets. EEGBase normative comparison ships now; LORETA source localization Q4 2026." },
  { term: "Reward score",    short: "0–100 composite engagement metric in EEGBase.",
    long: "Per-session score combining time above threshold, signal quality, and protocol-specific weighting. The number the client sees during a session — what they're trained to push up." },
  { term: "SCC",             short: "Standard Contractual Clauses — EU GDPR data-transfer mechanism.",
    long: "EU Commission template clauses (2021/914) that legitimize transferring personal data outside the EU. Required after the Schrems II ruling. EEGBase has SCCs on file with all subprocessors." },
  { term: "Schrems II",      short: "EU court ruling that invalidated Privacy Shield in 2020.",
    long: "Schrems II (CJEU C-311/18). Invalidated the EU-US Privacy Shield framework, requiring SCCs and supplementary measures for EU→US transfers. EEGBase EU clinic data lives in eu-west-3 with SCCs and no transatlantic transfer." },
  { term: "SIRP",            short: "Note format: Situation · Intervention · Response · Plan.",
    long: "Variant focused on situational triggers. Available in the EEGBase ambient scribe." },
  { term: "SMR",             short: "Sensorimotor rhythm — brain wave at 12–15 Hz central.",
    long: "Trained at Cz to support quiet alertness. Common starting protocol for ADHD, anxiety, sleep onset." },
  { term: "SNIRF",           short: "Open binary file format for fNIRS data.",
    long: "Shared Near Infrared Spectroscopy File format. The fNIRS equivalent of EDF for EEG. EEGBase imports + exports SNIRF natively." },
  { term: "SOAP",            short: "Note format: Subjective · Objective · Assessment · Plan.",
    long: "Most common clinical-note structure in mental health. Default in the EEGBase ambient scribe (also DAP, BIRP, GIRP, PIE, SIRP available)." },
  { term: "SOC 2",           short: "Audit framework for software security + availability.",
    long: "Service Organization Control 2 Type II report. Audited by independent CPA firm. EEGBase: Coalfire Q3 2026, NDA-gated download. See /security." },
  { term: "Theta (4–8 Hz)",  short: "Slower brain rhythm tied to drowsiness, reverie, or distractibility.",
    long: "Theta rhythm. Excess theta (especially frontal-central) is the most-studied marker of ADHD inattentive subtype. Suppression protocols target theta down-train at Cz." },
  { term: "Theta/Beta ratio", short: "Classic EEG biomarker for ADHD inattentive subtype.",
    long: "Power ratio of theta (4–8 Hz) to beta (13–30 Hz) at central electrodes. Elevated in inattentive ADHD. Tracked as a longitudinal trend in EEGBase." },
  { term: "VPAT",            short: "Voluntary Product Accessibility Template — accessibility conformance doc.",
    long: "Standard template per Section 508 for documenting WCAG conformance. EEGBase VPAT 2.4: WCAG 2.2 AA Q3 2026, Deque-audited." },
  { term: "WCAG",            short: "Web Content Accessibility Guidelines.",
    long: "International accessibility standard from W3C. EEGBase: 2.2 AA conformant Q3 2026, audited by Deque Systems. See /security for the VPAT." },
  { term: "Z-score",          short: "How many standard deviations a value is from a normative mean.",
    long: "Used for qEEG and outcome comparison. ±1 SD = within normal range, ±2 SD = noteworthy, beyond ±2.5 SD = clinically significant. EEGBase color-codes z-scores in the Brain Map tab." },
];

export default function GlossaryPage() {
  const sorted = [...TERMS].sort((a, b) => a.term.localeCompare(b.term));
  const letters = Array.from(new Set(sorted.map((t) => t.term[0].toUpperCase()))).sort();

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/></svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>EEGBase</span>
          </Link>
          <Link href="/demo" style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>Live demo →</Link>
        </div>
      </header>

      <main style={{ maxWidth: 920, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>Glossary · {sorted.length} terms</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>Plain-English definitions</h1>
        <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.7, marginBottom: 24, maxWidth: 720 }}>
          Every clinical, technical, or regulatory term used in the EEGBase demo, in alphabetical order. The same definitions power the hover-tooltips you see in the demo.
        </p>

        {/* Letter index */}
        <nav aria-label="Letter index" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 28 }}>
          {letters.map((l) => (
            <a key={l} href={`#letter-${l}`} style={{ padding: "6px 11px", fontSize: 12, fontWeight: 700, color: "#475569", background: "white", border: "1px solid #E5E7EB", borderRadius: 8, textDecoration: "none" }}>{l}</a>
          ))}
        </nav>

        {/* Terms */}
        {letters.map((letter) => (
          <section key={letter} id={`letter-${letter}`} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10, scrollMarginTop: 80 }}>{letter}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sorted.filter((t) => t.term[0].toUpperCase() === letter).map((t) => (
                <article key={t.term} id={t.term.toLowerCase().replace(/\s+/g, "-")} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginBottom: 4, scrollMarginTop: 80 }}>{t.term}</h3>
                  <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, marginBottom: 6, fontStyle: "italic" }}>{t.short}</p>
                  <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.7 }}>{t.long}</p>
                </article>
              ))}
            </div>
          </section>
        ))}

        <div style={{ background: "linear-gradient(135deg, #ECFDF5, #F0FDF4)", border: "1px solid #A7F3D0", borderRadius: 14, padding: 20, textAlign: "center", marginTop: 28 }}>
          <p style={{ fontSize: 13, color: "#065F46" }}>Term missing? <Link href="/contact" style={{ color: "#10B981", textDecoration: "underline", fontWeight: 700 }}>Let us know</Link> — we add common requests within a week.</p>
        </div>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link> · <Link href="/research" style={{ color: "#9CA3AF" }}>Research</Link>
      </footer>
    </div>
  );
}
