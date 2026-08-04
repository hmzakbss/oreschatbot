import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "csv-parse/sync";
import { config as loadEnv } from "dotenv";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: resolve(process.cwd(), ".env.local") });

type SourceType = "urun" | "politika";

type DocumentRow = {
  content: string;
  source_type: SourceType;
  source_id: string;
  source_title: string;
  metadata: Record<string, unknown>;
  embedding?: number[];
};

const EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
const EMBEDDING_DIM = 1536;
const BATCH_SIZE = 32;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Eksik ortam değişkeni: ${name}`);
  }
  return value;
}

function buildProductDocuments(): DocumentRow[] {
  const csvPath = resolve(process.cwd(), "data/urunler.csv");
  const raw = readFileSync(csvPath, "utf8");
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    bom: true,
  }) as Record<string, string>[];

  if (rows.length !== 28) {
    console.warn(
      `Uyarı: Beklenen 28 ürün, okunan ${rows.length}. Devam ediliyor.`,
    );
  }

  return rows.map((row) => {
    const fiyat = Number(row.fiyat_tl);
    const stok = Number(row.stok_adedi);
    const profil = row.profil_kalinligi_mm
      ? Number(row.profil_kalinligi_mm)
      : null;

    const content = [
      `Ürün: ${row.urun_adi}`,
      `SKU: ${row.sku}`,
      `Kategori: ${row.kategori}`,
      `Boyut: ${row.boyut} (${row.olcu})`,
      `Malzeme: ${row.malzeme}`,
      profil != null && !Number.isNaN(profil)
        ? `Profil kalınlığı: ${profil} mm`
        : null,
      row.kose_tipi ? `Köşe tipi: ${row.kose_tipi}` : null,
      row.renk ? `Renk: ${row.renk}` : null,
      row.agirlik_kg ? `Ağırlık: ${row.agirlik_kg} kg` : null,
      `Fiyat: ${row.fiyat_tl} TL`,
      row.indirimli_fiyat_tl
        ? `İndirimli fiyat: ${row.indirimli_fiyat_tl} TL`
        : null,
      `Stok: ${row.stok_adedi}`,
      row.durum ? `Durum: ${row.durum}` : null,
      row.urun_url ? `Ürün URL: ${row.urun_url}` : null,
      "",
      "Açıklama:",
      (row.aciklama ?? "").trim(),
    ]
      .filter((line) => line !== null)
      .join("\n");

    return {
      content,
      source_type: "urun" as const,
      source_id: row.sku,
      source_title: row.urun_adi,
      metadata: {
        sku: row.sku,
        kategori: row.kategori,
        fiyat_tl: Number.isFinite(fiyat) ? fiyat : null,
        indirimli_fiyat_tl: row.indirimli_fiyat_tl
          ? Number(row.indirimli_fiyat_tl)
          : null,
        stok_adedi: Number.isFinite(stok) ? stok : null,
        boyut: row.boyut,
        olcu: row.olcu,
        malzeme: row.malzeme,
        profil_kalinligi_mm: profil,
        kose_tipi: row.kose_tipi || null,
        renk: row.renk || null,
        urun_url: row.urun_url || null,
      },
    };
  });
}

function buildPolicyDocuments(): DocumentRow[] {
  const mdPath = resolve(process.cwd(), "data/politikalar.md");
  const md = readFileSync(mdPath, "utf8");

  // Frontmatter'ı at
  const body = md.replace(/^---[\s\S]*?---\s*/, "");
  const lines = body.split(/\r?\n/);

  type Section = { heading: string; lines: string[] };
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      if (current) sections.push(current);
      current = { heading: h2[1].trim(), lines: [] };
      continue;
    }
    if (!current) continue;
    current.lines.push(line);
  }
  if (current) sections.push(current);

  const docs: DocumentRow[] = [];

  for (const section of sections) {
    // İçindekiler RAG için gürültü
    if (/^i[cç]indekiler$/i.test(section.heading)) continue;

    const sectionBody = section.lines.join("\n").trim();
    const sourceIdMatch = section.heading.match(/^(\d+(?:\.\d+)*)/);
    const sectionId = sourceIdMatch?.[1] ?? slugify(section.heading);

    // Uzun bölümleri ### alt başlıklara böl
    const subHeads = [...sectionBody.matchAll(/^###\s+(.+)$/gm)];
    if (sectionBody.length > 1800 && subHeads.length > 0) {
      const parts = splitBySubheadings(section.heading, sectionBody);
      for (const part of parts) {
        docs.push({
          content: part.content,
          source_type: "politika",
          source_id: part.id,
          source_title: part.title,
          metadata: {
            belge: "politikalar.md",
            bolum: section.heading,
            alt_bolum: part.subtitle,
          },
        });
      }
    } else {
      docs.push({
        content: `# ${section.heading}\n\n${sectionBody}`.trim(),
        source_type: "politika",
        source_id: sectionId,
        source_title: section.heading,
        metadata: {
          belge: "politikalar.md",
          bolum: section.heading,
        },
      });
    }
  }

  return docs;
}

function splitBySubheadings(
  parentHeading: string,
  body: string,
): { id: string; title: string; subtitle: string; content: string }[] {
  const lines = body.split(/\r?\n/);
  const chunks: {
    id: string;
    title: string;
    subtitle: string;
    content: string;
  }[] = [];

  let subtitle = "genel";
  let buf: string[] = [];

  const flush = () => {
    const text = buf.join("\n").trim();
    if (!text) return;
    const idMatch = subtitle.match(/^(\d+(?:\.\d+)*)/);
    const id =
      idMatch?.[1] ?? `${slugify(parentHeading)}-${slugify(subtitle)}`;
    chunks.push({
      id,
      title: `${parentHeading} — ${subtitle}`,
      subtitle,
      content: `# ${parentHeading}\n\n## ${subtitle}\n\n${text}`,
    });
  };

  for (const line of lines) {
    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      flush();
      subtitle = h3[1].trim();
      buf = [];
      continue;
    }
    buf.push(line);
  }
  flush();
  return chunks;
}

function slugify(value: string): string {
  return value
    .toLocaleLowerCase("tr")
    .replace(/[^a-z0-9çğıöşü]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function embedAll(
  openai: OpenAI,
  docs: DocumentRow[],
): Promise<DocumentRow[]> {
  const out: DocumentRow[] = [];

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = docs.slice(i, i + BATCH_SIZE);
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch.map((d) => d.content),
    });

    for (let j = 0; j < batch.length; j++) {
      const embedding = response.data[j]?.embedding;
      if (!embedding || embedding.length !== EMBEDDING_DIM) {
        throw new Error(
          `Beklenmeyen embedding boyutu: ${embedding?.length ?? 0}`,
        );
      }
      out.push({ ...batch[j], embedding });
    }

    console.log(
      `Embedding: ${Math.min(i + BATCH_SIZE, docs.length)}/${docs.length}`,
    );
  }

  return out;
}

async function main() {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRole = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const openaiKey = requireEnv("OPENAI_API_KEY");

  const openai = new OpenAI({ apiKey: openaiKey });
  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const products = buildProductDocuments();
  const policies = buildPolicyDocuments();
  const all = [...products, ...policies];

  console.log(
    `Hazırlanan kayıtlar → ürün: ${products.length}, politika: ${policies.length}, toplam: ${all.length}`,
  );

  const withEmbeddings = await embedAll(openai, all);

  // Idempotent: önce temizle
  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (deleteError) {
    throw new Error(`documents silinemedi: ${deleteError.message}`);
  }

  // Insert batches
  for (let i = 0; i < withEmbeddings.length; i += BATCH_SIZE) {
    const batch = withEmbeddings.slice(i, i + BATCH_SIZE).map((doc) => ({
      content: doc.content,
      embedding: doc.embedding,
      source_type: doc.source_type,
      source_id: doc.source_id,
      source_title: doc.source_title,
      metadata: doc.metadata,
    }));

    const { error: insertError } = await supabase
      .from("documents")
      .insert(batch);

    if (insertError) {
      throw new Error(`documents insert hatası: ${insertError.message}`);
    }
  }

  const { count, error: countError } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true });

  if (countError) {
    throw new Error(`count alınamadı: ${countError.message}`);
  }

  console.log(`Ingest tamam. documents satır sayısı: ${count}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
