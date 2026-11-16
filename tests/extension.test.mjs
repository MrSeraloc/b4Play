import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
const core = await readFile(new URL('../extension/core.js', import.meta.url), 'utf8');
const i18n = await readFile(new URL('../extension/i18n.js', import.meta.url), 'utf8');
const translations = await readFile(new URL('../extension/translations.js', import.meta.url), 'utf8');
const worker = await readFile(new URL('../extension/background.js', import.meta.url), 'utf8');
const ext = `chrome-extension://${'a'.repeat(32)}/`;
const yt = { url: 'https://www.youtube.com/', tab: { id: 1, url: 'https://www.youtube.com/' } };
const url = 'https://www.youtube.com/watch?v=abcdefghijk';
function harness(store = { local: { settings: { token: 'test-token', consent: true, enabled: true, language: 'pt_BR' } }, session: {} }, extensionUrl = ext) {
  let listener; let created = 0; let posts = 0;
  let ai = { provider: 'openai', model: 'first-model', configured: true, profiles: {} };
  const storage = area => ({ async get(key) { return structuredClone({ [key]: store[area][key] }); }, async set(value) { Object.assign(store[area], structuredClone(value)); }, async remove(key) { delete store[area][key]; }, async setAccessLevel() {} });
  const context = vm.createContext({ URL, AbortSignal, console, crypto: { randomUUID }, structuredClone,
    chrome: { runtime: { getURL: path => extensionUrl + path, onMessage: { addListener(fn) { listener = fn; } }, onInstalled: { addListener() {} }, onStartup: { addListener() {} } }, action: { onClicked: { addListener() {} } }, storage: { local: storage('local'), session: storage('session') }, tabs: { async create() { created++; return { id: 42 }; }, async remove() {} }, alarms: { onAlarm: { addListener() {} } } },
    fetch: async (path, init) => ({ ok: true, async json() {
      if (path.endsWith('/api/status')) return { configured: true };
      if (path.endsWith('/api/config')) {
        if (init.method === 'POST') { const input = JSON.parse(init.body); ai = { provider: input.provider, model: input.model, effort: input.effort, configured: true, profiles: {} }; }
        return ai;
      }
      if (init.method === 'POST') { posts++; return { id: 'backend-job', state: 'summarizing' }; }
      return { state: 'ready', summary: 'Um resumo completo para o vídeo de teste.', model: 'test-model' };
    } })
  });
  context.importScripts = (...names) => { const files = { 'core.js': core, 'i18n.js': i18n, 'translations.js': translations }; for (const name of names) vm.runInContext(files[name], context); };
  vm.runInContext(worker, context);
  return { store, counts: () => ({ created, posts }), send: (message, sender = yt) => new Promise(resolve => listener(message, sender, resolve)) };
}
test('hover repetido não abre abas duplicadas; bridge e cache sobrevivem ao reinício do worker', async () => {
  let h = harness();
  assert.equal((await h.send({ type: 'GET_SUMMARY', url, start: true })).state, 'transcribing');
  await h.send({ type: 'GET_SUMMARY', url, start: true }); assert.equal(h.counts().created, 1);
  const job = h.store.session.jobs.abcdefghijk;
  const bridgeUrl = `https://tactiq.io/tools/run/youtube_transcript?yt=${encodeURIComponent(url)}#antes-do-play=${job.token}`;
  h = harness(h.store); // Simula suspensão e novo contexto do MV3.
  const sender = { url: bridgeUrl, tab: { id: 42, url: bridgeUrl } };
  assert.equal((await h.send({ type: 'BRIDGE_READY' }, sender)).id, 'abcdefghijk');
  assert.equal((await h.send({ type: 'TRANSCRIPT_READY', transcript: 'Conteúdo transcrito de exemplo. '.repeat(5) }, sender)).state, 'summarizing');
  const result = await h.send({ type: 'GET_SUMMARY', url }); assert.equal(result.state, 'ready');
  h = harness(h.store);
  assert.equal((await h.send({ type: 'GET_SUMMARY', url, start: true })).cached, true); assert.equal(h.counts().created, 0);
});

test('new installation does not send URLs or transcripts before consent', async () => {
  const h = harness({ local: { settings: { token: 'test-token' } }, session: {} });
  const result = await h.send({ type: 'GET_SUMMARY', url, start: true });
  assert.equal(result.state, 'error'); assert.match(result.error, /processing/);
  assert.equal(h.counts().created, 0); assert.equal(h.counts().posts, 0);
  const imported = await h.send({ type: 'IMPORT_TRANSCRIPT', url, transcript: 'A sufficiently long sample transcript.' }, { url: ext + 'options.html' });
  assert.equal(imported.state, 'error'); assert.equal(h.counts().posts, 0);
});

test('language changes clear old cache and produce language-specific requests', async () => {
  const h = harness();
  h.store.local.cache = { abcdefghijk: { summary: 'Português', language: 'pt_BR', updatedAt: Date.now() } };
  const result = await h.send({ type: 'SAVE_SETTINGS', token: 'test-token', consent: true, enabled: true, language: 'en', delay: 850 }, { url: ext + 'options.html' });
  assert.equal(result.ok, true); assert.equal(h.store.local.cache, undefined);
  await h.send({ type: 'GET_SUMMARY', url, start: true });
  assert.equal(h.store.session.jobs.abcdefghijk.language, 'en');
  const info = await h.send({ type: 'GET_SETTINGS' }); assert.equal(info.token, undefined); assert.equal(info.language, 'en');
});

test('somente as opções configuram a IA; chave não fica no storage e troca invalida cache antigo', async () => {
  const h = harness();
  const message = { type: 'SAVE_AI_CONFIG', provider: 'openrouter', model: 'vendor/model', effort: '', apiKey: 'test-router-secret' };
  assert.equal((await h.send(message)).state, 'error');
  assert.equal((await h.send({ type: 'GET_AI_CONFIG' })).state, 'error');
  assert.equal((await h.send({ type: 'TEST_AI_CONFIG', provider: 'openrouter', model: 'vendor/model' })).state, 'error');
  h.store.local.cache = { abcdefghijk: { summary: 'Cache antigo' } };
  const sender = { url: ext + 'options.html' };
  const result = await h.send(message, sender);
  assert.equal(result.provider, 'openrouter'); assert.equal(h.store.local.cache, undefined);
  assert.ok(!JSON.stringify(h.store).includes('test-router-secret'));
  assert.ok(!JSON.stringify(result).includes('test-router-secret'));
});
test('opções do Opera importam e consultam um resumo sem fixar chrome-extension', async () => {
  const operaUrl = `opera-extension://${'b'.repeat(32)}/`;
  const h = harness(undefined, operaUrl);
  const sender = { url: operaUrl + 'options.html', tab: { id: 2, url: operaUrl + 'options.html' } };
  assert.equal((await h.send({ type: 'HEALTH' }, sender)).configured, true);
  const result = await h.send({ type: 'IMPORT_TRANSCRIPT', url, title: 'Vídeo', transcript: 'Texto transcrito para resumir. '.repeat(4) }, sender);
  assert.equal(result.state, 'summarizing');
  assert.equal((await h.send({ type: 'GET_SUMMARY', url }, sender)).state, 'ready');
  assert.equal(h.counts().posts, 1);
  const forged = { url: `opera-extension://${'b'.repeat(32)}.evil.test/options.html` };
  assert.equal((await h.send({ type: 'HEALTH' }, forged)).state, 'error');
});
test('página externa não aciona importação e aba Tactiq alheia não injeta texto', async () => {
  const h = harness();
  assert.equal((await h.send({ type: 'IMPORT_TRANSCRIPT', url, transcript: 'Texto de teste' })).state, 'error');
  await h.send({ type: 'GET_SUMMARY', url, start: true });
  const badUrl = 'https://tactiq.io/tools/run/youtube_transcript?yt=' + encodeURIComponent(url);
  const result = await h.send({ type: 'TRANSCRIPT_READY', transcript: 'Malicioso '.repeat(5) }, { url: badUrl, tab: { id: 99, url: badUrl } });
  assert.equal(result.state, 'error'); assert.equal(h.counts().posts, 0);
});
