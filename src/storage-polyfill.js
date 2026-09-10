// Diese Datei ersetzt die "window.storage"-API, die es nur innerhalb von
// Claude-Artefakten gibt, durch eine echte, eigenständige Implementierung:
//
//   - persönliche Daten (shared = false)  -> localStorage im Browser
//   - geteilte Gruppendaten (shared = true) -> Firebase Firestore
//
// Der Rest der App (App.jsx) ruft weiterhin ganz normal window.storage.get/set
// auf und merkt vom Wechsel nichts.

import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { firebaseConfig, isFirebaseConfigured } from "./firebaseConfig.js";

const LOCAL_PREFIX = "nsr:";

let db = null;
function getDb() {
  if (!isFirebaseConfigured) {
    throw new Error(
      "Firebase ist nicht konfiguriert. Trag deine Zugangsdaten in src/firebaseConfig.js ein."
    );
  }
  if (!db) {
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
  return db;
}

// Firestore-Dokument-IDs dürfen keine "/" enthalten.
function docId(key) {
  return key.replace(/\//g, "__");
}

async function get(key, shared) {
  if (shared) {
    const snap = await getDoc(doc(getDb(), "nsr_shared", docId(key)));
    if (!snap.exists()) return null;
    return { key, value: snap.data().value, shared: true };
  }
  const raw = localStorage.getItem(LOCAL_PREFIX + key);
  if (raw === null) return null;
  return { key, value: raw, shared: false };
}

async function set(key, value, shared) {
  if (shared) {
    await setDoc(doc(getDb(), "nsr_shared", docId(key)), {
      value,
      updatedAt: Date.now(),
    });
    return { key, value, shared: true };
  }
  localStorage.setItem(LOCAL_PREFIX + key, value);
  return { key, value, shared: false };
}

async function del(key, shared) {
  if (shared) {
    await deleteDoc(doc(getDb(), "nsr_shared", docId(key)));
    return { key, deleted: true, shared: true };
  }
  localStorage.removeItem(LOCAL_PREFIX + key);
  return { key, deleted: true, shared: false };
}

async function list(prefix, shared) {
  if (shared) {
    const snap = await getDocs(collection(getDb(), "nsr_shared"));
    const keys = [];
    snap.forEach((d) => {
      if (!prefix || d.id.startsWith(docId(prefix))) keys.push(d.id);
    });
    return { keys, prefix, shared: true };
  }
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(LOCAL_PREFIX)) {
      const real = k.slice(LOCAL_PREFIX.length);
      if (!prefix || real.startsWith(prefix)) keys.push(real);
    }
  }
  return { keys, prefix, shared: false };
}

window.storage = { get, set, delete: del, list };
