import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyBase, mergeStates, stateEqual, cloudPayload} from '../source/sync-core.mjs';
const record = id => ({id, title: 'Plan', status: 'Gebucht', payments: [], history: []});
const state = (...records) => ({...emptyBase(), records});
const payment = (id, amount) => ({id, amount, date: '2026-11-20'});
const edit = (s, callback) => { const copy = structuredClone(s); callback(copy); return copy; };
test('first sync joins independent records, including unusual IDs', () => {
  const m = mergeStates(state(), state(record('__proto__')), state(record('a/b')));
  assert.deepEqual(m.conflicts, []);
  assert.deepEqual(m.state.records.map(r => r.id).sort(), ['__proto__','a/b']);
});
test('separate record fields merge', () => {
  const a = state(record('r'));
  const b = edit(a, s => s.records[0].title = 'Hier');
  const c = edit(a, s => s.records[0].status = 'Erledigt');
  const m = mergeStates(a,b,c);
  assert.deepEqual(m.conflicts, []);
  assert.equal(m.state.records[0].title, 'Hier');
  assert.equal(m.state.records[0].status, 'Erledigt');
});
test('independent partial payments and history entries survive', () => {
  const a = state(record('r'));
  function add(s, id) {
    s.records[0].payments.push(payment(id, 100));
    s.records[0].history.push({at: '2026-11-20', text: id});
  }
  const m = mergeStates(a, edit(a,s=>add(s,'x')), edit(a,s=>add(s,'y')));
  assert.deepEqual(m.conflicts, []);
  assert.deepEqual(m.state.records[0].payments.map(p=>p.id).sort(), ['x','y']);
  assert.deepEqual(m.state.records[0].history.map(p=>p.text), ['x','y']);
});
test('different edits of one payment require explicit decision', () => {
  const a = state({...record('r'), payments: [payment('p', 100)]});
  const b = edit(a, s => s.records[0].payments[0].amount = 200);
  const c = edit(a, s => s.records[0].payments[0].amount = 300);
  const [conflict] = mergeStates(a,b,c).conflicts;
  assert.deepEqual(conflict.path, ['records','r','payments','p']);
  for (const [choice,amount] of [['local',200],['remote',300]]) {
    const m = mergeStates(a,b,c,{[conflict.key]:choice});
    assert.equal(m.state.records[0].payments[0].amount, amount);
    assert.deepEqual(m.conflicts, []);
  }
});
test('deletion requires an explicit decision when the other side edited the record', () => {
  const a = state(record('r')), b = state(), c = edit(a,s=>s.records[0].title='C');
  const [conflict] = mergeStates(a,b,c).conflicts;
  assert.equal(conflict.local, undefined);
  assert.deepEqual(mergeStates(a,b,c,{[conflict.key]:'local'}).state.records, []);
  assert.deepEqual(mergeStates(a,b,a).state.records, []);
});
test('independent settings merge and conflicting settings require a choice', () => {
  const a = state(), b = edit(a,s=>s.settings.capacity=9), c = edit(a,s=>s.settings.monthlyGoal=100);
  assert.deepEqual(mergeStates(a,b,c).state.settings, {capacity:9,monthlyGoal:100});
  c.settings.capacity = 12;
  assert.deepEqual(mergeStates(a,b,c).conflicts[0].path, ['settings','capacity']);
});
test('root timestamp and record order do not create a write', () => {
  const a = state(record('x'),record('y'));
  const b = edit(a, s=>{s.records.reverse(); s.updatedAt='new';});
  assert.equal(stateEqual(a,b), true);
});
test('payload limit counts UTF-8 bytes', () => {
  assert.deepEqual(JSON.parse(cloudPayload(state())), state());
  assert.throws(()=>cloudPayload({note:'ü'.repeat(425000)}), /zu groß/);
});
