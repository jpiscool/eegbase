"use client";
import { useState, useTransition } from "react";
import { Pencil, Check, X } from "lucide-react";
import { updateSessionNotes } from "@/app/sessions/actions";

export function SessionNotesEditor({
  sessionId,
  initialNotes,
}: {
  sessionId: string;
  initialNotes: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialNotes ?? "");
  const [saved, setSaved] = useState(initialNotes ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await updateSessionNotes(sessionId, value);
      setSaved(value);
      setEditing(false);
    });
  }

  function handleCancel() {
    setValue(saved);
    setEditing(false);
  }

  if (editing) {
    return (
      <div>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={4}
          autoFocus
          placeholder="Add clinical notes…"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-2"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Check size={12} />
            {isPending ? "Saving…" : "Save"}
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={12} />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-3">
      <div className="flex-1">
        {saved ? (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{saved}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">No clinical notes.</p>
        )}
      </div>
      <button
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
        title="Edit notes"
      >
        <Pencil size={14} />
      </button>
    </div>
  );
}
