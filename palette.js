// feather palette UI. Injected into websites as a content script. Also loaded by feather's own pages
// (newtab.html, empty.html), and by the toolbar popup (palette.html) on browser pages no extension can draw on.
(() => {
  if (window.__feather) return window.__feather.toggle();

  const IN_EXT = location.protocol === 'chrome-extension:';
  const ON_NEWTAB = IN_EXT && location.pathname.endsWith('/newtab.html');
  const ON_EMPTY = IN_EXT && location.pathname.endsWith('/empty.html');
  const ON_PAGE = ON_NEWTAB || ON_EMPTY; // feather's own pages: the bar floats here like on a website
  const IN_POPUP = IN_EXT && !ON_PAGE;
  const LABEL = { tab: 'Switch to tab', bookmark: 'Bookmark', history: 'History', url: 'Open', search: 'Search' };
  const ICON_SEARCH = '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="7" cy="7" r="4.6"/><path d="m10.5 10.5 3.5 3.5" stroke-linecap="round"/></svg>';
  const ICON_GEAR = '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="2.2"/><path d="M8 1.5v1.8M8 12.7v1.8M1.5 8h1.8M12.7 8h1.8M3.4 3.4l1.3 1.3M11.3 11.3l1.3 1.3M3.4 12.6l1.3-1.3M11.3 4.7l1.3-1.3" stroke-linecap="round"/></svg>';
  const ICON_GLOBE ='<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="6"/><path d="M2 8h12M8 2c2 2.2 2 9.8 0 12M8 2c-2 2.2-2 9.8 0 12"/></svg>';

  const CSS = `
  :host { all: initial; }
  * { box-sizing: border-box; }
  /* Colors, glass strength and width come from settings (FEATHER.vars in settings.js). */
  .root {
    position: fixed; inset: 0; z-index: 2147483647; display: flex; justify-content: center; align-items: center;
    padding: 24px; background: var(--dim);
    font: 14px/1.35 "SF Pro Text", "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif;
    color: var(--text); -webkit-font-smoothing: antialiased;
  }
  /* The panel keeps one height whatever the results, so it sits dead center and never jumps. */
  .panel {
    width: min(var(--width), calc(100vw - 32px)); background: var(--surface); border: 1px solid var(--edge);
    border-radius: 20px; overflow: hidden;
    backdrop-filter: blur(var(--blur)) saturate(1.9); -webkit-backdrop-filter: blur(var(--blur)) saturate(1.9);
    box-shadow: 0 1px 0 var(--shine) inset, 0 32px 80px -16px rgba(0,0,0,.45), 0 6px 18px rgba(0,0,0,.1);
    animation: in .16s cubic-bezier(.2, .9, .3, 1);
  }
  @keyframes in { from { opacity: 0; transform: scale(.97); } }
  @media (prefers-reduced-motion: reduce) { .panel { animation: none; } }

  /* Popup window: the panel fills the window, and the page behind it supplies the frosted backdrop. */
  .root.popup { position: static; height: 100vh; padding: 0; align-items: stretch; background: none; }
  .popup .panel {
    width: 100%; display: flex; flex-direction: column; border: 0; border-radius: 0; box-shadow: 0 1px 0 var(--shine) inset; animation: none;
  }
  .popup .list { flex: 1; height: auto; }

  .field { display: flex; align-items: center; gap: 12px; padding: 0 18px; height: 58px; cursor: text; }
  .field svg { color: var(--muted); flex: none; }
  input {
    all: unset; flex: 1; cursor: text; font-family: inherit; font-size: 19px; font-weight: 450; line-height: 1.2; color: var(--text); caret-color: var(--accent);
  }
  input::placeholder { color: var(--muted); }

  .list { list-style: none; margin: 0; padding: 6px; border-top: 1px solid var(--line); height: min(var(--list-h), calc(100vh - 180px)); overflow-y: auto; }
  .row {
    display: grid; grid-template-columns: 16px 1fr auto; align-items: center; gap: 12px;
    height: 38px; padding: 0 12px; border-radius: 12px; cursor: default; position: relative; /* 38px: see ROW in settings.js */
  }
  .row:hover { background: var(--hover); }
  .row.on { background: var(--sel); box-shadow: 0 1px 0 var(--shine) inset, 0 1px 3px rgba(0,0,0,.06); }
  .row.on::before { content: ""; position: absolute; left: 0; top: 9px; bottom: 9px; width: 3px; border-radius: 3px; background: var(--accent); }
  .ico { width: 16px; height: 16px; display: grid; place-items: center; color: var(--muted); }
  .ico img { width: 16px; height: 16px; border-radius: 3px; }
  .text { min-width: 0; display: flex; align-items: baseline; gap: 10px; }
  .title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 0 1 auto; }
  .url { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--muted); font-size: 12.5px; flex: 1 1 0; min-width: 40px; }
  .tag { font-size: 12px; color: var(--muted); }
  .row.on .tag { color: var(--accent); }

  .foot { display: flex; align-items: center; gap: 16px; padding: 6px 10px 6px 18px; border-top: 1px solid var(--line); font-size: 12px; color: var(--muted); }
  .foot span { display: inline-flex; align-items: center; gap: 6px; }
  .foot b { font-weight: inherit; }
  .gear {
    all: unset; margin-left: auto; display: grid; place-items: center; width: 28px; height: 28px; border-radius: 8px; color: var(--muted); cursor: pointer;
  }
  .gear:hover { background: var(--hover); color: var(--text); }
  .gear:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
  kbd { font-family: inherit; font-size: 11px; font-weight: 500; line-height: 1; padding: 3px 6px; border-radius: 6px; background: var(--kbd); box-shadow: 0 1px 0 var(--shine) inset; color: var(--text); }
  `;

  const isMac = /Mac/.test(navigator.platform);
  const host = document.createElement('div');
  const shadow = host.attachShadow({ mode: 'closed' });
  shadow.innerHTML = `<style>${CSS}</style>
    <div class="root${IN_POPUP ? ' popup' : ''}">
      <div class="panel" role="dialog" aria-label="Search">
        <label class="field">${ICON_SEARCH}<input spellcheck="false" autocomplete="off" placeholder="Search or enter address" aria-label="Search or enter address"></label>
        <ul class="list" role="listbox"></ul>
        <div class="foot">
          <span><kbd>Enter</kbd> <b class="enter-does">open</b></span>
          <span><kbd>${isMac ? '⌥' : 'Alt'} Enter</kbd> <b class="alt-does">open here</b></span>
          <span><kbd>Esc</kbd> close</span>
          <button class="gear" title="Settings (${isMac ? '⌘,' : 'Ctrl+,'})" aria-label="feather settings">${ICON_GEAR}</button>
        </div>
      </div>
    </div>`;

  const root = shadow.querySelector('.root');
  const input = shadow.querySelector('input');
  const list = shadow.querySelector('.list');
  let items = [];
  let sel = 0;
  let reqId = 0;
  let timer = 0;
  let isOpen = false;
  let settings = FEATHER.defaults;

  function applySettings(s) {
    settings = s;
    for (const [name, value] of Object.entries(FEATHER.vars(s))) root.style.setProperty(name, value);
    if (IN_EXT) document.documentElement.classList.toggle('dark', FEATHER.isDark(s)); // our pages' backdrop follows the theme
    if (IN_POPUP) {
      // A toolbar popup takes the size of its page, up to 800×600.
      document.documentElement.style.width = `${Math.min(s.width, 800)}px`;
      document.documentElement.style.height = `${Math.min(FEATHER.barHeight(s), 600)}px`;
    }
  }
  applySettings(settings);

  // Keep keystrokes from reaching the page's own shortcuts.
  for (const type of ['keydown', 'keyup', 'keypress']) host.addEventListener(type, (e) => e.stopPropagation());

  // In the popup window, the worker needs to know which browser tab we were opened from.
  const params = new URLSearchParams(location.search);
  let origin = IN_POPUP ? { tabId: +params.get('tabId') || undefined, windowId: +params.get('windowId') || undefined } : null;
  const send = (msg) => chrome.runtime.sendMessage({ ...msg, origin });

  function favicon(url) {
    return chrome.runtime.getURL(`/_favicon/?pageUrl=${encodeURIComponent(url)}&size=32`);
  }

  function render() {
    list.replaceChildren(...items.map((item, i) => {
      const li = document.createElement('li');
      li.className = 'row' + (i === sel ? ' on' : '');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', i === sel);

      const ico = document.createElement('span');
      ico.className = 'ico';
      if (item.kind === 'search' || (item.kind === 'bang' && item.label.endsWith('DuckDuckGo'))) ico.innerHTML = ICON_SEARCH;
      else if (item.kind === 'url') ico.innerHTML = ICON_GLOBE;
      else {
        const img = document.createElement('img');
        img.src = favicon(item.url);
        img.alt = '';
        ico.append(img);
      }

      const text = document.createElement('span');
      text.className = 'text';
      const title = document.createElement('span');
      title.className = 'title';
      title.textContent = item.title || item.url;
      text.append(title);
      if (item.kind === 'tab' || item.kind === 'bookmark' || item.kind === 'history') {
        const url = document.createElement('span');
        url.className = 'url';
        url.textContent = item.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
        text.append(url);
      }

      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = item.label ?? LABEL[item.kind];

      li.append(ico, text, tag);
      li.addEventListener('mousemove', () => { if (sel !== i) { sel = i; mark(); } });
      li.addEventListener('mousedown', (e) => e.preventDefault()); // keep focus in the input
      li.addEventListener('click', (e) => choose(item, e.altKey));
      return li;
    }));
    footerFor(items[sel]);
  }

  function mark() {
    [...list.children].forEach((li, i) => {
      li.classList.toggle('on', i === sel);
      li.setAttribute('aria-selected', i === sel);
    });
    list.children[sel]?.scrollIntoView({ block: 'nearest' });
    footerFor(items[sel]);
  }

  let typed = '';       // what you actually typed; input.value may also hold the inline completion after it
  let completion = '';  // e.g. "youtube.com" while "you" is typed
  let allowFill = true; // false right after Backspace/Delete, so deleting the fill doesn't bring it back
  let lastQuery = null;

  async function query() {
    const id = ++reqId;
    const q = (lastQuery = typed);
    const res = await send({ type: 'search', q }).catch(() => null);
    if (id !== reqId || !Array.isArray(res)) return;
    items = res;
    sel = 0;
    render();
    completion = res[0]?.complete || '';
    fill();
    syncDefault();
    if (q.trim()) suggest(id, q);
  }

  // When the completion isn't showing (you deleted it, or pressed Esc), Enter should do what you typed.
  function syncDefault() {
    if (!items[0]?.complete || input.value !== typed) return;
    items.splice(0, 2, items[1], { ...items[0], complete: '' });
    sel = 0;
    render();
  }

  // Show the rest of the completion after what you typed, selected, so typing on simply replaces it.
  function fill() {
    const ok = allowFill && completion.length > typed.length && completion.toLowerCase().startsWith(typed.toLowerCase());
    const shown = ok ? typed + completion.slice(typed.length) : typed;
    if (input.value === shown) return;
    if (input.selectionStart < Math.min(typed.length, input.value.length)) return; // editing mid-text: leave it be
    input.value = shown;
    input.setSelectionRange(typed.length, shown.length);
  }

  // Search suggestions arrive after the local results; slot them in under the search row.
  async function suggest(id, q) {
    const words = await send({ type: 'suggest', q }).catch(() => null);
    if (id !== reqId || !Array.isArray(words) || !words.length) return;
    const picked = items[sel];
    const at = items.findIndex((it) => it.kind === 'search') + 1 || Math.min(items.length, 1);
    items.splice(at, 0, ...words.map((w) => ({ kind: 'search', title: w, label: '' })));
    sel = Math.max(0, items.indexOf(picked));
    render();
  }

  // Enter opens a typed address in a new tab; everything else follows "Enter opens" in settings. Alt flips it.
  const hereByDefault = (item) => item?.kind !== 'url' && settings.enterOpens === 'current';
  function footerFor(item) {
    const here = hereByDefault(item);
    shadow.querySelector('.enter-does').textContent = here ? 'open here' : 'open';
    shadow.querySelector('.alt-does').textContent = here ? 'new tab' : 'open here';
  }

  async function choose(item, alt) {
    if (!item) return;
    const here = alt !== hereByDefault(item);
    // The popup has to stay alive until the worker has the message.
    if (IN_POPUP) return send({ type: 'open', item, here }).finally(() => window.close());
    close();
    await send({ type: 'open', item, here });
  }

  function onKey(e) {
    // Tab and Shift+Tab move through the results too (and never leave the bar).
    const down = e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey) || (e.ctrlKey && (e.key === 'n' || e.key === 'j'));
    const up = e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey) || (e.ctrlKey && (e.key === 'p' || e.key === 'k'));
    if (down || up) {
      e.preventDefault();
      if (!items.length) return;
      sel = (sel + (down ? 1 : -1) + items.length) % items.length;
      mark();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(timer);
      // If results are stale (typed fast), search first, then act.
      const pending = typed !== lastQuery ? query() : Promise.resolve();
      pending.then(() => choose(items[sel], e.altKey));
    } else if ((isMac ? e.metaKey : e.ctrlKey) && e.key === ',') {
      // Ctrl+, (Cmd+, on Mac) opens settings, like most apps.
      e.preventDefault();
      send({ type: 'settings' }).finally(close);
    } else if (e.key === 'ArrowRight' && input.value !== typed && input.selectionEnd === input.value.length) {
      // Right arrow accepts the inline completion.
      e.preventDefault();
      typed = input.value;
      input.setSelectionRange(typed.length, typed.length);
      clearTimeout(timer);
      query();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      // First Esc drops the completion, like the address bar; the next one closes.
      if (input.value !== typed) {
        input.value = typed;
        completion = '';
        syncDefault();
      } else close();
    }
  }

  input.addEventListener('input', (e) => {
    typed = input.value;
    allowFill = !e.inputType?.startsWith('delete');
    fill(); // keep the last completion showing while new results load
    clearTimeout(timer);
    timer = setTimeout(query, 50);
  });
  input.addEventListener('keydown', onKey);
  root.addEventListener('mousedown', (e) => { if (e.target === root) close(); });
  shadow.querySelector('.gear').addEventListener('click', () => send({ type: 'settings' }).finally(close));

  async function open() {
    if (isOpen) return;
    isOpen = true;
    // Read settings on every open, so changes apply without reloading the page.
    applySettings(await FEATHER.load().catch(() => settings));
    if (!isOpen) return;
    // On <html>, not <body>: a page that transforms its body would otherwise knock the bar off center.
    document.documentElement.append(host);
    input.value = typed = completion = '';
    allowFill = true;
    items = [];
    render();
    input.focus();
    query();
  }

  function close() {
    if (IN_POPUP) return window.close();
    if (!isOpen) return;
    isOpen = false;
    clearTimeout(timer);
    host.remove();
  }

  window.__feather = { toggle: () => (isOpen ? close() : open()) };

  // Clicking back into the browser closes the popup, like clicking outside the bar on a page.
  if (IN_POPUP) window.addEventListener('blur', () => window.close());

  if (ON_PAGE) {
    // Ctrl+T or the toolbar icon toggles the bar on feather's own pages.
    chrome.tabs.getCurrent().then((tab) => {
      origin = { tabId: tab.id, windowId: tab.windowId };
      chrome.runtime.onMessage.addListener((m) => { if (m.type === 'toggle' && m.tabId === tab.id) window.__feather.toggle(); });
      if (ON_EMPTY) {
        // The empty page (after closing your last tab) is ready for the bar before any key is pressed.
        applySettings(settings);
        FEATHER.load().then(applySettings);
        return;
      }
      // The new tab page opens straight into the bar, like Zen. Esc or clicking outside hides it;
      // clicking the empty page brings it back. Capture phase, so it sees the bar's state before a
      // click on the backdrop closes it.
      document.addEventListener('mousedown', () => { if (!isOpen) open(); }, true);
      open();
    });
  } else {
    open();
  }
})();
