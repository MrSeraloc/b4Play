import {videoId} from './core.js';
import {t, localize} from './strings.js';
const $ = id => document.getElementById(id);
const send = message => chrome.runtime.sendMessage(message);
const config = await send({type: 'SETTINGS'}); localize(config.locale);
const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
const supported = !!videoId(tab?.url);
let retry = false;
$('summarize').disabled = !supported || !config.keySet || !config.consent;
$('status').textContent = !config.keySet || !config.consent ? t('config', config.locale) : !supported ? t('unsupported', config.locale) : '';
if (supported) $('title').textContent = (tab.title || '').slice(0, 500);
$('settings').addEventListener('click', () => chrome.runtime.openOptionsPage());
$('summarize').addEventListener('click', async () => {
  $('summarize').disabled = true; $('summary').textContent = ''; $('copy').hidden = true; $('status').textContent = t('working', config.locale);
  try {
    let result = await send({type: 'START', url: tab.url, title: tab.title, force: retry});
    for (let attempt = 0; attempt < 160; attempt++) {
      if (result.error) throw new Error(result.error);
      if (result.state === 'ready') { $('summary').textContent = result.summary; $('copy').hidden = false; $('status').textContent = ''; return; }
      await new Promise(resolve => setTimeout(resolve, 1000)); result = await send({type: 'STATUS', id: result.id});
    }
    throw new Error(t('cancelled', config.locale));
  } catch (error) { retry = true; $('status').textContent = error.message; }
  finally { $('summarize').disabled = false; }
});
$('copy').addEventListener('click', async () => { await navigator.clipboard.writeText($('summary').textContent); $('status').textContent = t('copied', config.locale); });
