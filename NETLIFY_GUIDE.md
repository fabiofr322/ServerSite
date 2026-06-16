# Guia de Integração: FrTopRanks + Netlify

Como o seu site está hospedado na **Netlify** (que usa HTTPS por padrão) e o seu servidor de Minecraft roda em HTTP, os navegadores modernos bloquearão requisições diretas de rankings por segurança (erro de *Mixed Content*).

Para resolver isso de forma elegante, segura e sem precisar configurar certificados SSL complexos no seu servidor de Minecraft, usaremos o recurso de **Redirecionamento/Proxy da Netlify**.

Siga o passo a passo abaixo para conectar o plugin com o seu site:

---

## Passo 1: Configurar o Plugin no Servidor de Minecraft

1. Acesse os arquivos do seu servidor de Minecraft e abra a pasta `plugins/FrTopRanks/config.yml`.
2. Configure a seção `website` da seguinte forma:
   ```yaml
   website:
     enabled: true
     port: 8080                      # Porta que o plugin usará (certifique-se de que está liberada no host)
     token: "frgroup"                # Chave secreta definida para segurança
     url: "http://your-website.com/api/ranks"
     send-interval-seconds: 300
   ```
3. Salve o arquivo e digite `/topadmin reload` no console do Minecraft (ou reinicie o servidor).
4. **Importante**: Certifique-se de que a porta configurada (ex: `8080`) está aberta/liberada no firewall da sua hospedagem de Minecraft.

---

## Passo 2: Configurar o Proxy na Netlify

Para que o site consiga buscar os dados sem bloqueio de segurança e mantendo o seu token oculto dos jogadores que inspecionam o site:

1. Na raiz da pasta do seu site (`ServerSite`), crie um arquivo chamado **`_redirects`** (sem extensão).
2. Adicione a seguinte linha dentro do arquivo:
   ```text
   /api/ranks  http://fr32survival.com:8080/ranks?token=frgroup  200!
   ```
   *Esta linha já está totalmente pré-configurada no seu arquivo local `_redirects`!*

> [!TIP]
> Com essa regra, quando o navegador do jogador solicitar `https://seu-site.netlify.app/api/ranks`, a própria Netlify buscará em segundo plano (via HTTP seguro interno) o seu servidor de Minecraft e enviará os dados de volta. O jogador nunca verá o IP bruto do servidor ou o Token de segurança!

---

## Passo 3: Atualizar o Site (`index.html`)

Agora, configure o site para buscar os dados através do proxy que acabamos de criar na Netlify:

1. Abra o arquivo `index.html` do seu site.
2. Procure pela linha onde a variável `API_URL` está definida (por volta da linha 1622):
   ```javascript
   const API_URL = 'http://localhost:8080/ranks'; 
   ```
3. Altere-a para apontar para a nossa rota do proxy:
   ```javascript
   const API_URL = '/api/ranks'; 
   ```
4. Salve o arquivo.

---

## Passo 4: Publicar as Alterações

Envie as atualizações do seu repositório local (`index.html` e o novo arquivo `_redirects`) para o GitHub. A Netlify fará o deploy automático e a sincronização em tempo real entrará em ação!

Se o servidor de Minecraft estiver desligado ou a porta inacessível, o site exibirá os rankings de demonstração (mockup) automaticamente para que a página nunca fique em branco ou quebrada.
