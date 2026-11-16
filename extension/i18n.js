(() => {
  const data = globalThis.B4Translations;
  let selected = 'auto';
  const resolve = value => /^pt(?:[-_]|$)/i.test(String(value)) ? 'pt_BR' : 'en';
  const locale = value => resolve((value || selected) === 'auto' ? (globalThis.chrome?.i18n?.getUILanguage?.() || globalThis.navigator?.language || 'en') : (value || selected));
  function t(key, values = {}) {
    let value = data.ui[key]?.[locale() === 'pt_BR' ? 0 : 1] || key;
    return value.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));
  }
  function translate(text) {
    if (locale() === 'pt_BR' || typeof text !== 'string') return text;
    const exact = data.phrases.find(([pt]) => pt === text);
    if (exact) return exact[1];
    for (const [pt, en] of [...data.phrases].sort((a, b) => b[0].length - a[0].length)) text = text.split(pt).join(en);
    return text;
  }
  function apply(root = document) {
    root.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = t(node.dataset.i18n); });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(node => { node.setAttribute('placeholder', t(node.dataset.i18nPlaceholder)); });
    if (root.documentElement) root.documentElement.lang = locale() === 'pt_BR' ? 'pt-BR' : 'en';
  }
  globalThis.B4I18N = { locale, resolve, t, translate, apply, set(value) { selected = ['auto', 'en', 'pt_BR'].includes(value) ? value : 'auto'; } };
})();
