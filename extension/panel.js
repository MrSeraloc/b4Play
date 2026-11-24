import {videoId, language} from './core.js';
import {authorizeSummaries} from './service.js';
import {t, localize} from './strings.js';

const element = id => document.getElementById(id);
const send = message => chrome.runtime.sendMessage(message);
let config = {locale: language(chrome.i18n.getUILanguage())};
let currentTab;
let retry = false;

localize(config.locale);

async function initialize() {
  try {
    const result = await send({type: 'SETTINGS'});
    if (result.error) throw new Error(result.error);
    config = result;
    localize(config.locale);
    [currentTab] = await chrome.tabs.query({active: true, currentWindow: true});
    const supported = !!videoId(currentTab?.url);
    element('summarize').disabled = !supported || !config.serviceConfigured;
    if (supported && config.serviceConfigured && !config.consent) {
      element('disclosure').hidden = false;
      element('summarize').textContent = t('allowAndSummarize', config.locale);
    }
    element('status').textContent = !config.serviceConfigured ? t('serviceUnavailable', config.locale)
      : !supported ? t('unsupported', config.locale) : '';
    if (supported) element('title').textContent = String(currentTab.title || '').slice(0, 500);
  } catch {
    element('status').textContent = t('failed', config.locale);
  }
}

element('summarize').addEventListener('click', async () => {
  if (!currentTab) return;
  element('summarize').disabled = true;
  element('summary').textContent = '';
  element('summary').setAttribute('aria-busy', 'true');
  element('copy').hidden = true;
  try {
    if (!config.consent) {
      const result = await authorizeSummaries().catch(error => ({error: t(error.message, config.locale)}));
      if (result.error) throw new Error(result.error);
      config.consent = true;
      element('disclosure').hidden = true;
      element('summarize').textContent = t('summarize', config.locale);
    }
    element('status').textContent = t('working', config.locale);
    let result = await send({type: 'START', url: currentTab.url, title: currentTab.title, force: retry});
    for (let attempt = 0; attempt < 160; attempt++) {
      if (result.error) throw new Error(result.error);
      if (result.state === 'ready') {
        // AI output is untrusted text, never markup or executable content.
        element('summary').textContent = result.summary;
        element('copy').hidden = false;
        element('status').textContent = '';
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      result = await send({type: 'STATUS', id: result.id});
    }
    throw new Error(t('cancelled', config.locale));
  } catch (error) {
    retry = true;
    element('status').textContent = error.message;
  } finally {
    element('summary').setAttribute('aria-busy', 'false');
    element('summarize').disabled = false;
  }
});

element('copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(element('summary').textContent);
    element('status').textContent = t('copied', config.locale);
  } catch {
    element('status').textContent = t('failed', config.locale);
  }
});

void initialize();
