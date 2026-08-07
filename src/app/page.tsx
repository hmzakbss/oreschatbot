import Link from "next/link";
import {
  ArrowRight,
  Award,
  Boxes,
  Database,
  Factory,
  FileSearch,
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
import { FloatingChips } from "@/components/landing/FloatingChips";
import { LandingScroller } from "@/components/landing/LandingScroller";
import { Reveal } from "@/components/landing/Reveal";
import { SocialLinks } from "@/components/landing/SocialLinks";

const howItWorks = [
  {
    icon: MessageSquareText,
    step: "1",
    title: "Sorunu yaz",
    text: "Ürün, fiyat, stok veya iade/kargo gibi politika sorularını doğal dilde sorun.",
  },
  {
    icon: Database,
    step: "2",
    title: "Kaynakları bul",
    text: "Asistan ürün kataloğu ve politika belgelerinde semantik arama yapar.",
  },
  {
    icon: FileSearch,
    step: "3",
    title: "Kaynaklı cevap",
    text: "Yanıtın altında hangi kayıttan geldiği görünür; bilgi yoksa uydurmaz.",
  },
];

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

const stats = [
  {
    icon: Globe2,
    title: "Global",
    text: "Almanya ve Avrupa genelinde uluslararası ihracat ağı.",
  },
  {
    icon: Factory,
    title: "ÜR-GE",
    text: "200+ alüminyum profil tasarımı ve sürekli ürün geliştirme.",
  },
  {
    icon: Boxes,
    title: "Modüler",
    text: "Yedek parça ve garanti sonrası uzun ömürlü aksesuar desteği.",
  },
  {
    icon: ShieldCheck,
    title: "Kaynaklı",
    text: "Yanıtlar resmi ürün ve politika kayıtlarına dayanır; yoksa uydurmaz.",
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <LandingScroller>
      <header className="pointer-events-none fixed top-4 sm:top-5 inset-x-0 z-40 mx-auto w-full flex justify-center px-4">
        <nav className="nav-glass pointer-events-auto flex items-center justify-center gap-4 sm:gap-8 rounded-full border border-slate-200/90 bg-white/85 px-6 sm:px-8 py-3.5 sm:py-4 backdrop-blur-2xl shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-3 sm:gap-3.5">
            <div className="font-display text-base sm:text-lg lg:text-xl font-bold tracking-tight text-slate-900">
              ORES <span className="brand-shine font-extrabold">AI Chatbot</span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-200/80 hidden sm:block" />

          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href="https://ores.com.tr/hakkimizda/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 transition-all duration-200 hover:text-indigo-600 hover:bg-indigo-50/80 px-3.5 py-1.5 sm:py-2 rounded-full"
            >
              ores.com.tr
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            {user ? (
              <Link
                href="/sohbet"
                className="btn-indigo animate-cta-pulse inline-flex h-10 sm:h-11 items-center gap-2 rounded-full px-5 sm:px-6 text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20"
              >
                <MessageSquareText className="h-4 w-4" aria-hidden />
                Sohbet
              </Link>
            ) : (
              <Link
                href="/giris"
                className="btn-indigo animate-cta-pulse inline-flex h-10 sm:h-11 items-center gap-2 rounded-full px-5 sm:px-6 text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20"
              >
                <LogIn className="h-4 w-4" aria-hidden />
                Giriş
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* 1 — Hero */}
      <section className="landing-panel">
        <div className="landing-panel-inner mx-auto flex w-full max-w-5xl flex-col items-center justify-center text-center">
          <div className="animate-fade inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-4 py-1.5 text-xs font-medium text-indigo-700 shadow-sm backdrop-blur-md">
            <Award
              className="h-3.5 w-3.5 text-indigo-600"
              aria-hidden
            />
            <span> · 1992’den Beri · </span>
          </div>

          <h1 className="animate-rise font-display mt-5 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Display ve Tanıtımda
            <span className="brand-shine mt-2 block">
              Işık Hızında Yapay Zeka
            </span>
          </h1>

          <p className="animate-rise-delay-1 mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            ORES Mağaza ürünleri ve politikaları hakkında kaynaklı cevaplar.
          </p>

          <div className="animate-rise-delay-2 mt-8 flex flex-wrap justify-center gap-4">
            {user ? (
              <>
                <Link
                  href="/sohbet"
                  className="btn-indigo animate-cta-pulse inline-flex h-12 items-center gap-2.5 rounded-2xl px-7 text-sm font-semibold shadow-lg"
                >
                  <MessageSquareText className="h-4 w-4" aria-hidden />
                  Sohbete Başla
                </Link>
                <form action="/cikis" method="post">
                  <button
                    type="submit"
                    className="btn-ghost glass-panel inline-flex h-12 items-center gap-2 rounded-2xl border-slate-200 px-6 text-sm font-medium text-slate-700"
                  >
                    <LogOut className="h-4 w-4" aria-hidden />
                    Çıkış Yap
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/giris"
                  className="btn-indigo animate-cta-pulse inline-flex h-12 items-center gap-2.5 rounded-2xl px-7 text-sm font-semibold shadow-lg"
                >
                  <LogIn className="h-4 w-4" aria-hidden />
                  Giriş Yap ve Dene
                </Link>
                <Link
                  href="/kayit"
                  className="btn-ghost glass-panel inline-flex h-12 items-center gap-2.5 rounded-2xl border-slate-200 px-6 text-sm font-medium text-slate-700"
                >
                  <Users className="h-4 w-4" aria-hidden />
                  Hesap Oluştur
                </Link>
              </>
            )}
          </div>

          <div className="animate-rise-delay-3 mt-6 w-full">
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-500">
              Bizi takip edin
            </p>
            <SocialLinks reveal={false} />
          </div>

          <div className="animate-rise-delay-3 mt-5 w-full shrink-0 pb-1">
            <FloatingChips />
          </div>
        </div>
      </section>

      {/* 2 — Nasıl çalışır */}
      <section className="landing-panel landing-panel-tint">
        <div className="landing-panel-inner mx-auto w-full max-w-5xl">
          <Reveal variant="blur" className="mx-auto max-w-2xl text-center">
            <p className="section-kicker text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
              Nasıl çalışır?
            </p>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Üç adımda kaynaklı cevap
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              Chatbot yalnızca mağaza kataloğu ve politika metinlerinden yanıt
              üretir; her cevapta kullanılan kayıtları gösterir.
            </p>
          </Reveal>

          <ol className="mt-10 grid gap-5 sm:grid-cols-3">
            {howItWorks.map((item, i) => (
              <Reveal key={item.step} delay={i * 120} variant="up">
                <li className="bento-card bento-card-motion relative overflow-hidden p-6 sm:p-7">
                  <span className="step-number font-display absolute -right-1 -top-2 text-6xl font-bold text-indigo-600/10">
                    {item.step}
                  </span>
                  <div className="card-icon relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600 transition">
                    <item.icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="relative mt-4 text-base font-semibold text-slate-900 sm:text-lg">
                    {item.title}
                  </h3>
                  <p className="relative mt-2 text-sm leading-6 text-slate-600">
                    {item.text}
                  </p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* 3 — Güvenilir üretim gücü */}
      <section className="landing-panel">
        <div className="landing-panel-inner mx-auto w-full max-w-5xl px-6">
          <Reveal variant="up" className="mx-auto max-w-2xl text-center">
            <p className="section-kicker text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
              Güvenilir üretim gücü
            </p>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              1992’den beri reklam ve tanıtım teknolojileri
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item, i) => (
              <Reveal key={item.title} delay={i * 90} variant="scale">
                <div className="bento-card bento-card-motion h-full p-6">
                  <item.icon
                    className="card-icon h-7 w-7 rounded-lg text-indigo-600"
                    aria-hidden
                  />
                  <p className="stat-value font-display mt-4 text-3xl font-bold">
                    {item.title}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm">
                    {item.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4 — Neden ORES */}
      <section className="landing-panel landing-panel-tint">
        <div className="landing-panel-inner mx-auto w-full max-w-5xl px-6">
          <Reveal variant="left" className="max-w-2xl">
            <p className="section-kicker text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
              Neden ORES?
            </p>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Görsel iletişimin olduğu her yerdeyiz
            </h2>
          </Reveal>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2">
            {reasons.map((item, i) => (
              <Reveal
                key={item.title}
                delay={i * 100}
                variant={i % 2 === 0 ? "left" : "right"}
              >
                <li className="bento-card bento-card-motion h-full p-6 sm:p-7">
                  <div className="card-icon inline-flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600 transition">
                    <item.icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900 sm:text-lg">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.text}
                  </p>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* 5 — Üretim yetenekleri */}
      <section className="landing-panel">
        <div className="landing-panel-inner mx-auto w-full max-w-5xl px-6">
          <Reveal variant="blur">
            <p className="section-kicker text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
              Üretim yeteneklerimiz
            </p>
            <h2 className="font-display mt-3 max-w-xl text-3xl font-bold tracking-tight sm:text-5xl">
              Tasarımından sevkiyata tek çatı altında
            </h2>
          </Reveal>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((item, i) => (
              <Reveal key={item.title} delay={i * 80} variant="up">
                <li className="bento-card bento-card-motion h-full p-6">
                  <div className="card-icon inline-flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600 transition">
                    <item.icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs leading-6 text-slate-600 sm:text-sm">
                    {item.text}
                  </p>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* 6 — Lokasyonlar + footer sosyal */}
      <section className="landing-panel landing-panel-tint">
        <div className="landing-panel-inner mx-auto flex w-full max-w-5xl flex-col justify-center px-6">
          <Reveal variant="up">
            <p className="section-kicker text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
              Lokasyonlarımız
            </p>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              İhtiyacınız olan her yerde yanınızdayız
            </h2>
          </Reveal>
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {locations.map((loc, i) => (
              <Reveal key={loc.title} delay={i * 110} variant="scale">
                <li className="bento-card bento-card-motion h-full p-6">
                  <div className="card-icon inline-flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600 transition">
                    <MapPin
                      className="h-5 w-5 animate-bounce-soft"
                      aria-hidden
                    />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">
                    {loc.title}
                  </h3>
                  <p className="mt-2 text-xs leading-6 text-slate-600 sm:text-sm">
                    {loc.detail}
                  </p>
                </li>
              </Reveal>
            ))}
          </ul>

          <div className="mt-12 border-t border-slate-200/80 pt-8">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-center sm:text-left">
                <p className="font-display text-sm font-bold text-slate-900">
                  ORES <span className="brand-shine">AI Chatbot</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  <a
                    href="https://ores.com.tr/hakkimizda/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline transition hover:text-indigo-600"
                  >
                    ores.com.tr
                  </a>
                  {" · "}
                  <a
                    href="https://magaza.ores.com.tr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline transition hover:text-indigo-600"
                  >
                    Mağaza
                  </a>
                </p>
              </div>
              <SocialLinks reveal={false} />
            </div>
          </div>
        </div>
      </section>
    </LandingScroller>
  );
}
