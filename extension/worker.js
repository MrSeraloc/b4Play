import {providers, videoId, language, validateConfig, summarize, reasoningEfforts} from './core.js';
import {errorText} from './strings.js';

// Secrets and work state stay in extension-owned storage; content scripts only get public replies.
const secured = Promise.all([
  chrome.storage.local.setAccessLevel({accessLevel: 'TRUSTED_CONTEXTS'}),
  chrome.storage.session.setAccessLevel({accessLevel: 'TRUSTED_CONTEXTS'})
]);
let queue = Promise.resolve();
const serial = task => { const result = queue.then(task); queue = result.catch(() => {}); return result; };
const running = new Map();
async function configuration() {
  await secured;
  const local = await chrome.storage.local.get(['preferences', 'secret']);
  const session = await chrome.storage.session.get('secret');
  const preferences = local.preferences || {provider: 'openrouter', model: '', language: 'auto', hover: false, consent: false};
  const secret = session.secret || local.secret;
  return {...preferences, key: secret?.provider === preferences.provider ? secret.key : '',
    locale: language(preferences.language === 'auto' ? chrome.i18n.getUILanguage() : preferences.language)};
}
const publicSettings = config => ({provider: config.provider, model: config.model, language: config.language, locale: config.locale,
  reasoning: config.reasoning ?? 'auto', outputTokens: config.outputTokens ?? 4096, summaryLength: config.summaryLength ?? '150-250',
  hover: config.hover, consent: config.consent, remember: !!config.remember, keySet: !!config.key});
const publicJob = job => job ? {id: job.id, video: job.video, state: job.state, summary: job.summary, error: job.error, locale: job.locale} : {state: 'idle'};
const currentJob = async () => (await chrome.storage.session.get('job')).job;
const closeTab = async job => { if (Number.isInteger(job?.tab)) await chrome.tabs.remove(job.tab).catch(() => {}); };
async function stop() {
  for (const controller of running.values()) controller.abort();
  running.clear();
  await closeTab(await currentJob());
  await chrome.storage.session.remove(['job', 'cache']);
}
async function requireReady(config) {
  if (!config.consent || !config.key || !config.model) throw new Error('config');
  if (!await chrome.permissions.contains({origins: [providers[config.provider].origin]})) throw new Error('permission');
}
async function finish(job, value) {
  const config = await configuration(); const current = await currentJob();
  if (config.revision !== job.revision || current?.id !== job.id) return;
  await closeTab(current);
  const result = {...job, tab: null, nonce: null, ...value, updated: Date.now()};
  await chrome.storage.session.set({job: result});
  if (result.state === 'ready') {
    const cache = (await chrome.storage.session.get('cache')).cache || {};
    cache[job.video] = result;
    const entries = Object.entries(cache).filter(([, item]) => Date.now() - item.updated < 86400000).slice(-30);
    await chrome.storage.session.set({cache: Object.fromEntries(entries)});
  }
}
function generate(job, config, transcript) {
  const controller = new AbortController(); running.set(job.id, controller);
  void summarize({...config, signal: controller.signal}, job.title, transcript).then(
    summary => serial(() => finish(job, {state: 'ready', summary})),
    error => serial(() => finish(job, {state: 'error', error: errorText(error.message, job.locale)}))
  ).finally(() => running.delete(job.id)).catch(() => {});
}
async function start(message, isOwn) {
  const config = await configuration(); await requireReady(config);
  if (!isOwn && !config.hover) throw new Error('disabled');
  const video = videoId(message.url); if (!video) throw new Error('invalid');
  if (message.transcript !== undefined && !isOwn) throw new Error('invalid');
  const active = await currentJob();
  if (active?.video === video && active.state === 'error' && active.revision === config.revision && !message.force) return publicJob(active);
  if (active && ['transcribing', 'summarizing'].includes(active.state)) {
    if (active.video === video) return publicJob(active);
    throw new Error('busy');
  }
  const cache = (await chrome.storage.session.get('cache')).cache || {};
  if (!message.force && cache[video]?.revision === config.revision && Date.now() - cache[video].updated < 86400000) return publicJob(cache[video]);
  const now = Date.now();
  const starts = ((await chrome.storage.session.get('starts')).starts || []).filter(time => now - time < 60000);
  if (starts.length >= 3) throw new Error('rate');
  await chrome.storage.session.set({starts: [...starts, now]});
  const job = {id: crypto.randomUUID(), video, title: String(message.title || '').slice(0, 500), locale: config.locale,
    revision: config.revision, state: message.transcript === undefined ? 'transcribing' : 'summarizing', updated: now};
  await chrome.storage.session.set({job});
  if (message.transcript !== undefined) generate(job, config, message.transcript);
  else {
    job.nonce = crypto.randomUUID();
    try {
      const tab = await chrome.tabs.create({url: 'https://tactiq.io/tools/run/youtube_transcript?yt=' + encodeURIComponent('https://www.youtube.com/watch?v=' + video) + '#b4play=' + job.nonce, active: false});
      job.tab = tab.id; await chrome.storage.session.set({job});
    } catch { await finish(job, {state: 'error', error: errorText('tactiq', job.locale)}); }
  }
  return publicJob(await currentJob());
}
async function bridge(message, sender) {
  const job = await currentJob();
  const url = new URL(sender.url || 'about:blank');
  if (!job || job.state !== 'transcribing' || sender.tab?.id !== job.tab || url.origin !== 'https://tactiq.io' ||
      url.pathname !== '/tools/run/youtube_transcript' || url.hash !== '#b4play=' + job.nonce ||
      videoId(url.searchParams.get('yt')) !== job.video) throw new Error('invalid');
  if (message.type === 'TRANSCRIPT_HELLO') return {ok: true};
  if (message.type === 'TRANSCRIPT_FAILED') { await finish(job, {state: 'error', error: errorText('tactiq', job.locale)}); return {ok: true}; }
  const config = await configuration(); await requireReady(config);
  if (typeof message.text !== 'string' || message.text.length < 30 || message.text.length > 120000) throw new Error('transcript');
  await closeTab(job);
  const next = {...job, state: 'summarizing', nonce: null, tab: null, updated: Date.now()};
  await chrome.storage.session.set({job: next}); generate(next, config, message.text);
  return {ok: true};
}
async function dispatch(message, sender) {
  if (!message || typeof message.type !== 'string') throw new Error('invalid');
  if (['TRANSCRIPT_HELLO', 'TRANSCRIPT_READY', 'TRANSCRIPT_FAILED'].includes(message.type)) return bridge(message, sender);
  const own = ['settings.html', 'panel.html'].some(path => sender.url?.split('?')[0] === chrome.runtime.getURL(path));
  let youtube = false;
  try { youtube = ['https://www.youtube.com', 'https://youtube.com'].includes(new URL(sender.url).origin); } catch { /* reject below */ }
  if (!own && !youtube) throw new Error('invalid');
  if (message.type === 'SETTINGS') return publicSettings(await configuration());
  if (message.type === 'START') return start(message, own);
  if (message.type === 'STATUS') {
    if (!own && !message.id) throw new Error('invalid');
    const job = await currentJob();
    if (message.id && job?.id !== message.id) {
      const cache = (await chrome.storage.session.get('cache')).cache || {};
      const cached = Object.values(cache).find(item => item.id === message.id);
      return cached ? publicJob(cached) : {state: 'error', error: errorText('cancelled', (await configuration()).locale)};
    }
    return publicJob(job);
  }
  if (message.type === 'OPEN_SETTINGS') { await chrome.runtime.openOptionsPage(); return {ok: true}; }
  if (!own) throw new Error('invalid');
  if (message.type === 'MODEL_OPTIONS') {
    const model = typeof message.model === 'string' ? message.model.trim() : '';
    if (message.provider !== 'openrouter' || !model || model.length > 160 || /\s/.test(model)) throw new Error('model');
    if (!await chrome.permissions.contains({origins: [providers.openrouter.origin]})) throw new Error('permission');
    let response;
    try {
      // Public metadata only: no Authorization header, transcript, title or inference request.
      response = await fetch('https://openrouter.ai/api/v1/models', {method: 'GET', redirect: 'error', credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(10000)});
    } catch { throw new Error('catalogError'); }
    const catalog = await response.json().catch(() => null);
    if (!response.ok || !Array.isArray(catalog?.data)) throw new Error('catalogError');
    const info = catalog.data.find(item => item.id === model);
    if (!info) throw new Error('modelMissing');
    const advertised = info.reasoning?.supported_efforts;
    const efforts = advertised === null ? reasoningEfforts.filter(effort => effort !== 'auto')
      : Array.isArray(advertised) ? advertised.filter(effort => reasoningEfforts.includes(effort) && effort !== 'auto') : [];
    return {efforts: info.reasoning?.mandatory ? efforts.filter(effort => effort !== 'none') : efforts,
      defaultEffort: typeof info.reasoning?.default_effort === 'string' ? info.reasoning.default_effort : '',
      maxOutput: Number.isInteger(info.top_provider?.max_completion_tokens) ? info.top_provider.max_completion_tokens : null};
  }
  if (message.type === 'SAVE') {
    const previous = await configuration();
    const config = validateConfig(message, previous.provider === message.provider ? previous.key : '');
    if (!await chrome.permissions.contains({origins: [providers[config.provider].origin]})) throw new Error('permission');
    await stop();
    const {key, ...preferences} = config; preferences.revision = crypto.randomUUID();
    const secret = {provider: config.provider, key};
    await chrome.storage.local.set({preferences});
    if (config.remember) await chrome.storage.local.set({secret}); else await chrome.storage.local.remove('secret');
    await chrome.storage.session.set({secret});
    for (const [provider, details] of Object.entries(providers)) if (provider !== config.provider) await chrome.permissions.remove({origins: [details.origin]});
    return {ok: true};
  }
  if (message.type === 'FORGET') {
    await stop(); await chrome.storage.local.clear(); await chrome.storage.session.clear();
    await chrome.permissions.remove({origins: Object.values(providers).map(value => value.origin)});
    return {ok: true};
  }
  throw new Error('invalid');
}
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  serial(async () => { await secured; return dispatch(message, sender); }).then(reply, async error => {
    const config = await configuration().catch(() => ({locale: 'en'}));
    reply({state: 'error', error: errorText(error.message, config.locale)});
  });
  return true;
});
chrome.runtime.onInstalled.addListener(async details => {
  await secured; await chrome.alarms.create('expire', {periodInMinutes: 1});
  if (details.reason === 'install') await chrome.runtime.openOptionsPage();
});
chrome.runtime.onStartup.addListener(() => chrome.alarms.create('expire', {periodInMinutes: 1}));
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name !== 'expire') return;
  void serial(async () => {
    const job = await currentJob();
    if (job && ['transcribing', 'summarizing'].includes(job.state) && Date.now() - job.updated > (job.state === 'transcribing' ? 100000 : 150000)) {
      running.get(job.id)?.abort(); await finish(job, {state: 'error', error: errorText(job.state === 'transcribing' ? 'tactiq' : 'cancelled', job.locale)});
    }
  }).catch(() => {});
});
