import type { SupabaseClient } from "@supabase/supabase-js";
import { CHAT_MODEL, EMBEDDING_MODEL, getOpenAI } from "@/lib/openai";

export const NO_INFO_REPLY =
  "Bu konuda elimde net bir bilgi yok, isterseniz sizi yetkili satış danışmanımıza yönlendirebilirim.";

export type MatchedDocument = {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  source_type: "urun" | "politika";
  source_id: string;
  source_title: string;
  similarity: number;
};

export type ChatSource = {
  source_type: "urun" | "politika";
  source_id: string;
  source_title: string;
  similarity: number;
  urun_url?: string | null;
};

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

export type AnswerResult = {
  content: string;
  sources: ChatSource[];
  /** Yalnızca 'rag' iken kaynak gösterilir */
  mode: "rag" | "small_talk" | "no_info";
};

export async function generateSmallTalkReply(
  question: string,
): Promise<AnswerResult> {
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content: `Sen ORES Mağaza müşteri asistanısın. Kullanıcı kısa bir selamlama veya sohbet sorusu sordu.

Kurallar:
- Nazik, kısa Türkçe cevap ver (1-2 cümle).
- Ürün, fiyat, stok, kargo, iade gibi mağaza bilgisi uydurma.
- Kendini ORES asistanı olarak tanıtabilir; ürün/politika sorularında yardımcı olabileceğini söyle.
- Kaynak uydurma; bilgi tabanı iddiası yapma.`,
      },
      { role: "user", content: question },
    ],
  });

  const content =
    completion.choices[0]?.message?.content?.trim() ||
    "Merhaba! ORES Mağaza asistanıyım. Ürün veya politikalar hakkında sorabilirsiniz.";

  return { content, sources: [], mode: "small_talk" };
}

export async function embedQuery(text: string): Promise<number[]> {
  const openai = getOpenAI();
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  const embedding = response.data[0]?.embedding;
  if (!embedding) {
    throw new Error("Embedding üretilemedi");
  }
  return embedding;
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

export type PreviousMessage = {
  role: "user" | "assistant";
  content: string;
};

/**
 * Kullanıcının sohbet geçmişini analiz eder ve takipli kısaltılmış soruları
 * bağımsız arama sorgusuna dönüştürür.
 */
export async function contextualizeQuery(
  question: string,
  history: PreviousMessage[],
): Promise<string> {
  if (!history || history.length === 0) {
    return question;
  }

  const openai = getOpenAI();
  const historyText = history
    .slice(-4)
    .map((m) => `${m.role === "user" ? "Kullanıcı" : "Asistan"}: ${m.content}`)
    .join("\n");

  try {
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.0,
      messages: [
        {
          role: "system",
          content: `Sana bir sohbet geçmişi ve kullanıcının son sorusu verilecek.
Görevin: Sohbet geçmişine dayanarak, kullanıcının son sorusunu TEK BAŞINA ANLAŞILIR VE ARANABİLİR net bir arama cümlesine dönüştürmektir.

KURALLAR:
- Soruyu yanıtlama, sadece soruyu net arama ifadesine dönüştür.
- Kullanıcının sorusu zaten tek başına netse, olduğu gibi bırak.
- Yanıt olarak SADECE dönüştürülmüş net arama cümlesini yaz. Başka hiçbir açıklama ekleme.`,
        },
        {
          role: "user",
          content: `SOHBET GEÇMİŞİ:\n${historyText}\n\nSON SORU:\n${question}`,
        },
      ],
    });

    const rewritten = completion.choices[0]?.message?.content?.trim();
    return rewritten || question;
  } catch (err) {
    console.error("contextualizeQuery hatası:", err);
    return question;
  }
}

export async function matchDocuments(
  supabase: SupabaseClient,
  queryEmbedding: number[],
  options?: {
    matchCount?: number;
    matchThreshold?: number;
    filterSourceType?: string | null;
    filterCategory?: string | null;
    filterMaxPrice?: number | null;
  },
): Promise<MatchedDocument[]> {
  const threshold =
    options?.matchThreshold ?? (options?.filterMaxPrice ? 0.1 : 0.35);

  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_count: options?.matchCount ?? 6,
    filter_source_type: options?.filterSourceType ?? null,
    filter_category: options?.filterCategory ?? null,
    filter_max_price: options?.filterMaxPrice ?? null,
    match_threshold: threshold,
  });

  if (error) {
    throw new Error(`match_documents hatası: ${error.message}`);
  }

  return (data ?? []) as MatchedDocument[];
}

export function filterUsedSources(
  matches: MatchedDocument[],
  answerContent: string,
): MatchedDocument[] {
  const contentLower = answerContent.toLocaleLowerCase("tr");

  const used = matches.filter((m) => {
    const titleLower = m.source_title.toLocaleLowerCase("tr");
    const idLower = m.source_id.toLocaleLowerCase("tr");

    if (idLower.length > 2 && contentLower.includes(idLower)) return true;
    if (titleLower.length > 2 && contentLower.includes(titleLower)) return true;

    const cleanTitle = titleLower.replace(/[^a-z0-9çğıöşü\s]/gi, " ");
    const words = cleanTitle.split(/\s+/).filter((w) => w.length > 3);
    if (words.length >= 2) {
      const firstTwo = words.slice(0, 2).join(" ");
      if (contentLower.includes(firstTwo)) return true;
    }

    return false;
  });

  return used.length > 0 ? used : matches.slice(0, 2);
}

export function toSources(matches: MatchedDocument[]): ChatSource[] {
  return matches.map((m) => {
    const url = m.metadata?.urun_url;
    return {
      source_type: m.source_type,
      source_id: m.source_id,
      source_title: m.source_title,
      similarity: Number(m.similarity.toFixed(4)),
      urun_url: typeof url === "string" ? url : null,
    };
  });
}

export function buildContext(matches: MatchedDocument[]): string {
  return matches
    .map(
      (m, i) =>
        `[Kaynak ${i + 1}] (${m.source_type} | ${m.source_id} | ${m.source_title})\n${m.content}`,
    )
    .join("\n\n---\n\n");
}

export async function generateAnswer(
  question: string,
  matches: MatchedDocument[],
): Promise<AnswerResult> {
  if (matches.length === 0) {
    return { content: NO_INFO_REPLY, sources: [], mode: "no_info" };
  }

  const openai = getOpenAI();
  const context = buildContext(matches);

  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: `Sen ORES Mağaza müşteri asistanısın. Yalnızca aşağıda verilen KAYNAK metinlerine dayanarak Türkçe cevap ver.

Kurallar:
- Kaynaklarda olmayan bilgiyi uydurma.
- Emin değilsen veya kaynaklar soruyu karşılamıyorsa aynen şu cümleyi yaz: "${NO_INFO_REPLY}"
- Fiyat, stok, profil kalınlığı, iade, kargo gibi iddiaları yalnızca kaynaklardan al.
- Kısa ve net cevap ver.
- Kaynak numaralarını cevabın içinde yazma; kaynaklar ayrıca gösterilecek.`,
      },
      {
        role: "user",
        content: `KAYNAKLAR:\n${context}\n\nSORU:\n${question}`,
      },
    ],
  });

  const content =
    completion.choices[0]?.message?.content?.trim() || NO_INFO_REPLY;

  if (!content || content.includes("elimde net bir bilgi yok")) {
    return { content: NO_INFO_REPLY, sources: [], mode: "no_info" };
  }

  const usedMatches = filterUsedSources(matches, content);
  return { content, sources: toSources(usedMatches), mode: "rag" };
}
