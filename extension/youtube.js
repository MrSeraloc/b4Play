(function enableHover() {
  if (document.querySelector('[data-b4play]')) return;
  const host = document.createElement('aside'); host.dataset.b4play = '';
  const shadow = host.attachShadow({mode: 'open'});
  const style = document.createElement('style');
  style.textContent = ':host{display:none;position:fixed;z-index:2147483647;width:min(370px,calc(100vw - 24px));font:14px/1.6 system-ui;color:#eef5f2}section{background:#14241f;border:1px solid #47675a;border-radius:16px;padding:18px;box-shadow:0 12px 40px #0006;max-height:70vh;overflow:auto}header{display:flex;justify-content:space-between;color:#9de4bb}h2{font-size:16px;line-height:1.4;margin:14px 0}p{white-space:pre-wrap}button{font:inherit;color:inherit;background:#294c3b;border:1px solid #608371;border-radius:7px;padding:5px 10px;cursor:pointer;margin-right:6px}button:focus-visible{outline:2px solid #baffd0}small{color:#abbfb4}';
  const section = document.createElement('section'); section.setAttribute('role', 'dialog');
  const header = document.createElement('header'); const brand = document.createElement('strong'); brand.textContent = 'b4Play';
  const controls = document.createElement('div');
  const gear = document.createElement('button'); gear.type = 'button'; gear.textContent = '⚙';
  gear.setAttribute('aria-expanded', 'false'); gear.setAttribute('aria-controls', 'b4play-settings');
  const close = document.createElement('button'); close.type = 'button'; close.textContent = '×';
  controls.append(gear, close); header.append(brand, controls);
  const title = document.createElement('h2'); const text = document.createElement('p');
  const retry = document.createElement('button'); const activate = document.createElement('button'); const note = document.createElement('small');
  const summary = document.createElement('div');
  summary.append(title, text, retry, activate, document.createElement('br'), note);
  const preferences = document.createElement('div'); preferences.id = 'b4play-settings'; preferences.hidden = true;
  style.textContent += ' [hidden]{display:none!important} header button{min-width:32px;margin:0 0 0 4px} iframe{display:block;width:100%;height:min(56vh,240px);margin-top:10px;border:0;border-radius:9px;background:white}';
  section.append(header, summary, preferences);
  shadow.append(style, section); document.documentElement.append(host);
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
        text.textContent = words('Configuração salva. Gere outro resumo para usar as novas opções.', 'Settings saved. Generate another summary to use the new options.');
        retry.textContent = words('Gerar resumo', 'Generate summary');
        retry.hidden = false;
      }
      return;
    }
    frame = document.createElement('iframe');
    frame.title = gear.title;
    frame.src = chrome.runtime.getURL('settings.html?compact=1');
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
      text.textContent = words('Serviço de resumos indisponível.', 'Summary service unavailable.');
      return;
    }
    if (!settings.consent) {
      text.textContent = words('Autorize o envio da transcrição no primeiro uso.', 'Allow transcript sharing on first use.');
      activate.hidden = false;
      return;
    }
    retry.textContent = words('Tentar novamente', 'Try again');
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
