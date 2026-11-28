import { useState } from 'react';
import pins from './pins.json';

export const revision = '2e4372e94efa5c0570f0d2f2832722b9c837bc96';
const meta = 'https://github.com/nimmsel23/vitalos';
const docs = meta + '/blob/' + revision + '/prod/docs/';
const apps: Record<string, string> = {
  '6pack-app':'6Pack', 'fitness-app':'Fitness', 'fuel-app':'Fuel', 'habit-app':'Habits',
  'journal-app':'Journal', 'learn-app':'Learn', 'plan-app':'Plan', 'relax-app':'Relax', 'skills-app':'Skills'
};
const stages = ['Sub-Apps', 'Shell', 'Store-Produkt'] as const;
type Stage = typeof stages[number];
const releases = [
  {name:'Android', path:'prod/android/', items:[
    ['Build','Signiertes AAB aus 6bc092c dokumentiert, 22.11.'],
    ['Test','Installation und Start im Emulator (API 37) belegt. Anmeldung mit Konto und Test auf einem Telefon offen.'],
    ['Einreichung','Upload und Play-Track ungeprüft.'], ['Veröffentlichung','Öffentliche Listung ungeprüft.']
  ], doc:'PLAY-CLOSED-TEST-CLICKLIST.md'},
  {name:'iOS', path:'prod/ios/', items:[
    ['Build','Capacitor-Projekt vorhanden. Signiertes Xcode-Archiv ungeprüft.'],
    ['Test','TestFlight-Verteilung und iPhone-Abnahme ungeprüft.'],
    ['Einreichung','Einreichung in App Store Connect ungeprüft.'], ['Veröffentlichung','Öffentliche Listung ungeprüft.']
  ], doc:'STORE-PUBLISHING-PLAN.md'}
];
export default function ProductDelivery({productUrl,openWeek}:{productUrl?:string;openWeek:()=>void}) {
  const [stage, setStage] = useState<Stage>('Sub-Apps');
  const [onlyDifferent, setOnlyDifferent] = useState(false);
  const different = pins.filter(p => p.pin !== p.upstream);
  const visible = onlyDifferent ? different : pins;
  const identical = pins.length - different.length;
  return <section className="delivery">
    <div className="delivery-brief"><div><p className="delivery-label">Produktabnahme</p><h2>Kann ich einen Eintrag auf dem Handy wiederfinden?</h2>
    <p>Der nächste belegbare Nutzertest beginnt mit der Anmeldung auf einem Telefon. Danach einen Journaleintrag speichern, die App neu starten und den Eintrag wieder öffnen.</p>
    <p>Android erreicht im Emulator den Login. Für iOS fehlt ein belegtes signiertes Archiv.</p></div>
    <div className="delivery-links">{productUrl && <a href={productUrl}>Zur Produktakte im CPO-Dashboard</a>}<button onClick={openWeek}>Änderungen dieser Woche</button></div></div>
    <div className="delivery-stages" aria-label="Entwicklungsebene">{stages.map((name,i)=><button key={name} aria-pressed={stage===name} onClick={()=>setStage(name)}><strong>{name}</strong><span>{[identical+' von '+pins.length+' auf master-Stand','Private PWA und Store-Shell','Android und iOS'][i]}</span></button>)}</div>
    <section className="delivery-panel" aria-label={stage}>
    {stage==='Sub-Apps' && <><h2>Welche Entwicklung ist eingebunden?</h2><p>Die Gitlinks in VitalOS legen den gemeinsamen Quellstand fest. Der Vergleich zeigt die am 28.11. gelesenen Branches.</p>
    <label className="delta-toggle"><input type="checkbox" checked={onlyDifferent} onChange={e=>setOnlyDifferent(e.target.checked)} />Nur Abweichungen ({different.length})</label>
    {visible.map(p=><details key={p.path}><summary><strong>{apps[p.path]}</strong><span>{p.ahead ? p.ahead+' Commits voraus' : 'Stand identisch'}</span></summary>
    <div className="delivery-detail"><code>{p.path}</code><dl>{[['In VitalOS',p.pin],['master',p.upstream],['dev',p.dev]].map(([label,sha])=><div key={label}><dt>{label}</dt><dd><a href={'https://github.com/'+p.repo+'/commit/'+sha}>{sha.slice(0,8)}</a></dd></div>)}</dl>
    <a href={'https://github.com/'+p.repo+(p.ahead ? '/compare/'+p.pin+'...'+p.upstream : '')}>{p.ahead ? 'Änderungen seit Integration ansehen' : 'Entwicklungsrepository öffnen'}</a></div></details>)}
    <a className="source-link" href={meta+'/blob/'+revision+'/.gitmodules'}>Submodul-Ursprünge prüfen</a></>}
    {stage==='Shell' && <><h2>Wie werden die Apps gemeinsam nutzbar?</h2><p>Beide Shells beziehen dieselben neun Gitlinks. Jede hat ihre eigene Oberfläche, Firebase-Umgebung und Auslieferung.</p>
    <div className="delivery-pair"><article><p className="delivery-label">Private PWA</p><h3>Die eigene Arbeitsumgebung</h3><p>Die Root-Shell verbindet die Sub-Apps. Das Produktprotokoll dokumentiert einen erfolgreichen privaten Shell-Build vom 26.11.</p><a href={meta+'/tree/'+revision+'/src'}>Quellcode · src/</a></article>
    <article><p className="delivery-label">Store-Shell</p><h3>Ein Produkt mit zwei Editionen</h3><p>Der eingebundene Journal-Stand unterstützt die Übergabe an den serverseitigen Smart Logger. Der Produkt-Webbuild ist dokumentiert. Ein KI-Durchlauf auf einem angemeldeten Gerät bleibt ungeprüft.</p><a href={meta+'/tree/'+revision+'/prod/src'}>Quellcode · prod/src/</a></article></div>
    <a className="source-link" href={docs+'PRODUCT-CHECKOUT.md'}>Build- und Integrationsnachweise lesen</a></>}
    {stage==='Store-Produkt' && <><h2>Was erreicht Nutzer im Store?</h2><p><b>Observe / Free</b> umfasst den manuellen Journal- und Wochenablauf. <b>Operate / Premium</b> erweitert ihn um KI. Nutzungsrechte werden serverseitig geprüft.</p><div className="delivery-pair">{releases.map(r=><article key={r.name}><p className="delivery-label">{r.path}</p><h3>{r.name}</h3><dl>{r.items.map(([name,detail])=><div key={name}><dt>{name}</dt><dd>{detail}</dd></div>)}</dl><a href={docs+r.doc}>Release-Nachweis lesen</a></article>)}</div><details><summary><strong>Separater Android-Pilot</strong><span>Fitness-TWA</span></summary><p className="delivery-detail">Der Fitness-Pilot liegt in prod/platforms/fitness-twa/ und hat einen eigenen Paket- und Auslieferungsweg.</p></details></>}
    </section></section>;
}
