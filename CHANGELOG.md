# Changelog / Mudanças

## 0.4.2 experimental beta — 2026-11-16

- Rebuilt the popup as readable semantic HTML with an explicit page-level CSP: local scripts/styles only, no direct network connections, objects, base-URL changes or form submission.
- Added accessible status/summary updates, a disabled-until-ready summary button and a settings link that remains usable if JavaScript initialization fails.
- Kept AI output as plain text and improved initialization/clipboard failure handling.
- 17 automated tests passed; the new panel and both ZIPs passed their initial local Defender scan. This does not establish a false positive or guarantee future antivirus/download verdicts.
- **Known security issue:** 0.4.1 was detected locally on rescan as `Trojan:Script/Ulthar.A!ml`, pointing to `panel.html`; the isolated hover script was not detected in that check. Investigation remains open: [details](DEFENDER-INVESTIGATION.md).

### Português

Popup refeito com HTML legível, política de segurança mais restrita e melhor acessibilidade. A 0.4.1 foi sinalizada também na nova verificação local; os resultados iniciais limpos não se mantiveram. A 0.4.2 passou na primeira verificação local, sem garantia de ausência de alertas futuros ou confirmação de falso positivo pela Microsoft.

## 0.4.1 beta — 2026-11-16

- Fix hover getting stuck when the pointer leaves before the delay and re-enters the same thumbnail.
- Recognize image links without depending on one fixed thumbnail ID/class; validate the YouTube host.
- Read public hover preferences on entry and refresh on window focus, so enabling/disabling hover affects already-open tabs.
- Keep child/overlay transitions within the same thumbnail from resetting the delay; add keyboard focus support and a short grace period for entering the popup.
- Add seven real-browser DOM regression scenarios with mocked extension messages (no paid API requests).

### Português

Corrigido o hover que travava ao sair e voltar à mesma miniatura antes de completar a espera. A detecção aceita miniaturas com imagem sem depender de um único ID/classe. As preferências são consultadas ao entrar na miniatura, e o foco do teclado também funciona. Foram adicionados sete cenários de regressão em DOM real de navegador, sem chamadas de IA.

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
