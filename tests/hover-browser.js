// Development-only browser regression suite. Never packaged in the extension.
const settings = {hover: false, locale: 'pt-BR', keySet: true, consent: true};
const starts = [];
globalThis.chrome = {runtime: {async sendMessage(message) {
  if (message.type === 'SETTINGS') return {...settings};
  if (message.type === 'START') {
    starts.push(message);
    return {id: 'mock-job', state: 'ready', summary: 'Resumo fictício: o hover acionou corretamente a extensão. Nenhuma chamada de IA foi feita.'};
  }
  return {ok: true};
}}};
document.addEventListener('click', event => { if (event.target.closest('a')) event.preventDefault(); });
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const pointer = (target, type, relatedTarget = null) => target.dispatchEvent(new PointerEvent(type, {bubbles: true, relatedTarget, pointerType: 'mouse'}));
const reset = () => document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
function check(condition, message) { if (!condition) throw new Error(message); }
document.getElementById('run').addEventListener('click', async event => {
  event.target.disabled = true; document.getElementById('results').replaceChildren(); starts.length = 0; reset();
  const legacy = document.querySelector('#thumbnail img'); const modern = document.querySelector('#modern img');
  const outside = document.getElementById('outside'); const host = () => document.querySelector('[data-b4play]');
  let passed = 0;
  async function scenario(name, run) {
    reset(); document.getElementById('status').textContent = 'Testando: ' + name;
    const before = starts.length;
    try { await run(before); const item = document.createElement('li'); item.textContent = 'PASSOU · ' + name; document.getElementById('results').append(item); passed++; }
    catch (error) { const item = document.createElement('li'); item.textContent = 'FALHOU · ' + name + ': ' + error.message; document.getElementById('results').append(item); throw error; }
  }
  try {
    await scenario('Ativar hover sem recarregar a aba', async before => {
      settings.hover = true; pointer(legacy, 'pointerover', outside); await wait(1750);
      check(starts.length === before + 1, 'não disparou após ativar'); check(host().style.display === 'block', 'popup não abriu');
    });
    await scenario('Sair cedo e voltar à mesma miniatura', async before => {
      pointer(legacy, 'pointerover', outside); await wait(50); pointer(legacy, 'pointerout', outside); await wait(1600);
      check(starts.length === before, 'disparou após sair');
      pointer(legacy, 'pointerover', outside); await wait(1750);
      check(starts.length === before + 1, 'miniatura ficou travada após cancelamento');
    });
    await scenario('Mover entre imagem e sobreposição interna', async before => {
      pointer(legacy, 'pointerover', outside); await wait(300);
      const child = document.getElementById('child'); pointer(legacy, 'pointerout', child); pointer(child, 'pointerover', legacy);
      await wait(1450); check(starts.length === before + 1, 'movimento interno cancelou ou duplicou o resumo');
    });
    await scenario('Miniatura sem ID ou classe fixa', async before => {
      pointer(modern, 'pointerover', outside); await wait(1750);
      check(starts.length === before + 1, 'imagem moderna não detectada');
      check(starts.at(-1).url === 'https://www.youtube.com/watch?v=lmnopqrstuv', 'vídeo incorreto');
    });
    await scenario('Ignorar link externo com formato de vídeo', async before => {
      pointer(document.querySelector('#external img'), 'pointerover', outside); await wait(1750);
      check(starts.length === before, 'enviou URL externa');
    });
    await scenario('Desativar hover sem recarregar a aba', async before => {
      settings.hover = false; pointer(legacy, 'pointerover', outside); await wait(1750);
      check(starts.length === before, 'disparou mesmo desativado'); check(host().style.display === 'none', 'popup não fechou');
    });
    await scenario('Acesso por foco do teclado', async before => {
      settings.hover = true;
      document.getElementById('modern').dispatchEvent(new FocusEvent('focusin', {bubbles: true})); await wait(1750);
      check(starts.length === before + 1, 'foco não disparou o resumo');
    });
    document.getElementById('status').textContent = passed + '/7 testes passaram. Resumo abaixo com dados fictícios.';
  } catch { document.getElementById('status').textContent = 'Teste interrompido: ' + passed + '/7 passaram.'; }
  finally { event.target.disabled = false; }
});
