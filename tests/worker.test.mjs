import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

function storage() {
  const data = {};
  return {data, levels: [], async setAccessLevel(value) { this.levels.push(value); }, async get(keys) {
    const result = {}; for (const key of Array.isArray(keys) ? keys : [keys]) if (key in data) result[key] = structuredClone(data[key]); return result;
  }, async set(value) { Object.assign(data, structuredClone(value)); }, async remove(keys) { for (const key of Array.isArray(keys) ? keys : [keys]) delete data[key]; }, async clear() { for (const key of Object.keys(data)) delete data[key]; }};
}
async function setup() {
  let listener; const events = () => ({addListener() {}});
  const local = storage(); const session = storage(); const tabs = []; const removed = []; const requests = [];
  const allowed = new Set(['https://openrouter.ai/*', 'https://api.openai.com/*']);
  globalThis.chrome = {storage: {local, session}, i18n: {getUILanguage: () => 'en'},
    runtime: {getURL: path => 'chrome-extension://test/' + path, onMessage: {addListener(fn) { listener = fn; }}, onInstalled: events(), onStartup: events(), async openOptionsPage() {}},
    permissions: {async contains({origins}) { return origins.every(origin => allowed.has(origin)); }, async remove({origins}) { for (const origin of origins) allowed.delete(origin); }},
    tabs: {async create(value) { const tab = {id: tabs.length + 1, ...value}; tabs.push(tab); return tab; }, async remove(id) { removed.push(id); }},
    alarms: {async create() {}, onAlarm: events()}};
  globalThis.fetch = async (url, options) => { requests.push({url, options}); return Response.json({choices: [{finish_reason: 'stop', message: {content: 'A safe mocked summary.'}}]}); };
  await import('../extension/worker.js?test=' + randomUUID());
  const send = (message, sender = {url: 'chrome-extension://test/settings.html'}) => new Promise(resolve => listener(message, sender, resolve));
  const save = extra => send({type: 'SAVE', provider: 'openrouter', key: 'sk-or-test', model: 'provider/model', consent: true, ...extra});
  const wait = async id => { for (let i = 0; i < 30; i++) { const result = await send({type: 'STATUS', id}); if (['ready', 'error'].includes(result.state)) return result; await new Promise(resolve => setImmediate(resolve)); } throw new Error('job did not finish'); };
  return {local, session, tabs, removed, requests, allowed, send, save, wait};
}
const video = 'https://www.youtube.com/watch?v=abcdefghijk';
const youtube = {url: 'https://www.youtube.com/', tab: {id: 50}};
test('installation sends nothing before key, consent and permissions; key stays private', async () => {
  const h = await setup();
  assert.ok((await h.send({type: 'START', url: video})).error);
  assert.equal(h.tabs.length, 0); assert.equal(h.requests.length, 0);
  await h.save();
  assert.equal(h.local.data.secret, undefined);
  assert.equal(h.session.data.secret.key, 'sk-or-test');
  assert.equal(h.local.levels[0].accessLevel, 'TRUSTED_CONTEXTS');
  assert.equal(h.session.levels[0].accessLevel, 'TRUSTED_CONTEXTS');
  assert.doesNotMatch(JSON.stringify(await h.send({type: 'SETTINGS'}, youtube)), /sk-or-test/);
  assert.ok((await h.send({type: 'SAVE', key: 'evil'}, youtube)).error);
  h.allowed.clear(); assert.ok((await h.send({type: 'START', url: video})).error);
  assert.equal(h.tabs.length, 0);
});
test('hover is off by default and untrusted pages cannot import or retrieve jobs', async () => {
  const h = await setup(); await h.save();
  assert.ok((await h.send({type: 'START', url: video}, youtube)).error);
  assert.ok((await h.send({type: 'START', url: video, transcript: 'A transcript with sufficient information.'}, youtube)).error);
  assert.ok((await h.send({type: 'SETTINGS'}, {url: 'https://evil.test/'})).error);
  assert.ok((await h.send({type: 'STATUS'}, youtube)).error);
  assert.equal(h.tabs.length, 0); assert.equal(h.requests.length, 0);
});
test('Tactiq bridge verifies origin, video, tab and nonce; duplicate hover shares job', async () => {
  const h = await setup(); await h.save({hover: true});
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
  assert.doesNotMatch(JSON.stringify(result), /sk-or|nonce|Bearer/);
  const cached = await h.send({type: 'START', url: video}, youtube);
  assert.equal(cached.summary, result.summary); assert.equal(h.tabs.length, 1);
});
test('import works without Tactiq, settings change invalidates cache, delete removes key and permissions', async () => {
  const h = await setup(); await h.save({remember: true});
  assert.equal(h.local.data.secret.key, 'sk-or-test');
  const job = await h.send({type: 'START', url: video, transcript: 'A manually imported transcript with enough information.'});
  assert.equal((await h.wait(job.id)).state, 'ready'); assert.equal(h.tabs.length, 0);
  await h.save({key: '', language: 'pt-BR'});
  assert.equal(h.session.data.cache, undefined); assert.equal(h.local.data.secret, undefined);
  assert.equal(h.session.data.secret.key, 'sk-or-test');
  await h.send({type: 'FORGET'});
  assert.deepEqual(h.local.data, {}); assert.deepEqual(h.session.data, {}); assert.equal(h.allowed.size, 0);
});
test('failed AI requests are not repeated by hover', async () => {
  const h = await setup(); await h.save({hover: true});
  globalThis.fetch = async () => { h.requests.push('failure'); return Response.json({error: {message: 'secret'}}, {status: 401}); };
  const job = await h.send({type: 'START', url: video, transcript: 'A manually imported transcript with enough information.'});
  assert.equal((await h.wait(job.id)).state, 'error');
  const again = await h.send({type: 'START', url: video}, youtube);
  assert.equal(again.state, 'error'); assert.equal(h.requests.length, 1); assert.equal(h.tabs.length, 0);
});
