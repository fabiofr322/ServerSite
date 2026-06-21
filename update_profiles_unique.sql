-- =====================================================================
-- FR32SURVIVAL - CONFIGURAÇÃO DE NICK CASE-INSENSITIVE (SQL)
-- Executar este script no Supabase SQL Editor
-- =====================================================================

-- 1. Remover a restrição UNIQUE tradicional (que diferencia maiúsculas de minúsculas)
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_minecraft_username_key;

-- 2. Criar um índice exclusivo baseado na versão em minúsculas (lower) do campo.
-- Isso impede que dois usuários tenham os nicks "vNeoo" e "vneoo" ao mesmo tempo.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_minecraft_username_lower_idx 
ON public.profiles (lower(minecraft_username));

-- 3. Confirmar e assegurar que as Políticas de RLS estão corretas
-- (Garante que o usuário só consiga atualizar a própria linha em "profiles")
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
