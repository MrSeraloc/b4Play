import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import { ui, phrases } from '../shared/translations.mjs';
import { makeIcons } from './icons.mjs';
const base = new URL('../', import.meta.url);
export const runtimeFiles = ['background.js','content.js','core.js','popup-style.js','translations.js','i18n.js','tactiq.js','options.html','options.css','options.js','action.html','action.css','action.js'];
await copyFile(new URL('shared/core.js', base), new URL('extension/core.js', base));
const css = await readFile(new URL('extension/popup.css', base), 'utf8');
await writeFile(new URL('extension/popup-style.js', base), '// Generated from popup.css.\nglobalThis.YTHoverCSS = ' + JSON.stringify(css) + ';\n');
await writeFile(new URL('extension/translations.js', base), '// Generated from shared/translations.mjs.\nglobalThis.B4Translations = ' + JSON.stringify({ ui, phrases }, null, 2) + ';\n');
await makeIcons(new URL('extension/icons/', base));
const locales = {};
for (const locale of ['en', 'pt_BR']) {
  const index = locale === 'pt_BR' ? 0 : 1;
  const messages = Object.fromEntries(Object.entries(ui).map(([key, value]) => [key, { message: value[index] }]));
  phrases.forEach((pair, i) => { messages['notice_' + i] = { message: pair[index] }; });
  locales[locale] = JSON.stringify(messages, null, 2) + '\n';
  await mkdir(new URL('extension/_locales/' + locale + '/', base), { recursive: true });
  await writeFile(new URL('extension/_locales/' + locale + '/messages.json', base), locales[locale]);
}
const manifest = JSON.parse(await readFile(new URL('extension/manifest.json', base), 'utf8'));
for (const target of ['opera', 'chrome']) {
  const destination = new URL('dist/' + target + '/', base); await mkdir(destination, { recursive: true });
  const selected = structuredClone(manifest);
  if (target === 'chrome') selected.minimum_chrome_version = '112';
  else selected.action.default_icon = { '19': 'icons/icon-19.png', '38': 'icons/icon-38.png' };
  await writeFile(new URL('manifest.json', destination), JSON.stringify(selected, null, 2) + '\n');
  for (const file of runtimeFiles) await copyFile(new URL('extension/' + file, base), new URL(file, destination));
  const sizes = target === 'opera' ? [16,19,32,38,48,128] : [16,32,48,128];
  await mkdir(new URL('icons/', destination), { recursive: true });
  for (const size of sizes) await copyFile(new URL('extension/icons/icon-' + size + '.png', base), new URL('icons/icon-' + size + '.png', destination));
  for (const locale of ['en', 'pt_BR']) { await mkdir(new URL('_locales/' + locale + '/', destination), { recursive: true }); await writeFile(new URL('_locales/' + locale + '/messages.json', destination), locales[locale]); }
  await copyFile(new URL('LICENSE', base), new URL('LICENSE', destination));
  await copyFile(new URL('EULA.txt', base), new URL('EULA.txt', destination));
}
console.log('Built b4Play for Opera and Chrome in dist/.');
