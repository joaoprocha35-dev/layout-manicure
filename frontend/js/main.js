/* =========================================================
   Vilma Delmiro — interações e animações
   GSAP + ScrollTrigger + ScrollSmoother + SplitText + Flip
   Respeita prefers-reduced-motion (sem animações, tudo visível).
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var animate = hasGsap && !reduce;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var nav = $('[data-nav]');
  var smoother = null;

  window.VD = window.VD || {};

  var year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  if (hasGsap) {
    root.classList.add('has-gsap');
    gsap.registerPlugin(ScrollTrigger);
    if (window.SplitText) gsap.registerPlugin(SplitText);
    if (window.Flip) gsap.registerPlugin(Flip);
  }

  function navOffset() { return window.innerWidth >= 1200 ? 130 : 96; }

  /* ---------------- rolagem suave ---------------- */
  if (animate && window.ScrollSmoother) {
    gsap.registerPlugin(ScrollSmoother);
    smoother = ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: 1.15,
      smoothTouch: false,
      effects: false,
      onFocusIn: function (self, e) {
        return !(e.target.hasAttribute && e.target.hasAttribute('data-focus-noscroll'));
      }
    });
  }
  window.VD.smoother = smoother;

  function scrollToTarget(target, offset) {
    var isTop = target && target.id === 'topo';
    offset = offset == null ? navOffset() : offset;
    if (smoother) {
      smoother.scrollTo(isTop ? 0 : target, true, 'top ' + offset + 'px');
    } else {
      var y = isTop ? 0 : target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    }
  }
  window.VD.scrollTo = scrollToTarget;

  /* =========================================================
     1. TELA DE ABERTURA
     ========================================================= */
  var heroStarted = false;
  function startHero() {
    if (heroStarted) return;
    heroStarted = true;
    root.classList.remove('preload-anim');
    if (animate) heroIntro();
  }

  (function loaderIntro() {
    var loader = $('[data-loader]');
    if (!loader || !root.classList.contains('is-loading')) { startHero(); return; }
    try { sessionStorage.setItem('vd.intro', '1'); } catch (e) {}

    if (!animate) { root.classList.remove('is-loading'); startHero(); return; }

    loader.style.animation = 'none';     // desliga o failsafe de CSS: o GSAP assume
    var panel = $('[data-loader-panel]');
    var center = $('.loader__center', loader);
    var ring = $('[data-loader-ring]');
    var ring2 = $('[data-loader-ring2]');
    var letters = $$('[data-loader-letter]');
    var spark = $('[data-loader-spark]');
    var name = $('[data-loader-name]');
    var role = $('[data-loader-role]');
    var tag = $('[data-loader-tag]');
    var bar = $('[data-loader-bar]');
    var edge = $('[data-loader-edge]');

    var chars = [name];
    if (window.SplitText) chars = new SplitText(name, { type: 'chars' }).chars;

    gsap.set(ring, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(letters, { strokeDasharray: 240, strokeDashoffset: 240, fillOpacity: 0 });
    gsap.set(role, { '--rl': 0 });

    var intro = gsap.timeline({ defaults: { ease: 'power3.out' } })
      .to(bar, { scaleX: .82, duration: 2.4, ease: 'power1.inOut' }, 0)
      .to(ring, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' }, 0)
      .from(ring2, { rotation: -120, opacity: 0, transformOrigin: '50% 50%', duration: 1.8, ease: 'power2.out' }, .1)
      .to(letters, { strokeDashoffset: 0, duration: 1.2, stagger: .18, ease: 'power2.inOut' }, .2)
      .to(letters, { fillOpacity: 1, duration: .7, stagger: .12, ease: 'power1.out' }, 1.05)
      .fromTo(spark, { scale: 0, rotation: -120, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: .8, ease: 'back.out(3)' }, 1.25)
      .from(chars, { yPercent: 120, opacity: 0, duration: .8, stagger: .035 }, .95)
      .fromTo(role, { opacity: 0, letterSpacing: '.9em' }, { opacity: 1, letterSpacing: '.5em', '--rl': 1, duration: 1 }, 1.35)
      .from(tag, { y: 12, opacity: 0, duration: .7 }, 1.7);

    // brilho do sparkle "respirando" enquanto espera
    gsap.to(spark, { scale: 1.15, rotation: 45, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2.1 });

    var minTime = new Promise(function (r) { setTimeout(r, 2500); });
    var loaded = new Promise(function (r) {
      if (document.readyState === 'complete') r();
      else window.addEventListener('load', r, { once: true });
      setTimeout(r, 4200);                 // nunca segura a cliente por muito tempo
    });

    Promise.all([minTime, loaded]).then(function () {
      intro.progress(1);
      gsap.killTweensOf(spark);
      gsap.timeline({
        defaults: { ease: 'power3.inOut' },
        onComplete: function () {
          root.classList.remove('is-loading');
          loader.style.display = 'none';
          ScrollTrigger.refresh();
        }
      })
        .to(bar, { scaleX: 1, duration: .35, ease: 'power2.out' }, 0)
        .to(center, { y: -40, autoAlpha: 0, duration: .7, ease: 'power2.in' }, .15)
        .to('.loader__bar', { autoAlpha: 0, duration: .3 }, .2)
        .to(panel, { yPercent: -100, duration: 1.15 }, .55)
        .to(edge, { attr: { d: 'M0 0H1440V0C1080 150 360 150 0 0Z' }, duration: .6, ease: 'power2.in' }, .55)
        .to(edge, { attr: { d: 'M0 0H1440V0C1080 0 360 0 0 0Z' }, duration: .6, ease: 'power2.out' }, 1.15)
        .add(startHero, .85);
    });
  })();

  /* =========================================================
     2. HERO — entrada em cascata
     ========================================================= */
  function heroIntro() {
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    var swash = $('[data-swash]');
    if (swash) gsap.set(swash, { strokeDasharray: 1, strokeDashoffset: 1 });

    tl.from('[data-hero-media]', { scale: 1.12, duration: 2.4, ease: 'power2.out' }, 0)
      .from(nav, { y: -50, autoAlpha: 0, duration: 1 }, .15)
      .from('.hero .eyebrow', { x: -24, autoAlpha: 0, duration: .8 }, .3)
      .from('[data-hero-line]', { yPercent: 60, autoAlpha: 0, rotationX: -35, transformOrigin: '0% 100%', duration: 1.1, stagger: .14 }, .4)
      .to(swash, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, 1.05)
      .from('.hero__lead', { y: 26, autoAlpha: 0, duration: .9 }, .8)
      .from('.hero__actions .btn', { y: 22, autoAlpha: 0, duration: .8, stagger: .12 }, .95)
      .from('[data-hero-facts] li', { y: 26, autoAlpha: 0, duration: .8, stagger: .09 }, 1.1)
      .from('[data-hero-facts]', { '--o': 0, autoAlpha: 0, duration: .9 }, 1.0);
  }

  /* =========================================================
     3. NAVBAR — estado ao rolar, item ativo e menu compacto
     ========================================================= */
  function onScroll() {
    var y = smoother ? smoother.scrollTop() : window.scrollY;
    nav.classList.toggle('is-scrolled', y > 24);
  }
  if (smoother) gsap.ticker.add(onScroll);
  else window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var navLinks = $$('[data-nav-link]');
  function setActive(hash) {
    navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === hash); });
  }
  if (hasGsap) {
    ['#topo', '#servicos', '#trabalhos', '#precos', '#duvidas'].forEach(function (hash) {
      var sec = $(hash);
      if (!sec) return;
      ScrollTrigger.create({
        trigger: sec,
        start: 'top 45%',
        end: 'bottom 45%',
        onToggle: function (self) { if (self.isActive) setActive(hash); }
      });
    });
  }

  var toggle = $('[data-nav-toggle]');
  var panel = $('[data-nav-panel]');
  var menuOpen = false;
  function setMenu(open) {
    if (!toggle || !panel || open === menuOpen) return;
    menuOpen = open;
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    if (hasGsap) {
      gsap.killTweensOf(panel);
      if (open) {
        gsap.fromTo(panel, { autoAlpha: 0, y: -12, scale: .98 }, { autoAlpha: 1, y: 0, scale: 1, duration: reduce ? 0 : .45, ease: 'power3.out' });
        if (!reduce) gsap.from($$('li, .nav__panel-foot > *', panel), { y: 14, autoAlpha: 0, duration: .45, stagger: .05, delay: .08, ease: 'power3.out' });
      } else {
        gsap.to(panel, { autoAlpha: 0, y: -8, duration: reduce ? 0 : .3, ease: 'power2.in' });
      }
    } else {
      panel.style.visibility = open ? 'visible' : 'hidden';
      panel.style.opacity = open ? '1' : '0';
    }
  }
  if (toggle) {
    toggle.addEventListener('click', function () { setMenu(!menuOpen); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    document.addEventListener('click', function (e) { if (menuOpen && !nav.contains(e.target)) setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1200) setMenu(false); }, { passive: true });
  }

  /* ---------------- links internos ---------------- */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('[data-scroll-link]');
    if (!link) return;
    var hash = link.getAttribute('href');
    var target = hash && hash.length > 1 ? document.querySelector(hash) : null;
    if (!target) return;
    e.preventDefault();
    setMenu(false);
    target.setAttribute('tabindex', '-1');
    target.setAttribute('data-focus-noscroll', '');
    target.focus({ preventScroll: true });
    scrollToTarget(target);
    if (history.replaceState) history.replaceState(null, '', hash);
  });

  /* =========================================================
     4. FAIXA PRETA — loop contínuo, desacelera no hover
     ========================================================= */
  (function ticker() {
    var track = $('[data-ticker]');
    if (!track || !hasGsap) return;
    if (reduce) { track.style.animation = 'none'; return; }
    var tw = gsap.to(track, { xPercent: -50, duration: 38, ease: 'none', repeat: -1 });
    var band = track.parentElement;
    if (fine) {
      band.addEventListener('mouseenter', function () { gsap.to(tw, { timeScale: .25, duration: .8, ease: 'power2.out' }); });
      band.addEventListener('mouseleave', function () { gsap.to(tw, { timeScale: 1, duration: .8, ease: 'power2.out' }); });
    }
    // pausa fora da tela (economiza bateria no celular)
    ScrollTrigger.create({ trigger: band, start: 'top bottom', end: 'bottom top', onToggle: function (s) { s.isActive ? tw.play() : tw.pause(); } });
  })();

  /* =========================================================
     5. ANIMAÇÕES DE ROLAGEM
     ========================================================= */
  if (animate) {
    // parallax suave do vídeo
    gsap.to('[data-hero-media]', {
      yPercent: 10, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });

    // Títulos: palavras sobem em cascata
    $$('[data-split]').forEach(function (title) {
      var targets = [title];
      if (window.SplitText) targets = new SplitText(title, { type: 'words' }).words;
      gsap.from(targets, {
        yPercent: 70, autoAlpha: 0, rotation: 2, duration: 1, ease: 'power3.out', stagger: .055,
        scrollTrigger: { trigger: title, start: 'top 86%', once: true }
      });
    });

    $$('[data-reveal]').forEach(function (el) {
      gsap.from(el, {
        y: 30, autoAlpha: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      });
    });

    // Cards: sobem com leve escala, em cascata
    gsap.set('[data-card]', { y: 50, autoAlpha: 0 });
    ScrollTrigger.batch('[data-card]', {
      start: 'top 92%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, { y: 0, autoAlpha: 1, duration: 1, ease: 'power3.out', stagger: .1, overwrite: true, clearProps: 'transform' });
      }
    });

    // Painel de preços visível
    var panels = $('[data-price-panels]');
    if (panels) {
      var firstItems = $$('[data-panel]:not([hidden]) .pcard, [data-panel]:not([hidden]) .extra', panels);
      gsap.set(firstItems, { y: 50, autoAlpha: 0 });
      ScrollTrigger.create({
        trigger: panels, start: 'top 88%', once: true,
        onEnter: function () {
          gsap.to(firstItems, { y: 0, autoAlpha: 1, duration: 1, ease: 'power3.out', stagger: .08, clearProps: 'transform' });
        }
      });
    }

    // Diferenciais da Vilma
    gsap.from('[data-diff]', {
      x: 50, autoAlpha: 0, duration: 1, ease: 'power3.out', stagger: .14,
      scrollTrigger: { trigger: '.diffs', start: 'top 85%', once: true }
    });

    // Foto da Vilma: revela com recorte arredondado + parallax
    var aboutMedia = $('[data-about-media]');
    if (aboutMedia) {
      gsap.from($('.about__frame', aboutMedia), {
        clipPath: 'inset(100% 0% 0% 0% round 46px 46px 46px 160px)', duration: 1.4, ease: 'power3.inOut',
        scrollTrigger: { trigger: aboutMedia, start: 'top 80%', once: true }
      });
      gsap.from($('.about__outline', aboutMedia), {
        x: 18, y: -18, autoAlpha: 0, duration: 1.4, ease: 'power3.out', delay: .4,
        scrollTrigger: { trigger: aboutMedia, start: 'top 80%', once: true }
      });
      gsap.from($('.about__seal', aboutMedia), {
        scale: .4, rotation: -60, autoAlpha: 0, duration: 1.1, ease: 'back.out(1.8)', delay: .8,
        scrollTrigger: { trigger: aboutMedia, start: 'top 80%', once: true }
      });
      gsap.fromTo($('.about__frame img', aboutMedia), { yPercent: -4, scale: 1.08 }, {
        yPercent: 4, ease: 'none',
        scrollTrigger: { trigger: aboutMedia, start: 'top bottom', end: 'bottom top', scrub: true }
      });
      var ring = $('[data-seal-ring]');
      if (ring) {
        var spin = gsap.to(ring, { rotation: 360, transformOrigin: '50% 50%', duration: 28, ease: 'none', repeat: -1, paused: true });
        ScrollTrigger.create({ trigger: aboutMedia, start: 'top bottom', end: 'bottom top', onToggle: function (s) { s.isActive ? spin.play() : spin.pause(); } });
      }
    }

    // Linhas rosé gold das ondas e ramos botânicos: "desenhados" ao entrar
    $$('[data-draw-line]').forEach(function (p) {
      gsap.fromTo(p, { strokeDasharray: 1, strokeDashoffset: 1 }, {
        strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut',
        scrollTrigger: { trigger: p.closest('svg'), start: 'top 95%', once: true }
      });
    });
    $$('[data-draw]').forEach(function (svg) {
      gsap.fromTo(svg, { strokeDasharray: 1, strokeDashoffset: 1 }, {
        strokeDashoffset: 0, duration: 2.6, ease: 'power2.inOut',
        scrollTrigger: { trigger: svg, start: 'top 90%', once: true }
      });
      gsap.to(svg, {
        yPercent: -14, ease: 'none',
        scrollTrigger: { trigger: svg.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    // Galeria: fotos surgem com recorte
    gsap.set('.shot', { y: 50, autoAlpha: 0 });
    ScrollTrigger.batch('.shot', {
      start: 'top 94%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, { y: 0, autoAlpha: 1, duration: 1, ease: 'power3.out', stagger: .07, overwrite: true, clearProps: 'transform' });
      }
    });

    // CTA: fundo com parallax
    var ctaBg = $('[data-cta-bg]');
    if (ctaBg) {
      gsap.fromTo(ctaBg, { yPercent: -6 }, {
        yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
  }

  /* =========================================================
     6. BOTÕES MAGNÉTICOS (bem sutis, só com mouse)
     ========================================================= */
  if (animate && fine) {
    $$('[data-magnetic]').forEach(function (btn) {
      var xTo = gsap.quickTo(btn, 'x', { duration: .6, ease: 'power3.out' });
      var yTo = gsap.quickTo(btn, 'y', { duration: .6, ease: 'power3.out' });
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * .14);
        yTo((e.clientY - (r.top + r.height / 2)) * .22 - 2);
      });
      btn.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
    });
  }

  /* =========================================================
     7. GALERIA — filtros (GSAP Flip) + lightbox
     ========================================================= */
  (function gallery() {
    var grid = $('[data-gallery]');
    if (!grid) return;
    var shots = $$('.shot', grid);
    var buttons = $$('[data-filter]');

    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        var cat = b.getAttribute('data-filter');
        buttons.forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        var state = (animate && window.Flip) ? Flip.getState(shots) : null;
        shots.forEach(function (s) {
          var show = cat === 'todos' || s.getAttribute('data-cat').split(' ').indexOf(cat) > -1;
          s.classList.toggle('is-out', !show);
          if (show) { s.style.opacity = ''; s.style.visibility = ''; }
        });
        if (state) {
          Flip.from(state, {
            duration: .7, ease: 'power3.inOut', scale: true, absolute: true, nested: true,
            onEnter: function (els) { return gsap.fromTo(els, { autoAlpha: 0, scale: .85 }, { autoAlpha: 1, scale: 1, duration: .6, ease: 'power3.out' }); },
            onLeave: function (els) { return gsap.to(els, { autoAlpha: 0, scale: .85, duration: .4, ease: 'power2.in' }); },
            onComplete: function () { ScrollTrigger.refresh(); }
          });
        } else if (hasGsap) {
          ScrollTrigger.refresh();
        }
      });
    });

    // Lightbox
    var box = $('[data-lightbox]');
    if (!box) return;
    var img = $('[data-lightbox-img]', box);
    var cap = $('[data-lightbox-cap]', box);
    var list = [];
    var idx = 0;

    function show(i, dir) {
      idx = (i + list.length) % list.length;
      var shot = list[idx];
      var thumb = $('img', shot);
      function swap() {
        img.src = thumb.getAttribute('data-full') || thumb.src;
        img.alt = thumb.alt;
        cap.textContent = $('figcaption', shot).textContent;
      }
      if (animate && dir) {
        gsap.to(img, {
          x: -30 * dir, autoAlpha: 0, duration: .22, ease: 'power2.in',
          onComplete: function () { swap(); gsap.fromTo(img, { x: 30 * dir, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: .4, ease: 'power3.out' }); }
        });
      } else swap();
    }
    function open(shot) {
      list = shots.filter(function (s) { return !s.classList.contains('is-out'); });
      box.showModal();
      if (smoother) smoother.paused(true);
      show(list.indexOf(shot));
      if (animate) gsap.fromTo(box, { autoAlpha: 0, scale: .96 }, { autoAlpha: 1, scale: 1, duration: .45, ease: 'power3.out' });
    }
    function close() { box.close(); }
    box.addEventListener('close', function () { if (smoother) smoother.paused(false); });

    grid.addEventListener('click', function (e) {
      var b = e.target.closest('.shot button');
      if (b) open(b.closest('.shot'));
    });
    $('[data-lightbox-prev]', box).addEventListener('click', function () { show(idx - 1, -1); });
    $('[data-lightbox-next]', box).addEventListener('click', function () { show(idx + 1, 1); });
    $('[data-lightbox-close]', box).addEventListener('click', close);
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') show(idx + 1, 1);
      if (e.key === 'ArrowLeft') show(idx - 1, -1);
    });
  })();

  /* =========================================================
     8. FAQ com abertura suave
     ========================================================= */
  $$('.qa').forEach(function (item) {
    var summary = $('summary', item);
    var answer = $('.qa__answer', item);
    summary.addEventListener('click', function (e) {
      if (!animate) return; // comportamento nativo
      e.preventDefault();
      if (item.open) {
        gsap.to(answer, {
          height: 0, autoAlpha: 0, duration: .4, ease: 'power2.inOut',
          onComplete: function () { item.open = false; gsap.set(answer, { clearProps: 'height,opacity,visibility' }); ScrollTrigger.refresh(); }
        });
      } else {
        item.open = true;
        gsap.fromTo(answer, { height: 0, autoAlpha: 0 }, {
          height: 'auto', autoAlpha: 1, duration: .5, ease: 'power3.out',
          onComplete: function () { gsap.set(answer, { clearProps: 'height' }); ScrollTrigger.refresh(); }
        });
      }
    });
  });

  /* =========================================================
     9. VÍDEO DA HERO
     ========================================================= */
  (function heroVideo() {
    var video = $('[data-hero-video]');
    if (!video) return;
    if (reduce) {
      video.removeAttribute('autoplay');
      video.addEventListener('loadeddata', function () { try { video.pause(); } catch (e) {} });
      return;
    }
    function tryPlay() {
      var p = video.play();
      if (p && typeof p.catch === 'function') p.catch(function () {});
    }
    if (video.readyState >= 2) tryPlay();
    video.addEventListener('canplay', tryPlay, { once: true });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) tryPlay(); });
    video.addEventListener('error', function () { video.style.display = 'none'; });
  })();

  /* =========================================================
     10. CURSOR PERSONALIZADO (só desktop)
     ========================================================= */
  (function customCursor() {
    var dot = $('[data-cursor]');
    if (!dot || !animate || !fine) return;
    root.classList.add('has-cursor');
    gsap.set(dot, { xPercent: -50, yPercent: -50 });
    var xTo = gsap.quickTo(dot, 'x', { duration: .18, ease: 'power3.out' });
    var yTo = gsap.quickTo(dot, 'y', { duration: .18, ease: 'power3.out' });
    window.addEventListener('mousemove', function (e) { xTo(e.clientX); yTo(e.clientY); }, { passive: true });
    var interactive = 'a, button, [data-booking], .btn, summary, label, input, select, textarea, [role="button"], [role="tab"], .proc, .cal__day, .slot';
    document.addEventListener('mouseover', function (e) { if (e.target.closest && e.target.closest(interactive)) dot.classList.add('is-active'); });
    document.addEventListener('mouseout', function (e) { if (e.target.closest && e.target.closest(interactive)) dot.classList.remove('is-active'); });
    document.addEventListener('mouseleave', function () { dot.style.opacity = '0'; });
    document.addEventListener('mouseenter', function () { dot.style.opacity = ''; });
  })();
})();
