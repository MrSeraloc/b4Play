import test from 'node:test';
import assert from 'node:assert/strict';
import { providerError } from '../server/errors.mjs';
import { diagnoseProvider } from '../server/diagnose.mjs';
import { createSummarizer } from '../server/summarizer.mjs';

const config = { provider: 'openrouter', model: 'vendor/model', apiKey: 'fake-private-key', baseUrl: 'https://openrouter.ai/api/v1' };
test('401 e 403 têm diagnósticos distintos sem ecoar resposta privada', () => {
  const auth = providerError(config, 401, { error: { message: 'Invalid fake-private-key for user private-user' } });
  const forbidden = providerError(config, 403, { error: { message: 'Forbidden private-user' } });
  assert.match(auth.message, /HTTP 401.*credencial recusada/); assert.match(forbidden.message, /HTTP 403.*acesso bloqueado/);
  assert.ok(!auth.message.includes('fake-private-key')); assert.ok(!forbidden.message.includes('private-user'));
});
test('403 de orçamento e política não vira instrução para trocar a chave', () => {
  assert.match(providerError(config, 403, { error: { metadata: { limit_source: 'openrouter_key_limit' } } }).message, /limite de uso/);
  assert.match(providerError(config, 403, { error_type: 'content_policy_violation', error: {} }).message, /política de conteúdo/);
});
test('falha de autenticação dentro de HTTP 200 é reconhecida no resumidor', async () => {
  const summarize = createSummarizer(config, async () => new Response(JSON.stringify({ status: 'failed', error_type: 'authentication', error: { code: 'server_error', message: 'private detail' } })));
  await assert.rejects(summarize({ title: 'Teste', transcript: 'Uma transcrição suficientemente longa para o teste.' }), /erro durante a resposta.*credencial recusada/);
});
test('verificação usa somente GET e não retorna dados da chave', async () => {
  const paths = [];
  const result = await diagnoseProvider(config, async (url, init) => {
    paths.push(url); assert.equal(init.method, 'GET'); assert.equal(init.body, undefined);
    assert.equal(init.headers.Authorization, 'Bearer fake-private-key');
    return new Response(JSON.stringify(url.endsWith('/key') ? { data: { label: 'private-label', limit_remaining: null } } : { data: [{ id: 'vendor/model' }] }));
  });
  assert.deepEqual(paths, ['https://openrouter.ai/api/v1/key', 'https://openrouter.ai/api/v1/models']);
  assert.equal(result.modelListed, true);
  assert.ok(!JSON.stringify(result).includes('private-label')); assert.ok(!JSON.stringify(result).includes('fake-private-key'));
});
test('verificação separa chave recusada, limite esgotado e ID ausente no catálogo', async () => {
  await assert.rejects(diagnoseProvider(config, async () => new Response('{"error":{"code":401}}', { status: 401 })), /HTTP 401/);
  await assert.rejects(diagnoseProvider(config, async () => new Response('{"data":{"limit_remaining":0}}')), /chave foi aceita.*limite/);
  const result = await diagnoseProvider(config, async url => new Response(JSON.stringify(url.endsWith('/key') ? { data: {} } : { data: [] })));
  assert.equal(result.modelListed, false); assert.match(result.message, /chave aceita.*não foi encontrado/);
});
