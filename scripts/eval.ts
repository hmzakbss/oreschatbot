import type { SupabaseClient } from "@supabase/supabase-js";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { runAgentChat } from "../src/lib/agent";
import { generateSmallTalkReply, isSmallTalk, NO_INFO_REPLY } from "../src/lib/rag";

loadEnv({ path: resolve(process.cwd(), ".env.local") });

type Case = {
  id: string;
  question: string;
  expect: "rag" | "no_info" | "small_talk";
  /** Cevapta geçmesi gereken parçalar (küçük harf) */
  includes?: string[];
};

const CASES: Case[] = [
  {
    id: "iade",
    question: "İade süresi kaç gün?",
    expect: "rag",
    includes: ["14"],
  },
  {
    id: "kargo_ucretsiz",
    question: "Kaç TL üzeri kargo ücretsiz?",
    expect: "rag",
    includes: ["750"],
  },
  {
    id: "max_price",
    question: "en pahalı ürün hangisi",
    expect: "rag",
    includes: ["5900"],
  },
  {
    id: "min_price",
    question: "en ucuz ürün hangisi",
    expect: "rag",
    includes: ["420"],
  },
  {
    id: "top3",
    question: "en pahalı üç ürün hangisi",
    expect: "rag",
    includes: ["5900"],
  },
  {
    id: "b1_fiyat",
    question: "Bu B1 çerçeve kaç TL?",
    expect: "rag",
    includes: ["tl"],
  },
  {
    id: "no_iphone",
    question: "Mağazanızda iPhone satıyor musunuz?",
    expect: "no_info",
  },
  {
    id: "no_weather",
    question: "Yarın yağmur yağacak mı?",
    expect: "no_info",
  },
  {
    id: "hi",
    question: "Merhaba, nasılsın?",
    expect: "small_talk",
  },
  {
    id: "thanks",
    question: "teşekkürler",
    expect: "small_talk",
  },
];

async function answerQuestion(supabase: SupabaseClient, question: string) {
  if (isSmallTalk(question)) {
    return generateSmallTalkReply(question);
  }
  return runAgentChat(supabase, question);
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY gerekli");
  }
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY gerekli");
  }

  const supabase = createClient(url, key);
  let pass = 0;

  console.log("\nORES eval — tool-calling agent\n");

  for (const c of CASES) {
    const result = await answerQuestion(supabase, c.question);
    const text = result.content.toLocaleLowerCase("tr");
    const modeOk = result.mode === c.expect;
    const includesOk =
      !c.includes ||
      c.includes.every((p) => text.includes(p.toLocaleLowerCase("tr")));
    const noInfoOk =
      c.expect !== "no_info" ||
      result.content.includes("elimde net bir bilgi yok") ||
      result.content === NO_INFO_REPLY;

    const ok = modeOk && includesOk && noInfoOk;
    if (ok) pass += 1;

    const mark = ok ? "PASS" : "FAIL";
    console.log(
      `[${mark}] ${c.id.padEnd(16)} mode=${result.mode.padEnd(10)} sources=${result.sources.length}`,
    );
    if (!ok) {
      console.log(`       Q: ${c.question}`);
      console.log(`       A: ${result.content.slice(0, 160)}`);
      if (!modeOk) console.log(`       expected mode ${c.expect}`);
      if (!includesOk) console.log(`       missing: ${c.includes?.join(", ")}`);
    }
  }

  console.log(`\nSonuç: ${pass}/${CASES.length}\n`);
  process.exit(pass === CASES.length ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
