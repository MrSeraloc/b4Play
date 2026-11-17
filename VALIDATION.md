# Validação local — 16/11/2026

Versão verificada: 0.4.1. A pasta antiga 0.3.0 foi preservada. Não foram restaurados arquivos em quarentena nem criadas exclusões do antivírus.

## Resultados

- `node --test tests/*.test.mjs`: **13 testes aprovados**, nenhum reprovado. Provedor e navegador simulados, sem chaves reais ou chamadas pagas.
- **7 cenários de regressão de hover passaram em DOM real de navegador**, usando o script `extension/youtube.js` e mensagens de extensão simuladas: ativação sem recarregar, saída antecipada e reentrada, movimento entre filhos/sobreposição, miniatura sem ID/classe fixa, rejeição de link externo, desativação sem recarregar e foco do teclado. A captura `hover-tests-demo.jpg` contém resultados e resumo fictício. Para reproduzir: `node scripts/preview.mjs`, abrir `http://127.0.0.1:8770/hover-tests` e clicar em Executar testes de hover. Esses arquivos de teste não entram nos ZIPs.
- Cobertura funcional: URLs/Shorts; limite de 200 palavras; todas as seções de transcrições longas; consentimento; chave por provedor; isolamento da chave; permissão opcional; origem/aba/nonce do Tactiq; deduplicação; cache; importação; remoção de dados; erros 401/402/403/429; ausência de repetição automática em falhas.
- Build Chrome/Opera: manifests válidos com referências a arquivos existentes. Acesso à API limitado ao domínio do provedor escolhido, solicitado na configuração. Não há acesso a localhost ou permissões de cookies/histórico/execução nativa.
- ZIP padrão do Windows: **Opera 21 arquivos**, **Chrome 19 arquivos**. Todas as entradas foram abertas e lidas integralmente por uma biblioteca ZIP independente. Manifesto na raiz; sem ZIP aninhado, executável ou script de shell no pacote.
- Interface em inglês e português conferida em prévia local com navegador e credenciais fictícios. O envio da configuração mostrou a confirmação de sucesso. Essa prévia não substitui o teste da extensão instalada. `configuracao-demo.jpg` registra a tela da prévia; nenhum dado real de API está nela.
- Microsoft Defender, verificações personalizadas de `extension/` e dos dois ZIPs **0.4.1**, com `MpCmdRun.exe -Scan -ScanType 3 -File <caminho> -DisableRemediation`: saída **“found no threats”** nas três verificações, código 0. Essa opção só faz a análise e informa detecções, sem aplicar correções; a proteção em tempo real e suas políticas não foram alteradas. Isso é um resultado local neste momento, não uma garantia de detecção futura, em outro computador ou durante download.

## SHA-256 dos pacotes verificados

```text
355ab223125bf8d66a7a444f1fde87ed4af6443bc579651243f5b12bbf78edf1  b4play-opera-0.4.1.zip
7488a20a46c5cc0f7aa8cc396f3b768b7ad1ace49353423edfdbeeb50c1bdc58  b4play-chrome-0.4.1.zip
```

## Limites e trabalho pendente

Não foi feita uma chamada real à API, nem instalação automática da extensão no perfil pessoal do usuário. Foram observadas miniaturas clássicas na busca pública do YouTube, além dos testes com fixtures. Tactiq real pode bloquear ou não fornecer a transcrição. Modelos precisam ser compatíveis com Chat Completions. Testes de extensão instalada em Opera/Chrome, permissões reais, diferentes sistemas e revisão de lojas ainda são necessários. Os pacotes 0.4.1 são a beta atual; a versão 0.3.0 está descontinuada, conforme `DEPRECATED.md`.

Os projetos e scripts de desenvolvimento não são incluídos nos ZIPs para usuários. Para usar a versão já empacotada não é necessário Node.js ou PowerShell. A instalação manual ainda exige extrair o ZIP e carregar a pasta no modo de desenvolvedor.
