import {emptyBase, mergeStates, stateEqual, cloudPayload} from './sync-core.mjs';

const clock = () => new Date().toISOString();
const initialMeta = () => ({schema: 1, revision: 0, base: null, lastSync: ''});

export class SyncConflict extends Error {
  constructor(bundle) {
    super('Gleichzeitige Änderungen benötigen eine Entscheidung.');
    this.bundle = bundle;
  }
}

export class SyncEngine {
  constructor({storage, key, validate, apply, onStatus = () => {}, online = () => true}) {
    Object.assign(this, {storage, key, validate, apply, onStatus, online});
    this.generation = 0;
    this.detach();
  }

  envelope() {
    const raw = this.storage.getItem(this.key);
    const parsed = raw === null ? emptyBase() : JSON.parse(raw);
    const state = this.validate(parsed);
    const meta = parsed._cloud ?? initialMeta();
    if (meta.schema !== 1 || !Number.isSafeInteger(meta.revision) || meta.revision < 0 ||
        (meta.base === null && meta.revision !== 0) || typeof meta.lastSync !== 'string') {
      throw Error('Der lokale Abgleichstand ist beschädigt. Bitte den Originalstand sichern.');
    }
    const cleanMeta = {...meta, base: meta.base === null ? null : this.validate(meta.base)};
    if (meta.mergeBase) cleanMeta.mergeBase = this.validate(meta.mergeBase);
    return {raw, state, meta: cleanMeta};
  }

  decorate(state) {
    return {...state, _cloud: this.envelope().meta};
  }

  pending(envelope = this.envelope()) {
    return !stateEqual(envelope.state, envelope.meta.base || emptyBase());
  }

  status() {
    const status = {
      connected: Boolean(this.adapter), email: this.email, ready: this.ready, busy: this.busy,
      online: this.online(), error: this.error, conflicts: this.conflict?.items || [],
      conflictRevision: this.conflict?.remote.revision ?? null,
      pending: false, revision: 0, lastSync: ''
    };
    try {
      const current = this.envelope();
      return {...status, pending: this.pending(current), revision: current.meta.revision, lastSync: current.meta.lastSync};
    } catch (error) {
      return {...status, error: error.message};
    }
  }

  notify() { this.onStatus(this.status()); }

  schedule() {
    clearTimeout(this.timer);
    if (!this.adapter || !this.ready || this.busy || this.error || this.conflict || !this.online()) return;
    this.timer = setTimeout(() => this.flush(), 120);
  }

  localChanged() {
    this.error = '';
    if (this.lastRemote && !this.busy) this.receive(this.lastRemote);
    else this.notify();
  }

  detach() {
    this.generation++;
    clearTimeout(this.timer);
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.adapter = null;
    this.email = '';
    this.ready = false;
    this.busy = false;
    this.conflict = null;
    this.lastRemote = null;
    this.deferred = null;
    this.error = '';
    this.notify();
  }

  attach(adapter, email) {
    this.detach();
    this.adapter = adapter;
    this.email = email;
    const generation = this.generation;
    const failure = error => {
      if (generation !== this.generation) return;
      this.error = error.message;
      this.notify();
    };
    try {
      this.unsubscribe = adapter.subscribe(
        remote => { if (generation === this.generation) this.receive(remote); },
        failure
      );
    } catch (error) { failure(error); }
    this.notify();
  }

  checked(remote) {
    if (!remote || !Number.isSafeInteger(remote.revision) || remote.revision < 0) throw Error('Ungültige Cloud-Version.');
    return {revision: remote.revision, state: this.validate(remote.state)};
  }

  // A valid payment can conflict with a valid change of order status.
  // Group incompatible fields so unrelated records can still be merged.
  merged(base, local, remote, choices = {}) {
    const result = mergeStates(base, local, remote, choices);
    const groupChoice = (path, a, b, c) => {
      const key = JSON.stringify(path);
      if (choices[key] === 'local') return b;
      if (choices[key] === 'remote') return c;
      result.conflicts.push({key, path, base: a, local: b, remote: c});
      return c;
    };
    try {
      result.state = this.validate(result.state);
      return result;
    } catch {
      const maps = [base, local, remote].map(s => new Map(s.records.map(r => [r.id, r])));
      result.state.records = result.state.records.flatMap(record => {
        try {
          this.validate({...result.state, records: [record]});
          return [record];
        } catch {
          result.conflicts = result.conflicts.filter(c => c.path[0] !== 'records' || c.path[1] !== record.id);
          const chosen = groupChoice(['records', record.id], ...maps.map(m => m.get(record.id)));
          return chosen ? [chosen] : [];
        }
      });
      try {
        result.state = this.validate(result.state);
      } catch {
        result.conflicts = [];
        result.state = groupChoice(['workspace'], base, local, remote);
      }
      return result;
    }
  }

  applyMerged(state, remote, local) {
    if (local.meta.base && !local.meta.mergeBase && remote.revision === local.meta.revision &&
        stateEqual(local.state, state) && stateEqual(local.meta.base, remote.state)) return;
    const meta = {schema: 1, base: remote.state, revision: remote.revision, lastSync: clock()};
    if (!this.apply(state, meta, local.raw)) throw Error('Ein anderer Tab hat gespeichert. Bitte Abgleich wiederholen.');
  }

  reconcile(local, remote, choices = {}) {
    if (remote.revision < local.meta.revision) {
      throw Error('Die Cloud-Version ist älter als der lokal bestätigte Stand. Der Abgleich wurde angehalten.');
    }
    const merged = this.merged(local.meta.mergeBase || local.meta.base || emptyBase(), local.state, remote.state, choices);
    if (merged.conflicts.length) throw new SyncConflict({raw: local.raw, remote, items: merged.conflicts, choices});
    return merged.state;
  }

  receive(snapshot) {
    try {
      const remote = this.checked(snapshot);
      if (this.lastRemote && remote.revision < this.lastRemote.revision) return;
      this.lastRemote = remote;
      if (this.busy) { this.deferred = remote; return; }
      this.ready = true;
      const local = this.envelope();
      if (remote.revision < local.meta.revision) { this.conflict = null; this.error = ''; this.notify(); return; }
      const choices = this.conflict?.raw === local.raw && this.conflict.remote.revision === remote.revision
        ? this.conflict.choices : {};
      const merged = this.reconcile(local, remote, choices);
      this.applyMerged(merged, remote, local);
      this.conflict = null;
      this.error = '';
      if (!stateEqual(merged, remote.state)) this.schedule();
    } catch (error) { this.fail(error); }
    this.notify();
  }

  fail(error) {
    if (error instanceof SyncConflict) {
      this.conflict = error.bundle;
      this.error = '';
    } else {
      this.error = error.message || String(error);
    }
  }

  async refresh() {
    const adapter = this.adapter, generation = this.generation;
    if (!adapter || !this.online()) { this.notify(); return false; }
    try {
      const remote = await adapter.read();
      if (generation !== this.generation) return false;
      this.receive(remote);
      return !this.error;
    } catch (error) {
      if (generation === this.generation) { this.fail(error); this.notify(); }
      return false;
    }
  }

  async flush(resolution = null) {
    if (!this.adapter || !this.ready || this.busy || !this.online() || (this.conflict && !resolution)) return false;
    const adapter = this.adapter, generation = this.generation;
    this.busy = true;
    this.error = '';
    this.notify();
    try {
      const start = this.envelope();
      if (resolution && resolution.raw !== start.raw) { this.deferred = this.lastRemote; return false; }
      if (!resolution && !this.pending(start)) return true;
      const acknowledged = this.checked(await adapter.transact(snapshot => {
        if (this.generation !== generation) throw Error('Abgleich beendet.');
        const remote = this.checked(snapshot);
        if (resolution && resolution.remote.revision !== remote.revision) {
          this.deferred = remote;
          throw Error('Die Cloud-Version hat sich geändert. Bitte Auswahl prüfen.');
        }
        const state = this.reconcile(start, remote, resolution?.choices);
        const write = !stateEqual(state, remote.state);
        if (write) cloudPayload(state);
        return {state: write ? state : remote.state, revision: remote.revision + Number(write), write};
      }));
      if (generation !== this.generation) return false;
      this.lastRemote = acknowledged;
      const latest = this.envelope();
      if (latest.meta.revision > acknowledged.revision) return true;
      if (latest.raw === start.raw) {
        this.applyMerged(acknowledged.state, acknowledged, latest);
      } else {
        const baseChanged = latest.meta.revision !== start.meta.revision;
        const ancestor = baseChanged ? latest.meta.mergeBase || latest.meta.base || emptyBase() : start.state;
        const rebased = this.merged(ancestor, latest.state, acknowledged.state);
        if (rebased.conflicts.length) {
          // Retain the common ancestor of edits made while the write was in flight.
          // A reload must offer the same choices after the commit.
          const meta = {schema: 1, revision: acknowledged.revision, base: acknowledged.state,
            lastSync: clock(), mergeBase: ancestor};
          if (!this.apply(latest.state, meta, latest.raw)) throw Error('Ein anderer Tab hat gespeichert. Bitte Abgleich wiederholen.');
          throw new SyncConflict({raw: this.envelope().raw, remote: acknowledged, items: rebased.conflicts, choices: {}});
        } else {
          this.applyMerged(rebased.state, acknowledged, latest);
        }
      }
      this.conflict = null;
      return true;
    } catch (error) {
      if (generation === this.generation) this.fail(error);
      return false;
    } finally {
      if (generation === this.generation) {
        this.busy = false;
        const queued = this.deferred;
        this.deferred = null;
        if (queued && (!this.lastRemote || queued.revision >= this.lastRemote.revision)) this.receive(queued);
        else this.notify();
        if (!this.conflict && !this.error && this.status().pending) this.schedule();
      }
    }
  }

  async resolve(choices, revision) {
    const current = this.conflict;
    if (!current || revision !== current.remote.revision) return false;
    if (current.items.some(({key}) => !['local','remote'].includes(choices[key]))) return false;
    return this.flush({...current, choices: {...current.choices, ...choices}});
  }
}
