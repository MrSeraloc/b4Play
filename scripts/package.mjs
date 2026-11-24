import {serviceOrigin, version} from './build.mjs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
if (!serviceOrigin) throw new Error('Set B4PLAY_WORKER_URL to your deployed Cloudflare Worker before packaging.');
// Development only: Windows' standard ZIP library, explicit file list, no downloads or installers.
execFileSync('powershell.exe', ['-NoProfile', '-File', fileURLToPath(new URL('package.ps1', import.meta.url)), version], {stdio: 'inherit'});
const checksums = [];
for (const browser of ['opera', 'chrome']) {
  const name = 'b4play-' + browser + '-' + version + '.zip';
  const data = await readFile(new URL('../downloads/' + name, import.meta.url));
  checksums.push(createHash('sha256').update(data).digest('hex') + '  ' + name);
}
await writeFile(new URL('../downloads/SHA256SUMS.txt', import.meta.url), checksums.join('\n') + '\n');
