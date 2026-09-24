// Builds feather's icons: the Feather Icons "feather" (MIT, feathericons.com) in white on a dark glass tile.
// Run: node icons/make-icons.js  (renders the PNGs with headless Chrome)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FEATHER = '<path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/>';

// Small sizes fill the whole square and use a thicker line so they stay legible in the toolbar.
const SIZES = { 16: { pad: 0, stroke: 2.6, art: 0.72 }, 32: { pad: 0, stroke: 2.3, art: 0.66 }, 48: { pad: 2, stroke: 2.1, art: 0.6 }, 128: { pad: 8, stroke: 2, art: 0.56 } };

function svg(size, { pad, stroke, art }) {
  const tile = size - pad * 2;
  const s = (tile * art) / 20; // the feather spans about 20 units of its 24-unit grid
  const tx = size / 2 - 11.6 * s; // center of the feather's shape is about (11.6, 12)
  const ty = size / 2 - 12 * s;
  const r = tile * 0.24;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34384a"/><stop offset="1" stop-color="#15161c"/></linearGradient>
    <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
  </defs>
  <rect x="${pad}" y="${pad}" width="${tile}" height="${tile}" rx="${r}" fill="url(#bg)"/>
  <rect x="${pad + 0.5}" y="${pad + 0.5}" width="${tile - 1}" height="${tile - 1}" rx="${r - 0.5}" fill="none" stroke="url(#shine)"/>
  <g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(4)})" fill="none" stroke="#fff" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${FEATHER}</g>
</svg>`;
}

for (const [size, opts] of Object.entries(SIZES)) {
  const file = path.join(__dirname, `icon${size}.svg`);
  fs.writeFileSync(file, svg(+size, opts));
  const html = path.join(__dirname, `tmp${size}.html`);
  fs.writeFileSync(html, `<style>html,body{margin:0;background:transparent}img{display:block}</style><img src="icon${size}.svg">`);
  execFileSync(CHROME, ['--headless', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--default-background-color=00000000', `--window-size=${size},${size}`,
    `--screenshot=${path.join(__dirname, `icon${size}.png`)}`, 'file:///' + html.replace(/\\/g, '/')], { stdio: 'ignore' });
  fs.unlinkSync(html);
}
fs.copyFileSync(path.join(__dirname, 'icon128.svg'), path.join(__dirname, 'feather.svg'));
for (const size of Object.keys(SIZES)) fs.unlinkSync(path.join(__dirname, `icon${size}.svg`));
