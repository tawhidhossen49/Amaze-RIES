(function(){
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Footer year */
  document.querySelectorAll("[data-year]").forEach(function(el){
    el.textContent = new Date().getFullYear();
  });

  /* ---------------------------------------------------------
     Header: condense + shadow once the page has scrolled
  --------------------------------------------------------- */
  var header = document.querySelector(".site-header");
  function onScroll(){
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, {passive:true});
  onScroll();

  /* Mobile nav toggle */
  var toggle = document.querySelector(".nav-toggle");
  var mobileNav = document.querySelector(".nav-mobile");
  function closeMobileNav(){
    if (!mobileNav) return;
    mobileNav.classList.remove("is-open");
    if (toggle) { toggle.classList.remove("is-active"); toggle.setAttribute("aria-expanded","false"); }
    document.body.style.overflow = "";
  }
  if (toggle && mobileNav) {
    toggle.addEventListener("click", function(){
      var isOpen = mobileNav.classList.toggle("is-open");
      toggle.classList.toggle("is-active", isOpen);
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      document.body.style.overflow = isOpen ? "hidden" : "";
    });
  }

  /* Mobile nav accordions */
  document.querySelectorAll(".nav-mobile-link[data-toggle]").forEach(function(link){
    link.addEventListener("click", function(e){
      e.preventDefault();
      var panel = document.getElementById(link.getAttribute("data-toggle"));
      var isOpen = panel.classList.toggle("is-open");
      link.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  });

  /* Close mobile nav when a real link inside it is followed */
  document.querySelectorAll(".nav-mobile a:not([data-toggle])").forEach(function(link){
    link.addEventListener("click", closeMobileNav);
  });

  /* Escape key closes mobile nav */
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape" && mobileNav && mobileNav.classList.contains("is-open")) {
      closeMobileNav();
      if (toggle) toggle.focus();
    }
  });

  /* ---------------------------------------------------------
     Count-up for stat numbers, e.g. "120" -> counts 0 -> 120.
     Leaves any trailing markup (like a placeholder tag) intact.
  --------------------------------------------------------- */
  function primeCountUp(el){
    var node = el.firstChild;
    if (!node || node.nodeType !== 3) return null;
    var m = node.textContent.match(/(\d[\d,]*)/);
    if (!m) return null;
    var target = parseInt(m[1].replace(/,/g, ""), 10);
    if (!isFinite(target)) return null;
    var prefix = node.textContent.slice(0, m.index);
    var suffix = node.textContent.slice(m.index + m[1].length);
    node.textContent = prefix + "0" + suffix;
    return {node: node, prefix: prefix, suffix: suffix, target: target};
  }
  function runCountUp(spec){
    if (!spec) return;
    if (reduceMotion) { spec.node.textContent = spec.prefix + spec.target + spec.suffix; return; }
    var start = null, dur = 1200;
    function tick(ts){
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = Math.round(spec.target * eased);
      spec.node.textContent = spec.prefix + val + spec.suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------------------------------------------------------
     Bar-fill charts: capture the authored width, collapse to 0,
     then animate back to it once the chart scrolls into view.
  --------------------------------------------------------- */
  document.querySelectorAll(".bar-fill").forEach(function(bar){
    var target = bar.style.width || getComputedStyle(bar).width;
    bar.dataset.target = target;
    if (!reduceMotion) bar.style.width = "0%";
  });
  function runBars(container){
    var bars = container.querySelectorAll ? container.querySelectorAll(".bar-fill") : [];
    bars.forEach(function(bar, i){
      if (reduceMotion) { bar.style.width = bar.dataset.target || bar.style.width; return; }
      setTimeout(function(){ bar.style.width = bar.dataset.target; }, i * 90);
    });
  }

  /* ---------------------------------------------------------
     Scroll reveal — sections and cards rise into place.
     Grouped by shared parent so grids/lists cascade in.
  --------------------------------------------------------- */
  var itemSelector = [
    ".card", ".pub-entry", ".project-card", ".article-card", ".stat-card",
    ".chart-block", ".people-card", ".event-card", ".value-item",
    ".step-item", ".criteria-item", ".contact-item"
  ].join(",");
  var soloSelector = ".section-head, .pull-quote";
  var textSelector = ".section-title, .eyebrow, .lede";

  var revealTargets = [];
  function markReveal(el, delayMs){
    if (!el || el.classList.contains("reveal")) return;
    el.classList.add("reveal");
    if (delayMs) el.style.transitionDelay = delayMs + "ms";
    revealTargets.push(el);
  }

  /* 1 — item groups, staggered by shared immediate parent */
  var parents = new Map();
  document.querySelectorAll(itemSelector).forEach(function(el){
    var p = el.parentElement;
    if (!parents.has(p)) parents.set(p, 0);
    var i = parents.get(p);
    parents.set(p, i + 1);
    markReveal(el, Math.min(i, 5) * 70);
  });

  /* 2 — solo section intros / pull quotes */
  document.querySelectorAll(soloSelector).forEach(function(el){ markReveal(el, 0); });

  /* 3 — loose eyebrow / heading / lede not already inside a hero or section-head */
  document.querySelectorAll(textSelector).forEach(function(el){
    if (el.closest(".hero") || el.closest(".page-hero") || el.closest(".section-head")) return;
    if (el.closest(itemSelector)) return;
    var step = el.classList.contains("eyebrow") ? 0 : el.classList.contains("section-title") ? 1 : 2;
    markReveal(el, step * 80);
  });

  /* 4 — catch-all: a section with none of the above just lifts as one block */
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
        if (entry.isIntersecting) {
          handleReveal(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, {threshold: 0.14, rootMargin: "0px 0px -6% 0px"});
    revealTargets.forEach(function(el){ io.observe(el); });
  } else {
    revealTargets.forEach(handleReveal);
  }

  /* ---------------------------------------------------------
     Tab panels (Community > Events, etc.)
     Reveals any not-yet-revealed content the instant a panel
     is switched to, since that's a deliberate user action
     rather than a scroll trigger.
  --------------------------------------------------------- */
  document.querySelectorAll("[data-tabs]").forEach(function(group){
    var tabs = group.querySelectorAll(".tab-btn");
    tabs.forEach(function(tab){
      tab.addEventListener("click", function(){
        tabs.forEach(function(t){ t.setAttribute("aria-selected","false"); });
        tab.setAttribute("aria-selected","true");
        group.querySelectorAll(".tab-panel").forEach(function(p){ p.classList.remove("is-active"); });
        var panel = document.getElementById(tab.getAttribute("aria-controls"));
        panel.classList.add("is-active");
        panel.querySelectorAll(".reveal:not(.reveal-visible)").forEach(function(el){
          if (io) io.unobserve(el);
          handleReveal(el);
        });
      });
    });
  });
})();
