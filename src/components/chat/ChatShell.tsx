"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Home,
  LogOut,
  Menu,
  MessageSquareText,
} from "lucide-react";
import { ConversationList } from "@/components/chat/ConversationList";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageList } from "@/components/chat/MessageList";
import type {
  ChatMessage,
  ChatSource,
  ConversationSummary,
} from "@/components/chat/types";

function normalizeSources(sources: unknown): ChatSource[] {
  if (!Array.isArray(sources)) return [];
  return sources as ChatSource[];
}

export function ChatShell({
  email,
  initialConversations,
}: {
  email: string | null;
  initialConversations: ConversationSummary[];
}) {
  const [conversations, setConversations] =
    useState<ConversationSummary[]>(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const refreshConversations = useCallback(async () => {
    const res = await fetch("/api/conversations");
    if (!res.ok) return;
    const data = (await res.json()) as {
      conversations: ConversationSummary[];
    };
    setConversations(data.conversations ?? []);
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    setLoadingMessages(true);
    setError(null);
    setActiveId(id);
    setSidebarOpen(false);

    try {
      const res = await fetch(`/api/conversations/${id}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Sohbet yüklenemedi");
      }

      const loaded = (data.messages ?? []).map(
        (m: {
          id: string;
          role: "user" | "assistant";
          content: string;
          sources: unknown;
          created_at?: string;
        }) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          sources: normalizeSources(m.sources),
          created_at: m.created_at,
        }),
      ) as ChatMessage[];

      setMessages(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sohbet yüklenemedi");
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  function handleCreate() {
    setActiveId(null);
    setMessages([]);
    setError(null);
    setSidebarOpen(false);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Sohbet silinemedi");
      return;
    }

    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      handleCreate();
    }
  }

  async function handleSend(text: string) {
    setSending(true);
    setError(null);

    const tempUserId = `temp-user-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempUserId,
        role: "user",
        content: text,
        sources: [],
      },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId: activeId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Mesaj gönderilemedi");
      }

      const conversationId = data.conversationId as string;
      const assistant = data.message as {
        id: string;
        role: "assistant";
        content: string;
        sources: ChatSource[];
        created_at?: string;
      };

      setActiveId(conversationId);
      setMessages((prev) => [
        ...prev,
        {
          id: assistant.id,
          role: "assistant",
          content: assistant.content,
          sources: normalizeSources(assistant.sources),
          created_at: assistant.created_at,
        },
      ]);

      await refreshConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mesaj gönderilemedi");
      setMessages((prev) => prev.filter((m) => m.id !== tempUserId));
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    void refreshConversations();
  }, [refreshConversations]);

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
        className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-[var(--line)] bg-[rgba(239,234,226,0.88)] backdrop-blur-xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="sidebar-enter flex h-full flex-col">
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelect={(id) => void loadConversation(id)}
            onCreate={handleCreate}
            onDelete={(id) => void handleDelete(id)}
          />
          <div className="border-t border-[var(--line)] p-3">
            <p className="truncate px-1 text-xs text-[var(--muted)]">{email}</p>
            <form action="/cikis" method="post" className="mt-2">
              <button
                type="submit"
                className="btn-ghost glass-panel inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-ink"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden />
                Çıkış
              </button>
            </form>
          </div>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-white/25 backdrop-blur-[2px]">
        <header className="animate-fade flex items-center justify-between gap-3 border-b border-[var(--line)] bg-white/40 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-ghost glass-panel inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-ink md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-3.5 w-3.5" aria-hidden />
              Geçmiş
            </button>
            <div className="flex items-center gap-2">
              <span className="hidden h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] sm:inline-flex">
                <MessageSquareText className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <p className="font-display text-xs font-semibold tracking-wide">
                  <span className="brand-shine">ORES</span>
                </p>
                <h1 className="text-sm font-medium text-ink">Sohbet</h1>
              </div>
            </div>
          </div>
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] underline transition hover:text-ink"
          >
            <Home className="h-3.5 w-3.5" aria-hidden />
            Ana sayfa
          </a>
        </header>

        {error ? (
          <div className="animate-rise border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <MessageList
          messages={messages}
          loading={sending || loadingMessages}
          onSuggest={(text) => {
            if (!sending) void handleSend(text);
          }}
        />
        <MessageInput disabled={sending} onSend={handleSend} />
      </section>
    </div>
  );
}
