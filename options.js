// feather settings page: every change saves right away and shows in the preview.
const $ = (sel) => document.querySelector(sel);
const form = document.querySelectorAll('[name]');
let s;

// ---------- Look ----------

function paint() {
  const dark = FEATHER.isDark(s);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const vars = FEATHER.vars(s, dark);
  for (const [name, value] of Object.entries(vars)) document.documentElement.style.setProperty(name, value);
  document.documentElement.style.setProperty('--quill', vars['--accent']);

  // Swatches show the accent as it will look in the current theme.
  for (const input of document.querySelectorAll('[name="accent"]')) {
    input.style.setProperty('--c', FEATHER.accents[input.value][dark ? 1 : 0]);
  }

  // The preview reflects what the bar will actually show.
  $('#p-fill').hidden = !s.autocomplete;
  $('#p-complete').hidden = !s.autocomplete;
  $('#p-suggest').hidden = !s.suggestions;
  $('#p-tab').hidden = !s.tabs;
  const first = document.querySelector('#bar li:not([hidden])');
  for (const li of document.querySelectorAll('#bar li')) li.classList.toggle('on', li === first);
  // The preview's selected row is a typed address when autocomplete is on, and those always open in a new tab.
  const here = s.enterOpens === 'current' && !s.autocomplete;
  $('#p-enter').textContent = here ? 'open here' : 'open';
  $('#p-alt').textContent = here ? 'new tab' : 'open here';

  $('#width-out').textContent = `${s.width} px`;
  $('#rows-out').textContent = `${s.rows} results`;
  fitPreview();
}

// The preview bar is drawn at its real size, then shrunk to fit the stage, so width and height read true.
function fitPreview() {
  const stage = $('.stage');
  const bar = $('#bar');
  const k = Math.min(1, (stage.clientWidth - 48) / s.width, (stage.clientHeight - 32) / FEATHER.barHeight(s));
  bar.style.transform = `translate(-50%, -50%) scale(${k.toFixed(3)})`;
}
addEventListener('resize', () => s && fitPreview());
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => s && paint());

let savedTimer = 0;
function saved() {
  $('#saved').classList.add('on');
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => $('#saved').classList.remove('on'), 1400);
}

async function set(patch) {
  Object.assign(s, patch);
  paint();
  await FEATHER.save(patch);
  saved();
}

// ---------- Controls ----------

function buildAccents() {
  $('#accents').replaceChildren(...Object.keys(FEATHER.accents).map((name) => {
    const label = document.createElement('label');
    label.title = name[0].toUpperCase() + name.slice(1);
    const input = document.createElement('input');
    Object.assign(input, { type: 'radio', name: 'accent', value: name });
    input.setAttribute('aria-label', label.title);
    label.append(input);
    return label;
  }));
}

function fill() {
  for (const el of document.querySelectorAll('[name]')) {
    if (el.type === 'radio') el.checked = s[el.name] === el.value;
    else if (el.type === 'checkbox') el.checked = !!s[el.name];
    else if (el.type === 'range') el.value = s[el.name];
  }
  renderBangs();
}

function wire() {
  for (const el of document.querySelectorAll('[name]')) {
    if (el.type === 'range') {
      // Slide to preview; save once you let go (storage limits how often we can write).
      el.addEventListener('input', () => { s[el.name] = +el.value; paint(); });
      el.addEventListener('change', () => set({ [el.name]: +el.value }));
    } else {
      el.addEventListener('change', () => set({ [el.name]: el.type === 'checkbox' ? el.checked : el.value }));
    }
  }
  $('#add-bang').addEventListener('click', () => {
    s.bangs.push({ key: '', url: '' });
    renderBangs();
    document.querySelector('.bang:last-child .field-in').focus();
  });
  $('#reset').addEventListener('click', resetClick);
  for (const btn of document.querySelectorAll('.change-shortcut')) {
    btn.addEventListener('click', () => chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }));
  }
}

// ---------- Bangs ----------

const validKey = (k) => /^[\w.-]+$/.test(k);
const validUrl = (u) => /^https?:\/\/\S+$/i.test(u) && u.includes('%s');

function renderBangs() {
  $('#bangs').replaceChildren(...s.bangs.map((bang, i) => {
    const row = document.createElement('div');
    row.className = 'bang';
    row.innerHTML = `
      <label class="key"><b>!</b><input class="field-in" placeholder="name" aria-label="Bang name" spellcheck="false"></label>
      <input class="field-in url" placeholder="https://example.com/search?q=%s" aria-label="Search address" spellcheck="false">
      <button class="remove" type="button" aria-label="Remove bang">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
      </button>`;
    const [key, url] = row.querySelectorAll('input');
    key.value = bang.key;
    url.value = bang.url;
    const update = () => {
      bang.key = key.value.trim().replace(/^!/, '');
      bang.url = url.value.trim();
      key.setAttribute('aria-invalid', !!bang.key && !validKey(bang.key));
      url.setAttribute('aria-invalid', !!bang.url && !validUrl(bang.url));
    };
    key.addEventListener('input', update);
    url.addEventListener('input', update);
    key.addEventListener('change', saveBangs);
    url.addEventListener('change', saveBangs);
    row.querySelector('.remove').addEventListener('click', () => {
      s.bangs.splice(i, 1);
      renderBangs();
      saveBangs();
    });
    update();
    return row;
  }));
}

// Only complete, valid bangs are stored; half-typed ones stay on screen until they're finished.
function saveBangs() {
  const ready = s.bangs.filter((b) => validKey(b.key) && validUrl(b.url));
  const broken = s.bangs.filter((b) => (b.key || b.url) && !ready.includes(b));
  $('#bang-err').textContent = broken.length
    ? 'Finish the highlighted bang: a name of letters or numbers, and an address with %s in it.'
    : '';
  FEATHER.save({ bangs: ready.map(({ key, url }) => ({ key, url })) }).then(saved);
}

// ---------- Shortcut ----------

function showKeys(el, keys) {
  if (!keys) {
    el.innerHTML = '<span class="unset">Not set</span>';
    return;
  }
  const box = document.createElement('span');
  box.className = 'keys';
  // "Ctrl+Shift+," splits into Ctrl / Shift / ,
  box.replaceChildren(...keys.split(/\+(?!$)/).map((k) => Object.assign(document.createElement('kbd'), { textContent: k })));
  el.replaceChildren(box);
}

async function showShortcuts() {
  const all = await chrome.commands.getAll();
  const keysFor = (name) => all.find((c) => c.name === name)?.shortcut || '';

  const toggle = keysFor('toggle-palette');
  showKeys($('#toggle-palette-keys'), toggle);
  $('#toggle-palette-hint').textContent = /^Ctrl\+T$|^⌘T$/.test(toggle)
    ? 'Ctrl+T opens feather instead of a new tab.'
    : 'Set it to Ctrl+T to open feather instead of a new tab.';

  const close = keysFor('close-tab');
  showKeys($('#close-tab-keys'), close);
  $('#close-tab-hint').textContent = /^Ctrl\+W$|^⌘W$/.test(close)
    ? 'Ctrl+W closes tabs, and unloads pinned ones instead of closing them.'
    : 'Set it to Ctrl+W so pinned tabs unload instead of closing.';

  const settings = keysFor('open-settings');
  showKeys($('#open-settings-keys'), settings);
  const inBar = /Mac/.test(navigator.platform) ? '⌘,' : 'Ctrl+,';
  $('#open-settings-hint').textContent = settings
    ? `Works anywhere in the browser. ${inBar} also works while the bar is open.`
    : `Pick any keys you like. ${inBar} already works while the bar is open.`;
}
// Shortcuts are changed on the browser's own page, so refresh when you come back.
addEventListener('focus', showShortcuts);

// ---------- Wallpaper ----------

async function showWallpaper() {
  const image = await FEATHER.getWallpaper();
  $('#wp-thumb').hidden = $('#wp-remove').hidden = !image;
  if (image) $('#wp-thumb').src = image;
  $('#wp-choose').textContent = image ? 'Change' : 'Choose image';
}

// Shrink big images to screen size and store them as JPEG, so they fit comfortably in storage.
async function useWallpaper(file) {
  const bitmap = await createImageBitmap(file);
  const max = Math.max(screen.width, screen.height) * devicePixelRatio || 3840;
  const k = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = Object.assign(document.createElement('canvas'), { width: Math.round(bitmap.width * k), height: Math.round(bitmap.height * k) });
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  await FEATHER.setWallpaper(canvas.toDataURL('image/jpeg', 0.9));
  await showWallpaper();
  saved();
}

function wireWallpaper() {
  $('#wp-choose').addEventListener('click', () => $('#wp-file').click());
  $('#wp-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) useWallpaper(file).catch(() => { $('#wp-hint').textContent = 'That image couldn’t be opened. Try a JPG or PNG.'; });
    e.target.value = '';
  });
  $('#wp-remove').addEventListener('click', async () => {
    await FEATHER.setWallpaper('');
    await showWallpaper();
    saved();
  });
}

// ---------- Reset ----------

let armed = 0;
function resetClick() {
  const btn = $('#reset');
  if (!armed) {
    btn.textContent = 'Click again to reset everything';
    armed = setTimeout(() => { armed = 0; btn.textContent = 'Reset to defaults'; }, 3000);
    return;
  }
  clearTimeout(armed);
  armed = 0;
  btn.textContent = 'Reset to defaults';
  s = structuredClone(FEATHER.defaults);
  Promise.all([chrome.storage.sync.clear(), FEATHER.setWallpaper('')]).then(saved);
  showWallpaper();
  fill();
  paint();
}

// ---------- Start ----------

(async () => {
  $('#ver').textContent = 'v' + chrome.runtime.getManifest().version;
  buildAccents();
  s = await FEATHER.load();
  s.bangs = [...s.bangs];
  fill();
  paint();
  wire();
  wireWallpaper();
  showWallpaper();
  showShortcuts();
})();
