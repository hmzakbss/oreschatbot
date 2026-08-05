"use client";

import { FormEvent, useState } from "react";
import { SendHorizontal } from "lucide-react";

export function MessageInput({
  disabled,
  onSend,
}: {
  disabled?: boolean;
  onSend: (message: string) => Promise<void> | void;
}) {
  const [value, setValue] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    setValue("");
    await onSend(text);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-slate-200/80 bg-white/80 px-4 py-4 backdrop-blur-2xl sm:px-6"
    >
      <div className="flex gap-2.5 max-w-4xl mx-auto items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={disabled}
            placeholder="ORES AI'ya soru sor (Örn. iade süresi kaç gün?)..."
            className="h-13 w-full rounded-full border border-slate-200 bg-white px-5 text-sm text-slate-900 placeholder-slate-400 outline-none transition duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50 shadow-sm"
          />
        </div>
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="btn-indigo inline-flex h-13 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold disabled:opacity-40 disabled:hover:scale-100 shadow-[0_6px_20px_rgba(79,70,229,0.3)] shrink-0"
          aria-label="Gönder"
        >
          <span className="hidden sm:inline">Gönder</span>
          <SendHorizontal className="h-4 w-4 shrink-0" aria-hidden />
        </button>
      </div>
    </form>
  );
}
