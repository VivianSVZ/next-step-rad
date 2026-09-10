// Polyfill zuerst importieren, damit window.storage bereitsteht, bevor App
// beim Mounten die erste Abfrage macht.
import "storage-polyfill.js";

import React from "react";
import ReactDOM from "react-dom/client";
import App from "App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
