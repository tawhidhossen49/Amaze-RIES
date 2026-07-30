/* ===========================================================
   Photo pipeline — ARIES
   ===========================================================
   Takes the supplied source photographs, crops each to the
   aspect its slot needs, scales it to two widths, and writes
   compressed JPEGs into assets/img/photo/.

   Sources stay untouched in SOURCE_DIR; nothing here writes
   back over them.

   Requires ffmpeg on PATH.
   Run:  node assets/img/photo/_build-photos.js
   =========================================================== */

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const OUT = __dirname;
const SOURCE_DIR = path.resolve(__dirname, "..", "..", "..");

/* Two widths per slot: the full-size plate and a mobile plate.
   `srcset` in the markup picks between them. */
const WIDTHS = {
  hero: [2000, 1100],
  card: [1200, 700],
  portrait: [900, 560],
  thumb: [800, 480],
};

/* gravity shifts the crop window off centre, as a fraction of the
   leftover space: 0 = top/left, 0.5 = centre, 1 = bottom/right.
   Used where the subject does not sit in the middle of the frame. */
const SLOTS = [
  /* ---- heroes ---------------------------------------------------- */
  { slot: "hero-home",      src: "image 10.jpg", ar: [16, 9],  kind: "hero", gx: 0.62, gy: 0.42 },
  { slot: "hero-about",     src: "image 13.jpg", ar: [16, 9],  kind: "hero", gy: 0.45 },
  { slot: "hero-research",  src: "image 4.jpg",  ar: [16, 9],  kind: "hero" },
  { slot: "hero-projects",  src: "image 11.jpg", ar: [16, 9],  kind: "hero", gy: 0.5 },
  { slot: "hero-insights",  src: "image 14.jpg", ar: [16, 9],  kind: "hero" },
  { slot: "hero-community", src: "image 16.jpg", ar: [16, 9],  kind: "hero", gy: 0.55 },
  { slot: "hero-join",      src: "image 1.jpg",  ar: [16, 9],  kind: "hero", gy: 0.55 },
  { slot: "hero-contact",   src: "image 6.jpg",  ar: [16, 9],  kind: "hero" },

  /* ---- home feature + portrait ----------------------------------- */
  { slot: "hero-feature",   src: "image 9.jpg",  ar: [3, 2],   kind: "card", gy: 0.4 },
  { slot: "quote-portrait", src: "image 7.jpg",  ar: [4, 5],   kind: "portrait", gy: 0.42 },

  /* ---- home cards ------------------------------------------------ */
  { slot: "card-01", src: "image 1.jpg",  ar: [3, 2], kind: "card", gy: 0.55 },
  { slot: "card-02", src: "image 12.jpg", ar: [3, 2], kind: "card" },
  { slot: "card-03", src: "image 4.jpg",  ar: [3, 2], kind: "card", gx: 0.6 },
  { slot: "card-04", src: "image 3.jpg",  ar: [3, 2], kind: "card" },
  { slot: "card-05", src: "image 2.jpg",  ar: [3, 2], kind: "card", gy: 0.45 },

  /* ---- interior section cards ------------------------------------ */
  { slot: "card-06", src: "image 6.jpg",  ar: [3, 2], kind: "card" },
  { slot: "card-07", src: "image 12.jpg", ar: [3, 2], kind: "card", gx: 0.35 },
  { slot: "card-08", src: "image 11.jpg", ar: [3, 2], kind: "card" },
  { slot: "card-09", src: "image 14.jpg", ar: [3, 2], kind: "card" },
  { slot: "card-10", src: "image 16.jpg", ar: [3, 2], kind: "card", gy: 0.6 },
  { slot: "card-11", src: "image 13.jpg", ar: [3, 2], kind: "card" },
  { slot: "card-12", src: "image 9.jpg",  ar: [3, 2], kind: "card", gy: 0.55 },
  { slot: "card-13", src: "image 10.jpg", ar: [3, 2], kind: "card", gx: 0.6 },
];

function build(spec) {
  const srcPath = path.join(SOURCE_DIR, spec.src);
  if (!fs.existsSync(srcPath)) {
    console.log("  SKIP " + spec.slot + " — missing source: " + spec.src);
    return 0;
  }

  const [arW, arH] = spec.ar;
  const gx = spec.gx === undefined ? 0.5 : spec.gx;
  const gy = spec.gy === undefined ? 0.5 : spec.gy;
  let written = 0;

  for (const w of WIDTHS[spec.kind]) {
    const h = Math.round((w * arH) / arW);
    const suffix = w === WIDTHS[spec.kind][0] ? "" : "@sm";
    const out = path.join(OUT, spec.slot + suffix + ".jpg");

    /* scale so the frame is fully covered, then crop the window out of
       it at the requested gravity */
    const vf = [
      `scale=${w}:${h}:force_original_aspect_ratio=increase`,
      `crop=${w}:${h}:(iw-ow)*${gx}:(ih-oh)*${gy}`,
    ].join(",");

    execFileSync(
      "ffmpeg",
      ["-y", "-loglevel", "error", "-i", srcPath, "-vf", vf,
       "-q:v", "4", "-pix_fmt", "yuvj420p", out],
      { stdio: ["ignore", "ignore", "pipe"] }
    );
    written++;
  }
  return written;
}

let total = 0, bytes = 0;
for (const spec of SLOTS) {
  const n = build(spec);
  total += n;
  if (n) {
    const f = path.join(OUT, spec.slot + ".jpg");
    const kb = Math.round(fs.statSync(f).size / 1024);
    bytes += fs.statSync(f).size;
    console.log("  " + spec.slot.padEnd(16) + spec.src.padEnd(15) + kb + " KB");
  }
}
console.log("\n" + total + " files written, " + Math.round(bytes / 1024) + " KB at full size");
