# Validação local — 16/11/2026

Versão: **0.4.2 beta experimental**. A investigação do Defender permanece aberta; não há confirmação de falso positivo pela Microsoft. Consulte [o registro completo](DEFENDER-INVESTIGATION.md).

## Validação da 0.4.2

- **17 testes automatizados aprovados** com `node --test tests/*.test.mjs`. Navegador/IA simulados, sem credenciais reais ou chamadas pagas.
- Cobertura: URLs/Shorts, limite de 200 palavras, processamento de todas as seções de vídeos longos, consentimento, isolamento da chave, acesso opcional ao provedor, validação da ponte Tactiq, cache/deduplicação, remoção de dados e falhas de API sem repetição automática.
- Quatro testes novos verificam CSP do popup, ausência de handlers/código inline e scripts remotos, estado seguro quando a inicialização falha, chave/consentimento ausentes e inserção de resposta com aparência de HTML como texto.
- O novo `panel.html` foi observado no navegador em prévia com dados fictícios, com CSP ativa. O botão mostrou o resumo fictício e a opção de copiar. `panel-0.4.2-demo.jpg` registra essa prévia, sem chave real. Ela não substitui um teste da extensão instalada.
- Os sete cenários de hover foram executados na 0.4.1 e continuam registrados em `hover-tests-demo.jpg`; `youtube.js` não foi alterado na 0.4.2. Para reproduzir: `node scripts/preview.mjs`, abrir `http://127.0.0.1:8770/hover-tests` e executar os testes. As fixtures não entram nos ZIPs.
- Build Opera/Chrome com manifesto na raiz, scripts/estilos locais e sem serviço localhost, instalador, ZIP aninhado ou script de shell nos pacotes. CSP adicional no popup bloqueia rede direta, objetos, alterações de base URL e envio de formulários. Chamadas de IA continuam restritas ao worker e provedor autorizado.

## Defender: resultado inicial, não garantia

A verificação personalizada do novo HTML e de cada ZIP 0.4.2 com `MpCmdRun.exe -Scan -ScanType 3 -File <caminho> -DisableRemediation` informou **“found no threats”**, código 0. Essa opção examina os arquivos e informa detecções sem aplicar correções; não altera a proteção em tempo real. Não foram usadas exclusões ou restauração de quarentena.

**A 0.4.1 também passou inicialmente e depois foi detectada no mesmo arquivo sem alteração de hash.** O resultado inicial da 0.4.2 não garante ausência de alertas posteriores, no download ou em outra máquina. Não descrevemos a detecção anterior como resolvida.

```text
cac2f92e614f62bd71d21a54a3c05d28ae4b18109930f897a8ea9469f915e451  b4play-opera-0.4.2.zip
9fea3bc5f86197368839b0b56405ffd2f811f5a9125f40d4868f72e4dbb0c0a3  b4play-chrome-0.4.2.zip
```

## Pendências

Análise da Microsoft, verificação do download no navegador do usuário, chamadas reais a provedores, testes de extensão instalada em Opera/Chrome e outros sistemas, e revisão das lojas. O Tactiq pode bloquear a transcrição, exigir verificação ou não suportar o vídeo/idioma; não contornamos essas restrições. A extensão continua beta com instalação manual.
