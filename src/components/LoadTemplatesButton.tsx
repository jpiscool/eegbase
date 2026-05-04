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
      <p className="text-sm font-medium" style={{ color: "var(--success)" }}>
        ✓ Starter protocols loaded — refresh to see them.
      </p>
    );
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={pending}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-60 transition-colors"
        style={{ border: "1px solid color-mix(in srgb, var(--brand) 30%, transparent)", color: "var(--brand)" }}
      >
        <Sparkles size={15} />
        {pending ? "Loading…" : "Load Starter Templates"}
      </button>
      {error && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{error}</p>}
    </div>
  );
}
