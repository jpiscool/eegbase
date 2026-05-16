"use client";
import { useState, useTransition } from "react";
import { Mail, Check, AlertCircle } from "lucide-react";
import { emailSessionSummary } from "@/app/sessions/[id]/actions";

interface Props {
  sessionId: string;
  clientEmail: string | null;
}

type Status = "idle" | "sent" | "logged";

export function EmailSummaryBtn({ sessionId, clientEmail }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleClick() {
    setError("");
    startTransition(async () => {
      try {
        const result = await emailSessionSummary(sessionId);
        // Be honest: only show "Sent!" if Resend actually delivered.
        // log-fallback means the body went to stderr; the clinician still
        // needs to forward it manually.
        setStatus(result.delivered ? "sent" : "logged");
        setTimeout(() => setStatus("idle"), 5000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to send");
      }
    });
  }

  const label =
    status === "sent" ? "Sent!"
    : status === "logged" ? "Logged (no email provider)"
    : isPending ? "Sending…"
    : "Email Summary";

  const Icon =
    status === "sent" ? Check
    : status === "logged" ? AlertCircle
    : Mail;

  const iconColor =
    status === "sent" ? "var(--success)"
    : status === "logged" ? "#F59E0B"
    : undefined;

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={isPending || !clientEmail}
        title={
          status === "logged"
            ? "Email provider not configured — body was logged to server stderr. Set RESEND_API_KEY + RESEND_FROM to enable delivery."
            : clientEmail
              ? `Send summary to ${clientEmail}`
              : "Client has no email address"
        }
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        style={{ border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
      >
        <Icon size={15} style={iconColor ? { color: iconColor } : undefined} />
        {label}
      </button>
      {error && (
        <p className="absolute top-full mt-1 left-0 text-xs rounded px-2 py-1 whitespace-nowrap z-10" style={{ color: "var(--danger)", background: "var(--surface-overlay)", border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
