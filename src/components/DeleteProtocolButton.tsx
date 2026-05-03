"use client";
import { useState } from "react";
import { deleteProtocol } from "@/app/protocols/actions";
import { Trash2 } from "lucide-react";

export function DeleteProtocolButton({ id, name }: { id: string; name: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-gray-500">Delete &ldquo;{name}&rdquo;?</span>
        <button
          onClick={async () => {
            setPending(true);
            await deleteProtocol(id);
          }}
          disabled={pending}
          className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
        >
          {pending ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="shrink-0 p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
      title="Delete protocol"
    >
      <Trash2 size={15} />
    </button>
  );
}
