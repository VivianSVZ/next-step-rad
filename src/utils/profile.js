import { AREA_ORDER, AREA_META } from "../constants.js";
import { generateId } from "./ids.js";

export function defaultProfile() {
  const colors = {};
  AREA_ORDER.forEach((k) => {
    colors[k] = AREA_META[k].defaultColor;
  });
  return {
    id: generateId(),
    name: "",
    colors,
    groupCode: null,
  };
}
