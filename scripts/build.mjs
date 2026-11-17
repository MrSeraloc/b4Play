import {readFile, writeFile, mkdir, copyFile} from 'node:fs/promises';
const root = new URL('../', import.meta.url);
export const files = ['manifest.json', 'worker.js', 'core.js', 'strings.js', 'youtube.js', 'transcript.js', 'settings.html', 'settings.js', 'panel.html', 'panel.js', 'ui.css', 'HELP.html', 'LICENSE', '_locales/en/messages.json', '_locales/pt_BR/messages.json'];
const manifest = JSON.parse(await readFile(new URL('extension/manifest.json', root), 'utf8'));
const catalogs = {
  en: {description: {message: 'YouTube transcript summaries, up to 200 words. Your own AI key. No local service required.'}},
  pt_BR: {description: {message: 'Resumos de transcrições do YouTube em até 200 palavras. Sua chave de IA. Sem serviço local.'}}
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
  value.icons = {'16': 'icons/icon-16.png', '48': 'icons/icon-48.png', '128': 'icons/icon-128.png'};
  value.action.default_icon = browser === 'opera' ? {'19': 'icons/icon-19.png', '38': 'icons/icon-38.png'} : {'16': 'icons/icon-16.png', '32': 'icons/icon-32.png'};
  if (browser === 'chrome') value.minimum_chrome_version = '112';
  await writeFile(new URL('manifest.json', dir), JSON.stringify(value, null, 2) + '\n');
  await writeFile(new URL('dist/' + browser + '-files.json', root), JSON.stringify([...files, ...sizes.map(size => 'icons/icon-' + size + '.png')]));
}
console.log('b4Play 0.4.2 built for Opera and Chrome.');
