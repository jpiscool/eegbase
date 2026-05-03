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
        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
      >
        <Plus size={12} />
        Assign client
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Assign Protocol to Client</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {available.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                All active clients are already assigned to this protocol.
              </p>
            ) : (
              <>
                <div className="space-y-2 mb-5 max-h-64 overflow-y-auto">
                  {available.map((c) => (
                    <label
                      key={c.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selected === c.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="client"
                        value={c.id}
                        checked={selected === c.id}
                        onChange={() => setSelected(c.id)}
                        className="text-blue-600"
                      />
                      <span className="text-sm font-medium text-gray-900">{c.name}</span>
                    </label>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAssign}
                    disabled={!selected || isPending}
                    className="flex-1 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isPending ? "Assigning…" : done ? "Assigned ✓" : "Assign"}
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
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
