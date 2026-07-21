// RIES — shared interactivity

document.addEventListener('DOMContentLoaded', () => {

  /* ---- nav scroll state ---- */
  const nav = document.querySelector('.site-nav');
  let lastScrollY = window.scrollY;
  
  // The nav is visible immediately on every page now (matches the hero
  // reference); pages whose hero sits on a dark section also start with
  // the dark nav background rather than waiting for the scrolled state.
  const currentPage = document.body.dataset.page;
  const blackBgPages = ['about', 'projects', 'community', 'contact'];
  const isBlackBgPage = blackBgPages.includes(currentPage);

  if (nav){
    nav.classList.add('visible');
    if (isBlackBgPage) nav.classList.add('black-bg');
  }

  const onScroll = () => {
    if (!nav) return;
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
    lastScrollY = window.scrollY;
  };
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();

  /* ---- mobile menu ---- */
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.mobile-menu');
  if (toggle && menu){
    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      document.body.style.overflow = isOpen ? 'hidden' : '';
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      menu.classList.remove('open');
      document.body.style.overflow = '';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
    }));
    // Escape closes the menu and returns focus to the toggle button
    menu.addEventListener('keydown', (e) => {
      if (e.key === 'Escape'){
        menu.classList.remove('open');
        document.body.style.overflow = '';
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
        toggle.focus();
      }
    });
  }

  /* ---- scroll reveal ---- */
  const revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
  if ('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* ---- counting stats ---- */
  const counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && counters.length){
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          const el = entry.target;
          const target = el.getAttribute('data-count');
          const numMatch = target.match(/[\d.]+/);
          if (numMatch){
            const num = parseFloat(numMatch[0]);
            const suffix = target.replace(numMatch[0], '');
            const prefix = target.slice(0, target.indexOf(numMatch[0]));
            let start = 0;
            const duration = 900;
            const startTime = performance.now();
            const step = (now) => {
              const progress = Math.min((now - startTime) / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              const current = Math.floor(eased * num);
              el.textContent = prefix + current + suffix.replace(/^[\d.]*/, '');
              if (progress < 1) requestAnimationFrame(step);
              else el.textContent = target;
            };
            requestAnimationFrame(step);
          }
          cio.unobserve(el);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(el => cio.observe(el));
  }

  /* ---- accordion (FAQ) ---- */
  document.querySelectorAll('.accordion-item').forEach(item => {
    const head = item.querySelector('.accordion-head');
    head && head.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      item.closest('.accordion-list')?.querySelectorAll('.accordion-item').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.accordion-head')?.setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen){
        item.classList.add('open');
        head.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---- event rows (community) ---- */
  document.querySelectorAll('.event-row').forEach(row => {
    const head = row.querySelector('.event-head');
    head && head.addEventListener('click', () => {
      const isOpen = row.classList.toggle('open');
      head.setAttribute('aria-expanded', String(isOpen));
    });
  });

  /* ---- toggle (projects: ongoing/completed) ---- */
  const toggleBtns = document.querySelectorAll('.toggle button');
  if (toggleBtns.length){
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        toggleBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        const mode = btn.getAttribute('data-mode');
        document.querySelectorAll('.mode-panel').forEach(p => {
          p.classList.toggle('active', p.getAttribute('data-panel') === mode);
        });
        const modeSection = document.querySelector('.mode-bg-target');
        if (modeSection){
          modeSection.classList.remove('bg-ink','bg-parchment');
          modeSection.classList.add(mode === 'ongoing' ? 'bg-ink' : 'bg-parchment');
        }
      });
    });
  }

  /* ---- filter bar (research index) ---- */
  const chips = document.querySelectorAll('.filter-chip');
  const rows = document.querySelectorAll('.index-row[data-discipline]');
  if (chips.length && rows.length){
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const group = chip.getAttribute('data-group');
        document.querySelectorAll(`.filter-chip[data-group="${group}"]`).forEach(c => {
          c.classList.remove('active');
          c.setAttribute('aria-pressed', 'false');
        });
        chip.classList.add('active');
        chip.setAttribute('aria-pressed', 'true');
        applyFilters();
      });
    });
    function applyFilters(){
      const activeDiscipline = document.querySelector('.filter-chip[data-group="discipline"].active')?.getAttribute('data-value');
      const activeStatus = document.querySelector('.filter-chip[data-group="status"].active')?.getAttribute('data-value');
      rows.forEach(row => {
        const matchDiscipline = activeDiscipline === 'all' || row.getAttribute('data-discipline') === activeDiscipline;
        const matchStatus = activeStatus === 'all' || row.getAttribute('data-status') === activeStatus;
        row.style.display = (matchDiscipline && matchStatus) ? '' : 'none';
      });
    }
  }

  /* ---- intro curtain (logo load sequence, once per session) ----
     The inline script right after #introCurtain in <body> already hid it
     synchronously (no flash) if this session already saw it. If it's still
     visible here, this is a first load this session: play the draw/hold/
     wipe sequence, then remove it and record that it played. */
  const introCurtain = document.getElementById('introCurtain');
  if (introCurtain && introCurtain.style.display !== 'none'){
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion){
      introCurtain.remove();
    } else {
      document.body.classList.add('intro-lock');
      requestAnimationFrame(() => introCurtain.classList.add('draw'));
      setTimeout(() => introCurtain.classList.add('wipe'), 520);
      setTimeout(() => {
        introCurtain.remove();
        document.body.classList.remove('intro-lock');
      }, 940);
    }
    sessionStorage.setItem('ariseIntroPlayed', '1');
  }

  /* ---- philosophy pin (word-by-word scroll reveal, homepage only) ----
     Progressive enhancement: the section is fully readable, in normal
     flow, with every word already visible if this code never runs (no
     JS, no IntersectionObserver, or reduced-motion). Only once all of
     that is confirmed do we opt into the tall/sticky treatment. */
  const philoSection = document.getElementById('philosophyPin');
  if (philoSection && 'IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    philoSection.classList.add('pin-active');
    const words = philoSection.querySelectorAll('.pw');
    const counterEl = philoSection.querySelector('.pc-current');
    let ticking = false;

    function updateProgress(){
      ticking = false;
      const rect = philoSection.getBoundingClientRect();
      const total = philoSection.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const progress = scrolled / total;
      const activeCount = Math.round(progress * words.length);
      words.forEach((w, i) => w.classList.toggle('active', i < activeCount));
      if (counterEl){
        const lastActive = words[Math.max(activeCount - 1, 0)];
        const stage = lastActive ? lastActive.dataset.stage : '1';
        counterEl.textContent = '0' + stage;
      }
    }
    window.addEventListener('scroll', () => {
      if (!ticking){ ticking = true; requestAnimationFrame(updateProgress); }
    }, { passive: true });
    updateProgress();
  }

  /* ---- simple form intercepts (static demo) ---- */
  document.querySelectorAll('form[data-demo]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      if (btn){
        const original = btn.textContent;
        btn.textContent = 'Sent';
        setTimeout(() => { btn.textContent = original; form.reset(); }, 2200);
      }
    });
  });

});
