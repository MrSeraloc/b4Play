import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';

test('popup permits only local scripts/styles and no direct network or form submission', async () => {
  const html = await readFile(new URL('../extension/panel.html', import.meta.url), 'utf8');
  const policy = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1];
  assert.ok(policy);
  for (const directive of ["script-src 'self'", "style-src 'self'", "connect-src 'none'", "object-src 'none'", "form-action 'none'"]) assert.ok(policy.includes(directive));
  for (const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    assert.match(script[1], /src="panel\.js"/); assert.match(script[1], /type="module"/); assert.equal(script[2].trim(), '');
  }
  assert.doesNotMatch(html, /\son\w+\s*=|javascript:|<iframe\b|<object\b/i);
  assert.match(html, /<a id="settings"[^>]+href="settings\.html"/);
  assert.match(html, /id="summarize"[^>]*disabled/);
});

async function panel({fail = false, summary = '<img src=x onerror=alert(1)>', configured = true} = {}) {
  const nodes = new Map(); const messages = [];
  for (const id of ['summarize', 'summary', 'copy', 'status', 'title']) {
    const handlers = {}; const attributes = {};
    const node = {textContent: '', disabled: id === 'summarize', hidden: id === 'copy', handlers, attributes,
      addEventListener(type, fn) { handlers[type] = fn; }, setAttribute(key, value) { attributes[key] = value; }};
    Object.defineProperty(node, 'innerHTML', {set() { throw new Error('Untrusted HTML must not be interpreted'); }});
    nodes.set(id, node);
  }
  globalThis.document = {documentElement: {}, getElementById: id => nodes.get(id), querySelectorAll: () => []};
  globalThis.chrome = {i18n: {getUILanguage: () => 'pt-BR'}, tabs: {async query() { return [{url: 'https://www.youtube.com/watch?v=abcdefghijk', title: 'Vídeo'}]; }}, runtime: {async sendMessage(message) {
    messages.push(message);
    if (message.type === 'SETTINGS') { if (fail) throw new Error('worker unavailable'); return {locale: 'pt-BR', keySet: configured, consent: configured}; }
    return {state: 'ready', summary};
  }}};
  await import('../extension/panel.js?test=' + randomUUID());
  await new Promise(resolve => setImmediate(resolve));
  return {nodes, messages};
}
test('failed initialization leaves summarize disabled with a useful error, and makes no AI request', async () => {
  const h = await panel({fail: true});
  assert.equal(h.nodes.get('summarize').disabled, true);
  assert.match(h.nodes.get('status').textContent, /Recarregue/);
  assert.deepEqual(h.messages.map(message => message.type), ['SETTINGS']);
});
test('summary is inserted as plain text and busy state is reset', async () => {
  const h = await panel();
  assert.equal(h.nodes.get('summarize').disabled, false);
  await h.nodes.get('summarize').handlers.click();
  assert.equal(h.nodes.get('summary').textContent, '<img src=x onerror=alert(1)>');
  assert.equal(h.nodes.get('summary').attributes['aria-busy'], 'false');
  assert.equal(h.nodes.get('copy').hidden, false);
  assert.equal(h.messages.filter(message => message.type === 'START').length, 1);
});
test('missing key or consent leaves summarize disabled and requests only public settings', async () => {
  const h = await panel({configured: false});
  assert.equal(h.nodes.get('summarize').disabled, true);
  assert.match(h.nodes.get('status').textContent, /Configure/);
  assert.deepEqual(h.messages.map(message => message.type), ['SETTINGS']);
});
