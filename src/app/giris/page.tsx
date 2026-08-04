"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function GirisForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/sohbet";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium text-zinc-500">ORES Chatbot</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
        Giriş yap
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        E-posta doğrulamasını tamamladıktan sonra giriş yapabilirsin.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">E-posta</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-zinc-900 outline-none focus:border-zinc-500"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700">Şifre</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-zinc-900 outline-none focus:border-zinc-500"
          />
        </label>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {loading ? "Giriş yapılıyor…" : "Giriş yap"}
        </button>
      </form>

      <p className="mt-6 text-sm text-zinc-600">
        Hesabın yok mu?{" "}
        <Link href="/kayit" className="font-medium text-zinc-900 underline">
          Kayıt ol
        </Link>
      </p>
    </main>
  );
}

export default function GirisPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-full w-full max-w-md items-center justify-center px-6 py-16 text-sm text-zinc-600">
          Yükleniyor…
        </main>
      }
    >
      <GirisForm />
    </Suspense>
  );
}
