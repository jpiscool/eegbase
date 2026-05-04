"use client";
import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { assignProtocol } from "@/app/clients/actions";

interface ClientOption { id: string; name: string }

interface Props {
  protocolId: string;
  clients: ClientOption[];
  assignedClientIds: Set<string>;
}

export function AssignClientToProtocolModal({ protocolId, clients, assignedClientIds }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const available = clients.filter((c) => !assignedClientIds.has(c.id));

  function handleAssign() {
    if (!selected) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("clientId", selected);
      fd.append("protocolId", protocolId);
      await assignProtocol(fd);
      setDone(true);
      setTimeout(() => {
        setOpen(false);
        setDone(false);
        setSelected("");
      }, 800);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors"
        style={{ color: "var(--brand)", background: "color-mix(in srgb, var(--brand) 8%, transparent)" }}
      >
        <Plus size={12} />
        Assign client
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
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Assign Protocol to Client</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: "var(--text-tertiary)" }}
              >
                <X size={18} />
              </button>
            </div>

            {available.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: "var(--text-secondary)" }}>
                All active clients are already assigned to this protocol.
              </p>
            ) : (
              <>
                <div className="space-y-2 mb-5 max-h-64 overflow-y-auto">
                  {available.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                      style={selected === c.id
                        ? { borderColor: "var(--brand)", background: "color-mix(in srgb, var(--brand) 8%, transparent)" }
                        : { borderColor: "var(--border-subtle)", background: "transparent" }}
                    >
                      <input
                        type="radio"
                        name="client"
                        value={c.id}
                        checked={selected === c.id}
                        onChange={() => setSelected(c.id)}
                        className="accent-blue-600"
                      />
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{c.name}</span>
                    </label>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAssign}
                    disabled={!selected || isPending}
                    className="flex-1 py-2 text-sm font-semibold rounded-lg transition-colors"
                    style={{ background: "var(--brand)", color: "#fff", opacity: !selected || isPending ? 0.5 : 1 }}
                  >
                    {isPending ? "Assigning…" : done ? "Assigned ✓" : "Assign"}
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 text-sm rounded-lg transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
