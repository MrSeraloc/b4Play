import test from 'node:test';
import assert from 'node:assert/strict';
import service from '../service/worker.js';

const permit = {limit: async () => ({success: true})};
const deny = {limit: async () => ({success: false})};
const env = {OPENROUTER_API_KEY: 'fixture-only', OPENROUTER_MODEL: 'test/model', RATE_LIMIT: permit, SERVICE_LIMIT: permit};
const payload = {title: 'An example', transcript: 'This is a transcript with more than thirty characters.', summaryLocale: 'en'};
const request = (data = payload, path = '/v3/summary') => new Request('https://b4play.test' + path, {
  method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
});

test('older clients receive an update requirement before forwarding a transcript', async t => {
  const upstream = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected upstream call'); });
  const response = await service.fetch(request(payload, '/v2/summary'), env);
  assert.equal(response.status, 410);
  assert.deepEqual(await response.json(), {error: 'updateRequired'});
  assert.equal(upstream.mock.callCount(), 0);
});

test('public endpoint enforces request shape, body bounds and rate limits before calling OpenRouter', async () => {
  for (const [input, bindings, status] of [
    [request({...payload, model: 'other/model'}), env, 400],
    [request({...payload, summaryLength: 'unsupported'}), env, 400],
    [request({...payload, transcript: 'x'.repeat(750001)}), env, 413],
    [request(), {...env, RATE_LIMIT: deny}, 429],
    [request(), {...env, SERVICE_LIMIT: deny}, 429],
    [request(), {...env, OPENROUTER_API_KEY: undefined}, 503]
  ]) {
    const response = await service.fetch(input, bindings);
    assert.equal(response.status, status);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.doesNotMatch(await response.text(), /fixture-only/);
  }
});

test('upstream authentication failures return a sanitized service error', async t => {
  const upstream = t.mock.method(globalThis, 'fetch', async () =>
    Response.json({error: {message: 'private account details fixture-only'}}, {status: 401}));
  const response = await service.fetch(request(), env);
  assert.equal(upstream.mock.callCount(), 1);
  assert.deepEqual(await response.json(), {error: 'serviceUnavailable'});
});

test('the response starts while the model is still generating, then contains complete JSON', async t => {
  const {promise, resolve} = Promise.withResolvers();
  t.mock.method(globalThis, 'fetch', () => promise);
  const response = await service.fetch(request(), env);
  const body = response.body.getReader();
  assert.equal(new TextDecoder().decode((await body.read()).value), '\n');
  resolve(Response.json({choices: [{finish_reason: 'stop', message: {content: 'A model summary.'}}]}));
  assert.equal(new TextDecoder().decode((await body.read()).value), '{"summary":"A model summary."}');
  assert.equal((await body.read()).done, true);
});
