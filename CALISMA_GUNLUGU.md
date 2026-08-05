# Çalışma günlüğü

1. Görevi önce zorunlu maddelere böldüm: Auth, pgvector, sohbet geçmişi, kaynak, uydurmama, Vercel.
2. Stack olarak Next.js + Supabase + OpenAI seçtim; görev önerisiyle uyumlu ve tek ekosistemde Auth/DB/RLS var.
3. İlk takıldığım yer: makinede npm yoktu / Git kimliği tanımsızdı; ortamı toparlayınca iskelet kuruldu.(fresh linux :))
4. Şemayı ores.txt’ye birebir map’leyerek kurdum: documents + conversations/messages + match_documents + RLS.
5. Ingest’te 28 ürün + politika chunk’ları (toplam 100) embedding’lendi; yeniden çalıştırılabilir script yazdım.
6. Auth’ta e-posta doğrulamayı açık bıraktım; callback ve redirect URL’leri (local + Vercel) kritik çıktı.
7. Gündelik ve küçük konuşmaları ayırabilmek için; small-talk’ı RAG’den ayırdım, eşiği biraz yükselttim.
8. Vercel env’lerini Production+Preview’a ekledim; Site URL’yi supabase Auth’ta oreschatbot.vercel.app yaptım.
9. Öğrendiklerim: kısa sorgularda vektör arama gürültülü olabiliyor; intent ayrımı + threshold RAG kalitesini ciddi etkiler.
10.Öğrendiklerim: RLS + service_role ayrımı ve .env’nin repoya girmemesi güvenlik puanında temel hijyen.
11. Node.js 20 ortamı için Ingest betiğine WebSocket polifili eklenerek Supabase pgvector indekslemesi sıfır hatayla çalıştırıldı (100 doküman).
12. 10 örnek sorudan oluşan otomatik doğruluk benchmark betiği (`scripts/eval.ts`) yazıldı ve %100 doğruluk (10/10) elde edildi.
13. RAG motorunun bilgi tabanında bulunmayan sorularda uydurma yapmayıp canlı satış danışmanına yönlendirme davranışı ve kaynak gösterimi doğrulandı.
14. Production build (`npm run build`) derlemesi başarıyla tamamlandı.

