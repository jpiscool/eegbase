"use client";
import { useState, useTransition } from "react";
import { updateMemberRole } from "@/app/settings/team/actions";

export function RoleChangeBtn({ memberId, currentRole }: { memberId: string; currentRole: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const newRole = currentRole === "admin" ? "clinician" : "admin";

  function handleChange() {
    startTransition(async () => {
      await updateMemberRole(memberId, newRole as "clinician" | "admin");
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-2 py-1 rounded transition-colors"
        style={{ border: "1px solid var(--border-subtle)", color: "var(--text-tertiary)" }}
      >
        Change role
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
        Make {newRole}?
      </span>
      <button
        onClick={handleChange}
        disabled={isPending}
        className="text-xs px-2 py-1 rounded transition-colors disabled:opacity-50"
        style={{ background: "var(--brand)", color: "#fff" }}
      >
        {isPending ? "…" : "Confirm"}
      </button>
      <button
        onClick={() => setOpen(false)}
        className="text-xs px-2 py-1 rounded transition-colors"
        style={{ border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
      >
        Cancel
      </button>
    </div>
  );
}
