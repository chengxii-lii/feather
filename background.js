// feather background worker: opens the palette, runs searches, performs actions.

const SELF = chrome.runtime.getURL('');
const POPUP = chrome.runtime.getURL('palette.html');
const POPUP_W = 680;
const POPUP_H = 470;

const isBlank = (url = '') =>
  /^(chrome|edge|brave|helium):\/\/(newtab|new-tab-page)/.test(url) || url === 'about:blank' || url === '';

chrome.commands.onCommand.addListener(async (cmd, tab) => {
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
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['palette.js'] });
  } catch {
    // New tab, settings and web store pages can't be drawn on: float a small window over the browser instead.
    const win = await chrome.windows.get(tab.windowId);
    chrome.windows.create({
      url: `${POPUP}?tabId=${tab.id}&windowId=${tab.windowId}`, type: 'popup', focused: true,
      width: POPUP_W, height: POPUP_H,
      left: Math.round(win.left + (win.width - POPUP_W) / 2), top: Math.round(win.top + (win.height - POPUP_H) / 3)
    });
  }
}

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  const ctx = msg.origin || { tabId: sender.tab?.id, windowId: sender.tab?.windowId };
  const run = msg.type === 'search' ? search(msg.q, ctx) : msg.type === 'open' ? open(msg.item, msg.here, ctx) : null;
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
  const tabs = (await chrome.tabs.query({})).filter((t) => t.id !== ctx.tabId && !isBlank(t.url) && !t.url.startsWith(SELF));

  if (!q) {
    return tabs
      .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))
      .slice(0, 8)
      .map((t) => ({ kind: 'tab', id: t.id, windowId: t.windowId, title: t.title, url: t.url }));
  }

  const terms = q.toLowerCase().split(/\s+/);
  const [bookmarks, history] = await Promise.all([
    chrome.bookmarks.search(q).catch(() => []),
    chrome.history.search({ text: q, maxResults: 50, startTime: 0 }).catch(() => [])
  ]);

  const seen = new Set();
  const local = [];
  const add = (item, bonus) => {
    const key = cleanUrl(item.url).replace(/\/$/, '');
    if (!item.url || seen.has(key)) return;
    const s = score(terms, item.title, item.url);
    if (!s) return;
    seen.add(key);
    local.push({ ...item, score: s + bonus });
  };
  tabs.forEach((t) => add({ kind: 'tab', id: t.id, windowId: t.windowId, title: t.title, url: t.url }, 6));
  bookmarks.filter((b) => b.url).forEach((b) => add({ kind: 'bookmark', title: b.title, url: b.url }, 3));
  history.forEach((h) => add({ kind: 'history', title: h.title || h.url, url: h.url }, Math.min(4, Math.log2((h.visitCount || 1) + 1))));
  local.sort((a, b) => b.score - a.score);

  const action = looksLikeUrl(q)
    ? { kind: 'url', title: q, url: normalizeUrl(q) }
    : { kind: 'search', title: q };

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
