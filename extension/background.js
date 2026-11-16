importScripts('translations.js', 'i18n.js', 'core.js');
const { videoId, limitWords, wordCount } = YTHoverCore;
const API = 'http://127.0.0.1:8765';
const TTL = 7 * 86400000;
let lock = Promise.resolve();
// Eventos curtos e estado em storage.session sobrevivem à suspensão do MV3.
function serialized(task) { const result = lock.then(task); lock = result.catch(() => {}); return result; }
const settings = async () => ({ enabled: false, consent: false, language: 'auto', delay: 850, token: '', ...(await chrome.storage.local.get('settings')).settings });
const jobs = async () => (await chrome.storage.session.get('jobs')).jobs || {};
const put = data => chrome.storage.session.set({ jobs: data });
async function api(path, body, timeout = 8000) {
  const config = await settings();
  const language = B4I18N.locale(config.language);
  if (body && path === '/api/jobs') body = { ...body, language };
  if (!config.token) throw new Error('Configure o token do serviço local nas opções da extensão.');
  let response;
  try {
    response = await fetch(API + path, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${config.token}`, 'Accept-Language': language === 'pt_BR' ? 'pt-BR' : 'en', ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(timeout) });
  } catch { throw new Error('Serviço local indisponível. Execute iniciar.ps1 e tente novamente.'); }
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `Erro HTTP ${response.status} no serviço local.`);
  return result;
}
const sourceUrl = id => `https://www.youtube.com/watch?v=${id}`;
const tactiqUrl = id => `https://tactiq.io/tools/run/youtube_transcript?yt=${encodeURIComponent(sourceUrl(id))}`;
async function closeTab(job) { if (job?.tactiqTabId) await chrome.tabs.remove(job.tactiqTabId).catch(() => {}); }
async function fail(all, id, message) {
  await closeTab(all[id]);
  all[id] = { ...all[id], state: 'error', error: message, updatedAt: Date.now(), tactiqTabId: null };
  await put(all);
  return all[id];
}
async function finish(all, id, result) {
  const summary = limitWords(result.summary, 200);
  const ready = { state: 'ready', summary, words: wordCount(summary), model: result.model, source: all[id]?.source || 'Tactiq', language: all[id]?.language || B4I18N.locale((await settings()).language), updatedAt: Date.now() };
  const cache = (await chrome.storage.local.get('cache')).cache || {};
  cache[id] = ready;
  const entries = Object.entries(cache).filter(([, value]) => Date.now() - value.updatedAt < TTL).sort((a, b) => b[1].updatedAt - a[1].updatedAt).slice(0, 200);
  await chrome.storage.local.set({ cache: Object.fromEntries(entries) });
  await closeTab(all[id]); delete all[id]; await put(all);
  return ready;
}
async function getSummary(message, allowDisabled = false) {
  const id = videoId(message.url);
  if (!id) throw new Error('Link de vídeo inválido. Shorts não são suportados nesta versão.');
  const config = await settings();
  B4I18N.set(config.language);
  if (!config.consent) throw new Error(B4I18N.t('consentRequired'));
  const language = B4I18N.locale(config.language);
  if (!config.enabled && !allowDisabled) return { state: 'disabled' };
  const all = await jobs();
  const cached = ((await chrome.storage.local.get('cache')).cache || {})[id];
  if (cached && cached.language === language && Date.now() - cached.updatedAt < TTL && !message.retry) return { ...cached, cached: true };
  let job = all[id];
  if (job && job.language !== language) { await closeTab(job); delete all[id]; await put(all); job = null; }
  if (job && ['transcribing', 'summarizing'].includes(job.state) && Date.now() - job.updatedAt > (job.state === 'transcribing' ? 110000 : 240000)) {
    job = await fail(all, id, 'O processamento expirou. O Tactiq pode estar indisponível ou ter bloqueado a transcrição.');
  }
  if (job?.state === 'summarizing') {
    const result = await api(`/api/jobs/${job.serverJobId}`);
    if (result.state === 'ready') return finish(all, id, result);
    if (result.state === 'error') return fail(all, id, result.error);
    return { state: 'summarizing' };
  }
  if (job?.state === 'transcribing') return { state: job.state };
  if (job?.state === 'error' && !message.retry) return job;
  if (!message.start && !message.retry) return { state: 'idle' };
  // Uma página Tactiq por vez; sem consultas em massa ao serviço gratuito.
  if (Object.values(all).some(value => value.state === 'transcribing')) return { state: 'busy', error: 'O Tactiq está transcrevendo outro vídeo. Tente novamente em alguns instantes.' };
  const health = await api('/api/status');
  if (!health.configured) throw new Error('Configure o provedor, a chave de API e o modelo nas opções da extensão.');
  all[id] = { state: 'transcribing', title: String(message.title || '').slice(0, 500), token: crypto.randomUUID(), language, updatedAt: Date.now(), source: 'Tactiq' };
  await put(all);
  try {
    const tab = await chrome.tabs.create({ url: `${tactiqUrl(id)}#antes-do-play=${all[id].token}`, active: false });
    all[id].tactiqTabId = tab.id; await put(all);
  } catch { return fail(all, id, 'Não foi possível abrir a página do Tactiq.'); }
  return { state: 'transcribing' };
}
async function bridge(message, sender) {
  const url = new URL(sender.tab?.url || sender.url);
  if (url.origin !== 'https://tactiq.io' || url.pathname !== '/tools/run/youtube_transcript') throw new Error('Página Tactiq inválida.');
  const id = videoId(url.searchParams.get('yt'));
  const all = await jobs(); const job = all[id];
  if (!job || job.state !== 'transcribing' || job.tactiqTabId !== sender.tab?.id || url.hash !== `#antes-do-play=${job.token}`) throw new Error('Esta aba não pertence a uma transcrição solicitada.');
  if (message.type === 'BRIDGE_READY') return { id, title: job.title };
  if (message.type === 'TRANSCRIPT_ERROR') return fail(all, id, 'O Tactiq não entregou a transcrição. Pode haver bloqueio, ausência de legendas ou idioma não suportado. Abra o Tactiq ou importe um .txt.');
  if (typeof message.transcript !== 'string' || message.transcript.length < 30 || message.transcript.length > 120000) return fail(all, id, 'Transcrição vazia ou acima do limite de 120 mil caracteres.');
  let result;
  try { result = await api('/api/jobs', { url: sourceUrl(id), title: job.title, transcript: message.transcript }); }
  catch (error) { return fail(all, id, error.message); }
  all[id] = { state: 'summarizing', serverJobId: result.id, source: 'Tactiq', language: job.language, updatedAt: Date.now() };
  await put(all); await closeTab(job);
  if (result.state === 'ready') return finish(all, id, result);
  return { state: 'summarizing' };
}
async function route(message, sender) {
  if (!message || typeof message.type !== 'string') throw new Error('Mensagem inválida.');
  if (['BRIDGE_READY', 'TRANSCRIPT_READY', 'TRANSCRIPT_ERROR'].includes(message.type)) return bridge(message, sender);
  const ownPage = sender.url?.startsWith(chrome.runtime.getURL('')) && !sender.tab?.url?.startsWith('https://');
  const youtube = (() => { try { return ['https://www.youtube.com', 'https://youtube.com'].includes(new URL(sender.url).origin); } catch { return false; } })();
  if (!ownPage && !youtube) throw new Error('Origem da mensagem não permitida.');
  if (message.type === 'GET_SETTINGS') { const config = await settings(); return { enabled: config.enabled, consent: config.consent, language: config.language, delay: config.delay }; }
  if (message.type === 'GET_SUMMARY') return getSummary(message, ownPage);
  if (message.type === 'OPEN_SETTINGS') {
    const id = videoId(message.url);
    await chrome.tabs.create({ url: chrome.runtime.getURL('options.html') + (id ? `?video=${id}&title=${encodeURIComponent(String(message.title || '').slice(0, 500))}` : '') });
    return { ok: true };
  }
  if (message.type === 'OPEN_TACTIQ') {
    const id = videoId(message.url); if (!id) throw new Error('Vídeo inválido.');
    await chrome.tabs.create({ url: tactiqUrl(id), active: true }); return { ok: true };
  }
  if (!ownPage) throw new Error('Esta ação exige a página de opções da extensão.');
  if (message.type === 'SAVE_SETTINGS') {
    const previous = await settings();
    const selected = { token: String(message.token || '').trim(), enabled: message.enabled === true, consent: message.consent === true, language: ['auto', 'en', 'pt_BR'].includes(message.language) ? message.language : 'auto', delay: Math.max(300, Math.min(3000, Number(message.delay) || 850)) };
    if (selected.enabled && !selected.consent) throw new Error(B4I18N.t('consentRequired'));
    await chrome.storage.local.set({ settings: selected });
    if (previous.language !== selected.language || !selected.consent) {
      await chrome.storage.local.remove('cache');
      const all = await jobs();
      for (const [id, job] of Object.entries(all)) if (['transcribing', 'summarizing'].includes(job.state)) await fail(all, id, 'O idioma mudou. Tente novamente para gerar o resumo no idioma escolhido.');
    }
    return { ok: true };
  }
  if (message.type === 'HEALTH') return api('/api/status');
  if (message.type === 'GET_AI_CONFIG') return api('/api/config');
  if (message.type === 'TEST_AI_CONFIG') return api('/api/diagnose', { provider: message.provider, model: message.model, effort: message.effort, apiKey: message.apiKey }, 18000);
  if (message.type === 'SAVE_AI_CONFIG') {
    const result = await api('/api/config', { provider: message.provider, model: message.model, effort: message.effort, apiKey: message.apiKey });
    await chrome.storage.local.remove('cache');
    const all = await jobs();
    for (const [id, job] of Object.entries(all)) if (['transcribing', 'summarizing'].includes(job.state)) await fail(all, id, 'A configuração de IA mudou. Tente novamente para usar o provedor e modelo escolhidos.');
    return result;
  }
  if (message.type === 'CLEAR_CACHE') { await chrome.storage.local.remove('cache'); return { ok: true }; }
  if (message.type === 'IMPORT_TRANSCRIPT') {
    const selected = await settings(); B4I18N.set(selected.language);
    if (!selected.consent) throw new Error(B4I18N.t('consentRequired'));
    const id = videoId(message.url); if (!id) throw new Error('Link de vídeo inválido.');
    const result = await api('/api/jobs', { url: sourceUrl(id), title: String(message.title || '').slice(0, 500), transcript: message.transcript });
    const all = await jobs(); await closeTab(all[id]);
    all[id] = { state: 'summarizing', serverJobId: result.id, source: 'Transcrição importada', language: B4I18N.locale(selected.language), updatedAt: Date.now() }; await put(all);
    // A importação substitui um resumo antigo para o mesmo vídeo.
    const cache = (await chrome.storage.local.get('cache')).cache || {}; delete cache[id]; await chrome.storage.local.set({ cache });
    return result.state === 'ready' ? finish(all, id, result) : { state: 'summarizing' };
  }
  throw new Error('Ação desconhecida.');
}
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  const localized = async result => {
    B4I18N.set((await settings()).language);
    for (const field of ['error', 'message', 'source']) if (typeof result?.[field] === 'string') result[field] = B4I18N.translate(result[field]);
    respond(result);
  };
  serialized(() => route(message, sender)).then(localized, error => localized({ state: 'error', error: error.message })); return true;
});
chrome.runtime.onInstalled.addListener(async () => { await chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' }); await chrome.alarms.create('cleanup', { periodInMinutes: 1 }); });
chrome.runtime.onStartup.addListener(() => chrome.alarms.create('cleanup', { periodInMinutes: 1 }));
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name !== 'cleanup') return;
  void serialized(async () => {
    const cache = (await chrome.storage.local.get('cache')).cache || {};
    const fresh = Object.fromEntries(Object.entries(cache).filter(([, entry]) => Date.now() - entry.updatedAt < TTL));
    if (Object.keys(cache).length !== Object.keys(fresh).length) await chrome.storage.local.set({ cache: fresh });
    const all = await jobs();
    for (const [id, job] of Object.entries(all)) {
      if (job.state === 'transcribing' && Date.now() - job.updatedAt > 110000) await fail(all, id, 'O Tactiq não entregou a transcrição no tempo esperado. Abra o serviço ou importe um .txt.');
      else if (job.state === 'summarizing') {
        try {
          const result = await api(`/api/jobs/${job.serverJobId}`);
          if (result.state === 'ready') await finish(all, id, result);
          else if (result.state === 'error') await fail(all, id, result.error);
          else if (Date.now() - job.updatedAt > 240000) await fail(all, id, 'O resumo expirou. Tente novamente.');
        } catch (error) { await fail(all, id, error.message); }
      } else if (Date.now() - job.updatedAt > 3600000) { delete all[id]; await put(all); }
    }
  });
});
