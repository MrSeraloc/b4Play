(() => {
  if (document.querySelector('[data-antes-do-play]')) return;
  const { videoId, limitWords, wordCount } = YTHoverCore;
  const tr = text => B4I18N.translate(text);
  const host = document.createElement('div'); host.dataset.antesDoPlay = '';
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style'); style.textContent = YTHoverCSS;
  const card = document.createElement('section'); card.className = 'card'; card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', tr('Resumo do vídeo'));
  // Apenas marcação estática; título e respostas entram sempre com textContent.
  card.innerHTML = '<div class="top"><span class="brand"><i class="dot"></i>b4Play</span><button class="close">×</button></div><h2 class="title"></h2><p class="summary" aria-live="polite"></p><div class="actions"></div><div class="footer"><span></span><span></span></div>';
  shadow.append(style, card); document.documentElement.append(host);
  const title = shadow.querySelector('.title'); const summary = shadow.querySelector('.summary'); const actions = shadow.querySelector('.actions'); const footer = shadow.querySelectorAll('.footer span');
  let config = { enabled: false, delay: 850, language: 'auto' };
  let anchor = null; let timer; let hideTimer; let sequence = 0; let current = null; let inside = false;
  const send = message => chrome.runtime.sendMessage(message);
  const refreshSettings = async () => { const value = await send({ type: 'GET_SETTINGS' }); config = { ...config, ...value }; B4I18N.set(config.language); shadow.querySelector('.close').setAttribute('aria-label', tr('Fechar resumo')); card.setAttribute('aria-label', tr('Resumo do vídeo')); };
  refreshSettings().catch(() => {});
  chrome.storage?.onChanged?.addListener((changes, area) => { if (area === 'local' && changes.settings) { void refreshSettings().then(() => { if (!config.enabled) hide(); }).catch(() => {}); } });
  function hide() { clearTimeout(timer); clearTimeout(hideTimer); sequence++; host.style.display = 'none'; anchor = null; current = null; inside = false; }
  function scheduleHide() { clearTimeout(hideTimer); hideTimer = setTimeout(() => { if (!inside && !shadow.activeElement) hide(); }, 350); }
  function position() {
    if (!anchor?.isConnected) { hide(); return; }
    const rect = anchor.getBoundingClientRect(); const width = Math.min(380, innerWidth - 24);
    let left = rect.right + 12;
    if (left + width > innerWidth - 12) left = rect.left - width - 12;
    if (left < 12) left = Math.max(12, Math.min(rect.left, innerWidth - width - 12));
    const height = Math.min(host.getBoundingClientRect().height || 240, innerHeight - 24);
    host.style.left = `${left}px`; host.style.top = `${Math.max(12, Math.min(rect.top, innerHeight - height - 12))}px`;
  }
  function button(label, handler) { const node = document.createElement('button'); node.className = 'button'; node.textContent = tr(label); node.addEventListener('click', handler); actions.append(node); }
  function render(result) {
    actions.replaceChildren(); summary.className = 'summary';
    footer[0].textContent = tr('Transcrição via Tactiq'); footer[1].textContent = tr('Até 200 palavras');
    if (result.state === 'ready') {
      const text = limitWords(result.summary, 200); summary.textContent = text;
      footer[0].textContent = `${tr(result.source || 'Tactiq')}${result.cached ? tr(' · em cache') : ''}`;
      footer[1].textContent = B4I18N.t('countWords', { count: wordCount(text) });
      button('Copiar resumo', async event => {
        try { await navigator.clipboard.writeText(text); event.target.textContent = tr('Copiado'); } catch { event.target.textContent = tr('Selecione e copie o texto'); }
      });
    } else if (['transcribing', 'summarizing', 'idle'].includes(result.state)) {
      summary.classList.add('loading'); summary.textContent = tr(result.state === 'summarizing' ? 'Transcrição recebida. Preparando seu resumo…' : 'Buscando a transcrição no Tactiq…');
      footer[0].textContent = tr('O primeiro resumo pode levar um pouco');
    } else {
      summary.classList.add('error'); summary.textContent = tr(result.error || (result.state === 'disabled' ? 'Extensão pausada nas configurações.' : 'Não foi possível gerar este resumo.'));
      button('Tentar novamente', () => { if (current) void load(true); });
      button('Abrir Tactiq', () => send({ type: 'OPEN_TACTIQ', url: current.url }).catch(() => {}));
      button('Configurar / importar .txt', () => send({ type: 'OPEN_SETTINGS', ...current }).catch(() => {}));
    }
    position();
  }
  async function load(retry = false) {
    const own = ++sequence; const target = { ...current };
    render({ state: 'idle' });
    for (let count = 0; count < 200 && own === sequence; count++) {
      let result;
      try { result = await send({ type: 'GET_SUMMARY', ...target, start: count === 0, retry: retry && count === 0 }); }
      catch { result = { state: 'error', error: 'A extensão foi atualizada. Recarregue a página do YouTube.' }; }
      if (own !== sequence) return;
      if (!result) result = { state: 'error', error: 'A extensão não respondeu. Recarregue o YouTube.' };
      render(result);
      if (!['transcribing', 'summarizing', 'idle'].includes(result.state)) return;
      await new Promise(resolve => setTimeout(resolve, 1400));
    }
    if (own === sequence) render({ state: 'error', error: 'O processamento demorou demais. Tente novamente.' });
  }
  function targetFor(element) {
    if (!(element instanceof Element)) return null;
    const link = element.closest('a[href]');
    if (!link || !videoId(link.href)) return null;
    if (!(link.id === 'thumbnail' || link.classList.contains('yt-lockup-view-model__content-image') || link.querySelector('img, yt-image, yt-img-shadow'))) return null;
    return link;
  }
  function enter(link) {
    if (!config.enabled || !link) return;
    clearTimeout(hideTimer);
    if (anchor === link) return;
    hide(); anchor = link;
    timer = setTimeout(() => {
      if (!anchor?.isConnected) return;
      const container = link.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, yt-lockup-view-model, .yt-lockup-view-model, article') || link.parentElement;
      const name = container?.querySelector('#video-title, .yt-lockup-metadata-view-model__title, h3');
      current = { url: `https://www.youtube.com/watch?v=${videoId(link.href)}`, title: (name?.textContent || link.getAttribute('aria-label') || 'Resumo do vídeo').trim().slice(0, 500) };
      title.textContent = current.title; host.style.display = 'block'; position(); void load();
    }, Math.max(300, Math.min(3000, Number(config.delay) || 850)));
  }
  document.addEventListener('pointerover', event => { const link = targetFor(event.target); if (link) enter(link); }, true);
  document.addEventListener('pointerout', event => {
    if (!anchor || !(event.target instanceof Element) || !anchor.contains(event.target)) return;
    if (event.relatedTarget instanceof Node && (anchor.contains(event.relatedTarget) || host.contains(event.relatedTarget))) return;
    scheduleHide();
  }, true);
  document.addEventListener('focusin', event => { const link = targetFor(event.target); if (link) enter(link); }, true);
  document.addEventListener('focusout', event => { if (anchor?.contains(event.target)) scheduleHide(); }, true);
  host.addEventListener('pointerenter', () => { inside = true; clearTimeout(hideTimer); });
  host.addEventListener('pointerleave', () => { inside = false; scheduleHide(); });
  shadow.addEventListener('focusout', scheduleHide);
  shadow.querySelector('.close').addEventListener('click', hide);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
  window.addEventListener('scroll', hide, { passive: true }); window.addEventListener('resize', position);
  document.addEventListener('yt-navigate-start', hide); document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); else refreshSettings().catch(() => {}); });
})();
