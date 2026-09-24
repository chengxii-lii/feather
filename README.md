<img src="icons/icon128.png" width="80" alt="">

# feather

A floating command palette for Chromium browsers, inspired by Arc and Zen. Press Ctrl+T and a glass search/URL bar floats in the middle of the page, without opening a new tab. From there you can jump to an open tab, find a bookmark or history entry, or search the web.

Made for [Helium](https://helium.computer), and works in any Chromium browser. Free and open source.

## Install

1. Download or clone this repository.
2. Open your browser's extensions page (`chrome://extensions`).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and pick the `feather` folder.
5. Set the shortcut to Ctrl+T. Browsers don't let an extension claim Ctrl+T on its own, so you set it once yourself: open `chrome://extensions/shortcuts`, click the pencil next to feather's "Open or close feather", and press **Ctrl+T**.

## Use

- **Ctrl+T** (or Ctrl+Shift+K until you set Ctrl+T) opens or closes the bar over the current page. Clicking feather's toolbar icon does the same.
- On pages extensions can't draw on (the new tab page, settings, the web store), the bar opens as a small window in the middle of the browser.

| Key | Action |
| --- | --- |
| Enter | Switch to the tab, or open the result in a new tab |
| Alt/Option+Enter | Open in the current tab |
| Right arrow | Accept the autocompleted address |
| Tab/Shift+Tab, Up/Down or Ctrl+N/P | Move through the results |
| Esc | Drop the autocompleted address, or close |

- **Autocomplete:** type the start of a site you've visited and feather fills in the rest (`you` → `youtube.com`), like the address bar.
- **Suggestions:** search suggestions appear as you type.
- **!bangs:** `!yt lofi`, `lofi !yt`, `!gh feather` and so on. Popular bangs go straight to the site, and any other bang goes through DuckDuckGo, which knows all 13,000+ of them. Plain searches use your default search engine.

**Privacy:** to show suggestions, feather sends what you type to DuckDuckGo's autocomplete service. You can turn this off in settings. Your tabs, bookmarks and history never leave your computer.

## Settings

Click the gear in the bar's corner, press **Ctrl+,** while the bar is open, press **Ctrl+Shift+,** anywhere (you can change this shortcut), or right-click feather's toolbar icon and choose **Options**. A live preview shows your changes as you make them.

- **Appearance:** theme (system, light or dark), how clear the glass is, accent color, the bar's width (480–960 px) and height (4–12 results), and whether the page dims behind the bar
- **Search:** whether Enter opens searches, bookmarks and history in a new tab or the current one (addresses you type always open in a new tab), autocomplete, search suggestions, and which of tabs, bookmarks and history to search
- **Your bangs:** add your own, like `!mdn` → `https://developer.mozilla.org/search?q=%s`
- **Shortcuts:** see and change the shortcuts for opening feather and opening settings

## License

[MIT](LICENSE). The feather icon is from [Feather Icons](https://feathericons.com) (MIT). To rebuild the icon PNGs, run `node icons/make-icons.js` (needs Google Chrome).
