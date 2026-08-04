"use client";

import { useEffect, useRef } from "react";
import {
  Bot,
  CircleHelp,
  Package,
  Shield,
  Sparkles,
  Truck,
} from "lucide-react";
import { SourceList } from "@/components/chat/SourceList";
import type { ChatMessage } from "@/components/chat/types";

const SUGGESTIONS = [
  {
    icon: Shield,
    text: "İade süresi kaç gün?",
  },
  {
    icon: Truck,
    text: "750 TL altı kargo ücretli mi?",
  },
  {
    icon: Package,
    text: "500 TL altında ürün var mı?",
  },
  {
    icon: CircleHelp,
    text: "Profil kalınlığı 25 mm olanlar hangileri?",
  },
];

export function MessageList({
  messages,
  loading,
  onSuggest,
}: {
  messages: ChatMessage[];
  loading?: boolean;
  onSuggest?: (text: string) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!messages.length && !loading) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="max-w-lg text-center">
          <span className="animate-rise mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <Sparkles className="h-7 w-7" aria-hidden />
          </span>
          <p className="animate-rise-delay-1 font-display mt-5 text-3xl font-semibold tracking-tight text-ink">
            Ne öğrenmek istersin?
          </p>
          <p className="animate-rise-delay-2 mt-3 text-sm leading-6 text-[var(--muted)]">
            Ürün veya politika sor. Cevaplar yalnızca bilgi tabanından gelir.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2.5">
            {SUGGESTIONS.map((q, i) => (
              <button
                key={q.text}
                type="button"
                disabled={!onSuggest}
                onClick={() => onSuggest?.(q.text)}
                className="chip-btn chip-enter glass-panel inline-flex max-w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-left text-xs text-ink"
                style={{ animationDelay: `${0.12 + i * 0.07}s` }}
              >
                <q.icon
                  className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]"
                  aria-hidden
                />
                <span>{q.text}</span>
              </button>
            ))}
          </div>
        </div>
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
            className={`msg-enter flex ${isUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex max-w-[88%] gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              {!isUser ? (
                <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Bot className="h-4 w-4" aria-hidden />
                </span>
              ) : null}
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-[0_8px_24px_rgba(13,20,28,0.06)] ${
                  isUser ? "bg-ink text-white" : "glass-panel text-ink"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {!isUser ? (
                  <SourceList sources={message.sources ?? []} />
                ) : null}
              </div>
            </div>
          </div>
        );
      })}

      {loading ? (
        <div className="msg-enter flex justify-start">
          <div className="flex gap-2">
            <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
              <Bot className="h-4 w-4" aria-hidden />
            </span>
            <div className="glass-panel rounded-2xl px-4 py-3 text-sm text-[var(--muted)]">
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex gap-1">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </span>
                Yanıt hazırlanıyor…
              </span>
            </div>
          </div>
        </div>
      ) : null}

      <div ref={endRef} />
    </div>
  );
}
