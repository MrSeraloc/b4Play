const messages = {
  intro: ['Contexto antes do próximo play.', 'Context before your next play.'],
  summaryLengthLabel: ['Tamanho do resumo (palavras)', 'Summary length (words)'],
  summaryShort: ['Curto (150–300 palavras)', 'Short (150–300 words)'],
  summaryMedium: ['Médio (300–500 palavras)', 'Medium (300–500 words)'],
  summaryLong: ['Longo (500–750 palavras)', 'Long (500–750 words)'],
  summaryLanguage: ['Idioma do resumo: {language} (idioma do navegador).', 'Summary language: {language} (browser language).'],
  fullSettings: ['Opções completas', 'Full settings'],
  summaryLengthConfig: ['Escolha uma das três faixas de tamanho do resumo.', 'Choose one of the three summary-length ranges.'],
  outputLimit: ['O modelo atingiu o limite de saída antes de concluir o resumo.', 'The model reached the output limit before finishing the summary.'],
  parameters: ['O serviço rejeitou a solicitação.', 'The service rejected the request.'],
  refused: ['O provedor recusou o conteúdo. Nenhum resumo foi retornado.', 'The provider refused the content. No summary was returned.'],
  reasoningOnly: ['O modelo retornou sem texto para o resumo.', 'The model returned no summary text.'],
  disclosure: ['Para gerar resumos, inclusive ao passar o mouse sobre uma miniatura, o b4Play envia o link ao Tactiq e encaminha o título e a transcrição ao OpenRouter. O OpenRouter envia esses dados ao provedor que executa a IA. Use apenas conteúdo que possa compartilhar, sem dados pessoais ou confidenciais.', 'To summarize videos, including on thumbnail hover, b4Play sends the URL to Tactiq and forwards the title and transcript to OpenRouter. OpenRouter sends this data to the provider running the AI. Only use content you can share that contains no personal or confidential data.'],
  activate: ['Ativar resumos', 'Enable summaries'],
  allow: ['Autorizar envio', 'Allow sending'],
  allowAndSummarize: ['Autorizar e resumir', 'Allow and summarize'],
  activated: ['Resumos ativados. Volte ao YouTube para usar.', 'Summaries enabled. Return to YouTube to use them.'],
  save: ['Salvar', 'Save'], saved: ['Tamanho salvo.', 'Length saved.'],
  forget: ['Apagar configurações e resumos', 'Delete settings and summaries'], forgotten: ['Dados apagados.', 'Data deleted.'],
  summarize: ['Resumir vídeo atual', 'Summarize current video'], settings: ['Configurar', 'Settings'],
  working: ['Preparando resumo… Pode levar até dois minutos.', 'Preparing summary… May take up to two minutes.'],
  unsupported: ['Abra um vídeo comum do YouTube para resumir.', 'Open a standard YouTube video to summarize.'],
  importTitle: ['Tactiq indisponível? Importe uma transcrição.', 'Tactiq unavailable? Import a transcript.'],
  url: ['Link do vídeo', 'Video URL'], file: ['Arquivo .txt (até 120 mil caracteres)', '.txt file (up to 120,000 characters)'],
  import: ['Resumir arquivo', 'Summarize file'], copy: ['Copiar resumo', 'Copy summary'], copied: ['Copiado.', 'Copied.'],
  privacy: ['Privacidade e instalação', 'Privacy and installation'], close: ['Fechar', 'Close'],
  config: ['Autorize o envio da transcrição para gerar o resumo.', 'Allow transcript sharing to generate a summary.'],
  permission: ['O acesso ao serviço precisa ser autorizado no navegador.', 'Allow the browser to access the summary service.'],
  transcript: ['Transcrição inválida. Use de 30 a 120 mil caracteres.', 'Invalid transcript. Use 30 to 120,000 characters.'],
  tactiq: ['O Tactiq não entregou a transcrição. Importe um .txt nas configurações.', 'Tactiq did not return a transcript. Import a .txt in settings.'],
  busy: ['Há outro resumo em andamento. Aguarde.', 'Another summary is running. Please wait.'],
  rate: ['Limite de uso do serviço atingido. Tente novamente mais tarde.', 'The service reached its usage limit. Try again later.'],
  network: ['A conexão falhou ou o tempo de resposta se esgotou.', 'The connection failed or the request timed out.'],
  serviceUnavailable: ['O serviço de resumos do b4Play está indisponível.', 'The b4Play summary service is unavailable.'],
  incomplete: ['O modelo não concluiu um resumo válido.', 'The model did not finish a valid summary.'],
  cancelled: ['Configuração mudou ou o trabalho expirou. Solicite um novo resumo.', 'Settings changed or the job expired. Request a new summary.'],
  invalid: ['Solicitação inválida.', 'Invalid request.'],
  failed: ['Falha ao executar a ação. Recarregue a página.', 'Action failed. Reload the page.']
};
export function t(key, locale = 'en') { return messages[key]?.[locale === 'pt-BR' ? 0 : 1] || messages.failed[locale === 'pt-BR' ? 0 : 1]; }
export function errorText(code, locale) { return t(code, locale); }
export function localize(locale) {
  document.documentElement.lang = locale;
  for (const node of document.querySelectorAll('[data-text]')) node.textContent = t(node.dataset.text, locale);
}
