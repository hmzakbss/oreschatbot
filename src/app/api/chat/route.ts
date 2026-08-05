import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  contextualizeQuery,
  detectCategoryFilter,
  detectMaxPriceFilter,
  detectSizeFilter,
  detectSourceTypeFilter,
  embedQuery,
  filterUsedSources,
  generateAnswer,
  generateAnswerStream,
  generateSmallTalkReply,
  isSmallTalk,
  matchDocuments,
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

    const body = (await request.json()) as ChatRequestBody;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json(
        { error: "message alanı zorunlu" },
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

    if (body.stream) {
      const encoder = new TextEncoder();

      if (isSmallTalk(message)) {
        const smallTalk = await generateSmallTalkReply(message);
        const stream = new ReadableStream({
          async start(controller) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "metadata",
                  conversationId,
                  sources: [],
                })}\n\n`,
              ),
            );
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "token",
                  content: smallTalk.content,
                })}\n\n`,
              ),
            );

            await supabase.from("messages").insert({
              conversation_id: conversationId,
              user_id: user.id,
              role: "assistant",
              content: smallTalk.content,
              sources: [],
            });

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`),
            );
            controller.close();
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          },
        });
      }

      const standaloneQuery = await contextualizeQuery(message, history);
      const matches = await resolveMatchesViaTools(supabase, standaloneQuery);

      const { stream: openaiStream } = await generateAnswerStream(
        message,
        matches,
      );

      if (!openaiStream) {
        const stream = new ReadableStream({
          async start(controller) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "metadata",
                  conversationId,
                  sources: [],
                })}\n\n`,
              ),
            );
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "token",
                  content: NO_INFO_REPLY,
                })}\n\n`,
              ),
            );

            await supabase.from("messages").insert({
              conversation_id: conversationId,
              user_id: user.id,
              role: "assistant",
              content: NO_INFO_REPLY,
              sources: [],
            });

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`),
            );
            controller.close();
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          },
        });
      }

      const stream = new ReadableStream({
        async start(controller) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "metadata",
                conversationId,
                sources: [],
              })}\n\n`,
            ),
          );

          let fullText = "";
          for await (const chunk of openaiStream) {
            const token = chunk.choices[0]?.delta?.content || "";
            if (token) {
              fullText += token;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "token",
                    content: token,
                  })}\n\n`,
                ),
              );
            }
          }

          const isNoInfo =
            !fullText || fullText.includes("elimde net bir bilgi yok");
          const finalContent = isNoInfo ? NO_INFO_REPLY : fullText;
          const usedMatches = isNoInfo
            ? []
            : filterUsedSources(matches, finalContent);
          const finalSources = toSources(usedMatches);

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "sources",
                sources: finalSources,
              })}\n\n`,
            ),
          );

          await supabase.from("messages").insert({
            conversation_id: conversationId,
            user_id: user.id,
            role: "assistant",
            content: finalContent,
            sources: finalSources,
          });

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`),
          );
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    let answer: AnswerResult;

    if (isSmallTalk(message)) {
      answer = await generateSmallTalkReply(message);
    } else {
      const standaloneQuery = await contextualizeQuery(message, history);
      const matches = await resolveMatchesViaTools(supabase, standaloneQuery);
      answer = await generateAnswer(message, matches);
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
