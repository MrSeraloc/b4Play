(function enableHover() {
  if (document.querySelector('[data-b4play]')) return;
  const host = document.createElement('aside'); host.dataset.b4play = '';
  const shadow = host.attachShadow({mode: 'open'});
  const style = document.createElement('style');
  // Colors follow the YouTube theme: YouTube sets the `dark` attribute on <html>.
  style.textContent = [
    ':host{display:none;position:fixed;z-index:2147483647;width:min(370px,calc(100vw - 24px));font:14px/1.6 Roboto,Arial,system-ui,sans-serif;color:var(--fg);color-scheme:light;',
    '--bg:#fff;--fg:#0f0f0f;--muted:#606060;--line:rgba(0,0,0,.1);--hover:rgba(0,0,0,.07);--accent:#1f7a4d;--btn:#0f0f0f;--btn-fg:#fff;--error:#c5221f;',
    '--shadow:0 8px 28px rgba(0,0,0,.18),0 1px 4px rgba(0,0,0,.1)}',
    ':host([data-theme=dark]){color-scheme:dark;--bg:#282828;--fg:#f1f1f1;--muted:#aaa;--line:rgba(255,255,255,.12);--hover:rgba(255,255,255,.1);--accent:#6fd3a0;--btn:#f1f1f1;--btn-fg:#0f0f0f;--error:#ff8a80;',
    '--shadow:0 8px 28px rgba(0,0,0,.55),0 1px 4px rgba(0,0,0,.4)}',
    '*{box-sizing:border-box}[hidden]{display:none!important}',
    'section{background:var(--bg);border:1px solid var(--line);border-radius:16px;padding:12px 16px 12px;box-shadow:var(--shadow);max-height:70vh;overflow:auto;scrollbar-width:thin;scrollbar-color:var(--line) transparent;animation:in .16s ease-out}',
    'header{display:flex;align-items:center;justify-content:space-between;gap:8px}',
    '.brand{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;letter-spacing:.2px}',
    '.brand::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--accent)}',
    '.controls{display:flex;gap:2px;margin-right:-8px}',
    'button{font:inherit;color:inherit;cursor:pointer}button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}',
    '.icon{display:grid;place-items:center;width:32px;height:32px;padding:0;border:0;border-radius:50%;background:transparent;color:var(--muted);transition:background .12s,color .12s}',
    '.icon:hover,.icon[aria-expanded=true]{background:var(--hover);color:var(--fg)}.icon svg{width:18px;height:18px}',
    'h2{margin:6px 0 8px;font-size:15px;line-height:1.4;font-weight:600;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}h2:empty{display:none}',
    'p{margin:0;white-space:pre-wrap;font-size:14px;line-height:1.65}',
    '[data-state=loading] p{display:flex;align-items:center;gap:10px;color:var(--muted)}',
    '[data-state=loading] p::before{content:"";flex:none;width:14px;height:14px;border:2px solid var(--line);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite}',
    '[data-state=info] p{color:var(--muted)}[data-state=error] p{color:var(--error)}',
    '.pill{height:32px;margin:12px 8px 0 0;padding:0 14px;border:0;border-radius:16px;font-size:13px;font-weight:500;transition:opacity .12s,background .12s}',
    '.primary{background:var(--btn);color:var(--btn-fg)}.primary:hover{opacity:.85}',
    '.tonal{background:var(--hover)}.tonal:hover{background:var(--line)}',
    'footer{margin-top:12px;padding-top:8px;border-top:1px solid var(--line)}small{color:var(--muted);font-size:12px}',
    'iframe{display:block;width:100%;height:min(56vh,290px);margin-top:8px;border:0;border-radius:12px}',
    '@keyframes in{from{opacity:0;transform:translateY(4px)}}@keyframes spin{to{transform:rotate(360deg)}}',
    '@media(prefers-reduced-motion:reduce){section{animation:none}[data-state=loading] p::before{animation-duration:2.4s}}'
  ].join('\n');
  const NS = 'http://www.w3.org/2000/svg';
  function icon(shapes) {
    const svg = document.createElementNS(NS, 'svg');
    const base = {viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true'};
    for (const [name, value] of Object.entries(base)) svg.setAttribute(name, value);
    for (const [tag, attributes] of shapes) {
      const shape = document.createElementNS(NS, tag);
      for (const [name, value] of Object.entries(attributes)) shape.setAttribute(name, value);
      svg.append(shape);
    }
    return svg;
  }
  const section = document.createElement('section'); section.setAttribute('role', 'dialog');
  const header = document.createElement('header'); const brand = document.createElement('strong'); brand.className = 'brand'; brand.textContent = 'b4Play';
  const controls = document.createElement('div'); controls.className = 'controls';
  const gear = document.createElement('button'); gear.type = 'button'; gear.className = 'icon';
  gear.append(icon([['path', {d: 'M4 7h9M17 7h3M4 17h3M11 17h9'}], ['circle', {cx: '15', cy: '7', r: '2'}], ['circle', {cx: '9', cy: '17', r: '2'}]]));
  gear.setAttribute('aria-expanded', 'false'); gear.setAttribute('aria-controls', 'b4play-settings');
  const close = document.createElement('button'); close.type = 'button'; close.className = 'icon';
  close.append(icon([['path', {d: 'M6 6l12 12M18 6L6 18'}]]));
  controls.append(gear, close); header.append(brand, controls);
  const title = document.createElement('h2'); const text = document.createElement('p');
  const retry = document.createElement('button'); retry.className = 'pill tonal';
  const activate = document.createElement('button'); activate.className = 'pill primary';
  const note = document.createElement('small'); const footer = document.createElement('footer'); footer.append(note);
  const summary = document.createElement('div'); summary.dataset.state = 'info';
  summary.append(title, text, retry, activate, footer);
  const preferences = document.createElement('div'); preferences.id = 'b4play-settings'; preferences.hidden = true;
  section.append(header, summary, preferences);
  shadow.append(style, section); document.documentElement.append(host);
  const syncTheme = () => { host.dataset.theme = document.documentElement.hasAttribute('dark') ? 'dark' : 'light'; };
  syncTheme(); new MutationObserver(syncTheme).observe(document.documentElement, {attributes: true, attributeFilter: ['dark']});
  const show = (message, state) => { text.textContent = message; summary.dataset.state = state; };
  const send = message => chrome.runtime.sendMessage(message);
  let settings = {}; let sequence = 0; let timer; let hideTimer; let anchor; let current;
  let frame; let settingsChanged = false;
  const pt = () => settings.locale === 'pt-BR';
  const words = (a, b) => pt() ? a : b;
  function labels() {
    close.setAttribute('aria-label', words('Fechar resumo', 'Close summary'));
    gear.title = words('Configurações', 'Settings');
    gear.setAttribute('aria-label', gear.title);
    section.setAttribute('aria-label', words('Resumo do vídeo', 'Video summary'));
    retry.textContent = words('Tentar novamente', 'Try again'); activate.textContent = words('Ativar resumos', 'Enable summaries');
    const range = (settings.summaryLength || '150-300').replace('-', '–');
    note.textContent = words('Meta: ' + range + ' palavras', 'Target: ' + range + ' words');
  }
  async function refresh() {
    const result = await send({type: 'SETTINGS'});
    if (result.error) throw new Error(result.error);
    settings = result; labels();
  }
  function resetPanel() {
    frame?.remove(); frame = null;
    preferences.hidden = true;
    summary.hidden = false;
    gear.setAttribute('aria-expanded', 'false');
  }
  function hide() {
    sequence++; clearTimeout(timer); clearTimeout(hideTimer);
    resetPanel(); settingsChanged = false;
    host.style.display = 'none'; anchor = null;
  }
  function togglePanel() {
    clearTimeout(hideTimer);
    if (frame) {
      resetPanel();
      gear.focus();
      if (settingsChanged) {
        settingsChanged = false;
        if (!settings.consent) { void load(); return; }
        sequence++;
        show(words('Configuração salva. Gere outro resumo para usar as novas opções.', 'Settings saved. Generate another summary to use the new options.'), 'info');
        retry.textContent = words('Gerar resumo', 'Generate summary');
        retry.hidden = false;
      }
      return;
    }
    frame = document.createElement('iframe');
    frame.title = gear.title;
    frame.src = chrome.runtime.getURL('settings.html?compact=1' + (host.dataset.theme === 'dark' ? '&theme=dark' : ''));
    preferences.append(frame);
    summary.hidden = true;
    preferences.hidden = false;
    gear.setAttribute('aria-expanded', 'true');
  }
  function idFrom(link) {
    try { const url = new URL(link.href); const id = url.searchParams.get('v'); return url.protocol === 'https:' && ['www.youtube.com', 'youtube.com', 'm.youtube.com'].includes(url.hostname) && !url.username && !url.password && url.pathname === '/watch' && /^[\w-]{11}$/.test(id || '') ? id : null; } catch { return null; }
  }
  function targetFor(element) {
    if (!(element instanceof Element)) return null;
    const link = element.closest('a[href]');
    if (!link || !idFrom(link)) return null;
    return link.id === 'thumbnail' || link.matches('[class*="content-image"], [class*="thumbnail"]') || link.querySelector('img, yt-image, yt-img-shadow') ? link : null;
  }
  async function load(force = false) {
    const own = ++sequence; retry.hidden = true; activate.hidden = true;
    if (!settings.serviceConfigured) {
      show(words('Serviço de resumos indisponível.', 'Summary service unavailable.'), 'error');
      return;
    }
    if (!settings.consent) {
      show(words('Autorize o envio da transcrição no primeiro uso.', 'Allow transcript sharing on first use.'), 'info');
      activate.hidden = false;
      return;
    }
    retry.textContent = words('Tentar novamente', 'Try again');
    show(words('Buscando transcrição e preparando resumo…', 'Fetching transcript and preparing summary…'), 'loading');
    try {
      let result = await send({type: 'START', ...current, force});
      for (let poll = 0; poll < 180 && own === sequence; poll++) {
        if (result.error) throw new Error(result.error);
        if (result.state === 'ready') { show(result.summary, 'ready'); return; }
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (own !== sequence) return;
        result = await send({type: 'STATUS', id: result.id});
      }
      if (own === sequence) throw new Error(words('Tempo esgotado.', 'Timed out.'));
    } catch (error) { if (own === sequence) { show(error.message, 'error'); retry.hidden = false; } }
  }
  async function enter(link) {
    clearTimeout(hideTimer);
    if (frame || !link || anchor === link) return;
    hide(); anchor = link;
    const own = sequence;
    // Authorization and length changes also apply to already-open tabs.
    try { await refresh(); } catch { if (own === sequence) hide(); return; }
    if (own !== sequence || anchor !== link) return;
    const id = idFrom(link); if (!id) { hide(); return; }
    timer = setTimeout(() => {
      if (!link.isConnected || anchor !== link || own !== sequence) { hide(); return; }
      const card = link.closest('ytd-rich-item-renderer,ytd-video-renderer,ytd-compact-video-renderer,yt-lockup-view-model,.yt-lockup-view-model,article') || link.parentElement;
      current = {url: 'https://www.youtube.com/watch?v=' + id, title: (card?.querySelector('#video-title,.yt-lockup-metadata-view-model__title,h3')?.textContent || link.getAttribute('aria-label') || '').trim().slice(0, 500)};
      title.textContent = current.title;
      const rect = link.getBoundingClientRect();
      host.style.left = Math.max(12, Math.min(rect.right + 12, innerWidth - 394)) + 'px';
      host.style.top = Math.max(12, Math.min(rect.top, innerHeight - 380)) + 'px';
      host.style.display = 'block'; void load();
    }, 1500);
  }
  function leave(event) {
    if (frame || !anchor?.contains(event.target) || (event.relatedTarget instanceof Node && (anchor.contains(event.relatedTarget) || host.contains(event.relatedTarget)))) return;
    clearTimeout(timer);
    // A cancelled delay must release the anchor so the same thumbnail can be entered again.
    if (host.style.display !== 'block') hide();
    else hideTimer = setTimeout(hide, 350);
  }
  const over = 'PointerEvent' in window ? 'pointerover' : 'mouseover';
  const out = 'PointerEvent' in window ? 'pointerout' : 'mouseout';
  document.addEventListener(over, event => { const link = targetFor(event.target); if (link) void enter(link); }, true);
  document.addEventListener(out, leave, true);
  document.addEventListener('focusin', event => { const link = targetFor(event.target); if (link) void enter(link); }, true);
  document.addEventListener('focusout', leave, true);
  host.addEventListener('pointerenter', () => clearTimeout(hideTimer));
  host.addEventListener('pointerleave', () => { if (!frame) hideTimer = setTimeout(hide, 350); });
  close.addEventListener('click', hide);
  gear.addEventListener('click', togglePanel);
  chrome.runtime.onMessage?.addListener((message, sender) => {
    if (!frame || sender.id !== chrome.runtime.id) return;
    if (message.type === 'COMPACT_SETTINGS_CLOSED') togglePanel();
    if (message.type === 'COMPACT_SETTINGS_SAVED') {
      settingsChanged = true;
      settings = message.settings;
      labels();
    }
  });
  retry.addEventListener('click', () => void load(true));
  activate.addEventListener('click', () => void send({type: 'OPEN_AUTHORIZATION'}));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (frame) togglePanel();
      else hide();
    }
  });
  document.addEventListener('yt-navigate-start', hide);
  window.addEventListener('scroll', () => { if (!frame) hide(); }, {passive: true});
  window.addEventListener('focus', () => void refresh().catch(hide));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void refresh().catch(hide); });
  void refresh().catch(hide);
})();
