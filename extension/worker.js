import {videoId, language, summaryLocale, normalizeSummaryLength} from './core.js';
import {serviceAccess, requestSummary} from './service.js';
import {errorText} from './strings.js';

const serviceConsentVersion = 3;

// Work state stays in extension-owned storage. Content scripts only receive public replies.
const secured = Promise.all([
  chrome.storage.local.setAccessLevel({accessLevel: 'TRUSTED_CONTEXTS'}),
  chrome.storage.session.setAccessLevel({accessLevel: 'TRUSTED_CONTEXTS'})
]);
let queue = Promise.resolve();
const serial = task => { const result = queue.then(task); queue = result.catch(() => {}); return result; };
const running = new Map();
async function configuration() {
  await secured;
  const {preferences = {}} = await chrome.storage.local.get('preferences');
  const browserLanguage = chrome.i18n.getUILanguage();
  return {revision: preferences.revision, consent: preferences.serviceConsent === serviceConsentVersion,
    locale: language(browserLanguage), summaryLocale: summaryLocale(browserLanguage),
    summaryLength: normalizeSummaryLength(preferences.summaryLength)};
}
const publicSettings = config => ({locale: config.locale, summaryLength: config.summaryLength,
  consent: config.consent, serviceConfigured: !!serviceAccess()});
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
  const access = serviceAccess();
  if (!access) throw new Error('serviceUnavailable');
  if (!config.consent) throw new Error('config');
  if (!await chrome.permissions.contains(access)) throw new Error('permission');
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
function generate(job, transcript) {
  const controller = new AbortController(); running.set(job.id, controller);
  void requestSummary({title: job.title, transcript, summaryLocale: job.summaryLocale, summaryLength: job.summaryLength}, controller.signal).then(
    summary => serial(() => finish(job, {state: 'ready', summary})),
    error => serial(() => finish(job, {state: 'error', error: errorText(error.message, job.locale)}))
  ).finally(() => running.delete(job.id)).catch(() => {});
}
async function start(message, isOwn) {
  const config = await configuration(); await requireReady(config);
  const video = videoId(message.url); if (!video) throw new Error('invalid');
  if (message.transcript !== undefined && !isOwn) throw new Error('invalid');
  if (message.transcript !== undefined && (typeof message.transcript !== 'string' || message.transcript.length < 30 || message.transcript.length > 120000)) throw new Error('transcript');
  const active = await currentJob();
  const matchesGeneration = job => !!job && job.revision === config.revision && job.summaryLocale === config.summaryLocale && job.summaryLength === config.summaryLength;
  if (active?.video === video && active.state === 'error' && matchesGeneration(active) && !message.force) return publicJob(active);
  if (active && ['transcribing', 'summarizing'].includes(active.state)) {
    if (active.video === video && matchesGeneration(active)) return publicJob(active);
    throw new Error('busy');
  }
  const cache = (await chrome.storage.session.get('cache')).cache || {};
  if (!message.force && matchesGeneration(cache[video]) && Date.now() - cache[video].updated < 86400000) return publicJob(cache[video]);
  const now = Date.now();
  const starts = ((await chrome.storage.session.get('starts')).starts || []).filter(time => now - time < 60000);
  if (starts.length >= 3) throw new Error('rate');
  await chrome.storage.session.set({starts: [...starts, now]});
  const job = {id: crypto.randomUUID(), video, title: String(message.title || '').slice(0, 500), locale: config.locale,
    revision: config.revision, summaryLocale: config.summaryLocale, summaryLength: config.summaryLength,
    state: message.transcript === undefined ? 'transcribing' : 'summarizing', updated: now};
  await chrome.storage.session.set({job});
  if (message.transcript !== undefined) generate(job, message.transcript);
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
  await chrome.storage.session.set({job: next}); generate(next, message.text);
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
  if (message.type === 'OPEN_AUTHORIZATION') {
    await chrome.tabs.create({url: chrome.runtime.getURL('settings.html?authorize=1')});
    return {ok: true};
  }
  if (!own) throw new Error('invalid');
  const embedded = sender.frameId > 0 && sender.url.split('?')[0] === chrome.runtime.getURL('settings.html') && Number.isInteger(sender.tab?.id);
  if (message.type === 'CLOSE_COMPACT_SETTINGS') {
    if (!embedded) throw new Error('invalid');
    await chrome.tabs.sendMessage(sender.tab.id, {type: 'COMPACT_SETTINGS_CLOSED'}, {frameId: 0}).catch(() => {});
    return {ok: true};
  }
  if (message.type === 'AUTHORIZE_SUMMARIES') {
    if (sender.frameId > 0) throw new Error('invalid');
    await requireReady({consent: true});
    const {preferences = {}} = await chrome.storage.local.get('preferences');
    await chrome.storage.local.set({preferences: {...preferences, serviceConsent: serviceConsentVersion}});
    return {ok: true};
  }
  if (message.type === 'SAVE') {
    const summaryLength = normalizeSummaryLength(message.summaryLength);
    const config = await configuration();
    if (summaryLength === config.summaryLength) return {ok: true};
    await stop();
    await chrome.storage.local.set({preferences: {summaryLength, serviceConsent: config.consent ? serviceConsentVersion : null, revision: crypto.randomUUID()}});
    if (embedded) await chrome.tabs.sendMessage(sender.tab.id, {type: 'COMPACT_SETTINGS_SAVED', settings: publicSettings(await configuration())}, {frameId: 0}).catch(() => {});
    return {ok: true};
  }
  if (message.type === 'FORGET') {
    if (sender.frameId > 0) throw new Error('invalid');
    await stop(); await chrome.storage.local.clear(); await chrome.storage.session.clear();
    const access = serviceAccess();
    if (access) await chrome.permissions.remove(access);
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
  if (details.reason === 'update') {
    await serial(async () => {
      const {preferences} = await chrome.storage.local.get('preferences');
      await stop();
      await chrome.storage.local.remove('secret');
      await chrome.storage.session.remove('secret');
      if (preferences) {
        await chrome.storage.local.set({preferences: {summaryLength: normalizeSummaryLength(preferences.summaryLength),
          serviceConsent: preferences.serviceConsent === serviceConsentVersion ? serviceConsentVersion : null}});
      }
    });
  }
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
