const widget=document.createElement('div');
widget.id='pwa-status';widget.setAttribute('role','status');widget.setAttribute('aria-live','polite');document.body.append(widget);
let registration,installPrompt,offlineReady=false,updateOffered=false;
const isInstalled=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const isApple=()=>/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function button(label,action){const b=document.createElement('button');b.type='button';b.className='btn';b.textContent=label;b.addEventListener('click',action);return b;}
function repaint(){
 widget.replaceChildren();const parts=[];
 if(!navigator.onLine)parts.push('Offline · Änderungen werden auf diesem Gerät gespeichert. Der Cloud-Abgleich braucht eine Internetverbindung.');
 else if(offlineReady)parts.push('App auf diesem Gerät offline bereit.');
 if(registration?.waiting){parts.push('Eine neue Version ist bereit.');widget.append(document.createTextNode(parts.join(' ')));widget.append(button('Aktualisieren',async()=>{
  const editor=document.querySelector('#editor[open]');
  if(editor){alert('Bitte den geöffneten Vorgang zuerst speichern oder schließen.');return;}
  if(!confirm('App aktualisieren und neu laden? Deine gespeicherten Vorgänge bleiben erhalten.'))return;
  if(!registration.waiting)return;updateOffered=true;registration.waiting.postMessage({type:'ACTIVATE_UPDATE'});
 }));}else if(parts.length)widget.append(document.createTextNode(parts.join(' ')));
 if(!isInstalled()){
  if(installPrompt)widget.append(button('App installieren',async()=>{const prompt=installPrompt;installPrompt=null;await prompt.prompt();await prompt.userChoice;repaint();}));
  else if(isApple())widget.append(button('Zum Home-Bildschirm',()=>alert('In Safari öffnen: Teilen → Zum Home-Bildschirm. Falls angeboten, „Als Web-App öffnen“ aktivieren. Anschließend einmal online öffnen, damit der Offline-Start vorbereitet wird.')));
 }
 widget.hidden=!widget.childNodes.length;
}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;repaint();});
window.addEventListener('appinstalled',()=>{installPrompt=null;repaint();});
window.addEventListener('online',repaint);window.addEventListener('offline',repaint);
if('serviceWorker'in navigator&&window.isSecureContext){
 window.addEventListener('load',async()=>{
  try{
   registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
   const ready=await navigator.serviceWorker.ready;
   offlineReady=!!ready.active&&!!(await caches.match(new URL('./index.html',location.href).href));repaint();
   const watch=worker=>{if(worker)worker.addEventListener('statechange',()=>{if(worker.state==='installed')repaint();});};
   watch(registration.installing);registration.addEventListener('updatefound',()=>watch(registration.installing));
   repaint();
  }catch{widget.textContent='Offline-Vorbereitung nicht verfügbar. Deine Vorgänge bleiben lokal gespeichert.';widget.hidden=false;}
 });
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(updateOffered)location.reload();});
}
repaint();
