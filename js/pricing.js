/* =========================================================
   Preenche a seção de Preços e a de Produtos a partir dos
   dados salvos (VD_DATA). Anima a tira de números.
   ========================================================= */
(function () {
  'use strict';
  var D = window.VD_DATA;
  if (!D) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  /* ---------------- Preços ---------------- */
  var pricesGrid = document.querySelector('[data-prices-grid]');
  if (pricesGrid) {
    var services = D.getServices();
    pricesGrid.innerHTML = '';
    services.forEach(function (s) {
      var card = el(
        '<article class="price-card" data-card role="listitem">' +
          '<span class="price-card__cat">' + esc(s.categoria) + '</span>' +
          '<h3 class="price-card__name">' + esc(s.nome) + '</h3>' +
          '<p class="price-card__desc">' + esc(s.desc || '') + '</p>' +
          '<div class="price-card__foot">' +
            '<span class="price-card__value">' + D.money(s.preco) + '<small>no atendimento</small></span>' +
            '<span class="price-card__time">~' + (s.duracao || 60) + ' min</span>' +
          '</div>' +
          '<button class="btn btn--dark btn--small" type="button" data-booking data-service="' + esc(s.nome) + '" style="margin-top:1rem;align-self:flex-start">Agendar este</button>' +
        '</article>'
      );
      pricesGrid.appendChild(card);
    });
  }

  /* ---------------- Produtos (loja pública) ---------------- */
  var prodGrid = document.querySelector('[data-products-grid]');
  if (prodGrid) {
    var products = D.getPublicProducts();
    prodGrid.innerHTML = '';
    if (!products.length) {
      prodGrid.appendChild(el('<p class="products__empty">Em breve novos produtos por aqui. 💅</p>'));
    } else {
      products.forEach(function (p) {
        var card = el(
          '<article class="product-card" data-card role="listitem">' +
            '<span class="product-card__icon" aria-hidden="true">' +
              '<svg viewBox="0 0 24 24"><path d="M9 2h6M10 2v3M14 2v3M8 8c0-1.7 1.3-3 3-3h2c1.7 0 3 1.3 3 3v12a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V8Z"/><path d="M8 12h8"/></svg>' +
            '</span>' +
            '<span class="product-card__cat">' + esc(p.categoria) + '</span>' +
            '<h3 class="product-card__name">' + esc(p.nome) + '</h3>' +
            '<p class="product-card__desc">' + esc(p.desc || '') + '</p>' +
            '<span class="product-card__price">' + D.money(p.preco) + '</span>' +
          '</article>'
        );
        prodGrid.appendChild(card);
      });
    }
  }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------------- Contagem animada dos números ---------------- */
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  if (counters.length && !reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        countUp(entry.target);
      });
    }, { threshold: .5 });
    counters.forEach(function (c) { io.observe(c); });
  }

  function countUp(node) {
    var target = parseInt(node.getAttribute('data-count'), 10) || 0;
    var prefix = node.querySelector('span') ? node.querySelector('span').textContent : '';
    var isPercent = prefix === '%';
    var start = performance.now();
    var dur = 1400;
    function tick(now) {
      var t = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - t, 3);
      var val = Math.round(target * eased);
      var text = val.toLocaleString('pt-BR');
      node.textContent = isPercent ? (text + '%') : ((prefix === '+' ? '+' : '') + text);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
})();
