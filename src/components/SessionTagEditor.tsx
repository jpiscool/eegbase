"use client";

import { useState, useTransition, useRef, KeyboardEvent } from "react";
import { Tag, X, Plus, Loader2 } from "lucide-react";
import { updateSessionTags } from "@/app/sessions/actions";

const SUGGESTED_TAGS = [
  "baseline", "week-4", "week-8", "week-12",
  "pre-tx", "post-tx", "follow-up",
  "high-performance", "low-performance",
  "protocol-change", "medication-change",
  "home-session", "clinic-session",
];

interface Props {
  sessionId: string;
  initialTags: string[] | null;
}

export function SessionTagEditor({ sessionId, initialTags }: Props) {
  const [tags, setTags] = useState<string[]>(initialTags ?? []);
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function save(next: string[]) {
    setError(null);
    startTransition(async () => {
      try {
        await updateSessionTags(sessionId, next);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save tags");
      }
    });
  }

  function addTag(tag: string) {
    const cleaned = tag.trim().toLowerCase();
    if (!cleaned || tags.includes(cleaned)) return;
    const next = [...tags, cleaned];
    setTags(next);
    setInput("");
    setShowSuggestions(false);
    save(next);
  }

  function removeTag(tag: string) {
    const next = tags.filter((t) => t !== tag);
    setTags(next);
    save(next);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  const suggestions = SUGGESTED_TAGS.filter(
    (s) => !tags.includes(s) && s.includes(input.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Tag size={13} style={{ color: "var(--text-tertiary)" }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Session Tags</span>
        {isPending && <Loader2 size={11} className="animate-spin" style={{ color: "var(--text-tertiary)" }} />}
      </div>

      {error && (
        <p className="text-xs mb-2" style={{ color: "var(--danger)" }}>{error}</p>
      )}

      {/* Tag chips + input */}
      <div
        className="flex flex-wrap gap-1.5 p-2 rounded-lg min-h-[40px] cursor-text focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent"
        style={{ border: "1px solid var(--border-default)" }}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ background: "color-mix(in srgb, var(--brand) 10%, transparent)", color: "var(--brand)", border: "1px solid color-mix(in srgb, var(--brand) 20%, transparent)" }}
          >
            {tag}
            <button
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              className="transition-colors"
              style={{ color: "var(--brand)" }}
              aria-label={`Remove ${tag}`}
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder={tags.length === 0 ? "Add tags…" : ""}
            className="text-xs outline-none bg-transparent min-w-[80px]"
            style={{ color: "var(--text-primary)" }}
          />

          {/* Autocomplete dropdown */}
          {showSuggestions && (input || suggestions.length > 0) && suggestions.length > 0 && (
            <div
              className="absolute top-full left-0 mt-1 rounded-lg shadow-lg z-10 min-w-[160px] py-1"
              style={{ background: "var(--surface-overlay)", border: "1px solid var(--border-subtle)" }}
            >
              {suggestions.slice(0, 8).map((s) => (
                <button
                  key={s}
                  onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
                  className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors"
                  style={{ color: "var(--text-primary)" }}
                >
                  <Plus size={10} style={{ color: "var(--text-tertiary)" }} />
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs mt-1.5" style={{ color: "var(--text-tertiary)" }}>
        Press Enter or comma to add · Backspace to remove · or choose from suggestions
      </p>
    </div>
  );
}
