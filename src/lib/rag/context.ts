import { CHAT_MODEL, getOpenAI } from "@/lib/openai";
import type { PreviousMessage } from "./types";

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
