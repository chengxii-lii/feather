# feather design system

## Direction

feather should feel **weightless**: a pane of glass floating over whatever you were doing, there when you call it and gone the moment you're done. It's calm and quiet, with nothing loud. The page behind is always part of the look; the bar never hides it completely.

- **The bar (palette.js)** is the product. Everything else serves it.
- **Settings (options.html)** is a quiet page in the feather world: a pale sky with cloud-white cards and ink text. Its signature is the **live preview**: the real bar, drawn at its real size and scaled to fit, floating over a sample page. It updates as you change any setting.

## Tokens

The bar's tokens come from `FEATHER.vars()` in `settings.js`, the single source for both the bar and the preview. Don't hardcode them anywhere else.

| Token | Light | Dark | Meaning |
| --- | --- | --- | --- |
| `--surface` | white at 0.8–0.2 alpha | rgb(28 29 36) at 0.8–0.2 | the glass; its alpha comes from the Glass setting |
| `--blur` | 16–64px | same | backdrop blur; also from Glass |
| `--edge` | white .6 | white .12 | 1px panel border |
| `--shine` | white .75 | white .14 | 1px inset top highlight on glass, selected rows and kbd |
| `--line` | ink .08 | white .08 | dividers inside the bar |
| `--text` / `--muted` | #15161a / ink .56 | #f0f1f5 / white .52 | two text tiers in the bar |
| `--hover` / `--sel` | white .4 / .7 | white .06 / .11 | row states: brighter glass, never gray |
| `--accent` | from the accent setting (light value) | from the accent setting (dark value) | caret, selected-row bar, selected tag, inline-fill highlight |
| `--dim` | ink .12 | black .28 | page scrim (transparent when Dim is off) |
| `--width`, `--list-h` | from the Width and Height settings | | size |

Settings page tokens (options.html): `--sky` (page), `--cloud` (cards), `--ink`, `--ink-soft`, `--ink-faint`, `--hairline`, `--well` (inset control fill), `--ring` (card lift), `--quill` (= the accent), `--warn`.

Accents always come in [light, dark] pairs (`FEATHER.accents`): blue, violet, pink, orange, green, graphite. The dark value is a lighter, desaturated version of the light one.

## Depth

- **Bar:** glass. It uses backdrop blur with saturate(1.9), a 1px `--edge` border, a 1px inset `--shine` highlight on top, and one soft deep shadow (`0 32px 80px -16px rgba(0,0,0,.45), 0 6px 18px rgba(0,0,0,.1)`). The selected row is "raised glass": `--sel` fill plus an inset `--shine` highlight.
- **Settings:** no glass outside the preview. Cards are lifted with a ring shadow (light: a 1px ring plus two soft layers; dark: a single 1px white .08 ring). Rows inside a card are separated by `--hairline` dividers.

## Measurements

- **Spacing:** 4px base.
  - Bar: input side padding 18, list padding 6, row padding 0 12, gap 12.
  - Settings: card row padding 12 16 with a minimum height of 60; 24px gap between label and control; 32px between sections; 40px above the footer.
- **Radius:** bar 20; rows 12 (concentric with the list padding); kbd 6; settings cards 14; segmented control 10 outside and 8 inside; inputs 8; stage 18.
- **Bar geometry (must match `ROW`/`CHROME` in settings.js):** input 58px tall; result rows exactly 38px; footer 41px including its border; panel border 2px. So the list height is `rows × 38 + 12` and the bar height is the list height + 101. The bar keeps one fixed height and is centered vertically, so it never jumps while you type.
- **Type:** system stack (SF Pro Text / Segoe UI Variable), chosen so the bar feels native to the browser.
  - Bar: input 19/450, rows 14, urls and tags 12–12.5 in `--muted`, kbd 11/500.
  - Settings: h1 22/650 at −0.02em; section labels 13/600 in `--ink-soft`; row names 14/550; hints 12.5 in `--ink-soft`; slider readouts 13/500 with tabular-nums.

## Components

- **Result row:** a 16px icon (favicon, globe or magnifier), the title, the url in `--muted`, and a right-aligned tag. When selected: `--sel` fill, inset shine, a 3px `--accent` bar on the left, and the tag in the accent color.
- **Footer:** kbd hints on the left (their labels follow the "Enter opens" setting) and a 28px gear button on the right.
- **Segmented control:** native radios inside `.seg`. The track uses `--well`; the checked option is a `--cloud` pill with the ring shadow.
- **Switch:** a native checkbox with `role="switch"`, 38×22, accent track when on, and a 44px-tall hit area via `::after`.
- **Slider:** a native range input with `accent-color: var(--quill)` and 170px wide. It either has end labels (Frosted / Clear) or a right-aligned value readout (`960 px`, `8 results`). It previews on `input` and saves on `change`, because storage limits how often we can write.
- **Chips:** checkbox pills; when checked they get a 14% accent tint and a 40% accent ring.
- **Accent swatch:** a 20px dot inside a 30px hit area; when checked it gets a 2px `--cloud` gap and a 2px color ring.
- **Buttons:** `.btn` (a `--well` fill, 13/550, 9px radius, scale .97 on press), `.quiet`, and `.danger`. Destructive actions ask for a second click to confirm.
- **Validation:** mark invalid inputs with `aria-invalid="true"` (a 1.5px `--warn` inset ring) and explain the fix in one plain sentence. Don't save anything invalid.

## Motion

- The bar enters with a 160ms fade and scale from .97. No other motion in the bar, because it's used many times a day.
- On the settings page, transitions are 150–200ms with `cubic-bezier(.23, 1, .32, 1)`, on color and transform only. The "Saved" note fades in, then out after 1.4s.
- `prefers-reduced-motion` turns animation off.
