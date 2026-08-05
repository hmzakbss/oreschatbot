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
    <main className="app-atmosphere min-h-full flex-1 text-slate-800 selection:bg-indigo-600 selection:text-white">
      <div className="atmosphere-grid" aria-hidden />

      {/* Floating Navbar */}
      <header className="fixed top-4 inset-x-0 z-40 mx-auto max-w-5xl px-4">
        <nav className="animate-fade flex items-center justify-between gap-4 rounded-full border border-slate-200/80 bg-white/80 px-6 py-3.5 backdrop-blur-2xl shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-[0_4px_12px_rgba(79,70,229,0.3)]">
              Ö
            </span>
            <div className="font-display text-sm font-semibold tracking-tight text-slate-900">
              ORES <span className="brand-shine font-bold">AI Chatbot</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://ores.com.tr/hakkimizda/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition"
            >
              ores.com.tr
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </a>
            {user ? (
              <Link
                href="/sohbet"
                className="btn-indigo inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-semibold"
              >
                <MessageSquareText className="h-3.5 w-3.5" aria-hidden />
                Sohbet
              </Link>
            ) : (
              <Link
                href="/giris"
                className="btn-indigo inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-semibold"
              >
                <LogIn className="h-3.5 w-3.5" aria-hidden />
                Giriş
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section — Light Mode Bento */}
      <section className="relative mx-auto flex w-full max-w-5xl flex-col px-6 pb-20 pt-32 sm:pt-40">
        <div className="flex flex-col items-center text-center">
          <div className="animate-fade inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-4 py-1.5 text-xs font-medium text-indigo-700 backdrop-blur-md shadow-sm">
            <Award className="h-3.5 w-3.5 text-indigo-600" aria-hidden />
            <span>1992’den Beri · Akıllı RAG Mağaza Asistanı</span>
          </div>

          <h1 className="animate-rise font-display mt-6 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
            Display ve Tanıtımda
            <span className="brand-shine mt-2 block">Işık Hızında Yapay Zeka</span>
          </h1>

          <p className="animate-rise-delay-1 mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            ORES Mağaza ürünleri ve politikaları hakkında sıfır halüsinasyon garantisi ile sorularınızı yanıtlar. Kaynaklı, doğrulanmış ve anlık akıcı sohbet deneyimi.
          </p>

          <div className="animate-rise-delay-2 mt-10 flex flex-wrap justify-center gap-4">
            {user ? (
              <>
                <Link
                  href="/sohbet"
                  className="btn-indigo inline-flex h-13 items-center gap-2.5 rounded-2xl px-7 text-sm font-semibold shadow-lg"
                >
                  <MessageSquareText className="h-4.5 w-4.5" aria-hidden />
                  Sohbete Başla
                </Link>
                <form action="/cikis" method="post">
                  <button
                    type="submit"
                    className="btn-ghost glass-panel inline-flex h-13 items-center gap-2 rounded-2xl px-6 text-sm font-medium text-slate-700 border-slate-200"
                  >
                    <LogOut className="h-4.5 w-4.5" aria-hidden />
                    Çıkış Yap
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/giris"
                  className="btn-indigo inline-flex h-13 items-center gap-2.5 rounded-2xl px-7 text-sm font-semibold shadow-lg"
                >
                  <LogIn className="h-4.5 w-4.5" aria-hidden />
                  Giriş Yap ve Dene
                </Link>
                <Link
                  href="/kayit"
                  className="btn-ghost glass-panel inline-flex h-13 items-center gap-2.5 rounded-2xl px-6 text-sm font-medium text-slate-700 border-slate-200"
                >
                  <Users className="h-4.5 w-4.5" aria-hidden />
                  Hesap Oluştur
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Bento Grid — Biz Kimiz & İstatistikler */}
      <section className="relative border-t border-slate-200/80 bg-white/60 py-20 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
              Güvenilir Üretim Gücü
            </p>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              1992’den Beri Reklam ve Tanıtım Teknolojileri
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bento-card p-6">
              <Globe2 className="h-7 w-7 text-indigo-600" aria-hidden />
              <p className="font-display mt-4 text-3xl font-bold text-slate-900">Global</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Almanya ve Avrupa genelinde uluslararası ihracat ağı.
              </p>
            </div>
            <div className="bento-card p-6">
              <Factory className="h-7 w-7 text-indigo-600" aria-hidden />
              <p className="font-display mt-4 text-3xl font-bold text-slate-900">ÜR-GE</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                200+ alüminyum profil tasarımı ve sürekli ürün geliştirme.
              </p>
            </div>
            <div className="bento-card p-6">
              <Boxes className="h-7 w-7 text-indigo-600" aria-hidden />
              <p className="font-display mt-4 text-3xl font-bold text-slate-900">Modüler</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Yedek parça ve garanti sonrası uzun ömürlü aksesuar desteği.
              </p>
            </div>
            <div className="bento-card p-6">
              <ShieldCheck className="h-7 w-7 text-indigo-600" aria-hidden />
              <p className="font-display mt-4 text-3xl font-bold text-slate-900">%100 Doğruluk</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Yalnızca veritabanındaki resmi bilgilere dayalı cevaplar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid — Neden ORES */}
      <section className="relative py-20">
        <div className="mx-auto w-full max-w-5xl px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
              Neden ORES?
            </p>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-slate-900">
              Görsel İletişimin Olduğu Her Yerdeyiz
            </h2>
          </div>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2">
            {reasons.map((item, i) => (
              <li
                key={item.title}
                className="bento-card p-6"
                style={{ animationDelay: `${0.05 + i * 0.06}s` }}
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <item.icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Production Capabilities */}
      <section className="relative border-y border-slate-200/80 bg-white/70 py-20 text-slate-900 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-5xl px-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
            Üretim Yeteneklerimiz
          </p>
          <h2 className="font-display mt-3 max-w-xl text-3xl font-bold tracking-tight">
            Tasarımından Sevkiyata Tek Çatı Altında
          </h2>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((item) => (
              <li
                key={item.title}
                className="bento-card p-6"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <item.icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-xs leading-6 text-slate-600">
                  {item.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Locations */}
      <section className="relative py-20">
        <div className="mx-auto w-full max-w-5xl px-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
            Lokasyonlarımız
          </p>
          <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-slate-900">
            İhtiyacınız Olan Her Yerde Yanınızdayız
          </h2>
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {locations.map((loc) => (
              <li key={loc.title} className="bento-card p-6">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <MapPin className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">
                  {loc.title}
                </h3>
                <p className="mt-2 text-xs leading-6 text-slate-600">
                  {loc.detail}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Sleek Footer */}
      <footer className="relative border-t border-slate-200 bg-white py-12 text-slate-500">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-sm font-bold text-slate-900">
              ORES AI Chatbot
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Resmi Site:{" "}
              <a
                href="https://ores.com.tr/hakkimizda/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-indigo-600 transition"
              >
                ores.com.tr/hakkimizda
              </a>
            </p>
          </div>
          <div className="flex flex-wrap gap-5 text-xs text-slate-600">
            <a
              href="https://magaza.ores.com.tr"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-slate-900"
            >
              Mağaza
            </a>
            <a
              href="https://ores.com.tr"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-slate-900"
            >
              Kurumsal Site
            </a>
            <Link href="/sohbet" className="transition hover:text-indigo-600 font-semibold">
              Sohbet Uygulaması →
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
