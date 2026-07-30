/* ===========================================================
   Placeholder plate generator — ARIES
   ===========================================================
   Writes the stand-in SVG "photographs" used across the site
   while real photography is pending. Each plate is a layered
   terrain — graded ground, drifting contour arcs, grain wash —
   with an FPO label stamped on it naming the slot and the size
   the real image should be. The label is what makes a blank
   findable: every one you see is an image still owed.

   Run:  node assets/img/photo/_make-plates.js
   Then: drop a real photo in at the same path and filename,
         or swap the extension and update the <img src>.

   Set LABELS = false below to render the plates clean, if you
   want to ship before every slot is filled.
   =========================================================== */

const LABELS = true;

const fs = require("fs");
const path = require("path");

/* Deterministic PRNG — the same plate must regenerate identically,
   otherwise re-running this churns every file in git. */
function rng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* Palette pairs drawn from the ARIES tokens. Each plate picks one
   so the set stays a family without every image looking identical. */
const SCHEMES = {
  pine:    { a: "#07220F", b: "#0E4A2A", c: "#1D6F42", haze: "#D9C48E" },
  pineDay: { a: "#0A331F", b: "#155C36", c: "#5C6961", haze: "#D9C48E" },
  chalk:   { a: "#C3C9BE", b: "#E4EBE3", c: "#F3F5F1", haze: "#96702F" },
  brass:   { a: "#0A331F", b: "#96702F", c: "#B08D45", haze: "#EEF2EC" },
  sage:    { a: "#3D4A41", b: "#5C6961", c: "#89948B", haze: "#D9C48E" },
};

/* One contour ribbon: a smooth open curve swept across the plate.
   Amplitude decays with depth so lower bands sit flatter, the way
   a receding landscape does. */
function contour(r, w, h, yBase, amp, steps) {
  const pts = [];
  const phase = r() * Math.PI * 2;
  const freq = 0.8 + r() * 1.4;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y =
      yBase +
      Math.sin(t * Math.PI * freq * 2 + phase) * amp +
      Math.sin(t * Math.PI * freq * 5.3 + phase * 1.7) * amp * 0.28;
    pts.push([t * w, y]);
  }
  /* Catmull-Rom → cubic bezier, so the ribbon has no visible kinks */
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? 0 : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2 > pts.length - 1 ? pts.length - 1 : i + 2];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(
      1
    )} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

/* Greatest common divisor, for printing the aspect as a ratio
   rather than as a decimal nobody can act on. */
function gcd(a, b) {
  return b ? gcd(b, a % b) : a;
}
function ratio(w, h) {
  const g = gcd(w, h);
  return `${w / g}:${h / g}`;
}

/* FPO label — a hairline frame with corner ticks, the slot name,
   and the size to supply. Sized as a fraction of the viewBox so it
   stays legible whether the plate renders at 300px or 2000px. */
function label(w, h, name, note) {
  const u = Math.min(w, h);
  const fs = Math.max(11, u * 0.032);
  const pad = u * 0.05;
  const boxW = Math.min(w - pad * 2, fs * 26);
  const boxH = fs * 5.4;
  const x = (w - boxW) / 2;
  const y = (h - boxH) / 2;
  const tick = fs * 0.9;
  const mono = "ui-monospace, 'IBM Plex Mono', Consolas, 'Courier New', monospace";

  /* corner ticks, drawn as four L shapes */
  const c = [
    `M${x},${y + tick} L${x},${y} L${x + tick},${y}`,
    `M${x + boxW - tick},${y} L${x + boxW},${y} L${x + boxW},${y + tick}`,
    `M${x + boxW},${y + boxH - tick} L${x + boxW},${y + boxH} L${x + boxW - tick},${y + boxH}`,
    `M${x + tick},${y + boxH} L${x},${y + boxH} L${x},${y + boxH - tick}`,
  ]
    .map(
      (d) =>
        `<path d="${d}" fill="none" stroke="#FFFFFF" stroke-opacity="0.72" stroke-width="${(
          fs * 0.13
        ).toFixed(2)}"/>`
    )
    .join("");

  return `<g>
<rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" fill="#07220F" fill-opacity="0.44"/>
${c}
<text x="${w / 2}" y="${y + boxH * 0.36}" text-anchor="middle" font-family="${mono}" font-size="${(
    fs * 0.72
  ).toFixed(1)}" letter-spacing="${(fs * 0.16).toFixed(2)}" fill="#DCC793" fill-opacity="0.95">IMAGE SLOT</text>
<text x="${w / 2}" y="${y + boxH * 0.63}" text-anchor="middle" font-family="${mono}" font-size="${fs.toFixed(
    1
  )}" fill="#FFFFFF" fill-opacity="0.96">${name}</text>
<text x="${w / 2}" y="${y + boxH * 0.85}" text-anchor="middle" font-family="${mono}" font-size="${(
    fs * 0.68
  ).toFixed(1)}" fill="#FFFFFF" fill-opacity="0.72">${w}&#215;${h} &#183; ${ratio(w, h)}${
    note ? " &#183; " + note : ""
  }</text>
</g>`;
}

function plate({ w, h, seed, scheme, bands = 9, tilt = 18, name = "", note = "" }) {
  const r = rng(seed);
  const S = SCHEMES[scheme];
  const id = "p" + seed;

  let layers = "";

  /* Contour ribbons, back to front. Later bands are lighter and
     thicker, which is what pushes the earlier ones into depth. */
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1);
    const yBase = h * (0.28 + t * 0.72);
    const amp = h * (0.075 * (1 - t) + 0.012);
    const op = 0.1 + t * 0.5;
    const sw = (1.1 + t * 2.6).toFixed(2);
    const stroke = t > 0.72 ? S.haze : S.c;
    layers += `<path d="${contour(r, w, h, yBase, amp, 26)}" fill="none" stroke="${stroke}" stroke-opacity="${op.toFixed(
      2
    )}" stroke-width="${sw}" stroke-linecap="round"/>`;
  }

  /* A couple of soft light pools, so the field isn't evenly lit */
  for (let i = 0; i < 2; i++) {
    const cx = (0.18 + r() * 0.64) * w;
    const cy = (0.12 + r() * 0.5) * h;
    const rad = (0.28 + r() * 0.3) * w;
    layers += `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${rad.toFixed(
      0
    )}" fill="url(#${id}pool)" />`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="">
<defs>
<linearGradient id="${id}g" x1="0" y1="0" x2="0.35" y2="1">
<stop offset="0" stop-color="${S.a}"/>
<stop offset="0.55" stop-color="${S.b}"/>
<stop offset="1" stop-color="${S.c}"/>
</linearGradient>
<radialGradient id="${id}pool" cx="0.5" cy="0.5" r="0.5">
<stop offset="0" stop-color="${S.haze}" stop-opacity="0.16"/>
<stop offset="1" stop-color="${S.haze}" stop-opacity="0"/>
</radialGradient>
<filter id="${id}grain" x="0" y="0" width="100%" height="100%">
<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="${seed}" result="n"/>
<feColorMatrix in="n" type="saturate" values="0"/>
<feComponentTransfer><feFuncA type="linear" slope="0.11"/></feComponentTransfer>
</filter>
</defs>
<rect width="${w}" height="${h}" fill="url(#${id}g)"/>
<g transform="rotate(${-tilt} ${w / 2} ${h / 2}) scale(1.5) translate(${-w / 6} ${-h / 6})">${layers}</g>
<rect width="${w}" height="${h}" filter="url(#${id}grain)" opacity="0.55"/>
${LABELS && name ? label(w, h, name, note) : ""}
</svg>`;
}

/* `note` is the subject brief — it prints on the plate, so the blank
   says what it wants rather than only that it is empty. */
const PLATES = [
  /* heroes — wide, full-bleed */
  ["hero-home",      { w: 2000, h: 1150, seed: 1071, scheme: "pine",    bands: 11, tilt: 14,  note: "fieldwork, wide" }],
  ["hero-about",     { w: 2000, h: 900,  seed: 2213, scheme: "pineDay", bands: 9,  tilt: 22,  note: "team at work" }],
  ["hero-research",  { w: 2000, h: 900,  seed: 3347, scheme: "pine",    bands: 10, tilt: -9,  note: "interview / survey" }],
  ["hero-projects",  { w: 2000, h: 900,  seed: 4409, scheme: "brass",   bands: 8,  tilt: 26,  note: "site or classroom" }],
  ["hero-insights",  { w: 2000, h: 900,  seed: 5527, scheme: "sage",    bands: 10, tilt: -17, note: "notes / data desk" }],
  ["hero-community", { w: 2000, h: 900,  seed: 6673, scheme: "pineDay", bands: 9,  tilt: 11,  note: "group, gathering" }],
  ["hero-join",      { w: 2000, h: 900,  seed: 7717, scheme: "pine",    bands: 11, tilt: 30,  note: "members, candid" }],
  ["hero-contact",   { w: 2000, h: 900,  seed: 8831, scheme: "chalk",   bands: 9,  tilt: -21, note: "office / exterior" }],

  /* hero feature card */
  ["hero-feature", { w: 1200, h: 800, seed: 8951, scheme: "pineDay", bands: 8, tilt: 17, note: "pilot study, lead shot" }],

  /* editorial portrait rail */
  ["quote-portrait", { w: 900, h: 1125, seed: 9013, scheme: "pine", bands: 8, tilt: -14, note: "portrait, vertical" }],

  /* card media — 3:2 */
  ["card-01", { w: 1200, h: 800, seed: 9103, scheme: "pine",    bands: 8, tilt: 19,  note: "students / classroom" }],
  ["card-02", { w: 1200, h: 800, seed: 9227, scheme: "brass",   bands: 7, tilt: -13, note: "making / building" }],
  ["card-03", { w: 1200, h: 800, seed: 9341, scheme: "sage",    bands: 9, tilt: 27,  note: "work / careers" }],
  ["card-04", { w: 1200, h: 800, seed: 9463, scheme: "pineDay", bands: 8, tilt: -24, note: "teacher, classroom" }],
  ["card-05", { w: 1200, h: 800, seed: 9587, scheme: "chalk",   bands: 7, tilt: 8,   note: "devices / access" }],
  ["card-06", { w: 1200, h: 800, seed: 9601, scheme: "pine",    bands: 9, tilt: -30, note: "spare" }],

  /* portrait / thumbnail — 1:1 */
  ["thumb-01", { w: 800, h: 800, seed: 9721,  scheme: "pineDay", bands: 6, tilt: 16,  note: "headshot" }],
  ["thumb-02", { w: 800, h: 800, seed: 9839,  scheme: "sage",    bands: 6, tilt: -19, note: "headshot" }],
  ["thumb-03", { w: 800, h: 800, seed: 9949,  scheme: "brass",   bands: 6, tilt: 25,  note: "headshot" }],
  ["thumb-04", { w: 800, h: 800, seed: 10061, scheme: "pine",    bands: 6, tilt: -11, note: "headshot" }],
];

const outDir = __dirname;
for (const [name, cfg] of PLATES) {
  fs.writeFileSync(path.join(outDir, name + ".svg"), plate({ ...cfg, name }), "utf8");
}
console.log(
  "wrote " + PLATES.length + " plates to " + outDir + (LABELS ? " (labelled)" : " (clean)")
);
