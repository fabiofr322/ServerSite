-- =====================================================================
-- FR32SURVIVAL - NOTÍCIAS E EVENTOS DO SITE
-- Executar no Supabase SQL Editor
-- =====================================================================

create table if not exists public.site_announcements (
  id bigint generated always as identity primary key,
  type text not null check (type in ('news', 'event')),
  title text not null check (char_length(trim(title)) between 3 and 90),
  tag text not null check (char_length(trim(tag)) between 2 and 32),
  event_time text check (event_time is null or char_length(trim(event_time)) <= 20),
  content text not null check (char_length(trim(content)) between 3 and 280),
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists site_announcements_public_idx
on public.site_announcements (is_published, type, sort_order, created_at desc);

create unique index if not exists site_announcements_seed_unique_idx
on public.site_announcements (type, title);

alter table public.site_announcements enable row level security;

drop policy if exists "Notícias e eventos publicados são públicos" on public.site_announcements;
create policy "Notícias e eventos publicados são públicos"
on public.site_announcements
for select
using (is_published = true or public.is_admin(auth.uid()));

drop policy if exists "Admins podem criar notícias e eventos" on public.site_announcements;
create policy "Admins podem criar notícias e eventos"
on public.site_announcements
for insert
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins podem atualizar notícias e eventos" on public.site_announcements;
create policy "Admins podem atualizar notícias e eventos"
on public.site_announcements
for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins podem deletar notícias e eventos" on public.site_announcements;
create policy "Admins podem deletar notícias e eventos"
on public.site_announcements
for delete
using (public.is_admin(auth.uid()));

insert into public.site_announcements (type, title, tag, event_time, content, sort_order, is_published)
values
  ('news', 'Nova fase do FR32SURVIVAL', 'Temporada', null, 'O contador prepara a comunidade para a próxima etapa do servidor. Fique no Discord para avisos oficiais.', 10, true),
  ('news', 'Ranks ao vivo em implantação', 'Rankings', null, 'Os dados do FrTopRanks serão exibidos no site assim que o endpoint do plugin estiver liberado no host.', 20, true),
  ('event', 'Evento PvP', 'Sábado', '20:00', 'Evento PvP ou desafio anunciado no Discord.', 10, true),
  ('event', 'Caça ao Tesouro', 'Domingo', '18:00', 'Caça ao tesouro, build challenge ou atividade da temporada.', 20, true)
on conflict (type, title) do nothing;
