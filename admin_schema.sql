-- =====================================================================
-- ETAPA 1: Script SQL Completo (Tabelas + RLS Policies + Funções)
-- Desenvolvido para o Painel de Administração do Servidor de Minecraft
-- Executar no Supabase SQL Editor
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tabela de Permissões de Usuários (Hierarquia Admin)
-- ---------------------------------------------------------------------
create table if not exists public.user_permissions (
  user_id uuid references auth.users on delete cascade primary key,
  role text not null check (role in ('admin', 'super_admin')),
  email text not null unique
);

-- Habilitar Row Level Security (RLS)
alter table public.user_permissions enable row level security;

-- ---------------------------------------------------------------------
-- 2. Funções de Segurança Auxiliares (Definer privilégios para bypass RLS interno)
-- ---------------------------------------------------------------------

-- Função para verificar se um usuário é administrador ou super administrador
create or replace function public.is_admin(user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.user_permissions
    where user_permissions.user_id = $1
      and role in ('admin', 'super_admin')
  );
end;
$$ language plpgsql security definer set search_path = public, auth;

-- Função (exclusiva para Super Admin) para buscar o ID de um usuário pelo email
create or replace function public.get_user_id_by_email(search_email text)
returns uuid as $$
declare
  found_id uuid;
begin
  -- Segurança no nível da função: Verifica se o e-mail no JWT da sessão atual é o do Super Admin principal
  if (auth.jwt() ->> 'email' = 'fabioribeiro.p13@gmail.com') then
    select id into found_id from auth.users where email = search_email;
    return found_id;
  else
    raise exception 'Acesso negado. Apenas o Super Admin principal pode buscar IDs por e-mail.';
  end if;
end;
$$ language plpgsql security definer set search_path = public, auth;

-- Função (exclusiva para Super Admin) para listar todos os usuários cadastrados com suas permissões
create or replace function public.get_all_users_for_admin()
returns table (
  id uuid,
  email text,
  minecraft_username text,
  role text
) as $$
begin
  -- Segurança no nível da função: Apenas o Super Admin principal pode listar todos os usuários com e-mail
  if (auth.jwt() ->> 'email' = 'fabioribeiro.p13@gmail.com') then
    return query
    select 
      u.id, 
      u.email::text, 
      p.minecraft_username,
      perm.role
    from auth.users u
    left join public.profiles p on p.id = u.id
    left join public.user_permissions perm on perm.user_id = u.id;
  else
    raise exception 'Acesso negado. Apenas o Super Admin principal pode listar os usuários.';
  end if;
end;
$$ language plpgsql security definer set search_path = public, auth;

-- ---------------------------------------------------------------------
-- 3. Proteção Irrevogável do Super Admin
-- ---------------------------------------------------------------------

-- Trigger para impedir a remoção ou rebaixamento do Super Admin fabioribeiro.p13@gmail.com
create or replace function public.check_user_permissions_modification()
returns trigger as $$
begin
  if (old.email = 'fabioribeiro.p13@gmail.com' or new.email = 'fabioribeiro.p13@gmail.com') then
    if (tg_op = 'DELETE') then
      raise exception 'Operação Proibida: O Super Admin principal (fabioribeiro.p13@gmail.com) não pode ser removido do sistema.';
    elsif (tg_op = 'UPDATE' and new.role != 'super_admin') then
      raise exception 'Operação Proibida: O cargo do Super Admin principal não pode ser alterado.';
    elsif (tg_op = 'UPDATE' and new.email != 'fabioribeiro.p13@gmail.com') then
      raise exception 'Operação Proibida: O e-mail do Super Admin principal não pode ser alterado.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, auth;

drop trigger if exists check_super_admin_changes on public.user_permissions;
create trigger check_super_admin_changes
  before update or delete on public.user_permissions
  for each row execute procedure public.check_user_permissions_modification();

-- ---------------------------------------------------------------------
-- 4. Atualização do Trigger de Registro de Novos Usuários
-- ---------------------------------------------------------------------

-- Atualiza a função handle_new_user existente para dar cargo de Super Admin automaticamente a fabioribeiro.p13@gmail.com
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- 1. Cria o perfil público do usuário
  insert into public.profiles (id, minecraft_username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'minecraft_username', 'Jogador_Indefinido')
  )
  on conflict (id) do nothing;

  -- 2. Se for o e-mail do Super Admin principal, insere nas permissões automaticamente
  if new.email = 'fabioribeiro.p13@gmail.com' then
    insert into public.user_permissions (user_id, role, email)
    values (new.id, 'super_admin', new.email)
    on conflict (user_id) do update set role = 'super_admin';
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public, auth;

-- Garante que o Super Admin existente seja registrado caso já tenha criado a conta anteriormente
insert into public.user_permissions (user_id, role, email)
select id, 'super_admin', email
from auth.users
where email = 'fabioribeiro.p13@gmail.com'
on conflict (user_id) do update set role = 'super_admin';

-- ---------------------------------------------------------------------
-- 5. Políticas de RLS para user_permissions
-- ---------------------------------------------------------------------

-- Qualquer usuário autenticado pode ver as permissões (para saber quem é admin)
-- Sem risco de recursão infinita no RLS, pois não chama is_admin() nesta política
drop policy if exists "Usuários autenticados podem ver permissões" on public.user_permissions;
create policy "Usuários autenticados podem ver permissões"
  on public.user_permissions
  for select
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- Apenas o e-mail do Super Admin principal (extraído de forma segura do JWT) pode modificar a tabela
drop policy if exists "Apenas Super Admin pode inserir permissões" on public.user_permissions;
create policy "Apenas Super Admin pode inserir permissões"
  on public.user_permissions
  for insert
  with check (auth.jwt() ->> 'email' = 'fabioribeiro.p13@gmail.com');

drop policy if exists "Apenas Super Admin pode atualizar permissões" on public.user_permissions;
create policy "Apenas Super Admin pode atualizar permissões"
  on public.user_permissions
  for update
  using (auth.jwt() ->> 'email' = 'fabioribeiro.p13@gmail.com')
  with check (auth.jwt() ->> 'email' = 'fabioribeiro.p13@gmail.com');

drop policy if exists "Apenas Super Admin pode deletar permissões" on public.user_permissions;
create policy "Apenas Super Admin pode deletar permissões"
  on public.user_permissions
  for delete
  using (auth.jwt() ->> 'email' = 'fabioribeiro.p13@gmail.com');


-- ---------------------------------------------------------------------
-- 6. Tabela de Veteranos (Jogadores em Destaque)
-- ---------------------------------------------------------------------
create table if not exists public.veterans (
  id bigint generated always as identity primary key,
  minecraft_username text unique not null,
  title text, -- Ex: "Líder Lendário", "Magnata da 1ª Temp"
  description text, -- Descrição do feito do jogador
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint veterans_minecraft_username_format check (minecraft_username ~ '^[A-Za-z0-9_\.]{3,17}$')
);

-- Ativar RLS
alter table public.veterans enable row level security;

-- Políticas de RLS para Veterans
drop policy if exists "Veteranos são visíveis para todos" on public.veterans;
create policy "Veteranos são visíveis para todos"
  on public.veterans
  for select
  using (true);

drop policy if exists "Apenas admins podem gerenciar veteranos" on public.veterans;
create policy "Apenas admins podem gerenciar veteranos"
  on public.veterans
  for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));


-- ---------------------------------------------------------------------
-- 7. Tabelas de Temporadas e Fotos (Galeria)
-- ---------------------------------------------------------------------
-- Remove tabelas antigas caso existam com tipos incompatíveis (evita o erro de foreign key com ID text)
drop table if exists public.season_photos cascade;
drop table if exists public.seasons cascade;

create table public.seasons (
  id bigint generated always as identity primary key,
  number integer unique not null, -- Ex: 9 (para 9ª Temporada)
  name text not null, -- Ex: "O Renascimento"
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.season_photos (
  id bigint generated always as identity primary key,
  season_id bigint references public.seasons on delete cascade not null,
  photo_path text not null unique, -- Caminho no Storage ou URL publica do Supabase
  description text, -- Legenda da foto (opcional)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint season_photos_photo_path_safe check (
    photo_path like 'https://dzfmtmlgbyxnqjdwutfp.supabase.co/storage/v1/object/public/seasons/%'
    or photo_path ~ '^(Images|icon|eventos)/[A-Za-z0-9_ .&%()/-]+\.(png|jpg|jpeg|webp|gif)$'
  )
);


-- Ativar RLS para Seasons e Season Photos
alter table public.seasons enable row level security;
alter table public.season_photos enable row level security;

-- Políticas para public.seasons
drop policy if exists "Temporadas são públicas" on public.seasons;
create policy "Temporadas são públicas"
  on public.seasons for select using (true);

drop policy if exists "Apenas admins podem gerenciar temporadas" on public.seasons;
create policy "Apenas admins podem gerenciar temporadas"
  on public.seasons for all 
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Políticas para public.season_photos
drop policy if exists "Fotos das temporadas são públicas" on public.season_photos;
create policy "Fotos das temporadas são públicas"
  on public.season_photos for select using (true);

drop policy if exists "Apenas admins podem gerenciar fotos das temporadas" on public.season_photos;
create policy "Apenas admins podem gerenciar fotos das temporadas"
  on public.season_photos for all 
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));


-- ---------------------------------------------------------------------
-- 8. Moderação de Comentários (Ajuste na Tabela Existente)
-- ---------------------------------------------------------------------

-- Habilita administradores a excluírem comentários de qualquer usuário.
-- O usuário comum ainda só pode deletar seus próprios comentários.
drop policy if exists "Usuários podem deletar seus próprios comentários" on public.comments;
drop policy if exists "Permite deletar comentários (próprio usuário ou admin)" on public.comments;

create policy "Permite deletar comentários (próprio usuário ou admin)"
  on public.comments
  for delete
  using (auth.uid() = user_id or public.is_admin(auth.uid()));


-- ---------------------------------------------------------------------
-- 9. Criação e Políticas do Storage Bucket (Fotos)
-- ---------------------------------------------------------------------

-- Registrar o bucket de storage 'seasons' se não existir
insert into storage.buckets (id, name, public)
values ('seasons', 'seasons', true)
on conflict (id) do nothing;

-- Remover políticas antigas de storage se houverem
drop policy if exists "Fotos das temporadas são públicas no storage" on storage.objects;
drop policy if exists "Apenas admins podem fazer upload no storage" on storage.objects;
drop policy if exists "Apenas admins podem atualizar fotos no storage" on storage.objects;
drop policy if exists "Apenas admins podem deletar fotos no storage" on storage.objects;

-- Criar novas políticas de acesso para o bucket no storage.objects
create policy "Fotos das temporadas são públicas no storage"
  on storage.objects for select
  using (bucket_id = 'seasons');

create policy "Apenas admins podem fazer upload no storage"
  on storage.objects for insert
  with check (bucket_id = 'seasons' and public.is_admin(auth.uid()));

create policy "Apenas admins podem atualizar fotos no storage"
  on storage.objects for update
  using (bucket_id = 'seasons' and public.is_admin(auth.uid()))
  with check (bucket_id = 'seasons' and public.is_admin(auth.uid()));

create policy "Apenas admins podem deletar fotos no storage"
  on storage.objects for delete
  using (bucket_id = 'seasons' and public.is_admin(auth.uid()));
