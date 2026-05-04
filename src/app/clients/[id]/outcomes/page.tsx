"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { saveOutcomeMeasure } from "./actions";

// ── Questionnaire definitions ───────────────────────────────────────────────

const MEASURES = {
  "gad7": {
    label: "GAD-7 (Anxiety)",
    instructions: "Over the last 2 weeks, how often have you been bothered by the following problems?",
    options: ["Not at all (0)", "Several days (1)", "More than half the days (2)", "Nearly every day (3)"],
    questions: [
      "Feeling nervous, anxious, or on edge",
      "Not being able to stop or control worrying",
      "Worrying too much about different things",
      "Trouble relaxing",
      "Being so restless that it's hard to sit still",
      "Becoming easily annoyed or irritable",
      "Feeling afraid as if something awful might happen",
    ],
    interpret: (score: number) =>
      score <= 4 ? "Minimal anxiety" : score <= 9 ? "Mild anxiety" : score <= 14 ? "Moderate anxiety" : "Severe anxiety",
  },
  "phq9": {
    label: "PHQ-9 (Depression)",
    instructions: "Over the last 2 weeks, how often have you been bothered by the following problems?",
    options: ["Not at all (0)", "Several days (1)", "More than half the days (2)", "Nearly every day (3)"],
    questions: [
      "Little interest or pleasure in doing things",
      "Feeling down, depressed, or hopeless",
      "Trouble falling or staying asleep, or sleeping too much",
      "Feeling tired or having little energy",
      "Poor appetite or overeating",
      "Feeling bad about yourself or that you're a failure",
      "Trouble concentrating on things, such as reading or watching TV",
      "Moving or speaking so slowly that others could have noticed, or being fidgety/restless",
      "Thoughts that you would be better off dead or hurting yourself in some way",
    ],
    interpret: (score: number) =>
      score <= 4 ? "Minimal depression" : score <= 9 ? "Mild depression" : score <= 14 ? "Moderate depression" : score <= 19 ? "Moderately severe" : "Severe depression",
  },
  "adhd-rs": {
    label: "ADHD-RS (Adult Self-Report)",
    instructions: "Rate each symptom based on how you have felt over the past 6 months.",
    options: ["Never (0)", "Rarely (1)", "Sometimes (2)", "Often (3)", "Very often (4)"],
    questions: [
      "Failing to give close attention to details or making careless mistakes",
      "Difficulty sustaining attention in tasks or leisure activities",
      "Not listening when spoken to directly",
      "Failing to follow through on instructions or finish tasks",
      "Difficulty organising tasks and activities",
      "Avoiding tasks that require sustained mental effort",
      "Losing things necessary for tasks",
      "Being easily distracted by extraneous stimuli",
      "Being forgetful in daily activities",
      "Fidgeting with hands/feet or squirming in seat",
      "Leaving seat in situations requiring sitting",
      "Feeling restless",
      "Unable to engage in activities quietly",
      "Being 'on the go' or as if 'driven by a motor'",
      "Talking excessively",
      "Blurting out answers before questions are completed",
      "Difficulty waiting turn",
      "Interrupting or intruding on others",
    ],
    interpret: (score: number) =>
      score <= 14 ? "Minimal symptoms" : score <= 28 ? "Mild symptoms" : score <= 42 ? "Moderate symptoms" : "Severe symptoms",
  },
  "conners": {
    label: "Conners Brief (Attention)",
    instructions: "Rate the following items based on behaviour in the past month.",
    options: ["Never (0)", "Just a little (1)", "Pretty much (2)", "Very much (3)"],
    questions: [
      "Inattentive, easily distracted",
      "Fails to finish things started",
      "Difficulty organising work",
      "Does not seem to listen",
      "Difficulty learning",
      "Restless, overactive",
      "Excitable, impulsive",
      "Disturbs other children",
      "Changes mood quickly and drastically",
      "Temper outbursts, explosive behaviour",
    ],
    interpret: (score: number) =>
      score <= 10 ? "Within normal limits" : score <= 20 ? "Borderline" : "Significant symptoms",
  },
  "acs": {
    label: "Attention Control Scale (ACS)",
    instructions: "Rate how often each statement applies to you.",
    options: ["Almost Never (1)", "Sometimes (2)", "Often (3)", "Almost Always (4)"],
    // Items 1, 4, 6, 8 (index 0, 3, 5, 7) are reverse-scored.
    // The options array above is presented 1–4. Scoring is handled in the interpret function.
    questions: [
      "It is hard for me to concentrate on a task when there are noises",
      "I can focus on positive thoughts when I am feeling anxious",
      "I can keep thinking about a problem until I solve it",
      "I have difficulty concentrating when I am worried",
      "I can quickly shift my attention from one thing to another",
      "It is difficult to concentrate on one thing for a long period",
      "I can recover well from distracting thoughts",
      "I lose concentration easily when I am under stress",
    ],
    interpret: (score: number) =>
      score >= 24 ? "Strong attention control" : score >= 18 ? "Moderate attention control" : score >= 12 ? "Developing attention control" : "Needs support",
  },
};

type MeasureKey = keyof typeof MEASURES;

export default function OutcomesPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [selected, setSelected] = useState<MeasureKey | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const measure = selected ? MEASURES[selected] : null;
  const allAnswered = measure ? measure.questions.every((_, i) => answers[i] != null) : false;

  // ACS uses 1-4 rating (val 0-3 from button index) and has reverse-scored items at indices 0, 3, 5, 7.
  // All other measures use 0-based option values directly.
  const ACS_REVERSE_ITEMS = new Set([0, 3, 5, 7]);
  const totalScore = selected === "acs"
    ? Object.entries(answers).reduce((acc, [k, v]) => {
        const idx = Number(k);
        const rating = v + 1; // convert 0-indexed button val to 1-4 rating
        const scored = ACS_REVERSE_ITEMS.has(idx) ? (5 - rating) : rating;
        return acc + scored;
      }, 0)
    : Object.values(answers).reduce((a, b) => a + b, 0);

  const interpretation = measure && allAnswered ? measure.interpret(totalScore) : "";

  async function handleSave() {
    if (!selected || !measure || !allAnswered) return;
    setSaving(true);
    try {
      // For ACS, store the effective scored value (1-4, reverse-scored where applicable)
      const serializedAnswers = selected === "acs"
        ? Object.fromEntries(Object.entries(answers).map(([k, v]) => {
            const idx = Number(k);
            const rating = v + 1;
            const scored = ACS_REVERSE_ITEMS.has(idx) ? (5 - rating) : rating;
            return [`q${idx + 1}`, scored];
          }))
        : Object.fromEntries(Object.entries(answers).map(([k, v]) => [`q${Number(k) + 1}`, v]));
      await saveOutcomeMeasure({
        clientId,
        measureType: selected,
        answers: serializedAnswers,
        totalScore,
        interpretation,
        notes,
      });
      setSaved(true);
      setTimeout(() => router.push(`/clients/${clientId}`), 1500);
    } finally {
      setSaving(false);
    }
  }

  if (!selected) {
    return (
      <div className="max-w-xl">
        <div className="flex items-center gap-3 mb-8">
          <Link href={`/clients/${clientId}`} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--text-tertiary)" }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Outcome Measures</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Select a standardised questionnaire to administer</p>
          </div>
        </div>

        <div className="space-y-3">
          {(Object.entries(MEASURES) as [MeasureKey, typeof MEASURES[MeasureKey]][]).map(([key, m]) => (
            <button
              key={key}
              onClick={() => { setSelected(key); setAnswers({}); }}
              className="w-full text-left rounded-xl border px-5 py-4 transition-colors"
              style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}
            >
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{m.label}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{m.questions.length} questions</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => { setSelected(null); setAnswers({}); }}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--text-tertiary)" }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{measure!.label}</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{measure!.instructions}</p>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden mb-4" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
        <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
          {measure!.questions.map((q, i) => (
            <div key={i} className="px-5 py-4">
              <div className="flex items-baseline gap-2 mb-3">
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>{i + 1}. {q}</p>
                {selected === "acs" && ACS_REVERSE_ITEMS.has(i) && (
                  <span className="text-xs shrink-0" style={{ color: "var(--text-tertiary)" }}>(reverse)</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {measure!.options.map((opt, val) => (
                  <button
                    key={val}
                    onClick={() => setAnswers((a) => ({ ...a, [i]: val }))}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={
                      answers[i] === val
                        ? { background: "var(--brand)", color: "#fff" }
                        : { background: "var(--surface-sunken)", color: "var(--text-secondary)" }
                    }
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {allAnswered && (
        <div className="rounded-xl border p-5 mb-4" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{totalScore}</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Total Score</p>
            </div>
            <span className="px-3 py-1 text-sm font-medium rounded-full" style={{ background: "color-mix(in srgb, var(--brand) 10%, transparent)", color: "var(--brand)" }}>
              {interpretation}
            </span>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Clinical Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any observations about this administration…"
              className="w-full rounded-lg px-3 py-2 text-sm resize-none focus:outline-none"
              style={{ border: "1px solid var(--border-default)", background: "var(--surface-raised)", color: "var(--text-primary)" }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        {saved ? (
          <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--success)" }}>
            <CheckCircle size={16} /> Saved!
          </div>
        ) : (
          <button
            onClick={handleSave}
            disabled={!allAnswered || saving}
            className="px-6 py-2.5 text-white text-sm font-semibold rounded-lg transition-colors"
            style={{ background: "var(--brand)", opacity: (!allAnswered || saving) ? 0.4 : 1 }}
          >
            {saving ? "Saving…" : "Save Results"}
          </button>
        )}
      </div>
    </div>
  );
}
