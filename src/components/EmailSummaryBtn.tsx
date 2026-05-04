"use client";
import { useState, useTransition } from "react";
import { Mail, Check } from "lucide-react";
import { emailSessionSummary } from "@/app/sessions/[id]/actions";

interface Props {
  sessionId: string;
  clientEmail: string | null;
}

export function EmailSummaryBtn({ sessionId, clientEmail }: Props) {
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleClick() {
    setError("");
    startTransition(async () => {
      try {
        await emailSessionSummary(sessionId);
        setSent(true);
        setTimeout(() => setSent(false), 4000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to send");
      }
    });
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={isPending || !clientEmail}
        title={clientEmail ? `Send summary to ${clientEmail}` : "Client has no email address"}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        style={{ border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
      >
        {sent ? <Check size={15} style={{ color: "var(--success)" }} /> : <Mail size={15} />}
        {sent ? "Sent!" : isPending ? "Sending…" : "Email Summary"}
      </button>
      {error && (
        <p className="absolute top-full mt-1 left-0 text-xs rounded px-2 py-1 whitespace-nowrap z-10" style={{ color: "var(--danger)", background: "var(--surface-overlay)", border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
