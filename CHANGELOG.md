# Changelog / Mudanças

## 2026-11-18 · Downloads restaurados / Downloads restored

Os ZIPs originais da 0.4.3 voltaram aos READMEs após o relato de liberação pela Microsoft e a nova verificação local do Defender com resultado limpo para Opera e Chrome.

The original 0.4.3 ZIPs are linked in both READMEs again after the maintainer reported Microsoft's clearance and a new local Defender scan found no threats in either browser package.

## Security notice / Aviso de segurança — 2026-11-16

**Distribution/installation suspended.** Defender detection `Trojan:Script/Ulthar.A!ml` was reproduced in both 0.4.3 ZIPs, pointing to `panel.html` and `core.js`. Hashes and all package entries match tag `v0.4.3`. The release code and packages have been preserved, with no replacement build. See [review](REVIEW-0.4.3.md).

**Distribuição/instalação suspensas.** A detecção foi reproduzida nos dois ZIPs da 0.4.3, sem alteração de hash. A correspondência com o código publicado foi confirmada, mas isso não confirma falso positivo. Os pacotes foram preservados para análise, sem nova versão construída para tentar remover o alerta.

## 0.4.3 experimental beta — 2026-11-16

- Add summary length (150–250, 300–500 or 500–750 words), reasoning effort and output-token controls in English/Portuguese settings. Default budget increases from 1,600 to 4,096 per request. The selected upper word limit is enforced; short sources may produce less text to avoid fabrication.
- Send provider-specific parameters: OpenRouter `reasoning.effort` with excluded reasoning text; OpenAI `reasoning_effort`. Automatic omits effort. Higher budgets/efforts may cost more.
- Query public OpenRouter model metadata on demand, without API keys or inference; disable unadvertised efforts in the settings UI.
- Distinguish output-token exhaustion, reasoning-only responses, refused content and rejected parameters. No automatic retry or internal-reasoning fallback.
- 23 automated tests passed, including all summary ranges, provider payloads, saved settings, private-data isolation and truncated/reasoning-only responses. Real inference was not used to validate this fix.

### Português

Adicionados tamanho do resumo (150–250, 300–500 ou 500–750 palavras), esforço de raciocínio e limite de saída nas configurações, com consulta aos níveis aceitos no catálogo do OpenRouter. O padrão passou para 4.096 tokens por chamada. Para DeepSeek V4.1 Flash, a configuração inicial sugerida é Baixo + 4.096. O erro agora distingue limite esgotado de resposta sem texto final, sem repetir chamadas automaticamente.

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
