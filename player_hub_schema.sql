-- =====================================================================
-- FR32SURVIVAL - PLAYER HUB / PERFIL DO JOGADOR
-- Execute este script no Supabase SQL Editor.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Perfis publicos de jogadores sincronizados pelo servidor Minecraft
-- ---------------------------------------------------------------------
create table if not exists public.player_profiles (
  id uuid primary key default gen_random_uuid(),
  minecraft_username text not null,
  minecraft_uuid text,
  bio text default 'Perfil publico do jogador no FR32SURVIVAL.',
  banner_url text,
  first_join_at timestamp with time zone,
  last_login_at timestamp with time zone,
  total_playtime_seconds bigint not null default 0,
  is_online boolean not null default false,
  is_verified boolean not null default false,
  verified_at timestamp with time zone,
  verified_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint player_profiles_username_length check (char_length(trim(minecraft_username)) between 3 and 16),
  constraint player_profiles_username_format check (minecraft_username ~ '^[A-Za-z0-9_]{3,16}$')
);

create unique index if not exists player_profiles_username_lower_idx
  on public.player_profiles (lower(minecraft_username));

create unique index if not exists player_profiles_uuid_idx
  on public.player_profiles (minecraft_uuid)
  where minecraft_uuid is not null;

alter table public.player_profiles enable row level security;

drop policy if exists "Perfis de jogadores sao publicos" on public.player_profiles;
create policy "Perfis de jogadores sao publicos" on public.player_profiles
  for select using (true);

drop policy if exists "Dono verificado pode editar seu perfil" on public.player_profiles;
create policy "Dono verificado pode editar seu perfil" on public.player_profiles
  for update using (
    auth.uid() = verified_by_user_id
  )
  with check (
    auth.uid() = verified_by_user_id
  );

-- ---------------------------------------------------------------------
-- 2. Estatisticas publicas e extensivel para novas metricas
-- ---------------------------------------------------------------------
create table if not exists public.player_stats (
  player_id uuid primary key references public.player_profiles(id) on delete cascade,
  playtime_hours numeric not null default 0,
  deaths bigint not null default 0,
  kills bigint not null default 0,
  blocks_broken bigint not null default 0,
  blocks_placed bigint not null default 0,
  distance_walked numeric not null default 0,
  mobs_killed bigint not null default 0,
  rank text,
  clan text,
  role text,
  homes bigint not null default 0,
  claims bigint not null default 0,
  achievements bigint not null default 0,
  events_won bigint not null default 0,
  extra_stats jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.player_stats enable row level security;

drop policy if exists "Estatisticas de jogadores sao publicas" on public.player_stats;
create policy "Estatisticas de jogadores sao publicas" on public.player_stats
  for select using (true);

-- ---------------------------------------------------------------------
-- 3. Historico publico do jogador
-- ---------------------------------------------------------------------
create table if not exists public.player_activity (
  id bigint generated always as identity primary key,
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  type text not null default 'info',
  title text not null,
  description text,
  icon text default 'fa-solid fa-circle-info',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists player_activity_player_created_idx
  on public.player_activity (player_id, created_at desc);

alter table public.player_activity enable row level security;

drop policy if exists "Historico de jogadores e publico" on public.player_activity;
create policy "Historico de jogadores e publico" on public.player_activity
  for select using (true);

-- ---------------------------------------------------------------------
-- 4. Codigos de verificacao de conta
-- A confirmacao real sera feita pela API/plugin na proxima fase.
-- ---------------------------------------------------------------------
create table if not exists public.player_verifications (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  code_hash text not null,
  expires_at timestamp with time zone not null,
  used_at timestamp with time zone,
  attempts integer not null default 0,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint player_verifications_attempts_check check (attempts >= 0)
);

create index if not exists player_verifications_player_active_idx
  on public.player_verifications (player_id, expires_at)
  where used_at is null;

create index if not exists player_verifications_code_hash_idx
  on public.player_verifications (code_hash);

alter table public.player_verifications enable row level security;

drop policy if exists "Usuario ve suas proprias verificacoes" on public.player_verifications;
create policy "Usuario ve suas proprias verificacoes" on public.player_verifications
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 5. Dados de exemplo para testar a tela antes do plugin sincronizar
-- Remova ou altere depois se quiser.
-- ---------------------------------------------------------------------
insert into public.player_profiles (
  minecraft_username,
  minecraft_uuid,
  bio,
  first_join_at,
  last_login_at,
  total_playtime_seconds,
  is_online,
  is_verified
) values
  ('fabiofr32', 'exemplo-fabiofr32', 'Fundador do FR32SURVIVAL e responsavel pela comunidade.', now() - interval '180 days', now() - interval '2 hours', 720000, false, true),
  ('KellCerejinha', 'exemplo-kellcerejinha', 'Dona do servidor e presenca forte na comunidade.', now() - interval '160 days', now() - interval '1 day', 610000, false, true),
  ('juninww7', 'exemplo-juninww7', 'Administrador e jogador veterano do survival.', now() - interval '140 days', now() - interval '35 minutes', 520000, true, false)
on conflict ((lower(minecraft_username))) do nothing;

insert into public.player_stats (
  player_id,
  playtime_hours,
  deaths,
  kills,
  blocks_broken,
  blocks_placed,
  distance_walked,
  mobs_killed,
  rank,
  clan,
  role,
  homes,
  claims,
  achievements,
  events_won
)
select
  id,
  case minecraft_username
    when 'fabiofr32' then 200
    when 'KellCerejinha' then 169
    else 144
  end,
  case minecraft_username when 'juninww7' then 19 else 12 end,
  case minecraft_username when 'juninww7' then 88 else 54 end,
  12500,
  9800,
  340,
  640,
  case minecraft_username when 'fabiofr32' then 'Dono' when 'KellCerejinha' then 'Dona' else 'Admin' end,
  'FR32',
  case minecraft_username when 'juninww7' then 'Admin' else 'Fundador' end,
  8,
  6,
  22,
  3
from public.player_profiles
where lower(minecraft_username) in ('fabiofr32', 'kellcerejinha', 'juninww7')
on conflict (player_id) do nothing;

insert into public.player_activity (player_id, type, title, description, icon)
select id, 'login', 'Ultimo login registrado', 'Atividade sincronizada como exemplo inicial.', 'fa-solid fa-right-to-bracket'
from public.player_profiles
where lower(minecraft_username) in ('fabiofr32', 'kellcerejinha', 'juninww7')
  and not exists (
    select 1
    from public.player_activity existing
    where existing.player_id = public.player_profiles.id
      and existing.type = 'login'
      and existing.title = 'Ultimo login registrado'
  );
