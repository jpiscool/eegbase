"use client";
import { useState, useTransition } from "react";
import { Pencil, X } from "lucide-react";
import { updateProtocol } from "@/app/protocols/actions";

const DEVICES = [
  { value: "mendi", label: "Mendi (fNIRS)" },
  { value: "muse", label: "Muse (EEG)" },
  { value: "simulator", label: "Simulator" },
];

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--border-default)",
  background: "var(--surface-sunken)",
  color: "var(--text-primary)",
};

interface Props {
  protocol: {
    id: string;
    name: string;
    description: string | null;
    deviceType: string;
    durationSeconds: number | null;
  };
}

export function EditProtocolModal({ protocol }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateProtocol(protocol.id, formData);
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  const defaultMinutes = Math.round((protocol.durationSeconds ?? 1200) / 60);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-lg transition-colors"
        style={{ color: "var(--text-tertiary)" }}
        title="Edit protocol"
      >
        <Pencil size={14} />
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            className="rounded-xl shadow-2xl w-full max-w-md p-6"
            style={{ background: "var(--surface-overlay)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Edit Protocol</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: "var(--text-tertiary)" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-tertiary)" }}>
                  Protocol Name *
                </label>
                <input
                  name="name"
                  required
                  defaultValue={protocol.name}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-tertiary)" }}>
                  Device
                </label>
                <select
                  name="deviceType"
                  defaultValue={protocol.deviceType}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={inputStyle}
                >
                  {DEVICES.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-tertiary)" }}>
                  Duration (minutes)
                </label>
                <input
                  name="durationMinutes"
                  type="number"
                  min={1}
                  max={120}
                  defaultValue={defaultMinutes}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-tertiary)" }}>
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={protocol.description ?? ""}
                  placeholder="Optional clinical description…"
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  style={inputStyle}
                />
              </div>

              {error && (
                <p
                  className="text-sm rounded-lg px-3 py-2"
                  style={{ color: "var(--danger)", background: "var(--danger-subtle)", border: "1px solid color-mix(in srgb, var(--danger) 20%, transparent)" }}
                >
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-sm font-semibold rounded-lg transition-colors"
                  style={{ background: "var(--brand)", color: "#fff", opacity: isPending ? 0.5 : 1 }}
                >
                  {isPending ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
