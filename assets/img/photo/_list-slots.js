/* ===========================================================
   Image slot report — ARIES
   ===========================================================
   Scans every page for references to assets/img/photo/* and
   prints where each slot is used, so the list of outstanding
   photography stays derived from the markup rather than from a
   hand-kept note that drifts.

   Run:  node assets/img/photo/_list-slots.js
   =========================================================== */

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "..", "..");
const pages = fs
  .readdirSync(root)
  .filter((f) => f.endsWith(".html"))
  .sort();

/* Subject briefs live on the plate itself; re-read them from the
   generated SVG so there is one source of truth. */
function briefFor(slot) {
  const file = path.join(__dirname, slot + ".svg");
  if (!fs.existsSync(file)) return "";
  const m = fs.readFileSync(file, "utf8").match(/&#183; ([^<&]+)<\/text>/);
  return m ? m[1].trim() : "";
}

const slots = new Map();
for (const page of pages) {
  const src = fs.readFileSync(path.join(root, page), "utf8");
  const re = /assets\/img\/photo\/([A-Za-z0-9._-]+)\.svg/g;
  let m;
  while ((m = re.exec(src))) {
    if (!slots.has(m[1])) slots.set(m[1], new Set());
    slots.get(m[1]).add(page);
  }
}

const all = fs
  .readdirSync(__dirname)
  .filter((f) => f.endsWith(".svg"))
  .map((f) => f.replace(/\.svg$/, ""))
  .sort();

let used = 0;
const rows = [];
for (const slot of all) {
  const on = slots.get(slot);
  if (on) used++;
  rows.push({
    slot,
    dims: (function () {
      const s = fs.readFileSync(path.join(__dirname, slot + ".svg"), "utf8");
      const m = s.match(/viewBox="0 0 (\d+) (\d+)"/);
      return m ? m[1] + "x" + m[2] : "?";
    })(),
    brief: briefFor(slot),
    pages: on ? Array.from(on).join(", ") : "(unused)",
  });
}

const pad = (s, n) => String(s).padEnd(n);
console.log(
  pad("SLOT", 17) + pad("SIZE", 11) + pad("SUBJECT", 26) + "USED ON"
);
console.log("-".repeat(96));
for (const r of rows) {
  console.log(pad(r.slot, 17) + pad(r.dims, 11) + pad(r.brief, 26) + r.pages);
}
console.log("-".repeat(96));
console.log(used + " of " + all.length + " slots placed across " + pages.length + " pages");
