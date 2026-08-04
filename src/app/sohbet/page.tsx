import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function SohbetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-col px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500">ORES Chatbot</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            Sohbet
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Giriş başarılı
            {user?.email ? (
              <>
                : <span className="font-medium text-zinc-900">{user.email}</span>
              </>
            ) : null}
            . Chat arayüzü bir sonraki adımda eklenecek.
          </p>
        </div>
        <form action="/cikis" method="post">
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Çıkış
          </button>
        </form>
      </div>

      <div className="mt-10 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-5 py-8 text-sm text-zinc-600">
        RAG sohbet burada olacak. Şimdilik auth akışını doğrulamak için bu
        sayfa korumalı bir placeholder.
      </div>

      <Link
        href="/"
        className="mt-8 text-sm font-medium text-zinc-900 underline"
      >
        Ana sayfaya dön
      </Link>
    </main>
  );
}
