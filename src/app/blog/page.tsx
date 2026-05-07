import Link from "next/link";

export const metadata = {
  title: "Blog · EEGBase",
  description: "Field notes, opinions, and explainers from the EEGBase team.",
};

const POSTS = [
  {
    slug: "why-neurofeedback-needs-an-ehr",
    title: "Why neurofeedback needs an EHR — and why it doesn't have one yet",
    date: "May 4 2026",
    read: "6 min",
    excerpt: "The neurofeedback field invented its own software in 1995 and never updated it. Why every clinic still ends up running BrainPaint + SimplePractice + Stripe + a paper SOAP pad — and why a unified clinical layer was inevitable.",
    body: "Most neurofeedback clinicians today run four tools to deliver one session: streaming software (BrainPaint, EEGer, BioExplorer), a separate EHR (SimplePractice, TherapyNotes), a separate billing tool, and a separate report generator. The streaming tools are 25-year-old Windows software because the field is small and the legacy tools work. The EHRs are general-purpose mental-health platforms because the major EHR vendors don't see neurofeedback as a vertical. The economic pressure to unify these has been weak — until consumer fNIRS hardware (Mendi, Muse Athena, Sens.ai) cracked the price point at $299–500 in 2024–2025 and clinicians could suddenly prescribe at-home neurofeedback the way they prescribe Headspace. That changed the math. A clinic running Mendi at home + clinic check-ins needs one record across the two contexts; the legacy EHRs can't see the signals; the streaming tools can't bill insurance. Hence EEGBase. The clinical layer that ties consumer hardware to clinic workflow.",
  },
  {
    slug: "bids-fnirs-explained",
    title: "BIDS-fNIRS, briefly explained",
    date: "Apr 28 2026",
    read: "4 min",
    excerpt: "If you hear 'BIDS' and panic, this is for you. The 5-minute version of why a directory-naming convention will determine which fNIRS data ends up in the literature.",
    body: "BIDS — Brain Imaging Data Structure — started in 2016 as a way to standardize how MRI data is named, organized, and described. Since then it has expanded to EEG, MEG, intracranial EEG, and now fNIRS (BIDS Extension Proposal 30, 'BEP-030', currently in draft). The pitch is simple: any researcher who can read your dataset's directory tree can run any analysis pipeline. No more 'what does column 4 in this CSV mean?' BIDS-fNIRS specifies: directory naming (sub-001/ses-01/nirs/), required JSON sidecars (the metadata file we publish at /downloads), the SNIRF binary format for raw signals, and validator tooling. EEGBase exports every session in BEP-030 format. That's why our pre-print can include a multi-clinic registry that didn't have to manually clean up file naming across 412 sites — the platform did it for them at upload.",
  },
  {
    slug: "what-we-learned-from-412-clinics",
    title: "What we learned building a registry across 412 clinics",
    date: "Apr 22 2026",
    read: "8 min",
    excerpt: "n=2,840 patients. Multi-site. Naturalistic. Not the same as an RCT — but the next-best thing. The boring lessons that mattered most.",
    body: "Three things matter when you run a multi-site naturalistic registry. First, consent flow has to be friction-free for the family or your data is biased toward the most-engaged 10%. We split clinical consent (already obtained at intake) from research-consent (separate form, freely revocable, plain English at 8th-grade reading level). Opt-in rate: 64% — much higher than published-trial norms. Second, motion artifact rejection must be aggressive but tunable. A 14-year-old wearing Mendi at home generates wildly different artifacts than a 35-year-old in a clinic chair. We tuned MAR per-context (FPR 0.8% in clinic, 1.2% at home) and reported both in the sidecar. Third, sites need a working IRB packet on day one. We published the sample at /downloads — replace the bracketed names, walk through your site's IRB, you'll typically get exempt-or-expedited status in 4–6 weeks for this kind of registry.",
  },
];

export default function BlogIndex() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 800, fontSize: 14 }}>EB</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>EEGBase</span>
          </Link>
          <Link href="/changelog/rss.xml" style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>RSS →</Link>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>Field notes from the team</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>Blog</h1>
        <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.7, marginBottom: 36 }}>
          Opinions, explainers, and post-mortems. Different from the <Link href="/changelog" style={{ color: "#2563EB" }}>changelog</Link> (which lists shipped features) — this is where we work through ideas in public.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {POSTS.map((p) => (
            <article key={p.slug} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "#94A3B8", marginBottom: 8 }}>
                <span>{p.date}</span>
                <span>·</span>
                <span>{p.read} read</span>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.01em", marginBottom: 8, lineHeight: 1.3 }}>{p.title}</h2>
              <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7 }}>{p.excerpt}</p>
              <Link href={`/blog/${p.slug}`} style={{ display: "inline-block", marginTop: 12, fontSize: 13, fontWeight: 700, color: "#2563EB", textDecoration: "none" }}>Read full post →</Link>
            </article>
          ))}
        </div>
      </main>

      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "24px", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
        © 2026 EEGBase · MIT licensed · <Link href="/" style={{ color: "#9CA3AF" }}>Home</Link> · <Link href="/changelog" style={{ color: "#9CA3AF" }}>Changelog</Link>
      </footer>
    </div>
  );
}
