import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, access} from 'node:fs/promises';
import '../scripts/build.mjs';
test('both browser manifests reference existing files with no local service or broad host permission', async () => {
  for (const browser of ['opera', 'chrome']) {
    const base = new URL('../dist/' + browser + '/', import.meta.url);
    const manifest = JSON.parse(await readFile(new URL('manifest.json', base), 'utf8'));
    assert.equal(manifest.version, '0.4.2'); assert.equal(manifest.background.type, 'module');
    assert.equal(manifest.host_permissions, undefined);
    assert.deepEqual(manifest.optional_host_permissions, ['https://openrouter.ai/*', 'https://api.openai.com/*']);
    assert.deepEqual(manifest.permissions.sort(), ['activeTab', 'alarms', 'storage']);
    const references = [manifest.background.service_worker, manifest.action.default_popup, manifest.options_page,
      ...manifest.content_scripts.flatMap(script => script.js), ...Object.values(manifest.icons), ...Object.values(manifest.action.default_icon)];
    for (const file of references) await access(new URL(file, base));
    const files = JSON.parse(await readFile(new URL('../dist/' + browser + '-files.json', import.meta.url), 'utf8'));
    assert.ok(files.every(path => !/\.(zip|exe|ps1|bat|cmd)$|server\/|data\/|\.env/.test(path)));
  }
});
