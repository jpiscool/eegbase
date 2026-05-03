"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteSession } from "@/app/sessions/actions";

export function DeleteSessionButton({
  sessionId,
  clientId,
}: {
  sessionId: string;
  clientId: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      await deleteSession(sessionId);
      router.push(`/clients/${clientId}`);
    });
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
      >
        <Trash2 size={13} />
        Delete Session
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-red-600 font-medium">Delete this session permanently?</span>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Deleting…" : "Yes, delete"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="px-3 py-1.5 text-xs font-medium text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
