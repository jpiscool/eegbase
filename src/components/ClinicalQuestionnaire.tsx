"use client";

import { useState } from "react";

// PHQ-9: Patient Health Questionnaire (depression screening)
const PHQ9_ITEMS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading the newspaper or watching television",
  "Moving or speaking so slowly that other people could have noticed — or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead, or of hurting yourself in some way",
];

// GAD-7: Generalized Anxiety Disorder scale
const GAD7_ITEMS = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it is hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid, as if something awful might happen",
];

const FREQUENCY_OPTIONS = [
  { label: "Not at all", value: 0 },
  { label: "Several days", value: 1 },
  { label: "More than half the days", value: 2 },
  { label: "Nearly every day", value: 3 },
];

function scorePHQ9(s: number) {
  if (s <= 4) return { level: "Minimal", color: "#10B981", note: "Minimal depression" };
  if (s <= 9) return { level: "Mild", color: "#84CC16", note: "Mild depression" };
  if (s <= 14) return { level: "Moderate", color: "#F59E0B", note: "Moderate depression — consider counseling" };
  if (s <= 19) return { level: "Mod-Severe", color: "#F97316", note: "Moderately severe — active treatment recommended" };
  return { level: "Severe", color: "#EF4444", note: "Severe depression — immediate treatment recommended" };
}

function scoreGAD7(s: number) {
  if (s <= 4) return { level: "Minimal", color: "#10B981", note: "Minimal anxiety" };
  if (s <= 9) return { level: "Mild", color: "#84CC16", note: "Mild anxiety" };
  if (s <= 14) return { level: "Moderate", color: "#F59E0B", note: "Moderate anxiety — consider treatment" };
  return { level: "Severe", color: "#EF4444", note: "Severe anxiety — active treatment recommended" };
}

interface Props {
  clientName?: string;
  onComplete?: (data: { phq9: number; gad7: number; date: string }) => void;
  readOnly?: boolean;
  initialPHQ9?: number[];
  initialGAD7?: number[];
}

export function ClinicalQuestionnaire({ clientName, onComplete, readOnly = false, initialPHQ9, initialGAD7 }: Props) {
  const [tab, setTab] = useState<"phq9" | "gad7">("phq9");
  const [phq9, setPHQ9] = useState<(number | null)[]>(initialPHQ9 ?? Array(9).fill(null));
  const [gad7, setGAD7] = useState<(number | null)[]>(initialGAD7 ?? Array(7).fill(null));
  const [submitted, setSubmitted] = useState(false);

  const phq9Score = phq9.every((v) => v !== null) ? phq9.reduce((a, b) => a! + b!, 0)! : null;
  const gad7Score = gad7.every((v) => v !== null) ? gad7.reduce((a, b) => a! + b!, 0)! : null;

  const phq9Result = phq9Score !== null ? scorePHQ9(phq9Score) : null;
  const gad7Result = gad7Score !== null ? scoreGAD7(gad7Score) : null;

  const allDone = phq9.every((v) => v !== null) && gad7.every((v) => v !== null);

  function handleSubmit() {
    if (!allDone) return;
    setSubmitted(true);
    onComplete?.({ phq9: phq9Score!, gad7: gad7Score!, date: new Date().toISOString() });
  }

  const card: React.CSSProperties = {
    background: "#0F172A",
    border: "1px solid #334155",
    borderRadius: 16,
    padding: 24,
  };

  const items = tab === "phq9" ? PHQ9_ITEMS : GAD7_ITEMS;
  const answers = tab === "phq9" ? phq9 : gad7;
  const setAnswers = tab === "phq9" ? setPHQ9 : setGAD7;
  const score = tab === "phq9" ? phq9Score : gad7Score;
  const result = tab === "phq9" ? phq9Result : gad7Result;
  const maxScore = tab === "phq9" ? 27 : 21;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        {clientName && (
          <p style={{ fontSize: 13, color: "#94A3B8", marginBottom: 4 }}>
            Client: <strong>{clientName}</strong>
          </p>
        )}
        <p style={{ fontSize: 12, color: "#64748B" }}>
          Over the last 2 weeks, how often have you been bothered by the following problems?
        </p>
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["phq9", "gad7"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600,
              background: tab === t ? "var(--brand, #2563EB)" : "#1E293B",
              color: tab === t ? "#fff" : "#94A3B8",
            }}
          >
            {t === "phq9" ? "PHQ-9 Depression" : "GAD-7 Anxiety"}
            {t === "phq9" && phq9Score !== null && (
              <span style={{ marginLeft: 6, opacity: 0.85 }}>· {phq9Score}</span>
            )}
            {t === "gad7" && gad7Score !== null && (
              <span style={{ marginLeft: 6, opacity: 0.85 }}>· {gad7Score}</span>
            )}
          </button>
        ))}
      </div>

      {/* Questions */}
      <div style={card}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 16 }}>
          {tab === "phq9" ? "PHQ-9 — Patient Health Questionnaire" : "GAD-7 — Generalized Anxiety Disorder Scale"}
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {items.map((item, i) => (
            <div key={i} style={{ paddingBottom: 16, borderBottom: i < items.length - 1 ? "1px solid #334155" : "none" }}>
              <p style={{ fontSize: 13, color: "#CBD5E1", marginBottom: 10, lineHeight: 1.5 }}>
                <span style={{ color: "var(--text-tertiary, #94A3B8)", marginRight: 8, fontWeight: 600 }}>{i + 1}.</span>
                {item}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {FREQUENCY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    disabled={readOnly}
                    onClick={() => {
                      const next = [...answers];
                      next[i] = opt.value;
                      setAnswers(next as (number | null)[]);
                    }}
                    style={{
                      padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: readOnly ? "default" : "pointer",
                      border: answers[i] === opt.value
                        ? "2px solid var(--brand, #2563EB)"
                        : "1px solid #334155",
                      background: answers[i] === opt.value ? "var(--brand, #2563EB)" : "#1E293B",
                      color: answers[i] === opt.value ? "#fff" : "#94A3B8",
                      transition: "all 0.1s",
                    }}
                  >
                    {answers[i] === opt.value ? "✓ " : ""}{opt.label}
                  </button>
                ))}
              </div>
              {/* FIX 13: PHQ-9 item 9 crisis callout (suicidal ideation) */}
              {tab === "phq9" && i === 8 && answers[8] !== undefined && answers[8] !== null && (answers[8] as number) > 0 && (
                <div style={{ marginTop: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(127,29,29,0.3)", border: "1px solid #991B1B", fontSize: 12, color: "#FCA5A5" }}>
                  ⚠️ Item 9 score &gt; 0 — consider immediate safety assessment. Crisis resources: <strong>988 Suicide &amp; Crisis Lifeline</strong> (call or text 988).
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Score display */}
        {score !== null && result && (
          <div style={{
            marginTop: 20, padding: "14px 18px", borderRadius: 12,
            background: `${result.color}15`, border: `1.5px solid ${result.color}40`,
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {tab === "phq9" ? "PHQ-9" : "GAD-7"} Score
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: result.color, fontVariantNumeric: "tabular-nums" }}>
                {score} <span style={{ fontSize: 14, fontWeight: 500, color: "#64748B" }}>/ {maxScore}</span>
              </div>
              <div style={{ fontSize: 13, color: result.color, fontWeight: 600 }}>{result.level}</div>
            </div>
            <div style={{ fontSize: 13, color: "#94A3B8", maxWidth: 300, lineHeight: 1.5 }}>
              {result.note}
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      {!readOnly && !submitted && (
        <div style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={handleSubmit}
            disabled={!allDone}
            title={allDone ? "Submit questionnaire" : "Answer all questions to submit"}
            style={{
              padding: "10px 24px", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 14,
              background: allDone ? "var(--brand, #2563EB)" : "#1E293B",
              color: allDone ? "#fff" : "#475569", cursor: allDone ? "pointer" : "not-allowed",
            }}
          >
            Submit Assessment
          </button>
          {!allDone && (
            <span style={{ fontSize: 12, color: "#64748B" }}>
              Complete both PHQ-9 and GAD-7 to submit
            </span>
          )}
        </div>
      )}
      {submitted && (
        <div style={{ marginTop: 16, padding: "12px 18px", borderRadius: 10, background: "rgba(6,78,59,0.35)", border: "1px solid #065F46", fontSize: 13, color: "#34D399", fontWeight: 600 }}>
          ✓ Assessment saved — PHQ-9: {phq9Score} · GAD-7: {gad7Score}
        </div>
      )}
    </div>
  );
}
