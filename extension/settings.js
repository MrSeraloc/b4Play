import {language, videoId, summaryLocale} from './core.js';
import {authorizeSummaries} from './service.js';
import {t, localize} from './strings.js';
const $ = id => document.getElementById(id);
const send = message => chrome.runtime.sendMessage(message);
const compact = window.parent !== window;
if (compact) {
  document.body.classList.add('compact-settings');
  if (new URLSearchParams(location.search).get('theme') === 'dark') document.documentElement.classList.add('dark');
  $('compact-actions').hidden = false;
  for (const id of ['import-details', 'settings-footer']) $(id).hidden = true;
  $('done').addEventListener('click', () => void send({type: 'CLOSE_COMPACT_SETTINGS'}));
  $('full-settings').addEventListener('click', () => void send({type: 'OPEN_SETTINGS'}));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') void send({type: 'CLOSE_COMPACT_SETTINGS'});
  });
}
let config = await send({type: 'SETTINGS'});
let sequence = 0;
const browserLanguage = chrome.i18n.getUILanguage();
const locale = config.locale || language(browserLanguage);
$('summary-length').value = config.summaryLength || '150-300';
localize(locale);
const name = new Intl.DisplayNames([locale], {type: 'language'}).of(summaryLocale(browserLanguage));
$('summary-language').textContent = t('summaryLanguage', locale).replace('{language}', name);
const showAuthorization = () => { $('authorization').hidden = false; };
if (!compact && !config.consent && new URLSearchParams(location.search).has('authorize')) showAuthorization();

$('authorize').addEventListener('click', async () => {
  $('authorize').disabled = true;
  try {
    const result = await authorizeSummaries();
    if (result.error) { $('authorization-status').textContent = result.error; return; }
    config.consent = true;
    $('authorization').hidden = true;
    $('status').textContent = t('activated', locale);
    $('import-status').textContent = '';
  } catch (error) { $('authorization-status').textContent = t(error.message, locale); }
  finally { $('authorize').disabled = false; }
});

$('preferences').addEventListener('submit', async event => {
  event.preventDefault(); $('status').textContent = '';
  try {
    const result = await send({type: 'SAVE', summaryLength: $('summary-length').value});
    if (result.error) throw new Error(result.error);
    $('status').textContent = t('saved', locale);
  } catch (error) { $('status').textContent = error.message; }
});
$('forget').addEventListener('click', async () => {
  sequence++;
  const result = await send({type: 'FORGET'});
  if (result.error) { $('status').textContent = result.error; return; }
  $('preferences').reset(); $('summary').textContent = ''; $('copy').hidden = true;
  config = await send({type: 'SETTINGS'});
  $('authorization').hidden = true;
  $('status').textContent = t('forgotten', locale);
});
$('import-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (!config.consent) {
    showAuthorization();
    $('authorize').focus();
    $('import-status').textContent = t('config', locale);
    return;
  }
  const own = ++sequence; const button = event.submitter;
  button.disabled = true; $('summary').textContent = ''; $('copy').hidden = true;
  try {
    if (!videoId($('url').value)) throw new Error(t('unsupported', locale));
    const file = $('file').files[0];
    if (!file || file.size > 500000) throw new Error(t('transcript', locale));
    const text = await file.text(); if (text.length > 120000) throw new Error(t('transcript', locale));
    $('import-status').textContent = t('working', locale);
    let result = await send({type: 'START', url: $('url').value, transcript: text, force: true});
    for (let attempt = 0; attempt < 160 && own === sequence; attempt++) {
      if (result.error) throw new Error(result.error);
      if (result.state === 'ready') { $('summary').textContent = result.summary; $('copy').hidden = false; $('import-status').textContent = ''; return; }
      await new Promise(resolve => setTimeout(resolve, 1000)); result = await send({type: 'STATUS', id: result.id});
    }
    if (own === sequence) throw new Error(t('cancelled', locale));
  } catch (error) { if (own === sequence) $('import-status').textContent = error.message; }
  finally { button.disabled = false; }
});
$('copy').addEventListener('click', async () => { await navigator.clipboard.writeText($('summary').textContent); $('import-status').textContent = t('copied', locale); });
