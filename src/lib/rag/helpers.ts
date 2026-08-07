import { EMBEDDING_MODEL, getOpenAI } from "@/lib/openai";
import type { ChatSource, MatchedDocument } from "./types";

/** Bir ürün dokümanının geçerli satış fiyatını hesaplar (varsa indirimli fiyat, yoksa normal fiyat) */
export function getEffectivePrice(doc: MatchedDocument): number {
  const disc = doc.metadata?.indirimli_fiyat_tl;
  if (disc != null && disc !== "" && !Number.isNaN(Number(disc))) {
    return Number(disc);
  }
  return Number(doc.metadata?.fiyat_tl || 0);
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
