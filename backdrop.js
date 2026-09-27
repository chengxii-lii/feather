// The background of feather's own pages (new tab and empty page): your browser theme's color, warm paper,
// or your desktop wallpaper.
(async () => {
  const root = document.documentElement;
  const [s, image] = await Promise.all([FEATHER.load(), FEATHER.getWallpaper()]);
  const bg = FEATHER.pageBackground(s, !!image);
  root.dataset.bg = bg;
  // pages.css builds light and dark shades from the theme color's seed and tint.
  const theme = FEATHER.themeColor(s);
  root.style.setProperty('--seed', theme.seed);
  root.style.setProperty('--tint-dark', theme.dark);
  root.style.setProperty('--tint-light', theme.light);

  // Follow light and dark mode as they change, like the browser does.
  const mode = matchMedia('(prefers-color-scheme: dark)');
  const applyMode = () => root.classList.toggle('dark', FEATHER.isDark(s));
  applyMode();
  mode.addEventListener('change', applyMode);

  // The wallpaper is lined up with where the window sits on screen, so the page looks see-through.
  // A page can't make the browser window actually transparent, so this is the closest thing.
  if (bg !== 'wallpaper' || !image) return;
  root.classList.add('has-wallpaper');
  const layer = document.createElement('div');
  layer.className = 'wallpaper';
  layer.style.backgroundImage = `url("${image}")`;
  document.body.prepend(layer);

  // Without a known screen size there's nothing to line up with: just fill the page.
  if (!screen.width || !screen.height) {
    Object.assign(layer.style, { width: '100%', height: '100%' });
    return;
  }

  let last = '';
  function place() {
    // The page's top-left corner on screen: the window's position plus the browser's frame and toolbars.
    const side = (outerWidth - innerWidth) / 2;
    const x = screenX - (screen.left ?? screen.availLeft ?? 0) + side;
    const y = screenY - (screen.top ?? screen.availTop ?? 0) + (outerHeight - innerHeight) - side;
    const key = `${x},${y},${screen.width},${screen.height}`;
    if (key !== last) {
      last = key;
      layer.style.width = `${screen.width}px`;
      layer.style.height = `${screen.height}px`;
      layer.style.transform = `translate(${-x}px, ${-y}px)`;
    }
    // Windows don't announce when they move, so keep checking while the page is visible.
    requestAnimationFrame(place);
  }
  place();
})();
