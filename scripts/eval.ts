import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import {
  detectMaxPriceFilter,
  detectSourceTypeFilter,
  embedQuery,
  generateAnswer,
  generateSmallTalkReply,
  isSmallTalk,
  matchDocuments,
  NO_INFO_REPLY,
} from "../src/lib/rag";

(globalThis as any).WebSocket = WebSocket;
loadEnv({ path: resolve(process.cwd(), ".env.local") });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Eksik ortam değişkeni: ${name}`);
  return value;
}

type TestCase = {
  id: number;
  question: string;
  expectedKeyword: string;
  shouldBeNoInfo?: boolean;
};

const TEST_CASES: TestCase[] = [
  {
    id: 1,
    question: "İade süresi kaç gündür?",
    expectedKeyword: "14",
  },
  {
    id: 2,
    question: "750 TL altındaki siparişlerde kargo ücreti kime aittir?",
    expectedKeyword: "alıcı",
  },
  {
    id: 3,
    question: "Alüminyum Açılır Kapanır Çerçeve - A4 - 21x30 cm - Kırmızı - 25mm Gönye Köşe fiyatı nedir?",
    expectedKeyword: "465",
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
  },
  {
    id: 6,
    question: "Hangi kargo firması ile çalışıyorsunuz?",
    expectedKeyword: "Yurtiçi",
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
  },
  {
    id: 9,
    question: "Alüminyum Açılır Kapanır Çerçeve Gönye Köşe - A3 - 30x42 cm - Siyah stok adedi kaçtır?",
    expectedKeyword: "6",
  },
  {
    id: 10,
    question: "Yurt dışına kargo gönderimi yapıyor musunuz?",
    expectedKeyword: "Türkiye",
  },
];

async function runEvaluation() {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRole = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: false as any,
  });

  console.log("---------------------------------------------------------");
  console.log("🧪 ORES RAG Motoru 10 Örnek Soru Otomatik Doğruluk Testi");
  console.log("---------------------------------------------------------\n");

  let passed = 0;

  for (const test of TEST_CASES) {
    console.log(`[Test ${test.id}/10] Soru: "${test.question}"`);

    if (isSmallTalk(test.question)) {
      const res = await generateSmallTalkReply(test.question);
      console.log(`💬 SmallTalk yanıtı: ${res.content}\n`);
      continue;
    }

    const embedding = await embedQuery(test.question);
    const filterSourceType = detectSourceTypeFilter(test.question);
    const filterMaxPrice = detectMaxPriceFilter(test.question);
    const matches = await matchDocuments(supabase, embedding, {
      filterSourceType,
      filterMaxPrice,
    });
    const answer = await generateAnswer(test.question, matches);

    const isNoInfo = answer.mode === "no_info" || answer.content.includes("elimde net bir bilgi yok");
    let isSuccess = false;

    if (test.shouldBeNoInfo) {
      isSuccess = isNoInfo;
    } else {
      isSuccess = answer.content.toLowerCase().includes(test.expectedKeyword.toLowerCase());
    }

    if (isSuccess) {
      passed++;
      console.log(`✅ BAŞARILI! Mode: ${answer.mode} | Kaynak Sayısı: ${answer.sources.length}`);
      console.log(`   Cevap: ${answer.content.slice(0, 120)}...\n`);
    } else {
      console.log(`❌ BAŞARISIZ! Beklenen: ${test.expectedKeyword}`);
      console.log(`   Gelen Cevap: ${answer.content}\n`);
    }
  }

  const score = (passed / TEST_CASES.length) * 100;
  console.log("---------------------------------------------------------");
  console.log(`📊 TEST SONUCU: ${passed}/${TEST_CASES.length} (%${score.toFixed(0)} Doğruluk)`);
  console.log("---------------------------------------------------------");
}

runEvaluation().catch((err) => {
  console.error("Test çalıştırma hatası:", err);
  process.exit(1);
});
