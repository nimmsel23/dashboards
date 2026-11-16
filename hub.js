const content = document.querySelector('.prose-boards');
const headings = [...content.children].filter(element => element.tagName === 'H3');
const keys = ['praxis', 'entwicklung', 'persoenlich'];

if (headings.length === keys.length) {
  const nav = document.createElement('nav');
  nav.className = 'hub-tabs';
  nav.setAttribute('aria-label', 'Bereiche');
  const sections = headings.map((heading, index) => {
    const key = keys[index];
    const panel = document.createElement('section');
    panel.className = 'hub-panel';
    panel.dataset.view = key;
    panel.setAttribute('aria-labelledby', 'bereich-' + key);
    const link = document.createElement('a');
    link.href = '#' + key;
    link.textContent = ['Praxis & Geschäft', 'VitalOS & Entwicklung', 'Persönlich'][index];
    nav.append(link);
    heading.before(panel);
    heading.id = 'bereich-' + key;
    let element = heading;
    while (element && (element === heading || !headings.includes(element))) {
      const next = element.nextElementSibling;
      panel.append(element);
      element = next;
    }
    return {key, link, panel};
  });
  const home = document.querySelector('nav.local');
  home.replaceWith(nav);
  document.querySelector('.workspace-link')?.setAttribute('hidden', '');

  const reader = document.createElement('section');
  reader.className = 'hub-reader';
  reader.hidden = true;
  const readerHeader = document.createElement('div');
  const back = document.createElement('button');
  back.type = 'button';
  back.textContent = 'Zur Übersicht';
  const open = document.createElement('a');
  open.textContent = 'Seite separat öffnen';
  open.target = '_blank';
  open.rel = 'noopener noreferrer';
  readerHeader.append(back, open);
  const frame = document.createElement('iframe');
  reader.append(readerHeader, frame);
  content.before(reader);

  const boards = new Map();
  let current = sections[0];
  for (const {key, panel} of sections) {
    for (const link of panel.querySelectorAll('a')) {
      const url = new URL(link.href);
      if (url.origin !== 'https://nimmsel23.github.io' ||
          !/^\/(?:dashboards\/[a-z0-9-]+|[a-z0-9]+-dev)\/$/.test(url.pathname)) continue;
      const route = '#' + key + '/board' + url.pathname;
      boards.set(route, {url: url.href, title: link.textContent});
      link.href = route;
      link.removeAttribute('target');
    }
  }

  function render() {
    const hash = location.hash;
    const key = hash.slice(1).split('/')[0];
    current = sections.find(section => section.key === key) ?? sections[0];
    const board = boards.get(hash);
    for (const {link, panel, key} of sections) {
      const selected = key === current.key;
      panel.hidden = !selected;
      if (selected) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    reader.hidden = !board;
    content.hidden = Boolean(board);
    if (board) {
      open.href = board.url;
      frame.title = board.title;
      if (frame.getAttribute('src') !== board.url) frame.src = board.url;
    } else {
      frame.removeAttribute('src');
    }
  }

  back.addEventListener('click', () => {
    location.hash = current.key;
    current.link.focus();
  });
  window.addEventListener('hashchange', render);
  render();
}
