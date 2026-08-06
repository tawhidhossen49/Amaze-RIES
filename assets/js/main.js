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
  /* The condensed header shrinks the mark, so its final height isn't
     known until the logo has loaded. */
  window.addEventListener("load", setHeaderHeightVar);
  setHeaderHeightVar();
  onScroll();

  /* ---------------------------------------------------------
     Mobile navigation
  --------------------------------------------------------- */
  var toggle = document.querySelector(".nav-toggle");
  var mobileNav = document.querySelector(".nav-mobile");
  /* Locking the body with `overflow:hidden` alone lets iOS keep the
     page scrolled underneath, so the drawer is pinned in place and
     the offset is restored on close. */
  var scrollLockY = 0;

  function lockScroll(on){
    var b = document.body;
    if (on) {
      scrollLockY = window.scrollY || window.pageYOffset || 0;
      b.style.position = "fixed";
      b.style.top = -scrollLockY + "px";
      b.style.left = "0";
      b.style.right = "0";
      b.style.width = "100%";
      b.style.overflow = "hidden";
    } else {
      b.style.position = "";
      b.style.top = "";
      b.style.left = "";
      b.style.right = "";
      b.style.width = "";
      b.style.overflow = "";
      window.scrollTo(0, scrollLockY);
    }
  }

  function setMobileNav(open){
    if (!mobileNav || !toggle) return;
    if (open) setHeaderHeightVar();
    mobileNav.classList.toggle("is-open", open);
    toggle.classList.toggle("is-active", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    lockScroll(open);
  }
  function closeMobileNav(){
    if (mobileNav && mobileNav.classList.contains("is-open")) setMobileNav(false);
  }

  if (toggle && mobileNav) {
    toggle.setAttribute("aria-controls", "mobile-nav");
    mobileNav.id = mobileNav.id || "mobile-nav";
    toggle.addEventListener("click", function(){
      setMobileNav(!mobileNav.classList.contains("is-open"));
    });
  }

  /* A width change can strand the menu open behind a desktop layout.
     Keep in step with the `max-width:1040px` nav breakpoint in main.css. */
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
     Scroll progress — a hairline under the header tracking
     position through the document.
  --------------------------------------------------------- */
  (function scrollProgress(){
    if (!header) return;
    var bar = document.createElement("div");
    bar.className = "scroll-progress";
    header.appendChild(bar);

    var max = 0;
    function measure(){
      max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    }
    var update = rafThrottle(function(){
      var p = Math.min(1, Math.max(0, window.scrollY / max));
      bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
    });
    measure();
    update();
    window.addEventListener("scroll", update, {passive:true});
    window.addEventListener("resize", rafThrottle(function(){ measure(); update(); }));
    window.addEventListener("load", function(){ measure(); update(); });
  })();

  /* ---------------------------------------------------------
     Headline word stagger.

     Each word is wrapped in a mask so it can rise into place.
     Only applied to headings that opt in with `data-split`, and
     only to plain text nodes — any inline markup inside the
     heading is left exactly as authored.
  --------------------------------------------------------- */
  (function splitHeadings(){
    if (reduceMotion) return;
    var WORD_MS = 55;
    document.querySelectorAll("[data-split]").forEach(function(el){
      var delay = parseFloat(el.getAttribute("data-split-delay")) || 0;
      var i = 0;
      var nodes = Array.prototype.slice.call(el.childNodes);

      nodes.forEach(function(node){
        if (node.nodeType !== 3) return;              /* leave <br>, <em>, … alone */
        if (!node.textContent.trim()) return;
        var frag = document.createDocumentFragment();
        /* keep the whitespace runs so words don't collide when the
           spans are laid back out inline */
        node.textContent.split(/(\s+)/).forEach(function(chunk){
          if (!chunk) return;
          if (!chunk.trim()) { frag.appendChild(document.createTextNode(chunk)); return; }
          var outer = document.createElement("span");
          outer.className = "split-word";
          var inner = document.createElement("i");
          inner.textContent = chunk;
          inner.style.animationDelay = (delay + i * WORD_MS) + "ms";
          i++;
          outer.appendChild(inner);
          frag.appendChild(outer);
        });
        el.replaceChild(frag, node);
      });

      if (i) el.classList.add("is-split");
    });
  })();

  /* ---------------------------------------------------------
     Hero parallax — the backing photograph drifts slower than
     the page. Skipped on narrow screens, where the moving
     mobile URL bar makes the offset jitter rather than glide.
  --------------------------------------------------------- */
  (function heroParallax(){
    var media = document.querySelector(".hero-media img, .full-bleed-media img");
    if (!media || reduceMotion) return;
    if (!window.matchMedia || !window.matchMedia("(min-width: 901px)").matches) return;

    var targets = Array.prototype.slice.call(
      document.querySelectorAll(".hero-media img, .full-bleed-media img")
    );
    /* Overscale so the drift never exposes an edge */
    targets.forEach(function(img){ img.style.willChange = "transform"; });

    var DRIFT = 0.14;
    var update = rafThrottle(function(){
      targets.forEach(function(img){
        var host = img.closest(".hero, .full-bleed");
        if (!host) return;
        var r = host.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        var shift = (r.top * -DRIFT).toFixed(2);
        img.style.transform = "translate3d(0," + shift + "px,0) scale(1.14)";
      });
    });
    targets.forEach(function(img){ img.style.transform = "scale(1.14)"; });
    update();
    window.addEventListener("scroll", update, {passive:true});
    window.addEventListener("resize", update);
  })();

  /* ---------------------------------------------------------
     Count-up for figures. Preserves any prefix/suffix such
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
    /* Whether the author wrote the number grouped. Parsing strips the
       separators, so without this a figure like ~700,000 settles as
       ~700000. */
    var grouped = m[1].indexOf(",") > -1;
    var prefix = node.textContent.slice(0, m.index);
    var suffix = node.textContent.slice(m.index + m[1].length);
    /* Counting 0→2 reads as a glitch, not an effect. Small numbers
       just appear. */
    if (target < 10 && decimals === 0) return null;
    node.textContent = prefix + formatCount(0, decimals, grouped) + suffix;
    return {node:node, prefix:prefix, suffix:suffix, target:target, decimals:decimals, grouped:grouped};
  }
  function formatCount(value, decimals, grouped){
    var s = value.toFixed(decimals);
    if (!grouped) return s;
    var parts = s.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
  function runCountUp(spec){
    if (!spec) return;
    if (reduceMotion) {
      spec.node.textContent = spec.prefix + formatCount(spec.target, spec.decimals, spec.grouped) + spec.suffix;
      return;
    }
    var start = null, dur = 1200;
    function tick(ts){
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      spec.node.textContent = spec.prefix + formatCount(spec.target * eased, spec.decimals, spec.grouped) + spec.suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  /* .bar-value joins the count-up so a chart figure resolves at the same
     time as the bar that represents it. The number arriving with its bar is
     the point: it reads as a measurement settling, not as a counter. */
  var COUNT_SELECTOR = ".stat-num, .sb-num, .hs-num, .bar-value";
  function countWithin(el){
    var nums = el.matches(COUNT_SELECTOR) ? [el] : el.querySelectorAll(COUNT_SELECTOR);
    Array.prototype.forEach.call(nums, function(num){
      if (num.dataset.counted) return;
      num.dataset.counted = "1";
      runCountUp(primeCountUp(num));
    });
  }
  /* The hero is above the fold and never enters the observer, so its
     figures are counted on load instead. */
  document.querySelectorAll(".hero .hero-stats").forEach(function(el){
    setTimeout(function(){ countWithin(el); }, 600);
  });

  /* ---------------------------------------------------------
     Bar charts: capture the authored width, collapse, then grow
     back once the block scrolls into view.
  --------------------------------------------------------- */
  /* The authored value now arrives as `data-value` (a percentage of the
     chart's scale) rather than an inline `style="width:…"`. That is what
     lets the CSP drop 'unsafe-inline' from style-src: setting .style.width
     from script is CSSOM and is not governed by the policy, whereas the
     same declaration written into the markup would be. */
  document.querySelectorAll(".bar-fill").forEach(function(bar){
    bar.dataset.target = (bar.dataset.value || "0") + "%";
    bar.style.width = reduceMotion ? bar.dataset.target : "0%";
  });
  function runBars(container){
    if (!container.querySelectorAll) return;
    container.querySelectorAll(".bar-fill").forEach(function(bar, i){
      if (reduceMotion) { bar.style.width = bar.dataset.target; return; }
      setTimeout(function(){ bar.style.width = bar.dataset.target; }, i * 110);
    });
  }

  /* ---------------------------------------------------------
     Scroll reveal.

     Markup opts in with `data-reveal="up|fade|left|right|scale"`.
     A `data-reveal-group` on a parent stamps the attribute onto
     its children and staggers them, so a grid cascades without
     every cell having to declare a delay by hand.
  --------------------------------------------------------- */
  var STAGGER_MS = 90;
  var STAGGER_CAP = 6; /* past this the last cell waits too long to feel related */

  document.querySelectorAll("[data-reveal-group]").forEach(function(group){
    var kind = group.getAttribute("data-reveal-group") || "up";
    var kids = group.children;
    for (var i = 0; i < kids.length; i++) {
      var kid = kids[i];
      if (kid.hasAttribute("data-reveal")) continue;
      kid.setAttribute("data-reveal", kind);
      kid.style.transitionDelay = (Math.min(i, STAGGER_CAP) * STAGGER_MS) + "ms";
    }
  });

  function handleReveal(el){
    el.classList.add("is-revealed");
    el.classList.add("reveal-visible"); /* legacy hook */
    countWithin(el);
    if (el.classList.contains("chart-block") || el.querySelector(".bar-fill")) runBars(el);
  }

  var revealTargets = Array.prototype.slice.call(
    document.querySelectorAll("[data-reveal], .reveal")
  );

  var io = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (!entry.isIntersecting) return;
        handleReveal(entry.target);
        io.unobserve(entry.target);
      });
    }, {threshold:0, rootMargin:"0px 0px -8% 0px"});
    revealTargets.forEach(function(el){ io.observe(el); });
  } else {
    revealTargets.forEach(handleReveal);
  }

  /* An element that is already on screen at load — or one that was
     never observed because the page is short — must not sit invisible. */
  window.addEventListener("load", function(){
    revealTargets.forEach(function(el){
      if (el.classList.contains("is-revealed")) return;
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        if (io) io.unobserve(el);
        handleReveal(el);
      }
    });
  });

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
      var pending = panel.querySelectorAll("[data-reveal]:not(.is-revealed), .reveal:not(.reveal-visible)");
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

  onMediaChange(motionQuery, function(e){ reduceMotion = e.matches; });
})();
