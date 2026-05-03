"use client";
import { useState, useEffect, useRef, useTransition } from "react";
import { Pencil, Check } from "lucide-react";
import { updateSessionNotes } from "@/app/sessions/actions";

type SaveState = "idle" | "saving" | "saved" | "error";

export function SessionNotesEditor({
  sessionId,
  initialNotes,
}: {
  sessionId: string;
  initialNotes: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialNotes ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedRef = useRef(initialNotes ?? "");

  // Autosave: debounce 1.5s after typing stops
  useEffect(() => {
    if (!editing) return;
    if (value === savedRef.current) {
      setSaveState("idle");
      return;
    }
    setSaveState("idle");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSaveState("saving");
      startTransition(async () => {
        try {
          await updateSessionNotes(sessionId, value);
          savedRef.current = value;
          setSaveState("saved");
          setTimeout(() => setSaveState("idle"), 2000);
        } catch {
          setSaveState("error");
        }
      });
    }, 1500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, editing, sessionId]);

  function handleDone() {
    // Flush any pending save immediately
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value !== savedRef.current) {
      startTransition(async () => {
        await updateSessionNotes(sessionId, value);
        savedRef.current = value;
      });
    }
    setEditing(false);
    setSaveState("idle");
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
        <div className="flex items-center gap-3">
          <button
            onClick={handleDone}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Check size={12} />
            Done
          </button>
          <span className="text-xs text-gray-400">
            {saveState === "saving" && (
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 border-2 border-gray-300 border-t-blue-400 rounded-full animate-spin inline-block" />
                Saving…
              </span>
            )}
            {saveState === "saved" && <span className="text-emerald-600">✓ Saved</span>}
            {saveState === "error" && <span className="text-red-500">Save failed</span>}
            {saveState === "idle" && value !== savedRef.current && (
              <span className="text-amber-500">Unsaved changes</span>
            )}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-3">
      <div className="flex-1">
        {savedRef.current ? (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{savedRef.current}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">No clinical notes yet. Click to add.</p>
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
