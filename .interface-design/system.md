# feather design system

## Direction

**Warm, calm and well set, like a good sheet of paper.** Since v2.3, feather follows the feel of Claude's interface: ivory paper in light mode and warm charcoal in dark, solid surfaces with thin warm borders and gentle shadows, a serif for display text and a quiet sans-serif for everything else, and one terracotta accent used sparingly. Borrow the *style* only: no Anthropic logos, names or licensed fonts.

- **The bar (palette.js)** is the product. It's a solid white/charcoal card by default; the Glass setting can still thin it out so the page shows through.
- **Settings (options.html)** reads like a document: serif feature headings, white cards on paper. Its signature is the **live preview**: the real bar, drawn at its real size and scaled to fit, floating over a sample article page.
- **feather's pages** (new tab, empty page) are plain paper, or your wallpaper if you chose one. The empty page holds one serif line: "Press Ctrl T to search".

## Tokens

The bar's tokens come from `FEATHER.vars()` in `settings.js`, the single source for both the bar and the preview. Don't hardcode them anywhere else.

| Token | Light | Dark | Meaning |
| --- | --- | --- | --- |
| `--surface` | white at 1.0–0.38 alpha | #30302e at 1.0–0.38 | the bar's card; alpha comes from Glass (default 10, nearly solid) |
| `--blur` | 16–64px | same | backdrop blur, only noticeable when Glass is up |
| `--edge` | rgba(31,30,29,.13) | rgba(222,220,209,.14) | 1px warm border |
| `--line` | rgba(31,30,29,.08) | rgba(222,220,209,.1) | dividers inside the bar |
| `--text` / `--muted` | #141413 / #73726c | #faf9f5 / #a6a39a | two text tiers |
| `--hover` / `--sel` | ink at .035 / .06 | warm white at .05 / .09 | row states: a soft warm tint, with no stripe |
| `--accent` | Clay #c96442 (or the chosen accent) | Clay #d97757 | caret, autocomplete wash (24%), switches, sliders, chips |
| `--dim` | rgba(20,20,19,.22) | rgba(0,0,0,.4) | page scrim (transparent when Dim is off) |
| `--shine` | none | white .04 | kept for glass; effectively off |
| `--width`, `--list-h` | from the Width and Height settings | | size |

Settings page tokens: `--sky` is the page paper (#faf9f5 / #262624), `--cloud` the cards (#fff / #30302e), plus `--ink` #141413, `--ink-soft` #5e5d59, `--ink-faint` #8a8981 (dark: #faf9f5, #c2c0b6, #97958c), `--hairline`, `--well` (inset control fill), `--ring` (a 1px warm ring plus a faint lift), `--quill` (= the accent), `--warn` and `--serif`.

Accents always come in [light, dark] pairs (`FEATHER.accents`): clay (the default), blue, violet, pink, green, graphite.

## Depth

- **Bar:** a solid card, a 1px `--edge` border, and one soft, warm, low shadow (`0 24px 64px -16px rgba(20,20,19,.3), 0 4px 14px rgba(20,20,19,.06)`). No inner highlight, and no accent stripe on the selected row.
- **Settings:** cards lifted by `--ring` only. Rows are separated by `--hairline` dividers. Buttons are outlined (a `--cloud` fill and a hairline ring) and fill with `--well` on hover.

## Measurements

- **Spacing:** 4px base.
  - Bar: input side padding 18, list padding 6, row padding 0 12, gap 12.
  - Settings: card row padding 12 16 with a minimum height of 60; 24px gap between label and control; 32px between groups; 56px above each feature heading.
- **Radius:** bar 20; rows 10; kbd 6; settings cards 14; buttons and inputs 8; segmented control 10 outside and 8 inside; stage 18.
- **Bar geometry (must match `ROW`/`CHROME` in settings.js):** input 58px tall; result rows exactly 38px; footer 41px including its border; panel border 2px. So the list height is `rows × 38 + 12` and the bar height is the list height + 101.
- **Type:**
  - Serif (`ui-serif, Georgia`) for display only: the settings h1 at 30/400, feature headings at 23/400, and the empty-page line at 22/400.
  - Sans (SF Pro Text / Segoe UI Variable) for UI: bar input 18/400, rows 14, meta 12–12.5 in muted, kbd 11/500; settings row names 14/500, hints 12.5 in `--ink-soft`, section labels 13/600 in `--ink-soft`, readouts with tabular-nums.

## Components

- **Result row:** a 16px icon, the title, the url in `--muted`, and a right-aligned tag. When selected: a `--sel` fill, and the tag turns `--text`.
- **Autocomplete:** the filled-in part is the input's selection, washed in the accent at 24%.
- **Footer:** kbd hints (1px `--line` ring on a `--kbd` fill) on the left, whose labels follow the selected row, and a 28px gear button on the right.
- **Segmented control, switch, slider, chips, swatches:** native inputs styled with the tokens. The accent marks "on" (switch track, slider fill, chip tint, swatch ring). Sliders preview on `input` and save on `change`.
- **Buttons:** `.btn` (outlined), `.quiet` (text only) and `.danger` (warn text). Destructive actions ask for a second click to confirm.
- **Validation:** mark invalid inputs with `aria-invalid="true"` (a 1.5px `--warn` inset ring) and explain the fix in one plain sentence. Don't save anything invalid.

## Motion

- The bar enters with a 160ms fade and scale from .97. No other motion in the bar, because it's used many times a day.
- Settings transitions are 150–200ms with `cubic-bezier(.23, 1, .32, 1)`, on color and transform only. The empty-page line fades in over 500ms.
- `prefers-reduced-motion` turns animation off.
