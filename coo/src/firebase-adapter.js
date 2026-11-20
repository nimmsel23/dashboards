import { initializeApp } from 'firebase/app';
import {
  getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut,
} from 'firebase/auth';
import {
  doc, getDocFromServer, initializeFirestore, memoryLocalCache, onSnapshot,
  runTransaction, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { cloudPayload, emptyBase } from './sync-core.mjs';

function workspaceAdapter(db, auth, user, validate) {
  const ref = doc(db, 'cooWorkspaces', 'main');
  function checkSession() {
    if (auth.currentUser?.uid !== user.uid) throw new Error('Google-Anmeldung hat sich geändert.');
  }
  function decode(snapshot) {
    if (!snapshot.exists()) return { state: emptyBase(), revision: 0 };
    const data = snapshot.data();
    if (data.schema !== 1 || !Number.isSafeInteger(data.revision) || data.revision < 1 ||
        typeof data.json !== 'string' || new TextEncoder().encode(data.json).length >= 850000 ||
        !(data.updatedAt instanceof Timestamp) || typeof data.updatedBy !== 'string' ||
        (data.lastRequestId !== undefined && typeof data.lastRequestId !== 'string')) {
      throw new Error('Unbekanntes Cloud-Format. Dein lokaler Stand bleibt gespeichert.');
    }
    const result = { state: validate(JSON.parse(data.json)), revision: data.revision };
    if (data.lastRequestId !== undefined) result.lastRequestId = data.lastRequestId;
    return result;
  }
  return {
    subscribe(next, error) {
      return onSnapshot(ref, { includeMetadataChanges: true }, snapshot => {
        if (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
        try {
          checkSession();
          next(decode(snapshot));
        } catch (reason) { error(reason); }
      }, error);
    },
    async read() {
      const snapshot = await getDocFromServer(ref);
      checkSession();
      return decode(snapshot);
    },
    transact(merge) {
      return runTransaction(db, async transaction => {
        const current = decode(await transaction.get(ref));
        checkSession();
        const result = merge(current);
        if (result.write) {
          if (result.revision !== current.revision + 1) throw new Error('Ungültige Arbeitsstand-Version.');
          const data = {
            schema: 1, revision: result.revision, json: cloudPayload(validate(result.state)),
            updatedAt: serverTimestamp(), updatedBy: user.email,
          };
          if (current.lastRequestId !== undefined) data.lastRequestId = current.lastRequestId;
          transaction.set(ref, data);
        }
        return { state: result.state, revision: result.revision };
      });
    },
  };
}

export function createFirebaseClient(config, validate) {
  if (config?.projectId !== 'vitalos-prod' || config.authDomain !== 'vitalos-prod.firebaseapp.com') {
    throw new Error('Die Firebase-Konfiguration gehört nicht zum COO-Dashboard.');
  }
  const app = initializeApp(config, 'coo-workspace');
  const auth = getAuth(app);
  auth.languageCode = 'de';
  const db = initializeFirestore(app, { localCache: memoryLocalCache() }, 'dashboards');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return {
    onSession(next, error) {
      let stopProbe;
      let active = true;
      const stop = onAuthStateChanged(auth, user => {
        stopProbe?.();
        next(null);
        if (!user) return;
        const deny = async () => {
          if (!active || auth.currentUser?.uid !== user.uid) return;
          await signOut(auth).catch(() => {});
          if (active) error(new Error('Dieses Google-Konto ist für den COO-Arbeitsstand nicht freigegeben.'));
        };
        if (!user.emailVerified || !user.providerData.some(entry => entry.providerId === 'google.com')) {
          void deny();
          return;
        }
        // The server checks the verified Google owner allowlist, including reads of a missing document.
        // A confirmed snapshot also handles first-time sign-in and reconnecting after an offline start.
        const ref = doc(db, 'cooWorkspaces', 'main');
        stopProbe = onSnapshot(ref, { includeMetadataChanges: true }, snapshot => {
          if (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites ||
              !active || auth.currentUser?.uid !== user.uid) return;
          stopProbe();
          next({ email: user.email, adapter: workspaceAdapter(db, auth, user, validate) });
        }, reason => {
          if (!active || auth.currentUser?.uid !== user.uid) return;
          if (reason.code === 'permission-denied') void deny();
          else error(reason);
        });
      }, error);
      return () => { active = false; stopProbe?.(); stop(); };
    },
    signIn: () => signInWithPopup(auth, provider),
    signOut: () => signOut(auth),
  };
}
