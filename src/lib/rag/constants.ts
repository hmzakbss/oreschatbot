import type { ChatCompletionTool } from "openai/resources/chat/completions";

export const NO_INFO_REPLY =
  "Bu konuda elimde net bir bilgi yok, isterseniz sizi yetkili satış danışmanımıza yönlendirebilirim.";

export const RAG_SYSTEM_PROMPT = `Sen ORES Mağaza müşteri asistanısın. Yalnızca aşağıda verilen KAYNAK metinlerine dayanarak Türkçe cevap ver.

Kurallar:
- Kaynaklarda olmayan bilgiyi uydurma.
- Emin değilsen veya kaynaklar soruyu karşılamıyorsa aynen şu cümleyi yaz: "${NO_INFO_REPLY}"
- Fiyat, stok, profil kalınlığı, iade, kargo gibi iddiaları yalnızca kaynaklardan al.
- Bir ürünün hem normal fiyatı hem indirimli fiyatı varsa, geçerli satış fiyatı İNDİRİMLİ FİYAT'tır. Fiyat filtreleme ve değerlendirmelerinde indirimli fiyatı esas al.
- Kullanıcı ürün sayısını veya liste sorduğunda kaynaklardaki ürünlerin fiyatlarını dikkatle kontrol et, matematiksel ve mantıksal çelişkiye düşmeden tüm eşleşen ürünleri eksiksiz say ve listele.
- Kısa ve net cevap ver.
- Kaynak numaralarını cevabın içinde yazma; kaynaklar ayrıca gösterilecek.`;

export const RAG_TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_products",
      description:
        "ORES mağaza ürün kataloğunda arama, renk, profil kalınlığı, köşe tipi (Rondo/Gönye), kategori, malzeme, indirim durumu, stok kodu (SKU), boyut filtreleme ve fiyat/stok sıralaması yapar.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          query: {
            type: ["string", "null"],
            description: "Arama kelimesi (örn. çerçeve, ahşap, alüminyum, rondo, gönye)",
          },
          sku: {
            type: ["string", "null"],
            description: "Ürün stok kodu (örn. M01 PFSS 25 070100 TKx)",
          },
          size: {
            type: ["string", "null"],
            description: "Ürün boyutu (örn. A4, A3, A1, B1, B2, 70x100)",
          },
          color: {
            type: ["string", "null"],
            description: "Ürün rengi (örn. Kırmızı, Siyah, Gümüş, Kahverengi)",
          },
          profile_thickness_mm: {
            type: ["number", "null"],
            description: "Profil kalınlığı mm cinsinden (örn. 25, 32)",
          },
          corner_type: {
            type: ["string", "null"],
            description: "Köşe tipi (örn. Rondo, Gönye)",
          },
          category: {
            type: ["string", "null"],
            description: "Kategori (örn. Afiş Çerçevesi, Reklam Panosu)",
          },
          material: {
            type: ["string", "null"],
            description: "Gövde malzemesi (örn. Alüminyum, Ahşap, Plastik)",
          },
          is_discounted: {
            type: ["boolean", "null"],
            description: "Yalnızca indirimdeki ürünleri filtrele (true/false)",
          },
          max_weight_kg: {
            type: ["number", "null"],
            description: "Maksimum ağırlık kg cinsinden",
          },
          sort_by: {
            type: ["string", "null"],
            enum: ["price_desc", "price_asc", "stock_desc", "relevance", null],
            description:
              "Sıralama: price_desc (en pahalı), price_asc (en ucuz), stock_desc (en çok stok), relevance (varsayılan)",
          },
          min_price: {
            type: ["number", "null"],
            description: "Minimum fiyat TL",
          },
          max_price: {
            type: ["number", "null"],
            description: "Maksimum fiyat TL",
          },
          limit: {
            type: ["number", "null"],
            description: "Getirilecek maksimum ürün sayısı (varsayılan: 5)",
          },
        },
        required: [
          "query",
          "sku",
          "size",
          "color",
          "profile_thickness_mm",
          "corner_type",
          "category",
          "material",
          "is_discounted",
          "max_weight_kg",
          "sort_by",
          "min_price",
          "max_price",
          "limit",
        ],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_policy_info",
      description:
        "İade şartları, kargo ücreti, teslimat süreleri ve mağaza politikaları hakkında bilgi arar.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "Politika arama terimi (örn. iade, kargo, ödeme)",
          },
        },
        required: ["topic"],
        additionalProperties: false,
      },
    },
  },
];
