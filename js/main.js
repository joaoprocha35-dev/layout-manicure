/* =========================================================
   Vilma Delmiro — interações e animações (GSAP + ScrollSmoother)
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var header = document.querySelector('[data-header]');
  var HEADER_H = 72;
  var smoother = null;

  window.VD = { smoother: null };

  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------------- header ao rolar ---------------- */
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------- GSAP ---------------- */
  if (hasGsap && !reduce) {
    gsap.registerPlugin(ScrollTrigger);
    if (window.ScrollSmoother) {
      gsap.registerPlugin(ScrollSmoother);
      smoother = ScrollSmoother.create({
        wrapper: '#smooth-wrapper',
        content: '#smooth-content',
        smooth: 1.3,          // rolagem fluida, porém responsiva
        smoothTouch: false,   // toque continua nativo no celular
        effects: false,
        onFocusIn: function (self, e) {
          return !(e.target.hasAttribute && e.target.hasAttribute('data-focus-noscroll'));
        }
      });
      window.VD.smoother = smoother;
    }

    // Hero: entrada cinematográfica em cascata
    // (a classe sai antes do .from(), que usa o estado atual como valor final;
    //  tudo roda no mesmo frame, então não há piscada)
    root.classList.remove('preload-anim');
    var heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTl
      .from('.hero__bg', { autoAlpha: 0, scale: 1.06, duration: 1.4, ease: 'power2.out' }, 0)
      .from('.hero .eyebrow', { y: 18, autoAlpha: 0, duration: .7 }, .35)
      .from('.hero__title', { x: -50, autoAlpha: 0, duration: .8 }, .45)
      .from('.hero__lead', { y: 24, autoAlpha: 0, duration: .7 }, .75)
      .from('.hero__actions .btn', { y: 20, autoAlpha: 0, duration: .6, stagger: .14 }, .95);

    // Hero: parallax leve do fundo em vídeo
    gsap.to('.hero__bg', {
      yPercent: 8,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });

    // Títulos e blocos
    gsap.utils.toArray('[data-reveal]').forEach(function (el) {
      gsap.from(el, {
        y: 36, autoAlpha: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });

    // Cartões (serviços, preços, produtos, depoimentos): entram da esquerda → direita
    gsap.set('[data-card]', { x: -64, autoAlpha: 0 });
    ScrollTrigger.batch('[data-card]', {
      start: 'top 90%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, { x: 0, autoAlpha: 1, duration: 1, ease: 'power3.out', stagger: .12, overwrite: true });
      }
    });

    // Diferenciais ("Por que a Vilma"): cada item entra em cascata
    gsap.utils.toArray('[data-feature]').forEach(function (f) {
      var items = f.querySelectorAll('.feature__icon, .feature__title, p, li');
      gsap.from(items, {
        y: 22, autoAlpha: 0, duration: .7, ease: 'power3.out', stagger: .07,
        scrollTrigger: { trigger: f, start: 'top 84%', once: true }
      });
    });

    // Galeria: cada foto surge com recorte suave
    gsap.set('.gallery__item figure', { y: 50, autoAlpha: 0, clipPath: 'inset(12% 0 0 0 round 10px)' });
    ScrollTrigger.batch('.gallery__item figure', {
      start: 'top 92%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          y: 0, autoAlpha: 1, clipPath: 'inset(0% 0 0 0 round 10px)',
          duration: 1.1, ease: 'power3.out', stagger: .09, overwrite: true
        });
      }
    });

    // Experiência: parallax da foto + coluna fixa no computador
    var frame = document.querySelector('[data-parallax-frame]');
    var pImg = document.querySelector('[data-parallax-img]');
    if (frame && pImg) {
      gsap.fromTo(pImg, { yPercent: -5 }, {
        yPercent: 5, ease: 'none',
        scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }

    var mm = gsap.matchMedia();
    mm.add('(min-width: 960px)', function () {
      var media = document.querySelector('.experience__media');
      var list = document.querySelector('.experience__list');
      if (!media || !list) return;
      ScrollTrigger.create({
        trigger: media,
        start: 'top ' + (HEADER_H + 32) + 'px',
        end: function () { return '+=' + Math.max(0, list.offsetHeight - media.offsetHeight); },
        pin: true,
        pinSpacing: false
      });
    });

    // CTA: fundo com parallax
    var ctaBg = document.querySelector('[data-cta-bg]');
    if (ctaBg) {
      gsap.fromTo(ctaBg, { yPercent: -6 }, {
        yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }

    // Fita rosa em zigue-zague com as palavras-chave da Vilma.
    // ESTÁTICA: sem desenho progressivo e sem texto em loop. Custo zero por
    // quadro (medido: 12 FPS -> 60 FPS). As palavras aparecem ao rolar a página.
    (function ribbon() {
      var content = document.getElementById('smooth-content');
      var svg = document.querySelector('[data-ribbon]');
      var path = document.querySelector('[data-ribbon-path]');
      var textEl = document.querySelector('[data-ribbon-labels]');
      if (!content || !svg || !path || !textEl) return;

      var NS = 'http://www.w3.org/2000/svg';
      var UNIT = 'Vilma Delmiro ✦ Nail Designer ✦ Fibra de Vidro ✦ +10 anos ✦ Manicure & Pedicure ✦ Nail Art';
      var t = null;

      function criarRotulo(offset) {
        var txt = document.createElementNS(NS, 'text');
        txt.setAttribute('dominant-baseline', 'middle');
        var tpEl = document.createElementNS(NS, 'textPath');
        tpEl.setAttribute('href', '#ribbonPath');
        tpEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#ribbonPath');
        tpEl.setAttribute('startOffset', offset.toFixed(1));
        tpEl.textContent = UNIT;
        txt.appendChild(tpEl);
        return txt;
      }

      function build() {
        var W = content.clientWidth;
        var H = content.offsetHeight;
        if (!W || !H) return;
        svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
        svg.setAttribute('height', H);

        var topY = H * 0.05, botY = H * 0.97, span = botY - topY;
        var segs = Math.max(5, Math.round(H / 760));
        var lx = W * 0.15, rx = W * 0.85, curX = lx;
        var d = 'M ' + lx.toFixed(1) + ' ' + topY.toFixed(1);
        for (var i = 1; i <= segs; i++) {
          var y = topY + span * (i / segs);
          var midY = (topY + span * ((i - 1) / segs) + y) / 2;
          var tx = (i % 2 === 1) ? rx : lx;
          d += ' C ' + curX.toFixed(1) + ' ' + midY.toFixed(1) +
               ' ' + tx.toFixed(1) + ' ' + midY.toFixed(1) +
               ' ' + tx.toFixed(1) + ' ' + y.toFixed(1);
          curX = tx;
        }
        path.setAttribute('d', d);

        // Blocos de palavras-chave espaçados ao longo da fita.
        // Menos glifos = rasterização muito mais barata ao rolar.
        while (textEl.firstChild) textEl.removeChild(textEl.firstChild);
        var total = path.getTotalLength();
        var probe = criarRotulo(0);
        textEl.appendChild(probe);
        var unitLen = (probe.getComputedTextLength && probe.getComputedTextLength()) || 700;
        if (unitLen < 50) unitLen = 700;
        while (textEl.firstChild) textEl.removeChild(textEl.firstChild);
        var passo = unitLen * 2.4;              // bloco + respiro
        for (var off = unitLen * 0.25; off + unitLen < total; off += passo) {
          textEl.appendChild(criarRotulo(off));
        }
      }

      build();
      ScrollTrigger.addEventListener('refreshInit', build);
      window.addEventListener('resize', function () {
        clearTimeout(t);
        t = setTimeout(build, 250);
      }, { passive: true });
    })();

    // Recalcula posições quando as fontes terminam de carregar
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
  } else {
    root.classList.remove('preload-anim');
  }

  /* ---------------- vídeo da hero ---------------- */
  (function heroVideo() {
    var video = document.querySelector('[data-hero-video]');
    if (!video) return;

    // Movimento reduzido: não dá autoplay; mantém o primeiro quadro (poster)
    if (reduce) {
      video.removeAttribute('autoplay');
      video.addEventListener('loadeddata', function () { try { video.pause(); } catch (e) {} });
      return;
    }

    // Se o navegador bloquear o autoplay, o poster/fallback já cobre a área
    function tryPlay() {
      var p = video.play();
      if (p && typeof p.catch === 'function') p.catch(function () { /* fica no poster */ });
    }
    if (video.readyState >= 2) tryPlay();
    video.addEventListener('canplay', tryPlay, { once: true });
    // Retoma ao voltar para a aba
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && !reduce) tryPlay();
    });
    // Se o vídeo falhar, esconde-o e deixa o fallback aparecer
    video.addEventListener('error', function () { video.style.display = 'none'; });
  })();

  /* ---------------- cursor personalizado (só desktop) ---------------- */
  (function customCursor() {
    var dot = document.querySelector('[data-cursor]');
    if (!dot || !hasGsap || reduce) return;
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!fine) return;

    root.classList.add('has-cursor');
    gsap.set(dot, { xPercent: -50, yPercent: -50 });
    var xTo = gsap.quickTo(dot, 'x', { duration: .18, ease: 'power3.out' });
    var yTo = gsap.quickTo(dot, 'y', { duration: .18, ease: 'power3.out' });

    window.addEventListener('mousemove', function (e) {
      xTo(e.clientX);
      yTo(e.clientY);
    }, { passive: true });

    var interactive = 'a, button, [data-booking], .btn, summary, label, input, select, textarea, [role="button"], .proc, .cal__day, .slot';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest && e.target.closest(interactive)) dot.classList.add('is-active');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest && e.target.closest(interactive)) dot.classList.remove('is-active');
    });
    // some ao sair da janela
    document.addEventListener('mouseleave', function () { dot.style.opacity = '0'; });
    document.addEventListener('mouseenter', function () { dot.style.opacity = ''; });
  })();

  /* ---------------- FAQ com abertura suave ---------------- */
  document.querySelectorAll('.faq__item').forEach(function (item) {
    var summary = item.querySelector('summary');
    var answer = item.querySelector('.faq__answer');
    summary.addEventListener('click', function (e) {
      if (!hasGsap || reduce) return; // comportamento nativo
      e.preventDefault();
      if (item.open) {
        gsap.to(answer, {
          height: 0, duration: .35, ease: 'power2.inOut',
          onComplete: function () { item.open = false; gsap.set(answer, { clearProps: 'height' }); ScrollTrigger.refresh(); }
        });
      } else {
        item.open = true;
        gsap.fromTo(answer, { height: 0 }, {
          height: 'auto', duration: .45, ease: 'power2.out',
          onComplete: function () { gsap.set(answer, { clearProps: 'height' }); ScrollTrigger.refresh(); }
        });
      }
    });
  });

  /* ---------------- links internos (Ver trabalhos, menu) ---------------- */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('[data-scroll-link]');
    if (!link) return;
    var hash = link.getAttribute('href');
    var target = hash && hash.length > 1 ? document.querySelector(hash) : null;
    if (!target) return;
    e.preventDefault();

    var isTop = hash === '#topo';
    // Move o foco para a seção (teclado / leitor de tela). O onFocusIn do
    // ScrollSmoother ignora esse foco para não somar uma segunda rolagem.
    target.setAttribute('tabindex', '-1');
    target.setAttribute('data-focus-noscroll', '');
    target.focus({ preventScroll: true });
    if (smoother) {
      smoother.scrollTo(isTop ? 0 : target, true, 'top ' + HEADER_H + 'px');
    } else {
      var y = isTop ? 0 : target.getBoundingClientRect().top + window.scrollY - HEADER_H;
      window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    }
    if (history.replaceState) history.replaceState(null, '', hash);
  });
})();
