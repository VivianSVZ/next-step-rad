import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Menu,
  X,
  Home as HomeIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Users,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { isFirebaseConfigured } from "./firebaseConfig.js";
import {
  upsertPerson,
  createGroupDoc,
  getGroupDoc,
  renameGroupDoc,
  transferAdmin,
  addGroupMember,
  updateMemberName,
  removeGroupMember,
  getGroupMembers,
  setGroupWheel,
  clearGroupWheel,
  getGroupWheels,
  addChatMessage,
  getChatMessages,
  setSyncProfile,
  getSyncProfile,
  setSyncEntry,
  getSyncEntries,
  deleteAllSyncEntries,
} from "./firestoreApi.js";
import { AREA_ORDER, AREA_META, VERSE } from "./constants.js";
import { generateGroupCode, generateSyncCode, normalizeCode } from "./utils/ids.js";
import { getISOWeekId } from "./utils/date.js";
import { storageGet, storageSet } from "./utils/storage.js";
import { defaultProfile } from "./utils/profile.js";
import { Wheel } from "./components/Wheel.jsx";
import { InfoSheet } from "./components/InfoSheet.jsx";
import { CheckinSheet } from "./components/CheckinSheet.jsx";
import { HistoryView } from "./components/HistoryView.jsx";
import { SettingsView } from "./components/SettingsView.jsx";
import { GroupsView } from "./components/GroupsView.jsx";

export default function NextStepRad() {
  const [loaded, setLoaded] = useState(false);
  const [storagePersistent, setStoragePersistent] = useState(true);
  const [profile, setProfile] = useState(defaultProfile());
  const [entries, setEntries] = useState([]);
  const [view, setView] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoArea, setInfoArea] = useState(null);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [checkinStep, setCheckinStep] = useState(1);
  const [tempScores, setTempScores] = useState({});
  const [nextStepArea, setNextStepArea] = useState(null);
  const [nextStepText, setNextStepText] = useState("");
  const [shareWithGroup, setShareWithGroup] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [groupState, setGroupState] = useState({
    members: [],
    chat: [],
    name: "",
    loading: false,
    error: "",
  });
  const profileRef = useRef(profile);
  const profileIdRef = useRef(profile.id);
  useEffect(() => {
    profileRef.current = profile;
    profileIdRef.current = profile.id;
  }, [profile]);

  const [syncBusy, setSyncBusy] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [showAnleitung, setShowAnleitung] = useState(false);

  /* --- Laden beim Start --- */
  useEffect(() => {
    if (typeof window !== "undefined" && window.storage && window.storage.isPersistent === false) {
      setStoragePersistent(false);
    }
    (async () => {
      let p = defaultProfile();
      const rawProfile = await storageGet("profile");
      if (rawProfile) {
        try {
          const parsed = JSON.parse(rawProfile);
          p = { ...p, ...parsed, colors: { ...p.colors, ...(parsed.colors || {}) } };
        } catch (e) {
          /* Profil beschädigt, Standard verwenden */
        }
      }
      let e = [];
      const rawEntries = await storageGet("entries");
      if (rawEntries) {
        try {
          const parsed = JSON.parse(rawEntries);
          if (Array.isArray(parsed)) e = parsed;
        } catch (err) {
          /* Historie beschädigt, leer starten */
        }
      }
      if (p.syncCode) {
        try {
          const remoteProfile = await getSyncProfile(p.syncCode);
          if (remoteProfile) {
            p = { ...p, ...remoteProfile, syncCode: p.syncCode, colors: { ...p.colors, ...(remoteProfile.colors || {}) } };
          }
          const remoteEntries = await getSyncEntries(p.syncCode);
          if (remoteEntries.length > 0) e = remoteEntries;
        } catch (err) {
          /* Sync nicht erreichbar, lokale Version behalten */
        }
      }
      setProfile(p);
      setEntries(e);
      setLoaded(true);
      await storageSet("profile", JSON.stringify(p));
      await storageSet("entries", JSON.stringify(e));
    })();
  }, []);

  const currentWeekId = getISOWeekId();
  const hasCheckedInThisWeek = entries.some((e) => e.weekId === currentWeekId);
  const latestScores = entries.length > 0 ? entries[entries.length - 1].scores : {};

  /* --- Toast automatisch ausblenden --- */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  /* --- Gruppendaten laden + Polling --- */
  const loadGroupData = useCallback(
    async (code) => {
      if (!code) return;
      setGroupState((prev) => ({ ...prev, loading: true, error: "" }));
      try {
        const groupDoc = await getGroupDoc(code);
        const members = await getGroupMembers(code);
        const wheels = await getGroupWheels(code);
        const withWheels = members.map((m) => ({ ...m, ...(wheels[m.id] || {}) }));
        const chat = await getChatMessages(code);
        setGroupState({
          members: withWheels,
          chat,
          name: (groupDoc && groupDoc.name) || "",
          createdBy: groupDoc ? groupDoc.createdBy : null,
          loading: false,
          error: "",
        });
        // Falls man selbst nicht mehr in der Mitgliederliste steht (z. B. vom
        // Admin entfernt), lokal aufräumen statt in einer "Geister-Gruppe" zu bleiben.
        if (profileIdRef.current && !members.some((m) => m.id === profileIdRef.current)) {
          const updated = { ...profileRef.current, groupCode: null };
          setProfile(updated);
          storageSet("profile", JSON.stringify(updated));
          if (updated.syncCode) setSyncProfile(updated.syncCode, updated).catch(() => {});
          setToast("Du wurdest aus der Gruppe entfernt.");
        }
      } catch (e) {
        setGroupState((prev) => ({ ...prev, loading: false, error: "Gruppendaten konnten nicht geladen werden." }));
      }
    },
    []
  );

  useEffect(() => {
    if (view !== "groups" || !profile.groupCode) return;
    loadGroupData(profile.groupCode);
    const interval = setInterval(() => loadGroupData(profile.groupCode), 8000);
    return () => clearInterval(interval);
  }, [view, profile.groupCode, loadGroupData]);

  /* --- Persönliche Daten speichern (lokal + optional Sync) --- */
  async function persistProfile(updated) {
    setProfile(updated);
    await storageSet("profile", JSON.stringify(updated));
    if (updated.syncCode) {
      try {
        await setSyncProfile(updated.syncCode, updated);
      } catch (e) {
        /* offline o. Ä., lokale Version bleibt trotzdem gespeichert */
      }
    }
    if (updated.groupCode || updated.syncCode) {
      try {
        await upsertPerson(updated.id, { name: updated.name || "Anonym", syncCode: updated.syncCode || null });
      } catch (e) {
        /* Personeneintrag nicht kritisch für die App-Funktion */
      }
    }
    if (updated.groupCode) {
      try {
        await updateMemberName(updated.groupCode, updated.id, updated.name || "Anonym");
      } catch (e) {
        /* Namensaktualisierung in der Gruppe nicht kritisch */
      }
    }
  }

  async function persistEntries(updatedEntries) {
    setEntries(updatedEntries);
    await storageSet("entries", JSON.stringify(updatedEntries));
  }

  /* --- Profil aktualisieren + persistieren --- */
  async function updateProfile(patch) {
    let updated = { ...profile, ...patch };
    if (patch.colors) updated.colors = { ...profile.colors, ...patch.colors };
    await persistProfile(updated);
  }

  function resetColors() {
    const colors = {};
    AREA_ORDER.forEach((k) => (colors[k] = AREA_META[k].defaultColor));
    updateProfile({ colors });
  }

  async function resetAllData() {
    if (!window.confirm("Wirklich alle gespeicherten Bewertungen und Next Steps löschen?")) return;
    await persistEntries([]);
    if (profile.syncCode) {
      try {
        await deleteAllSyncEntries(profile.syncCode);
      } catch (e) {
        /* Sync nicht erreichbar, lokale Löschung hat trotzdem geklappt */
      }
    }
    if (profile.groupCode) {
      await clearGroupWheel(profile.groupCode, profile.id);
      if (view === "groups") loadGroupData(profile.groupCode);
    }
    setToast("Daten gelöscht");
  }

  /* --- Geräte-Synchronisierung (persönlicher Sync-Code) --- */
  async function startSync() {
    setSyncBusy(true);
    setSyncError("");
    try {
      const code = generateSyncCode();
      const updated = { ...profile, syncCode: code };
      await persistProfile(updated);
      await Promise.all(entries.map((entry) => setSyncEntry(code, entry)));
    } catch (e) {
      setSyncError("Sync konnte nicht gestartet werden. Prüf deine Internetverbindung.");
    }
    setSyncBusy(false);
  }

  async function connectSync(rawCode) {
    const code = normalizeCode(rawCode);
    if (!code) return;
    setSyncBusy(true);
    setSyncError("");
    try {
      const remoteProfile = await getSyncProfile(code);
      const remoteEntries = await getSyncEntries(code);
      if (!remoteProfile && remoteEntries.length === 0) {
        setSyncError("Kein Sync-Code mit gespeicherten Daten gefunden. Bitte Code prüfen.");
        setSyncBusy(false);
        return;
      }
      const merged = {
        ...profile,
        ...(remoteProfile || {}),
        syncCode: code,
        colors: { ...profile.colors, ...((remoteProfile && remoteProfile.colors) || {}) },
      };
      setProfile(merged);
      setEntries(remoteEntries);
      await storageSet("profile", JSON.stringify(merged));
      await storageSet("entries", JSON.stringify(remoteEntries));
      setToast("Daten übernommen");
    } catch (e) {
      setSyncError("Verbindung fehlgeschlagen. Prüf deine Internetverbindung.");
    }
    setSyncBusy(false);
  }

  async function stopSync() {
    await persistProfile({ ...profile, syncCode: null });
  }

  /* --- Check-in Flow --- */
  function openCheckin() {
    const currentWeekEntry = entries.find((e) => e.weekId === currentWeekId);
    setTempScores({ ...latestScores });
    setNextStepArea(currentWeekEntry ? currentWeekEntry.nextStep.area : null);
    setNextStepText(currentWeekEntry ? currentWeekEntry.nextStep.text : "");
    setShareWithGroup(true);
    setCheckinStep(1);
    setCheckinOpen(true);
    setInfoArea(null);
  }

  async function saveCheckin() {
    setSaving(true);
    const weekId = getISOWeekId();
    const scores = {};
    AREA_ORDER.forEach((k) => (scores[k] = tempScores[k] ?? 5));
    const entry = {
      weekId,
      date: new Date().toISOString(),
      scores,
      nextStep: { area: nextStepArea, text: nextStepText.trim() },
    };
    const newEntries = [...entries.filter((e) => e.weekId !== weekId), entry].sort((a, b) =>
      a.weekId.localeCompare(b.weekId)
    );
    await persistEntries(newEntries);

    if (profile.syncCode) {
      try {
        await setSyncEntry(profile.syncCode, entry);
      } catch (e) {
        /* Sync nicht erreichbar, lokale Speicherung hat trotzdem geklappt */
      }
    }

    if (profile.groupCode && shareWithGroup) {
      try {
        await setGroupWheel(profile.groupCode, profile.id, {
          scores,
          nextStep: { area: nextStepArea, text: nextStepText.trim() },
        });
      } catch (e) {
        /* Teilen fehlgeschlagen, eigener Eintrag ist trotzdem gespeichert */
      }
    }

    setSaving(false);
    setCheckinOpen(false);
    setToast("Gespeichert – dein nächster Schritt ist notiert.");
  }

  /* --- Gruppen-Aktionen --- */
  async function shareLatestEntryToGroup(code) {
    if (entries.length === 0) return;
    const latest = entries[entries.length - 1];
    try {
      await setGroupWheel(code, profile.id, { scores: latest.scores, nextStep: latest.nextStep });
    } catch (e) {
      /* nicht kritisch, der Beitritt selbst hat trotzdem geklappt */
    }
  }

  async function createGroup() {
    setGroupState((prev) => ({ ...prev, error: "" }));
    try {
      const code = generateGroupCode();
      await upsertPerson(profile.id, { name: profile.name || "Anonym" });
      await createGroupDoc(code, profile.id, "Gruppe " + code);
      await addGroupMember(code, profile.id, profile.name || "Anonym");
      const updated = { ...profile, groupCode: code };
      await persistProfile(updated);
      await shareLatestEntryToGroup(code);
      loadGroupData(code);
    } catch (e) {
      setGroupState((prev) => ({ ...prev, error: "Gruppe konnte nicht erstellt werden. Prüf deine Internetverbindung." }));
    }
  }

  async function joinGroup(rawCode) {
    const code = normalizeCode(rawCode);
    if (!code) return;
    setGroupState((prev) => ({ ...prev, error: "" }));
    try {
      const groupDoc = await getGroupDoc(code);
      if (!groupDoc) {
        setGroupState((prev) => ({ ...prev, error: "Keine Gruppe mit diesem Code gefunden." }));
        return;
      }
      await upsertPerson(profile.id, { name: profile.name || "Anonym" });
      await addGroupMember(code, profile.id, profile.name || "Anonym");
      const updated = { ...profile, groupCode: code };
      await persistProfile(updated);
      await shareLatestEntryToGroup(code);
      loadGroupData(code);
    } catch (e) {
      setGroupState((prev) => ({ ...prev, error: "Verbindung zur Gruppe ist fehlgeschlagen. Versuch es noch einmal." }));
    }
  }

  async function leaveGroup(chosenSuccessorId) {
    const code = profile.groupCode;
    if (code) {
      try {
        const wasAdmin = groupState.createdBy === profile.id;
        await removeGroupMember(code, profile.id);
        if (wasAdmin) {
          let nextAdminId = chosenSuccessorId || null;
          if (!nextAdminId) {
            // Fallback, falls keine Auswahl übergeben wurde (z. B. letztes Mitglied übrig).
            const remaining = await getGroupMembers(code);
            if (remaining.length > 0) {
              nextAdminId = remaining.slice().sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0))[0].id;
            }
          }
          if (nextAdminId) await transferAdmin(code, nextAdminId);
        }
      } catch (e) {
        /* nichts zu tun, lokal verlassen wir trotzdem */
      }
    }
    const updated = { ...profile, groupCode: null };
    await persistProfile(updated);
    setGroupState({ members: [], chat: [], name: "", createdBy: null, loading: false, error: "" });
  }

  async function removeMember(memberId) {
    const code = profile.groupCode;
    if (!code) return;
    try {
      await removeGroupMember(code, memberId);
      loadGroupData(code);
    } catch (e) {
      setGroupState((prev) => ({ ...prev, error: "Mitglied konnte nicht entfernt werden." }));
    }
  }

  async function renameGroup(rawName) {
    const code = profile.groupCode;
    if (!code) return;
    const name = (rawName || "").trim().slice(0, 40);
    setGroupState((prev) => ({ ...prev, name }));
    try {
      await renameGroupDoc(code, name);
    } catch (e) {
      setGroupState((prev) => ({ ...prev, error: "Name konnte nicht gespeichert werden." }));
    }
  }

  async function sendChatMessage(text) {
    const code = profile.groupCode;
    if (!code || !text.trim()) return;
    try {
      await addChatMessage(code, profile.id, profile.name || "Anonym", text.trim());
      const chat = await getChatMessages(code);
      setGroupState((prev) => ({ ...prev, chat }));
    } catch (e) {
      setGroupState((prev) => ({ ...prev, error: "Nachricht konnte nicht gesendet werden." }));
    }
  }

  const canShareToGroup = !!profile.groupCode;

  if (!loaded) {
    return (
      <div className="nsr-app nsr-loading">
        <p>Wird geladen …</p>
      </div>
    );
  }

  return (
    <div className="nsr-app">

      <header className="nsr-topbar">
        <button className="nsr-icon-btn" onClick={() => setMenuOpen(true)} aria-label="Menü öffnen">
          <Menu size={22} />
        </button>
        <span className="nsr-topbar-title">Next Step</span>
        <div className="nsr-topbar-spacer" />
      </header>

      {menuOpen && (
        <div className="nsr-overlay nsr-overlay-left" onClick={() => setMenuOpen(false)}>
          <nav className="nsr-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="nsr-drawer-header">
              <span className="nsr-topbar-title">Menü</span>
              <button className="nsr-icon-btn" onClick={() => setMenuOpen(false)} aria-label="Menü schließen">
                <X size={20} />
              </button>
            </div>
            {[
              { key: "home", label: "Rad", icon: HomeIcon },
              { key: "history", label: "Historie", icon: HistoryIcon },
              { key: "groups", label: "Gruppen", icon: Users },
              { key: "settings", label: "Einstellungen", icon: SettingsIcon },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  className={"nsr-drawer-item" + (view === item.key ? " nsr-drawer-item-active" : "")}
                  onClick={() => {
                    setView(item.key);
                    setMenuOpen(false);
                  }}
                >
                  <Icon size={19} strokeWidth={2} />
                  <span>{item.label}</span>
                  <ChevronRight size={16} className="nsr-drawer-chevron" />
                </button>
              );
            })}
          </nav>
        </div>
      )}

      <main className="nsr-main">
        {view === "home" && (
          <div className="nsr-view nsr-home">
            {!storagePersistent && (
              <div className="nsr-banner nsr-banner-warning">
                <span>
                  Privates Fenster erkannt: Deine Eingaben bleiben nur für diese Sitzung erhalten und sind
                  weg, sobald du das Fenster schließt.
                </span>
              </div>
            )}
            <p className="nsr-verse">{VERSE}</p>

            <Wheel scores={latestScores} colors={profile.colors} onSelectArea={setInfoArea} />

            <p className="nsr-hint nsr-center">Tipp: Tippe auf einen Bereich im Rad für Erklärungen und Leitfragen.</p>
            
            <button className="nsr-btn nsr-btn-primary nsr-btn-wide" onClick={openCheckin}>
              {hasCheckedInThisWeek ? "Diese Woche erneut bewerten" : "Diese Woche bewerten"}
            </button>
            
            <button
              type="button"
              className="nsr-anleitung-toggle"
              onClick={() => setShowAnleitung((v) => !v)}
              aria-expanded={showAnleitung}
            >
              <span>Anleitung</span>
              <ChevronDown size={16} className={showAnleitung ? "nsr-chevron-open" : ""} />
            </button>
            {showAnleitung && (
              <div className="nsr-anleitung-body">
                <p>1. Bewertung: Du schätzt jeden Bereich für dich persönlich auf einer Skala von 0 bis 10 ein.</p>
                <p>2. Reflexion: Das Rad hilft dir zu erkennen, wo du stehst, wo es gut läuft und wo du Unterstützung brauchst.</p>
                <p>3. Next Step: Suche dir einen Bereich, in den du diese Woche besonders investieren möchtest und einen Next Step machen willst.</p>
              </div>
            )}
          </div>
        )}

        {view === "history" && <HistoryView entries={entries} colors={profile.colors} />}

        {view === "settings" && (
          <SettingsView
            profile={profile}
            updateProfile={updateProfile}
            onResetColors={resetColors}
            onResetData={resetAllData}
            onStartSync={startSync}
            onConnectSync={connectSync}
            onStopSync={stopSync}
            syncBusy={syncBusy}
            syncError={syncError}
          />
        )}

        {view === "groups" &&
          (isFirebaseConfigured ? (
            <GroupsView
              profile={profile}
              colors={profile.colors}
              onCreateGroup={createGroup}
              onJoinGroup={joinGroup}
              onLeaveGroup={leaveGroup}
              onRenameGroup={renameGroup}
              onRemoveMember={removeMember}
              isAdmin={groupState.createdBy === profile.id}
              groupState={groupState}
              onSendChat={sendChatMessage}
            />
          ) : (
            <div className="nsr-view">
              <h2 className="nsr-view-title">Gruppen</h2>
              <div className="nsr-card">
                <p className="nsr-sheet-subhead">Backend noch nicht eingerichtet</p>
                <p className="nsr-hint">
                  Die Gruppen-Funktion braucht einen kleinen, kostenlosen Speicher (Firebase), damit
                  mehrere Personen dieselben Räder und Chat-Nachrichten sehen. Trag deine Zugangsdaten in{" "}
                  <code>src/firebaseConfig.js</code> ein – eine Schritt-für-Schritt-Anleitung steht in
                  der README dieses Projekts.
                </p>
              </div>
            </div>
          ))}
      </main>

      <InfoSheet
        areaKey={infoArea}
        color={infoArea ? profile.colors[infoArea] || AREA_META[infoArea].defaultColor : "#999"}
        onClose={() => setInfoArea(null)}
        onStartCheckin={openCheckin}
      />

      {checkinOpen && (
        <CheckinSheet
          step={checkinStep}
          tempScores={tempScores}
          setTempScores={setTempScores}
          colors={profile.colors}
          nextStepArea={nextStepArea}
          setNextStepArea={setNextStepArea}
          nextStepText={nextStepText}
          setNextStepText={setNextStepText}
          canShare={canShareToGroup}
          shareWithGroup={shareWithGroup}
          setShareWithGroup={setShareWithGroup}
          onBack={() => setCheckinStep(1)}
          onNext={() => setCheckinStep(2)}
          onSave={saveCheckin}
          onClose={() => setCheckinOpen(false)}
          saving={saving}
        />
      )}

      {toast && <div className="nsr-toast">{toast}</div>}
    </div>
  );
}
