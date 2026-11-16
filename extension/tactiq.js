/* A página faz sua própria consulta. Não usamos endpoints privados nem tokens de verificação. */
(async () => {
  if (!location.hash.startsWith('#antes-do-play=')) return;
  const send = message => chrome.runtime.sendMessage(message);
  let ready;
  for (let attempt = 0; attempt < 6; attempt++) {
    ready = await send({ type: 'BRIDGE_READY' }).catch(() => null);
    if (ready?.id) break;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  if (!ready?.id) return;
  let finished = false;
  let stableTimer;
  let previous = '';
  const report = async (type, transcript) => {
    if (finished) return;
    finished = true;
    observer.disconnect(); clearTimeout(timeout); clearTimeout(stableTimer);
    try { await send({ type, transcript }); } catch { /* Aba encerrada pelo worker. */ }
  };
  function inspect() {
    const root = document.querySelector('#transcript');
    if (!root) return;
    const text = root.innerText.trim();
    if (/^(error|unable to|failed to|could not|no transcript|transcript (?:is )?(?:unavailable|not available)|erro|não foi possível)/i.test(text)) {
      void report('TRANSCRIPT_ERROR'); return;
    }
    if (!text || /^(loading|fetching|please wait|carregando|aguarde)[.…\s]*$/i.test(text)) return;
    if (text === previous) return;
    previous = text; clearTimeout(stableTimer);
    // Espera o DOM estabilizar para não enviar apenas parte da transcrição.
    stableTimer = setTimeout(() => {
      const current = document.querySelector('#transcript')?.innerText.trim();
      if (current !== previous) { inspect(); return; }
      if (YTHoverCore.cleanTranscript(current).length >= 30) void report('TRANSCRIPT_READY', current);
    }, 1600);
  }
  const observer = new MutationObserver(inspect);
  const timeout = setTimeout(() => void report('TRANSCRIPT_ERROR'), 95000);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  inspect();
})();
