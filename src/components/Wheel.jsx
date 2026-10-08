import React from "react";
import { AREA_ORDER, AREA_META } from "../constants.js";
import { polarToCartesian, annularSectorPath, normalizeAngle, labelArcPath } from "../utils/wheelMath.js";

export function Wheel({ scores, colors, onSelectArea }) {
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
