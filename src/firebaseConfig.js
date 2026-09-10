// Trag hier deine eigenen Firebase-Zugangsdaten ein, damit die Gruppen-Funktion
// (geteiltes Rad + Chat) über Geräte und Personen hinweg funktioniert.
//
// So kommst du an die Werte (kostenlos, dauert ca. 5 Minuten):
// 1. Gehe zu https://console.firebase.google.com und erstelle ein neues Projekt.
// 2. Klicke in der Projektübersicht auf das Web-Symbol (</>), um eine "Web-App" hinzuzufügen.
// 3. Firebase zeigt dir danach genau dieses Objekt an – kopier es hierher.
// 4. Aktiviere im Menü links "Firestore Database" -> "Datenbank erstellen"
//    (Standardmodus reicht; Sicherheitsregeln siehe README).
//
// Ohne diese Angaben läuft die App trotzdem einwandfrei – nur die Gruppen-Funktion
// bleibt deaktiviert und zeigt einen entsprechenden Hinweis an.

export const firebaseConfig = {
  apiKey: "AIzaSyCaq6HwJCWmdu6Sj6dFHiC3ybgb1FiWlxw",
  authDomain: "next-step-rad.firebaseapp.com",
  projectId: "next-step-rad",
  storageBucket: "next-step-rad.firebasestorage.app",
  messagingSenderId: "986424146895",
  appId: "1:986424146895:web:9d50040123be6ef5bcf0ba",
  measurementId: "G-VVZ6WRDRP9",
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);