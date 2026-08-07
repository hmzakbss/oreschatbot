export type MatchedDocument = {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  source_type: "urun" | "politika";
  source_id: string;
  source_title: string;
  similarity: number;
};

export type ChatSource = {
  source_type: "urun" | "politika";
  source_id: string;
  source_title: string;
  similarity: number;
  urun_url?: string | null;
};

export type ProductSearchArgs = {
  query?: string | null;
  sku?: string | null;
  size?: string | null;
  color?: string | null;
  profile_thickness_mm?: number | null;
  corner_type?: string | null;
  category?: string | null;
  material?: string | null;
  is_discounted?: boolean | null;
  max_weight_kg?: number | null;
  sort_by?: "price_desc" | "price_asc" | "stock_desc" | "relevance" | null;
  min_price?: number | null;
  max_price?: number | null;
  limit?: number | null;
};

export type PreviousMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AnswerResult = {
  content: string;
  sources: ChatSource[];
  /** Yalnızca 'rag' iken kaynak gösterilir */
  mode: "rag" | "small_talk" | "no_info";
};
