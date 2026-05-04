"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle } from "lucide-react";

// ── Questions ─────────────────────────────────────────────────────────────────
type Domain = "attention" | "anxiety" | "sleep" | "mood" | "cognitive";

interface Question {
  id: string;
  domain: Domain;
  text: string;
  invert?: boolean; // lower score = worse
}

const QUESTIONS: Question[] = [
  // Attention / ADHD
  { id: "a1", domain: "attention", text: "I have difficulty sustaining focus on tasks for more than 15 minutes." },
  { id: "a2", domain: "attention", text: "I am easily distracted by unrelated thoughts or external stimuli." },
  { id: "a3", domain: "attention", text: "I struggle to follow through on tasks without losing interest." },
  { id: "a4", domain: "attention", text: "I make careless errors or overlook details in work." },
  { id: "a5", domain: "attention", text: "I feel mentally restless or like I 'need to keep moving'." },
  // Anxiety
  { id: "x1", domain: "anxiety", text: "I feel tense, on edge, or unable to relax most days." },
  { id: "x2", domain: "anxiety", text: "I experience excessive worry about everyday situations." },
  { id: "x3", domain: "anxiety", text: "Physical symptoms of anxiety (racing heart, tight chest) disrupt my daily life." },
  { id: "x4", domain: "anxiety", text: "I avoid situations because of fear or anticipatory anxiety." },
  { id: "x5", domain: "anxiety", text: "Anxious thoughts intrude even when I am trying to relax." },
  // Sleep
  { id: "s1", domain: "sleep", text: "I have difficulty falling asleep (>30 min most nights)." },
  { id: "s2", domain: "sleep", text: "I wake during the night and struggle to return to sleep." },
  { id: "s3", domain: "sleep", text: "I wake feeling unrefreshed even after adequate sleep hours." },
  { id: "s4", domain: "sleep", text: "Daytime sleepiness or fatigue significantly impacts my functioning." },
  { id: "s5", domain: "sleep", text: "Racing thoughts or mental activation prevent me from sleeping." },
  // Mood / Depression
  { id: "m1", domain: "mood", text: "I experience persistent low mood, sadness, or emotional flatness." },
  { id: "m2", domain: "mood", text: "I have lost interest or pleasure in activities I used to enjoy." },
  { id: "m3", domain: "mood", text: "I experience significant mood swings within the same day." },
  { id: "m4", domain: "mood", text: "I feel hopeless or have negative thoughts about the future." },
  { id: "m5", domain: "mood", text: "I feel emotionally numb or disconnected from others." },
  // Cognitive performance
  { id: "c1", domain: "cognitive", text: "I have noticeable difficulty with memory or word recall." },
  { id: "c2", domain: "cognitive", text: "My processing speed feels slower than it used to be." },
  { id: "c3", domain: "cognitive", text: "I struggle with mental flexibility or shifting between tasks." },
  { id: "c4", domain: "cognitive", text: "I have difficulty with decision-making or executive planning." },
  { id: "c5", domain: "cognitive", text: "Brain fog significantly limits my ability to think clearly." },
];

type Scores = Record<string, number>;

// ── Protocol recommendations ──────────────────────────────────────────────────
interface Recommendation {
  title: string;
  rationale: string;
  protocol: string;
  bands: string;
  sites: string;
  sessionsPerWeek: string;
  color: string;
}

function recommend(domainScores: Record<Domain, number>): Recommendation[] {
  const recs: Recommendation[] = [];
  const sorted = (Object.entries(domainScores) as [Domain, number][])
    .sort((a, b) => b[1] - a[1]);

  const primary = sorted[0];
  const secondary = sorted[1];

  const domainMap: Record<Domain, Recommendation> = {
    attention: {
      title: "SMR / Beta Attention Protocol",
      rationale: "Elevated attention symptoms suggest under-activation of frontocentral SMR (12–15 Hz) with excess theta. Training SMR upward and theta downward is the evidence-based first-line neurofeedback approach for attentional dysregulation.",
      protocol: "SMR Up / Theta Down",
      bands: "↑ SMR (12–15 Hz) · ↓ Theta (4–8 Hz)",
      sites: "Cz or C3/C4 (central)",
      sessionsPerWeek: "2–3× per week · 20 min per session",
      color: "#2563EB",
    },
    anxiety: {
      title: "Alpha / Theta Relaxation Protocol",
      rationale: "High anxiety scores indicate sympathetic over-activation with suppressed alpha (8–12 Hz). Alpha uptraining at Pz/Oz combined with alpha-theta crossover protocols promotes parasympathetic tone and reduces hyper-arousal.",
      protocol: "Alpha Up / Alpha-Theta Crossover",
      bands: "↑ Alpha (8–12 Hz) · ↑ Theta (4–8 Hz)",
      sites: "Pz (posterior midline)",
      sessionsPerWeek: "2× per week · 20–30 min per session",
      color: "#10B981",
    },
    sleep: {
      title: "Delta Enhancement / Sleep Onset Protocol",
      rationale: "Sleep dysfunction scores suggest difficulty transitioning from waking beta dominance to delta/theta states. Alpha-theta crossover training and frontal delta uptraining promote the neural state changes associated with sleep onset.",
      protocol: "Alpha-Theta Crossover · Delta Up",
      bands: "↑ Delta (1–4 Hz) · ↑ Theta · ↓ Beta",
      sites: "Fz / Pz",
      sessionsPerWeek: "3× per week · 30 min · evening sessions preferred",
      color: "#6366F1",
    },
    mood: {
      title: "Frontal Alpha Asymmetry Protocol",
      rationale: "Mood symptoms correlate with right frontal alpha excess (hypo-activation of left PFC). Left frontal alpha down-training combined with F3/F4 asymmetry normalization is supported by multiple meta-analyses for depression.",
      protocol: "Left Frontal Alpha Suppression / F3-F4 Asymmetry",
      bands: "↓ Alpha at F3 · ↑ Alpha at F4",
      sites: "F3 + F4 (frontal asymmetry)",
      sessionsPerWeek: "2–3× per week · 20–25 min per session",
      color: "#EC4899",
    },
    cognitive: {
      title: "Prefrontal Gamma / Beta Cognitive Protocol",
      rationale: "Cognitive performance deficits indicate insufficient frontal beta/gamma drive for executive function. Uptraining beta (15–18 Hz) or low gamma (35–45 Hz) at Fp1/Fp2 supports working memory, processing speed, and executive control.",
      protocol: "Beta / Lo-Gamma Uptraining",
      bands: "↑ Beta (15–18 Hz) · ↑ Lo-Gamma (35–45 Hz)",
      sites: "Fp1 / Fp2 (prefrontal)",
      sessionsPerWeek: "2× per week · 20 min per session",
      color: "#F59E0B",
    },
  };

  if (primary && primary[1] >= 10) recs.push(domainMap[primary[0]]);
  if (secondary && secondary[1] >= 8 && secondary[0] !== primary[0]) recs.push(domainMap[secondary[0]]);
  if (recs.length === 0) recs.push(domainMap.attention); // fallback

  return recs;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function IntakePage() {
  const { id: clientId } = useParams<{ id: string }>();
  const [scores, setScores] = useState<Scores>({});
  const [submitted, setSubmitted] = useState(false);

  const answered = Object.keys(scores).length;
  const allAnswered = answered === QUESTIONS.length;

  function handleScore(qId: string, val: number) {
    setScores((prev) => ({ ...prev, [qId]: val }));
  }

  function computeDomainScores(): Record<Domain, number> {
    const totals: Record<Domain, number> = { attention: 0, anxiety: 0, sleep: 0, mood: 0, cognitive: 0 };
    for (const q of QUESTIONS) {
      totals[q.domain] += scores[q.id] ?? 0;
    }
    return totals;
  }

  const domainScores = submitted ? computeDomainScores() : null;
  const recommendations = domainScores ? recommend(domainScores) : [];

  const DOMAIN_LABELS: Record<Domain, string> = {
    attention: "Attention / ADHD",
    anxiety: "Anxiety",
    sleep: "Sleep",
    mood: "Mood / Depression",
    cognitive: "Cognitive Performance",
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/clients/${clientId}`} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--text-tertiary)" }}>
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Symptom Intake Assessment</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>25 questions · ~5 min · produces protocol recommendation</p>
        </div>
      </div>

      {!submitted ? (
        <>
          <div className="rounded-xl border px-5 py-4 mb-6 text-sm" style={{ background: "color-mix(in srgb, var(--brand) 8%, transparent)", borderColor: "color-mix(in srgb, var(--brand) 20%, transparent)", color: "var(--brand)" }}>
            Rate each statement from <strong>1 (not at all)</strong> to <strong>5 (very much / almost always)</strong>.
            Answer based on your experience over the past two weeks.
          </div>

          <div className="space-y-6">
            {(["attention", "anxiety", "sleep", "mood", "cognitive"] as Domain[]).map((domain) => (
              <div key={domain} className="rounded-xl border overflow-hidden" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
                <div className="px-5 py-3 border-b" style={{ background: "var(--surface-sunken)", borderColor: "var(--border-subtle)" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{DOMAIN_LABELS[domain]}</p>
                </div>
                <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                  {QUESTIONS.filter((q) => q.domain === domain).map((q, qi) => (
                    <div key={q.id} className="px-5 py-4">
                      <p className="text-sm mb-3" style={{ color: "var(--text-primary)" }}>
                        <span className="font-mono text-xs mr-2" style={{ color: "var(--text-tertiary)" }}>{qi + 1}.</span>
                        {q.text}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs w-16" style={{ color: "var(--text-tertiary)" }}>Not at all</span>
                        <div className="flex gap-2 flex-1">
                          {[1, 2, 3, 4, 5].map((v) => (
                            <button
                              key={v}
                              onClick={() => handleScore(q.id, v)}
                              className="flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors"
                              style={
                                scores[q.id] === v
                                  ? { background: "var(--brand)", color: "#fff", borderColor: "var(--brand)" }
                                  : { background: "var(--surface-raised)", color: "var(--text-secondary)", borderColor: "var(--border-default)" }
                              }
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                        <span className="text-xs w-16 text-right" style={{ color: "var(--text-tertiary)" }}>Very much</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>{answered} / {QUESTIONS.length} answered</p>
            <button
              onClick={() => setSubmitted(true)}
              disabled={!allAnswered}
              className="px-6 py-2.5 text-white text-sm font-semibold rounded-lg transition-colors"
              style={{ background: "var(--brand)", opacity: !allAnswered ? 0.4 : 1 }}
            >
              Get Protocol Recommendation →
            </button>
          </div>
        </>
      ) : (
        // Results
        <div className="space-y-6">
          <div className="rounded-xl border px-5 py-4 flex items-center gap-3" style={{ background: "var(--success-subtle)", borderColor: "color-mix(in srgb, var(--success) 20%, transparent)" }}>
            <CheckCircle size={20} className="shrink-0" style={{ color: "var(--success)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--success)" }}>Assessment complete · Protocol recommendation generated</p>
          </div>

          {/* Domain score bars */}
          <div className="rounded-xl border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Domain Scores</h2>
            <div className="space-y-3">
              {(Object.entries(domainScores!) as [Domain, number][])
                .sort((a, b) => b[1] - a[1])
                .map(([domain, score]) => (
                  <div key={domain}>
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: "var(--text-primary)" }}>{DOMAIN_LABELS[domain]}</span>
                      <span className="tabular-nums font-medium" style={{ color: "var(--text-secondary)" }}>{score} / 25</span>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--surface-sunken)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(score / 25) * 100}%`,
                          background: score >= 18 ? "var(--danger)" : score >= 12 ? "var(--warning)" : "var(--success)",
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
            <p className="text-xs mt-3" style={{ color: "var(--text-tertiary)" }}>Score ≥18 = high; 12–17 = moderate; &lt;12 = low symptom burden</p>
          </div>

          {/* Recommendations */}
          <h2 className="text-base font-semibold -mb-2" style={{ color: "var(--text-primary)" }}>Recommended Protocols</h2>
          {recommendations.map((rec, i) => (
            <div key={i} className="rounded-xl border overflow-hidden" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
              <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderBottom: "1px solid var(--border-subtle)", borderLeft: `4px solid ${rec.color}` }}>
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{i === 0 ? "Primary" : "Secondary"}: {rec.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{rec.protocol}</p>
                </div>
              </div>
              <div className="px-5 py-4 space-y-3 text-sm">
                <p className="leading-relaxed" style={{ color: "var(--text-primary)" }}>{rec.rationale}</p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-lg p-3" style={{ background: "var(--surface-sunken)" }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-tertiary)" }}>Target Bands</p>
                    <p className="font-medium" style={{ color: "var(--text-primary)" }}>{rec.bands}</p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: "var(--surface-sunken)" }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-tertiary)" }}>Electrode Sites</p>
                    <p className="font-medium" style={{ color: "var(--text-primary)" }}>{rec.sites}</p>
                  </div>
                  <div className="rounded-lg p-3 col-span-2" style={{ background: "var(--surface-sunken)" }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-tertiary)" }}>Frequency Recommendation</p>
                    <p className="font-medium" style={{ color: "var(--text-primary)" }}>{rec.sessionsPerWeek}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="rounded-xl border px-5 py-4 text-xs" style={{ background: "var(--warning-subtle)", borderColor: "color-mix(in srgb, var(--warning) 20%, transparent)", color: "var(--warning)" }}>
            <strong>Clinical note:</strong> This algorithmic recommendation is a starting point based on self-report scores.
            Individual protocol decisions should incorporate qEEG data, clinical interview, and clinician judgment.
            Validate with the client before proceeding.
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setSubmitted(false); setScores({}); }}
              className="px-5 py-2.5 text-sm font-medium rounded-lg transition-colors"
              style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)", background: "var(--surface-raised)" }}
            >
              Retake Assessment
            </button>
            <Link
              href={`/clients/${clientId}`}
              className="px-5 py-2.5 text-white text-sm font-semibold rounded-lg transition-colors"
              style={{ background: "var(--brand)" }}
            >
              Back to Client Profile →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
