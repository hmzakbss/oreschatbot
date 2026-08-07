"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Home, LogOut, Menu } from "lucide-react";
import { ConversationList } from "@/components/chat/ConversationList";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageList } from "@/components/chat/MessageList";
import type { ConversationSummary } from "@/components/chat/types";
import { useChatStream } from "@/hooks/useChatStream";

export function ChatShell({
  email,
  initialConversations,
}: {
  email: string | null;
  initialConversations: ConversationSummary[];
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  const {
    conversations,
    activeId,
    messages,
    loadingMessages,
    sending,
    error,
    loadConversation,
    handleCreate,
    handleDelete,
    handleBulkDelete,
    handleSend,
  } = useChatStream({ initialConversations });

  const activeTitle = useMemo(() => {
    if (!activeId) return "Yeni sohbet";
    const found = conversations.find((c) => c.id === activeId);
    return found?.title?.trim() || "Adsız sohbet";
  }, [activeId, conversations]);

  useEffect(() => {
    if (!sidebarOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSidebarOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    const focusable = sidebarRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen]);

  return (
    <div className="app-atmosphere flex h-[100dvh] w-full overflow-hidden">
      <div className="atmosphere-grid" aria-hidden />
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Menüyü kapat"
          className="fixed inset-0 z-20 bg-ink/25 backdrop-blur-[3px] transition md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        ref={sidebarRef}
        id="chat-sidebar"
        className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-slate-200 bg-white/95 backdrop-blur-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="sidebar-enter flex h-full flex-col">
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelect={(id) => {
              setSidebarOpen(false);
              void loadConversation(id);
            }}
            onCreate={() => {
              setSidebarOpen(false);
              handleCreate();
            }}
            onDelete={(id) => void handleDelete(id)}
            onBulkDelete={(ids) => void handleBulkDelete(ids)}
          />
          <div className="border-t border-slate-200 p-3.5">
            <div className="mb-2 flex items-center gap-2 px-1">
              <span
                className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
                aria-hidden
              />
              <p className="truncate font-mono text-[11px] font-medium text-slate-500">
                {email}
              </p>
            </div>
            <form action="/cikis" method="post">
              <button
                type="submit"
                className="btn-ghost glass-panel inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border-slate-200 text-xs font-medium text-slate-700 hover:text-slate-900"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden />
                Çıkış Yap
              </button>
            </form>
          </div>
        </div>
      </aside>

      <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-slate-100/50 backdrop-blur-[2px]">
        <header className="animate-fade flex items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-5 py-3.5 shadow-sm backdrop-blur-2xl">
          <div className="flex min-w-0 items-center gap-3">
            <button
              ref={menuButtonRef}
              type="button"
              className="btn-ghost glass-panel inline-flex items-center gap-1.5 rounded-xl border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-expanded={sidebarOpen}
              aria-controls="chat-sidebar"
            >
              <Menu className="h-3.5 w-3.5" aria-hidden />
              Geçmiş
            </button>
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)]">
                <Bot className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-xs font-bold tracking-wider text-slate-900">
                    <span className="brand-shine font-bold">ORES AI</span>
                  </p>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    Çevrimiçi
                  </span>
                </div>
                <h1 className="truncate text-xs font-medium text-slate-500">
                  {activeTitle}
                </h1>
              </div>
            </div>
          </div>
          <a
            href="/"
            className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-900"
          >
            <Home className="h-3.5 w-3.5" aria-hidden />
            Ana sayfa
          </a>
        </header>

        {error ? (
          <div
            role="alert"
            className="animate-rise border-b border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-700"
          >
            {error}
          </div>
        ) : null}

        <MessageList
          messages={messages}
          loading={sending || loadingMessages}
          loadingMessages={loadingMessages}
          onSuggest={(text) => {
            if (!sending) void handleSend(text);
          }}
        />
        <MessageInput disabled={sending} onSend={handleSend} />
      </section>
    </div>
  );
}
