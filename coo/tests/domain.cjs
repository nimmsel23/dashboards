const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const {webcrypto}=require('node:crypto');
function boot(){let raw=null;const storage={getItem:()=>raw,setItem:(k,v)=>raw=v};const ctx=vm.createContext({Intl,Date,JSON,Set,Number,Error,Math,crypto:webcrypto,structuredClone,localStorage:storage,setTimeout:()=>0,clearTimeout:()=>{},document:{querySelector:()=>({textContent:'',classList:{add(){},remove(){}}})}});const code=fs.readFileSync('coo/source/app.js','utf8').split("document.addEventListener('click'")[0];vm.runInContext(code,ctx);return {ctx,storage,run:s=>vm.runInContext(s,ctx)};}
const r=()=>({id:'r1',title:'QA',business:'Coaching',type:'Auftrag',status:'Gebucht',next:'Termin abstimmen',due:'2026-11-20',note:'',offer:'',amount:90000,units:10,done:2,payments:[{id:'p1',amount:30000,date:'2026-11-19'}],history:[]});
function check(record){const b=boot();b.ctx.fixture={schema:1,settings:{capacity:6,monthlyGoal:0},records:[record]};return ()=>b.run('validate(fixture)');}
test('part payment leaves exact 600 EUR outstanding',()=>{const b=boot();b.ctx.fixture=r();assert.equal(b.run('openAmount(fixture)'),60000);});
test('completed orders retain outstanding payments',()=>{const b=boot();b.ctx.fixture={...r(),status:'Erledigt'};assert.equal(b.run('openAmount(fixture)'),60000);});
test('payments require a booked order in backups too',()=>{assert.throws(check({...r(),type:'Anfrage'}),/Zahlungen/);assert.throws(check({...r(),status:'Kontakt'}),/Zahlungen/);});
test('overfulfilment and invalid calendar dates rejected',()=>{assert.throws(check({...r(),done:11}),/ungültige/);assert.throws(check({...r(),due:'2026-02-30'}),/ungültige/);});
test('duplicate payments rejected',()=>{const row=r();row.payments.push({...row.payments[0]});assert.throws(check(row),/Zahlung/);});
test('payment amounts must use positive integer cents',()=>{const row=r();row.payments[0].amount=30.5;assert.throws(check(row),/Zahlung/);});
test('save refuses concurrent-tab replacement',()=>{const b=boot();b.run('save(defaults())');b.storage.setItem('',JSON.stringify({schema:1,settings:{capacity:7,monthlyGoal:0},records:[],updatedAt:'2026-11-19T10:00:00Z'}));assert.equal(b.run('save(defaults())'),false);assert.equal(JSON.parse(b.storage.getItem()).settings.capacity,7);});
test('all steps display more than twenty items',()=>{const b=boot();b.ctx.rows=Array.from({length:25},(_,i)=>({...r(),id:String(i)}));assert.equal((b.run('dueRows(rows)').match(/data-step=/g)||[]).length,25);});
test('escaping prevents imported text from becoming HTML',()=>{assert.equal(boot().run('esc("<img onerror=x>")'),'&lt;img onerror=x&gt;');});
test('step completion refuses a different step changed during confirmation',async()=>{const b=boot();b.ctx.initial=r();b.run('data.records.push(initial);save(data);confirmAction=async()=>{const fresh=JSON.parse(localStorage.getItem(KEY));fresh.records[0].next="Anderer neuer Schritt";localStorage.setItem(KEY,JSON.stringify(fresh));return true;}');await b.run('step("r1")');assert.equal(JSON.parse(b.storage.getItem()).records[0].next,'Anderer neuer Schritt');});
test('step completion tolerates deletion during confirmation',async()=>{const b=boot();b.ctx.initial=r();b.run('data.records.push(initial);save(data);confirmAction=async()=>{const fresh=JSON.parse(localStorage.getItem(KEY));fresh.records=[];localStorage.setItem(KEY,JSON.stringify(fresh));return true;}');await b.run('step("r1")');assert.equal(JSON.parse(b.storage.getItem()).records.length,0);});
