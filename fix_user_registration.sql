-- Repara a criacao automatica do perfil durante o cadastro.
-- Pode ser executado mais de uma vez no Supabase SQL Editor.

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
     or requested_username !~ '^[A-Za-z0-9_]{3,16}$' then
    raise exception using
      message = 'invalid_minecraft_username',
      errcode = 'check_violation';
  end if;

  insert into public.profiles (id, minecraft_username)
  values (new.id, requested_username)
  on conflict (id) do update
    set minecraft_username = excluded.minecraft_username;

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

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
