// feather palette UI. Injected into pages as a content script, and also loaded by the new tab page.
(() => {
  if (window.__feather) return window.__feather.toggle();

  const ON_NEWTAB = location.protocol === 'chrome-extension:';
  const LABEL = { tab: 'Switch to tab', bookmark: 'Bookmark', history: 'History', url: 'Open', search: 'Search' };
  const ICON_SEARCH = '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="7" cy="7" r="4.6"/><path d="m10.5 10.5 3.5 3.5" stroke-linecap="round"/></svg>';
  const ICON_GLOBE = '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="6"/><path d="M2 8h12M8 2c2 2.2 2 9.8 0 12M8 2c-2 2.2-2 9.8 0 12"/></svg>';

  const CSS = `
  :host { all: initial; }
  * { box-sizing: border-box; }
  .root {
    --surface: rgba(250, 250, 252, .9); --line: rgba(20, 22, 30, .1); --text: #17181c;
    --muted: #6b6f7a; --hover: rgba(20, 22, 30, .05); --accent: #3f55d9; --sel: rgba(63, 85, 217, .1);
    --kbd: rgba(20, 22, 30, .07);
    position: fixed; inset: 0; z-index: 2147483647; display: flex; justify-content: center; align-items: flex-start;
    padding-top: 16vh; background: rgba(12, 14, 20, .18);
    font: 14px/1.35 "SF Pro Text", "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif;
    color: var(--text); -webkit-font-smoothing: antialiased;
  }
  @media (prefers-color-scheme: dark) {
    .root {
      --surface: rgba(32, 33, 39, .9); --line: rgba(255, 255, 255, .09); --text: #ecedf1;
      --muted: #8d919c; --hover: rgba(255, 255, 255, .05); --accent: #93a3ff; --sel: rgba(147, 163, 255, .13);
      --kbd: rgba(255, 255, 255, .08); background: rgba(0, 0, 0, .3);
    }
  }
  .root.home { background: transparent; }
  .panel {
    width: min(640px, calc(100vw - 32px)); background: var(--surface); border: 1px solid var(--line);
    border-radius: 16px; overflow: hidden;
    backdrop-filter: blur(28px) saturate(1.6); -webkit-backdrop-filter: blur(28px) saturate(1.6);
    box-shadow: 0 1px 0 rgba(255,255,255,.06) inset, 0 24px 60px -12px rgba(0,0,0,.35), 0 4px 14px rgba(0,0,0,.08);
    animation: in .14s cubic-bezier(.2, .9, .3, 1);
  }
  @keyframes in { from { opacity: 0; transform: translateY(-6px) scale(.985); } }
  @media (prefers-reduced-motion: reduce) { .panel { animation: none; } }

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
    padding: 9px 12px; border-radius: 10px; cursor: default; position: relative;
  }
  .row:hover { background: var(--hover); }
  .row.on { background: var(--sel); }
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
  kbd { font-family: inherit; font-size: 11px; font-weight: 500; line-height: 1; padding: 3px 6px; border-radius: 5px; background: var(--kbd); color: var(--text); }
  `;

  const isMac = /Mac/.test(navigator.platform);
  const host = document.createElement('div');
  const shadow = host.attachShadow({ mode: 'closed' });
  shadow.innerHTML = `<style>${CSS}</style>
    <div class="root${ON_NEWTAB ? ' home' : ''}">
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

  let origin = null; // on the new tab page, the worker needs to know which tab we are
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
    if (!isOpen) return;
    isOpen = false;
    clearTimeout(timer);
    host.remove();
  }

  window.__feather = { toggle: () => (isOpen ? close() : open()) };

  if (ON_NEWTAB) {
    chrome.tabs.getCurrent().then((tab) => {
      origin = { tabId: tab.id, windowId: tab.windowId };
      chrome.runtime.onMessage.addListener((m) => { if (m.type === 'toggle' && m.tabId === tab.id) window.__feather.toggle(); });
      document.addEventListener('mousedown', () => open());
      open();
    });
  } else {
    open();
  }
})();
