# Política de privacidade do b4Play

[English](PRIVACY.md) · Atualizada em 16 de novembro de 2026 · Responsável: MrSeraloc

O b4Play resume transcrições de vídeos. Não há servidor de coleta operado pelo desenvolvedor, análises de uso, publicidade ou venda de dados.

Depois de autorizar o processamento e solicitar um resumo, o link do vídeo é enviado à página de resultado do Tactiq. Uma aba abre em segundo plano e é fechada ao terminar ou expirar. O Tactiq e seus serviços incorporados tratam essa visita segundo suas próprias políticas. O título e a transcrição passam por um serviço no seu computador e são enviados ao provedor escolhido: OpenAI ou OpenRouter. O OpenRouter pode encaminhar o pedido ao provedor que hospeda o modelo. A chamada usa `store: false`, o que não substitui as políticas de retenção de terceiros.

O botão da barra lê o link e o título da aba ativa quando utilizado, para identificar um vídeo compatível. Não há leitura do histórico geral. O hover atua somente nas páginas do YouTube. A extensão não coleta logins, cookies, contatos, pagamentos ou conteúdo de páginas sem relação com sua função.

As chaves ficam na configuração do serviço local (`data/ai-config.json` ou `.env`) e são enviadas ao provedor correspondente para autenticação. As rotas de configuração nunca as devolvem. **A versão beta atual guarda esses arquivos locais em texto.** A extensão salva token de conexão, preferências, consentimento e até 200 resumos no armazenamento local do navegador. O cache expira em sete dias e é limpo durante o uso ou a rotina periódica. As transcrições enviadas ficam em `data/transcripts/` até serem removidas.

É possível desativar o hover, retirar o consentimento e limpar o cache nas opções. A retirada impede novos pedidos; uma chamada já enviada ao provedor ainda pode terminar. Para remover dados do serviço, pare o processo e remova `data/` e eventual `.env`. A remoção da extensão apaga seu armazenamento. Isso não remove dados retidos por terceiros conforme suas políticas.

O serviço escuta somente em `127.0.0.1` e exige um token local para processar e configurar. As chamadas aos provedores usam HTTPS. Downloads públicos não incluem chaves, tokens, transcrições ou configurações pessoais.

O suporte é feito por [GitHub Issues](https://github.com/MrSeraloc/b4Play/issues). As mensagens são públicas; descreva os erros sem incluir credenciais ou transcrições privadas.
