(function(){
  "use strict";

  /* Footer year */
  document.querySelectorAll("[data-year]").forEach(function(el){
    el.textContent = new Date().getFullYear();
  });

  /* Mobile nav toggle */
  var toggle = document.querySelector(".nav-toggle");
  var mobileNav = document.querySelector(".nav-mobile");
  if (toggle && mobileNav) {
    toggle.addEventListener("click", function(){
      var isOpen = mobileNav.classList.toggle("is-open");
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
    link.addEventListener("click", function(){
      mobileNav.classList.remove("is-open");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  });

  /* Generic tab panels (used on Community > Events) */
  document.querySelectorAll("[data-tabs]").forEach(function(group){
    var tabs = group.querySelectorAll(".tab-btn");
    tabs.forEach(function(tab){
      tab.addEventListener("click", function(){
        tabs.forEach(function(t){ t.setAttribute("aria-selected","false"); });
        tab.setAttribute("aria-selected","true");
        var target = group.querySelectorAll(".tab-panel");
        target.forEach(function(p){ p.classList.remove("is-active"); });
        document.getElementById(tab.getAttribute("aria-controls")).classList.add("is-active");
      });
    });
  });

  /* Escape key closes mobile nav */
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape" && mobileNav && mobileNav.classList.contains("is-open")) {
      mobileNav.classList.remove("is-open");
      if (toggle) { toggle.setAttribute("aria-expanded","false"); toggle.focus(); }
      document.body.style.overflow = "";
    }
  });
})();
