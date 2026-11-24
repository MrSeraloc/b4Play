import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import service from '../service/worker.js';

function storage() {
  const data = {};
  return {data, levels: [], async setAccessLevel(value) { this.levels.push(value); }, async get(keys) {
    const result = {}; for (const key of Array.isArray(keys) ? keys : [keys]) if (key in data) result[key] = structuredClone(data[key]); return result;
  }, async set(value) { Object.assign(data, structuredClone(value)); }, async remove(keys) { for (const key of Array.isArray(keys) ? keys : [keys]) delete data[key]; }, async clear() { for (const key of Object.keys(data)) delete data[key]; }};
}
async function setup(browserLanguage = 'en') {
  let listener, installed; const events = () => ({addListener() {}});
  const sentToTabs = []; const optionsOpened = [];
  const local = storage(); const session = storage(); const tabs = []; const removed = []; const requests = [];
  const allowed = new Set(['https://b4play.test/*']);
  const upstream = [];
  const limiter = {limit: async () => ({success: true})};
  const env = {OPENROUTER_API_KEY: 'sk-or-test', OPENROUTER_MODEL: 'test/model', RATE_LIMIT: limiter, SERVICE_LIMIT: limiter};
  globalThis.chrome = {storage: {local, session}, i18n: {getUILanguage: () => browserLanguage},
    runtime: {getManifest: () => ({optional_host_permissions: ['https://b4play.test/*']}), getURL: path => 'chrome-extension://test/' + path, onMessage: {addListener(fn) { listener = fn; }}, onInstalled: {addListener(fn) { installed = fn; }}, onStartup: events(), async openOptionsPage() { optionsOpened.push(true); }},
    permissions: {async contains({origins}) { return origins.every(origin => allowed.has(origin)); }, async remove({origins}) { for (const origin of origins) allowed.delete(origin); }},
    tabs: {async create(value) { const tab = {id: tabs.length + 1, ...value}; tabs.push(tab); return tab; }, async remove(id) { removed.push(id); },
      async sendMessage(id, message, options) { sentToTabs.push({id, message, options}); }},
    alarms: {async create() {}, onAlarm: events()}};
  globalThis.fetch = async (url, options) => {
    if (url === 'https://b4play.test/v3/summary') { requests.push({url, options}); return service.fetch(new Request(url, options), env); }
    assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
    upstream.push({url, options});
    return Response.json({choices: [{finish_reason: 'stop', message: {content: 'A safe mocked summary.'}}]});
  };
  await import('../extension/worker.js?test=' + randomUUID());
  const send = (message, sender = {url: 'chrome-extension://test/settings.html'}) => new Promise(resolve => listener(message, sender, resolve));
  const save = extra => send({type: 'SAVE', ...extra});
  const authorize = () => send({type: 'AUTHORIZE_SUMMARIES'});
  const wait = async id => { for (let i = 0; i < 30; i++) { const result = await send({type: 'STATUS', id}); if (['ready', 'error'].includes(result.state)) return result; await new Promise(resolve => setImmediate(resolve)); } throw new Error('job did not finish'); };
  return {local, session, tabs, removed, requests, upstream, allowed, send, save, authorize, wait, sentToTabs, installed, optionsOpened};
}
const video = 'https://www.youtube.com/watch?v=abcdefghijk';
const youtube = {url: 'https://www.youtube.com/', tab: {id: 50}};
test('embedded settings change length and summaries follow the browser locale', async () => {
  const h = await setup('es-ES');
  const frame = {url: 'chrome-extension://test/settings.html?compact=1', tab: {id: 50}, frameId: 2};
  const previous = await h.send({type: 'SETTINGS'}, frame);
  assert.equal(previous.summaryLength, '150-300');
  assert.equal(previous.locale, 'en');
  assert.equal(previous.consent, false);
  assert.ok((await h.send({type: 'FORGET'}, frame)).error);
  assert.ok((await h.send({type: 'AUTHORIZE_SUMMARIES'}, frame)).error);
  assert.ok((await h.send({type: 'CLOSE_COMPACT_SETTINGS'}, youtube)).error);
  assert.deepEqual(await h.send({type: 'SAVE', ...previous, summaryLength: '500-750'}, frame), {ok: true});
  assert.equal(h.session.data.secret, undefined);
  const [saved] = h.sentToTabs;
  assert.equal(saved.id, 50);
  assert.equal(saved.options.frameId, 0);
  assert.equal(saved.message.type, 'COMPACT_SETTINGS_SAVED');
  assert.equal(saved.message.settings.summaryLength, '500-750');
  assert.equal(saved.message.settings.consent, false);
  assert.doesNotMatch(JSON.stringify(saved), /sk-or-test/);
  await h.send({type: 'CLOSE_COMPACT_SETTINGS'}, frame);
  assert.equal(h.sentToTabs.at(-1).message.type, 'COMPACT_SETTINGS_CLOSED');
  await h.authorize();
  const job = await h.send({type: 'START', url: video, transcript: 'An English transcript with enough information to summarize.'});
  assert.equal((await h.wait(job.id)).state, 'ready');
  const prompt = JSON.parse(h.upstream[0].options.body).messages[0].content;
  assert.match(prompt, /es-ES.*translating the source/);
  assert.match(prompt, /between 500 and 750 words/);
});
test('installation sends nothing before consent and permissions', async () => {
  const h = await setup();
  assert.ok((await h.send({type: 'START', url: video})).error);
  assert.equal(h.tabs.length, 0); assert.equal(h.requests.length, 0);
  await h.installed({reason: 'install'});
  assert.equal(h.optionsOpened.length, 0);
  assert.ok((await h.send({type: 'AUTHORIZE_SUMMARIES'}, youtube)).error);
  await h.save({summaryLength: '300-500'});
  assert.ok((await h.send({type: 'START', url: video}, youtube)).error);
  await h.authorize();
  assert.equal(h.local.data.secret, undefined);
  assert.equal(h.session.data.secret, undefined);
  assert.equal(h.local.levels[0].accessLevel, 'TRUSTED_CONTEXTS');
  assert.equal(h.session.levels[0].accessLevel, 'TRUSTED_CONTEXTS');
  assert.doesNotMatch(JSON.stringify(await h.send({type: 'SETTINGS'}, youtube)), /sk-or-test/);
  assert.ok((await h.send({type: 'SAVE', consent: true}, youtube)).error);
  h.allowed.clear(); assert.ok((await h.send({type: 'START', url: video})).error);
  assert.equal(h.tabs.length, 0);
});
test('untrusted pages cannot import transcripts or retrieve arbitrary jobs', async () => {
  const h = await setup(); await h.authorize();
  assert.ok((await h.send({type: 'START', url: video, transcript: 'A transcript with sufficient information.'}, youtube)).error);
  assert.ok((await h.send({type: 'SETTINGS'}, {url: 'https://evil.test/'})).error);
  assert.ok((await h.send({type: 'STATUS'}, youtube)).error);
  assert.equal(h.tabs.length, 0); assert.equal(h.requests.length, 0);
});
test('Tactiq bridge verifies origin, video, tab and nonce; duplicate hover shares job', async () => {
  const h = await setup(); await h.authorize();
  const job = await h.send({type: 'START', url: video}, youtube);
  const duplicate = await h.send({type: 'START', url: video}, youtube);
  assert.equal(job.id, duplicate.id); assert.equal(h.tabs.length, 1);
  const tab = h.tabs[0]; const sender = {url: tab.url, tab: {id: tab.id}};
  assert.ok((await h.send({type: 'TRANSCRIPT_HELLO'}, {...sender, tab: {id: 99}})).error);
  assert.ok((await h.send({type: 'TRANSCRIPT_HELLO'}, {...sender, url: tab.url.replace('tactiq.io', 'evil.test')})).error);
  assert.deepEqual(await h.send({type: 'TRANSCRIPT_HELLO'}, sender), {ok: true});
  assert.equal(h.requests.length, 0);
  await h.send({type: 'TRANSCRIPT_READY', text: 'A legitimate transcript with sufficient information to summarize.'}, sender);
  const result = await h.wait(job.id); assert.equal(result.state, 'ready');
  assert.equal(h.requests.length, 1); assert.ok(h.removed.includes(tab.id));
  assert.equal(h.requests[0].options.headers.Authorization, undefined);
  assert.doesNotMatch(h.requests[0].options.body, /sk-or-test|model/);
  assert.equal(h.upstream[0].options.headers.Authorization, 'Bearer sk-or-test');
  assert.equal(JSON.parse(h.upstream[0].options.body).model, 'test/model');
  assert.doesNotMatch(JSON.stringify(result), /sk-or|nonce|Bearer/);
  const cached = await h.send({type: 'START', url: video}, youtube);
  assert.equal(cached.summary, result.summary); assert.equal(h.tabs.length, 1);
});
test('import works without Tactiq, settings change invalidates cache, delete removes data and permissions', async () => {
  const h = await setup(); await h.authorize();
  const job = await h.send({type: 'START', url: video, transcript: 'A manually imported transcript with enough information.'});
  assert.equal((await h.wait(job.id)).state, 'ready'); assert.equal(h.tabs.length, 0);
  await h.save({summaryLength: '300-500'});
  assert.equal(h.session.data.cache, undefined); assert.equal(h.local.data.secret, undefined);
  assert.equal(h.session.data.secret, undefined);
  await h.send({type: 'FORGET'});
  assert.deepEqual(h.local.data, {}); assert.deepEqual(h.session.data, {}); assert.equal(h.allowed.size, 0);
});
test('failed AI requests are not repeated by hover', async () => {
  const h = await setup(); await h.authorize();
  globalThis.fetch = async () => { h.requests.push('failure'); return Response.json({error: {message: 'secret'}}, {status: 401}); };
  const job = await h.send({type: 'START', url: video, transcript: 'A manually imported transcript with enough information.'});
  assert.equal((await h.wait(job.id)).state, 'error');
  const again = await h.send({type: 'START', url: video}, youtube);
  assert.equal(again.state, 'error'); assert.equal(h.requests.length, 1); assert.equal(h.tabs.length, 0);
});

test('the client sends length and language preferences and the server disables reasoning', async () => {
  const h = await setup(); await h.authorize();
  await h.save({reasoning: 'off', outputTokens: 1024, summaryLength: '500-750'});
  const settings = await h.send({type: 'SETTINGS'});
  assert.equal(settings.reasoning, undefined); assert.equal(settings.outputTokens, undefined);
  assert.equal(settings.summaryLength, '500-750');
  assert.doesNotMatch(JSON.stringify(settings), /sk-or-test/);
  const job = await h.send({type: 'START', url: video, transcript: 'A manually imported transcript with enough information.'});
  assert.equal((await h.wait(job.id)).state, 'ready');
  const body = JSON.parse(h.upstream[0].options.body);
  assert.deepEqual(body.reasoning, {effort: 'none', exclude: true}); assert.equal(body.max_tokens, 8192);
  assert.deepEqual(Object.keys(JSON.parse(h.requests[0].options.body)).sort(), ['summaryLength', 'summaryLocale', 'title', 'transcript']);
  assert.match(body.messages[0].content, /between 500 and 750 words/);
  await h.save({summaryLength: '150-300'});
  assert.equal(h.session.data.cache, undefined);
});

test('the previous authorization keeps the length but requires the updated provider disclosure', async () => {
  const h = await setup();
  await h.local.set({preferences: {serviceConsent: true, summaryLength: '500-750'}});
  await h.installed({reason: 'update'});
  const settings = await h.send({type: 'SETTINGS'});
  assert.equal(settings.consent, false);
  assert.equal(settings.summaryLength, '500-750');
  assert.ok((await h.send({type: 'START', url: video}, youtube)).error);
  assert.equal(h.tabs.length, 0);
  assert.equal(h.requests.length, 0);
  await h.authorize();
  assert.equal((await h.send({type: 'SETTINGS'})).consent, true);
});
test('upgrades keep preferences, remove legacy keys and require new consent', async () => {
  const h = await setup();
  await h.local.set({secret: {provider: 'openrouter', key: 'sk-or-old'}, preferences: {
    provider: 'openrouter', model: 'legacy/model', consent: true, remember: true, reasoning: 'high',
    language: 'pt-BR', hover: true, summaryLength: '300-500'
  }});
  await h.session.set({secret: {provider: 'openrouter', key: 'sk-or-old'}});
  await h.installed({reason: 'update'});
  const settings = await h.send({type: 'SETTINGS'});
  assert.equal(h.local.data.secret, undefined);
  assert.equal(h.session.data.secret, undefined);
  assert.equal(settings.consent, false);
  assert.equal(settings.summaryLength, '300-500');
  assert.equal(h.local.data.preferences.model, undefined);
  assert.equal(h.local.data.preferences.reasoning, undefined);
  assert.ok((await h.send({type: 'START', url: video})).error);
  assert.equal(h.requests.length, 0);
  assert.equal(h.tabs.length, 0);
});
