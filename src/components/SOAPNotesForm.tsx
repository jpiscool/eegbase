"use client";
import { useState, useTransition } from "react";
import { Check, Save } from "lucide-react";
import { saveSoapNote } from "@/app/sessions/[id]/soap/actions";

interface Props {
  sessionId: string;
  initial: {
    subjective: string | null;
    objective: string | null;
    assessment: string | null;
    plan: string | null;
  } | null;
}

const fields: { key: "subjective" | "objective" | "assessment" | "plan"; label: string; hint: string }[] = [
  { key: "subjective", label: "S — Subjective", hint: "Client's self-report: how they felt before, during, and after. Sleep, mood, symptoms since last session." },
  { key: "objective", label: "O — Objective", hint: "Clinician's measurable observations: EEG band powers, fNIRS OxyHb, reward score, protocol used, artefacts." },
  { key: "assessment", label: "A — Assessment", hint: "Clinical interpretation: progress toward goals, response to protocol, patterns observed." },
  { key: "plan", label: "P — Plan", hint: "Next session plan: protocol adjustments, electrode placement changes, homework, referrals." },
];

export function SOAPNotesForm({ sessionId, initial }: Props) {
  const [values, setValues] = useState({
    subjective: initial?.subjective ?? "",
    objective: initial?.objective ?? "",
    assessment: initial?.assessment ?? "",
    plan: initial?.plan ?? "",
  });
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await saveSoapNote(sessionId, values);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="space-y-5">
      {fields.map(({ key, label, hint }) => (
        <div key={key}>
          <label className="block text-sm font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>{label}</label>
          <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>{hint}</p>
          <textarea
            value={values[key]}
            onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
            rows={4}
            placeholder={`Enter ${label.split("—")[1].trim().toLowerCase()}…`}
            className="w-full rounded-xl px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
            style={{ border: "1px solid var(--border-default)", background: "var(--surface-sunken)", color: "var(--text-primary)" }}
          />
        </div>
      ))}

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>SOAP notes are private to your clinic and not shared with clients.</p>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
          style={{ background: "var(--brand)", color: "#fff" }}
        >
          {saved ? <><Check size={14} /> Saved</> : <><Save size={14} /> Save SOAP Notes</>}
        </button>
      </div>
    </div>
  );
}
