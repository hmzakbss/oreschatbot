import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center px-6 py-20">
      <p className="text-sm font-medium tracking-wide text-zinc-500">
        magaza.ores.com.tr
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-900">
        ORES Chatbot
      </h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-zinc-600">
        Ürünler ve mağaza politikaları hakkında soru sor. Cevaplar yalnızca
        bilgi tabanına dayanır; kaynak gösterilir.
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        {user ? (
          <>
            <Link
              href="/sohbet"
              className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Sohbete git
            </Link>
            <form action="/cikis" method="post">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 px-5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              >
                Çıkış ({user.email})
              </button>
            </form>
          </>
        ) : (
          <>
            <Link
              href="/giris"
              className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Giriş yap
            </Link>
            <Link
              href="/kayit"
              className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 px-5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Kayıt ol
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
