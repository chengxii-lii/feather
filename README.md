<img src="icons/icon128.png" width="80" alt="">

# feather

Quality-of-life upgrades for [Helium](https://helium.computer), borrowing the best ideas from Arc and Zen. Made for Helium, and works in any Chromium browser. Free and open source.

- **[Command bar](#command-bar):** press Ctrl+T and a glass search bar floats over the page. Jump to tabs, bookmarks and history, or search the web with !bangs.
- **[Zen-style pinned tabs](#pinned-tabs):** Ctrl+W on a pinned tab unloads it instead of closing it.
- **[Pages](#pages):** new tabs open straight into the bar, and closing your last tab leaves a calm empty page. Both can show your desktop wallpaper, so they look see-through.

## Install

1. Download the latest zip from [Releases](https://github.com/chengxii-lii/feather/releases), unzip it, or clone this repository.
2. Open your browser's extensions page (`chrome://extensions`).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and pick the `feather` folder.
5. Set up the shortcuts. Browsers don't let an extension claim Ctrl+T or Ctrl+W on its own, so you set them once yourself. Open `chrome://extensions/shortcuts`, and next to feather:
   - set **Open or close the command bar** to **Ctrl+T**
   - set **Close tab** to **Ctrl+W**

## Command bar

- **Ctrl+T** (or Ctrl+Shift+K until you set Ctrl+T) opens or closes the bar over the current page. Clicking feather's toolbar icon does the same.
- **New tabs open straight into the bar**, like Zen (see [Pages](#pages)).
- **Browser pages:** Chromium doesn't let any extension draw on its own pages (settings, extensions, the Web Store, the PDF viewer). There, the bar drops down from feather's toolbar icon instead.

| Key | Action |
| --- | --- |
| Enter | Switch to the tab, or open the result in a new tab |
| Alt/Option+Enter | Open in the current tab |
| Right arrow | Accept the autocompleted address |
| Tab/Shift+Tab, Up/Down or Ctrl+N/P | Move through the results |
| Ctrl+, | Open settings |
| Esc | Drop the autocompleted address, or close |

- **Autocomplete:** type the start of a site you've visited and feather fills in the rest (`you` → `youtube.com`), like the address bar.
- **Suggestions:** search suggestions appear as you type.
- **!bangs:** `!yt lofi`, `lofi !yt`, `!gh feather` and so on. Popular bangs go straight to the site, and any other bang goes through DuckDuckGo, which knows all 13,000+ of them. Plain searches use your default search engine.

**Privacy:** to show suggestions, feather sends what you type in the bar to DuckDuckGo's autocomplete service. You can turn this off in settings. Your tabs, bookmarks and history never leave your computer.

## Pinned tabs

Like Zen: with **Close tab** set to Ctrl+W, closing a pinned tab only unloads it. It stays pinned in your tab strip, stops using memory, and reloads when you click it again.

- feather takes you back to the tab you used last.
- When every pinned tab is unloaded and nothing else is open, you land on feather's empty page.
- Normal tabs close as usual. Closing your last tab leaves the empty page instead of closing the window, and never wakes up an unloaded pinned tab. Ctrl+W does nothing on the empty page.

This only applies to Ctrl+W (the Close tab shortcut). Closing a pinned tab with its × button or the mouse still closes it, because extensions can't change what those do. Helium doesn't dim unloaded tabs either, so an unloaded pinned tab looks the same as a loaded one.

## Pages

- **New tab page:** feather replaces the new tab page with a calm page and the bar on top, like Zen. Esc hides the bar; click the page or press Ctrl+T to bring it back. The first time, your browser may ask whether to keep this new tab page. Choose to keep it.
- **Empty page:** when you close your last tab with Ctrl+W, you land on an empty feather page instead of the window closing. Press Ctrl+T to search from there. Ctrl+W does nothing here; close the window itself if you want it gone.
- **Wallpaper:** choose your desktop wallpaper in settings, and both pages show it lined up with your screen, so they look see-through. A browser page can't be truly transparent, so this is a copy: if you change your wallpaper, choose it again. On Windows, your current wallpaper is usually in `%AppData%\Microsoft\Windows\Themes`.

On a brand-new tab, Chromium keeps the typing cursor in the address bar. Click the bar, or anywhere on the page, to type in feather instead.

## Settings

Click the gear in the bar's corner, press **Ctrl+,** while the bar is open, press **Ctrl+Shift+,** anywhere, or right-click feather's toolbar icon and choose **Options**.

- **Command bar:** a live preview, then theme, glass clarity, accent color, width (480–960 px), height (4–12 results), page dimming, what Enter does, autocomplete, suggestions, which of tabs, bookmarks and history to search, and your own bangs (like `!mdn` → `https://developer.mozilla.org/search?q=%s`)
- **Tabs:** turn Zen-style pinned tabs on or off
- **Pages:** choose a wallpaper for feather's pages
- **Shortcuts:** see every feather shortcut and change it

## License

[MIT](LICENSE). The feather icon is from [Feather Icons](https://feathericons.com) (MIT). To rebuild the icon PNGs, run `node icons/make-icons.js` (needs Google Chrome).
