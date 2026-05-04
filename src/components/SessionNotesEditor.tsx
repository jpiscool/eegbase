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
          className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-2"
          style={{ border: "1px solid var(--border-default)", background: "var(--surface-sunken)", color: "var(--text-primary)" }}
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleDone}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            style={{ background: "var(--brand)", color: "#fff" }}
          >
            <Check size={12} />
            Done
          </button>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {saveState === "saving" && (
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin inline-block" style={{ borderColor: "var(--border-default)", borderTopColor: "var(--brand)" }} />
                Saving…
              </span>
            )}
            {saveState === "saved" && <span style={{ color: "var(--success)" }}>✓ Saved</span>}
            {saveState === "error" && <span style={{ color: "var(--danger)" }}>Save failed</span>}
            {saveState === "idle" && value !== savedRef.current && (
              <span style={{ color: "var(--warning)" }}>Unsaved changes</span>
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
          <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>{savedRef.current}</p>
        ) : (
          <p className="text-sm italic" style={{ color: "var(--text-tertiary)" }}>No clinical notes yet. Click to add.</p>
        )}
      </div>
      <button
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all"
        style={{ color: "var(--text-tertiary)" }}
        title="Edit notes"
      >
        <Pencil size={14} />
      </button>
    </div>
  );
}
