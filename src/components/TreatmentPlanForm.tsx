"use client";
import { useState, useTransition } from "react";
import { saveTreatmentPlan } from "@/app/clients/[id]/treatment-plan/actions";

interface Props {
  clientId: string;
  protocols: { id: string; name: string }[];
  outcomeMeasureOptions: { value: string; label: string }[];
  existing?: {
    presentingConcerns: string;
    protocolId: string;
    targetSessionCount?: number;
    sessionFrequency: string;
    outcomeMeasures: string[];
    decisionRules: string;
    goals: string;
    reviewDate: string;
  };
}

export function TreatmentPlanForm({ clientId, protocols, outcomeMeasureOptions, existing }: Props) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [presentingConcerns, setPresentingConcerns] = useState(existing?.presentingConcerns ?? "");
  const [protocolId, setProtocolId] = useState(existing?.protocolId ?? "");
  const [targetSessionCount, setTargetSessionCount] = useState<string>(String(existing?.targetSessionCount ?? ""));
  const [sessionFrequency, setSessionFrequency] = useState(existing?.sessionFrequency ?? "");
  const [outcomeMeasures, setOutcomeMeasures] = useState<string[]>(existing?.outcomeMeasures ?? []);
  const [decisionRules, setDecisionRules] = useState(existing?.decisionRules ?? "");
  const [goals, setGoals] = useState(existing?.goals ?? "");
  const [reviewDate, setReviewDate] = useState(existing?.reviewDate ?? "");

  function toggleMeasure(val: string) {
    setOutcomeMeasures((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await saveTreatmentPlan(clientId, {
        presentingConcerns,
        protocolId: protocolId || undefined,
        targetSessionCount: targetSessionCount ? Number(targetSessionCount) : undefined,
        sessionFrequency,
        outcomeMeasures,
        decisionRules,
        goals,
        reviewDate: reviewDate || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const inputStyle = { background: "var(--surface-sunken)", borderColor: "var(--border-default)", color: "var(--text-primary)" };
  const labelCls = "block text-xs font-semibold uppercase tracking-wider mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label className={labelCls} style={{ color: "var(--text-tertiary)" }}>Presenting Concerns</label>
        <textarea value={presentingConcerns} onChange={(e) => setPresentingConcerns(e.target.value)}
          rows={3} placeholder="Describe the client's primary presenting concerns and relevant history…"
          className={inputCls} style={inputStyle} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls} style={{ color: "var(--text-tertiary)" }}>Target Protocol</label>
          <select value={protocolId} onChange={(e) => setProtocolId(e.target.value)}
            className={inputCls} style={inputStyle}>
            <option value="">— Select protocol —</option>
            {protocols.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls} style={{ color: "var(--text-tertiary)" }}>Target Session Count</label>
          <input type="number" min={1} max={200} value={targetSessionCount}
            onChange={(e) => setTargetSessionCount(e.target.value)}
            placeholder="e.g. 40" className={inputCls} style={inputStyle} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls} style={{ color: "var(--text-tertiary)" }}>Session Frequency</label>
          <select value={sessionFrequency} onChange={(e) => setSessionFrequency(e.target.value)}
            className={inputCls} style={inputStyle}>
            <option value="">— Select —</option>
            {["3x/week", "2x/week", "1x/week", "2x/month", "1x/month"].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} style={{ color: "var(--text-tertiary)" }}>Review Date</label>
          <input type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)}
            className={inputCls} style={inputStyle} />
        </div>
      </div>

      <div>
        <label className={labelCls} style={{ color: "var(--text-tertiary)" }}>Outcome Measures to Track</label>
        <div className="flex flex-wrap gap-2">
          {outcomeMeasureOptions.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => toggleMeasure(o.value)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
              style={outcomeMeasures.includes(o.value)
                ? { background: "var(--brand)", color: "var(--text-inverse)", borderColor: "var(--brand)" }
                : { background: "var(--surface-sunken)", color: "var(--text-secondary)", borderColor: "var(--border-default)" }
              }
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls} style={{ color: "var(--text-tertiary)" }}>Decision Rules</label>
        <textarea value={decisionRules} onChange={(e) => setDecisionRules(e.target.value)}
          rows={2} placeholder="e.g. If reward rate drops below 40% for 2 consecutive sessions, reduce threshold by 5%."
          className={inputCls} style={inputStyle} />
      </div>

      <div>
        <label className={labelCls} style={{ color: "var(--text-tertiary)" }}>Treatment Goals</label>
        <textarea value={goals} onChange={(e) => setGoals(e.target.value)}
          rows={2} placeholder="Specific, measurable treatment goals for this client…"
          className={inputCls} style={inputStyle} />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button type="submit" disabled={isPending}
          className="px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
          style={{ background: "var(--brand)", color: "var(--text-inverse)", opacity: isPending ? 0.7 : 1 }}>
          {isPending ? "Saving…" : existing ? "Update Plan" : "Create Plan"}
        </button>
        {saved && <span className="text-sm" style={{ color: "var(--success)" }}>✓ Saved</span>}
      </div>
    </form>
  );
}
