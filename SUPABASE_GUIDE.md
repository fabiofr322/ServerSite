# Guia Passo a Passo: Configuração do Supabase

Siga os passos abaixo para configurar o Supabase gratuitamente para o seu site hospedado na Netlify.

---

## Passo 1: Criar sua Conta e Projeto

1. Acesse [supabase.com](https://supabase.com) e clique em **Start your project** ou **Sign In**.
2. Faça login usando sua conta do GitHub ou e-mail.
3. No painel principal, clique em **+ New Project**.
4. Selecione a sua **Organization** (geralmente com o seu nome de usuário).
5. Preencha as informações do projeto:
   - **Name**: Ex: `Fr32Survival-Website`
   - **Database Password**: Escolha uma senha forte e anote-a (você não precisará dela no código, mas ela é necessária para a segurança do banco).
   - **Region**: Selecione uma região próxima a você/seus jogadores (ex: `South America (São Paulo)` ou `East US`).
   - **Pricing Plan**: Escolha o plano **Free** (Gratuito).
6. Clique em **Create new project** e aguarde alguns minutos enquanto o Supabase configura a infraestrutura e o banco de dados.

---

## Passo 2: Executar o Script do Banco de Dados

1. Quando o projeto estiver pronto, localize o menu lateral esquerdo e clique em **SQL Editor** (o ícone com o símbolo `SQL` ou `>_`).
2. Clique em **+ New query** (ou **Quick start** -> **New Blank Query**).
3. Copie o script SQL abaixo e cole no campo de texto:

```sql
-- 1. Tabela de Perfis de Usuários (Minecraft)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  minecraft_username text unique not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint username_length check (char_length(minecraft_username) >= 3)
);

-- Ativar RLS para profiles
alter table public.profiles enable row level security;

-- Recriar políticas para profiles
drop policy if exists "Perfis públicos são visíveis para todos" on public.profiles;
create policy "Perfis públicos são visíveis para todos" on public.profiles
  for select using (true);

drop policy if exists "Usuários autenticados podem criar seu próprio perfil" on public.profiles;
create policy "Usuários autenticados podem criar seu próprio perfil" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Usuários podem atualizar seu próprio perfil" on public.profiles;
create policy "Usuários podem atualizar seu próprio perfil" on public.profiles
  for update using (auth.uid() = id);

-- 2. Tabela de Curtidas (Likes) nas Fotos
create table if not exists public.likes (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  photo_path text not null, -- Caminho da imagem, ex: 'Images/9_Temporada/Junin_Boss1.png'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Um usuário só pode curtir uma foto específica uma vez
  unique(user_id, photo_path)
);

-- Ativar RLS para likes
alter table public.likes enable row level security;

-- Recriar políticas para likes
drop policy if exists "Curtidas são visíveis para todos" on public.likes;
create policy "Curtidas são visíveis para todos" on public.likes
  for select using (true);

drop policy if exists "Usuários autenticados podem curtir fotos" on public.likes;
create policy "Usuários autenticados podem curtir fotos" on public.likes
  for insert with check (auth.uid() = user_id);

drop policy if exists "Usuários podem remover suas próprias curtidas" on public.likes;
create policy "Usuários podem remover suas próprias curtidas" on public.likes
  for delete using (auth.uid() = user_id);

-- 3. Tabela de Comentários nas Fotos
create table if not exists public.comments (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  photo_path text not null, -- Caminho da imagem
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint comment_content_length check (char_length(trim(content)) >= 1)
);

-- Ativar RLS para comments
alter table public.comments enable row level security;

-- Recriar políticas para comments
drop policy if exists "Comentários são visíveis para todos" on public.comments;
create policy "Comentários são visíveis para todos" on public.comments
  for select using (true);

drop policy if exists "Usuários autenticados podem comentar" on public.comments;
create policy "Usuários autenticados podem comentar" on public.comments
  for insert with check (auth.uid() = user_id);

drop policy if exists "Usuários podem deletar seus próprios comentários" on public.comments;
create policy "Usuários podem deletar seus próprios comentários" on public.comments
  for delete using (auth.uid() = user_id);

-- 4. Função Trigger para criar perfil automaticamente após o registro de conta
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, minecraft_username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'minecraft_username', 'Jogador_Indefinido')
  )
  on conflict (id) do nothing; -- Evita erros caso o perfil já tenha sido criado
  return new;
end;
$$ language plpgsql security definer;

-- Trigger executado após criação de novo usuário na tabela auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

4. Clique no botão **Run** (no canto inferior direito do editor de texto).
5. Certifique-se de que a mensagem `Success. No rows returned` (ou similar) seja exibida no console de resultados.

---

## Passo 3: Configurar Cadastro Instantâneo (Sem Confirmação de E-mail)

Para que os seus jogadores possam se registrar no site e fazer login imediatamente sem precisarem abrir a caixa de entrada para confirmar o e-mail:

1. No painel do Supabase, clique em **Authentication** (o ícone de engrenagem ou cadeado no menu esquerdo).
2. Vá na aba **Providers** (ou **Settings** -> **Providers**).
3. Selecione **Email**.
4. Desative a opção **Confirm email** (ou desmarque *Confirm Email* / *Double Opt-In*).
5. Clique em **Save**.

---

## Passo 4: Obter as Credenciais do Banco

Para que o site consiga se conectar ao Supabase, você precisará colar duas chaves no código JavaScript do seu site.

1. Clique em **Project Settings** (o ícone de engrenagem no canto inferior esquerdo).
2. Selecione a opção **API**.
3. Procure pelos campos:
   - **Project URL**: Uma URL começando com `https://...` (copie este valor).
   - **Project API keys** -> **`anon` `public`**: Uma chave longa de texto (copie este valor).

> [!WARNING]
> Copie apenas a chave **`anon` / `public`**.
> **NUNCA** divulgue ou utilize a chave `service_role` (secret key) no frontend do seu site, pois ela ignora todas as regras de segurança (RLS) e dá controle total sobre o seu banco de dados. A chave `anon` é perfeitamente segura para expor no código público, pois está sujeita às políticas de RLS que configuramos no Passo 2.
