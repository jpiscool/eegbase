"use client";

import { useState, useTransition } from "react";
import { Pencil, X } from "lucide-react";
import { updateClient } from "@/app/clients/actions";

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--border-default)",
  background: "var(--surface-sunken)",
  color: "var(--text-primary)",
};

type Client = {
  id: string;
  name: string;
  email: string | null;
  notes: string | null;
  goals: string | null;
  dateOfBirth: Date | null;
  referralSource: string | null;
};

export function EditClientModal({ client }: { client: Client }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateClient(fd);
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update client");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors"
        style={{ color: "var(--text-secondary)", border: "1px solid var(--border-subtle)", background: "var(--surface-raised)" }}
      >
        <Pencil size={12} />
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className="rounded-2xl shadow-xl w-full max-w-md"
            style={{ background: "var(--surface-overlay)", border: "1px solid var(--border-subtle)" }}
          >
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Edit Client</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: "var(--text-tertiary)" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <input type="hidden" name="id" value={client.id} />

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Name <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  name="name"
                  defaultValue={client.name}
                  required
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Email</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={client.email ?? ""}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Date of Birth</label>
                <input
                  name="dateOfBirth"
                  type="date"
                  defaultValue={
                    client.dateOfBirth
                      ? new Date(client.dateOfBirth).toISOString().split("T")[0]
                      : ""
                  }
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Goals</label>
                <input
                  name="goals"
                  defaultValue={client.goals ?? ""}
                  placeholder="e.g. Reduce anxiety, improve focus"
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Referral Source</label>
                <select
                  name="referralSource"
                  defaultValue={client.referralSource ?? ""}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={inputStyle}
                >
                  <option value="">— Select —</option>
                  {["Physician / GP", "Psychiatrist", "Psychologist", "School / Teacher", "Self-referred", "Friend / Family", "Online search", "Social media", "Other"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Clinical Notes</label>
                <textarea
                  name="notes"
                  defaultValue={client.notes ?? ""}
                  rows={3}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  style={inputStyle}
                />
              </div>

              {error && (
                <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm rounded-lg transition-colors"
                  style={{ color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                  style={{ background: "var(--brand)", color: "#fff", opacity: pending ? 0.5 : 1 }}
                >
                  {pending ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
