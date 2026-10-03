// Strukturierte Firestore-Zugriffe für Gruppen und Geräte-Sync.
//
//   people/{personId}                        -> { name, updatedAt }
//   groups/{code}                            -> { name, createdBy, createdAt }
//   groups/{code}/members/{personId}         -> { name, joinedAt }
//   groups/{code}/wheels/{personId}          -> { scores, nextStep, updatedAt }
//   groups/{code}/chat/{messageId}           -> { memberId, name, text, ts }
//   syncs/{code}                             -> { ...Profilfelder, updatedAt }
//   syncs/{code}/entries/{weekId}            -> { weekId, date, scores, nextStep }

import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { firebaseConfig, isFirebaseConfigured } from "./firebaseConfig.js";

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

/* ---------------------------- Personen --------------------------------- */

export async function upsertPerson(personId, name) {
  await setDoc(
    doc(getDb(), "people", personId),
    { name: name || "Anonym", updatedAt: Date.now() },
    { merge: true }
  );
}

/* ----------------------------- Gruppen ---------------------------------- */

export async function createGroupDoc(code, personId, name) {
  await setDoc(doc(getDb(), "groups", code), {
    name: name || "Gruppe " + code,
    createdBy: personId,
    createdAt: Date.now(),
  });
}

export async function getGroupDoc(code) {
  const snap = await getDoc(doc(getDb(), "groups", code));
  return snap.exists() ? snap.data() : null;
}

export async function renameGroupDoc(code, name) {
  await setDoc(doc(getDb(), "groups", code), { name }, { merge: true });
}

export async function transferAdmin(code, newAdminId) {
  await setDoc(doc(getDb(), "groups", code), { createdBy: newAdminId }, { merge: true });
}

export async function addGroupMember(code, personId, name) {
  await setDoc(doc(getDb(), "groups", code, "members", personId), {
    name: name || "Anonym",
    joinedAt: Date.now(),
  });
}

export async function updateMemberName(code, personId, name) {
  await setDoc(
    doc(getDb(), "groups", code, "members", personId),
    { name: name || "Anonym" },
    { merge: true }
  );
}

export async function removeGroupMember(code, personId) {
  await deleteDoc(doc(getDb(), "groups", code, "members", personId));
  try {
    await deleteDoc(doc(getDb(), "groups", code, "wheels", personId));
  } catch (e) {
    /* kein Rad vorhanden, ignorieren */
  }
}

export async function getGroupMembers(code) {
  const snap = await getDocs(collection(getDb(), "groups", code, "members"));
  const members = [];
  snap.forEach((d) => members.push({ id: d.id, ...d.data() }));
  return members;
}

export async function setGroupWheel(code, personId, data) {
  await setDoc(doc(getDb(), "groups", code, "wheels", personId), {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function getGroupWheels(code) {
  const snap = await getDocs(collection(getDb(), "groups", code, "wheels"));
  const wheels = {};
  snap.forEach((d) => {
    wheels[d.id] = d.data();
  });
  return wheels;
}

export async function addChatMessage(code, personId, name, text) {
  await addDoc(collection(getDb(), "groups", code, "chat"), {
    memberId: personId,
    name: name || "Anonym",
    text,
    ts: Date.now(),
  });
}

export async function getChatMessages(code) {
  const q = query(collection(getDb(), "groups", code, "chat"), orderBy("ts", "asc"), limit(200));
  const snap = await getDocs(q);
  const messages = [];
  snap.forEach((d) => messages.push({ id: d.id, ...d.data() }));
  return messages;
}

/* ------------------------- Geräte-Synchronisierung ----------------------- */

export async function setSyncProfile(code, profileData) {
  await setDoc(doc(getDb(), "syncs", code), { ...profileData, updatedAt: Date.now() });
}

export async function getSyncProfile(code) {
  const snap = await getDoc(doc(getDb(), "syncs", code));
  return snap.exists() ? snap.data() : null;
}

export async function setSyncEntry(code, entry) {
  await setDoc(doc(getDb(), "syncs", code, "entries", entry.weekId), entry);
}

export async function getSyncEntries(code) {
  const snap = await getDocs(collection(getDb(), "syncs", code, "entries"));
  const entries = [];
  snap.forEach((d) => entries.push(d.data()));
  entries.sort((a, b) => (a.weekId || "").localeCompare(b.weekId || ""));
  return entries;
}

export async function deleteAllSyncEntries(code) {
  const snap = await getDocs(collection(getDb(), "syncs", code, "entries"));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}
