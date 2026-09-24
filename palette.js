// feather palette UI. Injected into pages as a content script, and also loaded by the popup window
// (palette.html) on pages extensions can't draw on.
(() => {
  if (window.__feather) return window.__feather.toggle();

  const IN_POPUP = location.protocol === 'chrome-extension:';
  const LABEL = { tab: 'Switch to tab', bookmark: 'Bookmark', history: 'History', url: 'Open', search: 'Search' };
  const ICON_SEARCH = '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="7" cy="7" r="4.6"/><path d="m10.5 10.5 3.5 3.5" stroke-linecap="round"/></svg>';
  const ICON_GLOBE = '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="6"/><path d="M2 8h12M8 2c2 2.2 2 9.8 0 12M8 2c-2 2.2-2 9.8 0 12"/></svg>';

  const CSS = `
  :host { all: initial; }
  * { box-sizing: border-box; }
  .root {
    --surface: rgba(255, 255, 255, .5); --edge: rgba(255, 255, 255, .6); --shine: rgba(255, 255, 255, .75);
    --line: rgba(20, 22, 30, .08); --text: #15161a; --muted: rgba(21, 22, 26, .56);
    --hover: rgba(255, 255, 255, .4); --accent: #3f55d9; --sel: rgba(255, 255, 255, .7);
    --kbd: rgba(255, 255, 255, .6); --dim: rgba(10, 12, 20, .12);
    position: fixed; inset: 0; z-index: 2147483647; display: flex; justify-content: center; align-items: flex-start;
    /* Center a full panel (about 420px tall); results grow downward so the input never jumps. */
    padding-top: max(24px, calc(50vh - 210px)); background: var(--dim);
    font: 14px/1.35 "SF Pro Text", "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif;
    color: var(--text); -webkit-font-smoothing: antialiased;
  }
  @media (prefers-color-scheme: dark) {
    .root {
      --surface: rgba(28, 29, 36, .5); --edge: rgba(255, 255, 255, .12); --shine: rgba(255, 255, 255, .14);
      --line: rgba(255, 255, 255, .08); --text: #f0f1f5; --muted: rgba(240, 241, 245, .52);
      --hover: rgba(255, 255, 255, .06); --accent: #9aa9ff; --sel: rgba(255, 255, 255, .11);
      --kbd: rgba(255, 255, 255, .1); --dim: rgba(0, 0, 0, .28);
    }
  }
  .panel {
    width: min(640px, calc(100vw - 32px)); background: var(--surface); border: 1px solid var(--edge);
    border-radius: 20px; overflow: hidden;
    backdrop-filter: blur(40px) saturate(1.9); -webkit-backdrop-filter: blur(40px) saturate(1.9);
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
  .popup .list { flex: 1; max-height: none; }
  .popup .foot { margin-top: auto; }

  .field { display: flex; align-items: center; gap: 12px; padding: 0 18px; height: 58px; }
  .field svg { color: var(--muted); flex: none; }
  input {
    all: unset; flex: 1; font-family: inherit; font-size: 19px; font-weight: 450; line-height: 1.2; color: var(--text); caret-color: var(--accent);
  }
  input::placeholder { color: var(--muted); }

  .list { list-style: none; margin: 0; padding: 6px; border-top: 1px solid var(--line); max-height: 400px; overflow-y: auto; }
  .list:empty { display: none; }
  .row {
    display: grid; grid-template-columns: 16px 1fr auto; align-items: center; gap: 12px;
    padding: 9px 12px; border-radius: 12px; cursor: default; position: relative;
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

  .foot { display: flex; gap: 16px; padding: 8px 18px 10px; border-top: 1px solid var(--line); font-size: 12px; color: var(--muted); }
  .foot span { display: inline-flex; align-items: center; gap: 6px; }
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
          <span><kbd>Enter</kbd> open</span>
          <span><kbd>${isMac ? '⌥' : 'Alt'} Enter</kbd> open here</span>
          <span><kbd>Esc</kbd> close</span>
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

  // Keep keystrokes from reaching the page's own shortcuts.
  for (const type of ['keydown', 'keyup', 'keypress']) host.addEventListener(type, (e) => e.stopPropagation());

  // In the popup window, the worker needs to know which browser tab we were opened from.
  const params = new URLSearchParams(location.search);
  const origin = IN_POPUP ? { tabId: +params.get('tabId') || undefined, windowId: +params.get('windowId') || undefined } : null;
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
      if (item.kind === 'search') ico.innerHTML = ICON_SEARCH;
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
      if (item.kind !== 'search' && item.kind !== 'url') {
        const url = document.createElement('span');
        url.className = 'url';
        url.textContent = item.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
        text.append(url);
      }

      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = LABEL[item.kind];

      li.append(ico, text, tag);
      li.addEventListener('mousemove', () => { if (sel !== i) { sel = i; mark(); } });
      li.addEventListener('mousedown', (e) => e.preventDefault()); // keep focus in the input
      li.addEventListener('click', (e) => choose(item, e.altKey));
      return li;
    }));
  }

  function mark() {
    [...list.children].forEach((li, i) => {
      li.classList.toggle('on', i === sel);
      li.setAttribute('aria-selected', i === sel);
    });
    list.children[sel]?.scrollIntoView({ block: 'nearest' });
  }

  async function query() {
    const id = ++reqId;
    const res = await send({ type: 'search', q: input.value }).catch(() => null);
    if (id !== reqId || !Array.isArray(res)) return;
    items = res;
    sel = 0;
    render();
  }

  async function choose(item, here) {
    if (!item) return;
    // The popup has to stay alive until the worker has the message.
    if (IN_POPUP) return send({ type: 'open', item, here }).finally(() => window.close());
    close();
    await send({ type: 'open', item, here });
  }

  function onKey(e) {
    const down = e.key === 'ArrowDown' || (e.ctrlKey && (e.key === 'n' || e.key === 'j'));
    const up = e.key === 'ArrowUp' || (e.ctrlKey && (e.key === 'p' || e.key === 'k'));
    if (down || up) {
      e.preventDefault();
      if (!items.length) return;
      sel = (sel + (down ? 1 : -1) + items.length) % items.length;
      mark();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(timer);
      // If results are stale (typed fast), search first, then act.
      const pending = input.value !== lastQuery ? query() : Promise.resolve();
      pending.then(() => choose(items[sel], e.altKey));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  }

  let lastQuery = null;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => { lastQuery = input.value; query(); }, 50);
  });
  input.addEventListener('keydown', onKey);
  root.addEventListener('mousedown', (e) => { if (e.target === root) close(); });

  function open() {
    if (isOpen) return;
    isOpen = true;
    (document.body || document.documentElement).append(host);
    input.value = '';
    lastQuery = '';
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
  open();
})();
