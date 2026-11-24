import {readFile, writeFile, mkdir, copyFile} from 'node:fs/promises';
const root = new URL('../', import.meta.url);
export const files = ['manifest.json', 'worker.js', 'core.js', 'service.js', 'strings.js', 'youtube.js', 'transcript.js', 'settings.html', 'settings.js', 'panel.html', 'panel.js', 'ui.css', 'HELP.html', 'LICENSE', '_locales/en/messages.json', '_locales/pt_BR/messages.json'];
const manifest = JSON.parse(await readFile(new URL('extension/manifest.json', root), 'utf8'));
export const version = manifest.version;
function workerOrigin(value) {
  if (!value) return '';
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.pathname !== '/' ||
      url.search || url.hash || url.hostname.includes('*')) {
    throw new Error('B4PLAY_WORKER_URL must be a single HTTPS origin without credentials, port or path.');
  }
  return url.origin;
}
export const serviceOrigin = workerOrigin(process.env.B4PLAY_WORKER_URL);
const catalogs = {
  en: {description: {message: 'YouTube summaries in your browser language, using AI.'}},
  pt_BR: {description: {message: 'Resumos do YouTube no idioma do navegador com o AI.'}}
};
for (const [locale, data] of Object.entries(catalogs)) {
  await mkdir(new URL('extension/_locales/' + locale + '/', root), {recursive: true});
  await writeFile(new URL('extension/_locales/' + locale + '/messages.json', root), JSON.stringify(data, null, 2) + '\n');
}
await copyFile(new URL('LICENSE', root), new URL('extension/LICENSE', root));
for (const browser of ['opera', 'chrome']) {
  const dir = new URL('dist/' + browser + '/', root);
  await mkdir(dir, {recursive: true});
  const sizes = browser === 'opera' ? [16, 19, 32, 38, 48, 128] : [16, 32, 48, 128];
  for (const name of [...files, ...sizes.map(size => 'icons/icon-' + size + '.png')]) {
    const target = new URL(name, dir); await mkdir(new URL('./', target), {recursive: true});
    await copyFile(new URL('extension/' + name, root), target);
  }
  const value = structuredClone(manifest);
  if (serviceOrigin) value.optional_host_permissions = [serviceOrigin + '/*'];
  value.icons = {'16': 'icons/icon-16.png', '48': 'icons/icon-48.png', '128': 'icons/icon-128.png'};
  value.action.default_icon = browser === 'opera' ? {'19': 'icons/icon-19.png', '38': 'icons/icon-38.png'} : {'16': 'icons/icon-16.png', '32': 'icons/icon-32.png'};
  if (browser === 'chrome') value.minimum_chrome_version = '112';
  await writeFile(new URL('manifest.json', dir), JSON.stringify(value, null, 2) + '\n');
  await writeFile(new URL('dist/' + browser + '-files.json', root), JSON.stringify([...files, ...sizes.map(size => 'icons/icon-' + size + '.png')]));
}
console.log('b4Play ' + version + ' built for Opera and Chrome.');
