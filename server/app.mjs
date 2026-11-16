import http from 'node:http';
import { randomUUID, timingSafeEqual, createHash } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { AppError } from './summarizer.mjs';
import { diagnoseProvider } from './diagnose.mjs';
import { resolveLocale, translate } from '../shared/translations.mjs';
import '../shared/core.js';
const { videoId, wordCount, isExtensionOrigin } = globalThis.YTHoverCore;
const TTL = 30 * 60 * 1000;

export function createApp({ token, summarize, config, configStore, dataDir, projectDir, diagnose = diagnoseProvider }) {
  const jobs = new Map();
  const dedup = new Map();
  let starts = [];
  let active = 0;
  const send = (res, status, data) => {
    if (typeof data?.error === 'string') data = { ...data, error: translate(data.error, res.b4Locale || 'pt_BR') };
    if (typeof data?.message === 'string') data = { ...data, message: translate(data.message, res.b4Locale || 'pt_BR') };
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(data));
  };
  const currentConfig = () => configStore ? configStore.current() : config;
  const publicStatus = () => {
    const current = currentConfig();
    return { ok: true, configured: Boolean(current.apiKey && current.model), provider: current.provider || 'openai', label: current.label || 'OpenAI', model: current.model, effort: current.effort };
  };
  const publicJob = job => ({ id: job.id, videoId: job.videoId, state: job.state, summary: job.summary, words: job.summary ? wordCount(job.summary) : undefined, error: job.error, model: job.model, provider: job.provider, language: job.language });
  async function json(req) {
    if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) throw new AppError('Envie application/json.', 415);
    let size = 0;
    const buffers = [];
    for await (const buffer of req) {
      size += buffer.length;
      if (size > 600000) throw new AppError('Arquivo grande demais.', 413);
      buffers.push(buffer);
    }
    try { return JSON.parse(Buffer.concat(buffers).toString('utf8')); } catch { throw new AppError('JSON inválido.'); }
  }
  async function run(job, title, transcript, jobConfig) {
    active++;
    try {
      await mkdir(resolve(dataDir, 'transcripts'), { recursive: true });
      await writeFile(resolve(dataDir, 'transcripts', `${job.videoId}.txt`), transcript, 'utf8');
      job.summary = await summarize({ title, transcript }, jobConfig);
      job.state = 'ready';
    } catch (error) {
      job.state = 'error';
      job.error = error instanceof AppError ? error.message : 'Falha ao salvar a transcrição ou gerar o resumo.';
      dedup.delete(job.fingerprint);
    } finally { active--; }
  }
  const staticFiles = {
    '/demo': ['demo/index.html', 'text/html'],
    '/demo/mock.js': ['demo/mock.js', 'text/javascript'],
    '/extension/content.js': ['extension/content.js', 'text/javascript'],
    '/extension/translations.js': ['extension/translations.js', 'text/javascript'],
    '/extension/i18n.js': ['extension/i18n.js', 'text/javascript'],
    '/extension/popup-style.js': ['extension/popup-style.js', 'text/javascript'],
    '/extension/popup.css': ['extension/popup.css', 'text/css'],
    '/shared/core.js': ['shared/core.js', 'text/javascript']
  };
  return http.createServer(async (req, res) => {
    res.b4Locale = resolveLocale(req.headers['accept-language'] || 'pt-BR');
    try {
      const address = req.socket.localPort;
      if (![ `127.0.0.1:${address}`, `localhost:${address}` ].includes(req.headers.host)) throw new AppError('Host não permitido.', 403);
      const origin = req.headers.origin;
      if (origin && !isExtensionOrigin(origin)) throw new AppError('Origem não permitida.', 403);
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      }
      if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
      const path = new URL(req.url, 'http://127.0.0.1').pathname;
      if (req.method === 'GET' && path === '/health') return send(res, 200, publicStatus());
      if (req.method === 'GET' && staticFiles[path] && projectDir) {
        const [file, type] = staticFiles[path];
        const body = await readFile(resolve(projectDir, file));
        res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-store' }); res.end(body); return;
      }
      const given = Buffer.from(req.headers.authorization?.replace(/^Bearer /, '') || '');
      const expected = Buffer.from(token);
      if (given.length !== expected.length || !timingSafeEqual(given, expected)) throw new AppError('Token local inválido. Confira data/service-token.txt nas opções da extensão.', 401);
      if (req.method === 'GET' && path === '/api/status') return send(res, 200, publicStatus());
      if (path === '/api/config' && ['GET', 'POST'].includes(req.method)) {
        if (!configStore) throw new AppError('Atualize e reinicie o serviço local para configurar a IA.', 503);
        return send(res, 200, req.method === 'GET' ? configStore.publicView() : await configStore.save(await json(req)));
      }
      if (path === '/api/diagnose' && req.method === 'POST') {
        if (!configStore) throw new AppError('Atualize e reinicie o serviço local para verificar a IA.', 503);
        return send(res, 200, await diagnose(configStore.preview(await json(req))));
      }
      for (const [id, job] of jobs) if (Date.now() - job.createdAt > TTL && job.state !== 'summarizing') { jobs.delete(id); if (dedup.get(job.fingerprint) === id) dedup.delete(job.fingerprint); }
      if (req.method === 'POST' && path === '/api/jobs') {
        const jobConfig = { ...currentConfig() };
        if (!jobConfig.apiKey || !jobConfig.model) throw new AppError('Configure a chave de API e o modelo do provedor nas opções da extensão ou no .env.', 503);
        const body = await json(req);
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw new AppError('Envie um objeto JSON.');
        jobConfig.language = resolveLocale(body.language || res.b4Locale);
        const id = videoId(body.url);
        if (!id) throw new AppError('Use um link HTTPS válido de um vídeo comum do YouTube.');
        if (typeof body.transcript !== 'string' || body.transcript.trim().length < 30 || body.transcript.length > 120000) throw new AppError('A transcrição deve ter entre 30 e 120 mil caracteres.');
        const title = typeof body.title === 'string' ? body.title.slice(0, 500) : '';
        const fingerprint = createHash('sha256').update(JSON.stringify([id, title, body.transcript, jobConfig.provider || 'openai', jobConfig.baseUrl, jobConfig.model, jobConfig.effort, jobConfig.language])).digest('hex');
        if (dedup.has(fingerprint)) return send(res, 200, publicJob(jobs.get(dedup.get(fingerprint))));
        starts = starts.filter(time => Date.now() - time < 60000);
        if (starts.length >= 10 || active >= 2) throw new AppError('Há outros resumos em andamento. Aguarde um momento.', 429);
        starts.push(Date.now());
        const job = { id: randomUUID(), videoId: id, state: 'summarizing', createdAt: Date.now(), fingerprint, model: jobConfig.model, provider: jobConfig.provider || 'openai', language: jobConfig.language };
        jobs.set(job.id, job); dedup.set(fingerprint, job.id);
        void run(job, title, body.transcript, jobConfig);
        return send(res, 202, publicJob(job));
      }
      if (req.method === 'GET' && /^\/api\/jobs\/[\da-f-]{36}$/.test(path)) {
        const job = jobs.get(path.split('/').at(-1));
        if (!job) throw new AppError('Resumo expirado ou serviço reiniciado. Tente novamente.', 404);
        return send(res, 200, publicJob(job));
      }
      throw new AppError('Rota não encontrada.', 404);
    } catch (error) { if (!res.headersSent) send(res, error instanceof AppError ? error.status : 500, { error: error instanceof AppError ? error.message : 'Erro interno no serviço local.' }); else res.end(); }
  });
}
