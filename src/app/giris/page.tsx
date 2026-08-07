"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/auth-errors";

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

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
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(translateAuthError(signInError.message));
      return;
    }

    router.push(next);
    router.refresh();
  }

  async function onForgotPassword() {
    setError(null);
    setInfo(null);

    if (!email.trim()) {
      setError("Şifre sıfırlamak için önce e-posta adresinizi girin.");
      return;
    }

    setResetting(true);
    const supabase = createClient();
    const origin = window.location.origin;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${origin}/auth/callback?next=/sohbet`,
      },
    );
    setResetting(false);

    if (resetError) {
      setError(translateAuthError(resetError.message));
      return;
    }

    setInfo(
      "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi (spam klasörünü de kontrol edin).",
    );
  }

  return (
    <main className="app-atmosphere flex min-h-full flex-1 flex-col">
      <div className="atmosphere-grid" aria-hidden />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <div className="animate-rise glass-panel rounded-2xl p-7 sm:p-8">
          <Link
            href="/"
            className="font-display text-sm font-semibold tracking-tight text-slate-900"
          >
            ORES <span className="brand-shine">Chatbot</span>
          </Link>
          <div className="mt-6 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <UserRound className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900">
                Giriş yap
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Doğrulanmış e-posta ile devam et
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <label className="block text-sm">
              <span className="mb-1.5 flex items-center gap-1.5 font-medium text-slate-900">
                <Mail className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                E-posta
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 flex items-center gap-1.5 font-medium text-slate-900">
                <LockKeyhole className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                Şifre
              </span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </label>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void onForgotPassword()}
                disabled={resetting || loading}
                className="text-xs font-medium text-indigo-600 hover:underline disabled:opacity-50"
              >
                {resetting ? "Gönderiliyor…" : "Şifremi unuttum"}
              </button>
            </div>

            {error ? (
              <p
                role="alert"
                className="animate-rise rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </p>
            ) : null}

            {info ? (
              <p
                role="status"
                className="animate-rise rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
              >
                {info}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="btn-indigo inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? "Giriş yapılıyor…" : "Giriş yap"}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500">
            Hesabın yok mu?{" "}
            <Link
              href="/kayit"
              className="font-medium text-indigo-600 underline underline-offset-2"
            >
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
        <main className="app-atmosphere flex min-h-full flex-1 items-center justify-center px-6 py-16 text-sm text-slate-500">
          Yükleniyor…
        </main>
      }
    >
      <GirisForm />
    </Suspense>
  );
}
