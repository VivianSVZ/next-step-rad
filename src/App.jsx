import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Menu,
  X,
  Home as HomeIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Users,
  Church,
  HeartPulse,
  Wallet,
  Briefcase,
  Send,
  Copy,
  LogOut,
  Bell,
  RotateCcw,
  Check,
  UserPlus,
  LogIn,
  ChevronRight,
  Pencil,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { isFirebaseConfigured } from "./firebaseConfig.js";

/* ---------------------------------------------------------------------- */
/* Konstanten & Inhalte                                                    */
/* ---------------------------------------------------------------------- */

const AREA_ORDER = ["glaube", "beziehungen", "gesundheit", "ressourcen", "arbeit"];

const AREA_META = {
  glaube: {
    label: "Glaube",
    icon: Church,
    defaultColor: "#C9906B",
    description:
      "Deine Beziehung zu Gott und das Wachsen im Glauben.",
    questions: [
      "Wie regelmäßig verbringe ich bewusst Zeit mit Gott. Im Gebet, in der Bibel, in der Stille?",
      "Wachse ich gerade geistlich oder stehe ich eher still?",
      "Wann habe ich zuletzt bewusst etwas investiert, das meinen Glauben stärkt?",
      "Merkt man meinem Alltag an, was ich glaube?",
    ],
  },
  beziehungen: {
    label: "Beziehungen",
    icon: Users,
    defaultColor: "#A13D3D",
    description:
      "Partnerschaft, Familie, Freundschaften und Gemeinschaft.",
    questions: [
      "Habe ich Menschen in meinem Leben, bei denen ich ganz ich selbst sein kann und die wissen, wie es mir wirklich geht?",
      "Gibt es ungelöste Konflikte oder Beziehungen, die mich aktuell stark Kraft kosten?",
      "Wie investiere ich in meine wichtigsten Beziehungen (Partner, Familie, enge Freunde)?",
      "Erlebe ich eine gesunde Balance zwischen dem Geben und Nehmen von Unterstützung?",
      "Bin ich selbst ein guter Freund, eine gute Freundin?",
    ],
  },
  gesundheit: {
    label: "Gesundheit",
    icon: HeartPulse,
    defaultColor: "#3F6A52",
    description:
      "Körperliches und geistiges Wohlbefinden.",
    questions: [
      "Wie fit, energiegeladen und belastbar fühle ich mich körperlich und mental?",
      "Achte ich auf ausreichend Schlaf, gesunde Ernährung und regelmäßige Bewegung?",
      "Schaffe ich mir bewusst Räume für echte Erholung und Pausen?",
      "Wie gehe ich mit Stress um und erkenne ich rechtzeitig meine Grenzen?",
    ],
  },
  ressourcen: {
    label: "Ressourcen",
    icon: Wallet,
    defaultColor: "#C97D3B",
    description:
      "Umgang mit Zeit, Geld und Begabungen.",
    questions: [
      "Habe ich einen guten, weisen Überblick über meine Finanzen (Budget, Konsum, Sparen)?",
      "Nutze ich meine Zeit so, dass sie meinen eigentlichen Werten und Prioritäten entspricht?",
      "Setze ich meine Gaben und Talente sinnvoll ein? Sowohl für mich als auch für andere?",
      "Erlebe ich finanzielle Freiheit oder engt mich dieser Bereich (z. B. durch Schulden oder Sorgen) stark ein?",
    ],
  },
  arbeit: {
    label: "Arbeit",
    icon: Briefcase,
    defaultColor: "#2C6E68",
    description:
      "Beruf, Studium und alltägliches Schaffen.",
    questions: [
      "Bereitet mir meine tägliche Arbeit (Beruf, Studium, Haushalt) grundsätzlich Freude und Sinn?",
      "Kann ich in meinem Job oder meinen Aufgaben meine Stärken gut einbringen?",
      "Wie ist die Atmosphäre im Team oder an meinem Arbeitsplatz?",
      "Stimmt das Verhältnis zwischen Arbeitsleistung und der Zeit für mein Privatleben (Work-Life-Balance)?",
    ],
  },
};

const WEEKDAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

const VERSE =
  "Liebe Gott (Glaube) und deinen Nächsten (Beziehungen), wie dich selbst (Gesundheit) mit allem was dir gegeben wurde (Ressourcen) und dort wo du hingestellt wurdest (Arbeit).";

/* ---------------------------------------------------------------------- */
/* Hilfsfunktionen                                                         */
/* ---------------------------------------------------------------------- */

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function generateGroupCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function normalizeCode(raw) {
  return (raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
}

function getWeekdayIndexMonday0(date) {
  const d = (date || new Date()).getDay();
  return (d + 6) % 7;
}

function getISOWeekId(date) {
  const now = date || new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const weekNum = 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 86400000));
  return d.getUTCFullYear() + "-W" + String(weekNum).padStart(2, "0");
}

function formatWeekLabel(weekId) {
  const parts = (weekId || "").split("-W");
  if (parts.length !== 2) return weekId || "";
  return "KW " + parseInt(parts[1], 10) + " · " + parts[0];
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "gerade eben";
  if (min < 60) return "vor " + min + " Min.";
  const h = Math.floor(min / 60);
  if (h < 24) return "vor " + h + " Std.";
  const d = Math.floor(h / 24);
  if (d < 7) return "vor " + d + " Tag" + (d === 1 ? "" : "en");
  return new Date(ts).toLocaleDateString("de-DE");
}

function defaultProfile() {
  const colors = {};
  AREA_ORDER.forEach((k) => {
    colors[k] = AREA_META[k].defaultColor;
  });
  return {
    id: generateId(),
    name: "",
    colors,
    notifyEnabled: false,
    reminderWeekday: 6,
    groupCode: null,
    lastNotifiedWeek: null,
  };
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function annularSectorPath(cx, cy, innerR, outerR, startAngle, endAngle) {
  const outerRSafe = Math.max(outerR, innerR + 0.01);
  const p1 = polarToCartesian(cx, cy, outerRSafe, startAngle);
  const p2 = polarToCartesian(cx, cy, outerRSafe, endAngle);
  const p3 = polarToCartesian(cx, cy, innerR, endAngle);
  const p4 = polarToCartesian(cx, cy, innerR, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    "M " + p1.x.toFixed(2) + " " + p1.y.toFixed(2),
    "A " + outerRSafe + " " + outerRSafe + " 0 " + largeArc + " 1 " + p2.x.toFixed(2) + " " + p2.y.toFixed(2),
    "L " + p3.x.toFixed(2) + " " + p3.y.toFixed(2),
    "A " + innerR + " " + innerR + " 0 " + largeArc + " 0 " + p4.x.toFixed(2) + " " + p4.y.toFixed(2),
    "Z",
  ].join(" ");
}

function normalizeAngle(a) {
  return ((a % 360) + 360) % 360;
}

function labelArcPath(cx, cy, r, startAngle, endAngle, flip) {
  const a0 = flip ? endAngle : startAngle;
  const a1 = flip ? startAngle : endAngle;
  const p0 = polarToCartesian(cx, cy, r, a0);
  const p1 = polarToCartesian(cx, cy, r, a1);
  const delta = Math.abs(endAngle - startAngle);
  const largeArc = delta > 180 ? 1 : 0;
  const sweep = flip ? 0 : 1;
  return (
    "M " + p0.x.toFixed(2) + " " + p0.y.toFixed(2) +
    " A " + r + " " + r + " 0 " + largeArc + " " + sweep + " " + p1.x.toFixed(2) + " " + p1.y.toFixed(2)
  );
}

// Versetzt Punkte, die in derselben Woche denselben Wert haben, minimal
// nebeneinander, damit sie sich nicht gegenseitig verdecken.
function makeDotRenderer(color, offsetIndex, radius) {
  const mid = (AREA_ORDER.length - 1) / 2;
  const dx = (offsetIndex - mid) * 3.4;
  return function Dot(props) {
    const { cx, cy } = props;
    if (cx == null || cy == null) return null;
    return (
      <circle cx={cx + dx} cy={cy} r={radius} fill={color} stroke="#FBF9F3" strokeWidth={1} />
    );
  };
}

async function storageGet(key, shared) {
  try {
    const res = await window.storage.get(key, !!shared);
    return res ? res.value : null;
  } catch (e) {
    return null;
  }
}

async function storageSet(key, value, shared) {
  try {
    await window.storage.set(key, value, !!shared);
    return true;
  } catch (e) {
    return false;
  }
}

/* ---------------------------------------------------------------------- */
/* Das Rad                                                                 */
/* ---------------------------------------------------------------------- */

function Wheel({ scores, colors, onSelectArea }) {
  const cx = 160;
  const cy = 160;
  const outerR = 116;
  const innerR = 34;
  const gap = 3;
  const labelR = outerR + 22;

  return (
    <svg viewBox="0 0 320 320" className="nsr-wheel-svg" role="img" aria-label="Next Step Rad">
      <defs>
        {AREA_ORDER.map((key, idx) => {
          const center = -90 + idx * 72;
          const start = center - 36 + gap;
          const end = center + 36 - gap;
          const centerNorm = normalizeAngle(center);
          const flip = centerNorm > 0 && centerNorm < 180;
          return (
            <path
              key={key}
              id={"nsr-label-arc-" + key}
              d={labelArcPath(cx, cy, labelR, start, end, flip)}
              fill="none"
            />
          );
        })}
      </defs>

      {AREA_ORDER.map((key, idx) => {
        const meta = AREA_META[key];
        const center = -90 + idx * 72;
        const start = center - 36 + gap;
        const end = center + 36 - gap;
        const score = Math.max(0, Math.min(10, Number(scores[key]) || 0));
        const filledR = innerR + (outerR - innerR) * (score / 10);
        const color = colors[key] || meta.defaultColor;
        const midR = innerR + Math.max(filledR - innerR, 18) / 1.6;
        const numPos = polarToCartesian(cx, cy, midR, center);

        return (
          <g
            key={key}
            className="nsr-wheel-segment"
            onClick={() => onSelectArea(key)}
            tabIndex={0}
            role="button"
            aria-label={meta.label + ", " + score + " von 10"}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onSelectArea(key);
            }}
          >
            <path d={annularSectorPath(cx, cy, innerR, outerR, start, end)} fill="var(--nsr-track)" />
            {score > 0 && (
              <path d={annularSectorPath(cx, cy, innerR, filledR, start, end)} fill={color} />
            )}
            {score > 0 && (
              <text x={numPos.x} y={numPos.y} textAnchor="middle" dominantBaseline="middle" className="nsr-wheel-score">
                {score}
              </text>
            )}
            <text className="nsr-wheel-label" dy="-3">
              <textPath href={"#nsr-label-arc-" + key} startOffset="50%" textAnchor="middle">
                {meta.label}
              </textPath>
            </text>
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r={innerR - 5} fill="var(--nsr-surface)" stroke="var(--nsr-border)" strokeWidth="1" />
    </svg>
  );
}

/* ---------------------------------------------------------------------- */
/* Kleine wiederverwendbare Stücke                                        */
/* ---------------------------------------------------------------------- */

function MiniBars({ scores, colors }) {
  return (
    <div className="nsr-minibars" aria-hidden="true">
      {AREA_ORDER.map((key) => {
        const score = Math.max(0, Math.min(10, Number(scores && scores[key]) || 0));
        return (
          <div className="nsr-minibar-track" key={key} title={AREA_META[key].label + ": " + score + "/10"}>
            <div
              className="nsr-minibar-fill"
              style={{ height: (score / 10) * 100 + "%", background: colors[key] || AREA_META[key].defaultColor }}
            />
          </div>
        );
      })}
    </div>
  );
}

function AreaChip({ areaKey, active, color, onClick }) {
  const meta = AREA_META[areaKey];
  const Icon = meta.icon;
  return (
    <button
      type="button"
      className={"nsr-chip" + (active ? " nsr-chip-active" : "")}
      style={active ? { borderColor: color, background: color + "1A", color: "var(--nsr-ink)" } : undefined}
      onClick={onClick}
    >
      <Icon size={16} strokeWidth={2} color={active ? color : "var(--nsr-ink-muted)"} />
      <span>{meta.label}</span>
    </button>
  );
}

/* ---------------------------------------------------------------------- */
/* Info-Sheet für einen Bereich                                            */
/* ---------------------------------------------------------------------- */

function InfoSheet({ areaKey, color, onClose, onStartCheckin }) {
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

/* ---------------------------------------------------------------------- */
/* Check-in Flow                                                          */
/* ---------------------------------------------------------------------- */

function CheckinSheet({
  step,
  tempScores,
  setTempScores,
  colors,
  nextStepArea,
  setNextStepArea,
  nextStepText,
  setNextStepText,
  canShare,
  shareWithGroup,
  setShareWithGroup,
  onBack,
  onNext,
  onSave,
  onClose,
  saving,
}) {
  return (
    <div className="nsr-overlay" onClick={onClose}>
      <div className="nsr-sheet nsr-sheet-tall" onClick={(e) => e.stopPropagation()}>
        <div className="nsr-sheet-handle" />
        <div className="nsr-sheet-header">
          <h2 className="nsr-sheet-title">
            {step === 1 ? "Wie steht's diese Woche?" : "Dein Next Step"}
          </h2>
          <button className="nsr-icon-btn" onClick={onClose} aria-label="Schließen">
            <X size={20} />
          </button>
        </div>

        {step === 1 && (
          <div className="nsr-scroll">
            <p className="nsr-sheet-text">Gib jedem Bereich eine Punktzahl zwischen 0 und 10.</p>
            {AREA_ORDER.map((key) => {
              const meta = AREA_META[key];
              const Icon = meta.icon;
              const color = colors[key] || meta.defaultColor;
              const value = tempScores[key] ?? 5;
              return (
                <div className="nsr-slider-row" key={key}>
                  <div className="nsr-slider-label">
                    <Icon size={17} strokeWidth={2} color={color} />
                    <span>{meta.label}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={value}
                    style={{ accentColor: color }}
                    onChange={(e) =>
                      setTempScores((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                    }
                  />
                  <span className="nsr-slider-value" style={{ color }}>
                    {value}
                  </span>
                </div>
              );
            })}
            <button className="nsr-btn nsr-btn-primary" onClick={onNext}>
              Weiter
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="nsr-scroll">
            <p className="nsr-sheet-text">
              Wähle einen Bereich, in dem du diese Woche einen kleinen nächsten Schritt gehen möchtest.
            </p>
            <div className="nsr-chip-row">
              {AREA_ORDER.map((key) => (
                <AreaChip
                  key={key}
                  areaKey={key}
                  active={nextStepArea === key}
                  color={colors[key] || AREA_META[key].defaultColor}
                  onClick={() => setNextStepArea(key)}
                />
              ))}
            </div>
            <textarea
              className="nsr-textarea"
              placeholder="Was ist dein Next Step für diese Woche? Halt ihn klein und konkret."
              value={nextStepText}
              onChange={(e) => setNextStepText(e.target.value)}
              rows={4}
            />
            {canShare && (
              <label className="nsr-checkbox-row">
                <input
                  type="checkbox"
                  checked={shareWithGroup}
                  onChange={(e) => setShareWithGroup(e.target.checked)}
                />
                <span>Mit meiner Gruppe teilen</span>
              </label>
            )}
            <div className="nsr-btn-row">
              <button className="nsr-btn nsr-btn-ghost" onClick={onBack}>
                Zurück
              </button>
              <button
                className="nsr-btn nsr-btn-primary"
                disabled={!nextStepArea || !nextStepText.trim() || saving}
                onClick={onSave}
              >
                {saving ? "Speichert …" : "Speichern"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Historie                                                                */
/* ---------------------------------------------------------------------- */

function HistoryView({ entries, colors }) {
  const chartData = entries.map((e) => ({
    week: formatWeekLabel(e.weekId).replace(" · " + e.weekId.split("-W")[0], ""),
    ...e.scores,
  }));

  return (
    <div className="nsr-view">
      <h2 className="nsr-view-title">Historie</h2>
      {entries.length === 0 ? (
        <p className="nsr-empty">
          Noch keine Bewertung gespeichert. Sobald du deine erste Woche bewertest, siehst du hier deinen Verlauf.
        </p>
      ) : (
        <>
          <div className="nsr-card">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid stroke="var(--nsr-border)" strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--nsr-ink-muted)" }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "var(--nsr-ink-muted)" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid var(--nsr-border)" }} />
                {AREA_ORDER.map((key, idx) => {
                  const color = colors[key] || AREA_META[key].defaultColor;
                  return (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      name={AREA_META[key].label}
                      stroke={color}
                      strokeWidth={2}
                      dot={makeDotRenderer(color, idx, 3.2)}
                      activeDot={makeDotRenderer(color, idx, 4.6)}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
            <div className="nsr-chart-legend">
              {AREA_ORDER.map((key) => (
                <span className="nsr-legend-item" key={key}>
                  <span
                    className="nsr-legend-dot"
                    style={{ background: colors[key] || AREA_META[key].defaultColor }}
                  />
                  {AREA_META[key].label}
                </span>
              ))}
            </div>
            <p className="nsr-hint" style={{ marginTop: 10 }}>
              Werte, die in derselben Woche gleich hoch liegen, werden leicht nebeneinander
              versetzt dargestellt, damit du jeden Punkt einzeln erkennen kannst.
            </p>
          </div>

          <p className="nsr-sheet-subhead" style={{ marginTop: 22 }}>
            Deine Next Steps
          </p>
          <div className="nsr-list">
            {entries
              .slice()
              .reverse()
              .map((e) => {
                const areaMeta = e.nextStep && AREA_META[e.nextStep.area];
                const Icon = areaMeta ? areaMeta.icon : null;
                const areaColor = e.nextStep ? colors[e.nextStep.area] || AREA_META[e.nextStep.area].defaultColor : "#999";
                return (
                  <div className="nsr-card nsr-history-row" key={e.weekId}>
                    <div className="nsr-history-head">
                      <span className="nsr-history-week">{formatWeekLabel(e.weekId)}</span>
                      <MiniBars scores={e.scores} colors={colors} />
                    </div>
                    {e.nextStep && e.nextStep.text && (
                      <div className="nsr-history-step">
                        <div className="nsr-area-badge nsr-area-badge-sm" style={{ background: areaColor + "22", color: areaColor }}>
                          {Icon && <Icon size={15} strokeWidth={2} />}
                        </div>
                        <p>{e.nextStep.text}</p>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Einstellungen                                                          */
/* ---------------------------------------------------------------------- */

function SettingsView({ profile, updateProfile, onResetColors, onResetData }) {
  const [name, setName] = useState(profile.name || "");

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
        <p className="nsr-sheet-subhead">Wöchentliche Erinnerung</p>
        <div className="nsr-switch-row">
          <div>
            <p className="nsr-switch-label">Erinnerung aktivieren</p>
            <p className="nsr-hint">
              Als Web-App kann dir dein Browser nur eine Benachrichtigung zeigen, wenn du die App gerade
              geöffnet hast – ein Hintergrund-Push wie bei einer nativen Kalender-App ist technisch nicht
              möglich. Zusätzlich siehst du ein Banner in der App, sobald dein Wochentag erreicht ist.
            </p>
          </div>
          <label className="nsr-switch">
            <input
              type="checkbox"
              checked={!!profile.notifyEnabled}
              onChange={(e) => updateProfile({ notifyEnabled: e.target.checked }, true)}
            />
            <span className="nsr-switch-slider" />
          </label>
        </div>
        {profile.notifyEnabled && (
          <div className="nsr-field-row">
            <label htmlFor="nsr-weekday">Ab welchem Wochentag erinnern?</label>
            <select
              id="nsr-weekday"
              className="nsr-select"
              value={profile.reminderWeekday}
              onChange={(e) => updateProfile({ reminderWeekday: Number(e.target.value) })}
            >
              {WEEKDAYS.map((w, i) => (
                <option key={w} value={i}>
                  {w}
                </option>
              ))}
            </select>
          </div>
        )}
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
        <p className="nsr-sheet-subhead">Daten</p>
        <p className="nsr-hint">Löscht alle deine gespeicherten Wochenbewertungen und Next Steps unwiderruflich.</p>
        <button className="nsr-btn nsr-btn-danger" onClick={onResetData}>
          Alle Bewertungen löschen
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Gruppen                                                                */
/* ---------------------------------------------------------------------- */

function GroupsView({ profile, colors, onCreateGroup, onJoinGroup, onLeaveGroup, onRenameGroup, groupState, onSendChat }) {
  const [codeInput, setCodeInput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const chatEndRef = useRef(null);

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
          Bildet zusammen eine kleine Gruppe (z. B. euren Hauskreis) und ermutigt euch gegenseitig bei euren
          Next Steps. Jede Person mit dem Gruppen-Code sieht die Räder und Next Steps der Gruppe – wählt den
          Code also mit Bedacht und teilt ihn nur mit Menschen, denen ihr vertraut.
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
          <button className="nsr-icon-btn" title="Gruppe verlassen" onClick={onLeaveGroup}>
            <LogOut size={18} />
          </button>
        </div>
      </div>

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
                </span>
                {m.scores && <MiniBars scores={m.scores} colors={colors} />}
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
        Nachrichten werden gespeichert und bei allen Mitgliedern automatisch alle paar Sekunden aktualisiert.
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

/* ---------------------------------------------------------------------- */
/* Haupt-App                                                              */
/* ---------------------------------------------------------------------- */

export default function NextStepRad() {
  const [loaded, setLoaded] = useState(false);
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

  const [dismissedWeek, setDismissedWeek] = useState(null);

  /* --- Laden beim Start --- */
  useEffect(() => {
    (async () => {
      let p = defaultProfile();
      const rawProfile = await storageGet("profile", false);
      if (rawProfile) {
        try {
          const parsed = JSON.parse(rawProfile);
          p = { ...p, ...parsed, colors: { ...p.colors, ...(parsed.colors || {}) } };
        } catch (e) {
          /* Profil beschädigt, Standard verwenden */
        }
      }
      let e = [];
      const rawEntries = await storageGet("entries", false);
      if (rawEntries) {
        try {
          const parsed = JSON.parse(rawEntries);
          if (Array.isArray(parsed)) e = parsed;
        } catch (err) {
          /* Historie beschädigt, leer starten */
        }
      }
      setProfile(p);
      setEntries(e);
      setLoaded(true);
      await storageSet("profile", JSON.stringify(p), false);
    })();
  }, []);

  const currentWeekId = getISOWeekId();
  const hasCheckedInThisWeek = entries.some((e) => e.weekId === currentWeekId);
  const latestScores = entries.length > 0 ? entries[entries.length - 1].scores : {};
  const todayIdx = getWeekdayIndexMonday0();
  const dueForCheckin = todayIdx >= profile.reminderWeekday && !hasCheckedInThisWeek;

  /* --- Browser-Benachrichtigung, wenn App offen ist und fällig --- */
  useEffect(() => {
    if (!loaded || !profile.notifyEnabled || !dueForCheckin) return;
    if (profile.lastNotifiedWeek === currentWeekId) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted") {
      try {
        new Notification("Next Step", {
          body: "Zeit für dein wöchentliches Update. Wie steht's um deine 5 Bereiche?",
        });
      } catch (e) {
        /* Benachrichtigung fehlgeschlagen, ignorieren */
      }
      const updated = { ...profile, lastNotifiedWeek: currentWeekId };
      setProfile(updated);
      storageSet("profile", JSON.stringify(updated), false);
    }
  }, [loaded, profile.notifyEnabled, dueForCheckin, currentWeekId]);

  /* --- Toast automatisch ausblenden --- */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  /* --- Gruppendaten laden + Polling --- */
  const loadGroupData = useCallback(async (code) => {
    if (!code) return;
    setGroupState((prev) => ({ ...prev, loading: true, error: "" }));
    const rawMembers = await storageGet("group:" + code + ":members", true);
    let members = [];
    if (rawMembers) {
      try {
        members = JSON.parse(rawMembers);
      } catch (e) {
        members = [];
      }
    }
    const withWheels = await Promise.all(
      members.map(async (m) => {
        const raw = await storageGet("group:" + code + ":wheel:" + m.id, true);
        if (!raw) return { ...m, scores: null, nextStep: null };
        try {
          const parsed = JSON.parse(raw);
          return { ...m, ...parsed };
        } catch (e) {
          return { ...m, scores: null, nextStep: null };
        }
      })
    );
    const rawChat = await storageGet("group:" + code + ":chat", true);
    let chat = [];
    if (rawChat) {
      try {
        chat = JSON.parse(rawChat);
      } catch (e) {
        chat = [];
      }
    }
    const rawName = await storageGet("group:" + code + ":name", true);
    setGroupState({ members: withWheels, chat, name: rawName || "", loading: false, error: "" });
  }, []);

  useEffect(() => {
    if (view !== "groups" || !profile.groupCode) return;
    loadGroupData(profile.groupCode);
    const interval = setInterval(() => loadGroupData(profile.groupCode), 8000);
    return () => clearInterval(interval);
  }, [view, profile.groupCode, loadGroupData]);

  /* --- Profil aktualisieren + persistieren --- */
  async function updateProfile(patch, isNotifyToggle) {
    let updated = { ...profile, ...patch };
    if (patch.colors) updated.colors = { ...profile.colors, ...patch.colors };
    if (isNotifyToggle && patch.notifyEnabled && typeof Notification !== "undefined" && Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch (e) {
        /* Berechtigung nicht erteilt, still fortfahren */
      }
    }
    setProfile(updated);
    await storageSet("profile", JSON.stringify(updated), false);
  }

  function resetColors() {
    const colors = {};
    AREA_ORDER.forEach((k) => (colors[k] = AREA_META[k].defaultColor));
    updateProfile({ colors });
  }

  async function resetAllData() {
    if (!window.confirm("Wirklich alle gespeicherten Bewertungen und Next Steps löschen?")) return;
    setEntries([]);
    await storageSet("entries", JSON.stringify([]), false);
    setToast("Daten gelöscht");
  }

  /* --- Check-in Flow --- */
  function openCheckin() {
    setTempScores({ ...latestScores });
    setNextStepArea(null);
    setNextStepText("");
    setShareWithGroup(true);
    setCheckinStep(1);
    setCheckinOpen(true);
    setInfoArea(null);
  }

  async function saveCheckin() {
    setSaving(true);
    const weekId = getISOWeekId();
    const scores = {};
    AREA_ORDER.forEach((k) => (scores[k] = tempScores[k] ?? 0));
    const entry = {
      weekId,
      date: new Date().toISOString(),
      scores,
      nextStep: { area: nextStepArea, text: nextStepText.trim() },
    };
    const newEntries = [...entries.filter((e) => e.weekId !== weekId), entry].sort((a, b) =>
      a.weekId.localeCompare(b.weekId)
    );
    setEntries(newEntries);
    await storageSet("entries", JSON.stringify(newEntries), false);

    if (profile.groupCode && shareWithGroup) {
      await storageSet(
        "group:" + profile.groupCode + ":wheel:" + profile.id,
        JSON.stringify({
          name: profile.name || "Anonym",
          scores,
          nextStep: { area: nextStepArea, text: nextStepText.trim() },
          updatedAt: Date.now(),
        }),
        true
      );
    }

    const updatedProfile = { ...profile, lastNotifiedWeek: weekId };
    setProfile(updatedProfile);
    await storageSet("profile", JSON.stringify(updatedProfile), false);

    setSaving(false);
    setCheckinOpen(false);
    setToast("Gespeichert – dein nächster Schritt ist notiert.");
  }

  /* --- Gruppen-Aktionen --- */
  async function createGroup() {
    const code = generateGroupCode();
    await joinGroupByCode(code);
  }

  async function joinGroup(rawCode) {
    const code = normalizeCode(rawCode);
    if (!code) return;
    await joinGroupByCode(code);
  }

  async function joinGroupByCode(code) {
    setGroupState((prev) => ({ ...prev, error: "" }));
    const raw = await storageGet("group:" + code + ":members", true);
    let members = [];
    if (raw) {
      try {
        members = JSON.parse(raw);
      } catch (e) {
        members = [];
      }
    }
    if (!members.find((m) => m.id === profile.id)) {
      members.push({ id: profile.id, name: profile.name || "Anonym" });
      const ok = await storageSet("group:" + code + ":members", JSON.stringify(members), true);
      if (!ok) {
        setGroupState((prev) => ({ ...prev, error: "Verbindung zur Gruppe ist fehlgeschlagen. Versuch es noch einmal." }));
        return;
      }
    }
    const updated = { ...profile, groupCode: code };
    setProfile(updated);
    await storageSet("profile", JSON.stringify(updated), false);
    loadGroupData(code);
  }

  async function leaveGroup() {
    const code = profile.groupCode;
    if (code) {
      const raw = await storageGet("group:" + code + ":members", true);
      if (raw) {
        try {
          let members = JSON.parse(raw);
          members = members.filter((m) => m.id !== profile.id);
          await storageSet("group:" + code + ":members", JSON.stringify(members), true);
        } catch (e) {
          /* nichts zu tun */
        }
      }
    }
    const updated = { ...profile, groupCode: null };
    setProfile(updated);
    await storageSet("profile", JSON.stringify(updated), false);
    setGroupState({ members: [], chat: [], name: "", loading: false, error: "" });
  }

  async function renameGroup(rawName) {
    const code = profile.groupCode;
    if (!code) return;
    const name = (rawName || "").trim().slice(0, 40);
    setGroupState((prev) => ({ ...prev, name }));
    const ok = await storageSet("group:" + code + ":name", name, true);
    if (!ok) {
      setGroupState((prev) => ({ ...prev, error: "Name konnte nicht gespeichert werden." }));
    }
  }

  async function sendChatMessage(text) {
    const code = profile.groupCode;
    if (!code || !text.trim()) return;
    const raw = await storageGet("group:" + code + ":chat", true);
    let chat = [];
    if (raw) {
      try {
        chat = JSON.parse(raw);
      } catch (e) {
        chat = [];
      }
    }
    chat.push({
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      memberId: profile.id,
      name: profile.name || "Anonym",
      text: text.trim(),
      ts: Date.now(),
    });
    if (chat.length > 200) chat = chat.slice(chat.length - 200);
    const ok = await storageSet("group:" + code + ":chat", JSON.stringify(chat), true);
    if (ok) {
      setGroupState((prev) => ({ ...prev, chat }));
    } else {
      setGroupState((prev) => ({ ...prev, error: "Nachricht konnte nicht gesendet werden." }));
    }
  }

  const canShareToGroup = !!profile.groupCode;

  if (!loaded) {
    return (
      <div className="nsr-app nsr-loading">
        <style>{STYLES}</style>
        <p>Wird geladen …</p>
      </div>
    );
  }

  return (
    <div className="nsr-app">
      <style>{STYLES}</style>

      <header className="nsr-topbar">
        <button className="nsr-icon-btn" onClick={() => setMenuOpen(true)} aria-label="Menü öffnen">
          <Menu size={22} />
        </button>
        <span className="nsr-topbar-title">Next Step</span>
        <div className="nsr-topbar-spacer" />
      </header>

      {menuOpen && (
        <div className="nsr-overlay" onClick={() => setMenuOpen(false)}>
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
            <p className="nsr-verse">{VERSE}</p>

            <Wheel scores={latestScores} colors={profile.colors} onSelectArea={setInfoArea} />

            {dueForCheckin && dismissedWeek !== currentWeekId && (
              <div className="nsr-banner">
                <Bell size={16} />
                <span>Zeit für dein wöchentliches Update!</span>
                <button className="nsr-banner-close" onClick={() => setDismissedWeek(currentWeekId)} aria-label="Banner schließen">
                  <X size={14} />
                </button>
              </div>
            )}

            <button className="nsr-btn nsr-btn-primary nsr-btn-wide" onClick={openCheckin}>
              {hasCheckedInThisWeek ? "Diese Woche erneut bewerten" : "Diese Woche bewerten"}
            </button>
            <p className="nsr-hint nsr-center">1. Bewertung: Du schätzt jeden Bereich für dich persönlich auf einer Skala von 1 bis 10 ein. <br></br>2. Reflexion: Das Rad hilft dir zu erkennen, wo du stehst, wo es gut läuft und wo du Unterstützung brauchst.</p>
            <p className="nsr-hint nsr-center">Tipp: Tippe auf einen Bereich im Rad für Hintergrund und Leitfragen.</p>
          </div>
        )}

        {view === "history" && <HistoryView entries={entries} colors={profile.colors} />}

        {view === "settings" && (
          <SettingsView
            profile={profile}
            updateProfile={updateProfile}
            onResetColors={resetColors}
            onResetData={resetAllData}
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

/* ---------------------------------------------------------------------- */
/* Styles                                                                  */
/* ---------------------------------------------------------------------- */

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');

.nsr-app {
  --nsr-bg: #F3EFE4;
  --nsr-surface: #FBF9F3;
  --nsr-border: #E3DCC9;
  --nsr-track: #EAE3D1;
  --nsr-ink: #2B2A28;
  --nsr-ink-muted: #77705F;
  --nsr-accent: #B5723C;
  --nsr-accent-ink: #FFFFFF;
  --nsr-danger: #A13D3D;

  font-family: 'Inter', -apple-system, sans-serif;
  color: var(--nsr-ink);
  background: var(--nsr-bg);
  min-height: 100vh;
  max-width: 480px;
  margin: 0 auto;
  position: relative;
  padding-bottom: 40px;
}

.nsr-loading { display: flex; align-items: center; justify-content: center; }

.nsr-topbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 14px;
  position: sticky;
  top: 0;
  background: var(--nsr-bg);
  z-index: 5;
  border-bottom: 1px solid var(--nsr-border);
}
.nsr-topbar-title {
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 19px;
}
.nsr-topbar-spacer { flex: 1; }

.nsr-icon-btn {
  background: transparent;
  border: none;
  color: var(--nsr-ink);
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.nsr-icon-btn:hover { background: var(--nsr-border); }
.nsr-icon-btn-accent { background: var(--nsr-accent); color: var(--nsr-accent-ink); }
.nsr-icon-btn-accent:hover { background: var(--nsr-accent); opacity: 0.9; }

.nsr-main { padding: 8px 18px 24px; }

.nsr-view-title {
  font-family: 'Fraunces', serif;
  font-size: 22px;
  font-weight: 600;
  margin: 14px 0 16px;
}

.nsr-home { text-align: center; }
.nsr-verse {
  font-family: 'Fraunces', serif;
  font-size: 16px;
  line-height: 1.55;
  color: var(--nsr-ink);
  max-width: 360px;
  margin: 18px auto 6px;
}

.nsr-wheel-svg { width: 100%; max-width: 340px; display: block; margin: 6px auto 4px; }
.nsr-wheel-segment { transition: filter 0.15s ease; }
.nsr-wheel-segment:hover, .nsr-wheel-segment:focus { filter: brightness(1.07); outline: none; }
.nsr-wheel-score { font-family: 'Fraunces', serif; font-weight: 600; font-size: 19px; fill: #FBF9F3; }
.nsr-wheel-label { font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600; fill: #4A4437; }

.nsr-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--nsr-accent);
  color: #fff;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 13.5px;
  margin: 14px 0;
}
.nsr-banner span { flex: 1; text-align: left; }
.nsr-banner-close { background: transparent; border: none; color: #fff; cursor: pointer; display: flex; }

.nsr-btn {
  font-family: 'Inter', sans-serif;
  font-size: 14.5px;
  font-weight: 600;
  border-radius: 12px;
  padding: 12px 18px;
  border: 1px solid transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.nsr-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.nsr-btn-primary { background: var(--nsr-accent); color: #fff; }
.nsr-btn-primary:not(:disabled):hover { opacity: 0.92; }
.nsr-btn-secondary { background: var(--nsr-ink); color: #fff; }
.nsr-btn-ghost { background: transparent; color: var(--nsr-ink); border-color: var(--nsr-border); }
.nsr-btn-danger { background: transparent; color: var(--nsr-danger); border-color: var(--nsr-danger); }
.nsr-btn-wide { width: 100%; margin-top: 14px; }

.nsr-hint { font-size: 12.5px; color: var(--nsr-ink-muted); line-height: 1.5; }
.nsr-center { text-align: center; }
.nsr-empty { font-size: 14px; color: var(--nsr-ink-muted); line-height: 1.6; }
.nsr-error { font-size: 13px; color: var(--nsr-danger); }

.nsr-card {
  background: var(--nsr-surface);
  border: 1px solid var(--nsr-border);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 14px;
}

.nsr-sheet-subhead { font-weight: 600; font-size: 14px; margin: 0 0 8px; }
.nsr-row-between { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.nsr-link-btn { background: none; border: none; color: var(--nsr-ink-muted); font-size: 12.5px; display: flex; align-items: center; gap: 4px; cursor: pointer; }

.nsr-input, .nsr-select, .nsr-textarea {
  width: 100%;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  padding: 10px 12px;
  border: 1px solid var(--nsr-border);
  border-radius: 10px;
  background: #fff;
  color: var(--nsr-ink);
  box-sizing: border-box;
}
.nsr-textarea { resize: vertical; margin: 10px 0; }
.nsr-field-row { display: flex; gap: 10px; align-items: center; margin-top: 10px; }
.nsr-field-row label { font-size: 13px; color: var(--nsr-ink-muted); white-space: nowrap; }

.nsr-switch-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
.nsr-switch-label { font-weight: 600; font-size: 14px; margin: 0 0 4px; }
.nsr-switch { position: relative; width: 42px; height: 24px; flex-shrink: 0; }
.nsr-switch input { opacity: 0; width: 0; height: 0; }
.nsr-switch-slider { position: absolute; inset: 0; background: var(--nsr-border); border-radius: 999px; transition: 0.2s; cursor: pointer; }
.nsr-switch-slider::before { content: ''; position: absolute; width: 18px; height: 18px; left: 3px; top: 3px; background: #fff; border-radius: 50%; transition: 0.2s; }
.nsr-switch input:checked + .nsr-switch-slider { background: var(--nsr-accent); }
.nsr-switch input:checked + .nsr-switch-slider::before { transform: translateX(18px); }

.nsr-color-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-top: 1px solid var(--nsr-border); }
.nsr-color-row:first-of-type { border-top: none; }
.nsr-color-row span { flex: 1; font-size: 14px; }
.nsr-color-row input[type=color] { width: 34px; height: 28px; border: none; background: none; cursor: pointer; }

.nsr-overlay {
  position: fixed;
  inset: 0;
  background: rgba(30, 27, 20, 0.42);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 20;
}
.nsr-drawer {
  background: var(--nsr-surface);
  width: 78%;
  max-width: 300px;
  height: 100%;
  align-self: flex-start;
  padding: 18px;
  box-sizing: border-box;
  animation: nsr-slide-right 0.18s ease;
}
.nsr-drawer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
.nsr-drawer-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 10px;
  border: none;
  background: none;
  border-radius: 10px;
  font-size: 14.5px;
  color: var(--nsr-ink);
  cursor: pointer;
  text-align: left;
}
.nsr-drawer-item span { flex: 1; }
.nsr-drawer-item:hover { background: var(--nsr-bg); }
.nsr-drawer-item-active { background: var(--nsr-track); font-weight: 600; }
.nsr-drawer-chevron { opacity: 0.4; }

.nsr-sheet {
  background: var(--nsr-surface);
  width: 100%;
  max-width: 480px;
  border-radius: 20px 20px 0 0;
  padding: 10px 20px 26px;
  box-sizing: border-box;
  max-height: 86vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: nsr-slide-up 0.2s ease;
}
.nsr-sheet-tall { max-height: 90vh; }
.nsr-sheet-handle { width: 40px; height: 4px; background: var(--nsr-border); border-radius: 4px; margin: 6px auto 12px; }
.nsr-sheet-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; gap: 10px; }
.nsr-sheet-title { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 600; margin: 0; flex: 1; }
.nsr-sheet-text { font-size: 14px; line-height: 1.6; color: var(--nsr-ink); }
.nsr-scroll { overflow-y: auto; }

.nsr-area-badge { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.nsr-area-badge-sm { width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0; }

.nsr-question-list { padding-left: 18px; margin: 4px 0 20px; font-size: 13.5px; line-height: 1.8; color: var(--nsr-ink); }

.nsr-slider-row { display: grid; grid-template-columns: 112px 1fr 24px; align-items: center; gap: 8px; padding: 10px 0; }
.nsr-slider-label { display: flex; align-items: center; gap: 6px; font-size: 12.5px; }
.nsr-slider-value { font-family: 'Fraunces', serif; font-weight: 600; text-align: right; font-size: 15px; }
input[type=range] { width: 100%; }

.nsr-chip-row { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0 4px; }
.nsr-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--nsr-border);
  background: #fff;
  font-size: 13px;
  cursor: pointer;
  color: var(--nsr-ink-muted);
}
.nsr-chip-active { font-weight: 600; }

.nsr-checkbox-row { display: flex; align-items: center; gap: 8px; font-size: 13.5px; margin: 6px 0 14px; }

.nsr-btn-row { display: flex; gap: 10px; margin-top: 6px; }
.nsr-btn-row .nsr-btn { flex: 1; }

.nsr-chart-legend {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 7px 4px;
  margin-top: 12px;
  padding: 0 2px;
  box-sizing: border-box;
}
.nsr-legend-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 11px;
  color: var(--nsr-ink-muted);
  min-width: 0;
}
.nsr-legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

.nsr-list { display: flex; flex-direction: column; gap: 10px; }
.nsr-history-head { display: flex; align-items: center; justify-content: space-between; }
.nsr-history-week { font-family: 'Fraunces', serif; font-weight: 600; font-size: 14.5px; }
.nsr-history-step { display: flex; align-items: flex-start; gap: 10px; margin-top: 10px; }
.nsr-history-step p { font-size: 13.5px; margin: 4px 0 0; line-height: 1.5; }

.nsr-minibars { display: flex; align-items: flex-end; gap: 4px; height: 30px; }
.nsr-minibar-track { width: 8px; height: 100%; background: var(--nsr-track); border-radius: 3px; display: flex; align-items: flex-end; overflow: hidden; }
.nsr-minibar-fill { width: 100%; border-radius: 3px; }

.nsr-code-card { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.nsr-code-info { flex: 1; min-width: 0; }
.nsr-group-name-row { display: flex; align-items: center; gap: 4px; }
.nsr-group-name { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 600; margin: 0; overflow-wrap: anywhere; }
.nsr-inline-edit { display: flex; align-items: center; gap: 6px; }
.nsr-inline-edit .nsr-input { padding: 7px 10px; font-size: 14px; }
.nsr-code-actions { display: flex; gap: 6px; flex-shrink: 0; }

.nsr-member-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.nsr-member-name { font-weight: 600; font-size: 14px; }
.nsr-member-step { font-size: 13.5px; margin: 10px 0 0; line-height: 1.5; }

.nsr-chat-card { padding: 0; overflow: hidden; }
.nsr-chat-scroll { max-height: 260px; overflow-y: auto; padding: 14px 16px; display: flex; flex-direction: column; gap: 12px; }
.nsr-chat-msg { max-width: 82%; background: var(--nsr-bg); border-radius: 12px; padding: 8px 12px; }
.nsr-chat-msg-own { align-self: flex-end; background: var(--nsr-accent); color: #fff; }
.nsr-chat-msg-own .nsr-chat-time, .nsr-chat-msg-own .nsr-chat-name { color: rgba(255,255,255,0.85); }
.nsr-chat-msg p { margin: 2px 0 0; font-size: 13.5px; line-height: 1.45; }
.nsr-chat-meta { display: flex; gap: 8px; font-size: 11px; color: var(--nsr-ink-muted); }
.nsr-chat-name { font-weight: 600; }
.nsr-chat-form { display: flex; gap: 8px; padding: 12px 14px; border-top: 1px solid var(--nsr-border); }

.nsr-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--nsr-ink);
  color: #fff;
  padding: 10px 18px;
  border-radius: 999px;
  font-size: 13px;
  z-index: 30;
  max-width: 88%;
  text-align: center;
}

@keyframes nsr-slide-up { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes nsr-slide-right { from { transform: translateX(-16px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

@media (prefers-reduced-motion: reduce) {
  .nsr-sheet, .nsr-drawer { animation: none; }
}
`;
