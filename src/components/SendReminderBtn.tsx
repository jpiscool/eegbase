"use client";
import { useState, useTransition } from "react";
import { Bell, Check } from "lucide-react";
import { sendAppointmentReminder } from "@/app/schedule/actions";

export function SendReminderBtn({ appointmentId, clientEmail }: { appointmentId: string; clientEmail: string | null }) {
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!clientEmail) return null;

  function handleSend() {
    startTransition(async () => {
      await sendAppointmentReminder(appointmentId);
      setSent(true);
    });
  }

  return (
    <button
      onClick={handleSend}
      disabled={isPending || sent}
      title={sent ? "Reminder sent" : `Send reminder to ${clientEmail}`}
      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-colors"
      style={sent
        ? { background: "var(--success-subtle)", color: "var(--success)" }
        : { background: "var(--surface-sunken)", color: "var(--text-secondary)" }}
    >
      {sent ? <><Check size={11} /> Sent</> : <><Bell size={11} /> Remind</>}
    </button>
  );
}
