import { CHAT_MODEL, getOpenAI } from "@/lib/openai";
import { NO_INFO_REPLY, RAG_SYSTEM_PROMPT } from "./constants";
import { buildContext, toSources } from "./helpers";
import { filterUsedSources } from "./search";
import type { AnswerResult, MatchedDocument } from "./types";

// Export all submodule definitions for external consumers
export * from "./types";
export * from "./constants";
export * from "./helpers";
export * from "./detectors";
export * from "./context";
export * from "./search";
export * from "./smalltalk";

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
        content: RAG_SYSTEM_PROMPT,
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
        content: RAG_SYSTEM_PROMPT,
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
