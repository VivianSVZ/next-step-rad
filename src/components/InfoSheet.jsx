import React from "react";
import { X } from "lucide-react";
import { AREA_META } from "../constants.js";

export function InfoSheet({ areaKey, color, onClose, onStartCheckin }) {
  if (!areaKey) return null;
  const meta = AREA_META[areaKey];
  const Icon = meta.icon;
  return (
    <div className="nsr-overlay" onClick={onClose}>
      <div className="nsr-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="nsr-sheet-handle" />
        <div className="nsr-sheet-header">
          <div className="nsr-area-badge" style={{ background: color + "22", color }}>
            <Icon size={22} strokeWidth={2} />
          </div>
          <h2 className="nsr-sheet-title">{meta.label}</h2>
          <button className="nsr-icon-btn" onClick={onClose} aria-label="Schließen">
            <X size={20} />
          </button>
        </div>
        <p className="nsr-sheet-text">{meta.description}</p>
        <p className="nsr-sheet-subhead">Fragen zum Nachdenken</p>
        <ul className="nsr-question-list">
          {meta.questions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
        <button className="nsr-btn nsr-btn-primary" onClick={onStartCheckin}>
          Diese Woche bewerten
        </button>
      </div>
    </div>
  );
}
