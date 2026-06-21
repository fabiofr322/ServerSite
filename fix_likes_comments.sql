-- =====================================================================
-- SQL PATCH: CORREÇÃO DO SISTEMA DE CURTIDAS E COMENTÁRIOS
-- =====================================================================
-- Execute este script no SQL Editor do Supabase caso as tabelas tenham 
-- sido removidas acidentalmente por efeitos colaterais de CASCADE ou 
-- se as políticas de RLS precisarem ser resetadas.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tabela de Perfis de Usuários (Profiles)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  minecraft_username text unique not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint username_length check (char_length(minecraft_username) >= 3)
);

-- Habilitar RLS
alter table public.profiles enable row level security;

-- Políticas de RLS para Profiles
drop policy if exists "Perfis públicos são visíveis para todos" on public.profiles;
create policy "Perfis públicos são visíveis para todos" on public.profiles
  for select using (true);

drop policy if exists "Usuários autenticados podem criar seu próprio perfil" on public.profiles;
create policy "Usuários autenticados podem criar seu próprio perfil" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Usuários podem atualizar seu próprio perfil" on public.profiles;
create policy "Usuários podem atualizar seu próprio perfil" on public.profiles
  for update using (auth.uid() = id);


-- ---------------------------------------------------------------------
-- 2. Tabela de Curtidas (Likes)
-- ---------------------------------------------------------------------
create table if not exists public.likes (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  photo_path text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, photo_path)
);

-- Habilitar RLS
alter table public.likes enable row level security;

-- Políticas de RLS para Likes
drop policy if exists "Curtidas são visíveis para todos" on public.likes;
create policy "Curtidas são visíveis para todos" on public.likes
  for select using (true);

drop policy if exists "Usuários autenticados podem curtir fotos" on public.likes;
create policy "Usuários autenticados podem curtir fotos" on public.likes
  for insert with check (auth.uid() = user_id);

drop policy if exists "Usuários podem remover suas próprias curtidas" on public.likes;
create policy "Usuários podem remover suas próprias curtidas" on public.likes
  for delete using (auth.uid() = user_id);


-- ---------------------------------------------------------------------
-- 3. Tabela de Comentários (Comments)
-- ---------------------------------------------------------------------
create table if not exists public.comments (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  photo_path text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint comment_content_length check (char_length(trim(content)) >= 1)
);

-- Habilitar RLS
alter table public.comments enable row level security;

-- Políticas de RLS para Comments
drop policy if exists "Comentários são visíveis para todos" on public.comments;
create policy "Comentários são visíveis para todos" on public.comments
  for select using (true);

drop policy if exists "Usuários autenticados podem comentar" on public.comments;
create policy "Usuários autenticados podem comentar" on public.comments
  for insert with check (auth.uid() = user_id);

drop policy if exists "Usuários podem deletar seus próprios comentários" on public.comments;
drop policy if exists "Permite deletar comentários (próprio usuário ou admin)" on public.comments;
create policy "Permite deletar comentários (próprio usuário ou admin)" on public.comments
  for delete using (auth.uid() = user_id or public.is_admin(auth.uid()));
