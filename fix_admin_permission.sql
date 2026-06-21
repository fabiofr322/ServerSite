-- =====================================================================
-- SQL CORREÇÃO: PERMISSÃO DO SUPER ADMIN (CASE-INSENSITIVE)
-- =====================================================================
-- Execute este script no SQL Editor do Supabase para garantir que o 
-- seu usuário (fabioribeiro.p13@gmail.com) seja reconhecido no banco 
-- como Super Admin, mesmo se houver letras maiúsculas no e-mail cadastrado.
-- =====================================================================

-- 1. Inserir/Atualizar o Super Admin de forma insensível a maiúsculas/minúsculas
insert into public.user_permissions (user_id, role, email)
select id, 'super_admin', email
from auth.users
where lower(email) = 'fabioribeiro.p13@gmail.com'
on conflict (user_id) do update set role = 'super_admin';

-- 2. Atualizar o trigger para que novos registros de Super Admin também sejam case-insensitive
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Cria o perfil público do usuário
  insert into public.profiles (id, minecraft_username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'minecraft_username', 'Jogador_Indefinido')
  )
  on conflict (id) do nothing;

  -- Se for o e-mail do Super Admin principal (case-insensitive), insere nas permissões automaticamente
  if lower(new.email) = 'fabioribeiro.p13@gmail.com' then
    insert into public.user_permissions (user_id, role, email)
    values (new.id, 'super_admin', new.email)
    on conflict (user_id) do update set role = 'super_admin';
  end if;

  return new;
end;
$$ language plpgsql security definer;
