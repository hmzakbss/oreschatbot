"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function KayitPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const origin = window.location.origin;

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/sohbet`,
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setPendingEmail(true);
  }

  if (pendingEmail) {
    return (
      <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          E-postanı doğrula
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          <span className="font-medium text-zinc-900">{email}</span> adresine
          doğrulama bağlantısı gönderdik. Bağlantıya tıkladıktan sonra giriş
          yapabilirsin.
        </p>
        <Link
          href="/giris"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Giriş sayfasına git
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium text-zinc-500">ORES Chatbot</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
        Kayıt ol
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        Hesap oluşturmak için e-posta ve şifre gir. Doğrulama maili zorunlu.
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
            autoComplete="new-password"
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
          {loading ? "Kaydediliyor…" : "Kayıt ol"}
        </button>
      </form>

      <p className="mt-6 text-sm text-zinc-600">
        Zaten hesabın var mı?{" "}
        <Link href="/giris" className="font-medium text-zinc-900 underline">
          Giriş yap
        </Link>
      </p>
    </main>
  );
}
