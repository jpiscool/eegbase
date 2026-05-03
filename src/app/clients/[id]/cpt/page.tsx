"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { CPTTest } from "@/components/CPTTest";
import { saveCptResult } from "./actions";

interface Summary {
  totalStimuli: number;
  targetCount: number;
  hits: number;
  misses: number;
  falseAlarms: number;
  avgReactionTimeMs: number | null;
  accuracy: number;
}

export default function CptPage() {
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
      await saveCptResult({
        clientId,
        durationSeconds: 180,
        totalStimuli: summary.totalStimuli,
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

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/clients/${clientId}`}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">CPT Assessment</h1>
          <p className="text-sm text-gray-500">Continuous Performance Test · 3 minutes</p>
        </div>
      </div>

      {!summary ? (
        <CPTTest clientId={clientId} onComplete={setSummary} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <CheckCircle size={20} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Test Complete</h2>
              <p className="text-sm text-gray-500">Results ready to save</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: "Accuracy", value: `${summary.accuracy.toFixed(1)}%`, color: summary.accuracy >= 80 ? "text-emerald-600" : summary.accuracy >= 60 ? "text-amber-600" : "text-red-600" },
              { label: "Avg. Response Time", value: summary.avgReactionTimeMs != null ? `${summary.avgReactionTimeMs} ms` : "—", color: "text-blue-600" },
              { label: "Hits", value: String(summary.hits), color: "text-emerald-600" },
              { label: "Misses", value: String(summary.misses), color: "text-amber-600" },
              { label: "False Alarms", value: String(summary.falseAlarms), color: "text-red-600" },
              { label: "Total Stimuli", value: String(summary.totalStimuli), color: "text-gray-700" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-6 text-sm text-blue-700">
            <strong>Interpretation:</strong>{" "}
            {summary.accuracy >= 80 && summary.falseAlarms <= 3
              ? "Strong sustained attention. Accurate target detection with minimal impulsive responding."
              : summary.accuracy >= 60
              ? "Moderate performance. Some omission errors suggest attention lapses; review in context of session data."
              : "Below-average accuracy. Consider rescoring after client rest, or flag for clinical review."}
          </div>

          {saved ? (
            <div className="flex items-center gap-2 text-emerald-700 font-medium text-sm">
              <CheckCircle size={16} /> Saved — redirecting to client profile…
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 px-5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Results"}
              </button>
              <Link
                href={`/clients/${clientId}`}
                className="py-2.5 px-5 text-gray-500 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
              >
                Discard
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
