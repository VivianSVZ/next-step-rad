import React, { useState, useEffect } from "react";
import { RotateCcw, Copy } from "lucide-react";
import { AREA_ORDER, AREA_META } from "../constants.js";
import { isFirebaseConfigured } from "../firebaseConfig.js";

export function SettingsView({
  profile,
  updateProfile,
  onResetColors,
  onResetData,
  onStartSync,
  onConnectSync,
  onStopSync,
  syncBusy,
  syncError,
}) {
  const [name, setName] = useState(profile.name || "");
  const [syncCodeInput, setSyncCodeInput] = useState("");

  useEffect(() => {
    setName(profile.name || "");
  }, [profile.name]);

  return (
    <div className="nsr-view">
      <h2 className="nsr-view-title">Einstellungen</h2>

      <div className="nsr-card">
        <p className="nsr-sheet-subhead">Dein Name</p>
        <p className="nsr-hint">Wird in Gruppen angezeigt, damit andere dich erkennen.</p>
        <input
          type="text"
          className="nsr-input"
          value={name}
          placeholder="z. B. Julia"
          onChange={(e) => setName(e.target.value)}
          onBlur={() => updateProfile({ name })}
        />
      </div>

      <div className="nsr-card">
        <div className="nsr-row-between">
          <p className="nsr-sheet-subhead" style={{ margin: 0 }}>
            Farben des Rads
          </p>
          <button className="nsr-link-btn" onClick={onResetColors}>
            <RotateCcw size={14} /> Zurücksetzen
          </button>
        </div>
        {AREA_ORDER.map((key) => {
          const meta = AREA_META[key];
          const Icon = meta.icon;
          return (
            <div className="nsr-color-row" key={key}>
              <Icon size={17} strokeWidth={2} color={profile.colors[key] || meta.defaultColor} />
              <span>{meta.label}</span>
              <input
                type="color"
                value={profile.colors[key] || meta.defaultColor}
                onChange={(e) =>
                  updateProfile({ colors: { ...profile.colors, [key]: e.target.value } })
                }
              />
            </div>
          );
        })}
      </div>

      <div className="nsr-card">
        <p className="nsr-sheet-subhead">Geräte-Synchronisierung</p>
        {!isFirebaseConfigured ? (
          <p className="nsr-hint">
            Braucht denselben kostenlosen Firebase-Speicher wie die Gruppen-Funktion. Trag deine
            Zugangsdaten in <code>src/firebaseConfig.js</code> ein, dann erscheint hier ein Sync-Code.
          </p>
        ) : profile.syncCode ? (
          <>
            <p className="nsr-hint">
              Auf deinem neuen Gerät: App öffnen → Einstellungen → diesen Code eingeben. Deine Daten
              werden dann übernommen und beide Geräte gleichen sich ab.
            </p>
            <div className="nsr-code-card" style={{ marginTop: 10 }}>
              <div className="nsr-code-info">
                <p className="nsr-hint" style={{ margin: 0 }}>
                  Dein Sync-Code
                </p>
                <p className="nsr-group-name">{profile.syncCode}</p>
              </div>
              <div className="nsr-code-actions">
                <button
                  className="nsr-icon-btn"
                  title="Code kopieren"
                  onClick={() => {
                    if (navigator.clipboard) navigator.clipboard.writeText(profile.syncCode);
                  }}
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>
            <button className="nsr-btn nsr-btn-ghost" style={{ marginTop: 12 }} onClick={onStopSync}>
              Sync beenden
            </button>
          </>
        ) : (
          <>
            <p className="nsr-hint">
              Erstelle einen persönlichen Code, um deine Bewertungen und Next Steps auf ein neues Gerät zu
              übertragen.
            </p>
            <button className="nsr-btn nsr-btn-primary" style={{ marginTop: 6 }} onClick={onStartSync} disabled={syncBusy}>
              {syncBusy ? "Einen Moment …" : "Sync-Code erstellen"}
            </button>
            <p className="nsr-hint" style={{ marginTop: 16 }}>
              Hast du schon einen Code von einem anderen Gerät?
            </p>
            <div className="nsr-field-row">
              <input
                type="text"
                className="nsr-input"
                placeholder="z. B. AB12CD34"
                value={syncCodeInput}
                onChange={(e) => setSyncCodeInput(e.target.value)}
                maxLength={12}
              />
              <button
                className="nsr-btn nsr-btn-secondary"
                disabled={!syncCodeInput.trim() || syncBusy}
                onClick={() => onConnectSync(syncCodeInput)}
              >
                Übernehmen
              </button>
            </div>
          </>
        )}
        {syncError && <p className="nsr-error">{syncError}</p>}
      </div>

      <div className="nsr-card">
        <p className="nsr-sheet-subhead">Daten</p>
        <p className="nsr-hint">Löscht alle deine gespeicherten Wochenbewertungen und Next Steps unwiderruflich.</p>
        <button className="nsr-btn nsr-btn-danger" onClick={onResetData}>
          Alle Bewertungen löschen
        </button>
      </div>
    </div>
  );
}
