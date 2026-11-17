# Defender investigation / Investigação — 2026-11-16

## Português

**Status: aberto. Não há confirmação de falso positivo pela Microsoft. Mantenha arquivos sinalizados bloqueados.**

A 0.3.0 foi descontinuada após detecções. A 0.4.1 passou inicialmente na verificação local, mas houve alerta no download e a detecção foi reproduzida depois no mesmo pacote local, sem mudança de SHA-256:

```text
355ab223125bf8d66a7a444f1fde87ed4af6443bc579651243f5b12bbf78edf1  b4play-opera-0.4.1.zip
```

| Verificação posterior da 0.4.1 | Resultado observado |
| --- | --- |
| ZIP Opera | `Trojan:Script/Ulthar.A!ml`, apontando `panel.html` dentro do pacote |
| `extension/panel.html`, isolado | Mesma detecção |
| `extension/youtube.js`, isolado | Nenhuma ameaça encontrada nesse teste |

O evento de hover está em `youtube.js`, não no HTML apontado. Esses resultados não demonstram que o evento seja a causa nem identificam a regra interna do Defender. A revisão estática anterior não encontrou comportamento malicioso no fluxo analisado, mas isso não invalida o alerta.

A 0.4.2 melhora a estrutura e a segurança do popup: HTML sem minificação, CSP explícita restringindo scripts/estilos ao pacote e bloqueando rede direta no popup, controles acessíveis e saída de IA apenas como texto. Não foram usadas exclusões, alterações no Defender, restauração de quarentena, ocultação ou ofuscação. A verificação inicial do novo `panel.html` e dos dois ZIPs 0.4.2 informou nenhuma ameaça encontrada. **A experiência da 0.4.1 mostra que isso não garante os resultados futuros.**

A arquitetura continua enviando as solicitações de IA exclusivamente pelo worker ao provedor escolhido. O popup não precisa de acesso direto à rede; essa capacidade foi bloqueada por CSP. O hover não foi removido.

Para avaliação do alerta, [envie o pacote original à Microsoft](https://www.microsoft.com/en-us/wdsi/filesubmission) com nome da detecção e SHA-256. Não confunda pacotes de versões diferentes. Não houve envio automático pelo agente; uma decisão da Microsoft continua pendente.

## English

**Open investigation. Microsoft has not confirmed a false positive. Keep flagged files blocked.**

Version 0.4.1 initially passed a local scan, then triggered a download alert and a repeat local detection with an unchanged SHA-256. The repeated ZIP scan and isolated `panel.html` scan detected `Trojan:Script/Ulthar.A!ml`; the isolated `youtube.js` hover script was not detected in that check. This does not establish which rule triggered or prove a false positive.

Version 0.4.2 improves readable semantic markup, accessibility, initialization handling and popup CSP. The popup permits packaged scripts/styles and blocks direct network connections; provider requests remain in the worker. Hover is preserved. The initial scans of the new panel and both ZIPs reported no threats, which does not guarantee future verdicts or downloads. No exclusions, protection changes, quarantine restoration or obfuscation were used. A Microsoft review remains pending; no sample was automatically submitted by the agent.
