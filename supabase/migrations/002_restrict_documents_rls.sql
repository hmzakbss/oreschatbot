-- Migration 002: documents tablosuna istemci doğrudan SELECT erişimini kapatma ve fonksiyonları security definer yapma

-- 1. Ürün dokümanlarını çeken güvenli RPC fonksiyonu (security definer)
create or replace function public.get_product_documents()
returns table (
  id uuid,
  content text,
  metadata jsonb,
  source_type text,
  source_id text,
  source_title text
)
language sql
security definer
stable
as $$
  select
    d.id,
    d.content,
    d.metadata,
    d.source_type,
    d.source_id,
    d.source_title
  from public.documents d
  where d.source_type = 'urun';
$$;

grant execute on function public.get_product_documents() to authenticated, service_role;

-- 2. match_documents fonksiyonunu security definer yaparak RLS kısıtlamasından bağımsız güvenli çalışmasını sağlama
create or replace function public.match_documents (
  query_embedding extensions.vector(1536),
  match_count int default 6,
  filter_source_type text default null,
  filter_category text default null,
  filter_max_price numeric default null,
  match_threshold float default 0.25
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  source_type text,
  source_id text,
  source_title text,
  similarity float
)
language sql
security definer
stable
as $$
  select
    d.id,
    d.content,
    d.metadata,
    d.source_type,
    d.source_id,
    d.source_title,
    1 - (d.embedding <=> query_embedding) as similarity
  from public.documents d
  where
    d.embedding is not null
    and (filter_source_type is null or d.source_type = filter_source_type)
    and (
      filter_category is null
      or d.metadata->>'kategori' = filter_category
    )
    and (
      filter_max_price is null
      or (
        coalesce(
          nullif(d.metadata->>'indirimli_fiyat_tl', '')::numeric,
          (d.metadata->>'fiyat_tl')::numeric
        ) <= filter_max_price
      )
    )
    and 1 - (d.embedding <=> query_embedding) >= match_threshold
  order by d.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

grant execute on function public.match_documents(
  extensions.vector,
  int,
  text,
  text,
  numeric,
  float
) to authenticated, service_role;

-- 3. İstemcinin (authenticated kullanıcıların) documents tablosunu doğrudan SELECT etmesini tamamen kapat
drop policy if exists "documents_select_authenticated" on public.documents;
