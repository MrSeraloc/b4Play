let demoError = false;
const demoLanguage = new URLSearchParams(location.search).get('lang') === 'pt' ? 'pt_BR' : 'en';
let requestCount = 0;
const example = 'O vídeo apresenta uma forma de estudar com mais intenção: definir uma pergunta antes de começar, dividir o conteúdo em sessões curtas e testar o que foi aprendido sem consultar as anotações. A proposta é trocar a releitura passiva pela recuperação ativa e revisar os pontos difíceis em dias diferentes.\n\nO exemplo acompanha uma pessoa que organiza três blocos de estudo na semana, registra dúvidas e adapta o plano conforme os erros. A ideia central é medir o progresso pela capacidade de explicar e aplicar o conteúdo. O vídeo também ressalta que descanso e regularidade fazem parte do aprendizado, e que a rotina deve caber no tempo disponível.';
globalThis.chrome = { runtime: { async sendMessage(message) {
  if (message.type === 'GET_SETTINGS') return { enabled: true, consent: true, language: demoLanguage, delay: 500 };
  if (message.type === 'GET_SUMMARY') {
    if (demoError) return { state: 'error', error: 'O Tactiq não entregou a transcrição. Abra o serviço ou importe um arquivo .txt.' };
    if (message.start) requestCount = 0;
    if (++requestCount < 2) return { state: 'summarizing' };
    return { state: 'ready', summary: demoLanguage === 'pt_BR' ? example : 'The video describes an intentional approach to learning: start with a question, study in short sessions, and test what you remember without looking at notes. It recommends active recall and spaced review instead of repeatedly rereading the same material. A sample weekly routine combines focused practice, a record of difficult questions, and small adjustments based on mistakes. The central point is to measure progress by what you can explain and apply. Rest and consistency are part of learning, and the routine should fit the time available.', source: demoLanguage === 'pt_BR' ? 'Exemplo fictício' : 'Fictional example', model: 'Demo' };
  }
  alert('Esta é uma demonstração. Use as opções da extensão instalada para esta ação.');
  return { ok: true };
} }, storage: { onChanged: { addListener() {} } } };
function simulate() {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  const thumbnail = document.querySelector('#thumbnail');
  thumbnail.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
}
document.querySelector('#show').addEventListener('click', simulate);
document.querySelector('#error').addEventListener('click', () => { demoError = true; simulate(); });
document.querySelector('#reset').addEventListener('click', () => { demoError = false; simulate(); });
document.querySelectorAll('.thumb').forEach(link => link.addEventListener('click', event => event.preventDefault()));
