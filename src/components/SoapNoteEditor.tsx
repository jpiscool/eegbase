"use client";
import { useState, useTransition } from "react";
import { saveSoapNote, draftSoapSection } from "@/app/sessions/[id]/soap/actions";
import { RefreshCw, Sparkles, Loader2 } from "lucide-react";

interface Props {
  sessionId: string;
  existing: { subjective: string; objective: string; assessment: string; plan: string } | null;
  autoObjective: string;
}

const SECTIONS = [
  {
    key: "subjective" as const,
    label: "S — Subjective",
    description: "Client's self-report: how they felt before/after, any complaints or observations.",
    placeholder: "e.g. Client reported feeling anxious before the session but calmer afterward. Mentioned difficulty sleeping this week.",
    rows: 4,
  },
  {
    key: "objective" as const,
    label: "O — Objective",
    description: "Measurable data: device metrics, reward scores, questionnaire deltas.",
    placeholder: "",
    rows: 4,
    autoFill: true,
  },
  {
    key: "assessment" as const,
    label: "A — Assessment",
    description: "Clinical interpretation: progress toward goals, protocol fit, notable patterns.",
    placeholder: "e.g. Client continues to show improvement in focus scores. Reward rate trending upward over last 4 sessions, suggesting good protocol fit.",
    rows: 4,
    aiDraft: true,
  },
  {
    key: "plan" as const,
    label: "P — Plan",
    description: "Next steps: protocol adjustments, homework, next session focus.",
    placeholder: "e.g. Continue current protocol. Increase session frequency to 3x/week. Introduce alpha-theta crossover in session 10.",
    rows: 3,
    aiDraft: true,
  },
];

export function SoapNoteEditor({ sessionId, existing, autoObjective }: Props) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [subjective, setSubjective] = useState(existing?.subjective ?? "");
  const [objective, setObjective] = useState(existing?.objective || autoObjective);
  const [assessment, setAssessment] = useState(existing?.assessment ?? "");
  const [plan, setPlan] = useState(existing?.plan ?? "");
  const [drafting, setDrafting] = useState<"assessment" | "plan" | null>(null);

  const values = { subjective, objective, assessment, plan };
  const setters = { subjective: setSubjective, objective: setObjective, assessment: setAssessment, plan: setPlan };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await saveSoapNote(sessionId, { subjective, objective, assessment, plan });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  async function handleAiDraft(section: "assessment" | "plan") {
    setDrafting(section);
    try {
      const draft = await draftSoapSection(sessionId, section, { subjective, objective });
      if (section === "assessment") setAssessment(draft);
      else setPlan(draft);
    } finally {
      setDrafting(null);
    }
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none";
  const inputStyle = { background: "var(--surface-sunken)", borderColor: "var(--border-default)", color: "var(--text-primary)" };
  const labelCls = "block text-xs font-semibold uppercase tracking-wider mb-0.5";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {SECTIONS.map((section) => (
        <div key={section.key}>
          <div className="flex items-start justify-between mb-1">
            <div>
              <label className={labelCls} style={{ color: "var(--text-tertiary)" }}>{section.label}</label>
              <p className="text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>{section.description}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-4">
              {section.autoFill && (
                <button
                  type="button"
                  onClick={() => setObjective(autoObjective)}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors"
                  style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)", background: "var(--surface-sunken)" }}
                  title="Reset to auto-generated metrics"
                >
                  <RefreshCw size={11} /> Reset
                </button>
              )}
              {section.aiDraft && (
                <button
                  type="button"
                  disabled={drafting === section.key}
                  onClick={() => handleAiDraft(section.key as "assessment" | "plan")}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded border transition-all"
                  style={{
                    borderColor: "var(--brand)",
                    color: "var(--brand)",
                    background: "var(--brand-subtle, color-mix(in srgb, var(--brand) 8%, transparent))",
                    opacity: drafting === section.key ? 0.6 : 1,
                  }}
                  title="Generate an AI-assisted draft from session data"
                >
                  {drafting === section.key
                    ? <><Loader2 size={11} className="animate-spin" /> Drafting…</>
                    : <><Sparkles size={11} /> Draft</>
                  }
                </button>
              )}
            </div>
          </div>
          <textarea
            value={values[section.key]}
            onChange={(e) => setters[section.key](e.target.value)}
            rows={section.rows}
            placeholder={section.autoFill ? autoObjective : section.placeholder}
            className={inputCls}
            style={inputStyle}
          />
        </div>
      ))}

      <div className="flex items-center gap-3 pt-1 border-t" style={{ borderColor: "var(--border-default)" }}>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
          style={{ background: "var(--brand)", color: "var(--text-inverse)", opacity: isPending ? 0.7 : 1 }}
        >
          {isPending ? "Saving…" : existing ? "Update Note" : "Save Note"}
        </button>
        {saved && <span className="text-sm" style={{ color: "var(--success)" }}>✓ Saved</span>}
        <span className="ml-auto text-xs" style={{ color: "var(--text-tertiary)" }}>
          AI drafts are suggestions — review before saving.
        </span>
      </div>
    </form>
  );
}
