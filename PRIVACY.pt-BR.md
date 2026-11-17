# Privacidade — b4Play 0.4.0

[English](PRIVACY.md) · Atualizada em 16/11/2026

O b4Play é uma extensão independente com licença MIT. Não há servidor do desenvolvedor, telemetria, análises de uso ou anúncios. É necessária uma conta própria no provedor de IA; a API pode cobrar pelo uso.

- **Tactiq:** o link solicitado do YouTube é enviado ao Tactiq em uma aba temporária em segundo plano. O site processa a transcrição segundo suas políticas. Verificações e outras restrições não são contornadas.
- **IA:** título e transcrição (inclusive de um .txt escolhido manualmente) são enviados por HTTPS ao endpoint OpenRouter ou OpenAI selecionado. A chave autentica a chamada nesse provedor. O OpenRouter pode encaminhar a solicitação aos provedores de modelos. Suas políticas de retenção se aplicam; `store:false` não garante retenção zero.
- **Chave:** fica no armazenamento da sessão por padrão, até encerrar o navegador. A opção Lembrar grava a chave sem criptografia no armazenamento local da extensão. A extensão não devolve a chave nas respostas aos scripts de página. As chaves não são distribuídas nos downloads nem enviadas ao desenvolvedor.
- **Outros dados locais:** provedor, modelo, idioma, consentimento e preferência de hover persistem no armazenamento local da extensão. Trabalhos e até 30 resumos ficam na sessão; o cache é reutilizado por até 24 horas. A transcrição existe temporariamente durante o processamento e não é persistida intencionalmente pela extensão.
- **Controle:** o hover começa desativado. Leia e aceite o envio dos dados para configurar a extensão. Apagar configuração remove chave, preferências e resumos, cancela os trabalhos acompanhados e revoga o acesso aos provedores. Uma solicitação já enviada pode ter sido processada/cobrada. Desinstalar também remove os dados locais da extensão. Desativar o hover pausa as solicitações automáticas; não apaga os dados nem desativa o botão de resumo manual.
- **Permissões:** armazenamento, alarmes para expiração dos trabalhos, activeTab para o botão, scripts declarados em YouTube/Tactiq e acesso opcional à rede para o provedor escolhido. Não há permissão de cookies/histórico/execução nativa ou serviço local.

Não importe informações sensíveis se não deseja compartilhá-las com seu provedor. Os resumos podem conter erros e não analisam acontecimentos apenas visuais. O Tactiq pode falhar ou não suportar o vídeo/idioma.

Dúvidas: [suporte do projeto](https://github.com/MrSeraloc/b4Play/issues). Não publique chaves nem transcrições privadas nas issues. [Instalação](README.pt-BR.md) · [Descontinuação da 0.3.0](DEPRECATED.md)
