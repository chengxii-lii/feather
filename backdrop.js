// feather's own pages (new tab and empty page) can show your desktop wallpaper, lined up with where the
// window sits on screen, so the page looks see-through. A page can't make the browser window actually
// transparent, so this is the closest thing.
(async () => {
  const image = await FEATHER.getWallpaper();
  if (!image) return;

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
