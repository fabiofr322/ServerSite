# Guia de Integracao: FrTopRanks + Netlify

O site deve buscar rankings pela rota publica:

```text
/api/ranks
```

Essa rota aponta para a Netlify Function:

```text
/.netlify/functions/ranks
```

A funcao le o token pelo ambiente da Netlify e faz a chamada ao backend de rankings no servidor.

## Configurar o plugin

No servidor Minecraft, configure o plugin para enviar os dados para o site:

```yaml
website:
  enabled: true
  port: 8080
  token: "use_um_token_novo_e_forte"
  url: "https://seu-site.netlify.app/api/ranks"
  send-interval-seconds: 300
```

Depois execute `/topadmin reload` ou reinicie o servidor.

## Configurar a Netlify

No painel da Netlify, crie a variavel de ambiente:

```text
RANKS_TOKEN=use_o_mesmo_token_configurado_no_plugin
```

O arquivo `_redirects` deve conter:

```text
/api/ranks  /.netlify/functions/ranks  200
```

## Observacao de seguranca

O token antigo foi removido dos arquivos publicos. Como ele ja apareceu no repositorio, trate-o como vazado e troque por um novo.

## Embed automatico de rankings no Discord

Foi adicionada a funcao agendada:

```text
netlify/functions/discord-rank-monitor.mjs
```

Ela roda a cada 10 minutos, compara o Top Jogadores e Top Clans com o ultimo snapshot salvo no Supabase e envia um embed no Discord somente quando detectar mudanca.
Depois que a primeira mensagem for criada, as proximas mudancas apagam a mensagem antiga e enviam uma nova. Assim o cargo pode ser mencionado novamente sem acumular varias mensagens de ranking no canal.

Antes de ativar, execute no Supabase:

```text
discord_rank_monitor.sql
```

Depois adicione estas variaveis no Netlify:

```text
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_do_supabase
DISCORD_RANK_WEBHOOK_URL=url_do_webhook_do_canal_do_discord
RANKS_TOKEN=o_mesmo_token_usado_no_FrSiteBridge
SITE_URL=https://www.fr32survival.com
DISCORD_RANK_MENTION_ROLE_ID=1525938148058730496
```

Opcional:

```text
CLANS_ENDPOINT=http://enx-cirion-92.enx.host:10026/clans
```

Nao coloque o webhook no `script.js` ou em qualquer arquivo publico do site. Ele deve ficar apenas nas variaveis de ambiente do Netlify.
