(function enableHover() {
  if (document.querySelector('[data-b4play]')) return;
  const host = document.createElement('aside'); host.dataset.b4play = '';
  const shadow = host.attachShadow({mode: 'open'});
  const style = document.createElement('style');
  style.textContent = ':host{display:none;position:fixed;z-index:2147483647;width:min(370px,calc(100vw - 24px));font:14px/1.6 system-ui;color:#eef5f2}section{background:#14241f;border:1px solid #47675a;border-radius:16px;padding:18px;box-shadow:0 12px 40px #0006;max-height:70vh;overflow:auto}header{display:flex;justify-content:space-between;color:#9de4bb}h2{font-size:16px;line-height:1.4;margin:14px 0}p{white-space:pre-wrap}button{font:inherit;color:inherit;background:#294c3b;border:1px solid #608371;border-radius:7px;padding:5px 10px;cursor:pointer;margin-right:6px}button:focus-visible{outline:2px solid #baffd0}small{color:#abbfb4}';
  const section = document.createElement('section'); section.setAttribute('role', 'dialog');
  const header = document.createElement('header'); const brand = document.createElement('strong'); brand.textContent = 'b4Play';
  const close = document.createElement('button'); close.textContent = '×'; header.append(brand, close);
  const title = document.createElement('h2'); const text = document.createElement('p');
  const retry = document.createElement('button'); const setup = document.createElement('button'); const note = document.createElement('small');
  section.append(header, title, text, retry, setup, document.createElement('br'), note);
  shadow.append(style, section); document.documentElement.append(host);
  const send = message => chrome.runtime.sendMessage(message);
  let settings = {}; let sequence = 0; let timer; let anchor; let current;
  const pt = () => settings.locale === 'pt-BR';
  const words = (a, b) => pt() ? a : b;
  function labels() {
    close.setAttribute('aria-label', words('Fechar resumo', 'Close summary'));
    section.setAttribute('aria-label', words('Resumo do vídeo', 'Video summary'));
    retry.textContent = words('Tentar novamente', 'Try again'); setup.textContent = words('Configurar', 'Settings');
    note.textContent = words('Até 200 palavras · A API pode cobrar', 'Up to 200 words · API charges may apply');
  }
  async function refresh() { settings = await send({type: 'SETTINGS'}); labels(); if (!settings.hover) hide(); }
  function hide() { sequence++; clearTimeout(timer); host.style.display = 'none'; anchor = null; }
  function idFrom(link) {
    try { const url = new URL(link.href); const id = url.searchParams.get('v'); return url.pathname === '/watch' && /^[\w-]{11}$/.test(id || '') ? id : null; } catch { return null; }
  }
  async function load(force = false) {
    const own = ++sequence; retry.hidden = true;
    text.textContent = words('Buscando transcrição e preparando resumo…', 'Fetching transcript and preparing summary…');
    try {
      let result = await send({type: 'START', ...current, force});
      for (let poll = 0; poll < 180 && own === sequence; poll++) {
        if (result.error) throw new Error(result.error);
        if (result.state === 'ready') { text.textContent = result.summary; return; }
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (own !== sequence) return;
        result = await send({type: 'STATUS', id: result.id});
      }
      if (own === sequence) throw new Error(words('Tempo esgotado.', 'Timed out.'));
    } catch (error) { if (own === sequence) { text.textContent = error.message; retry.hidden = false; } }
  }
  document.addEventListener('pointerover', event => {
    if (!settings.hover || !(event.target instanceof Element)) return;
    const link = event.target.closest('a#thumbnail, a.yt-lockup-view-model__content-image');
    const id = link && idFrom(link); if (!id || anchor === link) return;
    hide(); anchor = link;
    timer = setTimeout(() => {
      if (!link.isConnected) return;
      const card = link.closest('ytd-rich-item-renderer,ytd-video-renderer,ytd-compact-video-renderer,yt-lockup-view-model') || link.parentElement;
      current = {url: 'https://www.youtube.com/watch?v=' + id, title: (card.querySelector('#video-title,h3')?.textContent || '').trim().slice(0, 500)};
      title.textContent = current.title;
      const rect = link.getBoundingClientRect();
      host.style.left = Math.max(12, Math.min(rect.right + 12, innerWidth - 394)) + 'px';
      host.style.top = Math.max(12, Math.min(rect.top, innerHeight - 380)) + 'px';
      host.style.display = 'block'; void load();
    }, 1500);
  }, true);
  document.addEventListener('pointerout', event => {
    if (anchor?.contains(event.target) && !anchor.contains(event.relatedTarget)) clearTimeout(timer);
  }, true);
  close.addEventListener('click', hide);
  retry.addEventListener('click', () => void load(true));
  setup.addEventListener('click', () => void send({type: 'OPEN_SETTINGS'}));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
  document.addEventListener('yt-navigate-start', hide);
  window.addEventListener('scroll', hide, {passive: true});
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void refresh().catch(hide); });
  void refresh().catch(hide);
})();
