"use client";

import { useState, useTransition } from "react";
import { setClientActive } from "@/app/clients/actions";

export function ToggleClientActiveButton({
  clientId,
  active,
}: {
  clientId: string;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState(false);

  if (!confirmed && active) {
    return (
      <button
        onClick={() => setConfirmed(true)}
        className="text-xs transition-colors"
        style={{ color: "var(--text-tertiary)" }}
      >
        Deactivate client
      </button>
    );
  }

  if (confirmed && active) {
    return (
      <span className="flex items-center gap-2 text-xs">
        <span style={{ color: "var(--text-secondary)" }}>Deactivate this client?</span>
        <button
          onClick={() =>
            startTransition(() => setClientActive(clientId, false))
          }
          disabled={pending}
          className="font-medium hover:underline disabled:opacity-50"
          style={{ color: "var(--danger)" }}
        >
          {pending ? "…" : "Yes, deactivate"}
        </button>
        <button
          onClick={() => setConfirmed(false)}
          className="transition-colors"
          style={{ color: "var(--text-tertiary)" }}
        >
          Cancel
        </button>
      </span>
    );
  }

  // Inactive state
  return (
    <button
      onClick={() =>
        startTransition(() => setClientActive(clientId, true))
      }
      disabled={pending}
      className="text-xs font-medium hover:underline disabled:opacity-50"
      style={{ color: "var(--success)" }}
    >
      {pending ? "…" : "Reactivate client"}
    </button>
  );
}
