# Material para análise da Microsoft / Microsoft review material

> **Rascunho histórico / Historical draft.** A [atualização de 18/11/2026](DEFENDER-INVESTIGATION.md) registra a liberação informada pelo mantenedor. The [2026-11-18 update](DEFENDER-INVESTIGATION.md) records the reported clearance.

Use o [portal oficial](https://www.microsoft.com/en-us/wdsi/filesubmission?persona=SoftwareDeveloper) para solicitar análise, sem afirmar que o falso positivo já foi confirmado. O agente não enviou amostras. Mantenha o arquivo bloqueado se a proteção impedir a seleção; este documento e os hashes podem acompanhar um contato com o suporte oficial. Não desative o antivírus para realizar o envio.

## Suggested submission text

Product: b4Play 0.4.3 browser extension (Opera and Chrome, Manifest V3).

Detection: `Trojan:Script/Ulthar.A!ml`, Microsoft Defender Antivirus. Detection was reproduced in both original ZIPs with unchanged SHA-256 hashes, naming `panel.html` and `core.js` inside the archives. Initial local scans had reported no threats; subsequent custom scans reported detection, exit code 2.

We request analysis to determine whether this is an incorrect classification or a genuine issue in our published code. We have not confirmed a false positive. Installation promotion has been suspended, and the original packages/source tag are preserved for investigation.

The project summarizes YouTube transcripts using a user-supplied OpenRouter or OpenAI key. The worker sends authenticated HTTPS POST requests to fixed provider endpoints, with user consent. The popup loads packaged JavaScript/CSS only and displays model responses as text. API keys are session-only by default, with an explicit option for unencrypted extension-local storage. A temporary Tactiq tab retrieves the transcript. There is no developer backend, native executable, shell script or nested ZIP inside the browser packages.

A static source review and archive-to-source comparison found no additional payload or unexpected entries. All 21 Opera entries and 19 Chrome entries match tag `v0.4.3`, including expected generated manifest differences. This is not a malware clearance; please provide the determination and any actionable findings.

Source: https://github.com/MrSeraloc/b4Play/tree/v0.4.3

Review: https://github.com/MrSeraloc/b4Play/blob/main/REVIEW-0.4.3.md

Samples below are supplied for analysis, not recommended installation:

| Sample | SHA-256 |
| --- | --- |
| Opera: `b4play-opera-0.4.3.zip` | `f30736e665042cfa9f6bc15b02748b20d542611ecd97c41bbeae206813987cd3` |
| Chrome: `b4play-chrome-0.4.3.zip` | `8182a8d765691732b572026fc82a1a826f3ff0996160e56789744cbffee22a63` |

Immutable sample URLs for analysts:

- https://raw.githubusercontent.com/MrSeraloc/b4Play/refs/tags/v0.4.3/downloads/b4play-opera-0.4.3.zip
- https://raw.githubusercontent.com/MrSeraloc/b4Play/refs/tags/v0.4.3/downloads/b4play-chrome-0.4.3.zip

No API key, private transcript or user browser profile is included in these published browser packages.
