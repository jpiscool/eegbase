"use client";

import { useState, useTransition } from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { generateClientProgressSummary } from "@/app/clients/[id]/progress-action";

interface Props {
  clientId: string;
  initialSummary: string | null;
  initialUpdatedAt: Date | null;
}

export function ClientProgressPanel({ clientId, initialSummary, initialUpdatedAt }: Props) {
  const [summary, setSummary] = useState<string | null>(initialSummary);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(initialUpdatedAt);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await generateClientProgressSummary(clientId);
        setSummary(result);
        setUpdatedAt(new Date());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to generate summary");
      }
    });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-violet-500" />
          <h2 className="text-sm font-semibold text-gray-900">AI Progress Summary</h2>
          <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full font-medium">Claude</span>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isPending}
          className="flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-800 disabled:opacity-50 transition-colors"
        >
          {isPending ? (
            <Loader2 size={13} className="animate-spin" />
          ) : summary ? (
            <RefreshCw size={13} />
          ) : (
            <Sparkles size={13} />
          )}
          {isPending ? "Generating…" : summary ? "Regenerate" : "Generate"}
        </button>
      </div>

      <div className="px-5 py-4">
        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
            {error}
          </div>
        )}

        {summary ? (
          <div>
            <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
            {updatedAt && (
              <p className="text-xs text-gray-400 mt-3">
                Generated {new Date(updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <Sparkles size={20} className="text-violet-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              Generate an AI-powered longitudinal summary across all sessions and check-ins.
            </p>
            <button
              onClick={handleGenerate}
              disabled={isPending}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {isPending ? "Generating…" : "Generate Summary"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
