# ARIES: cinematic editorial overhaul

## The design read

Institutional research site for a credibility-first audience. Editorial language.
**Redesign-overhaul on composition and motion, preserve on brand.**

```
DESIGN_VARIANCE: 8      (currently ~5)
MOTION_INTENSITY: 9     (currently ~5)
VISUAL_DENSITY: 3       (unchanged, stays airy)
```

The existing concept in the CSS header comment is "the published record." That concept
is good and stays. The problem is that the execution stops at a competent editorial
template. Everything below is about pushing it to a site that could not have been
produced from a template, without spending the credibility a research organisation
runs on.

**The core principle for this whole job: the distinctiveness comes from the subject
matter, not from motion vocabulary. Animate the research. Do not animate the
decoration.** ARIES studies how students and teachers understand the purpose of
education, through 3 lenses, 8 objectives, 7 collection methods, across 2 phases. That
structure is the most interesting material on the site and it is currently rendered as
four numbers in a row. Fixing that is worth more than any scroll effect.

---

## Guardrails: things that must not regress

A security and accessibility pass was completed on this codebase. Do not undo it.

1. **`vercel.json` pins a `sha256` hash of the inline no-js script in the CSP
   `script-src`.** If you change that inline script by even one character, every page
   white-screens in production. If you must change it, regenerate the hash and update
   `vercel.json` in the same commit. Verify by serving with the headers applied and
   confirming no CSP violations in the console.
2. **`script-src` is `'self'` plus that hash.** No CDN script tags. Any library you add
   (see the motion section) must be vendored into `assets/js/vendor/` and served from
   the same origin.
3. **The `no-js` / `js` class swap must survive.** Every `[data-reveal]` element is
   `opacity:0` until JS runs. Any new animation you add must follow the same discipline:
   invisible-by-default is only acceptable if there is a `.no-js` rule making it visible.
4. **`prefers-reduced-motion` must be a real path, not a token gesture.** At
   `MOTION_INTENSITY: 9` this is non-negotiable. Under reduced motion: no pinning, no
   scrubbing, no parallax, no scroll-hijack. Content appears in final state, laid out
   correctly, fully readable. Test it by actually enabling the OS setting, not by
   reading the media query and assuming.
5. **Keyboard navigation and focus states.** Pinned and horizontally-panned sections are
   the most common place keyboard access silently breaks. Tab through every section
   after building it. If a pinned section traps focus or a horizontal track hides
   focused elements offscreen, it is broken and must be fixed or cut.
6. **Contrast stays at AA.** `--brass-ink` exists specifically because `--brass` fails
   on small text. Use `--brass-ink` for text, `--brass` for rules and icons. Recheck any
   new colour pairing you introduce.
7. **Do not change** URL slugs, nav labels, form field names, the logo, or the
   `research.html` / `projects.html` / `insights.html` / `community.html` IA. The
   sitemap and canonical tags depend on the current slugs.

---

## Phase 0: build step migration (do this first, in isolation)

**Do not start any design work until this phase passes its verification gate.**

The header, footer, and nav markup are duplicated across 16 HTML files. The dropdown
block alone appears 128 times. Every change in later phases touches all 16 pages, so
the duplication has to go first.

1. Introduce **Eleventy (11ty)**. Nothing else. No React, no Vite, no CSS framework, no
   client-side runtime. The browser must receive the same kind of static HTML it does now.
2. Structure:
   - `src/_includes/layouts/base.njk` carrying `<head>`, header, footer, script tags.
   - `src/_includes/partials/` for nav, dropdown, footer columns, the mobile drawer.
   - `src/_data/` for content that is currently hard-coded in markup: the nav tree, the
     3 lenses, the 8 objectives, the 7 collection methods, the statistics figures, the
     team roster, the publication list. **This matters for Phase 3** where that data
     drives generated visuals.
   - Each page becomes a `.njk` file carrying only its own content plus front matter for
     title, description, canonical URL, OG image.
   - Build output to `_site/`.
3. Generate `sitemap.xml` from the page collection instead of maintaining it by hand.
4. Keep `assets/css/main.css` and `assets/js/main.js` as they are for now. This phase is
   purely about removing duplication, not touching design.
5. Update `vercel.json` with the build command and `_site` as output directory. Keep all
   existing headers exactly as they are.
6. Update `.gitignore` for `_site/` and `node_modules/`.

**Verification gate, mandatory before proceeding:** build the site, then diff the
generated HTML for all 16 pages against the current hand-written files. Normalise
whitespace if you need to, but the rendered DOM must be equivalent. Re-run the link
checker: all 370 references must still resolve. Load the site with the CSP headers
applied and confirm zero console violations. **Report the diff result to me before
starting Phase 1.**

---

## Phase 1: foundation

1. **Self-host the three font families.** Download Newsreader, Libre Franklin, and IBM
   Plex Mono as `woff2` into `assets/fonts/`. Subset to Latin. Use `@font-face` with
   `font-display: swap`. Then remove `fonts.googleapis.com` and `fonts.gstatic.com`
   from the two `preconnect` tags **and from the CSP `style-src` and `font-src`**. This
   kills the FOUT, removes two third-party domains, and stops leaking visitor IPs to
   Google. Newsreader is a variable font with an optical-size axis, so load the variable
   version and actually drive `font-optical-sizing` / the `opsz` axis by size rather
   than loading static cuts.
2. **Add a grain overlay.** Fixed, `pointer-events: none`, very low opacity, over the
   whole page. The concept is a printed record and the surface is currently perfectly
   flat digital. This is the highest impact-to-risk change in the entire job. Keep it
   subtle enough that it reads as paper tooth, not as noise. Disable under
   `prefers-reduced-transparency`.
3. **Extend the topo-line language.** `topo-lines-light.svg` / `topo-lines-dark.svg`
   already exist and are used at low opacity in a few places. Use them more
   deliberately as a recurring structural motif, at varying scale and crop, so the site
   has a visual signature that repeats.
4. **Type scale.** Widen the gap between display and body further. The display end
   should feel genuinely large at `VARIANCE: 8`. Tighten tracking on display sizes,
   keep `text-wrap: balance` on headings. Enable `font-variant-numeric: tabular-nums`
   on every figure across the site, not just `.hs-num`.
5. **Replace the 17 hand-rolled inline arrow SVGs.** They are the same glyph pasted
   repeatedly. Either build one sprite sheet referenced by `<use>`, or pull a real icon
   family. One family, one stroke width, site-wide.
6. **Delete the legacy CSS.** `main.css` has blocks marked "Publication / gap entries
   (legacy list)" and "Article card (legacy)". Confirm nothing uses them and remove them.

---

## Phase 2: composition overhaul

This is where `VARIANCE: 8` gets spent. The current site is tidy centred rows, which is
exactly what reads as templated.

1. **Kill the three-equal-card grid.** The "Lens 01 / 02 / 03" `card-grid` on the
   homepage is the most-banned AI layout there is, and the pattern repeats on six pages.
   The homepage instance becomes the sticky-stack described in Phase 4. On the other
   five pages, replace with asymmetric two-column zig-zag, offset editorial rows, or a
   deliberately broken grid. **No page should keep three equal columns.**
2. **Introduce overlap and depth.** Nothing on the site currently overlaps anything.
   Use negative margins so figures break their container, so the hero feature card
   overlaps the hero's lower edge, so pull quotes bleed into adjacent sections. This is
   the single clearest signal of an intentional layout versus a stacked one.
3. **Break the container.** Let selected images and the topo motif run full-bleed past
   the 1280px container while text stays constrained. Mixed measure is editorial; uniform
   measure is template.
4. **Vary the radii and the rhythm.** Currently near-uniform. Tighter radii on inner
   elements, softer on containers. Optical bottom padding slightly larger than top on
   major sections.
5. **Audit the two `section--dark` blocks in context.** A dark full-bleed band inside a
   cream page can be a deliberate editorial device or can look like a copy-paste
   accident. Look at them rendered, in sequence, and decide. If they stay, make them
   feel intentional by committing harder: full-bleed imagery, the topo motif, a real
   compositional reason to change ground.
6. **Hero recomposition.** Push the headline larger, let it sit off the grid, and
   deepen the scrim gradient so the type has somewhere to live. The hero feature card
   should overlap rather than sit beside.

---

## Phase 3: the evidence layer (the actual differentiator)

Award-winning institutional sites win on this, not on scroll effects. All of this is
driven by the `src/_data/` files created in Phase 0.

1. **The statistics page becomes the showpiece.** `insights-statistics.html` currently
   uses `div`s with inline percentage widths. Build real charts. Each chart must:
   - Be generated from a data file, not hand-authored markup.
   - Have a genuine `<table>` fallback in the DOM for screen readers and `.no-js`.
   - Animate on scroll entry in a way that reads as data resolving, not as decoration.
   - Carry its source and date visibly. This is a research site; unsourced figures
     undercut the whole premise.
2. **The methodology pipeline.** On `research-methodology.html`, build the 7 collection
   methods and 2 phases as a scroll-drawn SVG: a path that draws itself via
   `stroke-dashoffset` tied to scroll progress, with each method node resolving as the
   line reaches it. Justification: it shows sequence, which is exactly what a
   methodology is.
3. **Sample composition.** A dot matrix that begins uniform and resolves into strata
   (students, teachers, institutions) as it enters view. Justification: it makes sample
   structure legible at a glance, which prose cannot do.
4. **Figures resolve rather than count up.** The count-up on `.hs-num` / `.sb-num` is
   the generic treatment. Replace with figures that resolve out of a scatter of
   candidate values and settle. Same motion budget, but it communicates measurement
   instead of counting.
5. **Consider a fieldwork map.** Bangladesh divisions, with sampling locations. Only
   build this if the data actually exists. Do not invent sampling locations.

---

## Phase 4: the motion system

`MOTION_INTENSITY: 9`. The page must genuinely move. But every animation needs a
one-sentence justification, and if you cannot write that sentence, cut the animation.

**Library choice:** vendor **GSAP with ScrollTrigger** into `assets/js/vendor/` for the
pinned and scrubbed work. Self-hosted, not CDN, because of the CSP. Use **native CSS
scroll-driven animations** (`animation-timeline: view()`) wherever they are sufficient,
with the existing IntersectionObserver as the fallback. Keep the current
IntersectionObserver reveal system for simple entrances; do not replace what works.

Build these:

1. **Hero: mask reveal plus scrub.** The existing word-stagger stays. Add: the hero
   photograph scales and parallaxes slightly on scroll while the scrim deepens, so the
   headline gains contrast as you descend. *Justification: the record opens.*
2. **Three-lenses sticky-stack.** Replaces the banned card grid. The section pins at
   `start: "top top"` (not `"top center"`, which is the standard failure). The central
   question stays fixed on screen while the three lenses transition through it.
   *Justification: three lenses on one question. Pinning the question while the lens
   changes is literally the idea.*
3. **Scroll-drawn methodology path** (Phase 3, item 2). *Justification: sequence.*
4. **One horizontal pan, site-wide maximum.** Best candidate is the publications or
   projects timeline. Pin the wrapper, scrub the inner track. *Justification: a timeline
   is horizontal.* If it does not earn it, skip it entirely.
5. **Cross-page View Transitions.** This is the highest-value item in the phase. You
   have a 16-page static site, which is exactly the architecture the View Transitions
   API was designed for. Add `@view-transition { navigation: auto; }` and assign
   `view-transition-name` to the brand mark, the page hero image, and the page title so
   they persist across navigation. Degrades to normal navigation where unsupported.
   *Justification: continuity of the record across pages.* Very few institutional sites
   do this and it is the strongest "how did they build that" moment available here.
6. **Spring physics, not linear easing,** on all interactive feedback. Hover states on
   cards and CTAs should feel weighted.

**Do not build these**, and this is a deliberate call rather than an oversight:

- **No smooth-scroll inertia libraries** (Lenis and similar). They hijack native scroll,
  break scrollbar position expectations, hurt accessibility, and signal agency showreel
  rather than research institute. This is the one place where "cinematic" and
  "credible" genuinely conflict and credibility wins.
- **No custom cursors.** Accessibility-hostile and dated.
- **No infinite-loop micro-animations on informational content.** If a section is
  informational, it sits still.
- **At most one marquee site-wide**, and only if it serves the content. Two or more
  reads as filler.

**Cleanup discipline:** every ScrollTrigger needs proper `refresh()` handling on resize
and font load, and proper teardown. Half-built motion that jumps, cuts off, or leaves
elements stranded mid-transition is worse than no motion.

---

## Phase 5: copy pass

The visible copy contains **144 em-dashes**. That density is the single strongest signal
of machine-written prose, and on a site whose entire premise is rigour, it costs more
credibility than it would anywhere else.

Rewrite to remove them: use a period and two sentences, a comma, a colon, or
parentheses. **Preserve the meaning exactly.** This is a punctuation and sentence-shape
pass, not a content rewrite. Do not change what any sentence claims, and do not touch
the mandate quote if it is a direct quotation from a source document; flag that one to
me instead.

---

## Phase 6: verification

- Rebuild, then re-run the link check across all pages.
- Screenshot every page at 360, 390, 768, 1024, 1440, and 1920.
- Test with `prefers-reduced-motion: reduce` enabled at the OS level. Every page must be
  fully readable and correctly laid out with all motion suppressed.
- Test with JavaScript disabled. Content visible, no invisible sections.
- Tab through every page start to finish. No focus traps, no focused element offscreen.
- Serve with the production CSP applied. Zero console violations.
- Re-check contrast on every new colour pairing.
- Lighthouse on the homepage and the statistics page. Flag any regression in CLS
  specifically, since pinned sections and web fonts are the usual causes.

---

## Content that is still placeholder: flag, do not invent

These are unresolved and deliberately marked in the source. **Do not fabricate names,
figures, photographs, sampling locations, publications, or social URLs to fill them.**
Report them as a checklist:

- Team roster on `about.html` (7 cards) and `community-members.html` (8 entries), all
  "Name pending".
- Contact email, phone, and address on `contact.html`.
- Footer Facebook and LinkedIn links, every page, currently pointing at `contact.html`.
- The contact form has no backend.
- The application form on `join.html` does not exist yet.
- **Photography is generic stock**, acknowledged in the source comments. This is the
  hardest ceiling on the whole project: a research site about grassroots fieldwork in
  Bangladesh illustrated with stock photos of people at laptops will not read as
  authentic no matter how good the layout and motion are. Flag this to me as the top
  content priority rather than trying to design around it.

---

## Working method

Work phase by phase. Do not start a phase before the previous one builds, renders, and
passes its checks. After each phase, give me a short summary of what changed and what
you deliberately chose not to do, plus anything where you think my direction is wrong.
Keep commits scoped to a single phase.




last update after completing phase 1 
Phase 1 complete
Verification
Check	Result
Mobile sweep, 16 pages × 5 widths	80/80 ok — no overflow despite much larger display type
CSP with production headers	0/16 issues
JavaScript disabled	0/16 failures
Contrast	64 — unchanged, all decorative .chev only, no regression
Link check	0 broken
Third-party requests	none
What changed
1. Fonts self-hosted. Newsreader, Libre Franklin, IBM Plex Mono as Latin-subset woff2 in assets/fonts/. Both preconnect tags and the Google stylesheet link are gone, and the CSP now reads style-src 'self' 'unsafe-inline'; font-src 'self' — zero third-party origins. Verified in-browser: no request leaves the origin.

Three things worth flagging here:

Newsreader ships as the true variable font and I proved the optical-size axis is live, not just declared: the same string at 64px measures 1209.67px at opsz:6 vs 1029.09px at opsz:72. font-optical-sizing:auto on body drives it from the used size, so display type gets the high-contrast cut and body copy the sturdy one, from one file.
The old link was loading Newsreader italic (~143KB) for nothing. Every cite rule in the stylesheet sets font-style:normal and uses the mono face; nothing on the site renders serif italic. Dropped.
.prose em was rendering faux-italic — the old link never requested a Libre Franklin italic. That's now a real cut.
Net: 6 files/362KB → 5 files/218KB, with better rendering. Fonts get immutable cache headers.

The one non-obvious detail: the nav chevron is U+25BE, outside the Latin subset. I kept explicit unicode-range declarations so it still falls through to a system face exactly as it did on Google's subset. Without them it would render as tofu on every page.

2. Grain overlay. A 128px greyscale tile (10KB, generated deterministically) composited under overlay, where mid-grey is neutral — so it lightens and darkens the ground rather than tinting it, and works over cream and the dark green bands alike. Verified it's actually compositing rather than silently failing: the screenshot is 1.71× less compressible with it on. Suppressed under prefers-reduced-transparency (confirmed: display:block → none) and in print. The header's backdrop-filter is intact.

3. Topo motif extended to tint bands and the footer at 230% and 300% scale with directional masks, so each placement shows a different fragment.

I got this wrong first time and the measurement caught it: I'd used the four-value background-position edge-offset form (right -18% bottom -40%), which resolves against the difference between image and container — with an image 5× the box height it landed entirely outside and painted nothing. Two-value percentages fixed it. Confirmed painting at 1.029×.

4. Type scale widened. Reading tiers (2xs–md) held exactly where they were — they were already checked for contrast and line length. Everything from lg up pushed hard: display now clamp(45px, 8.6vw, 124px) (was 42/7vw/96). Added four tracking tokens that tighten as size grows. Every minimum still fits 360px, which the 80/80 sweep proves.

5. Tabular figures site-wide via one rule covering every numeric class. This matters because main.js counts figures up on reveal — proportional digits visibly jitter and shove labels around while settling.

6. Icon sprite. All 17 arrows were byte-identical. Now one <symbol> inlined per page, referenced by <use>. Verified: 9 uses on the homepage, none zero-sized, still 17×17px, currentColor resolving correctly, sprite container itself 0×0. Inlined rather than an external file — <use> across documents costs a request and has a long support tail.

Where I diverged from your brief
I did not delete the "legacy" CSS blocks — because they are not legacy. Your brief said "confirm nothing uses them and remove them." I confirmed the opposite:

.pub-entry renders 6 entries on research-publications.html
.article-card renders 3 cards on insights-articles.html
Both verified in the built output. Deleting them would have stripped two pages to unstyled text. The comment labels were simply wrong. I corrected them in place so this doesn't trap anyone else, and left the rules alone. If you know of a different legacy block you meant, point me at it.

Notes for later phases
style-src still needs 'unsafe-inline' for the 4 .bar-fill chart widths. That remains the only blocker to dropping it, and it's Phase 3's job.
The grain sits at z-index:9000, above the mobile drawer (190) and header (200). Intentional, but worth knowing when Phase 4 adds pinned sections.
I deliberately did not add a generic .topo-layer utility class — it would have been speculative abstraction with no second consumer yet. Phase 2 can generalise the two concrete rules when there's a real third use.
Nothing committed. Ready for Phase 2 on your go-ahead.