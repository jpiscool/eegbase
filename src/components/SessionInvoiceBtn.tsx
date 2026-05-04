"use client";
import { useState, useTransition } from "react";
import { Receipt, X, CheckCircle } from "lucide-react";
import { createInvoice } from "@/app/billing/actions";
import { useRouter } from "next/navigation";

interface Props {
  sessionId: string;
  clientId: string;
  clientName: string;
  durationSeconds: number | null;
  sessionDate: Date;
}

// Estimate rate from duration: $3/min default
function estimateAmount(durationSeconds: number | null): string {
  if (!durationSeconds) return "150.00";
  const mins = Math.floor(durationSeconds / 60);
  const amount = Math.max(100, mins * 3);
  return amount.toFixed(2);
}

export function SessionInvoiceBtn({ sessionId, clientId, clientName, durationSeconds, sessionDate }: Props) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("Neurofeedback Session");
  const [amount, setAmount] = useState(() => estimateAmount(durationSeconds));
  const [currency, setCurrency] = useState("USD");
  const [cptCode, setCptCode] = useState("90837");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(sessionDate);
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amountCents = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) { setError("Enter a valid amount."); return; }
    setError("");
    startTransition(async () => {
      try {
        await createInvoice({
          clientId,
          sessionId,
          description,
          amountCents,
          currency,
          cptCode: cptCode || undefined,
          dueDate: dueDate || undefined,
          notes: notes || undefined,
        });
        setSuccess(true);
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
          router.push("/billing");
        }, 1200);
      } catch {
        setError("Failed to create invoice.");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors"
        style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
      >
        <Receipt size={13} />
        Generate Invoice
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden animate-slide-up"
            style={{ background: "var(--surface-overlay)", boxShadow: "var(--shadow-lg)" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
              <div>
                <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Generate Invoice</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                  For {clientName} · {new Date(sessionDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <button onClick={() => setOpen(false)} style={{ color: "var(--text-tertiary)" }}>
                <X size={18} />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center gap-3 py-12 px-6">
                <CheckCircle size={40} style={{ color: "var(--success)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Invoice Created!</p>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Redirecting to Billing…</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-tertiary)" }}>Description</label>
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2"
                    style={{ background: "var(--surface-sunken)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-tertiary)" }}>Amount</label>
                    <div className="relative">
                      <span
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                        style={{ color: "var(--text-tertiary)" }}
                      >$</span>
                      <input
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        type="number" step="0.01" min="0"
                        className="w-full pl-7 pr-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2"
                        style={{ background: "var(--surface-sunken)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                      />
                    </div>
                    {durationSeconds && (
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                        ~{Math.floor(durationSeconds / 60)} min session
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-tertiary)" }}>Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                      style={{ background: "var(--surface-sunken)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="CAD">CAD</option>
                      <option value="AUD">AUD</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-tertiary)" }}>CPT Code</label>
                    <input
                      value={cptCode}
                      onChange={(e) => setCptCode(e.target.value)}
                      placeholder="90837"
                      className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                      style={{ background: "var(--surface-sunken)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-tertiary)" }}>Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none"
                      style={{ background: "var(--surface-sunken)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-tertiary)" }}>Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none resize-none"
                    style={{ background: "var(--surface-sunken)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                  />
                </div>

                {error && <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 py-2 rounded-lg text-sm border transition-colors"
                    style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
                    style={{ background: "var(--brand)", color: "white" }}
                  >
                    {pending ? "Creating…" : "Create Invoice"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
