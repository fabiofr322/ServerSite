-- =====================================================================
-- FR32SURVIVAL - PLAYER HUB: REMOVER CAMPO DE DINHEIRO
-- Execute no Supabase SQL Editor se a tabela player_stats ja foi criada.
-- =====================================================================

alter table public.player_stats
drop column if exists money;
