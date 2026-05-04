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
      <span
        className="text-xs font-medium px-3 py-1.5 rounded-lg"
        style={{ background: "var(--success-subtle)", color: "var(--success)", border: "1px solid color-mix(in srgb, var(--success) 25%, transparent)" }}
      >
        ✓ {count} reminder{count !== 1 ? "s" : ""} sent
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === "sending"}
      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      style={{ background: "var(--warning-subtle)", color: "var(--warning)", border: "1px solid color-mix(in srgb, var(--warning) 25%, transparent)" }}
    >
      {state === "sending" ? "Sending…" : "Remind All"}
    </button>
  );
}
