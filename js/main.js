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
        smooth: 1.1,          // rolagem suave no mouse / trackpad
        smoothTouch: false,   // toque continua nativo no celular
        effects: false,
        onFocusIn: function (self, e) {
          return !(e.target.hasAttribute && e.target.hasAttribute('data-focus-noscroll'));
        }
      });
      window.VD.smoother = smoother;
    }

    // Hero: entrada do texto e da foto
    // (a classe sai antes do .from(), que usa o estado atual como valor final;
    //  tudo roda no mesmo frame, então não há piscada)
    root.classList.remove('preload-anim');
    var heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTl
      .from('.hero__img', { scale: 1.08, duration: 1.8, ease: 'power2.out' }, 0)
      .from('[data-hero-item]', { y: 32, autoAlpha: 0, duration: 1.05, stagger: .11 }, .15);

    // Hero: parallax leve da foto
    gsap.to('.hero__img', {
      yPercent: 7,
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

    // Cartões (serviços e depoimentos)
    gsap.set('[data-card]', { y: 40, autoAlpha: 0 });
    ScrollTrigger.batch('[data-card]', {
      start: 'top 90%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, { y: 0, autoAlpha: 1, duration: .9, ease: 'power3.out', stagger: .1, overwrite: true });
      }
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

    // Recalcula posições quando as fontes terminam de carregar
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
  } else {
    root.classList.remove('preload-anim');
  }

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
