import {providers, language, videoId} from './core.js';
import {t, localize} from './strings.js';
const $ = id => document.getElementById(id);
const send = message => chrome.runtime.sendMessage(message);
let config = await send({type: 'SETTINGS'});
let sequence = 0;
for (const field of ['language', 'provider', 'model']) $(field).value = config[field] || '';
for (const field of ['remember', 'hover', 'consent']) $(field).checked = !!config[field];
function locale() { return language($('language').value === 'auto' ? chrome.i18n.getUILanguage() : $('language').value); }
function apply() {
  localize(locale());
  $('key').placeholder = config.keySet && config.provider === $('provider').value ? '••••••••' : ($('provider').value === 'openrouter' ? 'sk-or-v1-…' : 'sk-…');
  $('catalog').href = $('provider').value === 'openrouter' ? 'https://openrouter.ai/models' : 'https://platform.openai.com/docs/models';
  $('catalog').textContent = locale() === 'pt-BR' ? 'Catálogo de modelos ↗' : 'Model catalog ↗';
}
apply(); $('language').addEventListener('change', apply);
$('provider').addEventListener('change', () => { $('key').value = ''; $('model').value = config.provider === $('provider').value ? config.model : ''; apply(); });
$('preferences').addEventListener('submit', async event => {
  event.preventDefault(); $('status').textContent = '';
  // Request permission directly during the click gesture, before asynchronous work.
  const provider = $('provider').value;
  try {
    const granted = await chrome.permissions.request({origins: [providers[provider].origin]});
    if (!granted) throw new Error(t('permission', locale()));
    const result = await send({type: 'SAVE', provider, model: $('model').value, key: $('key').value, language: $('language').value,
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
