import React from "react";
import { AREA_META } from "../constants.js";

export function AreaChip({ areaKey, active, color, onClick }) {
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
