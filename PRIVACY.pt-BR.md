# Privacidade do b4Play 0.1.a

[English](PRIVACY.md)

- **Tactiq** recebe o link do YouTube em uma aba temporária para buscar a transcrição.
- **b4Play** envia o título, a transcrição, o idioma do navegador e as opções de resumo por HTTPS ao Cloudflare Worker. O serviço usa o IP de conexão para limitar pedidos. O aplicativo não registra títulos ou transcrições em logs nem guarda esses dados depois de processar o pedido.
- **O OpenRouter e o provedor de IA** recebem o título e a transcrição, inclusive texto importado manualmente. O OpenRouter encaminha a solicitação a um provedor. Envie apenas conteúdo que possa compartilhar e que não contenha dados pessoais ou confidenciais. [Modelo e provedores](https://openrouter.ai/privacy)
- **Armazenamento do navegador** guarda preferências e consentimento. Até 30 resumos ficam na sessão e podem ser reutilizados por até 24 horas. Apague as configurações para excluir esses dados e revogar a permissão opcional do serviço de resumos. A chave fica no segredo do Cloudflare Worker.
