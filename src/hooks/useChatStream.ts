import { useCallback, useEffect, useState } from "react";
import type {
  ChatMessage,
  ChatSource,
  ConversationSummary,
} from "@/components/chat/types";

function normalizeSources(sources: unknown): ChatSource[] {
  if (!Array.isArray(sources)) return [];
  return sources as ChatSource[];
}

export function useChatStream({
  initialConversations,
}: {
  initialConversations: ConversationSummary[];
}) {
  const [conversations, setConversations] =
    useState<ConversationSummary[]>(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setMessages([]);
    setError(null);
    setActiveId(id);

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

  return {
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
  };
}
