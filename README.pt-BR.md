# b4Play 0.4.3 — independente

[English](README.md) · **Português**

Resumo de vídeos do YouTube em 150–250, 300–500 ou 500–750 palavras, com sua chave OpenRouter ou OpenAI. Esta reconstrução elimina o serviço Node.js, o token local, os arquivos .env e a necessidade de manter um programa aberto. O computador só precisa do navegador para usar a extensão.

> **A 0.3.0 está deprecated (obsoleta) e sem suporte.** Seus arquivos foram sinalizados pelo Defender. Não instale nem redistribua os pacotes antigos. A 0.4.3 a substitui como beta atual. Veja [descontinuação e migração](DEPRECATED.md).

## Baixar a beta 0.4.3

> **Detecção em investigação:** a 0.4.1 também foi sinalizada pelo Defender, inclusive em nova verificação local. A 0.4.3 melhora a segurança e a acessibilidade do popup e passou na verificação local inicial, mas não há confirmação da Microsoft sobre falso positivo nem garantia contra novos alertas. Mantenha bloqueado qualquer arquivo que o antivírus sinalizar. Veja [o registro da investigação](DEFENDER-INVESTIGATION.md).

| Navegador | Pacote pronto |
| --- | --- |
| Opera | **[Clique aqui para baixar o ZIP para Opera](https://github.com/MrSeraloc/b4Play/raw/refs/heads/main/downloads/b4play-opera-0.4.3.zip)** |
| Chrome / Chromium | **[Clique aqui para baixar o ZIP para Chrome](https://github.com/MrSeraloc/b4Play/raw/refs/heads/main/downloads/b4play-chrome-0.4.3.zip)** |

Basta um download. [SHA-256](downloads/SHA256SUMS.txt) · [Privacidade](PRIVACY.pt-BR.md) · [Licença MIT](LICENSE) · [Suporte](https://github.com/MrSeraloc/b4Play/issues) · [Mudanças](CHANGELOG.md)

## Instalar em três etapas

1. Extraia `downloads/b4play-opera-0.4.3.zip` ou `downloads/b4play-chrome-0.4.3.zip` em uma pasta permanente. Escolha apenas um pacote.
2. Abra `opera://extensions` ou `chrome://extensions`, ative **Modo de desenvolvedor**, escolha **Carregar sem compactação** e selecione a pasta que contém **manifest.json**.
3. Na configuração que abre automaticamente, escolha o provedor, informe sua chave e o ID exato de um modelo compatível com Chat Completions, aceite o envio de dados e clique em **Salvar**. Autorize o acesso ao provedor. Não é necessário instalar Node.js ou outro programa.

Abra um vídeo comum no YouTube e clique no ícone b4Play → **Resumir vídeo atual**. Opcionalmente ative o resumo por hover na configuração; ele espera 1,5 segundo na miniatura e pode gerar cobranças. Recarregue o YouTube após instalar. O Tactiq é aberto em uma aba temporária para buscar a transcrição. Se falhar, importe um .txt pela configuração.

A chave dura até encerrar o navegador por padrão. Para evitar digitá-la novamente, marque **Lembrar a chave neste computador**, ciente de que isso usa armazenamento local sem criptografia. O botão **Apagar configuração, chave e resumos** remove esses dados e revoga acesso aos provedores.

### Configurar raciocínio e limite de saída

Em **Configurar → Geração da IA**, escolha **Esforço de raciocínio** e **Limite de tokens de saída** e salve. O limite padrão passou de 1.600 para **4.096 tokens por chamada**; ele inclui raciocínio e resposta, com resumo de 150–250, 300–500 ou 500–750 palavras conforme sua escolha; o máximo da faixa é aplicado, mas fontes curtas podem gerar menos texto. Aumentá-lo pode elevar custo e demora.

Para `deepseek/deepseek-v4.1-flash` no OpenRouter, comece com **Baixo + 4.096**. O catálogo consultado em 16/11/2026 informa padrão Alto e aceita Baixo, Alto, Máximo e Nenhum. **Automático mantém o padrão do modelo**, não significa raciocínio baixo. O botão **Consultar opções do modelo (sem gerar texto)** consulta metadados públicos, sem enviar chave/transcrição nem fazer inferência, e desativa níveis não anunciados pelo catálogo.

Se a saída terminar por limite de tokens ou vier apenas com raciocínio, a extensão agora explica essa condição, em vez de mostrar apenas “resumo inválido”. Reduza o raciocínio ou aumente o limite se o modelo aceitar; não há repetição automática da chamada. A resposta truncada ou o raciocínio interno não são exibidos como resumo. [Documentação do OpenRouter](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens).

### Atualizar da 0.4.0

Extraia a 0.4.3 na mesma pasta usada pela extensão instalada, substituindo os arquivos. Em `opera://extensions` ou `chrome://extensions`, clique em **Recarregar** no b4Play e depois recarregue a aba do YouTube. Confira se a versão exibida é 0.4.3. Se a chave estava apenas na sessão, informe-a novamente após recarregar a extensão. Para usar o mouse, marque **Resumir ao deixar o mouse na miniatura por 1,5 segundo** e salve; esse recurso começa desativado. Não mantenha duas cópias da extensão ativas.

## Segurança e limitações

- O Defender sinalizou as versões 0.3.0 e 0.4.1. A revisão do popup na 0.4.3 não é uma certificação antivírus. Não libere nem execute um pacote bloqueado. Não há exclusões ou alterações no Defender.
- Não há migração automática de chaves da 0.3.0. Desative/remova a extensão anterior para evitar dois resumos/cobranças. Se houver um serviço antigo aberto, encerre sua janela quando não precisar mais dele. O código antigo permanece no histórico Git; os ZIPs e o serviço antigo foram removidos da versão atual do repositório.
- Tactiq é um site de terceiros, não uma API suportada. Pode mudar, exigir verificação e não entregar transcrições. A interface bilíngue não garante transcrição de vídeos em português. Shorts não são suportados.
- A IA recebe título e transcrição e pode cobrar. Vídeos longos são processados em seções, com chamadas adicionais. Não há tentativas automáticas de repetir chamadas que falharam.
- Os resumos usam o idioma selecionado. Chaves e trabalhos ficam restritos aos contextos internos da extensão; scripts de página não recebem a chave. Não há telemetria ou servidor do desenvolvedor.
- Versão beta para instalação manual. Testes reais em Opera/Chrome, provedores e sistemas diferentes e aprovação nas lojas continuam necessários. Veja [privacidade](PRIVACY.pt-BR.md). A ajuda para consulta offline está incluída na extensão.

## Estrutura e manutenção

`extension/` contém toda a aplicação: worker de coordenação, cliente da IA, interfaces e dois scripts de página. `tests/` simula navegador/provedor, sem chaves reais ou chamadas pagas. `scripts/` contém ferramentas de desenvolvimento; não são instaladas com a extensão.

Para desenvolver: Node.js 22+, `npm test`, `npm run build`. Para empacotar no Windows: `npm run package` usa a biblioteca ZIP padrão do Windows, com lista explícita de arquivos e SHA-256. O Node.js e o PowerShell são necessários apenas para desenvolvimento/empacotamento. Cada ZIP contém apenas a extensão, ajuda e licença MIT, com manifesto na raiz. Não há ZIP aninhado, instalador, script de shell ou serviço dentro do pacote.

As duas versões de navegador ficam neste repositório. A opção automática **Download ZIP** do GitHub baixa o código-fonte; use os pacotes prontos acima para instalar.

A verificação dos pacotes atuais e os testes estão registrados em [validação e verificações pendentes](VALIDATION.md). Os 23 testes automatizados passaram com mensagens de extensão/IA simuladas. Como a 0.4.1 passou inicialmente e foi detectada depois, resultados locais não encerram a investigação nem garantem o download.
