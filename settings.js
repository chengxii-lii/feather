// feather settings, shared by the background worker, the palette and the settings page.
// `var` so injecting it into a page twice doesn't throw.
var FEATHER = globalThis.FEATHER || (() => {
  const defaults = {
    theme: 'system',       // system | light | dark
    glass: 50,             // 0 = frosted, 100 = clear
    accent: 'blue',
    width: 640,            // px, 480–960
    rows: 8,               // results that fit before the list scrolls, 4–12
    dim: true,             // dim the page behind the bar
    enterOpens: 'newtab',  // newtab | current (Alt+Enter does the other)
    autocomplete: true,
    suggestions: true,
    tabs: true,
    bookmarks: true,
    history: true,
    bangs: [],             // [{ key: 'mdn', url: 'https://developer.mozilla.org/search?q=%s' }]
    pinnedUnload: true     // "Close tab" (Ctrl+W) unloads pinned tabs instead of closing them
  };

  // Each accent as [light, dark].
  const accents = {
    blue: ['#3f55d9', '#9aa9ff'],
    violet: ['#7446d6', '#bda4ff'],
    pink: ['#cc3a7e', '#ff9fcb'],
    orange: ['#c95a14', '#ffb27d'],
    green: ['#1f8a55', '#82dcae'],
    graphite: ['#454a57', '#c9ccd6']
  };
  const ROW = 38;      // height of one result row, px
  const CHROME = 101;  // input (58) + footer (41) + panel border (2), px
  const listHeight = (s) => s.rows * ROW + 12;
  const barHeight = (s) => listHeight(s) + CHROME;

  // v1.4 stored width as a named size; turn those into pixels.
  const legacyWidths = { compact: 560, standard: 640, wide: 760 };
  const load = async () => {
    const s = await chrome.storage.sync.get(defaults);
    if (typeof s.width === 'string') s.width = legacyWidths[s.width] || defaults.width;
    return s;
  };
  const save = (patch) => chrome.storage.sync.set(patch);
  const isDark = (s) => s.theme === 'dark' || (s.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);

  // The bar's look as CSS custom properties, so the palette and the settings preview stay identical.
  function vars(s, dark = isDark(s)) {
    const clear = s.glass / 100;
    const alpha = (0.8 - clear * 0.6).toFixed(2);
    const accent = (accents[s.accent] || accents.blue)[dark ? 1 : 0];
    const tone = dark ? {
      '--surface': `rgba(28, 29, 36, ${alpha})`, '--edge': 'rgba(255, 255, 255, .12)', '--shine': 'rgba(255, 255, 255, .14)',
      '--line': 'rgba(255, 255, 255, .08)', '--text': '#f0f1f5', '--muted': 'rgba(240, 241, 245, .52)',
      '--hover': 'rgba(255, 255, 255, .06)', '--sel': 'rgba(255, 255, 255, .11)', '--kbd': 'rgba(255, 255, 255, .1)',
      '--dim': s.dim ? 'rgba(0, 0, 0, .28)' : 'transparent'
    } : {
      '--surface': `rgba(255, 255, 255, ${alpha})`, '--edge': 'rgba(255, 255, 255, .6)', '--shine': 'rgba(255, 255, 255, .75)',
      '--line': 'rgba(20, 22, 30, .08)', '--text': '#15161a', '--muted': 'rgba(21, 22, 26, .56)',
      '--hover': 'rgba(255, 255, 255, .4)', '--sel': 'rgba(255, 255, 255, .7)', '--kbd': 'rgba(255, 255, 255, .6)',
      '--dim': s.dim ? 'rgba(10, 12, 20, .12)' : 'transparent'
    };
    return { ...tone, '--accent': accent, '--blur': `${Math.round(16 + clear * 48)}px`, '--width': `${s.width}px`, '--list-h': `${listHeight(s)}px` };
  }

  return { defaults, accents, load, save, isDark, vars, listHeight, barHeight };
})();
