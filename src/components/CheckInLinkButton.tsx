"use client";

import { useState, useTransition } from "react";
import { Link2, Copy, Check, Trash2, ExternalLink, ClipboardCheck } from "lucide-react";
import { generateCheckInToken, revokeCheckInToken } from "@/app/clients/actions";

interface Props {
  clientId: string;
  initialToken: string | null;
}

export function CheckInLinkButton({ clientId, initialToken }: Props) {
  const [token, setToken] = useState<string | null>(initialToken);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showRevoke, setShowRevoke] = useState(false);

  const shareUrl = token
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/checkin/${token}`
    : null;

  function handleGenerate() {
    startTransition(async () => {
      const t = await generateCheckInToken(clientId);
      setToken(t);
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
      await revokeCheckInToken(clientId);
      setToken(null);
      setShowRevoke(false);
    });
  }

  if (!token) {
    return (
      <button
        onClick={handleGenerate}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <ClipboardCheck size={14} />
        {isPending ? "Generating…" : "Create Check-in Link"}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <Link2 size={12} className="text-blue-500 shrink-0" />
          <span className="text-xs text-gray-600 truncate font-mono">{shareUrl}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors shrink-0"
        >
          {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          {copied ? "Copied!" : "Copy"}
        </button>
        <a
          href={shareUrl!}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors shrink-0"
        >
          <ExternalLink size={13} />
          Preview
        </a>
        <button
          onClick={() => setShowRevoke(true)}
          className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
          title="Revoke link"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {showRevoke && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <span className="text-xs text-red-700 flex-1">Revoke this link? Clients with it will lose access.</span>
          <button
            onClick={handleRevoke}
            disabled={isPending}
            className="text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            {isPending ? "Revoking…" : "Revoke"}
          </button>
          <button
            onClick={() => setShowRevoke(false)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
