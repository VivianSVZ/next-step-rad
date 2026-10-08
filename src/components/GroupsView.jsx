import React, { useState, useEffect, useRef } from "react";
import { UserPlus, LogIn, Copy, LogOut, Pencil, Check, Trash2, Send, X } from "lucide-react";
import { AREA_META } from "../constants.js";
import { timeAgo } from "../utils/date.js";
import { MiniBars } from "./MiniBars.jsx";

export function GroupsView({
  profile,
  colors,
  onCreateGroup,
  onJoinGroup,
  onLeaveGroup,
  onRenameGroup,
  onRemoveMember,
  isAdmin,
  groupState,
  onSendChat,
}) {
  const [codeInput, setCodeInput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [showSuccessorPicker, setShowSuccessorPicker] = useState(false);
  const [successorId, setSuccessorId] = useState(null);
  const chatEndRef = useRef(null);

  const otherMembers = groupState.members.filter((m) => m.id !== profile.id);

  function handleLeaveClick() {
    if (isAdmin && otherMembers.length > 0) {
      setSuccessorId(otherMembers[0].id);
      setShowSuccessorPicker(true);
    } else {
      onLeaveGroup();
    }
  }

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [groupState.chat.length]);

  useEffect(() => {
    setEditingName(false);
  }, [profile.groupCode]);

  if (!profile.groupCode) {
    return (
      <div className="nsr-view">
        <h2 className="nsr-view-title">Gruppen</h2>
        <p className="nsr-hint" style={{ marginBottom: 18 }}>
          Bildet zusammen eine kleine Gruppe (z. B. mit eurer Smallgroup), teilt eure Bewertungen der Lebensbereiche und ermutigt euch gegenseitig bei euren
          Next Steps.
        </p>

        <div className="nsr-card">
          <p className="nsr-sheet-subhead">Neue Gruppe erstellen</p>
          <p className="nsr-hint">Wir erzeugen einen Code, den du mit deiner Gruppe teilen kannst.</p>
          <button className="nsr-btn nsr-btn-primary" onClick={onCreateGroup}>
            <UserPlus size={16} /> Gruppe erstellen
          </button>
        </div>

        <div className="nsr-card">
          <p className="nsr-sheet-subhead">Gruppe beitreten</p>
          <p className="nsr-hint">Gib den Code ein, den du von deiner Gruppe bekommen hast.</p>
          <div className="nsr-field-row">
            <input
              type="text"
              className="nsr-input"
              placeholder="z. B. AB12CD"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              maxLength={12}
            />
            <button
              className="nsr-btn nsr-btn-secondary"
              disabled={!codeInput.trim()}
              onClick={() => onJoinGroup(codeInput)}
            >
              <LogIn size={16} /> Beitreten
            </button>
          </div>
        </div>

        {groupState.error && <p className="nsr-error">{groupState.error}</p>}
      </div>
    );
  }

  return (
    <div className="nsr-view">
      <h2 className="nsr-view-title">Gruppen</h2>

      <div className="nsr-card nsr-code-card">
        <div className="nsr-code-info">
          {editingName ? (
            <form
              className="nsr-inline-edit"
              onSubmit={(e) => {
                e.preventDefault();
                onRenameGroup(nameDraft);
                setEditingName(false);
              }}
            >
              <input
                type="text"
                className="nsr-input"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="Name der Gruppe"
                maxLength={40}
                autoFocus
              />
              <button type="submit" className="nsr-icon-btn" aria-label="Namen speichern">
                <Check size={17} />
              </button>
            </form>
          ) : (
            <div className="nsr-group-name-row">
              <p className="nsr-group-name">{groupState.name || "Gruppe " + profile.groupCode}</p>
              <button
                className="nsr-icon-btn"
                aria-label="Gruppennamen ändern"
                onClick={() => {
                  setNameDraft(groupState.name || "");
                  setEditingName(true);
                }}
              >
                <Pencil size={15} />
              </button>
            </div>
          )}
          <p className="nsr-hint" style={{ margin: "2px 0 0" }}>
            Code: <strong style={{ color: "var(--nsr-ink)", letterSpacing: "0.03em" }}>{profile.groupCode}</strong>
          </p>
        </div>
        <div className="nsr-code-actions">
          <button
            className="nsr-icon-btn"
            title="Code kopieren"
            onClick={() => {
              if (navigator.clipboard) navigator.clipboard.writeText(profile.groupCode);
            }}
          >
            <Copy size={18} />
          </button>
          <button className="nsr-icon-btn" title="Gruppe verlassen" onClick={handleLeaveClick}>
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {showSuccessorPicker && (
        <div className="nsr-overlay" onClick={() => setShowSuccessorPicker(false)}>
          <div className="nsr-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="nsr-sheet-handle" />
            <div className="nsr-sheet-header">
              <h2 className="nsr-sheet-title">Neuen Admin wählen</h2>
              <button className="nsr-icon-btn" onClick={() => setShowSuccessorPicker(false)} aria-label="Schließen">
                <X size={20} />
              </button>
            </div>
            <p className="nsr-sheet-text">
              Du bist Admin dieser Gruppe. Wer soll diese Rolle übernehmen, wenn du sie verlässt?
            </p>
            <div className="nsr-chip-row">
              {otherMembers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={"nsr-chip" + (successorId === m.id ? " nsr-chip-active" : "")}
                  onClick={() => setSuccessorId(m.id)}
                >
                  <span>{m.name || "Anonym"}</span>
                </button>
              ))}
            </div>
            <div className="nsr-btn-row">
              <button className="nsr-btn nsr-btn-ghost" onClick={() => setShowSuccessorPicker(false)}>
                Abbrechen
              </button>
              <button
                className="nsr-btn nsr-btn-primary"
                disabled={!successorId}
                onClick={() => {
                  setShowSuccessorPicker(false);
                  onLeaveGroup(successorId);
                }}
              >
                Gruppe verlassen
              </button>
            </div>
          </div>
        </div>
      )}

      {groupState.error && <p className="nsr-error">{groupState.error}</p>}

      <p className="nsr-sheet-subhead">Mitglieder</p>
      {groupState.loading && groupState.members.length === 0 ? (
        <p className="nsr-hint">Wird geladen …</p>
      ) : groupState.members.length === 0 ? (
        <p className="nsr-empty">Noch niemand hier außer dir. Teile den Code, damit andere beitreten können.</p>
      ) : (
        <div className="nsr-list">
          {groupState.members.map((m) => (
            <div className="nsr-card nsr-member-row" key={m.id}>
              <div className="nsr-member-top">
                <span className="nsr-member-name">
                  {m.name || "Anonym"}
                  {m.id === profile.id ? " (du)" : ""}
                  {m.id === groupState.createdBy && <span className="nsr-admin-badge">Admin</span>}
                </span>
                <div className="nsr-member-actions">
                  {m.scores && <MiniBars scores={m.scores} colors={colors} />}
                  {isAdmin && m.id !== profile.id && (
                    <button
                      className="nsr-icon-btn"
                      title="Aus der Gruppe entfernen"
                      onClick={() => {
                        if (window.confirm("Willst du diese Person wirklich aus der Gruppe entfernen?")) {
                          onRemoveMember(m.id);
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              {m.nextStep && m.nextStep.text ? (
                <p className="nsr-member-step">
                  <span style={{ color: colors[m.nextStep.area] || AREA_META[m.nextStep.area]?.defaultColor }}>
                    {AREA_META[m.nextStep.area]?.label}:
                  </span>{" "}
                  {m.nextStep.text}
                </p>
              ) : (
                <p className="nsr-hint" style={{ margin: 0 }}>
                  Noch kein Next Step geteilt.
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="nsr-sheet-subhead" style={{ marginTop: 22 }}>
        Ermutigungs-Chat
      </p>
      <p className="nsr-hint" style={{ marginTop: -6, marginBottom: 10 }}>
        Schreibt euch Bibelverse oder kleine Ermutigungen zu euren Next Steps.
      </p>
      <div className="nsr-card nsr-chat-card">
        <div className="nsr-chat-scroll">
          {groupState.chat.length === 0 && (
            <p className="nsr-hint">Noch keine Nachrichten. Schreib die erste Ermutigung!</p>
          )}
          {groupState.chat.map((m) => (
            <div className={"nsr-chat-msg" + (m.memberId === profile.id ? " nsr-chat-msg-own" : "")} key={m.id}>
              <div className="nsr-chat-meta">
                <span className="nsr-chat-name">{m.name}</span>
                <span className="nsr-chat-time">{timeAgo(m.ts)}</span>
              </div>
              <p>{m.text}</p>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <form
          className="nsr-chat-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!chatInput.trim()) return;
            onSendChat(chatInput);
            setChatInput("");
          }}
        >
          <input
            type="text"
            className="nsr-input"
            placeholder="Schreib eine Ermutigung …"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
          />
          <button type="submit" className="nsr-icon-btn nsr-icon-btn-accent" aria-label="Senden">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
