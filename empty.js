// feather's empty page: one line saying how to search, with your real shortcut.
(async () => {
  const line = document.createElement('p');
  const rest = document.createElement('div');
  rest.className = 'rest';
  rest.append(line);
  document.body.append(rest);

  const keys = (await chrome.commands.getAll()).find((c) => c.name === 'toggle-palette')?.shortcut;
  if (!keys) {
    line.textContent = 'Click feather’s icon to search';
    return;
  }
  line.append('Press');
  for (const k of keys.split(/\+(?!$)/)) line.append(Object.assign(document.createElement('kbd'), { textContent: k }));
  line.append('to search');
})();
