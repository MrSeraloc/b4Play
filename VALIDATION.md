# Validação local — 16/11/2026

**Atualização de 18/11/2026 — 0.4.3 beta.** Após o mantenedor informar a liberação pela Microsoft, o Defender foi executado novamente nos ZIPs originais de Opera e Chrome. Ambos retornaram “found no threats” e código 0. Os hashes abaixo foram reconferidos e coincidem com a publicação. [Registro da investigação](DEFENDER-INVESTIGATION.md)

## Testes da 0.4.3

- **23 testes automatizados aprovados** com `node --test tests/*.test.mjs`; navegador/IA simulados, sem credenciais reais ou inferência paga.
- As três faixas **150–250, 300–500 e 500–750 palavras** chegam ao prompt. O limite máximo de cada faixa é aplicado mesmo se o modelo retornar texto maior; não há preenchimento artificial para atingir o mínimo.
- Esforço de raciocínio e orçamento total de saída são validados, persistidos e enviados com os nomes próprios de cada provedor. O padrão é Automático + 4.096 tokens por chamada. O cache é invalidado ao salvar alterações.
- Respostas por limite de tokens ou somente raciocínio têm erros específicos e não viram resumos. Não há repetição automática. O raciocínio interno não é usado como resposta final.
- A consulta de opções do modelo é exclusiva da configuração, usa GET público e não envia Authorization, chave, título ou transcrição. Os níveis não anunciados pelo catálogo são desativados no seletor.
- Permanecem os testes de consentimento, isolamento de credenciais, URL/origem/aba/nonce, importação, deduplicação, exclusão de dados, erros de API, CSP do popup e saída como texto.

## Metadados públicos verificados

Foi consultado o catálogo público do OpenRouter para `deepseek/deepseek-v4.1-flash`, sem chave ou inferência. Em 16/11/2026 ele anunciou raciocínio opcional, habilitado por padrão, esforço padrão `high` e níveis `max`, `high`, `low`, `none`. A configuração sugerida para começar é **Baixo + 4.096 tokens**; não foi validada com uma chamada real à conta do usuário.

Fontes: [catálogo público](https://openrouter.ai/api/v1/models), [raciocínio e orçamento de saída](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens), [parâmetros OpenAI](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create).

## Interface e pacotes

A tela foi conferida em inglês e português em prévia local. A combinação **500–750 palavras + Baixo + 4.096 tokens** foi salva com dados fictícios; `reasoning-0.4.3-demo.jpg` registra o resultado. Isso não substitui o teste da extensão instalada. Os sete cenários de hover foram executados na 0.4.1; a 0.4.3 altera o rodapé para mostrar a faixa, preservando a lógica de eventos.

Os pacotes têm manifesto na raiz, scripts/estilos locais, ajuda e licença. Não contêm instalador, shell, ZIP aninhado ou serviço local. A CSP restrita do popup foi preservada; as solicitações ao provedor continuam no worker autorizado.

## Defender: resultado local, não garantia

Na primeira verificação, cada ZIP 0.4.3 informou **“found no threats”**. A repetição posterior com `MpCmdRun.exe -Scan -ScanType 3 -File <caminho> -DisableRemediation` detectou **Trojan:Script/Ulthar.A!ml nos dois**, código 2, apontando `panel.html` e `core.js`. Essa opção informa o resultado sem aplicar correções e não altera a proteção em tempo real. Não foram usadas exclusões nem restauração de quarentena.

Esse resultado é de 16/11/2026. A atualização de 18/11/2026 no topo deste documento registra a verificação mais recente da 0.4.3.

```text
f30736e665042cfa9f6bc15b02748b20d542611ecd97c41bbeae206813987cd3  b4play-opera-0.4.3.zip
8182a8d765691732b572026fc82a1a826f3ff0996160e56789744cbffee22a63  b4play-chrome-0.4.3.zip
```

## Pendências

Inferência real, testes da extensão instalada em Opera/Chrome e outros sistemas, e aprovação de lojas. Tamanhos de resumo e níveis de raciocínio maiores podem aumentar custo e tempo. Os limites aceitos variam por modelo.
