"use client";
import { useState } from "react";
import { assignProtocol } from "@/app/clients/actions";

interface Protocol { id: string; name: string; deviceType: string }

interface Props {
  clientId: string;
  protocols: Protocol[];
  currentProtocolId: string | null;
}

export function AssignProtocolModal({ clientId, protocols, currentProtocolId }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(currentProtocolId ?? "");
  const [pending, setPending] = useState(false);

  async function handleSave() {
    if (!selected) return;
    setPending(true);
    const fd = new FormData();
    fd.append("clientId", clientId);
    fd.append("protocolId", selected);
    try { await assignProtocol(fd); }
    finally { setPending(false); setOpen(false); }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-1.5 text-xs hover:underline"
        style={{ color: "var(--brand)" }}
      >
        {currentProtocolId ? "Change protocol" : "Assign protocol"}
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            className="rounded-xl shadow-2xl w-full max-w-sm p-6"
            style={{ background: "var(--surface-overlay)", border: "1px solid var(--border-subtle)" }}
          >
            <h2 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Assign Protocol</h2>
            {protocols.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No protocols found. Create one first.</p>
            ) : (
              <div className="space-y-2 mb-5">
                {protocols.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                    style={selected === p.id
                      ? { borderColor: "var(--brand)", background: "color-mix(in srgb, var(--brand) 8%, transparent)" }
                      : { borderColor: "var(--border-subtle)", background: "transparent" }}
                  >
                    <input
                      type="radio"
                      name="protocol"
                      value={p.id}
                      checked={selected === p.id}
                      onChange={() => setSelected(p.id)}
                      className="accent-blue-600"
                    />
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                      <p className="text-xs capitalize" style={{ color: "var(--text-tertiary)" }}>{p.deviceType}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!selected || pending}
                className="px-5 py-2 text-sm font-semibold rounded-lg transition-colors"
                style={{ background: "var(--brand)", color: "#fff", opacity: !selected || pending ? 0.5 : 1 }}
              >
                {pending ? "Saving…" : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
