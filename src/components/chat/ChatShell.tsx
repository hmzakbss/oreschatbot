"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bot,
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

  async function handleBulkDelete(ids: string[]) {
    if (!ids.length) return;
    const results = await Promise.all(
      ids.map((id) => fetch(`/api/conversations/${id}`, { method: "DELETE" })),
    );
    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) {
      setError(`${failed.length} sohbet silinemedi.`);
    }

    setConversations((prev) => prev.filter((c) => !ids.includes(c.id)));
    if (activeId && ids.includes(activeId)) {
      handleCreate();
    }
  }

  async function handleSend(text: string) {
    setSending(true);
    setError(null);

    const tempUserId = `temp-user-${Date.now()}`;
    const tempAssistantId = `temp-assistant-${Date.now()}`;

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
          stream: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Mesaj gönderilemedi");
      }

      if (!res.body) {
        throw new Error("Yanıt akışı alınamadı");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: tempAssistantId,
          role: "assistant",
          content: "",
          sources: [],
        },
      ]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let streamBuffer = "";
      let accumulatedContent = "";
      let currentSources: ChatSource[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split("\n\n");
        streamBuffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            try {
              const event = JSON.parse(trimmed.slice(6));
              if (event.type === "metadata") {
                if (event.conversationId) {
                  setActiveId(event.conversationId);
                }
              } else if (event.type === "token") {
                accumulatedContent += event.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === tempAssistantId
                      ? {
                          ...m,
                          content: accumulatedContent,
                          sources: currentSources,
                        }
                      : m,
                  ),
                );
              } else if (event.type === "sources") {
                currentSources = normalizeSources(event.sources);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === tempAssistantId
                      ? {
                          ...m,
                          sources: currentSources,
                        }
                      : m,
                  ),
                );
              }
            } catch {
              // Ignore line parse errors
            }
          }
        }
      }

      await refreshConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mesaj gönderilemedi");
      setMessages((prev) =>
        prev.filter((m) => m.id !== tempUserId && m.id !== tempAssistantId),
      );
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
        className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-slate-200 bg-white/95 backdrop-blur-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:static md:translate-x-0 ${
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
          onSuggest={(text) => {
            if (!sending) void handleSend(text);
          }}
        />
        <MessageInput disabled={sending} onSend={handleSend} />
      </section>
    </div>
  );
}
