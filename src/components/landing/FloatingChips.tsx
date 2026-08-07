"use client";

/** Hero marquee — 3 / 4 / 5. panel başlıkları */
const CHIPS = [
  // 3 — Güvenilir üretim gücü
  "Global",
  "ÜR-GE",
  "Modüler",
  "Kaynaklı",
  // 4 — Neden ORES?
  "Yaratıcılık ve yenilik",
  "Müşteri odaklı",
  "Sürdürülebilirlik",
  "Kaliteden ödün yok",
  // 5 — Üretim yetenekleri
  "Alüminyum teşhir",
  "Akrilik & metal",
  "Ahşap işleme",
  "Baskı olanakları",
  "Ambalaj & lojistik",
  "Modüler & yedek parça",
];

export function FloatingChips() {
  return (
    <div
      className="relative mx-auto w-full max-w-3xl overflow-x-clip py-2"
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#f8fafc] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#f8fafc] to-transparent" />
      <div className="chip-marquee flex w-max items-center gap-3">
        {[...CHIPS, ...CHIPS].map((label, i) => (
          <span
            key={`${label}-${i}`}
            className="inline-flex h-8 shrink-0 items-center rounded-full border border-indigo-100 bg-white/80 px-3.5 text-[11px] font-semibold leading-none text-indigo-700 shadow-sm backdrop-blur-md"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
