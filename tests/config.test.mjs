import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { createConfigStore } from '../server/config.mjs';
import { createSummarizer } from '../server/summarizer.mjs';

async function directory(t) {
  const target = await mkdtemp(join(tmpdir(), 'antes-do-play-config-'));
  assert.equal(dirname(resolve(target)), resolve(tmpdir()));
  t.after(() => rm(target, { recursive: true, force: true }));
  return target;
}
test('OpenRouter mantém seu próprio token, persiste e nunca devolve a chave na configuração pública', async t => {
  const dataDir = await directory(t);
  const store = await createConfigStore({ dataDir, env: { OPENAI_API_KEY: 'openai-env-secret' } });
  const view = await store.save({ provider: 'openrouter', apiKey: 'router-secret', model: 'vendor/small-model:free', effort: '' });
  assert.equal(view.provider, 'openrouter'); assert.equal(view.configured, true); assert.equal(view.profiles.openrouter.keyConfigured, true);
  assert.ok(!JSON.stringify(view).includes('router-secret')); assert.ok(!JSON.stringify(view).includes('openai-env-secret'));
  assert.equal(store.current().baseUrl, 'https://openrouter.ai/api/v1');
  await store.save({ provider: 'openrouter', apiKey: '', model: 'vendor/other-model', effort: 'low' });
  assert.equal(store.current().apiKey, 'router-secret');
  await store.save({ provider: 'openai', apiKey: '', model: 'openai-model', effort: 'low' });
  assert.equal(store.current().apiKey, 'openai-env-secret');
  const disk = await readFile(join(dataDir, 'ai-config.json'), 'utf8');
  assert.ok(!disk.includes('openai-env-secret')); // Chaves do ambiente não são copiadas para o disco.
  const restarted = await createConfigStore({ dataDir, env: {} });
  await restarted.save({ provider: 'openrouter', model: 'vendor/other-model', apiKey: '', effort: '' });
  assert.equal(restarted.current().apiKey, 'router-secret');
});
test('trocar para OpenRouter não reutiliza uma chave OpenAI', async t => {
  const store = await createConfigStore({ dataDir: await directory(t), env: { OPENAI_API_KEY: 'only-openai' } });
  const view = await store.save({ provider: 'openrouter', model: 'vendor/model', apiKey: '', effort: '' });
  assert.equal(view.configured, false); assert.equal(store.current().apiKey, '');
});
test('detecta chave de outro provedor e token local; verifica rascunho sem salvar', async t => {
  const dataDir = await directory(t);
  const store = await createConfigStore({ dataDir, env: {} });
  const input = { provider: 'openrouter', model: 'vendor/model', apiKey: 'sk-other-provider', effort: '' };
  await assert.rejects(store.save(input), /outro provedor/);
  await assert.rejects(store.save({ ...input, apiKey: 'a'.repeat(64) }), /token do serviço local/);
  await assert.rejects(store.save({ ...input, provider: 'openai', apiKey: 'sk-or-v1-example' }), /Selecione OpenRouter/);
  const draft = store.preview({ ...input, apiKey: 'Bearer sk-or-v1-example' });
  assert.equal(draft.apiKey, 'sk-or-v1-example'); assert.equal(store.current().provider, 'openai');
  await assert.rejects(readFile(join(dataDir, 'ai-config.json')), error => error.code === 'ENOENT');
});
test('configurações inválidas não substituem a configuração vigente', async t => {
  const store = await createConfigStore({ dataDir: await directory(t), env: {} });
  const good = { provider: 'openrouter', model: 'vendor/model', apiKey: 'test-key', effort: '' };
  for (const input of [null, { ...good, provider: 'other' }, { ...good, model: '' }, { ...good, model: 'two words' }, { ...good, effort: 'unknown' }, { ...good, apiKey: 'line\nbreak' }]) {
    await assert.rejects(store.save(input));
    assert.equal(store.current().provider, 'openai');
  }
});
test('OpenRouter envia Bearer, modelo com prefixo, store false e omite esforço padrão', async () => {
  let captured;
  const summarize = createSummarizer({ provider: 'openrouter', apiKey: 'test-openrouter-token', model: 'vendor/small-model', effort: '', baseUrl: 'https://openrouter.ai/api/v1' }, async (url, init) => {
    captured = { url, headers: init.headers, body: JSON.parse(init.body) };
    return new Response(JSON.stringify({ status: 'completed', output: [{ type: 'reasoning', content: [] }, { type: 'message', content: [{ type: 'output_text', text: 'Resumo completo dos pontos centrais.' }] }] }));
  });
  assert.equal(await summarize({ title: 'Vídeo', transcript: 'Conteúdo transcrito para um resumo curto e fiel.' }), 'Resumo completo dos pontos centrais.');
  assert.equal(captured.url, 'https://openrouter.ai/api/v1/responses');
  assert.equal(captured.headers.Authorization, 'Bearer test-openrouter-token');
  assert.equal(captured.body.model, 'vendor/small-model'); assert.equal(captured.body.store, false); assert.equal(Object.hasOwn(captured.body, 'reasoning'), false);
});
test('saldo insuficiente no OpenRouter retorna uma mensagem específica', async () => {
  const summarize = createSummarizer({ provider: 'openrouter', apiKey: 'test-key', model: 'vendor/model', effort: '', baseUrl: 'https://openrouter.ai/api/v1' }, async () => new Response('{}', { status: 402 }));
  await assert.rejects(summarize({ title: 'Vídeo', transcript: 'Texto de transcrição válido para o teste de saldo.' }), /Saldo insuficiente/);
});
