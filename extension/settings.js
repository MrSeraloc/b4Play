import {providers, language, videoId} from './core.js';
import {t, localize} from './strings.js';
const $ = id => document.getElementById(id);
const send = message => chrome.runtime.sendMessage(message);
let config = await send({type: 'SETTINGS'});
let sequence = 0;
for (const field of ['language', 'provider', 'model']) $(field).value = config[field] || '';
for (const field of ['remember', 'hover', 'consent']) $(field).checked = !!config[field];
$('reasoning').value = config.reasoning || 'auto';
$('output-tokens').value = String(config.outputTokens ?? 4096);
$('summary-length').value = config.summaryLength || '150-250';
function resetModelOptions() {
  for (const option of $('reasoning').options) option.disabled = false;
  for (const option of $('output-tokens').options) option.disabled = false;
  $('model-status').textContent = '';
}
function locale() { return language($('language').value === 'auto' ? chrome.i18n.getUILanguage() : $('language').value); }
function apply() {
  localize(locale());
  $('key').placeholder = config.keySet && config.provider === $('provider').value ? '••••••••' : ($('provider').value === 'openrouter' ? 'sk-or-v1-…' : 'sk-…');
  $('catalog').href = $('provider').value === 'openrouter' ? 'https://openrouter.ai/models' : 'https://platform.openai.com/docs/models';
  $('catalog').textContent = locale() === 'pt-BR' ? 'Catálogo de modelos ↗' : 'Model catalog ↗';
  $('check-model').hidden = $('provider').value !== 'openrouter';
}
apply(); $('language').addEventListener('change', apply);
$('provider').addEventListener('change', () => {
  $('key').value = ''; $('model').value = config.provider === $('provider').value ? config.model : '';
  $('reasoning').value = config.provider === $('provider').value ? config.reasoning || 'auto' : 'auto';
  resetModelOptions(); apply();
});
$('model').addEventListener('input', resetModelOptions);
$('check-model').addEventListener('click', async () => {
  const provider = $('provider').value; const model = $('model').value.trim();
  if (provider !== 'openrouter' || !model) { $('model-status').textContent = t('modelError', locale()); return; }
  $('check-model').disabled = true; $('model-status').textContent = t('checkingModel', locale());
  try {
    const granted = await chrome.permissions.request({origins: [providers.openrouter.origin]});
    if (!granted) throw new Error(t('permission', locale()));
    const result = await send({type: 'MODEL_OPTIONS', provider, model});
    if (result.error) throw new Error(result.error);
    if ($('provider').value !== provider || $('model').value.trim() !== model) return;
    for (const option of $('reasoning').options) option.disabled = option.value !== 'auto' && !result.efforts.includes(option.value);
    if ($('reasoning').selectedOptions[0]?.disabled) $('reasoning').value = 'auto';
    if (result.maxOutput) {
      for (const option of $('output-tokens').options) option.disabled = Number(option.value) > result.maxOutput;
      if ($('output-tokens').selectedOptions[0]?.disabled) $('output-tokens').value = [...$('output-tokens').options].filter(option => !option.disabled).at(-1)?.value || '4096';
    }
    const labels = [...$('reasoning').options].filter(option => result.efforts.includes(option.value)).map(option => option.textContent);
    $('model-status').textContent = labels.length ? t('modelOptions', locale()) + ': ' + labels.join(', ') + '. ' + t('modelDefault', locale()) + ': ' + (result.defaultEffort || '—') : t('noEffort', locale());
  } catch (error) { $('model-status').textContent = error.message; }
  finally { $('check-model').disabled = false; }
});
$('preferences').addEventListener('submit', async event => {
  event.preventDefault(); $('status').textContent = '';
  // Request permission directly during the click gesture, before asynchronous work.
  const provider = $('provider').value;
  try {
    const granted = await chrome.permissions.request({origins: [providers[provider].origin]});
    if (!granted) throw new Error(t('permission', locale()));
    const result = await send({type: 'SAVE', provider, model: $('model').value, key: $('key').value, language: $('language').value,
      reasoning: $('reasoning').value, outputTokens: Number($('output-tokens').value), summaryLength: $('summary-length').value,
      remember: $('remember').checked, hover: $('hover').checked, consent: $('consent').checked});
    if (result.error) throw new Error(result.error);
    config = await send({type: 'SETTINGS'}); $('key').value = ''; apply(); $('status').textContent = t('saved', locale());
  } catch (error) { $('status').textContent = error.message; }
});
$('forget').addEventListener('click', async () => {
  sequence++;
  const result = await send({type: 'FORGET'});
  if (result.error) { $('status').textContent = result.error; return; }
  $('preferences').reset(); $('summary').textContent = ''; $('copy').hidden = true;
  resetModelOptions();
  config = await send({type: 'SETTINGS'}); apply(); $('status').textContent = t('forgotten', locale());
});
$('import-form').addEventListener('submit', async event => {
  event.preventDefault(); const own = ++sequence; const button = event.submitter;
  button.disabled = true; $('summary').textContent = ''; $('copy').hidden = true;
  try {
    if (!videoId($('url').value)) throw new Error(t('unsupported', locale()));
    const file = $('file').files[0];
    if (!file || file.size > 500000) throw new Error(t('transcript', locale()));
    const text = await file.text(); if (text.length > 120000) throw new Error(t('transcript', locale()));
    $('import-status').textContent = t('working', locale());
    let result = await send({type: 'START', url: $('url').value, transcript: text, force: true});
    for (let attempt = 0; attempt < 160 && own === sequence; attempt++) {
      if (result.error) throw new Error(result.error);
      if (result.state === 'ready') { $('summary').textContent = result.summary; $('copy').hidden = false; $('import-status').textContent = ''; return; }
      await new Promise(resolve => setTimeout(resolve, 1000)); result = await send({type: 'STATUS', id: result.id});
    }
    if (own === sequence) throw new Error(t('cancelled', locale()));
  } catch (error) { if (own === sequence) $('import-status').textContent = error.message; }
  finally { button.disabled = false; }
});
$('copy').addEventListener('click', async () => { await navigator.clipboard.writeText($('summary').textContent); $('import-status').textContent = t('copied', locale()); });
