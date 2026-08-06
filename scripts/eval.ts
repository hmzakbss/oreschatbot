import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import {
  generateAnswer,
  generateSmallTalkReply,
  isSmallTalk,
  resolveMatchesViaTools,
  NO_INFO_REPLY,
} from "../src/lib/rag";

(globalThis as any).WebSocket = WebSocket;
loadEnv({ path: resolve(process.cwd(), ".env.local") });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Eksik ortam değişkeni: ${name}`);
  return value;
}

export type TestCase = {
  id: number;
  question: string;
  expectedKeyword: string;
  shouldBeNoInfo?: boolean;
  // Step 1: Ground Truth Retrieval Expectations
  expectedSourceType?: "urun" | "politika" | null;
  expectedDocKeywords?: string[]; // chunk title veya content içinde bulunması beklenen terimler
};

const TEST_CASES: TestCase[] = [
  {
    id: 1,
    question: "İade süresi kaç gündür?",
    expectedKeyword: "14",
    expectedSourceType: "politika",
    expectedDocKeywords: ["iade", "14"],
  },
  {
    id: 2,
    question: "750 TL altındaki siparişlerde kargo ücreti kime aittir?",
    expectedKeyword: "alıcı",
    expectedSourceType: "politika",
    expectedDocKeywords: ["kargo", "750"],
  },
  {
    id: 3,
    question: "Alüminyum Açılır Kapanır Çerçeve - A4 - 21x30 cm - Kırmızı - 25mm Gönye Köşe fiyatı nedir?",
    expectedKeyword: "465",
    expectedSourceType: "urun",
    expectedDocKeywords: ["Kırmızı", "A4", "25mm"],
  },
  {
    id: 4,
    question: "Kapıda ödeme seçeneğiniz veya kripto ödeme var mı?",
    expectedKeyword: NO_INFO_REPLY,
    shouldBeNoInfo: true,
  },
  {
    id: 5,
    question: "Ahşap Desenli Açılır Kapanır Çerçeve Gönye Köşe - B1 - 70x100 cm profil kalınlığı nedir?",
    expectedKeyword: "25",
    expectedSourceType: "urun",
    expectedDocKeywords: ["Ahşap", "B1"],
  },
  {
    id: 6,
    question: "Hangi kargo firması ile çalışıyorsunuz?",
    expectedKeyword: "Yurtiçi",
    expectedSourceType: "politika",
    expectedDocKeywords: ["kargo", "Yurtiçi"],
  },
  {
    id: 7,
    question: "Mağazanızda laptop veya cep telefonu satıyor musunuz?",
    expectedKeyword: NO_INFO_REPLY,
    shouldBeNoInfo: true,
  },
  {
    id: 8,
    question: "İndirimdeki ürünler iade edilebilir mi?",
    expectedKeyword: "iade edilemez",
    expectedSourceType: "politika",
    expectedDocKeywords: ["iade", "indirim"],
  },
  {
    id: 9,
    question: "Alüminyum Açılır Kapanır Çerçeve Gönye Köşe - A3 - 30x42 cm - Siyah stok adedi kaçtır?",
    expectedKeyword: "6",
    expectedSourceType: "urun",
    expectedDocKeywords: ["Siyah", "A3"],
  },
  {
    id: 10,
    question: "Yurt dışına kargo gönderimi yapıyor musunuz?",
    expectedKeyword: "Türkiye",
    expectedSourceType: "politika",
    expectedDocKeywords: ["kargo", "Türkiye"],
  },
];

async function runEvaluation() {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRole = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: false as any,
  });

  console.log("=========================================================");
  console.log("📊 ORES RAG & RETRIEVAL KALİTESİ BİRLEŞİK EVALUASYON TESTİ");
  console.log("=========================================================\n");

  let genPassed = 0;
  let retrievalEvaluatedCount = 0;
  let totalReciprocalRank = 0;
  let totalHits = 0;
  let totalPrecisionK = 0;

  const K = 5; // Top-5 retrieval değerlendirmesi

  for (const test of TEST_CASES) {
    console.log(`---------------------------------------------------------`);
    console.log(`[Test ${test.id}/10] Soru: "${test.question}"`);

    if (isSmallTalk(test.question)) {
      const res = await generateSmallTalkReply(test.question);
      console.log(`💬 SmallTalk yanıtı: ${res.content}\n`);
      continue;
    }

    // Step 2: Vektör / Hibrit Retrieval Arama İcrası
    const matches = await resolveMatchesViaTools(supabase, test.question);

    // Step 2 METRİK HESAPLAMA (Retrieval Metrics)
    let firstMatchRank = 0;
    let relevantInTopK = 0;

    if (!test.shouldBeNoInfo && test.expectedDocKeywords) {
      retrievalEvaluatedCount++;

      matches.slice(0, K).forEach((m, idx) => {
        const textToSearch = `${m.source_title} ${m.content}`.toLocaleLowerCase("tr");
        const typeMatch = !test.expectedSourceType || m.source_type === test.expectedSourceType;
        const keywordMatch = test.expectedDocKeywords!.some((kw) =>
          textToSearch.includes(kw.toLocaleLowerCase("tr"))
        );

        if (typeMatch && keywordMatch) {
          relevantInTopK++;
          if (firstMatchRank === 0) {
            firstMatchRank = idx + 1; // 1-indexed rank
          }
        }
      });

      const reciprocalRank = firstMatchRank > 0 ? 1 / firstMatchRank : 0;
      const hit = firstMatchRank > 0 ? 1 : 0;
      const precision = relevantInTopK / Math.min(K, matches.length || 1);

      totalReciprocalRank += reciprocalRank;
      totalHits += hit;
      totalPrecisionK += precision;

      console.log(`🔍 RETRIEVAL (Top-${K}):`);
      console.log(`   - İlk İlgili Doküman Sırası (Rank): ${firstMatchRank > 0 ? `#${firstMatchRank}` : "Bulunamadı (0)"}`);
      console.log(`   - Precision@${K}: %${(precision * 100).toFixed(0)} (${relevantInTopK}/${matches.length})`);
      console.log(`   - Reciprocal Rank (RR): ${reciprocalRank.toFixed(2)}`);
    } else {
      console.log(`🔍 RETRIEVAL: Bu soru negatif/bilgisiz yanıt senaryosudur.`);
    }

    // Step 3: LLM Yanıt Üretimi ve Yanıt Doğruluğu Testi
    const answer = await generateAnswer(test.question, matches);
    const isNoInfo = answer.mode === "no_info" || answer.content.includes("elimde net bir bilgi yok");
    let isSuccess = false;

    if (test.shouldBeNoInfo) {
      isSuccess = isNoInfo;
    } else {
      isSuccess = answer.content.toLowerCase().includes(test.expectedKeyword.toLowerCase());
    }

    if (isSuccess) {
      genPassed++;
      console.log(`🤖 LLM YANITI: ✅ BAŞARILI (Mode: ${answer.mode})`);
      console.log(`   Cevap: ${answer.content.slice(0, 120)}...\n`);
    } else {
      console.log(`🤖 LLM YANITI: ❌ BAŞARISIZ (Beklenen kelime/ifade: "${test.expectedKeyword}")`);
      console.log(`   Gelen Cevap: ${answer.content}\n`);
    }
  }

  const mrr = retrievalEvaluatedCount > 0 ? totalReciprocalRank / retrievalEvaluatedCount : 0;
  const avgHitRate = retrievalEvaluatedCount > 0 ? (totalHits / retrievalEvaluatedCount) * 100 : 0;
  const avgPrecision = retrievalEvaluatedCount > 0 ? (totalPrecisionK / retrievalEvaluatedCount) * 100 : 0;
  const genAccuracy = (genPassed / TEST_CASES.length) * 100;

  console.log("=========================================================");
  console.log("📈 BİRLEŞİK HESAPLANAN EVALUASYON RAPORU (Retrieval + LLM)");
  console.log("=========================================================");
  console.log(`🎯 Retrieval MRR (Mean Reciprocal Rank) : ${mrr.toFixed(3)} / 1.000`);
  console.log(`🎯 Retrieval Hit Rate / Recall@5        : %${avgHitRate.toFixed(1)}`);
  console.log(`🎯 Retrieval Precision@5                : %${avgPrecision.toFixed(1)}`);
  console.log(`---------------------------------------------------------`);
  console.log(`🤖 LLM Uçtan Uca Yanıt Doğruluğu       : ${genPassed}/${TEST_CASES.length} (%${genAccuracy.toFixed(0)})`);
  console.log("=========================================================");
}

runEvaluation().catch((err) => {
  console.error("Test çalıştırma hatası:", err);
  process.exit(1);
});
