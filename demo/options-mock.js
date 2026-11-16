let settings = { token: 'demo-local-token', enabled: false, consent: false, language: 'en', delay: 850 };
let ai = { provider: 'openrouter', label: 'OpenRouter', model: 'provider/example-model', effort: '', configured: false, profiles: { openai: { model: 'gpt-5.6-luna', effort: 'low', keyConfigured: false }, openrouter: { model: 'provider/example-model', effort: '', keyConfigured: false } } };
globalThis.chrome = { storage: { local: { async get() { return { settings }; } } }, runtime: { async sendMessage(message) {
  if (message.type === 'GET_AI_CONFIG') return ai;
  if (message.type === 'SAVE_SETTINGS') { settings = message; return { ok: true }; }
  if (message.type === 'HEALTH') return { ok: true, configured: false, provider: 'openrouter' };
  if (message.type === 'SAVE_AI_CONFIG') { ai = { ...ai, model: message.model, provider: message.provider }; return ai; }
  if (message.type === 'TEST_AI_CONFIG') return { ok: true, modelListed: true, message: 'Demo only: no credentials were sent.' };
  return { ok: true };
} } };
