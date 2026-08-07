import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  contextualizeQuery,
  filterUsedSources,
  generateAnswer,
  generateAnswerStream,
  generateSmallTalkReply,
  isSmallTalk,
  NO_INFO_REPLY,
  resolveMatchesViaTools,
  toSources,
  type AnswerResult,
} from "@/lib/rag";

type ChatRequestBody = {
  message?: string;
  conversationId?: string | null;
  stream?: boolean;
};

const MAX_MESSAGE_LENGTH = 1500;
const encoder = new TextEncoder();

/** SSE formatında olay paketi gönderir */
function sendSSEEvent(
  controller: ReadableStreamDefaultController,
  event: Record<string, unknown>,
) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
}

/** SSE akış yanıtı için gerekli HTTP başlıklarını oluşturur */
function createSSEResponse(stream: ReadableStream) {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

/** Tek seferlik statik metinler (SmallTalk veya NoInfo) için SSE akışı üretir */
function createStaticStreamResponse({
  content,
  conversationId,
  user,
  supabase,
}: {
  content: string;
  conversationId: string | null;
  user: User;
  supabase: SupabaseClient;
}) {
  const stream = new ReadableStream({
    async start(controller) {
      sendSSEEvent(controller, {
        type: "metadata",
        conversationId,
        sources: [],
      });
      sendSSEEvent(controller, {
        type: "token",
        content,
      });

      await supabase.from("messages").insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: "assistant",
        content,
        sources: [],
      });

      sendSSEEvent(controller, { type: "done" });
      controller.close();
    },
  });

  return createSSEResponse(stream);
}

function makeTitle(message: string): string {
  const cleaned = message.replace(/\s+/g, " ").trim();
  return cleaned.length > 60 ? `${cleaned.slice(0, 57)}...` : cleaned;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
    }

    // Rate Limit Kontrolü (Kullanıcı başına dakikada maks 10 istek)
    const rateLimit = checkRateLimit(user.id, 10, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Çok fazla mesaj gönderdiniz. Lütfen ${rateLimit.resetInSec} saniye bekleyin.`,
        },
        { status: 429 },
      );
    }

    const body = (await request.json()) as ChatRequestBody;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json(
        { error: "message alanı zorunlu" },
        { status: 400 },
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        {
          error: `Mesaj uzunluğu en fazla ${MAX_MESSAGE_LENGTH} karakter olabilir.`,
        },
        { status: 400 },
      );
    }

    let conversationId = body.conversationId ?? null;

    if (conversationId) {
      const { data: existing, error: existingError } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingError) {
        throw new Error(existingError.message);
      }
      if (!existing) {
        return NextResponse.json(
          { error: "Sohbet bulunamadı" },
          { status: 404 },
        );
      }
    } else {
      const { data: created, error: createError } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          title: makeTitle(message),
        })
        .select("id")
        .single();

      if (createError || !created) {
        throw new Error(createError?.message ?? "Sohbet oluşturulamadı");
      }
      conversationId = created.id;
    }

    const { error: userMsgError } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: "user",
      content: message,
      sources: [],
    });

    if (userMsgError) {
      if (!body.conversationId && conversationId) {
        await supabase.from("conversations").delete().eq("id", conversationId);
      }
      throw new Error(userMsgError.message);
    }

    // updated_at dokunuşu
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId)
      .eq("user_id", user.id);

    // Sohbet geçmişini çek (Takipli sorular ve Query Rewriting için)
    const { data: pastMessages } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(6);

    const history = (pastMessages ?? []).slice(0, -1) as {
      role: "user" | "assistant";
      content: string;
    }[];

    // Stream modu
    if (body.stream) {
      if (isSmallTalk(message)) {
        const smallTalk = await generateSmallTalkReply(message);
        return createStaticStreamResponse({
          content: smallTalk.content,
          conversationId,
          user,
          supabase,
        });
      }

      const standaloneQuery = await contextualizeQuery(message, history);
      const matches = await resolveMatchesViaTools(supabase, standaloneQuery);

      const { stream: openaiStream } = await generateAnswerStream(
        standaloneQuery,
        matches,
      );

      if (!openaiStream) {
        return createStaticStreamResponse({
          content: NO_INFO_REPLY,
          conversationId,
          user,
          supabase,
        });
      }

      const stream = new ReadableStream({
        async start(controller) {
          sendSSEEvent(controller, {
            type: "metadata",
            conversationId,
            sources: [],
          });

          let fullText = "";
          for await (const chunk of openaiStream) {
            const token = chunk.choices[0]?.delta?.content || "";
            if (token) {
              fullText += token;
              sendSSEEvent(controller, {
                type: "token",
                content: token,
              });
            }
          }

          const isNoInfo =
            !fullText || fullText.includes("elimde net bir bilgi yok");
          const finalContent = isNoInfo ? NO_INFO_REPLY : fullText;
          const usedMatches = isNoInfo
            ? []
            : filterUsedSources(matches, finalContent);
          const finalSources = toSources(usedMatches);

          sendSSEEvent(controller, {
            type: "sources",
            sources: finalSources,
          });

          await supabase.from("messages").insert({
            conversation_id: conversationId,
            user_id: user.id,
            role: "assistant",
            content: finalContent,
            sources: finalSources,
          });

          sendSSEEvent(controller, { type: "done" });
          controller.close();
        },
      });

      return createSSEResponse(stream);
    }

    // Normal (Standart JSON) Mod
    let answer: AnswerResult;

    if (isSmallTalk(message)) {
      answer = await generateSmallTalkReply(message);
    } else {
      const standaloneQuery = await contextualizeQuery(message, history);
      const matches = await resolveMatchesViaTools(supabase, standaloneQuery);
      answer = await generateAnswer(standaloneQuery, matches);
    }

    const sources = answer.mode === "rag" ? answer.sources : [];

    const { data: assistantMsg, error: assistantError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: "assistant",
        content: answer.content || NO_INFO_REPLY,
        sources,
      })
      .select("id, role, content, sources, created_at")
      .single();

    if (assistantError || !assistantMsg) {
      throw new Error(assistantError?.message ?? "Cevap kaydedilemedi");
    }

    return NextResponse.json({
      conversationId,
      message: {
        id: assistantMsg.id,
        role: assistantMsg.role,
        content: assistantMsg.content,
        sources: assistantMsg.sources,
        created_at: assistantMsg.created_at,
      },
    });
  } catch (err) {
    console.error("[api/chat]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Sohbet isteği başarısız oldu",
      },
      { status: 500 },
    );
  }
}
