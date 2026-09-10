# Next Step Rad

Eine kleine Web-App für die wöchentliche Reflexion über die 5 Next-Step-Bereiche
(Glaube, Beziehungen, Gesundheit, Ressourcen, Arbeit) nach dem ICF-Modell.

Dieses Projekt ist die eigenständige, veröffentlichbare Version der App. Es
läuft komplett ohne eigenen Server – bis auf die Gruppen-Funktion, dazu gleich
mehr.

## Was du brauchst, um sie über GitHub zu veröffentlichen

Kurze Antwort auf "Reicht ein Manifest?": **Nein, ein Manifest allein reicht
nicht.** Ein `manifest.json`/`manifest.webmanifest` sagt dem Browser nur, wie
die App heißt, welches Icon sie hat und dass sie "installierbar" ist. Damit
daraus eine echte, lauffähige Web-App wird, brauchst du zusätzlich:

1. **Ein fertig gebautes HTML/CSS/JS-Paket.** Der Code, den du bisher hattest
   (die einzelne `.jsx`-Datei), läuft nur innerhalb von Claude, weil dort
   `react`, `lucide-react`, `recharts` usw. automatisch bereitgestellt werden.
   Für eine eigene Seite braucht es ein echtes Build-Setup (hier: [Vite](https://vite.dev)),
   das diese Pakete per `npm install` holt und zu normalem JavaScript bündelt.
   Das ist in diesem Projekt schon erledigt.
2. **Einen Ersatz für den Artefakt-Speicher.** Die App hat bisher über
   `window.storage` gespeichert – das gibt es nur in Claude-Artefakten. Hier
   im Projekt übernimmt das `src/storage-polyfill.js`: deine persönlichen
   Daten (Bewertungen, Next Steps, Einstellungen) landen im `localStorage`
   deines Browsers. Das reicht für die App zu 90 % völlig aus.
3. **Ein Manifest + Service Worker für "Installierbarkeit".** Das übernimmt
   das Plugin `vite-plugin-pwa` automatisch beim Build – inklusive Icons,
   die schon im `public`-Ordner liegen.
4. **Ein Hosting-Ziel.** GitHub Pages ist statisches Hosting: perfekt für
   Punkt 1–3, aber es gibt keine Datenbank und keinen eigenen Server.
5. **Optional: ein Mini-Backend für die Gruppen-Funktion.** Weil GitHub Pages
   keine Datenbank hat, kann die App von sich aus keine Daten zwischen
   verschiedenen Personen/Geräten teilen. Dafür ist hier
   [Firebase Firestore](https://firebase.google.com/) (kostenlose Stufe)
   vorbereitet – siehe Abschnitt weiter unten. Ohne diesen Schritt läuft die
   App normal, nur die Gruppen-Ansicht zeigt einen Hinweis statt der
   Gruppen-Funktion.

## Lokal ausprobieren

```bash
npm install
npm run dev
```

Öffnet die App unter `http://localhost:5173`.

## Auf GitHub veröffentlichen (GitHub Pages)

1. Neues Repository auf GitHub anlegen, z. B. `next-step-rad`.
2. In `vite.config.js` die Zeile `base: "/next-step-rad/"` an deinen
   Repo-Namen anpassen (muss exakt mit `/dein-repo-name/` übereinstimmen).
   Falls du stattdessen eine `dein-name.github.io`-Seite oder eine eigene
   Domain nutzt, setze stattdessen `base: "/"`.
3. Projekt hochladen:
   ```bash
   git init
   git add .
   git commit -m "Erste Version"
   git branch -M main
   git remote add origin https://github.com/DEIN-NAME/next-step-rad.git
   git push -u origin main
   ```
4. Auf GitHub: **Settings → Pages → Source** auf **"GitHub Actions"** stellen.
5. Der mitgelieferte Workflow (`.github/workflows/deploy.yml`) baut die App
   bei jedem Push auf `main` automatisch und veröffentlicht sie. Nach dem
   ersten Durchlauf (Reiter **Actions** auf GitHub) ist die App unter
   `https://DEIN-NAME.github.io/next-step-rad/` erreichbar.

Auf dem Handy kann man die Seite dann über "Zum Startbildschirm hinzufügen"
(iOS Safari) bzw. "App installieren" (Android Chrome) wie eine echte App
installieren.

## Gruppen-Funktion aktivieren (optional, kostenlos)

1. Gehe zu [console.firebase.google.com](https://console.firebase.google.com)
   und erstelle ein neues Projekt (kostenlos, kein Kreditkarte nötig).
2. Klicke auf das Web-Symbol `</>`, um eine Web-App hinzuzufügen. Firebase
   zeigt dir danach ein Konfigurationsobjekt – trag diese Werte in
   `src/firebaseConfig.js` ein.
3. Aktiviere im Menü links **Firestore Database → Datenbank erstellen**
   (Standardeinstellungen reichen).
4. Setze unter **Firestore → Regeln** folgende Regeln (die App hat kein
   Login-System, daher sind die Daten grundsätzlich für alle mit dem
   jeweiligen Gruppen-Code sichtbar und beschreibbar – das ist bewusst so
   einfach gehalten, siehe Hinweis in der App):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /nsr_shared/{docId} {
         allow read, write: if true;
       }
     }
   }
   ```
5. Änderungen committen und pushen – fertig, die Gruppen-Ansicht funktioniert
   jetzt für alle, die deine veröffentlichte Seite besuchen.

## Grenzen, die auch nach der Veröffentlichung bleiben

- **Erinnerungen** funktionieren weiterhin nur, wenn die App gerade geöffnet
  ist (Banner + Browser-Benachrichtigung). Ein echter Hintergrund-Push wie
  bei einer Kalender-App würde zusätzlich einen Server brauchen, der zur
  richtigen Zeit eine Push-Nachricht auslöst (z. B. über Firebase Cloud
  Messaging + eine zeitgesteuerte Cloud Function) – technisch möglich, aber
  ein eigenes, größeres Ausbaustück.
- **Kein Login:** Der Gruppen-Code ersetzt weiterhin einen echten Account.
  Jede Person mit dem Code sieht die Daten der Gruppe.
- Persönliche Daten liegen im `localStorage` des jeweiligen Browsers – wechselst
  du Gerät oder Browser, fängst du dort wieder bei null an (das war innerhalb
  von Claude nicht anders).

## Projektstruktur

```
next-step-rad/
├── .github/workflows/deploy.yml   # automatisches Deployment auf GitHub Pages
├── index.html
├── package.json
├── vite.config.js                 # PWA-/Manifest-Konfiguration, "base" anpassen!
├── public/                        # Icons für Manifest & Homescreen
└── src/
    ├── main.jsx                   # Einstiegspunkt
    ├── App.jsx                    # die eigentliche App (dein bekanntes Rad)
    ├── storage-polyfill.js        # localStorage + Firestore statt window.storage
    └── firebaseConfig.js          # hier deine Firebase-Zugangsdaten eintragen
```
