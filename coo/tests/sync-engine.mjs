import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyBase} from '../source/sync-core.mjs';
import {SyncEngine} from '../source/sync-engine.mjs';
const key = 'workspace';
const record = (id,title=id) => ({id,title,status:'Gebucht',payments:[],history:[]});
const state = (...records) => ({...emptyBase(),records});
const snapshot = (revision,...records) => ({revision,state:state(...records)});
function validate(data) {
  for (const record of data.records) {
    if (record.payments.length && record.status === 'Pausiert') throw Error('Zahlung braucht aktiven Auftrag');
  }
  const {schema, records, settings, updatedAt} = structuredClone(data);
  return {schema, records, settings, updatedAt};
}
function setup(t, local, remote, meta = null) {
  const store = new Map();
  const storage = {getItem:k=>store.get(k) ?? null, setItem:(k,v)=>store.set(k,v)};
  if (local) storage.setItem(key, JSON.stringify({...local,...(meta ? {_cloud:meta} : {})}));
  let receive;
  const adapter = {
    subscribe(next) { receive=next; next(remote); return ()=>{}; },
    read: async()=>remote,
    async transact(update) {
      const result=update(remote);
      await adapter.wait?.();
      if (result.write) remote={state: result.state, revision: result.revision};
      return remote;
    }
  };
  const engine = new SyncEngine({storage,key,validate,apply(state,meta,raw) {
    if (storage.getItem(key)!==raw) return false;
    storage.setItem(key,JSON.stringify({...state,_cloud:meta}));
    return true;
  }});
  engine.attach(adapter,'owner');
  t.after(()=>engine.detach());
  return {
    engine,adapter,local:()=>engine.envelope().state,cloud:()=>remote,
    deliver: value=>receive(value), advance:value=>{remote=value;},
    edit(fn) {
      const value=JSON.parse(storage.getItem(key));
      fn(value);
      storage.setItem(key,JSON.stringify(value));
      engine.localChanged();
    }
  };
}
const meta = (revision,base) => ({schema:1,revision,base,lastSync:'2026-11-20T00:00:00Z'});
test('legacy local and existing cloud records combine on migration', async t=>{
  const f=setup(t,state(record('L')),snapshot(2,record('R')));
  assert.equal(f.engine.status().pending,true);
  await f.engine.flush();
  assert.deepEqual(f.cloud().state.records.map(r=>r.id).sort(), ['L','R']);
  assert.equal(f.engine.status().revision,3);
  assert.equal(f.engine.status().pending,false);
});
test('empty device reads remotely and a second tab does not continually rewrite the envelope',t=>{
  const f=setup(t,null,snapshot(1,record('R')));
  const raw=f.engine.envelope().raw;
  assert.deepEqual(f.local().records,[record('R')]);
  f.engine.localChanged();
  assert.equal(f.engine.envelope().raw,raw);
  assert.equal(f.engine.status().pending,false);
});
test('network failure keeps the full local queue',async t=>{
  const f=setup(t,state(record('L')),snapshot(1));
  f.adapter.transact=async()=>{throw Error('offline');};
  const before=f.engine.envelope().raw;
  assert.equal(await f.engine.flush(),false);
  assert.equal(f.engine.envelope().raw,before);
  assert.deepEqual(f.local().records,[record('L')]);
  assert.equal(f.engine.status().error,'offline');
});
test('newly edited local fields survive an upload',async t=>{
  const f=setup(t,state(record('L')),snapshot(0));
  f.adapter.wait=()=>{f.edit(s=>s.records[0].title='Seit Upload geändert');};
  await f.engine.flush();
  assert.equal(f.cloud().state.records[0].title,'L');
  assert.equal(f.local().records[0].title,'Seit Upload geändert');
  assert.equal(f.engine.status().pending,true);
});
test('remote update delivered during an upload is applied after the acknowledgment',async t=>{
  const f=setup(t,state(record('L')),snapshot(1));
  f.adapter.wait=()=>f.deliver(snapshot(3,record('L'),record('N')));
  await f.engine.flush();
  assert.equal(f.engine.status().revision,3);
  assert.equal(f.local().records[1].id,'N');
});
test('late acknowledgment after disconnect never changes local state',async t=>{
  const f=setup(t,state(record('L')),snapshot(1));
  const before=f.engine.envelope().raw;
  f.adapter.wait=()=>f.engine.detach();
  assert.equal(await f.engine.flush(),false);
  assert.equal(f.engine.envelope().raw,before);
});
test('stale conflict decision cannot overwrite a newer cloud revision',async t=>{
  const original=state(record('r','base'));
  const f=setup(t,state(record('r','local')),snapshot(2,record('r','remote')),meta(1,original));
  const [c]=f.engine.status().conflicts;
  f.advance(snapshot(3,record('r','newer')));
  assert.equal(await f.engine.resolve({[c.key]:'local'},2),false);
  assert.equal(f.engine.status().conflictRevision,3);
  assert.equal(f.local().records[0].title,'local');
  assert.equal(f.cloud().state.records[0].title,'newer');
});
test('invalid cross-field combination raises a record-level decision; other edits survive',async t=>{
  const r=record('r'), base=state(r);
  const p={id:'p',amount:123,date:'2026-11-20'};
  const f=setup(t,state({...r,payments:[p]},record('other')),snapshot(2,{...r,status:'Pausiert'}),meta(1,base));
  const [c]=f.engine.status().conflicts;
  assert.deepEqual(c.path,['records','r']);
  assert.equal(f.local().records[0].payments.length,1);
  assert.equal(await f.engine.resolve({[c.key]:'local'},2),true);
  assert.deepEqual(f.cloud().state.records.map(r=>r.id),['r','other']);
  assert.deepEqual(f.cloud().state.records[0].payments,[p]);
});
test('conflict survives a local edit during a transaction and a browser restart',async t=>{
  const original=state(record('r','base'));
  const f=setup(t,state(record('r','local')),snapshot(2,record('r','remote')),meta(1,original));
  const [c]=f.engine.status().conflicts;
  f.adapter.wait=()=>f.edit(s=>s.records[0].title='base');
  await f.engine.resolve({[c.key]:'remote'},2);
  assert.equal(f.local().records[0].title,'base');
  assert.equal(f.engine.status().conflicts.length,1);
  const envelope=f.engine.envelope();
  const restarted=setup(t,envelope.state,f.cloud(),envelope.meta);
  assert.equal(restarted.engine.status().conflicts[0].local,'base');
  assert.equal(await restarted.engine.resolve({[c.key]:'local'},2),true);
  assert.equal(restarted.cloud().state.records[0].title,'base');
});
