# b4Play 0.1.a

[English](README.md) · **Português**

Resuma vídeos do YouTube ao passar o mouse sobre uma miniatura ou clicar no ícone do b4Play. O serviço gera resumos usando IA. O resumo segue o idioma de exibição do navegador.

## Baixar

- [ZIP para Opera](https://github.com/MrSeraloc/b4Play/raw/refs/tags/v0.1.a/downloads/b4play-opera-0.1.0.zip)
- [ZIP para Chrome](https://github.com/MrSeraloc/b4Play/raw/refs/tags/v0.1.a/downloads/b4play-chrome-0.1.0.zip)

[SHA-256](downloads/SHA256SUMS.txt) · [Privacidade](PRIVACY.pt-BR.md) · [Licença MIT](LICENSE)

## Instalar e usar

1. Extraia o ZIP do seu navegador.
2. Abra `opera://extensions` ou `chrome://extensions`, ative o **Modo de desenvolvedor**, clique em **Carregar sem compactação** e selecione a pasta que contém `manifest.json`.
3. Recarregue o YouTube e passe o mouse sobre uma miniatura, ou abra um vídeo e clique no ícone da barra. A extensão pede autorização para enviar a transcrição no primeiro uso.

Na engrenagem, escolha **Curto** (150–300 palavras, padrão), **Médio** (300–500) ou **Longo** (500–750). Transcrições curtas podem render menos palavras. Se o Tactiq não conseguir obter a transcrição, importe um arquivo `.txt` nas opções completas.

Para atualizar uma cópia instalada, extraia o ZIP sobre os arquivos da pasta da extensão, clique em **Recarregar** na página de extensões do navegador e atualize a aba do YouTube. Confira se a versão exibida é **0.1.a** e autorize uma vez o envio da transcrição conforme o aviso atualizado. A faixa de tamanho salva é preservada.

## Desenvolvimento e manutenção

Com Node.js 22+, rode `npm test` e `npm run build`. A extensão está em `extension/` e o Worker da Cloudflare em `service/`. O empacotamento no Windows usa o endereço do Worker publicado. [Guia de publicação](DEPLOY.md)

[Suporte](https://github.com/MrSeraloc/b4Play/issues)
