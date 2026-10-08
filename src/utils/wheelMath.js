export function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function annularSectorPath(cx, cy, innerR, outerR, startAngle, endAngle) {
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

export function normalizeAngle(a) {
  return ((a % 360) + 360) % 360;
}

export function labelArcPath(cx, cy, r, startAngle, endAngle, flip) {
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
