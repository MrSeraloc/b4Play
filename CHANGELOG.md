# Changelog / Mudanças

## 0.4.0 beta — 2026-11-16

- Browser-only rebuild for Opera and Chrome. One ZIP per browser; no local service, Node.js, .env or local token required by users.
- Direct requests to the selected OpenRouter/OpenAI provider with optional host permissions.
- English/Portuguese setup, session-only API key by default, optional unencrypted local persistence and a delete-data control.
- Transcript summaries capped at 200 words, toolbar and optional hover, Tactiq retrieval and .txt import.
- Consent before requests, fixed provider endpoints, restricted secret storage, deduplication and no automatic retries after failed AI requests.
- 13 mocked automated tests passed; local Defender scan reported no threats. Real provider/browser and store verification remain pending.
- Supersedes **0.3.0, now deprecated**. Legacy packages and service removed from the current branch. See [migration](DEPRECATED.md).

### Português

Reconstrução que funciona somente no navegador. Basta baixar um ZIP, carregar a extensão e configurar a chave/modelo. Inclui idiomas inglês/português, chave na sessão por padrão, permissões apenas para o provedor escolhido, consentimento e importação de transcrições. A 0.3.0 foi marcada como **deprecated** e seus pacotes antigos foram retirados da versão atual do repositório.

## 0.3.0 — DEPRECATED (2026-11-16)

Initial public beta with local companion. Deprecated after Defender detections and replaced by the standalone architecture. Not supported or recommended for installation/distribution. Historical source remains in Git history.

Beta pública inicial com serviço local. Descontinuada após detecções do Defender e substituída pela arquitetura independente. Sem suporte; não instalar ou redistribuir. Código histórico preservado no Git.
