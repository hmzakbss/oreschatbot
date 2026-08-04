import type { SupabaseClient } from "@supabase/supabase-js";
import { EMBEDDING_MODEL, getOpenAI } from "@/lib/openai";

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
};

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
  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_count: options?.matchCount ?? 6,
    filter_source_type: options?.filterSourceType ?? null,
    filter_category: options?.filterCategory ?? null,
    filter_max_price: options?.filterMaxPrice ?? null,
    match_threshold: options?.matchThreshold ?? 0.25,
  });

  if (error) {
    throw new Error(`match_documents hatası: ${error.message}`);
  }

  return (data ?? []) as MatchedDocument[];
}

export function toSources(matches: MatchedDocument[]): ChatSource[] {
  return matches.map((m) => ({
    source_type: m.source_type,
    source_id: m.source_id,
    source_title: m.source_title,
    similarity: Number(m.similarity.toFixed(4)),
  }));
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
): Promise<{ content: string; sources: ChatSource[] }> {
  if (matches.length === 0) {
    return { content: NO_INFO_REPLY, sources: [] };
  }

  const openai = getOpenAI();
  const context = buildContext(matches);
  const chatModel = process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini";

  const completion = await openai.chat.completions.create({
    model: chatModel,
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

  // Model yine de uydurursa / boş dönerse güvence
  if (!content) {
    return { content: NO_INFO_REPLY, sources: [] };
  }

  return { content, sources: toSources(matches) };
}
