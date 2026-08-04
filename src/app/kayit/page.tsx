"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ArrowRight,
  LockKeyhole,
  Mail,
  MailCheck,
  UserPlus,
} from "lucide-react";
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
      <main className="app-atmosphere flex min-h-full flex-1 flex-col">
        <div className="atmosphere-grid" aria-hidden />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
          <div className="animate-rise glass-panel rounded-2xl p-7 sm:p-8">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <MailCheck className="h-6 w-6" aria-hidden />
            </span>
            <h1 className="font-display mt-5 text-3xl font-semibold tracking-tight text-ink">
              E-postanı doğrula
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              <span className="font-medium text-ink">{email}</span> adresine
              doğrulama bağlantısı gönderdik. Bağlantıya tıkladıktan sonra giriş
              yapabilirsin.
            </p>
            <Link
              href="/giris"
              className="btn-primary mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-medium text-white"
            >
              Giriş sayfasına git
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </main>
    );
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
              <UserPlus className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
                Kayıt ol
              </h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Doğrulama maili zorunludur
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
                autoComplete="new-password"
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
              {loading ? "Kaydediliyor…" : "Kayıt ol"}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </form>

          <p className="mt-6 text-sm text-[var(--muted)]">
            Zaten hesabın var mı?{" "}
            <Link href="/giris" className="font-medium text-ink underline">
              Giriş yap
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
