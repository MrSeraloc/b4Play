export const summaryPath = '/v3/summary';

export function videoId(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    const id = url.hostname === 'youtu.be' ? url.pathname.slice(1).split('/')[0]
      : ['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname) && url.pathname === '/watch' ? url.searchParams.get('v') : null;
    return /^[\w-]{11}$/.test(id || '') ? id : null;
  } catch { return null; }
}
export const language = value => /^pt(?:[-_]|$)/i.test(value || '') ? 'pt-BR' : 'en';
export function summaryLocale(value) {
  try { return Intl.getCanonicalLocales(value)[0] || 'en'; }
  catch { return 'en'; }
}

export function limitWords(text, count = 200) {
  const words = String(text).trim().split(/\s+/u).filter(Boolean);
  return words.slice(0, count).join(' ') + (words.length > count ? '…' : '');
}
export const summaryRanges = Object.freeze({'150-300': {min: 150, max: 300}, '300-500': {min: 300, max: 500}, '500-750': {min: 500, max: 750}});
export function normalizeSummaryLength(value) {
  if (value == null || value === '150-250') return '150-300';
  if (typeof value !== 'string' || !Object.hasOwn(summaryRanges, value)) throw new Error('summaryLengthConfig');
  return value;
}
export function transcriptText(value) {
  if (typeof value !== 'string' || value.length > 120000) throw new Error('transcript');
  const clean = value.replace(/\r/g, '').split('\n').filter(line => !/^\s*\d{2}:\d{2}.*-->/.test(line))
    .map(line => line.replace(/^\s*\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*/, '').trim()).join(' ').replace(/\s+/g, ' ').trim();
  if (clean.length < 30) throw new Error('transcript');
  return clean;
}
