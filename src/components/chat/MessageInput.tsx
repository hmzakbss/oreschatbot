"use client";

import { FormEvent, useState } from "react";

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
      className="border-t border-zinc-200 bg-white px-4 py-4 sm:px-6"
    >
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          placeholder="Örn. iade süresi kaç gün?"
          className="h-11 flex-1 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-500 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          Gönder
        </button>
      </div>
    </form>
  );
}
