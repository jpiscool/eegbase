"use client";
import { useEffect, useRef, useState } from "react";
import { sendMessage } from "@/app/clients/actions";
import { Send } from "lucide-react";

interface Message {
  id: string;
  senderRole: string;
  body: string;
  createdAt: Date;
}

export function MessageThread({
  clientId,
  initialMessages,
  clinicianName,
  clientName,
}: {
  clientId: string;
  initialMessages: Message[];
  clinicianName: string;
  clientName: string;
}) {
  const [pending, setPending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [initialMessages]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = (fd.get("body") as string).trim();
    if (!body) return;
    setPending(true);
    try {
      await sendMessage(fd);
      formRef.current?.reset();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
        {initialMessages.length === 0 && (
          <p className="text-center text-sm mt-16" style={{ color: "var(--text-tertiary)" }}>
            No messages yet. Send the first one below.
          </p>
        )}
        {initialMessages.map((msg) => {
          const isClinician = msg.senderRole === "clinician";
          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-0.5 ${isClinician ? "items-end" : "items-start"}`}
            >
              <span className="text-[11px] px-1" style={{ color: "var(--text-tertiary)" }}>
                {isClinician ? clinicianName : clientName}
              </span>
              <div
                className="max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                style={isClinician
                  ? { background: "var(--brand)", color: "#fff", borderBottomRightRadius: "4px" }
                  : { background: "var(--surface-sunken)", color: "var(--text-primary)", borderBottomLeftRadius: "4px" }}
              >
                {msg.body}
              </div>
              <span className="text-[11px] px-1" style={{ color: "var(--text-tertiary)" }}>
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {" · "}
                {new Date(msg.createdAt).toLocaleDateString()}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="border-t px-4 py-3 flex gap-3 items-end"
        style={{ borderColor: "var(--border-subtle)", background: "var(--surface-raised)" }}
      >
        <input type="hidden" name="clientId" value={clientId} />
        <textarea
          name="body"
          rows={2}
          placeholder="Write a message…"
          className="flex-1 resize-none px-3 py-2 rounded-xl text-sm focus:outline-none"
          style={{ border: "1px solid var(--border-default)", background: "var(--surface-raised)", color: "var(--text-primary)" }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <button
          type="submit"
          disabled={pending}
          className="flex items-center justify-center w-10 h-10 text-white rounded-xl transition-colors flex-shrink-0"
          style={{ background: "var(--brand)", opacity: pending ? 0.5 : 1 }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
