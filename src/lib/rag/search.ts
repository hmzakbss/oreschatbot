import type { SupabaseClient } from "@supabase/supabase-js";
import { CHAT_MODEL, getOpenAI } from "@/lib/openai";
import type { MatchedDocument, ProductSearchArgs } from "./types";
import { RAG_TOOLS } from "./constants";
import { embedQuery, getEffectivePrice } from "./helpers";
import {
  detectCategoryFilter,
  detectMaxPriceFilter,
  detectSizeFilter,
  detectSourceTypeFilter,
} from "./detectors";

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

    // SKU Koduna Göre Eşleşme (Diğer filtrelerin çalışmasını engellemeyecek şekilde süzgeç uygulanır)
    if (args.sku) {
      isFiltered = true;
      const cleanSku = args.sku.trim().toUpperCase();
      docs = docs.filter(
        (d) =>
          d.source_id.toUpperCase() === cleanSku ||
          d.source_id.toUpperCase().includes(cleanSku) ||
          d.source_title.toUpperCase().includes(cleanSku),
      );
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
      docs = docs.filter((d) => {
        const weight = d.metadata?.agirlik_kg;
        if (weight == null || Number.isNaN(Number(weight))) return false;
        return Number(weight) <= targetWeight;
      });
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
    filterCategory: args.category || null,
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
      const allResults: MatchedDocument[] = [];
      const seenIds = new Set<string>();

      for (const toolCall of toolCalls) {
        if (toolCall.type === "function") {
          const fnName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments || "{}");

          let docs: MatchedDocument[] = [];
          if (fnName === "search_products") {
            docs = await executeProductSearch(supabase, args, query);
          } else if (fnName === "get_policy_info") {
            docs = await executePolicySearch(supabase, args, query);
          }

          for (const doc of docs) {
            if (!seenIds.has(doc.id)) {
              seenIds.add(doc.id);
              allResults.push(doc);
            }
          }
        }
      }

      if (allResults.length > 0) {
        return allResults;
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

    // 1. SKU / ID tam veya parçalı eşleşme
    if (idLower.length > 2 && contentLower.includes(idLower)) return true;

    // 2. Başlık tam eşleşme
    if (titleLower.length > 2 && contentLower.includes(titleLower)) return true;

    // 3. Ürün dokümanları için hassas boyut/model kontrolü
    if (m.source_type === "urun") {
      // Başlıktaki boyut/ölçü kodlarını çıkar (A0-A4, B1-B3, 21x30 vb.)
      const sizeTokens = titleLower.match(/\b(a[0-4]|b[1-3]|\d{2,3}x\d{2,3})\b/gi);
      if (sizeTokens && sizeTokens.length > 0) {
        // Ürünün başlığında boyut varsa, cevap metninde de bu boyutlardan en az biri geçmelidir
        const hasSizeMatch = sizeTokens.some((st) =>
          contentLower.includes(st.toLocaleLowerCase("tr")),
        );
        if (!hasSizeMatch) return false;
      }

      // Rondo vs Gönye köşe ayrımı
      if (titleLower.includes("rondo") && !contentLower.includes("rondo")) {
        return false;
      }
      if (titleLower.includes("gönye") && !contentLower.includes("gönye") && titleLower.includes("rondo")) {
        return false;
      }

      // Genel kelime eşleşmesi (en az 3 ayırt edici kelime eşleşmeli)
      const cleanTitle = titleLower.replace(/[^a-z0-9çğıöşü\s]/gi, " ");
      const words = cleanTitle.split(/\s+/).filter((w) => w.length > 2);
      const matchingWords = words.filter((w) => contentLower.includes(w));
      return matchingWords.length >= Math.min(3, words.length);
    }

    // 4. Politika dokümanları için başlık eşleşmesi
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
