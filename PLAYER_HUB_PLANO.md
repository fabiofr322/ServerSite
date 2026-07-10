# Plano - Sistema de Perfil de Jogadores (Player Hub)

Este arquivo acompanha o que ja foi feito e o que ainda falta implementar no Player Hub do FR32SURVIVAL.

## Fase 1 - Base visual no site

- [x] Criar nova aba "Jogadores" no menu principal.
- [x] Criar pagina/secao "Perfil do Jogador".
- [x] Adicionar barra de pesquisa por nick.
- [x] Adicionar autocomplete com sugestoes.
- [x] Criar card principal com skin, cabeca, nick, bio e selo de verificado.
- [x] Exibir informacoes basicas: UUID, primeira entrada, ultimo login e status.
- [x] Remover exibicao de mundo atual do jogador.
- [x] Criar cards de estatisticas preparados para novas metricas.
- [x] Criar area de historico/atividades recentes.
- [x] Adicionar skeleton/loading visual.
- [x] Corrigir sobreposicao da skin com avatar e informacoes do perfil.

## Fase 2 - Banco de dados Supabase

- [x] Criar arquivo `player_hub_schema.sql`.
- [x] Criar tabela `player_profiles`.
- [x] Criar tabela `player_stats`.
- [x] Criar tabela `player_activity`.
- [x] Criar tabela `player_verifications`.
- [x] Adicionar RLS de leitura publica para perfis, estatisticas e historico.
- [x] Adicionar dados de exemplo para testar a tela.
- [ ] Criar politicas finais para edicao segura do perfil verificado.
- [ ] Criar funcoes/RPCs para API usar na verificacao.

## Fase 3 - API do site

- [x] Criar endpoint `/api/player-search`.
- [x] Criar endpoint `/api/player-profile`.
- [x] Registrar redirects das APIs no Netlify.
- [x] Fazer o frontend usar as APIs com fallback local via Supabase.
- [x] Criar endpoint `/api/player-verification/start`.
- [x] Criar endpoint `/api/player-verification/confirm`.
- [x] Criar endpoint `/api/player-sync`.
- [x] Validar codigo com expiracao curta.
- [x] Impedir reutilizacao de codigos.
- [ ] Limitar tentativas para reduzir forca bruta.

## Fase 4 - Plugin Minecraft

- [x] Definir se sera no FrSiteBridge ou plugin separado.
- [x] Sincronizar nick e UUID.
- [x] Sincronizar primeira entrada e ultimo login.
- [x] Sincronizar status online/offline.
- [x] Sincronizar tempo jogado.
- [x] Sincronizar kills, mortes, blocos quebrados e blocos colocados.
- [x] Sincronizar distancia percorrida e mobs derrotados.
- [ ] Sincronizar dinheiro, rank, clan, cargo, homes, claims e conquistas.
- [x] Criar comando `/verificar <codigo>`.
- [x] Criar comando alternativo `/confirmar <codigo>`.
- [x] Fazer o plugin confirmar o codigo na API do site.

## Fase 5 - Perfil verificado

- [ ] Exibir selo "Conta Verificada" definitivo.
- [ ] Permitir editar biografia.
- [ ] Permitir escolher banner do perfil.
- [ ] Permitir configurar perfil publico/privado.
- [ ] Permitir vincular Discord.
- [ ] Preparar conquistas especiais para perfis verificados.

## Fase 6 - Expansoes futuras

- [ ] Amigos.
- [ ] Seguidores.
- [ ] Comentarios em perfis.
- [ ] Perfil premium.
- [ ] Galeria de construcoes.
- [ ] Inventario publico.
- [ ] Estatisticas avancadas.
- [ ] Integracao com Discord.
- [ ] Atualizacoes em tempo real com o servidor.
