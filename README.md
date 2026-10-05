# Next Step Rad

Eine kleine Web-App für die wöchentliche Reflexion über die 5 Next-Step-Bereiche
(Glaube, Beziehungen, Gesundheit, Ressourcen, Arbeit) nach dem ICF-Modell.

Dieses Projekt ist die eigenständige, veröffentlichbare Version der App. Es
läuft komplett ohne eigenen Server – bis auf die Gruppen-Funktion.


## Lokal ausprobieren

```bash
npm install
npm run dev
```

Öffnet die App unter `http://localhost:5173`.

## Projektstruktur

```
next-step-rad/
├── .github/workflows/deploy.yml   # automatisches Deployment auf GitHub Pages
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js                 # PWA-/Manifest-Konfiguration
├── public/                        # Icons für Manifest & Homescreen
└── src/
    ├── main.jsx                   # Einstiegspunkt
    ├── App.jsx                    # die eigentliche App
    ├── storage-polyfill.js        # localStorage + Firestore
    ├── firestoreApi.js
    ├── style.css 
    └── firebaseConfig.js          # Firebase-Zugangsdaten
```
