-- =====================================================================
-- FR32SURVIVAL - SEGURANCA E MODERACAO DE COMENTARIOS
-- Execute no Supabase SQL Editor.
-- =====================================================================

-- 1. Limite de tamanho do comentario.
alter table public.comments
  drop constraint if exists comment_content_length;

alter table public.comments
  add constraint comment_content_length
  check (char_length(trim(content)) between 1 and 300)
  not valid;

-- 2. Campos de moderacao para uso atual/futuro do painel administrativo.
alter table public.comments
  add column if not exists is_hidden boolean not null default false,
  add column if not exists moderation_reason text;

-- Comentarios ocultos deixam de aparecer para visitantes.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'comments'
      and cmd = 'SELECT'
  loop
    execute format('drop policy if exists %I on public.comments', policy_record.policyname);
  end loop;
end;
$$;

create policy "Comentarios publicos sao visiveis para todos"
  on public.comments
  for select
  using (is_hidden = false or public.is_admin(auth.uid()));

drop policy if exists "Admins podem moderar comentarios" on public.comments;
create policy "Admins podem moderar comentarios"
  on public.comments
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- 3. Rate limit no banco: 1 comentario por minuto por usuario.
create or replace function public.enforce_comment_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.user_id <> auth.uid() then
    raise exception 'comment_user_mismatch';
  end if;

  if exists (
    select 1
    from public.comments c
    where c.user_id = auth.uid()
      and c.created_at > now() - interval '60 seconds'
  ) then
    raise exception 'comment_rate_limit';
  end if;

  new.content := trim(new.content);
  return new;
end;
$$;

drop trigger if exists comments_rate_limit_before_insert on public.comments;
create trigger comments_rate_limit_before_insert
  before insert on public.comments
  for each row
  execute function public.enforce_comment_rate_limit();

-- 4. Indices para carregar e moderar comentarios com mais rapidez.
create index if not exists comments_photo_path_created_at_idx
  on public.comments (photo_path, created_at);

create index if not exists comments_user_created_at_idx
  on public.comments (user_id, created_at desc);
