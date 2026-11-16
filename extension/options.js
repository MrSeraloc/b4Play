const $ = id => document.getElementById(id);
const send = message => chrome.runtime.sendMessage(message);
const t = (key, values) => B4I18N.t(key, values);
const tr = text => B4I18N.translate(text);
const config = { enabled: false, consent: false, language: 'auto', delay: 850, token: '', ...(await chrome.storage.local.get('settings')).settings };
let aiConfig;
$('token').value = config.token; $('enabled').checked = config.enabled; $('consent').checked = config.consent; $('delay').value = config.delay; $('language').value = config.language;
const params = new URLSearchParams(location.search);
if (/^[\w-]{11}$/.test(params.get('video') || '')) $('url').value = 'https://www.youtube.com/watch?v=' + params.get('video');
$('title').value = (params.get('title') || '').slice(0, 500);
function status(id, text, error = false) { $(id).textContent = tr(text); $(id).className = 'status ' + (error ? 'error' : 'success'); }
function showProfile(provider, clearKey = true) {
  const profile = aiConfig?.profiles?.[provider] || { model: provider === 'openai' ? 'gpt-5.6-luna' : '', effort: provider === 'openai' ? 'low' : '' };
  $('provider').value = provider; $('model').value = profile.model; $('effort').value = profile.effort;
  if (clearKey) $('api-key').value = '';
  $('api-key').placeholder = provider === 'openrouter' ? 'sk-or-v1-…' : 'sk-…';
  $('model').placeholder = provider === 'openrouter' ? 'provider/model' : 'model-id';
  $('model-hint').textContent = t(provider === 'openrouter' ? 'modelRouterHint' : 'modelOpenAIHint');
  $('key-hint').textContent = (profile.keyConfigured ? t('keyExisting') + ' ' : '') + t(provider === 'openrouter' ? 'keyRouterHint' : 'keyOpenAIHint');
  $('catalog').hidden = provider !== 'openrouter';
}
function applyLanguage() {
  B4I18N.set($('language').value); B4I18N.apply(); document.title = t('optionsTitle'); showProfile($('provider').value || 'openai', false);
  document.querySelector('[data-i18n="privacyLink"]').href = 'https://github.com/MrSeraloc/b4Play/blob/main/docs/' + (B4I18N.locale() === 'pt_BR' ? 'PRIVACY.pt-BR.md' : 'PRIVACY.md');
}
applyLanguage();
$('language').addEventListener('change', () => { applyLanguage(); for (const id of ['status', 'ai-status', 'import-status']) $(id).textContent = ''; });
$('provider').addEventListener('change', () => { showProfile($('provider').value); $('ai-status').textContent = ''; });
async function loadAIConfig() {
  const result = await send({ type: 'GET_AI_CONFIG' }); if (result.error) throw new Error(result.error);
  aiConfig = result; showProfile(result.provider);
  status('ai-status', result.configured ? t('aiConfigured', { provider: result.label, model: result.model }) : t('aiNeedsKey'));
}
if (config.token) loadAIConfig().catch(error => status('ai-status', error.message, true));
$('settings').addEventListener('submit', async event => {
  event.preventDefault(); status('status', t('connecting'));
  try {
    if ($('enabled').checked && !$('consent').checked) throw new Error(t('consentRequired'));
    const saved = await send({ type: 'SAVE_SETTINGS', token: $('token').value.trim(), enabled: $('enabled').checked, consent: $('consent').checked, language: $('language').value, delay: Number($('delay').value) });
    if (saved.error) throw new Error(saved.error);
    const health = await send({ type: 'HEALTH' }); if (health.error) throw new Error(health.error);
    status('status', t('connected')); await loadAIConfig();
  } catch (error) { status('status', error.message, true); }
});
const draft = type => ({ type, provider: $('provider').value, apiKey: $('api-key').value.trim(), model: $('model').value.trim(), effort: $('effort').value });
$('ai-form').addEventListener('submit', async event => {
  event.preventDefault(); $('save-ai').disabled = true; status('ai-status', t('savingAI'));
  try {
    const result = await send(draft('SAVE_AI_CONFIG')); if (result.error) throw new Error(result.error);
    aiConfig = result; showProfile(result.provider);
    status('ai-status', result.configured ? t('aiSaved', { provider: result.label, model: result.model }) : t('aiNoKey'), !result.configured);
  } catch (error) { status('ai-status', error.message, true); } finally { $('save-ai').disabled = false; }
});
$('test-ai').addEventListener('click', async () => {
  $('test-ai').disabled = true; $('save-ai').disabled = true; status('ai-status', t('checkingAI'));
  try { const result = await send(draft('TEST_AI_CONFIG')); if (result.error) throw new Error(result.error); status('ai-status', result.message, result.modelListed === false); }
  catch (error) { status('ai-status', error.message, true); } finally { $('test-ai').disabled = false; $('save-ai').disabled = false; }
});
$('clear').addEventListener('click', async () => { await send({ type: 'CLEAR_CACHE' }); status('status', t('cacheCleared')); });
$('import-form').addEventListener('submit', async event => {
  event.preventDefault(); $('import-button').disabled = true; $('result').textContent = '';
  try {
    const url = $('url').value.trim();
    if (!YTHoverCore.videoId(url)) throw new Error(tr('Use um link HTTPS válido de um vídeo comum do YouTube.'));
    const file = $('file').files[0]; if (!file || file.size > 500000) throw new Error(tr('Arquivo grande demais.'));
    const transcript = await file.text(); if (transcript.length > 120000) throw new Error(tr('A transcrição excede 120 mil caracteres. Divida o vídeo ou importe um trecho.'));
    status('import-status', t('importSending'));
    let result = await send({ type: 'IMPORT_TRANSCRIPT', url, title: $('title').value, transcript });
    for (let attempt = 0; attempt < 200; attempt++) {
      if (result.error) throw new Error(result.error);
      if (result.state === 'ready') { $('result').textContent = result.summary; status('import-status', t('importDone', { count: YTHoverCore.wordCount(result.summary) })); return; }
      status('import-status', t('importWaiting')); await new Promise(resolve => setTimeout(resolve, 1500)); result = await send({ type: 'GET_SUMMARY', url });
    }
    throw new Error(tr('O processamento demorou demais. Tente novamente.'));
  } catch (error) { status('import-status', error.message, true); } finally { $('import-button').disabled = false; }
});
