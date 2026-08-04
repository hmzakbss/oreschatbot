"use client";

import { useEffect, useRef } from "react";
import { SourceList } from "@/components/chat/SourceList";
import type { ChatMessage } from "@/components/chat/types";

export function MessageList({
  messages,
  loading,
}: {
  messages: ChatMessage[];
  loading?: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!messages.length && !loading) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-zinc-500">
        Ürün veya politika hakkında soru sor. Cevaplar yalnızca bilgi
        tabanından gelir.
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-6">
      {messages.map((message) => {
        const isUser = message.role === "user";
        return (
          <div
            key={message.id}
            className={`flex ${isUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                isUser
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-200 bg-zinc-50 text-zinc-900"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {!isUser ? <SourceList sources={message.sources ?? []} /> : null}
            </div>
          </div>
        );
      })}

      {loading ? (
        <div className="flex justify-start">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
            Yanıt hazırlanıyor…
          </div>
        </div>
      ) : null}

      <div ref={endRef} />
    </div>
  );
}
