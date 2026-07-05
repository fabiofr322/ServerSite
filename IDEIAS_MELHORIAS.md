# Ideias de melhorias pendentes

Quando uma ideia for implementada, remova ela deste arquivo.

## O que fazer primeiro

Os primeiros itens da lista inicial já foram implementados. Use as seções abaixo como backlog das próximas melhorias.

## Melhorias visuais

### Hero mais objetiva

Trocar a chamada misteriosa por uma apresentação mais clara para jogadores novos.

Exemplo:

```text
FR32SURVIVAL
Survival 1.21+ com economia, rankings, temporadas e comunidade ativa.
```

### Equipe com cargos mais claros

Melhorar a seção da staff com:

- Dono, admin e moderador.
- Função de cada pessoa.
- Chamada para contato via Discord.

### Depoimentos ou destaques da comunidade

Adicionar pequenos cards com frases de jogadores, momentos da temporada ou destaques da comunidade.

## Melhorias mecânicas

### Rankings reais funcionando

Quando o FrTopRanks estiver expondo `/ranks`, separar corretamente:

- Erro de conexão.
- Sem jogadores.
- Carregando.
- Dados reais.

### Eventos com calendário

Criar uma área de eventos.

Exemplo:

```text
Sábado 20:00 - Evento PvP
Domingo 18:00 - Caça ao Tesouro
```

### Contador mais contextual

Explicar melhor o que vai acontecer quando o contador acabar.

Exemplos:

```text
Nova temporada começa em:
```

```text
Reset da Temporada 10:
```

### Página de temporadas

Criar uma página ou aba para cada temporada com:

- Resumo.
- Top players.
- Prints.
- Vencedores.
- Data de início e fim.

### Melhor tratamento de login

Melhorar o login para parecer parte oficial do site:

- Modal mais compacto.
- Mensagens claras.
- Estado logado bem visível.
- Área "minha conta".

### SEO e compartilhamento

Melhorar:

- Título.
- Descrição.
- Imagem Open Graph.
- Favicon.
- Preview bonito ao mandar o link no Discord.

## Segurança e infraestrutura

- Remover handlers inline (`onclick`) para permitir CSP sem `unsafe-inline`.
- Hospedar bibliotecas críticas localmente ou adicionar SRI aos CDNs.
- Revisar políticas RLS do Supabase.
- Revisar permissões de admins e super admins.
- Criar logs para ações administrativas importantes.
- Evitar expor tokens sensíveis no frontend.
- Trocar tokens simples por variáveis de ambiente no Netlify/Supabase.
- Criar checklist de deploy seguro.
