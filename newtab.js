// Chromium focuses the address bar on new tab pages. Reloading ourselves once hands focus to the page,
// so the floating bar gets your typing instead.
if (!location.search.includes('focus')) {
  chrome.tabs.getCurrent().then((tab) => chrome.tabs.update(tab.id, { url: chrome.runtime.getURL('newtab.html?focus') }));
} else {
  const s = document.createElement('script');
  s.src = 'palette.js';
  document.body.append(s);
}
