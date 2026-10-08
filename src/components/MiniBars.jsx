import React from "react";
import { AREA_ORDER, AREA_META } from "../constants.js";

export function MiniBars({ scores, colors }) {
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
