(function (root) {
  function videoId(value) {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password) return null;
      const host = url.hostname.toLowerCase();
      let id;
      if (host === 'youtu.be') id = url.pathname.slice(1).split('/')[0];
      else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host) && url.pathname === '/watch') id = url.searchParams.get('v');
      return /^[a-zA-Z0-9_-]{11}$/.test(id || '') ? id : null;
    } catch { return null; }
  }
  function cleanTranscript(value) {
    return String(value).replace(/\r/g, '').split('\n')
      .filter(line => !/^\s*(?:\d{1,2}:)?\d{2}:\d{2}[.,]\d{3}\s*-->/.test(line))
      .map(line => line.replace(/^\s*(?:\[?\d{1,2}:\d{2}(?::\d{2})?(?:\.\d{1,3})?\]?\s*)+/, '').trim())
      .filter(line => line && !/^\d+$/.test(line) && !/^(WEBVTT|NOTE\b|\d{2}:\d{2}:\d{2}.*-->)/.test(line))
      .join(' ').replace(/\s+/g, ' ').trim();
  }
  const words = text => String(text).trim().split(/\s+/u).filter(Boolean);
  function limitWords(text, limit = 200) {
    const list = words(text);
    if (list.length <= limit) return list.join(' ');
    const selected = list.slice(0, limit).join(' ');
    const lastSentence = [...selected.matchAll(/[.!?](?:[”"']?)(?=\s|$)/gu)].at(-1);
    if (lastSentence && lastSentence.index > selected.length * 0.65) return selected.slice(0, lastSentence.index + lastSentence[0].length);
    return selected.replace(/[,;:]$/, '') + '…';
  }
  // Opera usa APIs Chromium. Aceitamos também o esquema próprio documentado
  // pelo Opera, sempre com um ID de extensão completo e sem caminhos extras.
  const isExtensionOrigin = value => /^(?:chrome|opera)-extension:\/\/[a-p]{32}$/.test(value);
  root.YTHoverCore = Object.freeze({ videoId, cleanTranscript, limitWords, isExtensionOrigin, wordCount: text => words(text).length });
})(globalThis);
