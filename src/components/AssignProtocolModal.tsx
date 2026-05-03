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
        className="mt-1.5 text-xs text-blue-600 hover:underline"
      >
        {currentProtocolId ? "Change protocol" : "Assign protocol"}
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Assign Protocol</h2>
            {protocols.length === 0 ? (
              <p className="text-sm text-gray-500">No protocols found. Create one first.</p>
            ) : (
              <div className="space-y-2 mb-5">
                {protocols.map((p) => (
                  <label
                    key={p.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selected === p.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
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
                      <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{p.deviceType}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!selected || pending}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
