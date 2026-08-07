"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function GirisForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next");

  let next = "/sohbet";
  if (rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")) {
    next = rawNext;
  }

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
    <main className="app-atmosphere flex min-h-full flex-1 flex-col">
      <div className="atmosphere-grid" aria-hidden />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <div className="animate-rise glass-panel rounded-2xl p-7 sm:p-8">
          <Link
            href="/"
            className="font-display text-sm font-semibold tracking-tight text-ink"
          >
            ORES <span className="brand-shine">Chatbot</span>
          </Link>
          <div className="mt-6 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <UserRound className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
                Giriş yap
              </h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Doğrulanmış e-posta ile devam et
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <label className="block text-sm">
              <span className="mb-1.5 flex items-center gap-1.5 font-medium text-ink">
                <Mail className="h-3.5 w-3.5 text-[var(--muted)]" aria-hidden />
                E-posta
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 w-full rounded-xl border border-[var(--line)] bg-white/80 px-3 text-ink outline-none transition focus:border-ink/35 focus:shadow-[0_0_0_4px_rgba(194,120,42,0.12)]"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 flex items-center gap-1.5 font-medium text-ink">
                <LockKeyhole
                  className="h-3.5 w-3.5 text-[var(--muted)]"
                  aria-hidden
                />
                Şifre
              </span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-xl border border-[var(--line)] bg-white/80 px-3 text-ink outline-none transition focus:border-ink/35 focus:shadow-[0_0_0_4px_rgba(194,120,42,0.12)]"
              />
            </label>

            {error ? (
              <p className="animate-rise rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? "Giriş yapılıyor…" : "Giriş yap"}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </form>

          <p className="mt-6 text-sm text-[var(--muted)]">
            Hesabın yok mu?{" "}
            <Link href="/kayit" className="font-medium text-ink underline">
              Kayıt ol
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function GirisPage() {
  return (
    <Suspense
      fallback={
        <main className="app-atmosphere flex min-h-full flex-1 items-center justify-center px-6 py-16 text-sm text-[var(--muted)]">
          Yükleniyor…
        </main>
      }
    >
      <GirisForm />
    </Suspense>
  );
}
