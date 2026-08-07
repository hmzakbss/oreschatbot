<div align="center">

# Çalışma Günlüğü

**ORES Chatbot** — süreç notları, takıldıklarım ve öğrendiklerim

[← README’ye dön](./README.md)

</div>

---

## Notlar

| # | | Not |
|:-:|:-:|:----|
| 01 | 🎯 | Görevi zorunlu maddelere böldüm: Auth, pgvector, sohbet geçmişi, kaynak, uydurmama, Vercel; bonusları sonraya bıraktım. |
| 02 | 🧱 | Stack olarak **Next.js + Supabase + OpenAI** seçtim; öneriyle uyumlu ve Auth / DB / RLS tek ekosistemde. |
| 03 | 🛠️ | İlk takıldığım yer: taze Linux kurulumunda npm / ortam eksikleri; iskeleti kurunca ilerleme hızlandı. |
| 04 | 🗄️ | Şemayı gereksinimlere map’ledim: `documents` + `conversations` / `messages` + `match_documents` + RLS. |
| 05 | 📦 | Ingest’te **28 ürün** + politika chunk’ları embedding’lendi; script yeniden çalıştırılabilir. Node 20 için WebSocket polyfill gerekti. |
| 06 | 🔐 | Auth’ta e-posta doğrulamayı açık bıraktım; local + Vercel redirect URL’leri kritik çıktı. |
| 07 | 🔎 | Kısa sorgularda vektör arama gürültülüydü → small-talk ayrımı, eşik ayarı, sonra **tool calling** ile fiyat / kategori filtreleri. |
| 08 | 🚫 | Bilgi yoksa uydurmama davranışını sabit metin + system prompt ile kilitledim; eval’de bilerek “yok” sorularıyla test ettim. |
| 09 | ⚡ | Streaming (**SSE**), hibrit arama ve 10 soruluk `scripts/eval.ts` eklendi; eval’de **10/10** doğruluk gördüm. |
| 10 | 🛡️ | Güvenlikte `documents` istemci SELECT’ini kapattım (RPC), open redirect ve rate limit düzelttim; `.env` repoya girmedi. |
| 11 | ⏭ | **Resend**’i bilinçli atladım (domain yok); e-posta doğrulama Supabase ile yeterli sayıldı. |
| 12 | 💡 | Öğrendiklerim: RAG kalitesi çoğunlukla **retrieval + intent/filtre** tasarımından geliyor; model tek başına yetmiyor. RLS / `service_role` ayrımı güvenlik hijyeninin temeli. |

---

<div align="center">

**Design & Development with Excellence by [hmzakbss](https://github.com/hmzakbss)**

</div>
