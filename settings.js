// feather settings, shared by the background worker, the palette and the settings page.
// `var` so injecting it into a page twice doesn't throw.
var FEATHER = globalThis.FEATHER || (() => {
  const defaults = {
    theme: 'system',       // system | light | dark
    glass: 10,             // 0 = solid paper, 100 = clear glass
    accent: 'clay',
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
    clay: ['#c96442', '#d97757'],
    blue: ['#3f55d9', '#9aa9ff'],
    violet: ['#7446d6', '#bda4ff'],
    pink: ['#cc3a7e', '#ff9fcb'],
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
  // Warm paper in light mode, warm charcoal in dark; the glass setting only thins the surface out.
  function vars(s, dark = isDark(s)) {
    const clear = s.glass / 100;
    const alpha = (1 - clear * 0.62).toFixed(2);
    const accent = (accents[s.accent] || accents.clay)[dark ? 1 : 0];
    const tone = dark ? {
      '--surface': `rgba(48, 48, 46, ${alpha})`, '--edge': 'rgba(222, 220, 209, .14)', '--shine': 'rgba(255, 255, 255, .04)',
      '--line': 'rgba(222, 220, 209, .1)', '--text': '#faf9f5', '--muted': '#a6a39a',
      '--hover': 'rgba(222, 220, 209, .05)', '--sel': 'rgba(222, 220, 209, .09)', '--kbd': 'rgba(222, 220, 209, .1)',
      '--dim': s.dim ? 'rgba(0, 0, 0, .4)' : 'transparent'
    } : {
      '--surface': `rgba(255, 255, 255, ${alpha})`, '--edge': 'rgba(31, 30, 29, .13)', '--shine': 'rgba(255, 255, 255, 0)',
      '--line': 'rgba(31, 30, 29, .08)', '--text': '#141413', '--muted': '#73726c',
      '--hover': 'rgba(31, 30, 29, .035)', '--sel': 'rgba(31, 30, 29, .06)', '--kbd': 'rgba(31, 30, 29, .06)',
      '--dim': s.dim ? 'rgba(20, 20, 19, .22)' : 'transparent'
    };
    return { ...tone, '--accent': accent, '--blur': `${Math.round(16 + clear * 48)}px`, '--width': `${s.width}px`, '--list-h': `${listHeight(s)}px` };
  }

  // The wallpaper image is too big for synced settings, so it lives in this computer's storage.
  const getWallpaper = async () => (await chrome.storage.local.get('wallpaper')).wallpaper || '';
  const setWallpaper = (dataUrl) => (dataUrl ? chrome.storage.local.set({ wallpaper: dataUrl }) : chrome.storage.local.remove('wallpaper'));

  return { defaults, accents, load, save, isDark, vars, listHeight, barHeight, getWallpaper, setWallpaper };
})();
