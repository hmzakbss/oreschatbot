"use client";

import { useCallback, useEffect, useState } from "react";
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
    // İlk açılışta listeyi taze tut
    void refreshConversations();
  }, [refreshConversations]);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-white">
      {/* Mobil overlay */}
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Menüyü kapat"
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 border-r border-zinc-200 bg-zinc-50 transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={(id) => void loadConversation(id)}
          onCreate={handleCreate}
          onDelete={(id) => void handleDelete(id)}
        />
        <div className="border-t border-zinc-200 p-3">
          <p className="truncate px-1 text-xs text-zinc-500">{email}</p>
          <form action="/cikis" method="post" className="mt-2">
            <button
              type="submit"
              className="inline-flex h-9 w-full items-center justify-center rounded-md border border-zinc-300 bg-white text-sm font-medium text-zinc-800 hover:bg-zinc-100"
            >
              Çıkış
            </button>
          </form>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs font-medium text-zinc-700 md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              Geçmiş
            </button>
            <div>
              <p className="text-xs font-medium text-zinc-500">ORES Chatbot</p>
              <h1 className="text-sm font-semibold text-zinc-900">Sohbet</h1>
            </div>
          </div>
          <a
            href="/"
            className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900"
          >
            Ana sayfa
          </a>
        </header>

        {error ? (
          <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <MessageList messages={messages} loading={sending || loadingMessages} />
        <MessageInput disabled={sending} onSend={handleSend} />
      </section>
    </div>
  );
}
