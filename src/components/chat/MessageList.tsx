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
  const containerRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUp = useRef(false);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    isUserScrolledUp.current = distanceFromBottom > 120;
  };

  useEffect(() => {
    if (messages.length <= 1) {
      isUserScrolledUp.current = false;
    }
  }, [messages.length]);

  useEffect(() => {
    if (!isUserScrolledUp.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  if (!messages.length && !loading) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="max-w-lg text-center">
          <span className="animate-rise animate-float mx-auto inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-600 text-white shadow-[0_4px_20px_rgba(79,70,229,0.35)]">
            <Sparkles className="h-8 w-8" aria-hidden />
          </span>
          <p className="animate-rise-delay-1 font-display mt-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Ne Öğrenmek İstersin?
          </p>
          <p className="animate-rise-delay-2 mt-3 text-sm leading-6 text-slate-600">
            Ürün teknik özellikleri veya mağaza politikaları hakkında soru sorabilirsin.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            {SUGGESTIONS.map((q, i) => (
              <button
                key={q.text}
                type="button"
                disabled={!onSuggest}
                onClick={() => onSuggest?.(q.text)}
                className="chip-btn chip-enter bento-card inline-flex max-w-full items-center gap-2.5 rounded-2xl px-4 py-3 text-left text-xs font-medium text-slate-700 border-indigo-100 hover:border-indigo-300 shadow-sm"
                style={{ animationDelay: `${0.1 + i * 0.06}s` }}
              >
                <q.icon
                  className="h-4 w-4 shrink-0 text-indigo-600"
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
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-6 scroll-smooth"
    >
      {messages.map((message, idx) => {
        const isUser = message.role === "user";
        const isLastAssistant =
          !isUser && loading && idx === messages.length - 1;

        return (
          <div
            key={message.id}
            className={`msg-enter flex ${isUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex max-w-[85%] sm:max-w-[78%] gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              {!isUser ? (
                <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
                  <Bot className="h-4.5 w-4.5" aria-hidden />
                </span>
              ) : null}
              <div
                className={`rounded-3xl px-5 py-3.5 text-sm leading-6 transition-all ${
                  isUser
                    ? "btn-indigo text-white font-medium shadow-[0_6px_20px_rgba(79,70,229,0.25)]"
                    : "glass-panel border-slate-200/80 bg-white/90 text-slate-800 shadow-sm"
                }`}
              >
                <div className="whitespace-pre-wrap">
                  {message.content}
                  {isLastAssistant ? (
                    <span className="streaming-cursor" aria-hidden />
                  ) : null}
                </div>
                {!isUser ? (
                  <SourceList sources={message.sources ?? []} />
                ) : null}
              </div>
            </div>
          </div>
        );
      })}

      {loading &&
      (!messages.length ||
        messages[messages.length - 1]?.role === "user") ? (
        <div className="msg-enter flex justify-start">
          <div className="flex gap-3">
            <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
              <Bot className="h-4.5 w-4.5" aria-hidden />
            </span>
            <div className="glass-panel border-slate-200/80 bg-white/90 rounded-3xl px-5 py-3.5 text-xs text-slate-600">
              <span className="inline-flex items-center gap-2.5 font-medium">
                <span className="inline-flex gap-1.5">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </span>
                ORES AI yanıt hazırlıyor…
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
