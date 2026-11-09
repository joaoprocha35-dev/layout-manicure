/* =========================================================
   Modal de agendamento (preto / rosa)
   Procedimento + calendário + horário + valor na tela.
   Decisão do projeto: confirma só na tela (sem WhatsApp).
   ========================================================= */
(function () {
  'use strict';
  var D = window.VD_DATA;
  var dialog = document.getElementById('agendar');
  if (!dialog || !D) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && !reduce;

  var panel = dialog.querySelector('[data-sched-panel]');
  var procsBox = dialog.querySelector('[data-procs]');
  var dowBox = dialog.querySelector('[data-cal-dow]');
  var daysBox = dialog.querySelector('[data-cal-days]');
  var monthLabel = dialog.querySelector('[data-cal-month]');
  var btnPrev = dialog.querySelector('[data-cal-prev]');
  var btnNext = dialog.querySelector('[data-cal-next]');
  var pickedLabel = dialog.querySelector('[data-cal-picked]');
  var slotsBox = dialog.querySelector('[data-slots]');
  var totalEl = dialog.querySelector('[data-total]');
  var confirmBtn = dialog.querySelector('[data-confirm]');
  var body = dialog.querySelector('[data-sched-form]');
  var foot = dialog.querySelector('[data-sched-foot]');
  var done = dialog.querySelector('[data-done]');
  var receipt = dialog.querySelector('[data-receipt]');

  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var DOW = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  var DOW_FULL = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

  var services = [];
  var selected = {};          // { serviceId: true }
  var viewYear, viewMonth;    // mês exibido no calendário
  var pickedDate = null;      // Date escolhida
  var pickedSlot = null;      // string "HH:MM"
  var trigger = null;

  var today = new Date(); today.setHours(0, 0, 0, 0);

  /* ---------------- helpers de página ---------------- */
  function smoother() { return window.VD && window.VD.smoother; }
  function lockPage(lock) {
    var s = smoother();
    if (s) s.paused(lock);
    document.documentElement.classList.toggle('is-locked', lock);
  }

  /* ---------------- procedimentos ---------------- */
  function renderProcs() {
    services = D.getServices();
    procsBox.innerHTML = '';
    services.forEach(function (s) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'proc';
      btn.setAttribute('data-id', s.id);
      btn.setAttribute('aria-pressed', 'false');
      btn.innerHTML =
        '<span class="proc__check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" fill="none"/></svg></span>' +
        '<span class="proc__name">' + s.nome + '</span>' +
        '<span class="proc__price">' + D.money(s.preco) + '</span>' +
        '<span class="proc__time">~' + (s.duracao || 60) + ' min</span>';
      btn.addEventListener('click', function () {
        if (selected[s.id]) { delete selected[s.id]; } else { selected[s.id] = true; }
        var on = !!selected[s.id];
        btn.classList.toggle('is-on', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        updateTotal();
      });
      procsBox.appendChild(btn);
    });
  }

  /* ---------------- calendário ---------------- */
  function renderDowHeader() {
    dowBox.innerHTML = '';
    DOW.forEach(function (d) {
      var c = document.createElement('span');
      c.className = 'cal__dow';
      c.textContent = d;
      dowBox.appendChild(c);
    });
  }

  function renderCalendar() {
    var first = new Date(viewYear, viewMonth, 1);
    var startDow = first.getDay();
    var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    monthLabel.textContent = MESES[viewMonth] + ' ' + viewYear;
    daysBox.innerHTML = '';

    // só permite voltar até o mês atual
    var atCurrentMonth = (viewYear === today.getFullYear() && viewMonth === today.getMonth());
    btnPrev.disabled = atCurrentMonth;

    for (var i = 0; i < startDow; i++) {
      var empty = document.createElement('span');
      empty.className = 'cal__day is-empty';
      daysBox.appendChild(empty);
    }
    for (var day = 1; day <= daysInMonth; day++) {
      var date = new Date(viewYear, viewMonth, day);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cal__day';
      btn.textContent = day;
      var isPast = date < today;
      var isSunday = date.getDay() === 0;
      if (isPast || isSunday) {
        btn.disabled = true;
        btn.title = isSunday ? 'Domingo: fechado' : 'Data já passou';
      } else {
        (function (d) {
          btn.addEventListener('click', function () { pickDate(d, btn); });
        })(date);
      }
      if (pickedDate && sameDay(date, pickedDate)) btn.classList.add('is-on');
      daysBox.appendChild(btn);
    }
  }

  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function pickDate(date, btn) {
    pickedDate = date;
    pickedSlot = null;
    daysBox.querySelectorAll('.cal__day.is-on').forEach(function (b) { b.classList.remove('is-on'); });
    btn.classList.add('is-on');
    pickedLabel.textContent = '📅 ' + DOW_FULL[date.getDay()] + ', ' + date.getDate() + ' de ' + MESES[date.getMonth()];
    renderSlots();
    updateTotal();
  }

  /* ---------------- horários ---------------- */
  function renderSlots() {
    slotsBox.innerHTML = '';
    if (!pickedDate) return;
    var sat = pickedDate.getDay() === 6;
    var times = sat
      ? ['09:00', '10:00', '11:00', '12:00', '13:00']
      : ['09:00', '10:30', '13:00', '14:30', '16:00', '17:30'];
    times.forEach(function (t) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slot';
      btn.textContent = t;
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', function () {
        pickedSlot = t;
        slotsBox.querySelectorAll('.slot.is-on').forEach(function (b) { b.classList.remove('is-on'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('is-on');
        btn.setAttribute('aria-pressed', 'true');
        updateTotal();
      });
      slotsBox.appendChild(btn);
    });
  }

  /* ---------------- total + habilitar confirmar ---------------- */
  function selectedServices() {
    return services.filter(function (s) { return selected[s.id]; });
  }
  function total() {
    return selectedServices().reduce(function (sum, s) { return sum + Number(s.preco || 0); }, 0);
  }
  function updateTotal() {
    var t = total();
    totalEl.textContent = D.money(t);
    var ready = selectedServices().length > 0 && pickedDate && pickedSlot;
    confirmBtn.disabled = !ready;
    if (hasGsap) gsap.fromTo(totalEl, { scale: 1.12 }, { scale: 1, duration: .4, ease: 'back.out(2)' });
  }

  /* ---------------- confirmar ---------------- */
  function confirm() {
    if (confirmBtn.disabled) return;
    var procs = selectedServices();
    var t = total();

    receipt.innerHTML = '';
    addRow('Procedimento', procs.map(function (s) { return s.nome; }).join(', '));
    addRow('Dia', DOW_FULL[pickedDate.getDay()] + ', ' + pickedDate.getDate() + '/' + (pickedDate.getMonth() + 1) + '/' + pickedDate.getFullYear());
    addRow('Horário', pickedSlot);
    addRow('Valor', D.money(t), true);

    body.hidden = true;
    foot.hidden = true;
    done.hidden = false;
    done.focus({ preventScroll: true });

    if (hasGsap) {
      gsap.fromTo(done.children, { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: .08, duration: .5, ease: 'power3.out' });
      var path = done.querySelector('path');
      if (path && path.getTotalLength) {
        var len = path.getTotalLength();
        gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: .8, delay: .2, ease: 'power2.out' });
      }
    }
  }
  function addRow(label, value, isTotal) {
    var row = document.createElement('div');
    row.className = 'sched__receipt-row' + (isTotal ? ' is-total' : '');
    row.innerHTML = '<dt>' + label + '</dt><dd>' + value + '</dd>';
    receipt.appendChild(row);
  }

  /* ---------------- abrir / fechar ---------------- */
  function reset() {
    selected = {};
    pickedDate = null;
    pickedSlot = null;
    viewYear = today.getFullYear();
    viewMonth = today.getMonth();
    body.hidden = false;
    foot.hidden = false;
    done.hidden = true;
    pickedLabel.textContent = '';
    slotsBox.innerHTML = '';
    renderProcs();
    renderCalendar();
    updateTotal();
  }

  function open(service, from) {
    if (dialog.open) return;
    trigger = from || document.activeElement;
    reset();

    if (service) {
      var match = services.filter(function (s) { return s.nome === service; })[0];
      if (match) {
        selected[match.id] = true;
        var btn = procsBox.querySelector('[data-id="' + match.id + '"]');
        if (btn) { btn.classList.add('is-on'); btn.setAttribute('aria-pressed', 'true'); }
        updateTotal();
      }
    }

    dialog.showModal();
    lockPage(true);
    if (hasGsap) {
      gsap.fromTo(panel, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .5, ease: 'power3.out' });
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
      gsap.to(panel, { y: 24, autoAlpha: 0, duration: .3, ease: 'power2.in', onComplete: finish });
    } else { finish(); }
  }

  /* ---------------- eventos ---------------- */
  renderDowHeader();

  btnPrev.addEventListener('click', function () {
    if (btnPrev.disabled) return;
    viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    renderCalendar();
  });
  btnNext.addEventListener('click', function () {
    viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderCalendar();
  });
  confirmBtn.addEventListener('click', confirm);

  dialog.querySelectorAll('[data-sched-close]').forEach(function (b) {
    b.addEventListener('click', close);
  });
  dialog.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
  dialog.addEventListener('click', function (e) { if (e.target === dialog) close(); });

  // Todos os botões "Agendar" do site abrem este modal
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-booking]');
    if (!a) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    open(a.getAttribute('data-service'), a);
  });

  window.Agendar = { open: open, close: close };
})();
