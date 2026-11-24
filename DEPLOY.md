# Publicar o b4Play 0.1.0

O mantenedor publica um Cloudflare Worker e guarda nele uma única chave do OpenRouter. Os pacotes para Chrome e Opera só incluem o endereço público do Worker. Quem instalar a extensão precisa aceitar o envio de dados e permitir a conexão com esse endereço.

## Cloudflare

Na raiz do projeto, com Node.js 22 ou mais recente, rode:

```powershell
npx wrangler@4 login
npx wrangler@4 deploy
npx wrangler@4 secret put OPENROUTER_API_KEY
```

A primeira linha abre o login da Cloudflare. A segunda informa o endereço HTTPS do Worker. Cole a chave apenas no prompt da terceira. Em alternativa, cadastre `OPENROUTER_API_KEY` como **Secret** no painel do Worker. [Documentação da Cloudflare](https://developers.cloudflare.com/workers/configuration/secrets/)

O Worker aceita somente pedidos de resumo. O Worker lê o identificador do modelo no segredo OPENROUTER_MODEL. Configure esse segredo no Cloudflare, além de OPENROUTER_API_KEY. O uso é cobrado na conta associada à chave. O limite configurado é de 6 pedidos por IP e 30 no total por minuto em cada local da Cloudflare. A cota do OpenRouter também se aplica à chave compartilhada. [Limites do Worker](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) · [Limites do OpenRouter](https://openrouter.ai/docs/api/reference/limits)

## Pacotes

Use o endereço HTTPS que o Wrangler exibiu, com a forma `https://b4play.SEU-SUBDOMINIO.workers.dev`.

```powershell
$env:B4PLAY_WORKER_URL = 'https://b4play.SEU-SUBDOMINIO.workers.dev'
npm run package
```

O comando gera dois ZIPs em `downloads/` e o arquivo `SHA256SUMS.txt`. Para validar antes de publicar, carregue a pasta extraída em cada navegador, aceite o envio e gere um resumo de um vídeo de teste sem dados pessoais ou confidenciais. Confira também o resumo pelo hover após a autorização inicial.

## Build and release in English

Run the Cloudflare commands above and paste the OpenRouter key only when prompted by Wrangler. Set `B4PLAY_WORKER_URL` to the deployed HTTPS origin before running `npm run package`. The ZIPs contain only the public service address. Verify a real summary from both unpacked extensions before distributing the files.
