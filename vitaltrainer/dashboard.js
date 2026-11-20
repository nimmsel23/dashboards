(() => {
 'use strict';
 const KEY='vitaltrainer:contacts:v1';
 const STAGES={kontakt:'Kontakt',gespraech:'Erstgespräch',angebot:'Angebot',gewonnen:'Zusage',pausiert:'Pausiert',abgesagt:'Abgesagt'};
 const SOURCES={persoenlich:'Persönlicher Kontakt',empfehlung:'Empfehlung',studio:'Fitnessstudio',firma:'Firmenkontakt',online:'Online-Anfrage',sonstiges:'Sonstiges'};
 const CHANNELS={persoenlich:'Persönlich',email:'E-Mail',telefon:'Telefon',whatsapp:'WhatsApp'};
 const OPEN=new Set(['kontakt','gespraech','angebot']);
 const $=id=>document.getElementById(id);
 const node=(tag,classes,text)=>{const n=document.createElement(tag);if(classes)n.className=classes;if(text!==undefined)n.textContent=text;return n;};
 const uid=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
 const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
 const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
 const dayText=s=>validDate(s)?new Date(s+'T12:00:00').toLocaleDateString('de-AT',{day:'2-digit',month:'2-digit',year:'numeric'}):'Kein Datum';
 let state={schema:1,revision:'',contacts:[]},scope='open',editing=null,pendingImport=null,blocked=false;
 const string=(value,max,label)=>{if(typeof value!=='string'||value.length>max)throw new Error('Ungültiges Feld: '+label);return value.trim();};
 function validateContact(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('Ungültiger Kontakteintrag.');
  const id=string(raw.id,80,'ID');if(!/^[\w-]{1,80}$/.test(id))throw new Error('Ungültige Kontakt-ID.');
  const alias=string(raw.alias,50,'Kürzel');if(!alias)throw new Error('Ein Kontakt hat kein Kürzel.');
  if(!Object.hasOwn(STAGES,raw.stage)||!Object.hasOwn(SOURCES,raw.source)||!Object.hasOwn(CHANNELS,raw.channel))throw new Error('Ungültiger Status, Ursprung oder Kontaktweg.');
  const next=string(raw.next,160,'Nächster Schritt'),due=string(raw.due,10,'Datum');
  if(due&&!validDate(due))throw new Error('Ungültiges Datum.');
  if(OPEN.has(raw.stage)&&(!next||!due))throw new Error('Offene Kontakte benötigen nächsten Schritt und Datum.');
  if(typeof raw.archived!=='boolean')throw new Error('Ungültiger Archivstatus.');
  for(const key of ['createdAt','updatedAt'])if(typeof raw[key]!=='string'||!/^\d{4}-\d\d-\d\dT/.test(raw[key])||!Number.isFinite(Date.parse(raw[key])))throw new Error('Ungültiger Zeitstempel.');
  if(!Array.isArray(raw.history)||raw.history.length>100)throw new Error('Ungültiger Kontaktverlauf.');
  const history=raw.history.map(h=>{if(!h||!Number.isFinite(Date.parse(h.at)))throw new Error('Ungültiger Verlauf.');return {at:string(h.at,40,'Verlaufsdatum'),text:string(h.text,600,'Verlauf')};});
  return {session:validateSession(raw.session),id,alias,source:raw.source,channel:raw.channel,stage:raw.stage,goal:string(raw.goal,160,'Ziel'),next,due,note:string(raw.note,240,'Notiz'),archived:raw.archived,createdAt:raw.createdAt,updatedAt:raw.updatedAt,history};
 }
 function validateState(raw){if(!raw||raw.schema!==1||!Array.isArray(raw.contacts)||raw.contacts.length>2000||typeof raw.revision!=='string')throw new Error('Keine gültige Vitaltrainer-Sicherung (Version 1).');const contacts=raw.contacts.map(validateContact);if(new Set(contacts.map(c=>c.id)).size!==contacts.length)throw new Error('Doppelte Kontakt-IDs in der Sicherung.');return {schema:1,revision:raw.revision.slice(0,80),contacts};}
 function readDisk(){const text=localStorage.getItem(KEY);return text===null?{schema:1,revision:'',contacts:[]}:validateState(JSON.parse(text));}
 function storageFailure(){blocked=true;$('storage-error').hidden=false;$('storage-error').textContent='Die Browserdaten können nicht sicher gelesen oder gespeichert werden. Es wird nichts überschrieben. Prüfe den Browserspeicher oder öffne eine vorhandene Sicherung auf einem anderen Gerät.';$('add-contact').disabled=true;}
 try{state=readDisk();}catch{storageFailure();}
 function commit(contacts){
  if(blocked)throw new Error('Speichern ist in diesem Browser derzeit nicht möglich.');
  let disk;try{disk=readDisk();}catch{storageFailure();throw new Error('Browserdaten konnten nicht gelesen werden. Deine Eingabe bleibt erhalten.');}
  if(disk.revision!==state.revision){state=disk;$('conflict-error').hidden=false;render();throw new Error('Ein anderer Tab hat die Daten geändert. Schließe den Dialog und öffne den Kontakt erneut.');}
  const nextState=validateState({schema:1,revision:uid(),contacts});
  try{localStorage.setItem(KEY,JSON.stringify(nextState));}catch{throw new Error('Nicht gespeichert: Der Browserspeicher ist voll oder gesperrt. Deine Eingabe bleibt erhalten.');}
  state=nextState;$('conflict-error').hidden=true;render();$('save-status').textContent='Gespeichert auf diesem Gerät · '+new Date().toLocaleTimeString('de-AT',{hour:'2-digit',minute:'2-digit'});
 }
 function history(c,text,at){return [...c.history,{at,text}].slice(-100);}
 const hasDue=c=>!c.archived&&c.stage!=='abgesagt'&&c.due&&c.due<=today();
 const rank=c=>c.archived?5:hasDue(c)?0:OPEN.has(c.stage)&&!c.next?1:OPEN.has(c.stage)?2:c.stage==='gewonnen'?3:4;
 function render(){
  renderCare();
  const active=state.contacts.filter(c=>!c.archived);
  $('count-due').textContent=blocked?'–':active.filter(hasDue).length;
  $('count-open').textContent=blocked?'–':active.filter(c=>OPEN.has(c.stage)).length;
  $('count-won').textContent=blocked?'–':active.filter(c=>c.stage==='gewonnen').length;
  document.querySelectorAll('[data-scope]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scope===scope)));
  const q=$('search').value.trim().toLocaleLowerCase('de-AT'),stage=$('stage-filter').value;
  const list=state.contacts.filter(c=>{
   if(scope==='archived'?!c.archived:c.archived)return false;
   if(scope==='open'&&!OPEN.has(c.stage))return false;if(scope==='due'&&!hasDue(c))return false;if(scope==='won'&&c.stage!=='gewonnen')return false;
   return (!stage||c.stage===stage)&&(!q||[c.alias,c.goal,c.next,SOURCES[c.source]].join(' ').toLocaleLowerCase('de-AT').includes(q));
  }).sort((a,b)=>rank(a)-rank(b)||(a.due||'9999').localeCompare(b.due||'9999')||a.alias.localeCompare(b.alias,'de'));
  $('result-count').textContent=list.length+' '+(list.length===1?'Kontakt':'Kontakte');const box=$('contacts');box.replaceChildren();
  if(!list.length){const empty=node('div','empty');empty.append(node('h3','',blocked?'Speicher nicht verfügbar':state.contacts.length?'Hier ist gerade nichts offen.':'Mit dem ersten Kontakt anfangen.'));empty.append(node('p','',blocked?'Deine Daten werden nicht verändert.':scope==='due'?'Keine Rückmeldung ist heute oder früher fällig. Unter „Offen“ findest du deine weiteren Kontakte.':state.contacts.length?'Passe die Filter an oder erfasse einen weiteren Kontakt.':'Trage eine Person oder Firma mit Kürzel ein und halte fest, was du bis wann als Nächstes machst.'));if(!blocked){const b=node('button','primary',state.contacts.length?'Kontakt erfassen':'Ersten Kontakt erfassen');b.type='button';b.addEventListener('click',()=>openContact());empty.append(b);}box.append(empty);return;}
  for(const c of list){
   const row=node('article','contact-row'+(hasDue(c)?c.due<today()?' is-overdue':' is-due':''));row.dataset.contactId=c.id;row.setAttribute('aria-label','Kontakt '+c.alias);
   const identity=node('div');identity.append(node('div','contact-name',c.alias),node('span','contact-source',SOURCES[c.source]+' · '+CHANNELS[c.channel]));
   const stageNode=node('span','stage '+c.stage,STAGES[c.stage]);const next=node('div','next-text',c.next||'Kein weiterer Schritt geplant');if(c.goal)next.append(node('small','',c.goal));
   const due=node('div','due'+(hasDue(c)?c.due<today()?' late':' today':''),c.due?dayText(c.due):'–');if(hasDue(c))due.append(node('small','',c.due<today()?'überfällig':'heute'));
   const actions=node('div','row-actions');const edit=node('button','secondary','Bearbeiten');edit.type='button';edit.disabled=blocked;edit.addEventListener('click',()=>openContact(c.id));actions.append(edit);
   if(!c.archived){const draft=node('button','quiet','Nachricht vorbereiten');draft.type='button';draft.onclick=()=>openDraft(c,false);actions.append(draft);}
   if(c.archived){const restore=node('button','quiet','Wiederherstellen');restore.type='button';restore.addEventListener('click',()=>archive(c.id,false));actions.append(restore);}else if(c.next){const done=node('button','quiet','Schritt erledigt');done.type='button';done.disabled=blocked;done.addEventListener('click',()=>openContact(c.id,true));actions.append(done);}
   row.append(identity,stageNode,next,due,actions);box.append(row);
  }
 }
 document.querySelectorAll('[data-scope]').forEach(b=>b.addEventListener('click',()=>{scope=b.dataset.scope;$('stage-filter').value='';render();}));
 $('search').addEventListener('input',render);$('stage-filter').addEventListener('change',()=>{if(scope!=='archived'&&$('stage-filter').value)scope='all';render();});
 function updateRequired(){const open=OPEN.has($('contact-stage').value);$('contact-next').required=open;$('contact-due').required=open;$('next-hint').textContent=open?'Für offene Kontakte sind nächster Schritt und Datum erforderlich.':'Nächster Schritt und Datum sind optional. Eine Zusage ist kein Zahlungseingang.';}
 $('contact-stage').addEventListener('change',updateRequired);
 const fields=['alias','source','stage','channel','goal','next','due','note'];
 function openContact(id=null,complete=false){
  const c=id?state.contacts.find(c=>c.id===id):null;if(id&&!c)return;editing={id,complete,revision:state.revision};$('contact-form').reset();$('form-error').textContent='';$('contact-mode').textContent=complete?'NÄCHSTER SCHRITT':c?'KONTAKT BEARBEITEN':'NEUER KONTAKT';$('contact-title').textContent=complete?'Schritt abschließen':c?c.alias:'Kontakt erfassen';$('save-contact').textContent=complete?'Erledigen & speichern':'Kontakt speichern';$('complete-note').hidden=!complete;
  for(const f of fields)if(c)$('contact-'+f).value=c[f];
  if(complete){$('contact-next').value='';$('contact-due').value='';}
  $('archive-contact').hidden=!c;$('archive-contact').textContent=c?.archived?'Wiederherstellen':'Archivieren';$('history-details').hidden=!c;$('history-details').open=false;$('contact-history').replaceChildren();
  if(c)for(const h of [...c.history].reverse()){const li=node('li','',h.text),time=node('time','',new Date(h.at).toLocaleString('de-AT'));time.dateTime=h.at;li.prepend(time);$('contact-history').append(li);}
  updateRequired();$('contact-dialog').showModal();if(complete)$('contact-next').focus();else $('contact-alias').focus();
 }
 $('add-contact').addEventListener('click',()=>openContact());document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
 $('contact-dialog').addEventListener('close',()=>{editing=null;$('conflict-error').hidden=true;});
 $('contact-form').addEventListener('submit',e=>{
  e.preventDefault();if(!editing||blocked)return;$('form-error').textContent='';
  if(editing.revision!==state.revision){$('form-error').textContent='Die Daten wurden inzwischen geändert. Bitte schließe den Dialog und öffne den Kontakt erneut.';return;}
  const previous=editing.id?state.contacts.find(c=>c.id===editing.id):null;const at=new Date().toISOString();const values=Object.fromEntries(fields.map(f=>[f,$('contact-'+f).value.trim()]));
  if(state.contacts.some(c=>c.id!==editing.id&&!c.archived&&c.alias.toLocaleLowerCase('de')===values.alias.toLocaleLowerCase('de'))){$('form-error').textContent='Dieses Kürzel ist bereits vergeben. Bitte wähle ein eindeutiges Kürzel.';return;}
  const record={session:previous?.session||null,...values,id:previous?.id||uid(),archived:previous?.archived||false,createdAt:previous?.createdAt||at,updatedAt:at,history:previous?.history||[]};
  if(editing.complete&&previous?.next){record.history=history(record,'Erledigt: '+previous.next+(previous.due?' (fällig '+dayText(previous.due)+')':''),at);}
  if(!previous)record.history=history(record,'Kontakt erfasst · '+STAGES[values.stage],at);
  else if(previous.stage!==values.stage)record.history=history(record,'Status: '+STAGES[previous.stage]+' → '+STAGES[values.stage],at);
  if(record.next&&(!previous||previous.next!==record.next||previous.due!==record.due||editing.complete))record.history=history(record,'Geplant: '+record.next+(record.due?' · '+dayText(record.due):''),at);
  try{const valid=validateContact(record);commit(previous?state.contacts.map(c=>c.id===valid.id?valid:c):[...state.contacts,valid]);$('contact-dialog').close();}
  catch(error){$('form-error').textContent=error.message;}
 });
 function archive(id,archived){const current=state.contacts.find(c=>c.id===id);if(!current)return;const at=new Date().toISOString();const value={...current,archived,updatedAt:at,history:history(current,archived?'Archiviert':'Wiederhergestellt',at)};try{commit(state.contacts.map(c=>c.id===id?value:c));if($('contact-dialog').open)$('contact-dialog').close();}catch(e){if($('contact-dialog').open)$('form-error').textContent=e.message;else{$('storage-error').textContent=e.message;$('storage-error').hidden=false;}}}
 $('archive-contact').addEventListener('click',()=>{if(!editing)return;if(editing.revision!==state.revision){$('form-error').textContent='Daten wurden geändert. Kontakt bitte erneut öffnen.';return;}const c=state.contacts.find(c=>c.id===editing.id);if(c)archive(c.id,!c.archived);});
 $('backup-open').addEventListener('click',()=>{$('backup-status').textContent='';$('backup-dialog').showModal();});
 $('export-data').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=node('a');a.href=url;a.download='vitaltrainer-kontakte-'+today()+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);$('backup-status').textContent='Sicherung zum Herunterladen bereitgestellt.';});
 $('import-file').addEventListener('change',async()=>{pendingImport=null;$('import-data').disabled=true;$('import-preview').hidden=true;$('backup-status').textContent='';const file=$('import-file').files[0];if(!file)return;if(file.size>2*1024*1024){$('backup-status').textContent='Die Datei ist größer als 2 MB und wurde nicht eingelesen.';return;}try{pendingImport=validateState(JSON.parse(await file.text()));$('import-preview').textContent=pendingImport.contacts.length+' geprüfte Kontakte in der Sicherung. Bestehende Kontakte bleiben erhalten.';$('import-preview').hidden=false;$('import-data').disabled=blocked;}catch{$('backup-status').textContent='Keine gültige Sicherung. Es wurden keine Daten verändert.';}});
 $('import-data').addEventListener('click',()=>{if(!pendingImport)return;try{const merged=new Map(state.contacts.map(c=>[c.id,c]));let added=0,updated=0;for(const incoming of pendingImport.contacts){const existing=merged.get(incoming.id);if(!existing){merged.set(incoming.id,incoming);added++;}else if(Date.parse(incoming.updatedAt)>Date.parse(existing.updatedAt)){merged.set(incoming.id,incoming);updated++;}}commit([...merged.values()]);$('backup-status').textContent=`Eingelesen: ${added} neue und ${updated} aktualisierte Kontakte.`;pendingImport=null;$('import-data').disabled=true;}catch(e){$('backup-status').textContent=e.message;}});
 function validateSession(raw) {
  if (raw == null) return null;
  if (!['planned','follow'].includes(raw.phase) || !validDate(raw.date) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(raw.time)) throw new Error('Ungültiger Termin.');
  const topic = string(raw.topic,160,'Schwerpunkt');
  const result = string(raw.result,160,'Ergebnis');
  if (!topic || (raw.phase === 'follow' && (!validDate(raw.follow) || raw.follow < raw.date || !result))) throw new Error('Bitte Ergebnis und Rückmeldedatum prüfen.');
  return {phase:raw.phase, date:raw.date, time:raw.time, topic, result, follow:raw.phase === 'follow' ? raw.follow : ''};
 }
 function showView() {
  const care = location.hash === '#betreuung';
  $('contacts-panel').hidden = care;
  $('care-panel').hidden = !care;
  $('care-link').setAttribute('aria-current',care ? 'page' : 'false');
  $('leads-link').setAttribute('aria-current',care ? 'false' : 'page');
  document.title = 'Vitaltrainer · ' + (care ? 'Termine & Betreuung' : 'Klienten gewinnen');
 }
 window.addEventListener('hashchange',showView);
 showView();
 let sessionEdit;
 function action(label,handler) {
  const b = node('button','secondary',label);
  b.type = 'button';
  b.onclick = handler;
  return b;
 }
 function renderCare() {
  const active = state.contacts.filter(c => !c.archived);
  const work = active.filter(c => c.session);
  const when = s => s.phase === 'follow' ? s.follow : s.date+'T'+s.time;
  work.sort((a,b) => when(a.session).localeCompare(when(b.session)));
  $('plan-session').disabled = blocked;
  $('care-empty').textContent = work.length ? '' : 'Hier siehst du deine nächsten Einheiten und vereinbarten Rückmeldungen.';
  const list = $('care-list');
  list.replaceChildren();
  for (const c of work) {
   const s = c.session, follow = s.phase === 'follow';
   const row = node('article','care-row');
   row.append(node('h2','',c.alias),node('strong','',follow ? 'Rückmeldung · '+dayText(s.follow)+(s.follow<=today()?' · fällig':'') : dayText(s.date)+' · '+s.time+' Uhr'),node('p','',s.topic));
   if (follow) row.append(node('p','',s.result));
   const actions = node('div','care-actions');
   if (follow) actions.append(action('Nachricht vorbereiten',()=>openDraft(c,true)),action('Rückmeldung erledigt',()=>finishSession(c,'Rückmeldung erledigt')));
   else actions.append(action('Einheit dokumentieren',()=>openSession(c,'complete')),action('Termin ändern',()=>openSession(c,'edit')),action('Termin absagen',()=>openSession(c,'cancel')));
   row.append(actions); list.append(row);
  }
  const log = $('care-log');
  log.replaceChildren();
  const entries = active.flatMap(c=>c.history.filter(h=>h.text.startsWith('Einheit abgeschlossen')).map(h=>({alias:c.alias,...h}))).sort((a,b)=>b.at.localeCompare(a.at));
  for (const h of entries) log.append(node('li','',h.alias+' · '+h.text));
  if (!entries.length) log.append(node('li','muted','Noch keine Einheit dokumentiert.'));
 }
 function writeSession(c,session,note) {
  const at = new Date().toISOString();
  const updated = {...c,session,updatedAt:at,history:history(c,note,at)};
  commit(state.contacts.map(item => item.id === c.id ? updated : item));
 }
 function finishSession(c,note) {
  try { writeSession(c,null,note+' · '+c.session.topic); }
  catch (error) { $('save-status').textContent=error.message; }
 }
 function openSession(c,mode) {
  const completing = mode === 'complete', cancel = mode === 'cancel';
  const available = c ? [c] : state.contacts.filter(item => !item.archived && !item.session);
  if (!available.length) {
   $('care-empty').textContent = state.contacts.some(c=>!c.archived) ? 'Pro Kontakt ist eine Einheit mit anschließender Rückmeldung offen. Schließe sie zuerst ab.' : 'Erfasse zuerst ein Kürzel im Reiter „Klienten gewinnen“.';
   return;
  }
  sessionEdit = {mode,revision:state.revision};
  $('session-form').reset();
  $('session-error').textContent='';
  $('session-person').replaceChildren(...available.map(item=>new Option(item.alias,item.id)));
  $('session-person').disabled=!!c;
  $('session-title').textContent = {plan:'Termin eintragen',edit:'Termin ändern',complete:'Einheit dokumentieren',cancel:'Termin absagen'}[mode];
  const s=c?.session;
  $('session-date').value=s?.date||today();
  $('session-time').value=s?.time||'';
  $('date-field').hidden=$('time-field').hidden=completing||cancel;
  $('session-date').disabled=$('session-time').disabled=completing||cancel;
  $('topic-label').textContent=completing?'Was habt ihr erreicht oder vereinbart?':'Schwerpunkt der Einheit';
  $('session-topic').value=completing?'':s?.topic||'';
  $('session-topic').readOnly=cancel;
  $('follow-field').hidden=!completing;
  $('session-follow').min=s?.date||'';
  $('session-dialog').showModal();
 }
 $('plan-session').onclick=()=>openSession(null,'plan');
 $('session-form').onsubmit=e=>{
  e.preventDefault();
  try {
   if (sessionEdit.revision!==state.revision) throw new Error('Kontakt inzwischen geändert. Öffne den Termin erneut.');
   const c=state.contacts.find(item=>item.id===$('session-person').value);
   if (!c || c.archived) throw new Error('Kontakt nicht verfügbar.');
   const topic=$('session-topic').value.trim(), follow=$('session-follow').value;
   if (!topic) throw new Error('Bitte Schwerpunkt oder Ergebnis eintragen.');
   if (sessionEdit.mode==='cancel') writeSession(c,null,'Termin abgesagt · '+dayText(c.session.date)+' · '+c.session.topic);
   else if (sessionEdit.mode==='complete') {
    writeSession(c,follow?{...c.session,phase:'follow',follow,result:topic}:null,
     'Einheit abgeschlossen · '+dayText(c.session.date)+' · '+c.session.topic+' · '+topic+(follow?' · Nachfragen am '+dayText(follow):''));
   } else {
    const session={phase:'planned',date:$('session-date').value,time:$('session-time').value,topic,result:'',follow:''};
    writeSession(c,session,'Termin vereinbart · '+dayText(session.date)+' · '+session.time+' · '+topic);
   }
   $('session-dialog').close();
  } catch(error) { $('session-error').textContent=error.message; }
 };
 function openDraft(c,follow) {
  const task=follow ? 'Frage nach, wie die Umsetzung seit dem Training läuft. Schwerpunkt: '+c.session.topic+'. Vereinbarung: '+c.session.result :
   'Knüpfe an unseren persönlichen Kontakt an. Kontaktquelle: '+SOURCES[c.source]+'. Ziel: '+(c.goal||'[Ziel ergänzen]')+'. Nächster Schritt: '+(c.next||'[Schritt ergänzen]');
  $('draft-text').value='Formuliere für mich als Vitaltrainer eine kurze persönliche Nachricht auf Deutsch. '+task+'. Stelle eine konkrete Frage. Verwende keine Werbefloskeln und erfinde keine Details.';
  $('copy-status').textContent='';
  $('draft-dialog').showModal();
 }
 $('copy-draft').onclick=async()=>{
  try {await navigator.clipboard.writeText($('draft-text').value);$('copy-status').textContent='Kopiert. Du kannst die Vorlage in ChatGPT einfügen.';}
  catch { $('draft-text').select();$('copy-status').textContent='Text markiert. Wähle „Kopieren“. '; }
 };
 window.addEventListener('storage',e=>{if(e.key!==KEY)return;try{state=readDisk();if(editing)$('conflict-error').hidden=false;render();}catch{storageFailure();}});
 window.addEventListener('focus',()=>{$('today-label').textContent=new Date().toLocaleDateString('de-AT',{weekday:'long',day:'numeric',month:'long',year:'numeric'});render();});
 $('today-label').textContent=new Date().toLocaleDateString('de-AT',{weekday:'long',day:'numeric',month:'long',year:'numeric'});$('save-status').textContent='Einträge bleiben in diesem Browser. Nutze „Sicherung“ für einen Gerätewechsel.';render();
})();
