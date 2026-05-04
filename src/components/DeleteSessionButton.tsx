"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteSession } from "@/app/sessions/actions";

export function DeleteSessionButton({
  sessionId,
  clientId,
}: {
  sessionId: string;
  clientId: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      await deleteSession(sessionId);
      router.push(`/clients/${clientId}`);
    });
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
        style={{ color: "var(--danger)", border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)" }}
      >
        <Trash2 size={13} />
        Delete Session
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium" style={{ color: "var(--danger)" }}>Delete this session permanently?</span>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
        style={{ background: "var(--danger)", color: "#fff" }}
      >
        {isPending ? "Deleting…" : "Yes, delete"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
        style={{ color: "var(--text-secondary)" }}
      >
        Cancel
      </button>
    </div>
  );
}
