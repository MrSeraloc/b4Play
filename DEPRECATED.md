# Deprecated versions / Versões descontinuadas

| Version / Versão | Status | Replacement / Substituição |
| --- | --- | --- |
| **0.3.0** | **DEPRECATED — unsupported / obsoleta, sem suporte** (2026-11-16) | 0.4.3 experimental beta |
| 0.4.0 | Superseded: hover fix / substituída: correção do hover | 0.4.3 experimental beta |
| 0.4.1 | Defender alert reproduced — do not install / alerta reproduzido — não instalar | 0.4.3 experimental beta |
| 0.4.2 | Superseded: reasoning settings / substituída: configuração de raciocínio | 0.4.3 experimental beta |
| 0.4.3 | Experimental beta, detection investigation ongoing / beta experimental, investigação em andamento | — |

## Português

A 0.3.0 foi descontinuada. O Microsoft Defender identificou arquivos dessa versão como `Trojan:Script/Ulthar.A!ml`. A análise estática do código não encontrou comportamento malicioso no fluxo revisado, mas isso não confirma falso positivo. Não há resultado da Microsoft que esclareça a detecção. Não instale nem redistribua os pacotes antigos.

A 0.3.0 também exigia Node.js, um serviço local aberto e um token adicional. A 0.4.0 foi reconstruída para funcionar apenas no navegador, falando diretamente com OpenRouter/OpenAI. O novo pacote teve resultado local “nenhuma ameaça encontrada” no Defender; isso não é certificação ou garantia de resultados futuros.

Os ZIPs 0.3.0 e o serviço local foram retirados da branch atual e dos botões de download. A [última revisão anterior à reconstrução](https://github.com/MrSeraloc/b4Play/tree/9846bf34ee3b4e94608287b53f8b12c286a8e00c) permanece no histórico para rastreabilidade e análise; não é uma versão recomendada para instalação. Nenhum arquivo em quarentena precisa ser restaurado para usar a 0.4.0.

### Migrar

1. Desative/remova a extensão antiga em `opera://extensions` ou `chrome://extensions`.
2. Se o serviço antigo estiver aberto, encerre sua janela quando não precisar mais dele.
3. Leia o [aviso de segurança da beta experimental atual](README.pt-BR.md) antes de baixar qualquer pacote. Mantenha bloqueado qualquer arquivo sinalizado pelo antivírus.
4. Configure sua chave e modelo novamente. As credenciais e o cache antigo não são importados. Não confunda o antigo token local com uma chave OpenRouter/OpenAI.

## English

Version 0.3.0 is deprecated and unsupported. Microsoft Defender flagged its files as `Trojan:Script/Ulthar.A!ml`. Static review did not find malicious behavior in the reviewed flow; this does not confirm a false positive. No Microsoft analysis result has resolved the detection. Do not install or redistribute the old packages.

The old version also required Node.js, a local companion and an extra token. Version 0.4.0 is a browser-only rebuild that calls OpenRouter/OpenAI directly. Its local Defender scan reported no threats; this is not certification or a guarantee of future verdicts.

Old ZIPs and the companion have been removed from the current branch and download buttons. The [previous revision](https://github.com/MrSeraloc/b4Play/tree/9846bf34ee3b4e94608287b53f8b12c286a8e00c) remains in history for traceability and analysis, not as a recommended install. No quarantined files need to be restored to use 0.4.0.

### Migrate

1. Disable/remove the old extension in your browser's extensions page.
2. Close the old local service window when no longer needed.
3. Read the [current experimental beta's security notice](README.md) before downloading any package. Keep any file flagged by antivirus blocked.
4. Enter your provider key and model again. Old credentials/cache are not imported. The old local token is not an OpenRouter/OpenAI API key.
