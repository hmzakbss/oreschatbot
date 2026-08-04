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
      className="border-t border-[var(--line)] bg-white/50 px-4 py-4 backdrop-blur-md sm:px-6"
    >
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          placeholder="Örn. iade süresi kaç gün?"
          className="h-12 flex-1 rounded-xl border border-[var(--line)] bg-white/85 px-4 text-sm text-ink outline-none transition focus:border-ink/35 focus:shadow-[0_0_0_4px_rgba(194,120,42,0.12)] disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="btn-primary inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-medium text-white disabled:opacity-60 sm:px-5"
          aria-label="Gönder"
        >
          <span className="hidden sm:inline">Gönder</span>
          <SendHorizontal className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </form>
  );
}
