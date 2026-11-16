// Development preview only. No user keys, provider requests or live browser extension state.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
const base = new URL('../', import.meta.url);
const paths = {
  '/demo': ['demo/index.html','text/html'], '/demo/mock.js': ['demo/mock.js','text/javascript'],
  '/demo/options-mock.js': ['demo/options-mock.js','text/javascript'],
  '/options.css': ['extension/options.css','text/css'], '/options.js': ['extension/options.js','text/javascript'],
  '/translations.js': ['extension/translations.js','text/javascript'], '/i18n.js': ['extension/i18n.js','text/javascript'], '/core.js': ['extension/core.js','text/javascript'],
  '/extension/content.js': ['extension/content.js','text/javascript'], '/extension/popup-style.js': ['extension/popup-style.js','text/javascript'],
  '/extension/translations.js': ['extension/translations.js','text/javascript'], '/extension/i18n.js': ['extension/i18n.js','text/javascript'], '/shared/core.js': ['shared/core.js','text/javascript']
};
http.createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname;
    if (path === '/options') {
      let html = await readFile(new URL('extension/options.html', base), 'utf8');
      html = html.replace('<body>', '<body><p style="margin:12px 24px;color:#9be5cf">DEMO · Example data · No provider requests / Sem chamadas de IA</p>').replace('<script src="translations.js">', '<script src="/demo/options-mock.js"></script><script src="translations.js">');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(html); return;
    }
    if (!paths[path]) { res.writeHead(404); res.end(); return; }
    const [file, type] = paths[path]; res.writeHead(200, { 'Content-Type': type + '; charset=utf-8' }); res.end(await readFile(new URL(file, base)));
  } catch { res.writeHead(500); res.end('Preview error'); }
}).listen(8766, '127.0.0.1', () => console.log('b4Play mock preview: http://127.0.0.1:8766/options and /demo'));
