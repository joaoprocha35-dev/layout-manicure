/* =========================================================
   Questionário de agendamento → mensagem pronta no WhatsApp
   ========================================================= */
(function () {
  'use strict';

  // TODO: coloque aqui o número da Vilma (DDI + DDD + número, só dígitos)
  var WHATSAPP_NUMBER = '5500000000000';
  var WA_BASE = 'https://wa.me/' + WHATSAPP_NUMBER;

  var dialog = document.getElementById('booking');
  if (!dialog) return;

  var form = dialog.querySelector('[data-booking-form]');
  var panel = form;
  var body = dialog.querySelector('.booking__body');
  var steps = Array.prototype.slice.call(form.querySelectorAll('[data-step]'));
  var btnPrev = form.querySelector('[data-prev]');
  var btnNext = form.querySelector('[data-next]');
  var btnSubmit = form.querySelector('[data-submit]');
  var btnClose = form.querySelector('[data-booking-close]');
  var foot = form.querySelector('[data-foot]');
  var done = form.querySelector('[data-done]');
  var errorEl = form.querySelector('[data-error]');
  var progress = form.querySelector('[data-progress]');
  var elCurrent = form.querySelector('[data-step-current]');
  var elTotal = form.querySelector('[data-step-total]');
  var summary = form.querySelector('[data-summary]');
  var finalLink = form.querySelector('[data-wa-final]');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && !reduce;

  var current = 0;
  var busy = false;
  var finished = false;
  var lastPointer = 0;
  var trigger = null;

  var LABELS = {
    servico: 'Serviço',
    primeira_vez: 'Primeira vez',
    unhas_hoje: 'Unhas hoje',
    estilo: 'Estilo',
    dias: 'Dias',
    periodo: 'Período',
    nome: 'Nome',
    obs: 'Observações'
  };

  // Todos os links de WhatsApp usam o mesmo número
  document.querySelectorAll('[data-wa]').forEach(function (a) { a.href = WA_BASE; });
  if (elTotal) elTotal.textContent = steps.length;

  /* ---------------- helpers ---------------- */
  function values(name) {
    return Array.prototype.slice
      .call(form.querySelectorAll('[name="' + name + '"]'))
      .filter(function (el) {
        return (el.type === 'checkbox' || el.type === 'radio') ? el.checked : el.value.trim() !== '';
      })
      .map(function (el) { return el.value.trim(); });
  }

  function smoother() {
    return window.VD && window.VD.smoother;
  }

  function lockPage(lock) {
    var s = smoother();
    if (s) s.paused(lock);
    document.documentElement.classList.toggle('is-locked', lock);
  }

  function setError(msg) {
    errorEl.textContent = msg || '';
    if (msg && hasGsap) {
      gsap.fromTo(errorEl, { x: -6 }, { x: 0, duration: .5, ease: 'elastic.out(1, .35)' });
    }
  }

  function validate(index) {
    var step = steps[index];
    var required = (step.getAttribute('data-required') || '').split(',').filter(Boolean);
    for (var i = 0; i < required.length; i++) {
      if (!values(required[i]).length) {
        var field = step.querySelector('[name="' + required[i] + '"]');
        if (required[i] === 'nome') {
          setError('Digite seu nome para continuar.');
        } else if (required[i] === 'periodo') {
          setError('Escolha um período para continuar.');
        } else if (required[i] === 'dias') {
          setError('Marque pelo menos um dia da semana.');
        } else {
          setError('Escolha uma opção para continuar.');
        }
        if (field) field.focus({ preventScroll: false });
        return false;
      }
    }
    setError('');
    return true;
  }

  function renderSummary() {
    var keys = ['servico', 'primeira_vez', 'unhas_hoje', 'estilo', 'dias', 'periodo'];
    summary.innerHTML = '';
    keys.forEach(function (k) {
      var v = values(k);
      if (!v.length) return;
      var dt = document.createElement('dt');
      var dd = document.createElement('dd');
      dt.textContent = LABELS[k];
      dd.textContent = v.join(', ');
      summary.appendChild(dt);
      summary.appendChild(dd);
    });
  }

  function buildMessage() {
    var lines = ['Olá, Vilma! Gostaria de agendar um horário. 💅', ''];
    ['nome', 'servico', 'primeira_vez', 'unhas_hoje', 'estilo', 'dias', 'periodo', 'obs'].forEach(function (k) {
      var v = values(k);
      if (v.length) lines.push('*' + LABELS[k] + ':* ' + v.join(', '));
    });
    return lines.join('\n');
  }

  function updateChrome(index) {
    var isLast = index === steps.length - 1;
    elCurrent.textContent = index + 1;
    btnPrev.hidden = index === 0;
    btnNext.hidden = isLast;
    btnSubmit.hidden = !isLast;
    var scale = (index + 1) / steps.length;
    if (hasGsap) gsap.to(progress, { scaleX: scale, duration: .6, ease: 'power3.out' });
    else progress.style.transform = 'scaleX(' + scale + ')';
    if (isLast) renderSummary();
  }

  function animateIn(el, dir) {
    if (!hasGsap) return;
    var items = el.querySelectorAll('.booking__question, .booking__hint, .booking__label, .choice, .field, .summary');
    gsap.fromTo(el, { x: 28 * dir, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: .45, ease: 'power3.out' });
    gsap.fromTo(items, { y: 14, autoAlpha: 0 }, {
      y: 0, autoAlpha: 1, duration: .45, ease: 'power2.out', stagger: .035, delay: .05, clearProps: 'transform,opacity,visibility'
    });
  }

  function showStep(index, dir) {
    var from = steps[current];
    var to = steps[index];

    function swap() {
      from.hidden = true;
      to.hidden = false;
      current = index;
      body.scrollTop = 0;
      updateChrome(index);
      animateIn(to, dir);
      // foco no enunciado da nova pergunta (teclado / leitor de tela)
      var legend = to.querySelector('legend');
      if (legend) { legend.setAttribute('tabindex', '-1'); legend.focus({ preventScroll: true }); }
      if (index === steps.length - 1) {
        var name = to.querySelector('[name="nome"]');
        if (name && !name.value) setTimeout(function () { name.focus({ preventScroll: true }); }, 350);
      }
      busy = false;
    }

    if (from === to) { swap(); return; }
    busy = true;
    if (hasGsap) {
      gsap.to(from, { x: -28 * dir, autoAlpha: 0, duration: .22, ease: 'power2.in', onComplete: swap });
    } else {
      swap();
    }
  }

  function next() {
    if (busy || !validate(current)) return;
    if (current < steps.length - 1) showStep(current + 1, 1);
  }

  function prev() {
    if (busy) return;
    setError('');
    if (current > 0) showStep(current - 1, -1);
  }

  function submit() {
    if (!validate(current)) return;
    var url = WA_BASE + '?text=' + encodeURIComponent(buildMessage());
    // abre no mesmo clique (evita bloqueio de pop-up)
    window.open(url, '_blank', 'noopener');
    finalLink.href = url;
    finished = true;

    steps.forEach(function (s) { s.hidden = true; });
    foot.hidden = true;
    done.hidden = false;
    elCurrent.textContent = steps.length;
    if (hasGsap) {
      gsap.to(progress, { scaleX: 1, duration: .6, ease: 'power3.out' });
      gsap.fromTo(done.children, { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: .08, duration: .5, ease: 'power3.out' });
      var path = done.querySelector('path');
      if (path && path.getTotalLength) {
        var len = path.getTotalLength();
        gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: .8, delay: .25, ease: 'power2.out' });
      }
    }
    done.focus({ preventScroll: true });
  }

  function reset() {
    form.reset();
    finished = false;
    done.hidden = true;
    foot.hidden = false;
    steps.forEach(function (s, i) {
      s.hidden = i !== 0;
      if (hasGsap) gsap.set(s, { clearProps: 'all' });
    });
    current = 0;
    setError('');
    updateChrome(0);
  }

  /* ---------------- abrir / fechar ---------------- */
  function open(service, from) {
    if (dialog.open) return;
    trigger = from || document.activeElement;
    if (finished) reset();

    if (service) {
      reset();
      var box = form.querySelector('[name="servico"][value="' + service + '"]');
      if (box) box.checked = true;
    }

    dialog.showModal();
    lockPage(true);
    updateChrome(current);
    if (hasGsap) {
      var fromY = window.innerWidth < 600 ? 80 : 30;
      gsap.fromTo(panel, { y: fromY, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .55, ease: 'power3.out' });
      animateIn(steps[current], 1);
    }
  }

  function close() {
    if (!dialog.open || dialog.dataset.closing) return;
    dialog.dataset.closing = '1';

    function finish() {
      dialog.close();
      delete dialog.dataset.closing;
      lockPage(false);
      if (hasGsap) gsap.set(panel, { clearProps: 'all' });
      if (trigger && trigger.focus) trigger.focus({ preventScroll: true });
    }

    if (hasGsap) {
      gsap.to(panel, { y: window.innerWidth < 600 ? 80 : 20, autoAlpha: 0, duration: .3, ease: 'power2.in', onComplete: finish });
    } else {
      finish();
    }
  }

  /* ---------------- eventos ---------------- */
  btnNext.addEventListener('click', next);
  btnPrev.addEventListener('click', prev);
  btnSubmit.addEventListener('click', submit);
  btnClose.addEventListener('click', close);

  // Enter no campo de nome não fecha o diálogo: avança / envia
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (current === steps.length - 1) submit(); else next();
  });

  // Esc com animação
  dialog.addEventListener('cancel', function (e) { e.preventDefault(); close(); });

  // Clique fora do painel (no fundo escuro) fecha
  dialog.addEventListener('click', function (e) { if (e.target === dialog) close(); });

  // Avança sozinho em perguntas de escolha única — só com clique/toque,
  // nunca com setas do teclado (que também mudam o rádio marcado).
  form.addEventListener('pointerdown', function () { lastPointer = Date.now(); });
  form.addEventListener('change', function (e) {
    setError('');
    var step = steps[current];
    if (e.target.type === 'radio' && step.hasAttribute('data-auto') && Date.now() - lastPointer < 800) {
      setTimeout(function () { if (steps[current] === step) next(); }, 380);
    }
    if (current === steps.length - 1) renderSummary();
  });

  // Botões "Agendar" do site abrem o questionário
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-booking]');
    if (!a) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // abrir em nova aba continua indo ao WhatsApp
    e.preventDefault();
    open(a.getAttribute('data-service'), a);
  });

  window.Booking = { open: open, close: close };
})();
