import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AREA_ORDER, AREA_META } from "../constants.js";
import { formatWeekLabel } from "../utils/date.js";
import { MiniBars } from "./MiniBars.jsx";

// Versetzt Punkte, die in derselben Woche denselben Wert haben, minimal nebeneinander, damit sie sich nicht gegenseitig verdecken
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

export function HistoryView({ entries, colors }) {
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
