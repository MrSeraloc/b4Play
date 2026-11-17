// UI preview only; no API requests, real secrets or browser extension permissions.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
const base = new URL('../extension/', import.meta.url);
const allowed = ['settings.html', 'settings.js', 'panel.html', 'panel.js', 'strings.js', 'core.js', 'ui.css', 'HELP.html'];
const mock = `let config={provider:'openrouter',model:'',language:'auto',locale:'en',keySet:false,consent:false};
globalThis.chrome={i18n:{getUILanguage:()=> 'en'},permissions:{request:async()=>true},tabs:{query:async()=>[{url:'https://www.youtube.com/watch?v=abcdefghijk',title:'Example video / Vídeo de exemplo'}]},runtime:{openOptionsPage:async()=>{location.href='/settings.html'},sendMessage:async m=>{if(m.type==='SETTINGS')return config;if(m.type==='SAVE'){config={...m,key:undefined,keySet:true};return {ok:true}}if(m.type==='FORGET'){config={provider:'openrouter',model:'',language:'auto',locale:'en'};return {ok:true}}if(m.type==='START'||m.type==='STATUS')return {id:'demo',state:'ready',summary:'Demonstração com dados fictícios. Nenhum pedido de IA foi enviado.'};return {ok:true}}}};`;
http.createServer(async (req, res) => {
  const name = new URL(req.url, 'http://127.0.0.1').pathname.slice(1) || 'settings.html';
  if (name === 'mock.js') { res.writeHead(200, {'Content-Type': 'text/javascript'}); res.end(mock); return; }
  if (!allowed.includes(name)) { res.writeHead(404); res.end(); return; }
  try {
    let body = await readFile(new URL(name, base), 'utf8');
    if (name.endsWith('.html')) body = body.replace('<body', '<body').replace('<main>', '<script src="mock.js"></script><main><p style="color:#76501f">DEMO · No AI requests / Sem chamadas de IA</p>');
    res.writeHead(200, {'Content-Type': name.endsWith('.js') ? 'text/javascript' : name.endsWith('.css') ? 'text/css' : 'text/html'}); res.end(body);
  } catch { res.writeHead(500); res.end('Preview error'); }
}).listen(8770, '127.0.0.1', () => console.log('Preview: http://127.0.0.1:8770/settings.html'));
