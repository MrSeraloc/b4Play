// Reads only Tactiq's transcript element in a tab created for a requested video.
(async function readTranscript() {
  if (!location.hash.startsWith('#b4play=')) return;
  let accepted = false;
  for (let attempt = 0; attempt < 8; attempt++) {
    const result = await chrome.runtime.sendMessage({type: 'TRANSCRIPT_HELLO'}).catch(() => null);
    if (result?.ok) { accepted = true; break; }
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  if (!accepted) return;
  let done = false; let previous = ''; let stable = 0;
  const timer = setInterval(async () => {
    if (done) return;
    const text = document.querySelector('#transcript')?.innerText?.trim() || '';
    if (!text || /^(loading|fetching|please wait|carregando|aguarde)/i.test(text)) return;
    if (/^(error|unable|failed|could not|no transcript|erro|não foi possível)/i.test(text)) {
      done = true; clearInterval(timer);
      await chrome.runtime.sendMessage({type: 'TRANSCRIPT_FAILED'}).catch(() => {}); return;
    }
    stable = text === previous ? stable + 1 : 0; previous = text;
    if (text.length < 30 || stable < 2) return;
    done = true; clearInterval(timer);
    await chrome.runtime.sendMessage({type: 'TRANSCRIPT_READY', text}).catch(() => {});
  }, 1000);
  setTimeout(() => { if (!done) { done = true; clearInterval(timer); void chrome.runtime.sendMessage({type: 'TRANSCRIPT_FAILED'}).catch(() => {}); } }, 95000);
})();
