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
        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
      >
        Deactivate client
      </button>
    );
  }

  if (confirmed && active) {
    return (
      <span className="flex items-center gap-2 text-xs">
        <span className="text-gray-500">Deactivate this client?</span>
        <button
          onClick={() =>
            startTransition(() => setClientActive(clientId, false))
          }
          disabled={pending}
          className="text-red-600 font-medium hover:underline disabled:opacity-50"
        >
          {pending ? "…" : "Yes, deactivate"}
        </button>
        <button
          onClick={() => setConfirmed(false)}
          className="text-gray-400 hover:text-gray-600"
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
      className="text-xs text-emerald-600 font-medium hover:underline disabled:opacity-50"
    >
      {pending ? "…" : "Reactivate client"}
    </button>
  );
}
