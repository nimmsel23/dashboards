import {SyncEngine} from './sync-engine.mjs';

const app=globalThis.COOState || await new Promise(resolve=>{
 window.addEventListener('coo:ready',()=>resolve(globalThis.COOState),{once:true});
});
const select=selector=>document.querySelector(selector);
const make=(tag,text,className)=>{
 const el=document.createElement(tag);
 if(text!==undefined)el.textContent=text;
 if(className)el.className=className;
 return el;
};
let client,session,stopObserver,engine,loading=false,authBusy=false,connectionError='';
let conflictStamp='',choices=new Map(),paintedPanel,paintedStatus='';
const online=()=>navigator.onLine!==false;
const dateTime=value=>{
 const date=new Date(value);
 return Number.isFinite(date.getTime())?date.toLocaleString('de-AT',{timeZone:'Europe/Vienna',dateStyle:'short',timeStyle:'short'}):'';
};
function describeError(error){
 const labels={
  'auth/popup-blocked':'Das Anmeldefenster wurde blockiert. Erlaube Pop-ups für diese Site und versuche es erneut.',
  'auth/popup-closed-by-user':'Das Anmeldefenster wurde geschlossen.',
  'auth/cancelled-popup-request':'Die Anmeldung wurde unterbrochen.',
  'auth/network-request-failed':'Google konnte nicht erreicht werden. Prüfe die Verbindung.',
  'auth/unauthorized-domain':'Google-Anmeldung ist für diese Adresse noch nicht freigeschaltet.',
  'permission-denied':'Für diesen Arbeitsstand fehlt die Freigabe. Melde dich mit deinem freigegebenen Google-Konto an.',
  'unavailable':'Die Cloud ist gerade nicht erreichbar. Änderungen bleiben auf diesem Gerät.'
 };
 return labels[error?.code] || error?.message || String(error);
}
function status(){
 try{if(engine)return engine.status();}catch(e){connectionError=describeError(e);}
 return {connected:false,ready:false,pending:false,online:online(),conflicts:[]};
}
function summary(s){
 if(s.conflicts?.length)return ['Abgleich prüfen','amber'];
 if(connectionError || s.error)return ['Abgleich prüfen','red'];
 if(!s.connected)return ['Auf diesem Gerät',''];
 if(!s.online)return [s.pending?'Offline · ausstehend':'Offline','amber'];
 if(s.busy)return ['Gleicht ab …','purple'];
 if(!s.ready)return ['Verbindet …','purple'];
 if(s.pending)return ['Upload ausstehend','amber'];
 return ['Synchronisiert','green'];
}
const names={records:'Vorgang',settings:'Planungswerte',title:'Titel',business:'Geschäftsbereich',type:'Art',status:'Status',next:'Nächster Schritt',due:'Schrittdatum',offer:'Leistung',note:'Notiz',amount:'Betrag',units:'Vereinbarte Einheiten',done:'Erfüllte Einheiten',payments:'Zahlung',history:'Verlauf',capacity:'Coaching-Plätze',monthlyGoal:'Monatsziel',date:'Zahlungsdatum',workspace:'Arbeitsstand',id:'Kennung',at:'Zeitpunkt',text:'Eintrag'};
const euro=value=>new Intl.NumberFormat('de-AT',{style:'currency',currency:'EUR'}).format(value/100);
function pathLabel(path,records){
 if(!Array.isArray(path)||!path.length)return 'Arbeitsstand';
 const parts=path.map((part,i)=>{
  if(i===1 && path[0]==='records')return records.get(part)?.title || 'Vorgang '+part;
  if(i>0 && path[i-1]==='payments')return 'Eintrag '+part;
  return Object.hasOwn(names,part)?names[part]:String(part);
 });
 return parts.filter((part,i)=>i!==0||part!=='Vorgang'||parts.length===1).join(' · ');
}
function format(value,field){
 if(value===null||value===undefined)return 'Gelöscht oder noch nicht vorhanden';
 if(value==='')return 'Leer';
 if(typeof value==='number' && (field==='amount'||field==='monthlyGoal'))return euro(value);
 if(typeof value!=='object')return String(value);
 if(Array.isArray(value))return value.length?value.map(v=>format(v,field)).join('\n'):'Keine Einträge';
 return Object.entries(value).map(([k,v])=>(Object.hasOwn(names,k)?names[k]:k)+' · '+format(v,k)).join('\n');
}
function action(label,handler,primary=false,disabled=false){
 const button=make('button',label,primary?'btn primary':'btn');
 button.type='button';button.disabled=disabled;button.addEventListener('click',handler);
 return button;
}
function addConflicts(panel,s){
 const form=make('form',undefined,'cloud-conflicts');
 const records=new Map(app.getState().records.map(r=>[r.id,r]));
 form.append(make('h3','Änderungen zusammenführen'),make('p','Wähle für jedes Feld den gewünschten Stand. Bis dahin bleiben beide Fassungen erhalten.','small muted'));
 s.conflicts.forEach((conflict,index)=>{
  const fieldset=make('fieldset');
  fieldset.append(make('legend',pathLabel(conflict.path,records)));
  for(const [side,label] of [['local','Dieses Gerät'],['remote','Cloud']]){
   const option=make('label',undefined,'cloud-option');
   const input=make('input');input.type='radio';input.name='choice-'+index;input.value=side;
   input.required=true;input.checked=choices.get(conflict.key)===side;input.disabled=s.busy;
   input.addEventListener('change',()=>choices.set(conflict.key,side));
   const text=make('span');
   text.append(make('strong',label),make('span',format(conflict[side],conflict.path?.at(-1)),'cloud-value'));
   option.append(input,text);fieldset.append(option);
  }
  form.append(fieldset);
 });
 const submit=make('button','Auswahl übernehmen','btn primary');submit.type='submit';submit.disabled=s.busy||!s.online;form.append(submit);
 const stamp=conflictStamp;
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(stamp!==conflictStamp || s.conflictRevision!==status().conflictRevision || !form.reportValidity())return;
  submit.disabled=true;
  try{
   if(await engine.resolve(Object.fromEntries(choices),s.conflictRevision))app.notify('Auswahl übernommen.');
  }catch(e){connectionError=describeError(e);}
  finally{submit.disabled=false;render();}
 });
 panel.append(form);
}
async function retry(){
 connectionError='';
 if(!client){await initialize();return;}
 if(session){
  // A failed Firestore listener is terminal and needs a fresh subscription.
  engine.attach(session.adapter,session.email);
  await engine.refresh();
 }
 render();
}
async function auth(action){
 if(authBusy||!client)return;
 authBusy=true;connectionError='';render();
 try{
  if(action==='in')await client.signIn();
  else await client.signOut();
 }catch(e){connectionError=describeError(e);}
 finally{authBusy=false;render();}
}
function render(){
 const s=status(),[label,tone]=summary(s);
 for(const el of document.querySelectorAll('[data-sync-status]')){
  el.textContent=label;
  if(el.closest('.sync-link'))el.parentElement.dataset.tone=tone;
  else el.className='pill '+tone;
 }
 const footer=select('[data-sync-footer]');
 if(footer)footer.textContent=s.connected?'Lokale Kopie · '+label:'Lokale Kopie auf diesem Gerät';
 const stamp=JSON.stringify([s.conflictRevision,s.conflicts]);
 if(conflictStamp!==stamp){choices.clear();conflictStamp=stamp;}
 const panel=select('#cloud-panel');
 if(!panel)return;
 const signature=JSON.stringify([s,connectionError,Boolean(client),loading,authBusy]);
 if(panel===paintedPanel && signature===paintedStatus)return;
 paintedPanel=panel;paintedStatus=signature;
 const fragment=document.createDocumentFragment();
 const error=connectionError || s.error;
 if(error)fragment.append(make('p',describeError(error),'cloud-error'));
 if(s.connected){
  fragment.append(make('p','Verbunden mit '+s.email,'cloud-account'));
  let detail='';
  if(!s.online)detail='Du kannst weiterarbeiten. Sobald du wieder online bist, gleicht das Dashboard deine Änderungen ab.';
  else if(!s.ready)detail='Der gespeicherte Stand wird von der Cloud geladen.';
  else if(s.pending&&!s.conflicts?.length)detail='Änderungen auf diesem Gerät warten auf den Abgleich.';
  else if(!error&&!s.conflicts?.length)detail='Deine verbundenen Geräte verwenden denselben Arbeitsstand.';
  if(detail)fragment.append(make('p',detail,'small muted'));
  if(s.lastSync)fragment.append(make('p','Zuletzt abgeglichen am '+dateTime(s.lastSync),'micro'));
  if(s.conflicts?.length)addConflicts(fragment,s);
  const actions=make('div',undefined,'actions section-gap');
  actions.append(action('Erneut abgleichen',()=>retry().catch(showError),false,!s.online||s.busy),action('Abmelden',()=>auth('out'),false,authBusy));
  fragment.append(actions,make('p','Beim Abmelden bleibt die lokale Kopie in diesem Browser.','micro section-gap'));
  const git=make('p','Der private COO-Arbeitsbereich übernimmt den Cloud-Stand etwa alle 30 Minuten. ','small muted');
  const link=make('a','Daten in GitHub öffnen');link.href='https://github.com/nimmsel23/vos/tree/main/coo/data';
  git.append(link);fragment.append(git);
 }else{
  fragment.append(make('p','Melde dich mit deinem freigegebenen Google-Konto an, um Vorgänge, Zahlungen und Planungswerte auf iPhone und Laptop zu verwenden.','small'),
   make('p','Beim ersten Abgleich werden vorhandene Vorgänge zusammengeführt. Offline erfasste Änderungen werden übertragen, sobald die App wieder online geöffnet ist.','small muted'));
  const actions=make('div',undefined,'actions section-gap');
  if(client)actions.append(action(authBusy?'Anmeldung läuft …':'Mit Google verbinden',()=>auth('in'),true,authBusy||!s.online));
  else if(!loading)actions.append(action('Verbindung erneut laden',()=>retry().catch(showError)));
  else actions.append(make('span','Anmeldung wird geladen …','small muted'));
  fragment.append(actions);
 }
 panel.replaceChildren(fragment);
}
function showError(e){connectionError=describeError(e);render();}
async function initialize(){
 if(loading)return;
 loading=true;connectionError='';render();
 try{
  if(!engine){
   engine=new SyncEngine({storage:app.storage,key:app.key,validate:app.validate,apply:app.apply,onStatus:render,online});
   globalThis.cooSync=engine;
  }
  const [{createFirebaseClient},configResponse]=await Promise.all([import('./firebase-sdk.js'),fetch('./firebase-config.json')]);
  if(!configResponse.ok)throw Error('Die Verbindungseinstellungen konnten nicht geladen werden.');
  const config=await configResponse.json();
  client=createFirebaseClient(config,app.validate);
  stopObserver?.();
  stopObserver=client.onSession(user=>{
   session=user;
   if(user){connectionError='';engine.attach(user.adapter,user.email);}
   else engine.detach();
   render();
  },showError);
 }catch(e){client=null;showError(e);}
 finally{loading=false;render();}
}
globalThis.cooSyncUI={render};
window.addEventListener('online',()=>{if(session)retry().catch(showError);else if(!client)initialize();else render();});
window.addEventListener('offline',render);
initialize();
