"use client";
import { useState, useRef } from "react";
import { UserPlus, X } from "lucide-react";
import { addClient } from "@/app/clients/actions";

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--border-default)",
  background: "var(--surface-sunken)",
  color: "var(--text-primary)",
};

export function AddClientModal() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      await addClient(formData);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
        style={{ background: "var(--brand)", color: "#fff" }}
      >
        <UserPlus size={16} />
        Add Client
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            className="rounded-xl shadow-2xl w-full max-w-md"
            style={{ background: "var(--surface-overlay)", border: "1px solid var(--border-subtle)" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                New Client
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: "var(--text-tertiary)" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form ref={formRef} action={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Full Name <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  autoFocus
                  placeholder="Jane Smith"
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Email <span className="font-normal" style={{ color: "var(--text-tertiary)" }}>(optional)</span>
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="jane@example.com"
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Date of Birth <span className="font-normal" style={{ color: "var(--text-tertiary)" }}>(optional)</span>
                </label>
                <input
                  name="dateOfBirth"
                  type="date"
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Goals <span className="font-normal" style={{ color: "var(--text-tertiary)" }}>(optional)</span>
                </label>
                <input
                  name="goals"
                  type="text"
                  placeholder="e.g. Reduce anxiety, improve sustained attention"
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Referral Source <span className="font-normal" style={{ color: "var(--text-tertiary)" }}>(optional)</span>
                </label>
                <select
                  name="referralSource"
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={inputStyle}
                >
                  <option value="">— Select —</option>
                  {["Physician / GP", "Psychiatrist", "Psychologist", "School / Teacher", "Self-referred", "Friend / Family", "Online search", "Social media", "Other"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Clinical Notes <span className="font-normal" style={{ color: "var(--text-tertiary)" }}>(optional)</span>
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Assessment notes, diagnosis…"
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  style={inputStyle}
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm font-medium transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="px-5 py-2 text-sm font-semibold rounded-lg transition-colors"
                  style={{ background: "var(--brand)", color: "#fff", opacity: pending ? 0.6 : 1 }}
                >
                  {pending ? "Saving…" : "Add Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
