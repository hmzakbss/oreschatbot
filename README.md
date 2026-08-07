<div align="center">

# ORES Chatbot

**Ürün kataloğu + mağaza politikaları üzerinde kaynaklı soru-cevap yapan RAG asistanı**

[![Live Demo](https://img.shields.io/badge/Live-oreschatbot.vercel.app-000?style=for-the-badge&logo=vercel)](https://oreschatbot.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20pgvector-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-gpt--4o--mini-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)

[Canlı Uygulama](https://oreschatbot.vercel.app) · [Çalışma Günlüğü](./CALISMA_GUNLUGU.md) · [Repo](https://github.com/hmzakbss/oreschatbot)

</div>

---

## Özet

ORES Mağaza ürün kataloğu (`data/urunler.csv` — **28 ürün**) ve politikaları (`data/politikalar.md`) üzerinde soru-cevap yapar.

| Davranış | Açıklama |
|:---------|:---------|
| Kaynaklı cevap | Yanıtın hangi kayıt / chunk’tan geldiği gösterilir |
| Grounded RAG | Cevaplar yalnızca bu iki dosyadaki veriye dayanır |
| Uydurmama | Veride yoksa danışmana yönlendirme metni döner |

---

## Özellikler

### Zorunlu

- Supabase Auth — kayıt / giriş / e-posta doğrulama
- Supabase **pgvector** ile semantik arama
- Kullanıcıya bağlı sohbet geçmişi (**RLS**)
- Cevaplarda kaynak gösterimi (`urun` / `politika`)
- Bilgi yoksa uydurmama → satış danışmanına yönlendirme
- **Vercel** üzerinde canlı deploy

### Bonus

| Bonus | Durum |
|:------|:-----:|
| Streaming yanıt (SSE) | ✅ |
| Fiyat / kategori / boyut filtreli arama (tool calling) | ✅ |
| 10 soruluk doğruluk testi (`npm run eval`) | ✅ |
| E-posta doğrulama (Supabase Auth) | ✅ |
| Resend hoş geldin maili | ⏭ atlandı (domain yok) |

---

## Teknoloji

```text
Next.js (App Router) + TypeScript
Supabase  →  Auth · Postgres · pgvector · RLS
OpenAI    →  gpt-4o-mini  ·  text-embedding-3-small
Deploy    →  Vercel
```

---

## Teknik kararlar

| # | Karar | Neden |
|:-:|:------|:------|
| 1 | **Next.js + Supabase** | Auth, DB ve RLS tek yerde; Vercel deploy basit |
| 2 | **Tek `documents` tablosu** | Ürün + politika aynı vektör indeksinde; `source_type` ile ayrılır |
| 3 | **Tool calling + hibrit arama** | “500 TL altı”, kategori, profil kalınlığı için saf embedding yetmez |
| 4 | **RLS + security definer RPC** | Kullanıcı yalnızca kendi sohbetini görür; `documents` istemciye kapalı |
| 5 | **Small-talk ayrımı** | `merhaba` vb. için RAG yok — yanlış kaynak göstermeyi önler |
| 6 | **Secrets hijyeni** | `.env.local` / Vercel env; repoda yok; API anahtarı commit edilmez |

---

## Yerel çalıştırma

```bash
npm install
cp .env.example .env.local
# .env.local değerlerini doldur

# Supabase SQL Editor'da sırayla:
#   supabase/migrations/001_init.sql
#   supabase/migrations/002_restrict_documents_rls.sql

npm run ingest   # 28 ürün + politika chunk → embedding
npm run dev      # http://localhost:3000
npm run eval     # isteğe bağlı: 10 soruluk doğruluk testi
```

<details>
<summary><strong>Gerekli ortam değişkenleri</strong></summary>

<br/>

| Değişken | Açıklama |
|:---------|:---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase proje URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yalnızca sunucu / ingest / eval |
| `OPENAI_API_KEY` | OpenAI API anahtarı |
| `OPENAI_CHAT_MODEL` | `gpt-4o-mini` |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-small` |

Supabase Auth → Site URL ve Redirect URL’lere `http://localhost:3000` ile `https://oreschatbot.vercel.app` (+ `/auth/callback`) eklenmeli.

</details>

---

## Demo kullanıcı

> Değerlendirme için hazır test hesabı

| | |
|:--|:--|
| **E-posta** | `xokab74130@murkstar.com` |
| **Şifre** | `7@nwy'ZHW,.Aa##` |

---

## Bilinçli atlamalar

- **Resend** — domain doğrulaması yoktu; e-posta doğrulama Supabase ile karşılandı
- **Ayrı filtre UI** — fiyat/kategori filtreleme sohbet + tool calling ile çalışıyor

---

## Çalışma günlüğü

Geliştirme notları, takıldıklarım ve öğrendiklerim → [`CALISMA_GUNLUGU.md`](./CALISMA_GUNLUGU.md)

---

<div align="center">

**Design & Development with Excellence by [hmzakbss](https://github.com/hmzakbss)**

</div>
