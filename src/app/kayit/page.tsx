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
import { translateAuthError } from "@/lib/auth-errors";

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

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
      setError(translateAuthError(signUpError.message));
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
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600">
              <MailCheck className="h-6 w-6" aria-hidden />
            </span>
            <h1 className="font-display mt-5 text-3xl font-semibold tracking-tight text-slate-900">
              E-postanı doğrula
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              <span className="font-medium text-slate-900">{email}</span>{" "}
              adresine doğrulama bağlantısı gönderdik. Bağlantıya tıkladıktan
              sonra giriş yapabilirsin.
            </p>
            <Link
              href="/giris"
              className="btn-indigo mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold"
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
            className="font-display text-sm font-semibold tracking-tight text-slate-900"
          >
            ORES <span className="brand-shine">Chatbot</span>
          </Link>
          <div className="mt-6 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600">
              <UserPlus className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900">
                Kayıt ol
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Doğrulama maili zorunludur
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </label>

            {error ? (
              <p
                role="alert"
                className="animate-rise rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="btn-indigo inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? "Kaydediliyor…" : "Kayıt ol"}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500">
            Zaten hesabın var mı?{" "}
            <Link
              href="/giris"
              className="font-medium text-indigo-600 underline underline-offset-2"
            >
              Giriş yap
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
