# ORES Chatbot

ORES Mağaza ürünleri (`urunler.csv`) ve politikaları (`politikalar.md`) üzerinde soru-cevap yapan RAG chatbot.

**Canlı:** https://oreschatbot.vercel.app

## Özellikler

- Supabase Auth (kayıt / giriş / e-posta doğrulama)
- pgvector ile semantik arama
- Kullanıcıya bağlı sohbet geçmişi
- Cevaplarda kaynak gösterimi
- Bilgi yoksa uydurmama (danışmana yönlendirme metni)

## Teknoloji

- Next.js (App Router) + TypeScript
- Supabase (Auth, Postgres, pgvector, RLS)
- OpenAI (`gpt-4o-mini` sohbet, `text-embedding-3-small` embedding)
- Vercel deploy

## Teknik kararlar (neden)

1. **Next.js + Supabase:** Görev önerisiyle uyumlu; Auth, DB ve RLS tek yerde.
2. **Tek `documents` tablosu:** Ürün ve politika chunk’ları aynı vektör indeksinde; kaynak tipi `urun` / `politika`.
3. **RLS:** Kullanıcı yalnızca kendi sohbetini görür; `documents` okuma `authenticated`.
4. **Ingest script:** CSV/MD → embedding → Supabase; yeniden çalıştırılabilir (önce temizler).
5. **Small-talk ayrımı:** `merhaba` / `nasılsın` için RAG yok (yanlış kaynak gösterimini önlemek).
6. **Secrets:** `.env.local` / Vercel env; repoda yok (`.gitignore`).

## Yerel çalıştırma

```bash
npm install
cp .env.example .env.local
# .env.local değerlerini doldur

# Supabase SQL Editor'da supabase/migrations/001_init.sql çalıştır
npm run ingest
npm run dev
```

Tarayıcı: http://localhost:3000

### Gerekli env

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (yalnızca sunucu / ingest)
- `OPENAI_API_KEY`
- `OPENAI_CHAT_MODEL=gpt-4o-mini`
- `OPENAI_EMBEDDING_MODEL=text-embedding-3-small`

## Demo kullanıcı

(D3’te eklenecek — test hesabı oluşturulunca e-posta ve şifre buraya yazılacak.)

## Bilinen eksikler / sonraki adımlar

- Ayrı fiyat/kategori filtre UI (bonus; filtreleme sohbet + tool calling ile çalışır)
- Demo kullanıcı bilgisi (aşağıya eklenecek)

## Çalışma günlüğü

Bkz. [`CALISMA_GUNLUGU.md`](./CALISMA_GUNLUGU.md)
