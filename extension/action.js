(async () => {
  const $ = id => document.getElementById(id); const send = message => chrome.runtime.sendMessage(message);
  const selected = await send({ type: 'GET_SETTINGS' }); B4I18N.set(selected.language); B4I18N.apply();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const id = YTHoverCore.videoId(tab?.url); $('title').textContent = id ? (tab.title || '') : '';
  $('summarize').disabled = !id;
  if (!id) $('status').textContent = B4I18N.t('currentUnsupported');
  $('settings').addEventListener('click', () => send({ type: 'OPEN_SETTINGS', url: id ? tab.url : '' }));
  $('summarize').addEventListener('click', async () => {
    $('summarize').disabled = true; $('summary').textContent = ''; $('count').textContent = ''; $('status').className = '';
    try {
      for (let attempt = 0; attempt < 200; attempt++) {
        const result = await send({ type: 'GET_SUMMARY', url: tab.url, title: tab.title, start: attempt === 0, retry: attempt === 0 });
        if (result.error) throw new Error(result.error);
        if (result.state === 'ready') { $('summary').textContent = result.summary; $('count').textContent = B4I18N.t('countWords', { count: YTHoverCore.wordCount(result.summary) }); $('status').textContent = ''; return; }
        $('status').textContent = B4I18N.t('processing'); await new Promise(resolve => setTimeout(resolve, 1400));
      }
      throw new Error(B4I18N.translate('O processamento demorou demais. Tente novamente.'));
    } catch (error) { $('status').className = 'error'; $('status').textContent = error.message; }
    finally { $('summarize').disabled = false; }
  });
})();
