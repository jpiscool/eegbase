"use client";

import { useState, useTransition } from "react";
import { generateSessionInsight } from "@/app/sessions/insight-action";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";

export function AiInsightPanel({
  sessionId,
  initialSummary,
}: {
  sessionId: string;
  initialSummary: string | null;
}) {
  const [summary, setSummary] = useState<string | null>(initialSummary);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await generateSessionInsight(sessionId);
        setSummary(result);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        if (msg.includes("ANTHROPIC_API_KEY")) {
          setError("ANTHROPIC_API_KEY is not configured. Add it to .env.local to enable AI insights.");
        } else {
          setError(msg);
        }
      }
    });
  }

  return (
    <div className="rounded-xl p-6 mb-5" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-violet-500" />
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>AI Clinical Insight</h2>
          <span className="px-2 py-0.5 text-[10px] font-semibold bg-violet-50 text-violet-600 rounded-full border border-violet-100 uppercase tracking-wide">
            Claude
          </span>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? (
            <Loader2 size={12} className="animate-spin" />
          ) : summary ? (
            <RefreshCw size={12} />
          ) : (
            <Sparkles size={12} />
          )}
          {isPending ? "Generating…" : summary ? "Regenerate" : "Generate Insight"}
        </button>
      </div>

      {error && (
        <p className="text-sm rounded-lg px-4 py-3" style={{ color: "var(--danger)", background: "var(--danger-subtle)", border: "1px solid color-mix(in srgb, var(--danger) 20%, transparent)" }}>
          {error}
        </p>
      )}

      {!error && !summary && !isPending && (
        <p className="text-sm italic" style={{ color: "var(--text-tertiary)" }}>
          Click &ldquo;Generate Insight&rdquo; to create an AI-powered clinical summary of this session based on the neurophysiological data and questionnaire responses.
        </p>
      )}

      {isPending && (
        <div className="flex items-center gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
          <Loader2 size={14} className="animate-spin text-violet-500" />
          Analyzing session data with Claude…
        </div>
      )}

      {summary && !isPending && (
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{summary}</p>
      )}
    </div>
  );
}
