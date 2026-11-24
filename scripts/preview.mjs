// UI preview only; no API requests, real secrets or browser extension permissions.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
const base = new URL('../extension/', import.meta.url);
const allowed = ['settings.html', 'settings.js', 'panel.html', 'panel.js', 'strings.js', 'core.js', 'service.js', 'ui.css', 'HELP.html'];
const fixtures = {'/hover-tests': '../tests/hover-browser.html', '/tests/hover-browser.js': '../tests/hover-browser.js', '/extension/youtube.js': 'youtube.js'};
const mock = `const panelDemo=new URLSearchParams(location.search).get('demo')==='ready'; let config={serviceConfigured:true,locale:'pt-BR',consent:panelDemo};
globalThis.chrome={i18n:{getUILanguage:()=> 'en'},permissions:{request:async()=>true},tabs:{query:async()=>[{url:'https://www.youtube.com/watch?v=abcdefghijk',title:'Example video / Vídeo de exemplo'}]},runtime:{getManifest:()=>({optional_host_permissions:['https://b4play.test/*']}),openOptionsPage:async()=>{location.href='/settings.html'},sendMessage:async m=>{if(m.type==='SETTINGS')return config;if(m.type==='SAVE'){config={...config,summaryLength:m.summaryLength};return {ok:true}}if(m.type==='AUTHORIZE_SUMMARIES'){config.consent=true;return {ok:true}}if(m.type==='FORGET'){config={serviceConfigured:true,locale:'pt-BR',consent:false};return {ok:true}}if(m.type==='START'||m.type==='STATUS')return {id:'demo',state:'ready',summary:'Demonstração com dados fictícios. Nenhum pedido de IA foi enviado.'};return {ok:true}}}};`;
const compactMock = `globalThis.chrome = {
  runtime: {getManifest: () => ({optional_host_permissions: ['https://b4play.test/*']}), sendMessage: message => window.parent.b4playFixtureRequest(message)},
  i18n: {getUILanguage: () => 'es-ES'},
  permissions: {contains: async () => true}
};`;
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const path = url.pathname;
  if (Object.hasOwn(fixtures, path)) {
    try { const body = await readFile(new URL(fixtures[path], base)); res.writeHead(200, {'Content-Type': path.endsWith('.js') ? 'text/javascript' : 'text/html'}); res.end(body); }
    catch { res.writeHead(500); res.end('Fixture error'); } return;
  }
  const name = path.slice(1) || 'settings.html';
  if (name === 'mock.js') { res.writeHead(200, {'Content-Type': 'text/javascript'}); res.end(url.searchParams.has('compact') ? compactMock : mock); return; }
  if (!allowed.includes(name)) { res.writeHead(404); res.end(); return; }
  try {
    let body = await readFile(new URL(name, base), 'utf8');
    if (name.endsWith('.html')) {
      const mockSource = url.searchParams.has('compact') ? 'mock.js?compact=1' : 'mock.js';
      body = body.replace(/<body([^>]*)>/, '<body$1><script src="' + mockSource + '"></script><p class="hint">DEMO · No AI requests / Sem chamadas de IA</p>');
    }
    res.writeHead(200, {'Content-Type': name.endsWith('.js') ? 'text/javascript' : name.endsWith('.css') ? 'text/css' : 'text/html'}); res.end(body);
  } catch { res.writeHead(500); res.end('Preview error'); }
}).listen(8770, '127.0.0.1', () => console.log('Preview: http://127.0.0.1:8770/settings.html'));
