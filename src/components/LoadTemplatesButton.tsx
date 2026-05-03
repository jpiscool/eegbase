"use client";
import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { seedProtocolTemplates } from "@/app/protocols/actions";

export function LoadTemplatesButton() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await seedProtocolTemplates();
        setDone(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load templates");
      }
    });
  }

  if (done) {
    return (
      <p className="text-sm text-emerald-600 font-medium">
        ✓ Starter protocols loaded — refresh to see them.
      </p>
    );
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={pending}
        className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-50 disabled:opacity-60 transition-colors"
      >
        <Sparkles size={15} />
        {pending ? "Loading…" : "Load Starter Templates"}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
