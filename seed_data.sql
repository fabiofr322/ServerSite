-- =====================================================================
-- SQL COMPLETO: CONFIGURAÇÃO DE TABELAS & SEED DE DADOS INICIAIS
-- =====================================================================
-- Execute este script no SQL Editor do Supabase para garantir que todas 
-- as tabelas sejam recriadas com as colunas corretas e populadas com 
-- os dados estáticos do site.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. LIMPEZA E CRIAÇÃO DAS TABELAS
-- ---------------------------------------------------------------------
drop table if exists public.season_photos cascade;
drop table if exists public.seasons cascade;
drop table if exists public.veterans cascade;

-- Tabela de Temporadas
create table public.seasons (
  id bigint generated always as identity primary key,
  number integer unique not null,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Fotos (Galeria)
create table public.season_photos (
  id bigint generated always as identity primary key,
  season_id bigint references public.seasons on delete cascade not null,
  photo_path text not null unique,
  title text not null,
  author_name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Veteranos (Mural)
create table public.veterans (
  id bigint generated always as identity primary key,
  minecraft_username text unique not null,
  title text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ---------------------------------------------------------------------
-- 2. HABILITAR RLS (ROW LEVEL SECURITY)
-- ---------------------------------------------------------------------
alter table public.seasons enable row level security;
alter table public.season_photos enable row level security;
alter table public.veterans enable row level security;

-- ---------------------------------------------------------------------
-- 3. POLÍTICAS DE RLS (PERMISSÕES DO BANCO)
-- ---------------------------------------------------------------------

-- Políticas para public.seasons
drop policy if exists "Temporadas são públicas" on public.seasons;
create policy "Temporadas são públicas" on public.seasons for select using (true);

drop policy if exists "Apenas admins podem gerenciar temporadas" on public.seasons;
create policy "Apenas admins podem gerenciar temporadas" on public.seasons
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Políticas para public.season_photos
drop policy if exists "Fotos das temporadas são públicas" on public.season_photos;
create policy "Fotos das temporadas são públicas" on public.season_photos for select using (true);

drop policy if exists "Apenas admins podem gerenciar fotos das temporadas" on public.season_photos;
create policy "Apenas admins podem gerenciar fotos das temporadas" on public.season_photos
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Políticas para public.veterans
drop policy if exists "Veteranos são visíveis para todos" on public.veterans;
create policy "Veteranos são visíveis para todos" on public.veterans for select using (true);

drop policy if exists "Apenas admins podem gerenciar veteranos" on public.veterans;
create policy "Apenas admins podem gerenciar veteranos" on public.veterans
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));


-- ---------------------------------------------------------------------
-- 4. INSERÇÃO DE DADOS (SEED)
-- ---------------------------------------------------------------------

-- Inserir temporadas
insert into public.seasons (number, name, description)
values 
  (9, 'Temporada 9', 'O início da nova era de sobrevivência'),
  (8, 'Temporada 8', 'Construções lendárias e vilas cooperativas'),
  (7, 'Temporada 7', 'A era dos grandes templos e spawns'),
  (6, 'Temporada 6', 'Explorações distantes e novos horizontes'),
  (5, 'Temporada 5', 'As origens da nossa comunidade');

-- Inserir veteranos
insert into public.veterans (minecraft_username, title, description)
values
  ('vNeoo', 'Pioneiro', 'Mestre da economia'),
  ('AfterDarknz', 'Fundador', 'Desde a versão alfa'),
  ('juninww7', 'Lenda', 'Líder'),
  ('raquel5939', 'Veterana', 'Construtora'),
  ('queirozkkk', 'Elite', 'Guerreiro implacável'),
  ('Mikey_G2J', 'Veterano', 'Bobo da corte'),
  ('lx_fr32', 'Desbravador', 'Explorador incansável'),
  ('masterdobudhaa', 'Sábio', 'Mestre dos magos');

-- Inserir fotos da galeria
-- Temporada 9
insert into public.season_photos (season_id, photo_path, title, author_name)
select id, 'Images/9_Temporada/Junin_Boss1.png', 'Junin Boss', 'juninww7'
from public.seasons where number = 9;

insert into public.season_photos (season_id, photo_path, title, author_name)
select id, 'Images/9_Temporada/junin_Boss2.png', 'Junin Boss', 'juninww7'
from public.seasons where number = 9;

-- Temporada 8
insert into public.season_photos (season_id, photo_path, title, author_name)
select id, 'Images/8_Temporada/Dominantbat8868.png', 'Álbum Dominantbat8868', 'Dominantbat8868'
from public.seasons where number = 8;

insert into public.season_photos (season_id, photo_path, title, author_name)
select id, 'Images/8_Temporada/Dominantbat8868_LucasGG21_Kasumiplayer_Teddit3.png', 'Álbum Dominantbat8868', 'Dominantbat8868'
from public.seasons where number = 8;

insert into public.season_photos (season_id, photo_path, title, author_name)
select id, 'Images/8_Temporada/Fabiofr32_&_KellCerejinha.png', 'Álbum dos Donos', 'fabiofr32'
from public.seasons where number = 8;

insert into public.season_photos (season_id, photo_path, title, author_name)
select id, 'Images/8_Temporada/Lizamior.png', 'Álbum Lizamior', 'Lizamior'
from public.seasons where number = 8;

insert into public.season_photos (season_id, photo_path, title, author_name)
select id, 'Images/8_Temporada/MagoGG .png', 'Álbum MagoGG', 'MagoGG'
from public.seasons where number = 8;

insert into public.season_photos (season_id, photo_path, title, author_name)
select id, 'Images/8_Temporada/MenottinhoGG.png', 'Álbum MenottinhoGG', 'MenottinhoGG'
from public.seasons where number = 8;

insert into public.season_photos (season_id, photo_path, title, author_name)
select id, 'Images/8_Temporada/Paulo_minoso128.png', 'Álbum Paulo_minoso128', 'Paulo_minoso128'
from public.seasons where number = 8;

insert into public.season_photos (season_id, photo_path, title, author_name)
select id, 'Images/8_Temporada/Paulo_minoso128_1.png', 'Álbum Paulo_minoso128', 'Paulo_minoso128'
from public.seasons where number = 8;

insert into public.season_photos (season_id, photo_path, title, author_name)
select id, 'Images/8_Temporada/Teddit3.png', 'Álbum Teddit3', 'Teddit3'
from public.seasons where number = 8;

insert into public.season_photos (season_id, photo_path, title, author_name)
select id, 'Images/8_Temporada/klausconzati.png', 'Álbum klausconzati', 'klausconzati'
from public.seasons where number = 8;

-- Temporada 7
insert into public.season_photos (season_id, photo_path, title, author_name)
select id, 'Images/7_Temporada/lago_do_vale_yneeo.png', 'Álbum yNeoo', 'yNeoo'
from public.seasons where number = 7;

insert into public.season_photos (season_id, photo_path, title, author_name)
select id, 'Images/7_Temporada/vale_yneoo_up.png', 'Álbum yNeoo', 'yNeoo'
from public.seasons where number = 7;

insert into public.season_photos (season_id, photo_path, title, author_name)
select id, 'Images/7_Temporada/casa_hotbit_vale_yneoo.png', 'Álbum yNeoo', 'yNeoo'
from public.seasons where number = 7;

insert into public.season_photos (season_id, photo_path, title, author_name)
select id, 'Images/7_Temporada/dark_house_1.png', 'Álbum Xdarkzin', 'XDarkzin1_1X'
from public.seasons where number = 7;

insert into public.season_photos (season_id, photo_path, title, author_name)
select id, 'Images/7_Temporada/dark_house2.png', 'Álbum Xdarkzin', 'XDarkzin1_1X'
from public.seasons where number = 7;

insert into public.season_photos (season_id, photo_path, title, author_name)
select id, 'Images/7_Temporada/iamgem_fundo.png', 'Spawn', 'fabiofr32'
from public.seasons where number = 7;

insert into public.season_photos (season_id, photo_path, title, author_name)
select id, 'Images/7_Temporada/junin_dragon.png', 'Spawn', 'fabiofr32'
from public.seasons where number = 7;

insert into public.season_photos (season_id, photo_path, title, author_name)
select id, 'Images/7_Temporada/Kraken_kellcerejinha.png', 'Spawn', 'fabiofr32'
from public.seasons where number = 7;

insert into public.season_photos (season_id, photo_path, title, author_name)
select id, 'Images/7_Temporada/Garota_anime_dark.png', 'Spawn', 'fabiofr32'
from public.seasons where number = 7;

insert into public.season_photos (season_id, photo_path, title, author_name)
select id, 'Images/7_Temporada/vila_grega_kell_fabio.png', 'Álbum dos Admin', 'Kellcerejinha'
from public.seasons where number = 7;

insert into public.season_photos (season_id, photo_path, title, author_name)
select id, 'Images/7_Temporada/vila_grega2_fabio_kell.png', 'Álbum dos Admin', 'Kellcerejinha'
from public.seasons where number = 7;

insert into public.season_photos (season_id, photo_path, title, author_name)
select id, 'Images/7_Temporada/vila_grega3_kell_fabio.png', 'Álbum dos Admin', 'Kellcerejinha'
from public.seasons where number = 7;

-- Mapeando fotos adicionais da Temporada 7
insert into public.season_photos (season_id, photo_path, title, author_name)
select id, 'Images/7_Temporada/junin_House.png', 'Álbum junin', 'juniordagoiba'
from public.seasons where number = 7;

insert into public.season_photos (season_id, photo_path, title, author_name)
select id, 'Images/7_Temporada/Master_house.png', 'Álbum masterdobudhaa', 'masterdobudhaa'
from public.seasons where number = 7;

insert into public.season_photos (season_id, photo_path, title, author_name)
select id, 'Images/7_Temporada/templo_lxzin.png', 'Álbum Lxzinho4261', 'Lxzinho4261'
from public.seasons where number = 7;

insert into public.season_photos (season_id, photo_path, title, author_name)
select id, 'Images/7_Temporada/erick_silvas_House.png', 'Álbum eriick_silvaxs', 'eriick_silvaxs'
from public.seasons where number = 7;
