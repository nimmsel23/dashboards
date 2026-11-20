export const clone = value => structuredClone(value);
export function emptyBase() {
  return {schema: 1, settings: {capacity: 6, monthlyGoal: 0}, records: [], updatedAt: '1970-01-01T00:00:00.000Z'};
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  }
  return value;
}
export const stable = value => JSON.stringify(canonical(value));
const equal = (a, b) => a === b || stable(a) === stable(b);
function semantic(state) {
  const records = [...state.records].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  return {schema: state.schema, settings: state.settings, records};
}
export const stateEqual = (a, b) => equal(semantic(a), semantic(b));

export function mergeStates(base, local, remote, choices = {}, timestamp = new Date().toISOString()) {
  const conflicts = [];
  function scalar(path, before, here, there) {
    if (equal(here, there) || equal(before, there)) return here;
    if (equal(before, here)) return there;
    const key = JSON.stringify(path);
    if (choices[key] === 'local') return here;
    if (choices[key] === 'remote') return there;
    conflicts.push({key, path, base: before, local: here, remote: there});
    return there;
  }
  function byId(path, before, here, there, mergeExisting) {
    const [ancestors, localItems, remoteItems] = [before, here, there].map(
      items => new Map(items.map(item => [item.id, item]))
    );
    const result = [];
    for (const id of new Set([...localItems.keys(), ...remoteItems.keys()])) {
      const a = ancestors.get(id), b = localItems.get(id), c = remoteItems.get(id);
      const itemPath = [...path, id];
      const value = a && b && c && mergeExisting ? mergeExisting(itemPath, a, b, c) : scalar(itemPath, a, b, c);
      if (value !== undefined) result.push(value);
    }
    return result;
  }
  function record(path, a, b, c) {
    if (equal(b, c) || equal(a, c)) return b;
    if (equal(a, b)) return c;
    const merged = {id: b.id};
    for (const field of Object.keys(b)) {
      const fieldPath = [...path, field];
      if (field === 'payments') merged[field] = byId(fieldPath, a[field], b[field], c[field]);
      else if (field === 'history') {
        const entries = new Map([...b.history, ...c.history].map(event => [stable(event), event]));
        merged.history = [...entries.values()].sort((x, y) => x.at.localeCompare(y.at) || x.text.localeCompare(y.text));
      } else if (field !== 'id') merged[field] = scalar(fieldPath, a[field], b[field], c[field]);
    }
    return merged;
  }
  const records = byId(['records'], base.records, local.records, remote.records, record);
  const settings = {};
  for (const field of ['capacity', 'monthlyGoal']) {
    settings[field] = scalar(['settings', field], base.settings[field], local.settings[field], remote.settings[field]);
  }
  const state = {schema: 1, records, settings, updatedAt: timestamp};
  if (stateEqual(state, remote)) state.updatedAt = remote.updatedAt;
  else if (stateEqual(state, local)) state.updatedAt = local.updatedAt;
  return {state: clone(state), conflicts: clone(conflicts)};
}
export function cloudPayload(state) {
  const json = JSON.stringify(state);
  if (new TextEncoder().encode(json).length >= 850000) {
    throw Error('Der Arbeitsstand ist zu groß für den Cloud-Abgleich. Bitte exportiere eine Sicherung.');
  }
  return json;
}
