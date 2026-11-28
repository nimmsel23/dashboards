// Coaching-Lage live von coach-api (/api/org/coaching): am Laptop direkt, am Handy übers Tailnet.
// Die Daten kommen nur in den Browser des Owners; die öffentliche Seite enthält sie nie.
// Ohne coach-api bleibt der Hinweis stehen — es gibt keinen Schnappschuss, der veralten kann.
const box = document.getElementById('coaching-live');
const CANDIDATES = ['http://127.0.0.1:9150/api/org/coaching', 'https://ideapad.tail7a15d6.ts.net:8443/api/org/coaching'];

function el(tag, text, cls) { const e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; }

async function load() {
  for (const url of CANDIDATES) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (r.ok) return await r.json();
    } catch { /* nächster Kandidat */ }
  }
  return null;
}

function render(data) {
  const table = el('table'), head = el('tr');
  for (const h of ['Person', 'Spur', 'Letzte Einheit', 'Pause', 'Rhythmus (4 Wo.)', 'Fällig', 'Ø RPE', 'Lage']) head.append(el('th', h));
  table.append(el('thead')); table.tHead.append(head);
  const body = el('tbody');
  for (const r of data.rows) {
    const tr = el('tr');
    const last = r.last ? `${r.last}${r.last_block ? ' · ' + r.last_block : ''}` : '—';
    const faellig = r.faellig ? `${r.faellig.block} (vor ${r.faellig.seit} T.)` : '—';
    for (const v of [r.name, r.spur, last, r.pause != null ? `${r.pause} Tage` : '—',
      `${r.rhythmus}/Woche`, faellig, r.rpe ?? '—']) tr.append(el('td', String(v)));
    tr.append(el('td', r.lage, 'lage lage-' + r.lage.replace(/\s+/g, '-')));
    body.append(tr);
  }
  table.append(body);
  box.replaceChildren(el('p', `Live aus den Trainingsdaten · Stand ${data.today} · Lage: bis 4 Tage im Rhythmus, 5–10 fällig, danach überfällig.`, 'live-note'), table);
}

if (box) load().then(d => { if (d && Array.isArray(d.rows)) render(d); });
