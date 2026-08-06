import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatCompletionTool } from "openai/resources/chat/completions";
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

/** Bir ürün dokümanının geçerli satış fiyatını hesaplar (varsa indirimli fiyat, yoksa normal fiyat) */
export function getEffectivePrice(doc: MatchedDocument): number {
  const disc = doc.metadata?.indirimli_fiyat_tl;
  if (disc != null && disc !== "" && !Number.isNaN(Number(disc))) {
    return Number(disc);
  }
  return Number(doc.metadata?.fiyat_tl || 0);
}

export const RAG_TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_products",
      description:
        "ORES mağaza ürün kataloğunda arama, renk, profil kalınlığı, köşe tipi (Rondo/Gönye), kategori, malzeme, indirim durumu, stok kodu (SKU), boyut filtreleme ve fiyat/stok sıralaması yapar.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          query: {
            type: ["string", "null"],
            description: "Arama kelimesi (örn. çerçeve, ahşap, alüminyum, rondo, gönye)",
          },
          sku: {
            type: ["string", "null"],
            description: "Ürün stok kodu (örn. M01 PFSS 25 070100 TKx)",
          },
          size: {
            type: ["string", "null"],
            description: "Ürün boyutu (örn. A4, A3, A1, B1, B2, 70x100)",
          },
          color: {
            type: ["string", "null"],
            description: "Ürün rengi (örn. Kırmızı, Siyah, Gümüş, Kahverengi)",
          },
          profile_thickness_mm: {
            type: ["number", "null"],
            description: "Profil kalınlığı mm cinsinden (örn. 25, 32)",
          },
          corner_type: {
            type: ["string", "null"],
            description: "Köşe tipi (örn. Rondo, Gönye)",
          },
          category: {
            type: ["string", "null"],
            description: "Kategori (örn. Afiş Çerçevesi, Reklam Panosu)",
          },
          material: {
            type: ["string", "null"],
            description: "Gövde malzemesi (örn. Alüminyum, Ahşap, Plastik)",
          },
          is_discounted: {
            type: ["boolean", "null"],
            description: "Yalnızca indirimdeki ürünleri filtrele (true/false)",
          },
          max_weight_kg: {
            type: ["number", "null"],
            description: "Maksimum ağırlık kg cinsinden",
          },
          sort_by: {
            type: ["string", "null"],
            enum: ["price_desc", "price_asc", "stock_desc", "relevance", null],
            description:
              "Sıralama: price_desc (en pahalı), price_asc (en ucuz), stock_desc (en çok stok), relevance (varsayılan)",
          },
          min_price: {
            type: ["number", "null"],
            description: "Minimum fiyat TL",
          },
          max_price: {
            type: ["number", "null"],
            description: "Maksimum fiyat TL",
          },
          limit: {
            type: ["number", "null"],
            description: "Getirilecek maksimum ürün sayısı (varsayılan: 5)",
          },
        },
        required: [
          "query",
          "sku",
          "size",
          "color",
          "profile_thickness_mm",
          "corner_type",
          "category",
          "material",
          "is_discounted",
          "max_weight_kg",
          "sort_by",
          "min_price",
          "max_price",
          "limit",
        ],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_policy_info",
      description:
        "İade şartları, kargo ücreti, teslimat süreleri ve mağaza politikaları hakkında bilgi arar.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "Politika arama terimi (örn. iade, kargo, ödeme)",
          },
        },
        required: ["topic"],
        additionalProperties: false,
      },
    },
  },
];

export type ProductSearchArgs = {
  query?: string | null;
  sku?: string | null;
  size?: string | null;
  color?: string | null;
  profile_thickness_mm?: number | null;
  corner_type?: string | null;
  category?: string | null;
  material?: string | null;
  is_discounted?: boolean | null;
  max_weight_kg?: number | null;
  sort_by?: "price_desc" | "price_asc" | "stock_desc" | "relevance" | null;
  min_price?: number | null;
  max_price?: number | null;
  limit?: number | null;
};

export async function executeProductSearch(
  supabase: SupabaseClient,
  args: ProductSearchArgs,
  userQuery = "",
): Promise<MatchedDocument[]> {
  const desiredLimit = Math.max(args.limit ?? 5, 3);

  // Belirli bir filtre veya sıralama varsa verileri hafızada tam filtrelere göre süz
  const { data, error } = await supabase
    .from("documents")
    .select("id, content, metadata, source_type, source_id, source_title")
    .eq("source_type", "urun");

  if (!error && data && data.length > 0) {
    let docs = data as MatchedDocument[];
    let isFiltered = false;

    // SKU Koduna Göre Tam Eşleşme
    if (args.sku) {
      const cleanSku = args.sku.trim().toUpperCase();
      const skuMatched = docs.filter(
        (d) =>
          d.source_id.toUpperCase().includes(cleanSku) ||
          d.source_title.toUpperCase().includes(cleanSku),
      );
      if (skuMatched.length > 0) {
        return skuMatched.map((d) => ({ ...d, similarity: 1.0 }));
      }
    }

    // Boyut Filtresi
    if (args.size) {
      isFiltered = true;
      const targetSize = args.size.toUpperCase();
      docs = docs.filter((d) => {
        const docSize = (d.metadata?.boyut as string)?.toUpperCase() || "";
        return docSize === targetSize || d.source_title.toUpperCase().includes(targetSize);
      });
    }

    // Renk Filtresi
    if (args.color) {
      isFiltered = true;
      const targetColor = args.color.toLocaleLowerCase("tr");
      docs = docs.filter((d) => {
        const docColor = (d.metadata?.renk as string)?.toLocaleLowerCase("tr") || "";
        return (
          docColor.includes(targetColor) ||
          d.source_title.toLocaleLowerCase("tr").includes(targetColor)
        );
      });
    }

    // Profil Kalınlığı (mm) Filtresi
    if (args.profile_thickness_mm != null) {
      isFiltered = true;
      const targetMm = Number(args.profile_thickness_mm);
      docs = docs.filter((d) => {
        const docMm = Number(d.metadata?.profil_kalinligi_mm || 0);
        return docMm === targetMm || d.source_title.includes(`${targetMm}mm`);
      });
    }

    // Köşe Tipi Filtresi (Rondo / Gönye)
    if (args.corner_type) {
      isFiltered = true;
      const targetCorner = args.corner_type.toLocaleLowerCase("tr");
      docs = docs.filter((d) => {
        const docCorner = (d.metadata?.kose_tipi as string)?.toLocaleLowerCase("tr") || "";
        return (
          docCorner.includes(targetCorner) ||
          d.source_title.toLocaleLowerCase("tr").includes(targetCorner) ||
          d.content.toLocaleLowerCase("tr").includes(targetCorner)
        );
      });
    }

    // Kategori Filtresi
    if (args.category) {
      isFiltered = true;
      const targetCategory = args.category.toLocaleLowerCase("tr");
      docs = docs.filter((d) => {
        const docCat = (d.metadata?.kategori as string)?.toLocaleLowerCase("tr") || "";
        return (
          docCat.includes(targetCategory) ||
          d.source_title.toLocaleLowerCase("tr").includes(targetCategory)
        );
      });
    }

    // Gövde Malzemesi Filtresi
    if (args.material) {
      isFiltered = true;
      const targetMaterial = args.material.toLocaleLowerCase("tr");
      docs = docs.filter((d) => {
        const docMat = (d.metadata?.malzeme as string)?.toLocaleLowerCase("tr") || "";
        return (
          docMat.includes(targetMaterial) ||
          d.source_title.toLocaleLowerCase("tr").includes(targetMaterial) ||
          d.content.toLocaleLowerCase("tr").includes(targetMaterial)
        );
      });
    }

    // İndirimli Ürün Filtresi
    if (args.is_discounted) {
      isFiltered = true;
      docs = docs.filter((d) => {
        const disc = d.metadata?.indirimli_fiyat_tl;
        return disc != null && disc !== "" && Number(disc) > 0;
      });
    }

    // Ağırlık (kg) Filtresi
    if (args.max_weight_kg != null) {
      isFiltered = true;
      const targetWeight = Number(args.max_weight_kg);
      docs = docs.filter((d) => Number(d.metadata?.agirlik_kg || 0) <= targetWeight);
    }

    // Fiyat Filtreleri (İndirimli fiyat varsa geçerli satış fiyatı baz alınır)
    if (args.max_price != null) {
      isFiltered = true;
      docs = docs.filter((d) => getEffectivePrice(d) <= (args.max_price as number));
    }
    if (args.min_price != null) {
      isFiltered = true;
      docs = docs.filter((d) => getEffectivePrice(d) >= (args.min_price as number));
    }

    // Sıralama (Geçerli satış fiyatına göre)
    if (args.sort_by === "price_desc") {
      isFiltered = true;
      docs.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    } else if (args.sort_by === "price_asc") {
      isFiltered = true;
      docs.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    } else if (args.sort_by === "stock_desc") {
      isFiltered = true;
      docs.sort((a, b) => Number(b.metadata?.stok_adedi || 0) - Number(a.metadata?.stok_adedi || 0));
    }

    if (isFiltered && docs.length > 0) {
      const limitToUse =
        args.max_price != null || args.min_price != null
          ? Math.max(desiredLimit, docs.length)
          : desiredLimit;
      return docs.slice(0, limitToUse).map((d) => ({
        ...d,
        similarity: 1.0,
      }));
    }
  }

  // Varsayılan Hibrit Vektör Araması (Sorguda meşe/ağaç geçiyorsa ahşap desenli kaplamaya genişlet)
  let searchText = args.query || args.size || userQuery || "ürünler";
  if (/meşe|ağaç|agac/i.test(searchText)) {
    searchText = `${searchText} ahşap desenli kaplama alüminyum gövde`;
  }

  const embedding = await embedQuery(searchText);
  return matchDocuments(supabase, embedding, {
    matchCount: desiredLimit,
    filterSourceType: "urun",
    filterSize: args.size || null,
    filterMaxPrice: args.max_price || null,
    queryText: searchText,
  });
}

export async function executePolicySearch(
  supabase: SupabaseClient,
  args: { topic: string },
  userQuery = "",
): Promise<MatchedDocument[]> {
  const searchText = `${args.topic || ""} ${userQuery}`.trim();
  const embedding = await embedQuery(searchText);
  return matchDocuments(supabase, embedding, {
    matchCount: 4,
    filterSourceType: "politika",
    matchThreshold: 0.15,
    queryText: searchText,
  });
}

export async function resolveMatchesViaTools(
  supabase: SupabaseClient,
  query: string,
): Promise<MatchedDocument[]> {
  const openai = getOpenAI();

  try {
    const res = await openai.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.0,
      messages: [
        {
          role: "system",
          content:
            "Sen ORES Mağaza arama yönlendiricisisin. Kullanıcının sorusuna cevap verecek verileri çekmek için arama araçlarını (search_products veya get_policy_info) çağır.",
        },
        { role: "user", content: query },
      ],
      tools: RAG_TOOLS,
      tool_choice: "auto",
    });

    const choiceMessage = res.choices[0]?.message;
    const toolCalls = choiceMessage?.tool_calls;

    if (toolCalls && toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        if (toolCall.type === "function") {
          const fnName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments || "{}");

          if (fnName === "search_products") {
            return await executeProductSearch(supabase, args, query);
          }
          if (fnName === "get_policy_info") {
            return await executePolicySearch(supabase, args, query);
          }
        }
      }
    }
  } catch (err) {
    console.error("resolveMatchesViaTools hatası:", err);
  }

  // Fallback: Standart Hibrit Vektör Araması
  const filterSourceType = detectSourceTypeFilter(query);
  const filterMaxPrice = detectMaxPriceFilter(query);
  const filterCategory = detectCategoryFilter(query);
  const filterSize = detectSizeFilter(query);
  const embedding = await embedQuery(query);

  return matchDocuments(supabase, embedding, {
    filterSourceType,
    filterMaxPrice,
    filterCategory,
    filterSize,
    queryText: query,
  });
}

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

/**
 * Hybrid Ranking (Dense Cosine Similarity + Sparse Lexical SKU Search Fusion)
 * Reciprocal Rank Fusion (RRF) & Token Match Scoring
 */
export function applyHybridRerank(
  matches: MatchedDocument[],
  queryText: string,
  limit = 6,
): MatchedDocument[] {
  if (!matches || matches.length === 0) return [];

  const normalizedQuery = queryText
    .toLocaleLowerCase("tr")
    .replace(/[?!.,…]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const queryTokens = normalizedQuery
    .split(" ")
    .filter((t) => t.length > 1);

  const codeTokens = normalizedQuery.match(/\b[a-z0-9-]+\b/g) || [];

  const scoredDocs = matches.map((doc, vectorRank) => {
    const contentLower = doc.content.toLocaleLowerCase("tr");
    const titleLower = doc.source_title.toLocaleLowerCase("tr");
    const idLower = doc.source_id.toLocaleLowerCase("tr");

    let lexicalScore = 0;

    // 1. Exact SKU / ID match boost
    for (const code of codeTokens) {
      if (code.length >= 2) {
        if (idLower === code || idLower.includes(code)) {
          lexicalScore += 1.5;
        }
        if (titleLower.includes(code)) {
          lexicalScore += 0.8;
        }
      }
    }

    // 2. Keyword token match boost
    for (const token of queryTokens) {
      if (token.length > 2) {
        if (titleLower.includes(token)) {
          lexicalScore += 0.4;
        } else if (contentLower.includes(token)) {
          lexicalScore += 0.2;
        }
      }
    }

    // 3. Reciprocal Rank Fusion (RRF) score calculation
    const vectorRrf = 1 / (60 + (vectorRank + 1));
    const combinedScore =
      doc.similarity * 0.6 + lexicalScore * 0.4 + vectorRrf;

    return {
      doc: {
        ...doc,
        similarity: Number(combinedScore.toFixed(4)),
      },
      combinedScore,
    };
  });

  scoredDocs.sort((a, b) => b.combinedScore - a.combinedScore);

  return scoredDocs.slice(0, limit).map((item) => item.doc);
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
    filterSize?: string | null;
    queryText?: string | null;
  },
): Promise<MatchedDocument[]> {
  const threshold =
    options?.matchThreshold ?? (options?.filterMaxPrice ? 0.1 : 0.35);

  const desiredLimit = options?.matchCount ?? 6;

  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_count: desiredLimit * 3,
    filter_source_type: options?.filterSourceType ?? null,
    filter_category: options?.filterCategory ?? null,
    filter_max_price: options?.filterMaxPrice ?? null,
    match_threshold: threshold,
  });

  if (error) {
    throw new Error(`match_documents hatası: ${error.message}`);
  }

  let rawMatches = (data ?? []) as MatchedDocument[];

  // Boyut Filtresi Uygula (Örn: A4, A3, B1)
  if (options?.filterSize) {
    const targetSize = options.filterSize.toLocaleLowerCase("tr");
    const sizeFiltered = rawMatches.filter((m) => {
      if (m.source_type === "politika") return true;
      const docSize =
        (m.metadata?.boyut as string)?.toLocaleLowerCase("tr") || "";
      const titleLower = m.source_title.toLocaleLowerCase("tr");
      const contentLower = m.content.toLocaleLowerCase("tr");

      return (
        docSize === targetSize ||
        titleLower.includes(` ${targetSize} `) ||
        titleLower.includes(`-${targetSize}-`) ||
        titleLower.includes(` ${targetSize}-`) ||
        titleLower.includes(`-${targetSize} `) ||
        contentLower.includes(`boyut: ${targetSize}`)
      );
    });

    if (sizeFiltered.length > 0) {
      rawMatches = sizeFiltered;
    }
  }

  if (options?.queryText) {
    return applyHybridRerank(rawMatches, options.queryText, desiredLimit);
  }

  return rawMatches.slice(0, desiredLimit);
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
- Bir ürünün hem normal fiyatı hem indirimli fiyatı varsa, geçerli satış fiyatı İNDİRİMLİ FİYAT'tır. Fiyat filtreleme ve değerlendirmelerinde indirimli fiyatı esas al.
- Kullanıcı ürün sayısını veya liste sorduğunda kaynaklardaki ürünlerin fiyatlarını dikkatle kontrol et, matematiksel ve mantıksal çelişkiye düşmeden tüm eşleşen ürünleri eksiksiz say ve listele.
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

export async function generateAnswerStream(
  question: string,
  matches: MatchedDocument[],
) {
  if (matches.length === 0) {
    return {
      stream: null,
      matches: [],
      mode: "no_info" as const,
    };
  }

  const openai = getOpenAI();
  const context = buildContext(matches);

  const stream = await openai.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.2,
    stream: true,
    messages: [
      {
        role: "system",
        content: `Sen ORES Mağaza müşteri asistanısın. Yalnızca aşağıda verilen KAYNAK metinlerine dayanarak Türkçe cevap ver.

Kurallar:
- Kaynaklarda olmayan bilgiyi uydurma.
- Emin değilsen veya kaynaklar soruyu karşılamıyorsa aynen şu cümleyi yaz: "${NO_INFO_REPLY}"
- Fiyat, stok, profil kalınlığı, iade, kargo gibi iddiaları yalnızca kaynaklardan al.
- Bir ürünün hem normal fiyatı hem indirimli fiyatı varsa, geçerli satış fiyatı İNDİRİMLİ FİYAT'tır. Fiyat filtreleme ve değerlendirmelerinde indirimli fiyatı esas al.
- Kullanıcı ürün sayısını veya liste sorduğunda kaynaklardaki ürünlerin fiyatlarını dikkatle kontrol et, matematiksel ve mantıksal çelişkiye düşmeden tüm eşleşen ürünleri eksiksiz say ve listele.
- Kısa ve net cevap ver.
- Kaynak numaralarını cevabın içinde yazma; kaynaklar ayrıca gösterilecek.`,
      },
      {
        role: "user",
        content: `KAYNAKLAR:\n${context}\n\nSORU:\n${question}`,
      },
    ],
  });

  return {
    stream,
    matches,
    mode: "rag" as const,
  };
}
