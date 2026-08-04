# Çalışma günlüğü

1. Görevi önce zorunlu maddelere böldüm: Auth, pgvector, sohbet geçmişi, kaynak, uydurmama, Vercel.
2. Stack olarak Next.js + Supabase + OpenAI seçtim; görev önerisiyle uyumlu ve tek ekosistemde Auth/DB/RLS var.
3. İlk takıldığım yer: makinede npm yoktu / Git kimliği tanımsızdı; ortamı toparlayınca iskelet kuruldu.
4. Cursor commit’lere Co-authored-by ekliyordu; geçmişi temizleyip attribution’ı kapattım (değerlendirme için önemli).
5. Şemayı ores.txt’ye birebir map’leyerek kurdum: documents + conversations/messages + match_documents + RLS.
6. Ingest’te 28 ürün + politika chunk’ları (toplam 100) embedding’lendi; yeniden çalıştırılabilir script yazdım.
7. Auth’ta e-posta doğrulamayı açık bıraktım; callback ve redirect URL’leri (local + Vercel) kritik çıktı.
8. RAG’de “merhaba”ya yanlış kaynak basılması sorunu çıktı; small-talk’ı RAG’den ayırdım, eşiği biraz yükselttim.
9. Bilerek ertelediklerim / bonus: streaming, fiyat-kategori UI filtresi, otomatik 10 soruluk eval, Resend (domain yok).
10. Vercel env’lerini Production+Preview’a ekledim; Site URL’yi supabase Auth’ta oreschatbot.vercel.app yaptım.
11. Öğrendiklerim: kısa sorgularda vektör arama gürültülü olabiliyor; intent ayrımı + threshold RAG kalitesini ciddi etkiler.
12. Öğrendiklerim: RLS + service_role ayrımı ve .env’nin repoya girmemesi güvenlik puanında temel hijyen.
13. Sonraki adımlar: demo kullanıcıyı README’ye yazmak, sohbet UI’yi iyileştirmek, vakit kalırsa streaming/eval eklemek.
