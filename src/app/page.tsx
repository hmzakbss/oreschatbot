import Link from "next/link";
import {
  ArrowRight,
  Award,
  Boxes,
  Factory,
  Globe2,
  Leaf,
  LogIn,
  LogOut,
  MapPin,
  MessageSquareText,
  Package,
  Printer,
  Recycle,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const reasons = [
  {
    icon: Sparkles,
    title: "Yaratıcılık ve yenilik",
    text: "Ürün geliştirmede uzman ekip; görsel iletişimde yenilikçi çözümler.",
  },
  {
    icon: Users,
    title: "Müşteri odaklı",
    text: "Her işletmenin ihtiyacı farklıdır; kişiselleştirilmiş ürünler üretiriz.",
  },
  {
    icon: Leaf,
    title: "Sürdürülebilirlik",
    text: "Doğa dostu üretim, eşitlik ve uzun ömürlü / onarılabilir ürün anlayışı.",
  },
  {
    icon: ShieldCheck,
    title: "Kaliteden ödün yok",
    text: "1992’den beri kalite ilk prensibimiz; malzeme ve süreçlerin arkasındayız.",
  },
];

const capabilities = [
  {
    icon: Boxes,
    title: "Alüminyum teşhir",
    text: "200+ profil tasarımı; tasarımından paketlemeye kendi tesisimizde.",
  },
  {
    icon: Wrench,
    title: "Akrilik & metal",
    text: "Lazer kesim, büküm, CNC ve metal işleme ile hassas üretim.",
  },
  {
    icon: Factory,
    title: "Ahşap işleme",
    text: "CNC ve kenar bantlama ile satış noktalarına doğal görünüm.",
  },
  {
    icon: Printer,
    title: "Baskı olanakları",
    text: "Serigraf, UV, süblimasyon, lazer markalama ve daha fazlası.",
  },
  {
    icon: Package,
    title: "Ambalaj & lojistik",
    text: "Kendi paketleme sürecimiz; yurt içi ve uluslararası sevkiyat.",
  },
  {
    icon: Recycle,
    title: "Modüler & yedek parça",
    text: "Garanti sonrası bile onarım ve aksesuar ile uzun ömür.",
  },
];

const locations = [
  {
    title: "Merkez",
    detail: "Hürriyet Mah. Mülkiye Sok. No:15/A, Kartal / İstanbul",
  },
  {
    title: "Fabrika",
    detail: "1. OSB 2. Cadde No:12, Arifiye / Sakarya",
  },
  {
    title: "Almanya ofis",
    detail: "Hinter Hoben 149, 53129 Bonn",
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="app-atmosphere min-h-full flex-1">
      <div className="atmosphere-grid" aria-hidden />

      {/* Hero — tek kompozisyon */}
      <section className="relative mx-auto flex w-full max-w-5xl flex-col px-6 pb-16 pt-10 sm:pt-14">
        <nav className="animate-fade flex items-center justify-between gap-4">
          <div className="font-display text-sm font-semibold tracking-tight text-ink">
            ORES <span className="brand-shine">Chatbot</span>
          </div>
          <a
            href="https://ores.com.tr/hakkimizda/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] transition hover:text-ink"
          >
            ores.com.tr
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </a>
        </nav>

        <div className="mt-16 sm:mt-24">
          <p className="animate-fade inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
            <Award className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden />
            1992’den beri · ORES Tanıtım Sistemleri
          </p>

          <h1 className="animate-rise font-display mt-5 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tight text-ink sm:text-7xl">
            ORES
            <span className="brand-shine mt-1 block">Chatbot</span>
          </h1>

          <p className="animate-rise-delay-1 mt-6 max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg">
            Görsel iletişimin olduğu her yerdeyiz. Bu asistan; mağaza ürünleri
            ve politikalar hakkında yalnızca bilgi tabanına dayanarak cevap
            verir, kaynağını da gösterir.
          </p>

          <div className="animate-rise-delay-2 mt-10 flex flex-wrap gap-3">
            {user ? (
              <>
                <Link
                  href="/sohbet"
                  className="btn-primary inline-flex h-12 items-center gap-2 rounded-xl bg-ink px-6 text-sm font-medium text-white"
                >
                  <MessageSquareText className="h-4 w-4" aria-hidden />
                  Sohbete git
                </Link>
                <form action="/cikis" method="post">
                  <button
                    type="submit"
                    className="btn-ghost glass-panel inline-flex h-12 items-center gap-2 rounded-xl px-5 text-sm font-medium text-ink"
                  >
                    <LogOut className="h-4 w-4" aria-hidden />
                    Çıkış
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/giris"
                  className="btn-primary inline-flex h-12 items-center gap-2 rounded-xl bg-ink px-6 text-sm font-medium text-white"
                >
                  <LogIn className="h-4 w-4" aria-hidden />
                  Giriş yap
                </Link>
                <Link
                  href="/kayit"
                  className="btn-ghost glass-panel inline-flex h-12 items-center gap-2 rounded-xl px-5 text-sm font-medium text-ink"
                >
                  <Users className="h-4 w-4" aria-hidden />
                  Kayıt ol
                </Link>
              </>
            )}
          </div>

          {user?.email ? (
            <p className="mt-5 text-sm text-[var(--muted)]">{user.email}</p>
          ) : null}
        </div>
      </section>

      {/* Biz kimiz */}
      <section className="relative border-t border-[var(--line)] bg-white/35 py-16 backdrop-blur-sm">
        <div className="mx-auto grid w-full max-w-5xl gap-10 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="animate-rise">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--accent)]">
              Biz kimiz?
            </p>
            <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Reklam ve tanıtımda 1992’den beri üretiyoruz
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--muted)] sm:text-base">
              ORES; afiş çerçevelerinden teşhir ünitelerine, baskıdan lojistiğe
              kadar display dünyasında tasarım ve üretim sunar. Kaliteyi ilk
              prensip kabul eder; ürünlerinin arkasında durur.
            </p>
          </div>
          <div className="animate-rise-delay-1 grid grid-cols-2 gap-3">
            <div className="glass-panel rounded-2xl p-4">
              <Globe2 className="h-5 w-5 text-[var(--accent)]" aria-hidden />
              <p className="font-display mt-3 text-2xl font-semibold text-ink">
                Global
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Ürünler birçok ülkeye ulaşıyor
              </p>
            </div>
            <div className="glass-panel rounded-2xl p-4">
              <Factory className="h-5 w-5 text-[var(--accent)]" aria-hidden />
              <p className="font-display mt-3 text-2xl font-semibold text-ink">
                ÜR-GE
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Sürekli ürün geliştirme
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Neden ORES */}
      <section className="relative py-16">
        <div className="mx-auto w-full max-w-5xl px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--accent)]">
              Neden ORES?
            </p>
            <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-ink">
              Görsel iletişimin olduğu her yerdeyiz
            </h2>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {reasons.map((item, i) => (
              <li
                key={item.title}
                className="chip-enter glass-panel rounded-2xl p-5"
                style={{ animationDelay: `${0.05 + i * 0.06}s` }}
              >
                <item.icon
                  className="h-5 w-5 text-[var(--accent)]"
                  aria-hidden
                />
                <h3 className="mt-3 text-sm font-semibold text-ink">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {item.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Yetenekler */}
      <section className="relative border-y border-[var(--line)] bg-ink py-16 text-white">
        <div className="mx-auto w-full max-w-5xl px-6">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--accent)]">
            Üretim yetenekleri
          </p>
          <h2 className="font-display mt-3 max-w-xl text-3xl font-semibold tracking-tight">
            Tasarımından sevkiyata, tek çatı altında
          </h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((item) => (
              <li
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"
              >
                <item.icon
                  className="h-5 w-5 text-[var(--accent)]"
                  aria-hidden
                />
                <h3 className="mt-3 text-sm font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  {item.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Lokasyon */}
      <section className="relative py-16">
        <div className="mx-auto w-full max-w-5xl px-6">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--accent)]">
            Lokasyonlarımız
          </p>
          <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-ink">
            İhtiyacınız olan yerde yanınızdayız
          </h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {locations.map((loc) => (
              <li key={loc.title} className="glass-panel rounded-2xl p-5">
                <MapPin
                  className="h-5 w-5 text-[var(--accent)]"
                  aria-hidden
                />
                <h3 className="mt-3 text-sm font-semibold text-ink">
                  {loc.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {loc.detail}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-[var(--line)] bg-white/40 py-10 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-sm font-semibold text-ink">
              ORES Chatbot
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Kaynak:{" "}
              <a
                href="https://ores.com.tr/hakkimizda/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-ink"
              >
                ores.com.tr/hakkimizda
              </a>
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-[var(--muted)]">
            <a
              href="https://magaza.ores.com.tr"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-ink"
            >
              Mağaza
            </a>
            <a
              href="https://ores.com.tr"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-ink"
            >
              Kurumsal site
            </a>
            <Link href="/sohbet" className="transition hover:text-ink">
              Sohbet
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
