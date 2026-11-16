import './build.mjs';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { zip } from './zip.mjs';
const base = new URL('../', import.meta.url);
const pkg = JSON.parse(await readFile(new URL('package.json', base), 'utf8'));
async function collect(directory, prefix = '') {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error('Symlinks are not allowed in release packages.');
    const name = prefix + entry.name;
    if (entry.name.startsWith('.env') && entry.name !== '.env.example') throw new Error('Private environment file in release: ' + name);
    if (/(^|\/)(data|node_modules|\.git|work|\.env)(\/|$)/.test(name)) throw new Error('Private or development runtime path in release: ' + name);
    const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    if (entry.isDirectory()) result.push(...await collect(path, name + '/'));
    else result.push({ name, data: await readFile(path) });
  }
  return result;
}
await mkdir(new URL('downloads/', base), { recursive: true });
const sums = [];
for (const target of ['opera', 'chrome', 'service']) {
  let entries;
  if (target !== 'service') entries = await collect(new URL('dist/' + target + '/', base));
  else {
    entries = [];
    for (const directory of ['server','shared','extension','scripts','tests','docs','demo']) entries.push(...await collect(new URL(directory + '/', base), directory + '/'));
    for (const file of ['README.md','README.pt-BR.md','LICENSE','EULA.txt','package.json','.env.example','.gitignore','.gitattributes','iniciar.ps1']) entries.push({ name: file, data: await readFile(new URL(file, base)) });
  }
  const name = 'b4play-' + target + '-' + pkg.version + '.zip'; const content = zip(entries);
  await writeFile(new URL('downloads/' + name, base), content);
  sums.push(createHash('sha256').update(content).digest('hex') + '  ' + name);
  console.log(name + ': ' + entries.length + ' files, ' + content.length + ' bytes');
}
await writeFile(new URL('downloads/SHA256SUMS.txt', base), sums.join('\n') + '\n');
