import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { AppError } from './summarizer.mjs';

const providers = ['openai', 'openrouter'];
const efforts = ['', 'none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'];
const labels = { openai: 'OpenAI', openrouter: 'OpenRouter' };
function providerName(value) {
  if (!providers.includes(value)) throw new AppError('Selecione OpenAI ou OpenRouter.');
  return value;
}
function modelName(value, allowEmpty = false) {
  if (typeof value !== 'string') throw new AppError('Informe o ID do modelo.');
  const model = value.trim();
  if ((!model && !allowEmpty) || model.length > 200 || /\s|[\x00-\x1f]/u.test(model)) throw new AppError('Informe um ID de modelo válido, sem espaços, com até 200 caracteres.');
  return model;
}
function effortName(value) {
  if (!efforts.includes(value)) throw new AppError('Esforço de raciocínio inválido.');
  return value;
}
function keyValue(value) {
  if (typeof value !== 'string' || value.length > 2048 || /[\x00-\x1f\x7f]/u.test(value)) throw new AppError('Chave de API inválida. Cole somente o token.');
  const key = value.trim().replace(/^Bearer\s+/i, '');
  if (/\s/u.test(key)) throw new AppError('A chave de API contém espaços. Cole somente o token completo.');
  return key;
}
function checkKeyProvider(provider, key) {
  if (provider === 'openai' && key.startsWith('sk-or-')) throw new AppError('Essa chave é do OpenRouter. Selecione OpenRouter como provedor.');
  if (provider === 'openrouter' && /^sk-/.test(key) && !/^sk-or-/.test(key)) throw new AppError('Essa chave parece ser de outro provedor. Use uma chave criada na sua conta OpenRouter.');
  if (/^[a-f0-9]{64}$/i.test(key)) throw new AppError('Esse valor parece ser o token do serviço local. Cole a chave da conta de IA no campo de API.');
}

export async function createConfigStore({ dataDir, env = process.env }) {
  const file = resolve(dataDir, 'ai-config.json');
  let saved = { profiles: {} };
  try { saved = JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw new Error('Não foi possível ler data/ai-config.json. Verifique o arquivo de configuração.'); }
  if (!saved || typeof saved !== 'object' || !saved.profiles || typeof saved.profiles !== 'object') throw new Error('Formato inválido em data/ai-config.json.');
  const defaults = {
    openai: { apiKey: env.OPENAI_API_KEY || '', model: env.OPENAI_MODEL || 'gpt-5.6-luna', effort: env.OPENAI_REASONING_EFFORT ?? 'low', baseUrl: env.OPENAI_BASE_URL || 'https://api.openai.com/v1' },
    openrouter: { apiKey: env.OPENROUTER_API_KEY || '', model: env.OPENROUTER_MODEL || '', effort: env.OPENROUTER_REASONING_EFFORT ?? '', baseUrl: 'https://openrouter.ai/api/v1' }
  };
  const base = new URL(defaults.openai.baseUrl);
  if (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(base.hostname))) throw new Error('OPENAI_BASE_URL deve usar HTTPS, exceto em localhost.');
  function profile(provider) {
    const value = { ...defaults[provider] };
    const override = saved.profiles[provider] || {};
    for (const field of ['model', 'effort', 'apiKey']) if (Object.hasOwn(override, field)) value[field] = override[field];
    return { ...value, model: modelName(value.model, true), effort: effortName(value.effort), apiKey: keyValue(value.apiKey) };
  }
  function current() {
    const provider = providerName(saved.provider || env.AI_PROVIDER || 'openai');
    return { provider, label: labels[provider], ...profile(provider) };
  }
  function publicView() {
    const active = current();
    return {
      provider: active.provider, label: active.label, model: active.model, effort: active.effort,
      configured: Boolean(active.apiKey && active.model),
      profiles: Object.fromEntries(providers.map(provider => {
        const value = profile(provider);
        return [provider, { label: labels[provider], model: value.model, effort: value.effort, keyConfigured: Boolean(value.apiKey) }];
      }))
    };
  }
  // Valida configurações existentes antes de iniciar o servidor.
  publicView();
  let pending = Promise.resolve();
  function preview(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new AppError('Envie um objeto de configuração.');
    const provider = providerName(payload.provider);
    const previous = profile(provider);
    const apiKey = keyValue(payload.apiKey ?? '') || previous.apiKey;
    checkKeyProvider(provider, apiKey);
    return { provider, label: labels[provider], ...previous, apiKey, model: modelName(payload.model), effort: effortName(payload.effort ?? '') };
  }
  async function saveNow(payload) {
    const selected = preview(payload);
    const provider = selected.provider;
    const override = { ...saved.profiles[provider], model: selected.model, effort: selected.effort };
    const suppliedKey = keyValue(payload.apiKey ?? '');
    // Campo vazio mantém a chave deste provedor, sem copiar a chave do outro.
    if (suppliedKey) override.apiKey = suppliedKey;
    const next = { provider, profiles: { ...saved.profiles, [provider]: override } };
    await mkdir(dataDir, { recursive: true });
    const temporary = resolve(dataDir, `ai-config-${randomUUID()}.tmp`);
    await writeFile(temporary, JSON.stringify(next, null, 2) + '\n', { mode: 0o600 });
    await rename(temporary, file);
    saved = next;
    return publicView();
  }
  return {
    current, publicView, preview,
    save(payload) { const result = pending.then(() => saveNow(payload)); pending = result.catch(() => {}); return result; }
  };
}
