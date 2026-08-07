"use client";

import { useState } from "react";
import {
  Bot,
  Home,
  LogOut,
  Menu,
} from "lucide-react";
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
            <div className="flex items-center gap-2 px-1 mb-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="truncate text-[11px] font-medium text-slate-500 font-mono">{email}</p>
            </div>
            <form action="/cikis" method="post">
              <button
                type="submit"
                className="btn-ghost glass-panel inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 border-slate-200"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden />
                Çıkış Yap
              </button>
            </form>
          </div>
        </div>
      </aside>

      <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-slate-100/50 backdrop-blur-[2px]">
        <header className="animate-fade flex items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-5 py-3.5 backdrop-blur-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn-ghost glass-panel inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 md:hidden border-slate-200"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-3.5 w-3.5" aria-hidden />
              Geçmiş
            </button>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)]">
                <Bot className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-display text-xs font-bold tracking-wider text-slate-900">
                    <span className="brand-shine font-bold">ORES AI</span>
                  </p>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    RAG Canlı
                  </span>
                </div>
                <h1 className="text-xs font-medium text-slate-500">ORES Mağaza Asistanı</h1>
              </div>
            </div>
          </div>
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition"
          >
            <Home className="h-3.5 w-3.5" aria-hidden />
            Ana sayfa
          </a>
        </header>

        {error ? (
          <div className="animate-rise border-b border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-700">
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
