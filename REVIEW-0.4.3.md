# Revisão de segurança / Security review — b4Play 0.4.3

> **Relatório histórico / Historical report.** Veja o [resultado de 18/11/2026](DEFENDER-INVESTIGATION.md) sobre a liberação informada pelo mantenedor e a nova verificação dos ZIPs. See the [2026-11-18 update](DEFENDER-INVESTIGATION.md) for the maintainer's report of clearance and the new ZIP scans.

Data: 16/11/2026. Referência: tag `v0.4.3`, commit `a2a703a`. **Instalação suspensa. Investigação aberta, sem confirmação de falso positivo.**

## Detecção reproduzida

As verificações personalizadas de ambos os ZIPs detectaram `Trojan:Script/Ulthar.A!ml`, código de saída 2. Os recursos apontados são `panel.html` e `core.js` dentro dos arquivos. A primeira verificação havia informado nenhuma ameaça; os arquivos não mudaram entre os resultados.

| Pacote | SHA-256 |
| --- | --- |
| `b4play-opera-0.4.3.zip` | `f30736e665042cfa9f6bc15b02748b20d542611ecd97c41bbeae206813987cd3` |
| `b4play-chrome-0.4.3.zip` | `8182a8d765691732b572026fc82a1a826f3ff0996160e56789744cbffee22a63` |

Foi usada a verificação personalizada do Defender com `-DisableRemediation`, que informa o resultado sem aplicar correções. A proteção em tempo real não foi modificada. Não foram usados arquivos restaurados de quarentena ou exclusões. Não foi executado código dos pacotes nesta revisão.

## Integridade dos pacotes

Foram consultados os hashes Git da tag publicada pelo conector GitHub. Para cada ZIP local, foram calculados o hash do blob Git do contêiner e os hashes de todas as entradas, lendo-as em memória, sem extração ou execução.

- Opera: **21/21 entradas verificadas**.
- Chrome: **19/19 entradas verificadas**.
- Os contêineres correspondem aos blobs publicados em `v0.4.3`.
- Todas as entradas correspondem aos arquivos publicados em `extension/`. As diferenças do manifesto foram verificadas contra as transformações esperadas do build (ícones e versão mínima do Chrome).
- Não há entrada extra, duplicada, ZIP aninhado, instalador ou script de shell nesses pacotes.

Isso confirma que os pacotes analisados correspondem à versão publicada. Não é uma certificação de segurança do próprio código.

## Revisão estática do fluxo

| Componente | Comportamento observado |
| --- | --- |
| `panel.html` | Marcação estática legível, referência a CSS e módulo locais, sem handlers/código inline. A CSP limita scripts/estilos ao pacote e bloqueia rede direta no popup. |
| `panel.js` | Obtém configuração pública e URL/título da aba ativa; solicita resumo apenas por ação do usuário. Exibe dados com `textContent` e oferece cópia explícita. |
| `core.js` | Valida URLs, configuração e limites; divide transcrição; faz POST HTTPS para endpoints fixos OpenRouter/OpenAI com a chave fornecida pelo usuário; interpreta texto/erros e limita palavras. Não executa resposta recebida. |
| `worker.js` | Controla consentimento, permissões, chave em contexto restrito, trabalhos e cache; abre a aba Tactiq e valida origem/aba/nonce da transcrição. Consulta catálogo público somente por ação da configuração. |
| `settings.js` | Lê formulário e arquivo .txt escolhido; envia configuração ao próprio worker, sem devolver a chave nas respostas públicas. |
| `youtube.js` / `transcript.js` | Detectam miniaturas, exibem texto e leem o elemento de transcrição do Tactiq. Não há bridge de mensagens arbitrárias da página para comandos privilegiados. |
| Manifesto / estilos | Scripts de página declarados para YouTube/Tactiq, APIs de storage/alarms/activeTab e permissão opcional para o provedor. Estilos sem carregamento remoto. |

No fluxo revisado não encontrei execução de comandos do Windows, `eval`/`new Function`, download de código executável remoto, coleta de cookies/senhas do navegador, alteração do Defender, persistência na inicialização do Windows ou destino de exfiltração além do processamento informado ao usuário. A chave é enviada ao provedor de IA escolhido para autenticar a solicitação; isso é uma operação esperada da aplicação, não evidência isolada de roubo de chave.

Limitações reais permanecem: a opção Lembrar armazena a chave sem criptografia; o título/transcrição são compartilhados com terceiros conforme consentimento; hover pode causar cobranças; Tactiq é um site de terceiros sujeito a mudanças. Essas limitações devem permanecer explícitas.

## Conclusão e limites

Não identifiquei um payload malicioso adicional ou divergência em relação ao código publicado. A revisão estática não determina por que o classificador sinalizou os arquivos e não confirma falso positivo. Não houve detonação, perícia completa da máquina, avaliação por múltiplos mecanismos nem resultado de análise da Microsoft. Os testes funcionais anteriores não atestam ausência de malware.

Os pacotes e a tag foram preservados; não foi criada versão 0.4.4 nem reformatado código para tentar mudar o resultado do antivírus. Os botões de instalação foram retirados do README e a 0.4.3 foi marcada como bloqueada para instalação. O próximo passo é análise do pacote original pela Microsoft, usando os dados de [MICROSOFT-REVIEW-0.4.3.md](MICROSOFT-REVIEW-0.4.3.md). O agente não enviou arquivos automaticamente.

## English summary

Defender detection was reproduced in both unchanged 0.4.3 packages, naming `panel.html` and `core.js`. Archive Git blobs and all entries match the published `v0.4.3` source, with only the expected generated manifest differences. Static review found no additional malicious payload or hidden command execution in the reviewed flow; it cannot establish a false positive or explain the classifier's decision. No package code was executed for this review, no protection settings were changed and no replacement build was generated. Installation promotion is suspended, packages are preserved, and Microsoft analysis remains necessary.
