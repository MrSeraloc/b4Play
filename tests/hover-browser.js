// Development-only browser regression suite. Never packaged in the extension.
const settings = {locale: 'pt-BR', serviceConfigured: true, consent: false};
const starts = [];
const listeners = [];
globalThis.b4playFixtureRequest = async message => {
  if (message.type === 'SETTINGS') return {...settings};
  if (message.type === 'SAVE') {
    settings.summaryLength = message.summaryLength;
    for (const listener of listeners) listener({type: 'COMPACT_SETTINGS_SAVED', settings: {...settings}}, {id: 'fixture'});
  }
  if (message.type === 'CLOSE_COMPACT_SETTINGS') {
    for (const listener of listeners) listener({type: 'COMPACT_SETTINGS_CLOSED'}, {id: 'fixture'});
  }
  if (message.type === 'START') {
    starts.push(message);
    return {id: 'mock-job', state: 'ready', summary: 'Resumo fictício: o hover acionou corretamente a extensão. Nenhuma chamada de IA foi feita.'};
  }
  return {ok: true};
};
globalThis.chrome = {runtime: {
  id: 'fixture', getURL: path => new URL(path, location.origin).href,
  onMessage: {addListener: listener => listeners.push(listener)}, sendMessage: b4playFixtureRequest
}};
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
  const total = 8;
  async function scenario(name, run) {
    reset(); document.getElementById('status').textContent = 'Testando: ' + name;
    const before = starts.length;
    try { await run(before); const item = document.createElement('li'); item.textContent = 'PASSOU · ' + name; document.getElementById('results').append(item); passed++; }
    catch (error) { const item = document.createElement('li'); item.textContent = 'FALHOU · ' + name + ': ' + error.message; document.getElementById('results').append(item); throw error; }
  }
  try {
    await scenario('Usar o hover depois de autorizar', async before => {
      settings.consent = true; pointer(legacy, 'pointerover', outside); await wait(1750);
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
    await scenario('O primeiro hover pede autorização sem enviar dados', async before => {
      settings.consent = false; pointer(legacy, 'pointerover', outside); await wait(1750);
      check(starts.length === before, 'enviou dados sem autorização');
      check(host().shadowRoot.textContent.includes('Autorize o envio'), 'aviso de autorização ausente');
    });
    await scenario('Acesso por foco do teclado', async before => {
      settings.consent = true;
      document.getElementById('modern').dispatchEvent(new FocusEvent('focusin', {bubbles: true})); await wait(1750);
      check(starts.length === before + 1, 'foco não disparou o resumo');
    });
    await scenario('Engrenagem abre o formulário e salva sem disparar outro resumo', async before => {
      pointer(legacy, 'pointerover', outside); await wait(1750);
      const root = host().shadowRoot;
      root.querySelector('button[aria-controls="b4play-settings"]').click();
      const frame = root.querySelector('iframe');
      check(frame, 'painel de preferências ausente');
      for (let attempt = 0; attempt < 40 && !frame.contentDocument?.body?.classList.contains('compact-settings'); attempt++) await wait(50);
      const view = frame.contentDocument;
      check(view.body.classList.contains('compact-settings'), 'formulário compacto não carregou');
      check(view.querySelectorAll('select').length === 1 && !view.querySelector('#provider, #model, #key, #reasoning'), 'formulário contém preferências extras');
      check(view.getElementById('summary-language').textContent.includes('espanhol'), 'idioma do resumo incorreto');
      view.getElementById('summary-length').value = '500-750';
      view.getElementById('preferences').requestSubmit();
      await wait(100);
      check(settings.summaryLength === '500-750', 'faixa não foi salva');
      view.getElementById('done').click();
      await wait(50);
      check(!root.querySelector('iframe') && root.textContent.includes('Gere outro resumo'), 'popup não voltou ao resumo após salvar');
      check(starts.length === before + 1, 'salvar disparou outra chamada');
    });
    document.getElementById('status').textContent = passed + '/' + total + ' testes passaram. Resumo abaixo com dados fictícios.';
  } catch { document.getElementById('status').textContent = 'Teste interrompido: ' + passed + '/' + total + ' passaram.'; }
  finally { event.target.disabled = false; }
});
