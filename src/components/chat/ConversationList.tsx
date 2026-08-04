"use client";

import type { ConversationSummary } from "@/components/chat/types";
import { MessageSquarePlus, Trash2 } from "lucide-react";

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onCreate,
  onDelete,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-3">
        <p className="font-display text-sm font-semibold text-ink">Geçmiş</p>
        <button
          type="button"
          onClick={onCreate}
          className="btn-primary inline-flex items-center gap-1.5 rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-white"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden />
          Yeni
        </button>
      </div>

      <ul className="flex-1 space-y-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <li className="px-2 py-3 text-xs text-[var(--muted)]">
            Henüz sohbet yok.
          </li>
        ) : (
          conversations.map((conversation, index) => {
            const active = conversation.id === activeId;
            return (
              <li
                key={conversation.id}
                className="group flex items-center gap-1"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <button
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  className={`min-w-0 flex-1 rounded-xl px-2.5 py-2 text-left text-sm transition duration-200 ${
                    active
                      ? "bg-ink text-white shadow-[0_8px_20px_rgba(13,20,28,0.18)]"
                      : "text-ink/80 hover:-translate-y-0.5 hover:bg-white/75"
                  }`}
                >
                  <span className="block truncate">
                    {conversation.title || "Adsız sohbet"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(conversation.id)}
                  className="rounded-lg p-2 text-[var(--muted)] opacity-0 transition hover:bg-white hover:text-ink group-hover:opacity-100"
                  aria-label="Sohbeti sil"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
