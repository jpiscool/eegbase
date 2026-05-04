"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { ERPTest } from "@/components/ERPTest";
import { saveErpResult } from "./actions";

interface Summary {
  totalTrials: number;
  targetCount: number;
  hits: number;
  misses: number;
  falseAlarms: number;
  avgReactionTimeMs: number | null;
  accuracy: number;
  durationSeconds: number;
}

export default function ErpPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [summary, setSummary] = useState<Summary | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!summary) return;
    setSaving(true);
    try {
      await saveErpResult({
        clientId,
        durationSeconds: summary.durationSeconds,
        totalTrials: summary.totalTrials,
        targetCount: summary.targetCount,
        hits: summary.hits,
        misses: summary.misses,
        falseAlarms: summary.falseAlarms,
        avgReactionTimeMs: summary.avgReactionTimeMs,
        accuracy: summary.accuracy,
      });
      setSaved(true);
      setTimeout(() => router.push(`/clients/${clientId}`), 1500);
    } finally {
      setSaving(false);
    }
  }

  function accuracyStyle(acc: number): React.CSSProperties {
    if (acc >= 80) return { color: "var(--success)" };
    if (acc >= 60) return { color: "var(--warning)" };
    return { color: "var(--danger)" };
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/clients/${clientId}`}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--text-tertiary)" }}
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>ERP / P300 Assessment</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Oddball paradigm · rare target detection</p>
        </div>
      </div>

      {!summary ? (
        <ERPTest onComplete={setSummary} />
      ) : (
        <div className="max-w-xl mx-auto">
          <div className="rounded-xl border overflow-hidden mb-6" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
            <div className="px-6 py-4 border-b" style={{ background: "var(--surface-sunken)", borderColor: "var(--border-subtle)" }}>
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Assessment Results</h2>
            </div>
            <div className="grid grid-cols-3 divide-x" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="px-6 py-5 text-center">
                <p className="text-3xl font-bold tabular-nums" style={accuracyStyle(summary.accuracy)}>
                  {summary.accuracy.toFixed(1)}%
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>Accuracy</p>
              </div>
              <div className="px-6 py-5 text-center">
                <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--brand)" }}>
                  {summary.avgReactionTimeMs != null ? summary.avgReactionTimeMs : "—"}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>Avg RT (ms)</p>
              </div>
              <div className="px-6 py-5 text-center">
                <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {Math.floor(summary.durationSeconds / 60)}:{String(summary.durationSeconds % 60).padStart(2, "0")}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>Duration</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-lg font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>{summary.targetCount}</p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Targets</p>
                </div>
                <div>
                  <p className="text-lg font-semibold tabular-nums" style={{ color: "var(--success)" }}>{summary.hits}</p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Hits</p>
                </div>
                <div>
                  <p className="text-lg font-semibold tabular-nums" style={{ color: "var(--warning)" }}>{summary.misses}</p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Misses</p>
                </div>
                <div>
                  <p className="text-lg font-semibold tabular-nums" style={{ color: "var(--danger)" }}>{summary.falseAlarms}</p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>False Alarms</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            {saved ? (
              <div className="flex items-center gap-2 font-medium" style={{ color: "var(--success)" }}>
                <CheckCircle size={18} />
                Saved! Redirecting…
              </div>
            ) : (
              <>
                <button
                  onClick={() => setSummary(null)}
                  className="px-6 py-2.5 text-sm font-medium rounded-lg transition-colors"
                  style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)", background: "var(--surface-raised)" }}
                >
                  Retake Test
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-8 py-2.5 text-white text-sm font-semibold rounded-lg transition-colors"
                  style={{ background: "var(--brand)", opacity: saving ? 0.6 : 1 }}
                >
                  {saving ? "Saving…" : "Save Results"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
