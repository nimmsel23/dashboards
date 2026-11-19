/* Bump VERSION with any shell, script, style or manifest change. */
const VERSION='pwa-v1';
const PREFIX='vitalos-coo-shell-';
const CACHE=PREFIX+VERSION;
const ROOT=new URL('./',self.location.href);
const SHELL=new URL('./index.html',ROOT).href;
const OFFLINE=new URL('./offline.html',ROOT).href;
const ASSETS=['app.css','app.js','pwa.js','favicon.svg','manifest.webmanifest','offline.html','icons/icon-180.png','icons/icon-192.png','icons/icon-512.png','icons/maskable-192.png','icons/maskable-512.png'].map(path=>new URL(path,ROOT).href);
const MARKER='<meta name="vitalos-coo-app" content="1">';
const BUILD='<meta name="coo-build" content="'+VERSION+'">';
async function signedShell(response){return response.ok&&response.headers.get('content-type')?.includes('text/html')&&(await response.clone().text()).includes(MARKER);}
async function sameBuild(response){return (await response.clone().text()).includes(BUILD);}
function validAsset(url,response){if(!response.ok||response.redirected)return false;const type=response.headers.get('content-type')||'';if(url.endsWith('.js'))return /javascript/.test(type);if(url.endsWith('.css'))return /text\/css/.test(type);if(url.endsWith('.png'))return /image\/png/.test(type);if(url.endsWith('.svg'))return /image\/svg/.test(type);if(url.endsWith('.webmanifest'))return /json|manifest/.test(type);return url===OFFLINE&&/text\/html/.test(type);}
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 try{
  await Promise.all(ASSETS.map(async url=>{const r=await fetch(new Request(url,{cache:'reload',credentials:'same-origin'}));if(!validAsset(url,r))throw Error('Static asset unavailable');await cache.put(url,r);}));
  const shell=await fetch(new Request(ROOT.href,{cache:'reload',credentials:'same-origin'}));
  if(await signedShell(shell)&&await sameBuild(shell))await cache.put(SHELL,shell);
 }catch(error){await caches.delete(CACHE);throw error;}
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 await Promise.all((await caches.keys()).filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)));
 await self.clients.claim();
})()));
self.addEventListener('message',event=>{
 if(event.data?.type==='ACTIVATE_UPDATE'&&event.source?.url&&new URL(event.source.url).origin===ROOT.origin)event.waitUntil(self.skipWaiting());
});
async function navigation(request){
 const cache=await caches.open(CACHE);
 try{
  const response=await fetch(request);
  if(await signedShell(response)){
   if(await sameBuild(response)){await cache.put(SHELL,response.clone());return response;}
   // Keep the active shell and its assets on the same release until an explicit update.
   return await cache.match(SHELL)||response;
  }
  // A live login/error response wins; do not serve a cached dashboard over it.
  await cache.delete(SHELL);
  return response;
 }catch{
  return await cache.match(SHELL)||await cache.match(OFFLINE)||new Response('Offline. Bitte einmal online öffnen.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
 }
}
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==ROOT.origin||url.search)return;
 if(request.mode==='navigate'&&(url.pathname===ROOT.pathname||url.href===SHELL)){event.respondWith(navigation(request));return;}
 if(!ASSETS.includes(url.href))return; // Private snapshots, auth, APIs and external URLs stay network-only.
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),cached=await cache.match(url.href);
  if(cached)return cached;
  const response=await fetch(request);
  if(validAsset(url.href,response))await cache.put(url.href,response.clone());
  return response;
 })());
});
