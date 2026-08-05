"use client";

import { useMemo, useState } from "react";
import type { ConversationSummary } from "@/components/chat/types";
import {
  Check,
  CheckSquare,
  CheckSquare2,
  ListChecks,
  MessageSquarePlus,
  Square,
  Trash2,
  X,
} from "lucide-react";

type GroupedConversations = {
  label: string;
  items: ConversationSummary[];
}[];

function groupConversationsByDate(
  conversations: ConversationSummary[],
): GroupedConversations {
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const yesterdayStart = todayStart - 86400000;
  const weekStart = todayStart - 6 * 86400000;
  const monthStart = todayStart - 29 * 86400000;

  const groups: { [key: string]: ConversationSummary[] } = {
    Bugün: [],
    Dün: [],
    "Bu Hafta": [],
    "Bu Ay": [],
    "Daha Eski": [],
  };

  for (const conv of conversations) {
    const dateStr = conv.created_at || conv.updated_at;
    const time = new Date(dateStr).getTime();

    if (isNaN(time)) {
      groups["Daha Eski"].push(conv);
    } else if (time >= todayStart) {
      groups["Bugün"].push(conv);
    } else if (time >= yesterdayStart) {
      groups["Dün"].push(conv);
    } else if (time >= weekStart) {
      groups["Bu Hafta"].push(conv);
    } else if (time >= monthStart) {
      groups["Bu Ay"].push(conv);
    } else {
      groups["Daha Eski"].push(conv);
    }
  }

  return [
    { label: "Bugün", items: groups["Bugün"] },
    { label: "Dün", items: groups["Dün"] },
    { label: "Bu Hafta", items: groups["Bu Hafta"] },
    { label: "Bu Ay", items: groups["Bu Ay"] },
    { label: "Daha Eski", items: groups["Daha Eski"] },
  ].filter((g) => g.items.length > 0);
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  onBulkDelete,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
}) {
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const grouped = useMemo(
    () => groupConversationsByDate(conversations),
    [conversations],
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === conversations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(conversations.map((c) => c.id));
    }
  };

  const handleConfirmBulkDelete = () => {
    if (!selectedIds.length || !onBulkDelete) return;
    onBulkDelete(selectedIds);
    setSelectedIds([]);
    setIsMultiSelect(false);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Sidebar Header */}
      <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-xs font-bold uppercase tracking-wider text-slate-500">
            {isMultiSelect ? `${selectedIds.length} Seçildi` : "Sohbet Geçmişi"}
          </p>

          <div className="flex items-center gap-1.5">
            {conversations.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setIsMultiSelect(!isMultiSelect);
                  setSelectedIds([]);
                }}
                title={isMultiSelect ? "Seçimi İptal Et" : "Çoklu Seçim Modu"}
                className={`inline-flex items-center justify-center h-7 px-2 rounded-lg text-xs font-medium transition ${
                  isMultiSelect
                    ? "bg-slate-200 text-slate-800"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {isMultiSelect ? (
                  <X className="h-3.5 w-3.5" />
                ) : (
                  <ListChecks className="h-3.5 w-3.5" />
                )}
              </button>
            ) : null}

            {!isMultiSelect ? (
              <button
                type="button"
                onClick={onCreate}
                className="btn-indigo inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm"
              >
                <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden />
                Yeni
              </button>
            ) : null}
          </div>
        </div>

        {/* Multi Select Bulk Actions Bar */}
        {isMultiSelect ? (
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-[11px] font-semibold text-indigo-600 hover:underline"
            >
              {selectedIds.length === conversations.length
                ? "Temizle"
                : "Tümünü Seç"}
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={handleConfirmBulkDelete}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-sm disabled:opacity-40 hover:bg-red-700 transition"
            >
              <Trash2 className="h-3 w-3" />
              Seçilenleri Sil ({selectedIds.length})
            </button>
          </div>
        ) : null}
      </div>

      {/* Grouped Conversations List */}
      <div className="flex-1 space-y-4 overflow-y-auto p-2.5">
        {conversations.length === 0 ? (
          <div className="px-3 py-8 text-xs text-slate-400 text-center">
            Henüz sohbet başlatılmadı.
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.label} className="space-y-1">
              <div className="px-3 pt-2 pb-1 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  {group.label}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {group.items.length}
                </span>
              </div>

              <ul className="space-y-1">
                {group.items.map((conversation) => {
                  const active = conversation.id === activeId;
                  const isChecked = selectedIds.includes(conversation.id);

                  return (
                    <li
                      key={conversation.id}
                      className="group flex items-center gap-1"
                    >
                      {isMultiSelect ? (
                        <button
                          type="button"
                          onClick={() => toggleSelect(conversation.id)}
                          className="p-2 text-indigo-600 hover:opacity-80 transition"
                        >
                          {isChecked ? (
                            <CheckSquare2 className="h-4 w-4 fill-indigo-600 text-white" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400" />
                          )}
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() =>
                          isMultiSelect
                            ? toggleSelect(conversation.id)
                            : onSelect(conversation.id)
                        }
                        className={`min-w-0 flex-1 rounded-2xl px-3.5 py-2.5 text-left text-xs font-medium transition duration-200 ${
                          active && !isMultiSelect
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold"
                            : isChecked
                              ? "bg-indigo-50 border border-indigo-200 text-indigo-900"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        }`}
                      >
                        <span className="block truncate">
                          {conversation.title || "Adsız sohbet"}
                        </span>
                      </button>

                      {!isMultiSelect ? (
                        <button
                          type="button"
                          onClick={() => onDelete(conversation.id)}
                          className="rounded-xl p-2 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                          aria-label="Sohbeti sil"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
