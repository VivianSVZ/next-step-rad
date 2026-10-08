export function getISOWeekId(date) {
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

export function formatWeekLabel(weekId) {
  const parts = (weekId || "").split("-W");
  if (parts.length !== 2) return weekId || "";
  return "KW " + parseInt(parts[1], 10) + " · " + parts[0];
}

export function timeAgo(ts) {
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
