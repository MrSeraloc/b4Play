import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createApp } from './app.mjs';
import { createSummarizer } from './summarizer.mjs';
import { createConfigStore } from './config.mjs';
const projectDir = fileURLToPath(new URL('../', import.meta.url));
const dataDir = resolve(projectDir, 'data');
await mkdir(dataDir, { recursive: true });
const tokenPath = resolve(dataDir, 'service-token.txt');
let token;
try { token = (await readFile(tokenPath, 'utf8')).trim(); } catch (error) {
  if (error.code !== 'ENOENT') throw error;
  token = randomBytes(32).toString('hex');
  await writeFile(tokenPath, token + '\n', { mode: 0o600, flag: 'wx' });
}
if (token.length < 32) throw new Error('Token local inválido em data/service-token.txt.');
const configStore = await createConfigStore({ dataDir });
const config = configStore.current();
const server = createApp({ token, configStore, dataDir, projectDir, summarize: (input, jobConfig) => createSummarizer(jobConfig)(input) });
server.listen(8765, '127.0.0.1', () => {
  console.log('b4Play local service: http://127.0.0.1:8765/health');
  console.log('Demo / demonstração: http://127.0.0.1:8765/demo');
  console.log(`Provider: ${config.label}; model: ${config.model || '(configure in settings)'}; effort: ${config.effort || '(default)'}`);
  console.log(`Local token / token local: ${tokenPath}`);
  if (!config.apiKey || !config.model) console.log('Configure your AI provider in extension settings / Configure a IA nas opções da extensão.');
});
server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? 'Porta 8765 ocupada. Feche a outra instância do serviço.' : error.message); process.exitCode = 1; });
