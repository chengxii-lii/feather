# feather

A floating command palette for Chromium browsers, inspired by Arc and Zen. Press Ctrl+T and a search/URL bar floats over the page. From there you can jump to an open tab, find a bookmark or history entry, or search the web.

Made for [Helium](https://helium.computer), and works in any Chromium browser. Free and open source.

## Install

1. Download or clone this repository.
2. Open your browser's extensions page (`chrome://extensions`).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and pick the `feather` folder.

## Use

- **Ctrl+T** opens a new tab with the bar (feather replaces the new tab page).
- **Ctrl+Shift+K** (Cmd+Shift+K on Mac) opens the bar on the current page. You can change this shortcut on the extensions shortcuts page (`chrome://extensions/shortcuts`).

| Key | Action |
| --- | --- |
| Enter | Switch to the tab, or open the result in a new tab |
| Alt/Option+Enter | Open in the current tab |
| Up/Down or Ctrl+N/P | Move through the results |
| Esc or click outside | Close |

Web searches use your default search engine, so Helium's !bangs work. On settings pages, where extensions can't run, the shortcut opens a new tab with the bar.

## License

[MIT](LICENSE)
