import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import { inflateSync } from 'node:zlib';
import { ui, phrases, translate, resolveLocale } from '../shared/translations.mjs';
import { createSummarizer } from '../server/summarizer.mjs';
const base = new URL('../', import.meta.url);
test('both language catalogs contain every declared UI string and valid metadata', async () => {
  for (const locale of ['en', 'pt_BR']) {
    const catalog = JSON.parse(await readFile(new URL('extension/_locales/' + locale + '/messages.json', base), 'utf8'));
    for (const key of Object.keys(ui)) assert.equal(typeof catalog[key]?.message, 'string', key);
    assert.ok(catalog.appName.message.length <= 45); assert.ok(!catalog.appName.message.includes('Opera'));
    assert.ok(catalog.appDescription.message.length <= 132);
  }
  for (const file of ['options.html', 'action.html']) {
    const html = await readFile(new URL('extension/' + file, base), 'utf8');
    for (const match of html.matchAll(/data-i18n(?:-placeholder)?="([^"]+)"/g)) assert.ok(ui[match[1]], 'Missing UI key: ' + match[1]);
  }
});
test('locale fallback, provider diagnostics and Portuguese messages are correct', () => {
  assert.equal(resolveLocale('pt-PT'), 'pt_BR'); assert.equal(resolveLocale('fr-FR'), 'en');
  assert.equal(translate('Link de vídeo inválido.', 'en'), 'Invalid video URL.');
  assert.equal(translate('Link de vídeo inválido.', 'pt_BR'), 'Link de vídeo inválido.');
  const sentence = 'OpenRouter (HTTP 401): ' + phrases.find(([pt]) => pt.startsWith('credencial recusada. Recole'))[0];
  assert.match(translate(sentence, 'en'), /HTTP 401.*credential rejected/);
});
test('the English summary prompt requests English while the Portuguese prompt stays Portuguese', async () => {
  for (const language of ['en', 'pt_BR']) {
    let body;
    const summarize = createSummarizer({ provider: 'openrouter', baseUrl: 'https://example.test', model: 'test', apiKey: 'fake', language }, async (_, init) => {
      body = JSON.parse(init.body); return new Response(JSON.stringify({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: 'Sample summary.' }] }] }));
    });
    await summarize({ title: 'Sample', transcript: 'A sufficiently long transcript for language validation.' });
    assert.match(body.instructions, language === 'en' ? /transcripts in English/ : /português brasileiro/);
  }
});
test('browser distributions contain valid, separate manifests and no development files', async () => {
  for (const target of ['opera', 'chrome']) {
    const directory = new URL('dist/' + target + '/', base);
    const manifest = JSON.parse(await readFile(new URL('manifest.json', directory), 'utf8'));
    assert.equal(manifest.default_locale, 'en'); assert.equal(manifest.action.default_popup, 'action.html');
    assert.deepEqual(manifest.permissions, ['storage','alarms','activeTab']);
    assert.equal(manifest.minimum_chrome_version, target === 'chrome' ? '112' : undefined);
    const files = [manifest.options_page, manifest.background.service_worker, manifest.action.default_popup, ...Object.values(manifest.icons), ...Object.values(manifest.action.default_icon), ...manifest.content_scripts.flatMap(script => script.js)];
    for (const file of files) await access(new URL(file, directory));
    const names = await readdir(directory);
    for (const forbidden of ['server','tests','scripts','data','.env','popup.css','README.md']) assert.ok(!names.includes(forbidden));
    for (const page of ['action.html','options.html']) {
      const html = await readFile(new URL(page, directory), 'utf8');
      assert.ok(!/<script[^>]+src="https?:/i.test(html));
      for (const match of html.matchAll(/(?:src|href)="([^"#:]+)"/g)) if (!/^https?:/.test(match[1])) await access(new URL(match[1], directory));
    }
  }
});
test('original icon PNG is non-interlaced and includes transparent pixels', async () => {
  const png = await readFile(new URL('extension/icons/icon-128.png', base));
  assert.equal(png.readUInt32BE(16), 128); assert.equal(png.readUInt32BE(20), 128); assert.equal(png[28], 0);
  let offset = 8; const data = [];
  while (offset < png.length) { const size = png.readUInt32BE(offset); if (png.toString('ascii', offset + 4, offset + 8) === 'IDAT') data.push(png.subarray(offset + 8, offset + 8 + size)); offset += size + 12; }
  const rows = inflateSync(Buffer.concat(data)); assert.equal(rows[4], 0);
});
