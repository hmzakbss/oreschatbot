"use client";

import { FormEvent, KeyboardEvent, useState } from "react";
import { SendHorizontal } from "lucide-react";

const MAX_LENGTH = 1500;

export function MessageInput({
  disabled,
  onSend,
}: {
  disabled?: boolean;
  onSend: (message: string) => Promise<void> | void;
}) {
  const [value, setValue] = useState("");

  async function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    setValue("");
    await onSend(text);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await submit();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  }

  const nearLimit = value.length >= 1200;

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-slate-200/80 bg-white/80 px-4 py-4 backdrop-blur-2xl sm:px-6"
    >
      <div className="mx-auto flex max-w-4xl items-end gap-2.5">
        <div className="relative min-w-0 flex-1">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value.slice(0, MAX_LENGTH))}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            maxLength={MAX_LENGTH}
            rows={1}
            placeholder="ORES AI'ya soru sor (Örn. iade süresi kaç gün?)..."
            aria-label="Mesaj"
            className="max-h-36 min-h-12 w-full resize-none overflow-y-auto rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm leading-5 text-slate-900 placeholder-slate-400 outline-none transition duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50 shadow-sm [field-sizing:content]"
          />
          {nearLimit ? (
            <p
              className={`mt-1.5 px-2 text-[11px] font-medium ${
                value.length >= MAX_LENGTH
                  ? "text-red-600"
                  : "text-slate-400"
              }`}
              aria-live="polite"
            >
              {value.length}/{MAX_LENGTH}
            </p>
          ) : null}
          <p className="mt-1 hidden px-2 text-[10px] text-slate-400 sm:block">
            Enter gönder · Shift+Enter yeni satır
          </p>
        </div>
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="btn-indigo inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold disabled:opacity-40 disabled:hover:scale-100 shadow-[0_6px_20px_rgba(79,70,229,0.3)] sm:px-6"
          aria-label="Gönder"
        >
          <span className="hidden sm:inline">Gönder</span>
          <SendHorizontal className="h-4 w-4 shrink-0" aria-hidden />
        </button>
      </div>
    </form>
  );
}
