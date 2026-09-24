// feather's new tab page: the bar floats here like on any website, so there's no need for a separate window.
// Chromium puts keyboard focus in the address bar on a new tab page. Reloading once (from the browser side)
// hands focus to the page, so the bar gets your typing instead.
if (!location.search.includes('focus')) {
  chrome.tabs.getCurrent().then((tab) => chrome.tabs.update(tab.id, { url: chrome.runtime.getURL('newtab.html?focus') }));
} else {
  const s = document.createElement('script');
  s.src = 'palette.js';
  document.body.append(s);
}
