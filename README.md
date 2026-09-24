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
| Up/Down or Ctrl+N/P | Move through the results |
| Esc or click outside | Close |

Web searches use your default search engine, so Helium's !bangs work.

## License

[MIT](LICENSE)
