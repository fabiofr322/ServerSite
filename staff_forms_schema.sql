-- =====================================================================
-- FR32SURVIVAL - SISTEMA DE FORMULARIOS / VAGAS DE STAFF
-- Execute este script no Supabase SQL Editor.
-- =====================================================================

create table if not exists public.staff_forms (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  description text,
  success_message text default 'Resposta enviada com sucesso. A equipe vai analisar sua candidatura.',
  fields jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  opens_at timestamp with time zone,
  closes_at timestamp with time zone,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint staff_forms_slug_format check (slug ~ '^[a-z0-9-]{3,80}$'),
  constraint staff_forms_fields_array check (jsonb_typeof(fields) = 'array')
);

create table if not exists public.staff_form_responses (
  id bigint generated always as identity primary key,
  form_id bigint references public.staff_forms(id) on delete cascade not null,
  auth_user_id uuid references auth.users(id) on delete cascade not null,
  user_email text,
  minecraft_username text,
  answers jsonb not null default '{}'::jsonb,
  status text not null default 'nova',
  admin_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint staff_form_responses_answers_object check (jsonb_typeof(answers) = 'object'),
  constraint staff_form_responses_status_check check (status in ('nova', 'em_analise', 'entrevista', 'aprovada', 'reprovada', 'arquivada'))
);

create unique index if not exists staff_form_responses_one_per_user_idx
on public.staff_form_responses (form_id, auth_user_id);

alter table public.staff_forms enable row level security;
alter table public.staff_form_responses enable row level security;

drop policy if exists "Formularios ativos sao visiveis por usuarios logados" on public.staff_forms;
create policy "Formularios ativos sao visiveis por usuarios logados" on public.staff_forms
  for select
  using (
    auth.role() = 'authenticated'
    and is_active = true
    and (opens_at is null or opens_at <= now())
    and (closes_at is null or closes_at >= now())
  );

drop policy if exists "Admins gerenciam formularios" on public.staff_forms;
create policy "Admins gerenciam formularios" on public.staff_forms
  for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Usuarios enviam sua propria resposta" on public.staff_form_responses;
create policy "Usuarios enviam sua propria resposta" on public.staff_form_responses
  for insert
  with check (auth.uid() = auth_user_id);

drop policy if exists "Usuarios veem sua propria resposta" on public.staff_form_responses;
create policy "Usuarios veem sua propria resposta" on public.staff_form_responses
  for select
  using (auth.uid() = auth_user_id or public.is_admin(auth.uid()));

drop policy if exists "Admins atualizam respostas" on public.staff_form_responses;
create policy "Admins atualizam respostas" on public.staff_form_responses
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins deletam respostas" on public.staff_form_responses;
create policy "Admins deletam respostas" on public.staff_form_responses
  for delete
  using (public.is_admin(auth.uid()));

insert into public.staff_forms (slug, title, description, success_message, fields, is_active)
values (
  'vagas-staff',
  'Candidatura para Staff',
  'Preencha com sinceridade. A equipe vai avaliar sua disponibilidade, postura e conhecimento sobre o servidor.',
  'Candidatura enviada com sucesso. A equipe FR32Survival vai analisar suas respostas pelo painel administrativo.',
  '[
    {"id":"discord","label":"Seu Discord","type":"text","required":true,"placeholder":"Ex: fabiofr32"},
    {"id":"idade","label":"Idade","type":"number","required":true,"placeholder":"Ex: 18"},
    {"id":"tempo_servidor","label":"Ha quanto tempo joga no FR32Survival?","type":"textarea","required":true},
    {"id":"disponibilidade","label":"Qual sua disponibilidade semanal?","type":"textarea","required":true},
    {"id":"experiencia","label":"Ja foi staff em outro servidor? Conte sua experiencia.","type":"textarea","required":true},
    {"id":"motivacao","label":"Por que voce quer entrar para a equipe?","type":"textarea","required":true},
    {"id":"situacao_hack","label":"Como voce lidaria com um jogador usando hack?","type":"textarea","required":true},
    {"id":"situacao_chat","label":"Como voce lidaria com uma briga no chat?","type":"textarea","required":true},
    {"id":"microfone","label":"Tem microfone para entrevista?","type":"select","required":true,"options":["Sim","Nao","Posso usar quando necessario"]},
    {"id":"regras","label":"Confirmo que li as regras e aceito passar por periodo de teste.","type":"checkbox","required":true}
  ]'::jsonb,
  true
)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  success_message = excluded.success_message,
  fields = excluded.fields,
  is_active = excluded.is_active,
  updated_at = timezone('utc'::text, now());
