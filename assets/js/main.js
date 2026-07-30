(function(){
  "use strict";

  var motionQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  var reduceMotion = motionQuery ? motionQuery.matches : false;

  /* Safari < 14 only has the deprecated addListener form. */
  function onMediaChange(mq, fn){
    if (!mq) return;
    if (mq.addEventListener) mq.addEventListener("change", fn);
    else if (mq.addListener) mq.addListener(fn);
  }

  /* Coalesces bursts of events into one call per frame. */
  function rafThrottle(fn){
    var queued = false;
    return function(){
      if (queued) return;
      queued = true;
      requestAnimationFrame(function(){ queued = false; fn(); });
    };
  }

  /* Footer year */
  document.querySelectorAll("[data-year]").forEach(function(el){
    el.textContent = new Date().getFullYear();
  });

  /* ---------------------------------------------------------
     Header: condense + shadow once the page has scrolled.
     Also publishes the live header height so the mobile nav
     can sit flush beneath it at any breakpoint.
  --------------------------------------------------------- */
  var header = document.querySelector(".site-header");
  function setHeaderHeightVar(){
    if (header) document.documentElement.style.setProperty("--header-h-live", header.offsetHeight + "px");
  }
  /* The header only changes height when the condensed state flips, so
     re-measuring on every scroll tick would force a layout for nothing. */
  var isCondensed = null;
  function onScroll(){
    var condensed = window.scrollY > 8;
    if (condensed === isCondensed) return;
    isCondensed = condensed;
    if (header) header.classList.toggle("is-scrolled", condensed);
    setHeaderHeightVar();
  }
  window.addEventListener("scroll", onScroll, {passive:true});
  window.addEventListener("resize", rafThrottle(setHeaderHeightVar));
  setHeaderHeightVar();
  onScroll();

  /* ---------------------------------------------------------
     Mobile navigation
  --------------------------------------------------------- */
  var toggle = document.querySelector(".nav-toggle");
  var mobileNav = document.querySelector(".nav-mobile");

  function setMobileNav(open){
    if (!mobileNav || !toggle) return;
    setHeaderHeightVar();
    mobileNav.classList.toggle("is-open", open);
    toggle.classList.toggle("is-active", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
  }
  function closeMobileNav(){ setMobileNav(false); }

  if (toggle && mobileNav) {
    toggle.setAttribute("aria-controls", "mobile-nav");
    mobileNav.id = mobileNav.id || "mobile-nav";
    toggle.addEventListener("click", function(){
      setMobileNav(!mobileNav.classList.contains("is-open"));
    });
  }

  /* A width change can strand the menu open behind a desktop layout */
  /* Keep in step with the `max-width:1040px` nav breakpoint in main.css. */
  onMediaChange(
    window.matchMedia && window.matchMedia("(min-width: 1041px)"),
    function(e){ if (e.matches) closeMobileNav(); }
  );

  /* Dropdowns: hover covers mice, but a coarse pointer at desktop
     width has no hover — let the first tap open the panel instead of
     following the link straight through. */
  var isCoarsePointer = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  if (isCoarsePointer) {
    document.querySelectorAll(".has-dropdown > .nav-link").forEach(function(link){
      link.addEventListener("click", function(e){
        var li = link.parentElement;
        if (!li.classList.contains("is-open")) {
          e.preventDefault();
          document.querySelectorAll(".has-dropdown.is-open").forEach(function(o){ o.classList.remove("is-open"); });
          li.classList.add("is-open");
        }
      });
    });
    document.addEventListener("click", function(e){
      document.querySelectorAll(".has-dropdown.is-open").forEach(function(li){
        if (!li.contains(e.target)) li.classList.remove("is-open");
      });
    });
  }

  /* Mobile accordions */
  document.querySelectorAll(".nav-mobile-link[data-toggle]").forEach(function(link){
    link.addEventListener("click", function(e){
      e.preventDefault();
      var panel = document.getElementById(link.getAttribute("data-toggle"));
      if (!panel) return;
      var isOpen = panel.classList.toggle("is-open");
      link.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  });

  /* Close the menu when a real link inside it is followed */
  document.querySelectorAll(".nav-mobile a:not([data-toggle])").forEach(function(link){
    link.addEventListener("click", closeMobileNav);
  });

  document.addEventListener("keydown", function(e){
    if (e.key !== "Escape") return;
    if (mobileNav && mobileNav.classList.contains("is-open")) {
      closeMobileNav();
      if (toggle) toggle.focus();
      return;
    }
    var openDrop = document.querySelector(".has-dropdown.is-open");
    if (openDrop) openDrop.classList.remove("is-open");
  });

  /* ---------------------------------------------------------
     Hero field — the one deliberately bold moment.

     A jittered grid of plotted marks whose weight follows a slow
     travelling field. Marks sitting on a threshold band pick up
     brass, so contour lines surface out of scattered points and
     drift: grassroots data resolving into a pattern.
  --------------------------------------------------------- */
  (function heroField(){
    var canvas = document.querySelector(".hero-field");
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext("2d");
    var marks = [];
    /* scratch buffers for draw(), sized once in build() */
    var hitIndex = null, hitBucket = null;
    var w = 0, h = 0;
    var SPACING = 14;

    function build(){
      var rect = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width; h = rect.height;
      if (!w || !h) return false;

      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      marks.length = 0;
      var cols = Math.ceil(w / SPACING) + 1;
      var rows = Math.ceil(h / SPACING) + 1;
      for (var i = 0; i < cols; i++) {
        for (var j = 0; j < rows; j++) {
          /* deterministic jitter keeps the field stable across resizes */
          var n = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
          var r1 = n - Math.floor(n);
          var n2 = Math.sin(i * 39.3468 + j * 11.135) * 24634.6345;
          var r2 = n2 - Math.floor(n2);
          marks.push({
            x: i * SPACING + (r1 - 0.5) * SPACING * 0.7,
            y: j * SPACING + (r2 - 0.5) * SPACING * 0.7
          });
        }
      }
      hitIndex = new Uint32Array(marks.length);
      hitBucket = new Uint8Array(marks.length);
      return true;
    }

    /* Elevation surface: a few travelling waves at long wavelengths,
       so the terrain is smooth and its contours are broad ribbons
       rather than noise. */
    function fieldAt(x, y, t){
      return Math.sin(x * 0.0058 + t)
           + Math.sin(y * 0.0086 - t * 0.72)
           + Math.sin((x + y) * 0.0041 + t * 0.51)
           + Math.sin((x - y * 1.6) * 0.0033 - t * 0.36);
    }

    /* Contours are drawn at evenly spaced elevations across the whole
       surface. Measuring distance to the nearest interval boundary —
       rather than to a handful of fixed values — is what makes the
       ribbons read as contour lines instead of scattered dust. */
    var INTERVAL = 0.62; /* elevation between successive contours */
    var BAND = 0.18;     /* how close a mark must sit to count as "on" */

    /* Thousands of marks are redrawn 30 times a second, so brightness is
       quantised into a fixed set of steps and their colours built once.
       Otherwise every mark would allocate a new rgba string and force the
       canvas to re-parse a colour on each frame. */
    var STEPS = 14;
    var CONTOUR_FILL = [];
    var CONTOUR_SIZE = [];
    for (var q = 0; q < STEPS; q++) {
      var f = q / (STEPS - 1);
      CONTOUR_FILL.push("rgba(219,197,144," + (0.13 + f * 0.74).toFixed(3) + ")");
      CONTOUR_SIZE.push(1.5 + f * 2.1);
    }
    var OFF_FILL = "rgba(178,203,184,0.055)";

    function draw(t){
      ctx.clearRect(0, 0, w, h);

      /* Off-contour marks all share one colour, so they go down in a single
         pass; contour marks are deferred into a reused buffer and drawn
         after, keeping fillStyle changes to roughly one per bucket. */
      ctx.fillStyle = OFF_FILL;
      var n = 0;
      for (var i = 0; i < marks.length; i++) {
        var m = marks[i];
        var step = fieldAt(m.x, m.y, t) / INTERVAL;
        var d = Math.abs(step - Math.round(step)); /* 0 → dead on a contour */
        if (d < BAND) {
          hitIndex[n] = i;
          hitBucket[n] = ((1 - d / BAND) * (STEPS - 1)) | 0;
          n++;
        } else {
          ctx.fillRect(m.x, m.y, 1.1, 1.1);
        }
      }

      for (var j = 0; j < n; j++) {
        var mk = marks[hitIndex[j]], q2 = hitBucket[j];
        ctx.fillStyle = CONTOUR_FILL[q2];
        var s = CONTOUR_SIZE[q2];
        ctx.fillRect(mk.x, mk.y, s, s);
      }
    }

    var raf = null, last = 0, clock = 0, running = false, isOnScreen = true;
    var FRAME = 1000 / 30; /* 30fps is plenty for a drift this slow */

    function loop(now){
      raf = requestAnimationFrame(loop);
      if (now - last < FRAME) return;
      clock += (now - last) / 1000 * 0.12;
      last = now;
      draw(clock);
    }
    function start(){
      if (running || reduceMotion) return;
      running = true; last = performance.now();
      raf = requestAnimationFrame(loop);
    }
    function stop(){
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    }

    function init(){
      if (!build()) return;
      draw(clock);
      if (!reduceMotion) start();
    }

    var resizeTimer;
    window.addEventListener("resize", function(){
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function(){ if (build()) draw(clock); }, 180);
    });

    /* Don't burn frames on a hero that has scrolled away, or a
       backgrounded tab. */
    document.addEventListener("visibilitychange", function(){
      if (document.hidden) stop(); else if (isOnScreen) start();
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function(entries){
        isOnScreen = entries[0].isIntersecting;
        if (isOnScreen && !document.hidden) start(); else stop();
      }, {threshold: 0}).observe(canvas);
    }

    onMediaChange(motionQuery, function(e){
      reduceMotion = e.matches;
      if (reduceMotion) { stop(); draw(clock); } else start();
    });

    init();
  })();

  /* ---------------------------------------------------------
     Count-up for statistics. Preserves any prefix/suffix such
     as "%" and leaves trailing markup untouched.
  --------------------------------------------------------- */
  function primeCountUp(el){
    var node = el.firstChild;
    if (!node || node.nodeType !== 3) return null;
    var m = node.textContent.match(/(\d[\d,]*(?:\.\d+)?)/);
    if (!m) return null;
    var raw = m[1].replace(/,/g, "");
    var target = parseFloat(raw);
    if (!isFinite(target)) return null;
    var decimals = raw.indexOf(".") > -1 ? raw.split(".")[1].length : 0;
    var prefix = node.textContent.slice(0, m.index);
    var suffix = node.textContent.slice(m.index + m[1].length);
    /* Counting 0→2 reads as a glitch, not an effect. Small numbers
       just appear. */
    if (target < 10 && decimals === 0) return null;
    node.textContent = prefix + (0).toFixed(decimals) + suffix;
    return {node:node, prefix:prefix, suffix:suffix, target:target, decimals:decimals};
  }
  function runCountUp(spec){
    if (!spec) return;
    if (reduceMotion) {
      spec.node.textContent = spec.prefix + spec.target.toFixed(spec.decimals) + spec.suffix;
      return;
    }
    var start = null, dur = 1100;
    function tick(ts){
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      spec.node.textContent = spec.prefix + (spec.target * eased).toFixed(spec.decimals) + spec.suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------------------------------------------------------
     Bar charts: capture the authored width, collapse, then grow
     back once the block scrolls into view.
  --------------------------------------------------------- */
  document.querySelectorAll(".bar-fill").forEach(function(bar){
    bar.dataset.target = bar.style.width || "0%";
    if (!reduceMotion) bar.style.width = "0%";
  });
  function runBars(container){
    if (!container.querySelectorAll) return;
    container.querySelectorAll(".bar-fill").forEach(function(bar, i){
      if (reduceMotion) { bar.style.width = bar.dataset.target; return; }
      setTimeout(function(){ bar.style.width = bar.dataset.target; }, i * 110);
    });
  }

  /* ---------------------------------------------------------
     Scroll reveal. Grouped by shared parent so grids cascade.
  --------------------------------------------------------- */
  var itemSelector = [
    ".card", ".pub-entry", ".project-card", ".article-card", ".stat-card",
    ".chart-block", ".people-card", ".event-card", ".value-item",
    ".step-item", ".criteria-item", ".contact-item"
  ].join(",");
  var soloSelector = ".section-head, .pull-quote, .placeholder-block, .prose";
  var textSelector = ".section-title, .eyebrow, .lede";

  var revealTargets = [];
  function markReveal(el, delayMs){
    if (!el || el.classList.contains("reveal")) return;
    el.classList.add("reveal");
    if (delayMs) el.style.transitionDelay = delayMs + "ms";
    revealTargets.push(el);
  }

  /* 1 — item groups, staggered within their shared parent */
  var parents = new Map();
  document.querySelectorAll(itemSelector).forEach(function(el){
    var p = el.parentElement;
    if (!parents.has(p)) parents.set(p, 0);
    var i = parents.get(p);
    parents.set(p, i + 1);
    markReveal(el, Math.min(i, 5) * 65);
  });

  /* 2 — section intros and pull quotes */
  document.querySelectorAll(soloSelector).forEach(function(el){ markReveal(el, 0); });

  /* 3 — loose headings not already inside a hero or section-head */
  document.querySelectorAll(textSelector).forEach(function(el){
    if (el.closest(".hero") || el.closest(".page-hero") || el.closest(".section-head")) return;
    if (el.closest(itemSelector)) return;
    var step = el.classList.contains("eyebrow") ? 0 : el.classList.contains("section-title") ? 1 : 2;
    markReveal(el, step * 75);
  });

  /* 4 — a section with none of the above lifts as one block */
  document.querySelectorAll("section.section > .container").forEach(function(container){
    if (container.querySelector(itemSelector + "," + soloSelector + "," + textSelector)) return;
    markReveal(container, 0);
  });

  function handleReveal(el){
    el.classList.add("reveal-visible");
    if (el.classList.contains("stat-card")) {
      var num = el.querySelector(".stat-num");
      if (num && !num.dataset.counted) { num.dataset.counted = "1"; runCountUp(primeCountUp(num)); }
    }
    if (el.classList.contains("chart-block")) runBars(el);
  }

  var io = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting) { handleReveal(entry.target); io.unobserve(entry.target); }
      });
    }, {threshold:[0, 0.12], rootMargin:"0px 0px -6% 0px"});
    revealTargets.forEach(function(el){ io.observe(el); });
  } else {
    revealTargets.forEach(handleReveal);
  }

  /* ---------------------------------------------------------
     Tabs — full ARIA tablist behaviour, arrow keys included.
  --------------------------------------------------------- */
  document.querySelectorAll("[data-tabs]").forEach(function(group){
    var tabs = Array.prototype.slice.call(group.querySelectorAll(".tab-btn"));
    if (!tabs.length) return;

    function select(tab, setFocus){
      tabs.forEach(function(t){
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.classList.toggle("is-active", on);
      });
      if (setFocus) tab.focus();

      var panel = document.getElementById(tab.getAttribute("aria-controls"));
      if (!panel) return;
      /* Switching panels is a deliberate action — reveal its contents
         now rather than waiting on a scroll that may never come. */
      var pending = panel.querySelectorAll(".reveal:not(.reveal-visible)");
      if (!pending.length) return;
      pending.forEach(function(el){ if (io) io.unobserve(el); });
      void panel.offsetHeight; /* flush layout so the transition isn't coalesced away */
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){ pending.forEach(handleReveal); });
      });
    }

    tabs.forEach(function(tab, i){
      tab.tabIndex = tab.getAttribute("aria-selected") === "true" ? 0 : -1;
      tab.addEventListener("click", function(){ select(tab, false); });
      tab.addEventListener("keydown", function(e){
        var next = null;
        if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
        else if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === "Home") next = tabs[0];
        else if (e.key === "End") next = tabs[tabs.length - 1];
        if (!next) return;
        e.preventDefault();
        select(next, true);
      });
    });
  });

  /* ---------------------------------------------------------
     Contact form. No backend is wired up yet, so the form must
     say so plainly rather than appear to send and silently
     reload the page.
  --------------------------------------------------------- */
  document.querySelectorAll("form[data-contact-form]").forEach(function(form){
    var status = form.querySelector("[data-form-status]");

    function fieldError(input){
      var wrap = input.closest(".field");
      return wrap ? wrap.querySelector(".field-error") : null;
    }
    function validate(input){
      var msg = "";
      var value = input.value.trim();
      if (input.hasAttribute("required") && !value) {
        msg = "Enter your " + (input.dataset.label || "details") + ".";
      } else if (input.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        msg = "That email address doesn't look complete.";
      }
      var errEl = fieldError(input);
      if (errEl) errEl.textContent = msg;
      input.setAttribute("aria-invalid", msg ? "true" : "false");
      return !msg;
    }

    var inputs = Array.prototype.slice.call(form.querySelectorAll("input, textarea"));
    inputs.forEach(function(input){
      input.addEventListener("blur", function(){ validate(input); });
      input.addEventListener("input", function(){
        if (input.getAttribute("aria-invalid") === "true") validate(input);
      });
    });

    form.addEventListener("submit", function(e){
      e.preventDefault();
      var firstBad = null;
      inputs.forEach(function(input){ if (!validate(input) && !firstBad) firstBad = input; });
      if (firstBad) {
        firstBad.focus();
        if (status) status.textContent = "Check the highlighted fields and try again.";
        return;
      }
      if (status) {
        status.textContent = "This form isn't connected to a mailbox yet, so nothing was sent. "
          + "Email us directly in the meantime — see the details on the left.";
        status.focus();
      }
    });
  });
})();
