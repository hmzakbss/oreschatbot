import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runAgentChat } from "@/lib/agent";
import {
  generateSmallTalkReply,
  isSmallTalk,
  NO_INFO_REPLY,
  type AnswerResult,
} from "@/lib/rag";

type ChatRequestBody = {
  message?: string;
  conversationId?: string | null;
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

    let answer: AnswerResult;

    if (isSmallTalk(message)) {
      answer = await generateSmallTalkReply(message);
    } else {
      answer = await runAgentChat(supabase, message);
    }

    // Kaynak yalnızca mode === 'rag' iken
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
