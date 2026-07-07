-- =====================================================================
-- FR32SURVIVAL - PRODUTOS / VIPS DO SITE
-- Execute este arquivo no Supabase SQL Editor.
-- Cria a tabela usada pela loja e pelo painel administrativo.
-- =====================================================================

create or replace function public.is_admin(user_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_permissions
    where user_id = user_uuid
      and role in ('admin', 'super_admin')
  );
$$;

create table if not exists public.site_products (
  id bigint generated always as identity primary key,
  type text not null default 'vip',
  name text not null,
  slug text not null unique,
  price numeric(10, 2) not null default 0,
  price_text text not null,
  duration_text text not null default '30 dias',
  tier text not null default 'VIP',
  theme text not null default 'ametista',
  image_url text,
  subtitle text,
  features jsonb not null default '[]'::jsonb,
  description jsonb not null default '[]'::jsonb,
  initial_kit jsonb not null default '[]'::jsonb,
  weekly_kit jsonb not null default '[]'::jsonb,
  showcase jsonb not null default '[]'::jsonb,
  ribbon text,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint site_products_type_check check (type in ('vip', 'kit', 'product')),
  constraint site_products_slug_check check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint site_products_price_check check (price >= 0)
);

alter table public.site_products enable row level security;

drop policy if exists "Produtos publicados sao visiveis para todos" on public.site_products;
create policy "Produtos publicados sao visiveis para todos" on public.site_products
  for select
  using (is_published = true or public.is_admin(auth.uid()));

drop policy if exists "Admins podem criar produtos" on public.site_products;
create policy "Admins podem criar produtos" on public.site_products
  for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins podem atualizar produtos" on public.site_products;
create policy "Admins podem atualizar produtos" on public.site_products
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins podem remover produtos" on public.site_products;
create policy "Admins podem remover produtos" on public.site_products
  for delete
  using (public.is_admin(auth.uid()));

grant select on public.site_products to anon, authenticated;
grant insert, update, delete on public.site_products to authenticated;
grant usage, select on sequence public.site_products_id_seq to authenticated;

insert into public.site_products (
  type, name, slug, price, price_text, duration_text, tier, theme, image_url,
  subtitle, features, description, initial_kit, weekly_kit, showcase,
  ribbon, is_featured, is_published, sort_order
) values
(
  'vip', 'VIP Topazio', 'topazio', 9.99, 'R$ 9,99', '30 dias', 'VIP START', 'topazio',
  'https://mc-heads.net/body/Steve/220',
  'O primeiro passo para apoiar o servidor com vantagens essenciais.',
  jsonb_build_array('Tag VIP', 'Chat colorido', 'Auto-Armor', 'Kit mensal', 'Kit semanal'),
  jsonb_build_array('Tag VIP no chat e TAB.', 'Chat colorido usando o simbolo &.', 'Auto-Armor ao resgatar kits.', 'Kit principal mensal e kit semanal de suprimentos.'),
  jsonb_build_array('Set de Ferro com Protecao II e Inquebravel II.', 'Espada de Ferro com Afiacao III e Inquebravel II.', 'Picareta de Diamante com Eficiencia III e Inquebravel II.', '1 Totem da Imortalidade.', '8 Macas Douradas, 32 Cenouras Douradas, 16 Ferros e 1 Bolo Especial.'),
  jsonb_build_array('1 Totem da Imortalidade.', '8 Macas Douradas.', '64 Cenouras Douradas.', '16 Ferros.'),
  jsonb_build_array(
    jsonb_build_object('icon', 'fa-solid fa-tag', 'title', 'Tag VIP', 'text', 'Identidade no chat e TAB.'),
    jsonb_build_object('icon', 'fa-solid fa-box-open', 'title', 'Kit mensal', 'text', 'Ferro, diamante e suprimentos.'),
    jsonb_build_object('icon', 'fa-solid fa-calendar-week', 'title', 'Kit semanal', 'text', 'Totem e alimentos a cada 7 dias.')
  ),
  null, false, true, 10
),
(
  'vip', 'VIP Ametista', 'ametista', 15.90, 'R$ 15,90', '30 dias', 'VIP', 'ametista',
  'https://mc-heads.net/body/fabiofr32/220',
  'O essencial para sua jornada no survival.',
  jsonb_build_array('/feed', '/workbench', 'Slot reservado', 'Set diamante', 'Kit semanal'),
  jsonb_build_array('Tag personalizada no chat e TAB.', 'Chat colorido usando o simbolo &.', 'Auto-Armor ao resgatar kits.', '/feed com cooldown.', '/workbench ou /craft em qualquer lugar.', 'Slot reservado.'),
  jsonb_build_array('Set Diamante com Protecao III e Inquebravel III.', 'Espada e ferramentas de Diamante.', '2 Totens da Imortalidade.', '16 Macas Douradas.', '1 Shulker Box e bolo especial.'),
  jsonb_build_array('2 Totens da Imortalidade.', '16 Macas Douradas.', '128 Cenouras Douradas.'),
  jsonb_build_array(
    jsonb_build_object('icon', 'fa-solid fa-user-shield', 'title', 'Visual VIP', 'text', 'Tag exclusiva e presenca no chat.'),
    jsonb_build_object('icon', 'fa-solid fa-gem', 'title', 'Kit mensal', 'text', 'Diamante, shulker, totens e suprimentos.'),
    jsonb_build_object('icon', 'fa-solid fa-calendar-week', 'title', 'Kit semanal', 'text', 'Macas, totens e cenouras a cada 7 dias.')
  ),
  null, false, true, 20
),
(
  'vip', 'VIP Jade', 'jade', 25.90, 'R$ 25,90', '30 dias', 'VIP PRO', 'jade',
  'https://mc-heads.net/body/Alex/220',
  'Mais recursos, mais conforto e kits mais fortes para evoluir.',
  jsonb_build_array('Tag VIP Jade', 'Chat colorido', 'Auto-Armor', 'Kit mensal reforcado', 'Kit semanal Jade'),
  jsonb_build_array('Beneficios gerais de VIP.', 'Kits com mais totens e alimentos.', 'Recursos adicionais para economia e progresso.', 'Kit semanal reforcado.'),
  jsonb_build_array('Set Netherite com Protecao III, Inquebravel III, Remendo e trim.', 'Espada Netherite com Afiacao V, Aspecto Flamejante II, Saque III e Remendo.', 'Machado, picareta e pa de Netherite com Eficiencia V e Remendo.', '5 Totens da Imortalidade.', '40 Macas Douradas, 128 Cenouras Douradas, 64 Diamantes, 32 Ferros, 32 Perolas, 16 Ender Chests, escudo, 2 Shulkers e bolo.'),
  jsonb_build_array('4 Totens da Imortalidade.', '32 Macas Douradas.', '128 Cenouras Douradas.', '32 Diamantes.'),
  jsonb_build_array(
    jsonb_build_object('icon', 'fa-solid fa-leaf', 'title', 'Progressao', 'text', 'Plano equilibrado para evoluir.'),
    jsonb_build_object('icon', 'fa-solid fa-shield-heart', 'title', 'Sobrevivencia', 'text', 'Totens e alimentos em boa quantidade.'),
    jsonb_build_object('icon', 'fa-solid fa-gem', 'title', 'Recursos', 'text', 'Diamantes e suprimentos extras.')
  ),
  null, false, true, 30
),
(
  'vip', 'VIP Cerejeira', 'cerejeira', 29.90, 'R$ 29,90', '30 dias', 'RECOMENDADO', 'cerejeira',
  'https://mc-heads.net/body/KellCerejinha/220',
  'Poder de Netherite e exploracao mais pratica.',
  jsonb_build_array('/condense', '/hat', '/ec', '/near', '+5 homes'),
  jsonb_build_array('Todos os beneficios do VIP Ametista.', '/condense para transformar recursos em blocos.', '/hat para usar blocos na cabeca.', '/enderchest ou /ec em qualquer lugar.', '/near em raio de 100 blocos.', '+5 homes adicionais.'),
  jsonb_build_array('Set Netherite com Protecao IV e Inquebravel III.', 'Espada Netherite com Afiacao V e Saque III.', '4 Totens da Imortalidade.', '32 Macas Douradas e 64 Cenouras Douradas.', '1 Shulker Box.'),
  jsonb_build_array('5 Totens da Imortalidade.', '32 Macas Douradas.', '128 Cenouras Douradas.'),
  jsonb_build_array(
    jsonb_build_object('icon', 'fa-solid fa-user-shield', 'title', 'Visual VIP+', 'text', 'Destaque Cerejeira por 30 dias.'),
    jsonb_build_object('icon', 'fa-solid fa-cubes', 'title', 'Comandos extras', 'text', '/condense, /hat, /ec e /near.'),
    jsonb_build_object('icon', 'fa-solid fa-calendar-week', 'title', 'Kit semanal', 'text', 'Mais totens e suprimentos para explorar.')
  ),
  'Recomendado', true, true, 40
),
(
  'vip', 'VIP Lendario', 'lendario', 49.90, 'R$ 49,90', '30 dias', 'VIP MAX', 'lendario',
  'https://mc-heads.net/body/vNeoo/220',
  'A elite do servidor com comandos avancados e os melhores kits.',
  jsonb_build_array('/fix', '/pweather', '/recipe', '+15 homes', 'Kit Netherite completo'),
  jsonb_build_array('Todos os beneficios anteriores.', '/fix ou /repair com cooldown.', '/pweather para clima individual.', '/recipe para consultar receitas.', '+15 homes adicionais.'),
  jsonb_build_array('Set Netherite Full com Protecao IV, Inquebravel III e Remendo.', 'Espada e ferramentas Netherite com encantamentos altos.', '8 Totens da Imortalidade.', '64 Macas e 192 Cenouras Douradas.', 'Diamantes, ferros, perolas, ender chests, shulker e bolo.'),
  jsonb_build_array('7 Totens da Imortalidade.', '48 Macas Douradas.', '128 Cenouras Douradas.', 'Recursos extras semanais.'),
  jsonb_build_array(
    jsonb_build_object('icon', 'fa-solid fa-crown', 'title', 'Visual lendario', 'text', 'Plano maximo para apoiadores.'),
    jsonb_build_object('icon', 'fa-solid fa-screwdriver-wrench', 'title', 'Reparo e clima', 'text', '/fix, /repair, /pweather e /recipe.'),
    jsonb_build_object('icon', 'fa-solid fa-calendar-week', 'title', 'Kit semanal', 'text', 'O maior kit recorrente entre os VIPs.')
  ),
  null, false, true, 50
),
(
  'vip', 'VIP Onix', 'onix', 59.90, 'R$ 59,90', '30 dias', 'VIP ELITE', 'onix',
  'https://mc-heads.net/body/Herobrine/220',
  'O plano mais completo para quem quer apoiar no nivel maximo.',
  jsonb_build_array('Tag Onix', 'Chat colorido', 'Auto-Armor', 'Kit mensal premium', 'Kit semanal premium'),
  jsonb_build_array('Beneficios VIP de alto nivel.', 'Kits mais completos do servidor.', 'Mais recursos para economia e combate.', 'Kit semanal premium.'),
  jsonb_build_array('Set Netherite com Protecao IV, Inquebravel III, Remendo, Respiracao III, Queda Suave IV e trim.', 'Espada Netherite com Afiacao V, Aspecto Flamejante II, Saque III, Remendo e Inquebravel III.', 'Machado, picareta, pa e enxada de Netherite com Eficiencia V, Remendo e Inquebravel III.', '7 Totens da Imortalidade.', '56 Macas Douradas, 128 Cenouras Douradas, 64 Diamantes, 64 Ferros, 40 Perolas, 24 Ender Chests, escudo, 2 Shulkers, bolo, Totem na offhand e balde de agua.'),
  jsonb_build_array('6 Totens da Imortalidade.', '40 Macas Douradas.', '128 Cenouras Douradas.', '48 Diamantes.'),
  jsonb_build_array(
    jsonb_build_object('icon', 'fa-solid fa-meteor', 'title', 'Elite', 'text', 'Plano mais forte da loja.'),
    jsonb_build_object('icon', 'fa-solid fa-shield-halved', 'title', 'Kits premium', 'text', 'Itens de alto valor para a temporada.'),
    jsonb_build_object('icon', 'fa-solid fa-star', 'title', 'Destaque', 'text', 'Visual e suporte de apoiador maximo.')
  ),
  'Elite', false, true, 60
)
on conflict (slug) do update set
  type = excluded.type,
  name = excluded.name,
  price = excluded.price,
  price_text = excluded.price_text,
  duration_text = excluded.duration_text,
  tier = excluded.tier,
  theme = excluded.theme,
  image_url = excluded.image_url,
  subtitle = excluded.subtitle,
  features = excluded.features,
  description = excluded.description,
  initial_kit = excluded.initial_kit,
  weekly_kit = excluded.weekly_kit,
  showcase = excluded.showcase,
  ribbon = excluded.ribbon,
  is_featured = excluded.is_featured,
  is_published = excluded.is_published,
  sort_order = excluded.sort_order,
  updated_at = timezone('utc'::text, now());

-- Safira e Rubi foram removidos do catalogo atual.
delete from public.site_products
where slug in ('safira', 'rubi');
