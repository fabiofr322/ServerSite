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
