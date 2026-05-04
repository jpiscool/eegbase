"use client";

import { useState, useTransition } from "react";
import { Link2, Copy, Check, Trash2, ExternalLink } from "lucide-react";
import { generateReportToken, revokeReportToken } from "@/app/clients/actions";

interface Props {
  clientId: string;
  initialToken: string | null;
}

export function ShareReportButton({ clientId, initialToken }: Props) {
  const [token, setToken] = useState<string | null>(initialToken);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showRevoke, setShowRevoke] = useState(false);

  const shareUrl = token
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${token}`
    : null;

  function handleGenerate() {
    startTransition(async () => {
      const newToken = await generateReportToken(clientId);
      setToken(newToken);
    });
  }

  function handleCopy() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRevoke() {
    startTransition(async () => {
      await revokeReportToken(clientId);
      setToken(null);
      setShowRevoke(false);
    });
  }

  const btnStyle: React.CSSProperties = { border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" };

  if (!token) {
    return (
      <button
        onClick={handleGenerate}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        style={btnStyle}
      >
        <Link2 size={14} />
        {isPending ? "Generating…" : "Create Share Link"}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-1.5 flex-1 min-w-0 rounded-lg px-3 py-2"
          style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)" }}
        >
          <Link2 size={12} className="shrink-0" style={{ color: "var(--success)" }} />
          <span className="text-xs truncate font-mono" style={{ color: "var(--text-secondary)" }}>{shareUrl}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors shrink-0"
          title="Copy link"
          style={btnStyle}
        >
          {copied ? <Check size={13} style={{ color: "var(--success)" }} /> : <Copy size={13} />}
          {copied ? "Copied!" : "Copy"}
        </button>
        <a
          href={shareUrl!}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors shrink-0"
          title="Open report"
          style={btnStyle}
        >
          <ExternalLink size={13} />
          Preview
        </a>
        <button
          onClick={() => setShowRevoke(true)}
          className="p-2 rounded-lg transition-colors"
          style={{ color: "var(--text-tertiary)" }}
          title="Revoke link"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {showRevoke && (
        <div
          className="flex items-center gap-3 rounded-lg px-3 py-2"
          style={{ background: "var(--danger-subtle)", border: "1px solid color-mix(in srgb, var(--danger) 20%, transparent)" }}
        >
          <span className="text-xs flex-1" style={{ color: "var(--danger)" }}>Revoke this link? Anyone with it will lose access.</span>
          <button
            onClick={handleRevoke}
            disabled={isPending}
            className="text-xs font-semibold disabled:opacity-50"
            style={{ color: "var(--danger)" }}
          >
            {isPending ? "Revoking…" : "Revoke"}
          </button>
          <button
            onClick={() => setShowRevoke(false)}
            className="text-xs"
            style={{ color: "var(--text-secondary)" }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
