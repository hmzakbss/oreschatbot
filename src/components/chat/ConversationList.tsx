"use client";

import type { ConversationSummary } from "@/components/chat/types";

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
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3">
        <p className="text-sm font-medium text-zinc-900">Geçmiş</p>
        <button
          type="button"
          onClick={onCreate}
          className="rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
        >
          Yeni sohbet
        </button>
      </div>

      <ul className="flex-1 space-y-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <li className="px-2 py-3 text-xs text-zinc-500">
            Henüz sohbet yok.
          </li>
        ) : (
          conversations.map((conversation) => {
            const active = conversation.id === activeId;
            return (
              <li key={conversation.id} className="group flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  className={`min-w-0 flex-1 rounded-md px-2.5 py-2 text-left text-sm ${
                    active
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <span className="block truncate">
                    {conversation.title || "Adsız sohbet"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(conversation.id)}
                  className="rounded-md px-2 py-2 text-xs text-zinc-400 opacity-0 hover:bg-zinc-100 hover:text-zinc-700 group-hover:opacity-100"
                  aria-label="Sohbeti sil"
                >
                  Sil
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
