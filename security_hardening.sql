-- =====================================================================
-- SECURITY HARDENING PATCH
-- Execute no Supabase SQL Editor depois do schema principal.
-- =====================================================================

-- Restringe leitura de permissões administrativas.
drop policy if exists "Usuários autenticados podem ver permissões" on public.user_permissions;
create policy "Usuários autenticados podem ver permissões"
  on public.user_permissions
  for select
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- Valida nicks no padrão do Minecraft em novos registros/alterações.
alter table public.profiles
  drop constraint if exists username_length;
alter table public.profiles
  drop constraint if exists profiles_minecraft_username_format;
alter table public.profiles
  add constraint profiles_minecraft_username_format
  check (minecraft_username ~ '^[A-Za-z0-9_\.]{3,17}$')
  not valid;

alter table public.veterans
  drop constraint if exists veterans_minecraft_username_format;
alter table public.veterans
  add constraint veterans_minecraft_username_format
  check (minecraft_username ~ '^[A-Za-z0-9_\.]{3,17}$')
  not valid;

-- Limita tamanho de comentários para reduzir spam e payloads grandes.
alter table public.comments
  drop constraint if exists comment_content_length;
alter table public.comments
  add constraint comment_content_length
  check (char_length(trim(content)) between 1 and 500)
  not valid;

-- Limita caminhos de fotos a storage público do Supabase ou assets locais conhecidos.
alter table public.season_photos
  drop constraint if exists season_photos_photo_path_safe;
alter table public.season_photos
  add constraint season_photos_photo_path_safe
  check (
    photo_path like 'https://dzfmtmlgbyxnqjdwutfp.supabase.co/storage/v1/object/public/seasons/%'
    or photo_path ~ '^(Images|icon|eventos)/[A-Za-z0-9_ .&%()/-]+\.(png|jpg|jpeg|webp|gif)$'
  )
  not valid;

-- Define search_path explícito nas funções com privilégios elevados.
alter function public.is_admin(uuid) set search_path = public, auth;
alter function public.get_user_id_by_email(text) set search_path = public, auth;
alter function public.get_all_users_for_admin() set search_path = public, auth;
alter function public.check_user_permissions_modification() set search_path = public, auth;
alter function public.handle_new_user() set search_path = public, auth;
