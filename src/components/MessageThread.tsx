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
          <p className="text-center text-sm text-gray-400 mt-16">
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
              <span className="text-[11px] text-gray-400 px-1">
                {isClinician ? clinicianName : clientName}
              </span>
              <div
                className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isClinician
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-900 rounded-bl-sm"
                }`}
              >
                {msg.body}
              </div>
              <span className="text-[11px] text-gray-400 px-1">
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
        className="border-t border-gray-200 px-4 py-3 flex gap-3 items-end bg-white"
      >
        <input type="hidden" name="clientId" value={clientId} />
        <textarea
          name="body"
          rows={2}
          placeholder="Write a message…"
          className="flex-1 resize-none px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
