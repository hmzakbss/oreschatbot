import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import { CHAT_MODEL, getOpenAI } from "@/lib/openai";
import {
  NO_INFO_REPLY,
  buildContext,
  embedQuery,
  matchDocuments,
  toSources,
  type AnswerResult,
  type ChatSource,
  type MatchedDocument,
} from "@/lib/rag";

const TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_knowledge",
      description:
        "Ürün veya politika bilgi tabanında semantik arama yap. Tek ürün özellikleri, fiyat, stok, iade, kargo, gizlilik gibi metin sorularında kullan. Katalog geneli sıralama (en pahalı/en ucuz) için KULLANMA.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Arama sorgusu (gerekirse zenginleştirilmiş)",
          },
          source_type: {
            type: "string",
            enum: ["urun", "politika"],
            description: "Opsiyonel kaynak tipi filtresi",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_products",
      description:
        "Tüm ürün kataloğunu fiyata göre sırala veya filtrele. En pahalı, en ucuz, ilk N, X TL altı gibi sorularda kullan.",
      parameters: {
        type: "object",
        properties: {
          order: {
            type: "string",
            enum: ["asc", "desc"],
            description: "asc = en ucuz önce, desc = en pahalı önce",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 10,
            description: "Kaç ürün döndürülecek",
          },
          max_price: {
            type: "number",
            description: "Opsiyonel: bu TL üstü fiyatları hariç tut",
          },
        },
        required: ["order", "limit"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "no_info",
      description:
        "Bilgi tabanında cevap yoksa çağır (ör. iPhone, hava durumu, maaş). Uydurma yapma.",
      parameters: {
        type: "object",
        properties: {
          reason: {
            type: "string",
            description: "Kısa gerekçe",
          },
        },
      },
    },
  },
];

const SYSTEM_PROMPT = `Sen ORES Mağaza müşteri asistanısın. Kullanıcı sorusunu çözmek için araçları kullan.

Araç seçimi:
- list_products: en pahalı / en ucuz / ilk N ürün / X TL altı-üstü katalog sorguları
- search_knowledge: iade, kargo, gizlilik, tek ürün özelliği/fiyat/stok, politika metinleri
- no_info: mağaza bilgi tabanında olmayan konular

Kurallar:
- Yalnızca araç sonuçlarına dayanarak Türkçe, kısa ve net cevap ver.
- Araç sonucu yoksa veya yetersizse no_info çağır; bilgi uydurma.
- Kaynak numaralarını cevabın içinde yazma.
- Fiyat ve stok iddialarını yalnızca araç çıktısından al.`;

function priceOf(meta: Record<string, unknown>): number | null {
  const v = meta.fiyat_tl;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

type DocRow = {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  source_type: "urun" | "politika";
  source_id: string;
  source_title: string;
};

async function listProducts(
  supabase: SupabaseClient,
  args: { order: "asc" | "desc"; limit: number; max_price?: number },
): Promise<MatchedDocument[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("id, content, metadata, source_type, source_id, source_title")
    .eq("source_type", "urun");

  if (error) {
    throw new Error(`list_products: ${error.message}`);
  }

  let rows = ((data ?? []) as DocRow[]).filter(
    (r) => priceOf(r.metadata ?? {}) != null,
  );

  if (args.max_price != null && Number.isFinite(args.max_price)) {
    rows = rows.filter((r) => priceOf(r.metadata)! <= args.max_price!);
  }

  rows.sort((a, b) => {
    const pa = priceOf(a.metadata)!;
    const pb = priceOf(b.metadata)!;
    return args.order === "asc" ? pa - pb : pb - pa;
  });

  const limit = Math.min(Math.max(args.limit || 1, 1), 10);
  return rows.slice(0, limit).map((r, i) => ({
    id: r.id,
    content: r.content,
    metadata: r.metadata ?? {},
    source_type: r.source_type,
    source_id: r.source_id,
    source_title: r.source_title,
    similarity: 1 - i * 0.01,
  }));
}

function mergeSources(docs: MatchedDocument[], max = 4): ChatSource[] {
  const seen = new Set<string>();
  const out: MatchedDocument[] = [];
  for (const d of docs) {
    const key = `${d.source_type}:${d.source_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(d);
    if (out.length >= max) break;
  }
  return toSources(out);
}

function parseToolArgs(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Tool-calling agent: search_knowledge | list_products | no_info
 */
export async function runAgentChat(
  supabase: SupabaseClient,
  question: string,
): Promise<AnswerResult> {
  const openai = getOpenAI();
  const collected: MatchedDocument[] = [];
  let forcedNoInfo = false;

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: question },
  ];

  for (let turn = 0; turn < 3; turn++) {
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.1,
      messages,
      tools: TOOLS,
      tool_choice: turn === 0 ? "required" : "auto",
    });

    const msg = completion.choices[0]?.message;
    if (!msg) break;

    if (msg.tool_calls && msg.tool_calls.length > 0) {
      messages.push({
        role: "assistant",
        content: msg.content,
        tool_calls: msg.tool_calls,
      });

      for (const call of msg.tool_calls) {
        if (call.type !== "function") continue;
        const name = call.function.name;
        const args = parseToolArgs(call.function.arguments);

        let toolPayload: unknown;

        if (name === "no_info") {
          forcedNoInfo = true;
          toolPayload = { ok: true, message: NO_INFO_REPLY };
        } else if (name === "search_knowledge") {
          const query = String(args.query ?? question);
          const sourceType =
            args.source_type === "urun" || args.source_type === "politika"
              ? args.source_type
              : null;
          const embedding = await embedQuery(query);
          const matches = await matchDocuments(supabase, embedding, {
            filterSourceType: sourceType,
            matchCount: 6,
          });
          collected.push(...matches);
          toolPayload = {
            count: matches.length,
            results: matches.map((m) => ({
              source_type: m.source_type,
              source_id: m.source_id,
              source_title: m.source_title,
              similarity: m.similarity,
              content: m.content.slice(0, 1200),
              fiyat_tl: m.metadata?.fiyat_tl ?? null,
            })),
          };
        } else if (name === "list_products") {
          const order = args.order === "asc" ? "asc" : "desc";
          const limit = Number(args.limit) || 1;
          const maxPrice =
            typeof args.max_price === "number" ? args.max_price : undefined;
          const matches = await listProducts(supabase, {
            order,
            limit,
            max_price: maxPrice,
          });
          collected.push(...matches);
          toolPayload = {
            count: matches.length,
            results: matches.map((m) => ({
              source_type: m.source_type,
              source_id: m.source_id,
              source_title: m.source_title,
              fiyat_tl: m.metadata?.fiyat_tl ?? null,
              content: m.content.slice(0, 800),
            })),
          };
        } else {
          toolPayload = { error: `Bilinmeyen araç: ${name}` };
        }

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(toolPayload),
        });
      }

      if (forcedNoInfo) {
        return { content: NO_INFO_REPLY, sources: [], mode: "no_info" };
      }
      continue;
    }

    const content = msg.content?.trim();
    if (content) {
      if (content.includes("elimde net bir bilgi yok")) {
        return { content: NO_INFO_REPLY, sources: [], mode: "no_info" };
      }
      if (collected.length === 0) {
        return { content: NO_INFO_REPLY, sources: [], mode: "no_info" };
      }
      return {
        content,
        sources: mergeSources(collected, 4),
        mode: "rag",
      };
    }
    break;
  }

  // Araçlar çalıştı ama final metin yoksa: kaynaklardan cevap üret
  if (collected.length > 0) {
    const context = buildContext(collected.slice(0, 6));
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `Sen ORES Mağaza asistanısın. Yalnızca KAYNAKLARA dayanarak Türkçe cevap ver. Uydurma. Emin değilsen: "${NO_INFO_REPLY}"`,
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
    return {
      content,
      sources: mergeSources(collected, 4),
      mode: "rag",
    };
  }

  return { content: NO_INFO_REPLY, sources: [], mode: "no_info" };
}
