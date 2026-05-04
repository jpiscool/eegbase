"use client";
import { useState } from "react";
import { deleteProtocol } from "@/app/protocols/actions";
import { Trash2 } from "lucide-react";

export function DeleteProtocolButton({ id, name }: { id: string; name: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Delete &ldquo;{name}&rdquo;?</span>
        <button
          onClick={async () => {
            setPending(true);
            await deleteProtocol(id);
          }}
          disabled={pending}
          className="text-xs font-semibold transition-colors disabled:opacity-50"
          style={{ color: "var(--danger)" }}
        >
          {pending ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs transition-colors"
          style={{ color: "var(--text-tertiary)" }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="shrink-0 p-1.5 transition-colors rounded-lg"
      style={{ color: "var(--text-tertiary)" }}
      title="Delete protocol"
    >
      <Trash2 size={15} />
    </button>
  );
}
