-- ORES Chatbot — ores.txt zorunlu gereksinimlerine uygun şema
-- Auth: Supabase auth.users | RAG: pgvector | Geçmiş: user_id | Kaynak: messages.sources
-- Not: Idempotent — tablolar zaten varsa (manuel SQL / tekrar deploy) hata vermez.

create extension if not exists vector with schema extensions;

-- Bilgi tabanı (urunler.csv + politikalar.md, 28 ürün dahil)
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  embedding extensions.vector(1536),
  source_type text not null
    check (source_type in ('urun', 'politika')),
  source_id text not null,
  source_title text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists documents_source_type_idx on public.documents (source_type);
create index if not exists documents_embedding_hnsw_idx
  on public.documents
  using hnsw (embedding extensions.vector_cosine_ops);

-- Kullanıcıya bağlı sohbet geçmişi
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversations_user_id_idx on public.conversations (user_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null
    references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_id_idx on public.messages (conversation_id);

-- RLS
alter table public.documents enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "documents_select_authenticated" on public.documents;
create policy "documents_select_authenticated"
  on public.documents
  for select
  to authenticated
  using (true);

drop policy if exists "conversations_own_all" on public.conversations;
create policy "conversations_own_all"
  on public.conversations
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "messages_own_all" on public.messages;
create policy "messages_own_all"
  on public.messages
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Vektör arama (+ opsiyonel fiyat/kategori filtresi)
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
