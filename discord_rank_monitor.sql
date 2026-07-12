-- =====================================================================
-- FR32SURVIVAL - MONITOR DE RANKINGS PARA DISCORD
-- Execute este script no Supabase SQL Editor antes de ativar a funcao
-- agendada do Netlify.
-- =====================================================================

create table if not exists public.site_monitor_snapshots (
  key text primary key,
  snapshot jsonb not null default '{}'::jsonb,
  signature text not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.site_monitor_snapshots enable row level security;

-- Sem politicas publicas: a tabela e usada apenas pela service role do Netlify.
-- A service role ignora RLS, entao nao precisa liberar acesso anon/authenticated.
