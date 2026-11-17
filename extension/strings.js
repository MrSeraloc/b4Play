const messages = {
  intro: ['Contexto antes do próximo play.', 'Context before your next play.'],
  setup: ['Configure uma vez. Depois use no YouTube.', 'Set up once. Then use on YouTube.'],
  language: ['Idioma', 'Language'], provider: ['Provedor', 'Provider'], model: ['ID do modelo', 'Model ID'],
  modelHelp: ['Copie o ID no catálogo do seu provedor. Escolha um modelo compatível com Chat Completions.', 'Copy the ID from your provider’s catalog. Choose a model supporting Chat Completions.'],
  key: ['Chave de API', 'API key'], keyHelp: ['Campo vazio mantém a chave do mesmo provedor. Por padrão, ela dura até fechar o navegador.', 'Leave blank to keep the same provider’s key. By default it lasts until the browser closes.'],
  remember: ['Lembrar a chave neste computador (armazenamento local sem criptografia)', 'Remember key on this computer (unencrypted local storage)'],
  hover: ['Resumir ao deixar o mouse na miniatura por 1,5 segundo', 'Summarize after hovering a thumbnail for 1.5 seconds'],
  consent: ['Autorizo enviar o link ao Tactiq e o título/transcrição à IA escolhida. O Tactiq abre em uma aba temporária. A API pode cobrar por cada resumo, inclusive no hover.', 'I agree to send the URL to Tactiq and the title/transcript to my selected AI. Tactiq opens in a temporary tab. The API may charge per summary, including hover.'],
  save: ['Salvar e permitir acesso ao provedor', 'Save and allow provider access'], saved: ['Pronto. Recarregue o YouTube e use o ícone ou o hover.', 'Ready. Reload YouTube and use the toolbar icon or hover.'],
  forget: ['Apagar configuração, chave e resumos', 'Delete settings, key and summaries'], forgotten: ['Dados apagados. Configure novamente para usar.', 'Data deleted. Set up again to use.'],
  summarize: ['Resumir vídeo atual', 'Summarize current video'], settings: ['Configurar', 'Settings'],
  working: ['Preparando resumo… Pode levar até dois minutos.', 'Preparing summary… May take up to two minutes.'],
  unsupported: ['Abra um vídeo comum do YouTube para resumir.', 'Open a standard YouTube video to summarize.'],
  importTitle: ['Tactiq indisponível? Importe uma transcrição.', 'Tactiq unavailable? Import a transcript.'],
  url: ['Link do vídeo', 'Video URL'], file: ['Arquivo .txt (até 120 mil caracteres)', '.txt file (up to 120,000 characters)'],
  import: ['Resumir arquivo', 'Summarize file'], copy: ['Copiar resumo', 'Copy summary'], copied: ['Copiado.', 'Copied.'],
  privacy: ['Privacidade e instalação', 'Privacy and installation'], close: ['Fechar', 'Close'],
  config: ['Configure o provedor, a chave e o consentimento no ícone do b4Play.', 'Set up provider, key and consent from the b4Play icon.'],
  providerError: ['Escolha OpenRouter ou OpenAI.', 'Choose OpenRouter or OpenAI.'],
  modelError: ['Informe um ID de modelo válido, sem espaços.', 'Enter a valid model ID without spaces.'],
  keyError: ['Informe a chave correta para o provedor escolhido.', 'Enter the correct key for your selected provider.'],
  consentError: ['Leia e aceite o envio dos dados para continuar.', 'Read and accept the data processing to continue.'],
  permission: ['O acesso ao provedor não foi autorizado. Clique em Salvar para permitir.', 'Provider access was not granted. Click Save to allow it.'],
  transcript: ['Transcrição inválida. Use de 30 a 120 mil caracteres.', 'Invalid transcript. Use 30 to 120,000 characters.'],
  tactiq: ['O Tactiq não entregou a transcrição. Importe um .txt nas configurações.', 'Tactiq did not return a transcript. Import a .txt in settings.'],
  busy: ['Há outro resumo em andamento. Aguarde.', 'Another summary is running. Please wait.'],
  rate: ['Limite de uso atingido. Aguarde e confira os limites no provedor.', 'Usage limit reached. Wait and check provider limits.'],
  auth: ['A API recusou a chave. Confira a chave e o provedor.', 'The API rejected the key. Check your key and provider.'],
  credit: ['Saldo ou orçamento insuficiente na API.', 'Insufficient API credit or budget.'],
  access: ['A API bloqueou o acesso. Confira modelo, permissões e políticas.', 'API access blocked. Check model, permissions and policies.'],
  network: ['Falha de conexão ou tempo esgotado. Uma chamada enviada pode ter sido cobrada; tente novamente apenas se desejar.', 'Connection failed or timed out. A submitted call may have been billed; retry only if you want to.'],
  incomplete: ['A IA não concluiu um resumo válido. Confira o modelo escolhido.', 'AI did not finish a valid summary. Check the selected model.'],
  api: ['A API não concluiu o resumo. Confira o modelo e sua conta.', 'The API could not complete the summary. Check your model and account.'],
  cancelled: ['Configuração mudou ou o trabalho expirou. Solicite um novo resumo.', 'Settings changed or the job expired. Request a new summary.'],
  invalid: ['Solicitação inválida.', 'Invalid request.'], disabled: ['O resumo por hover está pausado.', 'Hover summaries are paused.'],
  failed: ['Falha ao executar a ação. Recarregue a página.', 'Action failed. Reload the page.']
};
export function t(key, locale = 'en') { return messages[key]?.[locale === 'pt-BR' ? 0 : 1] || messages.failed[locale === 'pt-BR' ? 0 : 1]; }
export function errorText(code, locale) { return t(({provider: 'providerError', model: 'modelError', key: 'keyError', consent: 'consentError'})[code] || code, locale); }
export function localize(locale) {
  document.documentElement.lang = locale;
  for (const node of document.querySelectorAll('[data-text]')) node.textContent = t(node.dataset.text, locale);
}
