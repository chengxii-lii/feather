// feather background worker: opens the palette, runs searches, performs actions.
importScripts('settings.js');

const SELF = chrome.runtime.getURL('');
const POPUP = chrome.runtime.getURL('palette.html');
const POPUP_FRAME = 40; // the popup window's title bar and borders

const isBlank = (url = '') =>
  /^(chrome|edge|brave|helium):\/\/(newtab|new-tab-page)/.test(url) || url === 'about:blank' || url === '';

chrome.commands.onCommand.addListener(async (cmd, tab) => {
  if (cmd === 'open-settings') return chrome.runtime.openOptionsPage();
  if (cmd === 'close-tab') return closeTab(tab);
  if (cmd !== 'toggle-palette') return;
  tab ??= (await chrome.tabs.query({ active: true, lastFocusedWindow: true }))[0];
  openPalette(tab);
});
chrome.action.onClicked.addListener(openPalette);

async function openPalette(tab) {
  if (!tab) return;
  // Pressing the shortcut again while the popup window is up closes it.
  const popups = (await chrome.windows.getAll({ populate: true, windowTypes: ['popup'] }))
    .filter((w) => w.tabs.some((t) => t.url?.startsWith(POPUP)));
  if (popups.length) return popups.forEach((w) => chrome.windows.remove(w.id));

  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['settings.js', 'palette.js'] });
  } catch {
    // New tab, settings and web store pages can't be drawn on: float a small window, centered on the browser, instead.
    const [win, s] = await Promise.all([chrome.windows.get(tab.windowId), FEATHER.load()]);
    const width = s.width + 16;
    const height = FEATHER.barHeight(s) + POPUP_FRAME;
    chrome.windows.create({
      url: `${POPUP}?tabId=${tab.id}&windowId=${tab.windowId}`, type: 'popup', focused: true, width, height,
      left: Math.round(win.left + (win.width - width) / 2), top: Math.round(win.top + (win.height - height) / 2)
    });
  }
}

// ---------- Pinned tabs (Zen-style) ----------

// Closing a pinned tab only unloads it: it stays in the tab strip and reloads when you come back to it.
// Bound to "Close tab", which you set to Ctrl+W.
async function closeTab(tab) {
  tab ??= (await chrome.tabs.query({ active: true, lastFocusedWindow: true }))[0];
  if (!tab) return;
  const s = await FEATHER.load();
  if (!s.pinnedUnload) return chrome.tabs.remove(tab.id);

  const others = (await chrome.tabs.query({ windowId: tab.windowId })).filter((t) => t.id !== tab.id);
  const awake = others.filter((t) => !(t.pinned && t.discarded));

  if (!tab.pinned) {
    // Don't let closing a normal tab wake up an unloaded pinned tab: land on a new tab instead.
    if (others.length && !awake.length) await chrome.tabs.create({ windowId: tab.windowId });
    return chrome.tabs.remove(tab.id);
  }

  // Go back to the tab you used last. If only unloaded pinned tabs are left, open a new tab.
  const next = awake.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))[0];
  if (next) await chrome.tabs.update(next.id, { active: true });
  else await chrome.tabs.create({ windowId: tab.windowId });
  // A tab can only be unloaded once it's in the background.
  await chrome.tabs.discard(tab.id).catch(() => {});
}

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  const ctx = msg.origin || { tabId: sender.tab?.id, windowId: sender.tab?.windowId };
  const run = msg.type === 'search' ? search(msg.q, ctx)
    : msg.type === 'suggest' ? suggest(msg.q)
    : msg.type === 'open' ? open(msg.item, msg.here, ctx)
    : msg.type === 'settings' ? chrome.runtime.openOptionsPage() : null;
  if (!run) return;
  run.then(reply, (e) => reply({ error: String(e) }));
  return true;
});

// ---------- Search ----------

function looksLikeUrl(q) {
  if (/\s/.test(q)) return false;
  return /^[a-z][\w+.-]*:\/\//i.test(q) || /^localhost(:\d+)?(\/|$)/i.test(q) ||
    /^[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/.test(q);
}
const normalizeUrl = (q) => (/^[a-z][\w+.-]*:\/\//i.test(q) ? q : 'https://' + q);
const cleanUrl = (u = '') => u.toLowerCase().replace(/^[a-z]+:\/\//, '').replace(/^www\./, '');

// Helium resolves !bangs in its address bar, which feather bypasses, so feather resolves them itself.
// Popular bangs go straight to the site; any other bang goes through DuckDuckGo, which knows all of them.
const BANGS = {
  g: ['Google', 'https://www.google.com/search?q={}'],
  gi: ['Google Images', 'https://www.google.com/search?tbm=isch&q={}'],
  gm: ['Google Maps', 'https://www.google.com/maps/search/{}'],
  gt: ['Google Translate', 'https://translate.google.com/?sl=auto&tl=en&text={}'],
  gs: ['Google Scholar', 'https://scholar.google.com/scholar?q={}'],
  ddg: ['DuckDuckGo', 'https://duckduckgo.com/?q={}'],
  b: ['Bing', 'https://www.bing.com/search?q={}'],
  yt: ['YouTube', 'https://www.youtube.com/results?search_query={}'],
  w: ['Wikipedia', 'https://en.wikipedia.org/wiki/Special:Search?search={}'],
  wiki: ['Wikipedia', 'https://en.wikipedia.org/wiki/Special:Search?search={}'],
  r: ['Reddit', 'https://www.reddit.com/search/?q={}'],
  gh: ['GitHub', 'https://github.com/search?q={}'],
  so: ['Stack Overflow', 'https://stackoverflow.com/search?q={}'],
  mdn: ['MDN', 'https://developer.mozilla.org/en-US/search?q={}'],
  npm: ['npm', 'https://www.npmjs.com/search?q={}'],
  a: ['Amazon', 'https://www.amazon.com/s?k={}'],
  ebay: ['eBay', 'https://www.ebay.com/sch/i.html?_nkw={}'],
  imdb: ['IMDb', 'https://www.imdb.com/find/?q={}'],
  x: ['X', 'https://x.com/search?q={}'],
  tw: ['X', 'https://x.com/search?q={}'],
  twitch: ['Twitch', 'https://www.twitch.tv/search?term={}'],
  spotify: ['Spotify', 'https://open.spotify.com/search/{}'],
  pin: ['Pinterest', 'https://www.pinterest.com/search/pins/?q={}'],
  wa: ['Wolfram Alpha', 'https://www.wolframalpha.com/input?i={}'],
  maps: ['OpenStreetMap', 'https://www.openstreetmap.org/search?query={}'],
  chatgpt: ['ChatGPT', 'https://chatgpt.com/?q={}'],
  perplexity: ['Perplexity', 'https://www.perplexity.ai/search?q={}']
};

function parseBang(q, custom = []) {
  const m = q.match(/(?:^|\s)!(\S+)/);
  if (!m) return null;
  const key = m[1].toLowerCase();
  const terms = (q.slice(0, m.index) + ' ' + q.slice(m.index + m[0].length)).trim().replace(/\s+/g, ' ');

  // Your own bangs (from settings) win over the built-in ones. %s marks where the search goes.
  const mine = custom.find((b) => b.key.toLowerCase() === key);
  if (mine) {
    try {
      const home = new URL(mine.url.replace(/%s/g, ''));
      const url = terms ? mine.url.replace(/%s/g, encodeURIComponent(terms)) : home.origin;
      return { kind: 'bang', title: terms || `!${key}`, label: home.hostname.replace(/^www\./, ''), url };
    } catch { /* a broken URL falls through to the built-in bangs */ }
  }

  const known = BANGS[key];
  if (!known) {
    return { kind: 'bang', title: terms || q, label: `!${key} via DuckDuckGo`, url: 'https://duckduckgo.com/?q=' + encodeURIComponent(q) };
  }
  const [name, tpl] = known;
  // A bang on its own ("!yt") goes to the site's home page.
  const url = terms ? tpl.replace('{}', encodeURIComponent(terms)) : new URL(tpl).origin;
  return { kind: 'bang', title: terms || name, label: name, url };
}

// Inline autocomplete: the site you most likely mean, e.g. "you" -> "youtube.com", from history, tabs and bookmarks.
function inlineCompletion(q, sources) {
  const lq = q.toLowerCase();
  if (!lq || /\s|:\/\//.test(lq) || lq.startsWith('www.') || lq.startsWith('!')) return null;
  const byText = new Map();
  for (const { url, weight } of sources) {
    let u;
    try { u = new URL(url); } catch { continue; }
    if (!/^https?:$/.test(u.protocol)) continue;
    const host = u.host.replace(/^www\./, '');
    const full = url.replace(/^[a-z]+:\/\//i, '').replace(/^www\./i, '');
    let text, target;
    if (host.startsWith(lq)) [text, target] = [host, `${u.protocol}//${u.host}/`];
    else if (lq.includes('/') && full.toLowerCase().startsWith(lq)) [text, target] = [full, url];
    else continue;
    const entry = byText.get(text) || { text, url: target, weight: 0 };
    entry.weight += weight;
    byText.set(text, entry);
  }
  let best = null;
  for (const e of byText.values()) {
    if (!best || e.weight > best.weight || (e.weight === best.weight && e.text.length < best.text.length)) best = e;
  }
  return best && best.text.length > q.length ? { kind: 'url', title: best.text, url: best.url, complete: best.text } : null;
}

// Search suggestions as you type, from DuckDuckGo.
async function suggest(raw) {
  const q = raw.trim();
  const s = await FEATHER.load();
  if (!s.suggestions || !q || looksLikeUrl(q) || parseBang(q, s.bangs)) return [];
  const res = await fetch(`https://duckduckgo.com/ac/?q=${encodeURIComponent(q)}&type=list`, { signal: AbortSignal.timeout(1500) });
  const [, list] = await res.json();
  return list.filter((s) => s.toLowerCase() !== q.toLowerCase() && !s.startsWith('!')).slice(0, 4);
}

function score(terms, title = '', url = '') {
  const t = title.toLowerCase();
  const u = cleanUrl(url);
  let s = 0;
  for (const term of terms) {
    const ti = t.indexOf(term);
    const ui = u.indexOf(term);
    if (ti < 0 && ui < 0) return 0;
    if (ti === 0) s += 12;
    else if (ti > 0) s += /[\s\W]/.test(t[ti - 1]) ? 9 : 4;
    if (ui === 0) s += 10;
    else if (ui > 0) s += /[./\-_]/.test(u[ui - 1]) ? 6 : 2;
  }
  return s;
}

async function search(raw, ctx) {
  const q = raw.trim();
  const s = await FEATHER.load();
  const tabs = !s.tabs ? [] : (await chrome.tabs.query({})).filter((t) => t.id !== ctx.tabId && !isBlank(t.url) && !t.url.startsWith(SELF));

  if (!q) {
    return tabs
      .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))
      .slice(0, 8)
      .map((t) => ({ kind: 'tab', id: t.id, windowId: t.windowId, title: t.title, url: t.url }));
  }

  const terms = q.toLowerCase().split(/\s+/);
  const [bookmarks, history] = await Promise.all([
    s.bookmarks ? chrome.bookmarks.search(q).catch(() => []) : [],
    s.history ? chrome.history.search({ text: q, maxResults: 50, startTime: 0 }).catch(() => []) : []
  ]);

  const completion = s.autocomplete && inlineCompletion(q, [
    ...tabs.map((t) => ({ url: t.url, weight: 3 })),
    ...bookmarks.filter((b) => b.url).map((b) => ({ url: b.url, weight: 5 })),
    ...history.map((h) => ({ url: h.url, weight: 1 + (h.visitCount || 0) + 4 * (h.typedCount || 0) }))
  ]);

  const seen = new Set(completion ? [cleanUrl(completion.url).replace(/\/$/, '')] : []);
  const local = [];
  const add = (item, bonus) => {
    const key = cleanUrl(item.url).replace(/\/$/, '');
    if (!item.url || seen.has(key)) return;
    const points = score(terms, item.title, item.url);
    if (!points) return;
    seen.add(key);
    local.push({ ...item, score: points + bonus });
  };
  tabs.forEach((t) => add({ kind: 'tab', id: t.id, windowId: t.windowId, title: t.title, url: t.url }, 6));
  bookmarks.filter((b) => b.url).forEach((b) => add({ kind: 'bookmark', title: b.title, url: b.url }, 3));
  history.forEach((h) => add({ kind: 'history', title: h.title || h.url, url: h.url }, Math.min(4, Math.log2((h.visitCount || 1) + 1))));
  local.sort((a, b) => b.score - a.score);

  const action = parseBang(q, s.bangs) || (looksLikeUrl(q)
    ? { kind: 'url', title: q, url: normalizeUrl(q) }
    : { kind: 'search', title: q });

  // The inline completion is what Enter opens, so it leads; searching for exactly what you typed comes next.
  if (completion) return [completion, action, ...local.slice(0, 8)];

  // A strong local match (e.g. tab title starts with the query) goes above the web action.
  const results = local.slice(0, 9);
  const strong = results[0] && results[0].score >= 18 * terms.length && action.kind === 'search';
  return strong ? [results[0], action, ...results.slice(1)] : [action, ...results];
}

// ---------- Actions ----------

async function open(item, here, ctx) {
  const origin = ctx.tabId ? await chrome.tabs.get(ctx.tabId).catch(() => null) : null;

  if (item.kind === 'tab') {
    await chrome.tabs.update(item.id, { active: true });
    await chrome.windows.update(item.windowId, { focused: true });
    // Switching away from an empty new tab closes it, like Zen.
    if (origin && isBlank(origin.url)) chrome.tabs.remove(origin.id).catch(() => {});
    return { ok: true };
  }

  // Reuse the current tab if asked, or if it's an empty new tab page.
  let tabId;
  if (origin && (here || isBlank(origin.url))) {
    tabId = origin.id;
  } else {
    const created = await chrome.tabs.create({
      windowId: ctx.windowId, index: origin ? origin.index + 1 : undefined, url: item.kind === 'search' ? 'about:blank' : item.url
    });
    if (item.kind !== 'search') return { ok: true };
    tabId = created.id;
  }

  if (item.kind === 'search') await chrome.search.query({ text: item.title, tabId }); // uses your default engine, so !bangs work
  else await chrome.tabs.update(tabId, { url: item.url });
  await chrome.windows.update((await chrome.tabs.get(tabId)).windowId, { focused: true });
  return { ok: true };
}
