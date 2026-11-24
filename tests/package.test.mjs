import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, access} from 'node:fs/promises';
process.env.B4PLAY_WORKER_URL = 'https://b4play.test';
await import('../scripts/build.mjs');
test('both browser manifests reference existing files with no local service or broad host permission', async () => {
  for (const browser of ['opera', 'chrome']) {
    const base = new URL('../dist/' + browser + '/', import.meta.url);
    const manifest = JSON.parse(await readFile(new URL('manifest.json', base), 'utf8'));
    assert.equal(manifest.version, '0.1.0'); assert.equal(manifest.background.type, 'module');
    assert.equal(manifest.host_permissions, undefined);
    assert.deepEqual(manifest.optional_host_permissions, ['https://b4play.test/*']);
    assert.deepEqual(manifest.permissions.sort(), ['activeTab', 'alarms', 'storage']);
    assert.deepEqual(manifest.web_accessible_resources, [{resources: ['settings.html'], matches: ['https://www.youtube.com/*', 'https://youtube.com/*']}]);
    const references = [manifest.background.service_worker, manifest.action.default_popup, manifest.options_page,
      ...manifest.content_scripts.flatMap(script => script.js), ...Object.values(manifest.icons), ...Object.values(manifest.action.default_icon)];
    for (const file of references) await access(new URL(file, base));
    const files = JSON.parse(await readFile(new URL('../dist/' + browser + '-files.json', import.meta.url), 'utf8'));
    assert.ok(files.includes('service.js'));
    assert.ok(files.every(path => !/^(service\/|wrangler\.)/.test(path)));
    const settings = await readFile(new URL('settings.html', base), 'utf8');
    assert.doesNotMatch(settings, /id="(?:provider|model|key|remember|language|hover|reasoning|output-tokens)"/);
    assert.equal((settings.match(/<select\b/g) || []).length, 1);
    assert.ok(files.every(path => !/\.(zip|exe|ps1|bat|cmd)$|server\/|data\/|\.env/.test(path)));
  }
});
