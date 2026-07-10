-- SQL para habilitar nicks do Minecraft com pontos (.) e comprimento de até 17 caracteres (Bedrock/GeyserMC)
-- Execute este script no editor SQL do Supabase.

-- 1. Atualizar restrições na tabela public.profiles
alter table public.profiles
  drop constraint if exists profiles_minecraft_username_format;
alter table public.profiles
  add constraint profiles_minecraft_username_format
  check (minecraft_username ~ '^[A-Za-z0-9_\.]{3,17}$')
  not valid;

-- 2. Atualizar restrições na tabela public.player_profiles
alter table public.player_profiles
  drop constraint if exists player_profiles_username_length;
alter table public.player_profiles
  add constraint player_profiles_username_length
  check (char_length(trim(minecraft_username)) between 3 and 17);

alter table public.player_profiles
  drop constraint if exists player_profiles_username_format;
alter table public.player_profiles
  add constraint player_profiles_username_format
  check (minecraft_username ~ '^[A-Za-z0-9_\.]{3,17}$');

-- 3. Atualizar restrições na tabela public.veterans
alter table public.veterans
  drop constraint if exists veterans_minecraft_username_format;
alter table public.veterans
  add constraint veterans_minecraft_username_format
  check (minecraft_username ~ '^[A-Za-z0-9_\.]{3,17}$')
  not valid;

-- 4. Atualizar a trigger function de cadastro de novo usuário
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  requested_username text;
begin
  requested_username := trim(new.raw_user_meta_data->>'minecraft_username');

  if requested_username is null
     or requested_username !~ '^[A-Za-z0-9_\.]{3,17}$' then
    raise exception using
      message = 'invalid_minecraft_username',
      errcode = 'check_violation';
  end if;

  insert into public.profiles (id, minecraft_username, email)
  values (new.id, requested_username, new.email)
  on conflict (id) do update
    set minecraft_username = excluded.minecraft_username,
        email = excluded.email;

  if lower(coalesce(new.email, '')) = 'fabioribeiro.p13@gmail.com' then
    insert into public.user_permissions (user_id, role, email)
    values (new.id, 'super_admin', new.email)
    on conflict (user_id) do update
      set role = excluded.role,
          email = excluded.email;
  end if;

  return new;
end;
$$;
