(() => {
  const links = [...document.querySelectorAll('[data-tab]')];
  const panels = [...document.querySelectorAll('[data-panel]')];
  function renderTab() {
    const key = location.hash.slice(1) === 'klienten-gewinnen' ? 'klienten-gewinnen' : 'auftrag';
    for (const panel of panels) panel.hidden = panel.id !== key;
    for (const link of links) {
      if (link.dataset.tab === key) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
  }
  window.addEventListener('hashchange', renderTab);
  renderTab();

  const tasks = [...document.querySelectorAll('[data-task]')];
  const note = document.querySelector('#storage-note');
  let storageKey;
  function showStorageNote() {
    note.hidden = false;
    note.textContent = 'Speichern ist in diesem Browser nicht verfügbar. Häkchen gelten bis zum Neuladen.';
  }
  function updateProgress() {
    document.querySelector('#week-progress').textContent = `${tasks.filter(input => input.checked).length} von ${tasks.length} Wochenschritten erledigt`;
  }
  function loadWeek() {
    const today = new Date();
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
    const key = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
    const nextKey = 'vitaltrainer:akquise:' + key;
    if (storageKey === nextKey) return;
    storageKey = nextKey;
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    const format = date => date.toLocaleDateString('de-AT', {day:'2-digit',month:'2-digit',year:'numeric'});
    document.querySelector('#week-label').textContent = `${format(monday)} – ${format(sunday)}`;
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch { showStorageNote(); }
    tasks.forEach(input => { input.checked = saved[input.dataset.task] === true; });
    updateProgress();
  }
  loadWeek();
  window.addEventListener('focus', loadWeek);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) loadWeek(); });
  function saveWeek() {
    try { localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(tasks.map(input => [input.dataset.task, input.checked])))); }
    catch { showStorageNote(); }
    updateProgress();
  }
  tasks.forEach(input => input.addEventListener('change', () => {
    const value = input.checked;
    loadWeek();
    input.checked = value;
    saveWeek();
  }));
  document.querySelector('#reset-week').addEventListener('click', () => {
    loadWeek();
    tasks.forEach(input => { input.checked = false; });
    saveWeek();
  });
  document.querySelector('#copy-prompt').addEventListener('click', async () => {
    const status = document.querySelector('#copy-status');
    try {
      await navigator.clipboard.writeText(document.querySelector('#weekly-prompt').textContent);
      status.textContent = 'Arbeitsauftrag kopiert.';
    } catch { status.textContent = 'Bitte den Arbeitsauftrag oben markieren und manuell kopieren.'; }
  });
})();
