"use client";
import { useState } from "react";
import { sendBulkReminders } from "@/app/clients/actions";

export function RemindAllButton() {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [count, setCount] = useState(0);

  async function handleClick() {
    setState("sending");
    try {
      const result = await sendBulkReminders();
      setCount(result.count);
      setState("done");
      setTimeout(() => setState("idle"), 4000);
    } catch {
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <span className="text-xs text-emerald-700 font-medium px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
        ✓ {count} reminder{count !== 1 ? "s" : ""} sent
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === "sending"}
      className="text-xs text-amber-700 hover:bg-amber-100 font-medium px-3 py-1.5 rounded-lg border border-amber-200 transition-colors disabled:opacity-50"
    >
      {state === "sending" ? "Sending…" : "Remind All"}
    </button>
  );
}
