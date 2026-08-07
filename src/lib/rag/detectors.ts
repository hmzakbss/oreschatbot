/** Selamlama / kısa sohbet — RAG ve kaynak göstermeden yanıtlanır */
export function isSmallTalk(question: string): boolean {
  const q = question
    .toLocaleLowerCase("tr")
    .replace(/[?!.,…]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!q || q.length > 100) return false;

  // Bilgi sorusu ipucu varsa small-talk sayma
  if (
    /\b(iade|kargo|fiyat|stok|ürün|urun|profil|politika|sipariş|siparis|ödeme|odeme|kaç gün|kac gun|tl|mm|çerçeve|cerceve|bedava|ücretsiz|ucretsiz)\b/i.test(
      q,
    )
  ) {
    return false;
  }

  const patterns = [
    /^(merhaba|selam|selamlar|hey|hi|hello|günaydın|gunaydin|iyi günler|iyi gunler|iyi akşamlar|iyi aksamlar|iyi geceler)\b/,
    /^(naber|ne haber|nasılsın|nasilsin|nasıl gidiyor|nasil gidiyor|iyi misin|iyi misiniz)\b/,
    /^(iyiyim|çok iyiyim|cok iyiyim|iyi|süper|super|harika|idare eder|fena değil|fena degil)\b/,
    /\b(teşekkürler|tesekkurler|teşekkür|tesekkur|teşekkür ederim|tesekkur ederim|sağ ol|sag ol|sağol|sagol|thanks|thank you)\b/,
    /^(görüşürüz|gorusuruz|hoşça kal|hosca kal|bye|güle güle|gule gule)\b/,
    /^(kimsin|sen kimsin|ne yapabilirsin|ne yapıyorsun|ne yapiyorsun)\b/,
    /^(evet|hayır|hayir|ok|okay|tamam|anladım|anladim|peki)\b/,
  ];

  return patterns.some((re) => re.test(q));
}

/**
 * Soru tipine göre documents.source_type filtresi.
 * - Yalnızca ürün sinyali → "urun"
 * - Yalnızca politika sinyali → "politika"
 * - Karışık / belirsiz → null (filtre yok; yanlış kilitleme yapma)
 */
export function detectSourceTypeFilter(
  question: string,
): "urun" | "politika" | null {
  const q = question
    .toLocaleLowerCase("tr")
    .replace(/[?!.,…]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!q) return null;

  // Türkçe ekler için kelime sonu \b kullanma (çerçeveyi, stokta, ...)
  const hasProduct =
    /fiyat|stok|profil|çerçeve|cerceve|ürün|urun|sku|malzeme|boyut|ölçü|olcu|köşe|kose|renk|ağırlık|agirlik|indirim|afiş|afis|stand|pano|\bmm\b/i.test(
      q,
    ) ||
    /\b(b[0-2]|a[0-4])\b/i.test(q) ||
    /\b[a-z]{1,3}\d{2}\b/i.test(q); // kabaca SKU (örn. m01)

  const hasPolicy =
    /iade|kargo|gizlilik|çerez|cerez|politika|teslimat|değişim|degisim|hasarlı|hasarli|kusurlu|tahkim|şartlar|sartlar|sipariş|siparis|ödeme|odeme|havale|eft|iyzico|sms|kişisel\s*ver|kisisel\s*ver|iletişim|iletisim|çalışma\s*saat|calisma\s*saat|ücretsiz\s*kargo|ucretsiz\s*kargo/i.test(
      q,
    ) ||
    /kaç\s*gün|kac\s*gun|\d+\s*iş\s*gün|\d+\s*is\s*gun/i.test(q);

  if (hasProduct && hasPolicy) return null;
  if (hasProduct) return "urun";
  if (hasPolicy) return "politika";
  return null;
}

export function detectCategoryFilter(question: string): string | null {
  const q = question.toLocaleLowerCase("tr");
  if (/afiş\s*çerçevesi|afis\s*cercevesi|çerçeve|cerceve/i.test(q)) {
    return "Afiş Çerçevesi";
  }
  return null;
}

export function detectSizeFilter(question: string): string | null {
  const q = question
    .toLocaleLowerCase("tr")
    .replace(/[?!.,…]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!q) return null;

  // Genel politika / kargo sorularını boyut filtresine sokma
  if (/iade|kargo|teslimat|ödeme|odeme|gizlilik|çerez|cerez/i.test(q)) {
    return null;
  }

  // A0-A4, B1-B3 ve 70x100 gibi ölçü desenlerini yakala
  const matches = q.match(/\b(a[0-4]|b[1-3]|\d{2,3}x\d{2,3})\b/gi);
  if (!matches) return null;

  const uniqueSizes = Array.from(
    new Set(matches.map((s) => s.toUpperCase())),
  );

  // Yalnızca tek bir boyut belirtilmişse kesin filtre döndür
  if (uniqueSizes.length === 1) {
    return uniqueSizes[0];
  }

  return null;
}

export function detectMaxPriceFilter(question: string): number | null {
  const q = question.toLocaleLowerCase("tr");
  if (/kargo|iade|teslimat|sepet|sipariş|siparis/i.test(q)) {
    return null;
  }
  const match = q.match(
    /(\d+)\s*(?:tl|lira)?\s*(?:altı|altında|altındaki|den ucuz|den az|den küçük|küçük|kadar|ve altı)/i,
  );
  if (match && match[1]) {
    const val = Number(match[1]);
    if (!Number.isNaN(val) && val > 0) {
      return val;
    }
  }
  return null;
}
