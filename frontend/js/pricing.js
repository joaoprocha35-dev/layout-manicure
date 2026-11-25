/* =========================================================
   Preços (abas por categoria), adicionais e produtos —
   tudo gerado a partir de js/data.js (VD_DATA), que também
   alimenta o painel da Vilma e o modal de agendamento.
   ========================================================= */
(function () {
  'use strict';
  var D = window.VD_DATA;
  if (!D) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && !reduce;

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  function icon(id, cls) { return '<svg class="i ' + (cls || '') + '"><use href="#i-' + id + '"/></svg>'; }
  function slug(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-'); }

  var TAB_LABEL = { 'Tradicionais': 'Tradicionais', 'Em Gel': 'Em gel & alongamento', 'Adicionais': 'Adicionais' };

  /* ---------------- Preços ---------------- */
  var tabsBox = document.querySelector('[data-tabs]');
  var panelsBox = document.querySelector('[data-price-panels]');
  var pill = document.querySelector('[data-tabs-pill]');

  if (tabsBox && panelsBox) {
    var services = D.getServices();
    // Categorias na ordem oficial + qualquer categoria nova criada no painel
    var cats = (D.categories || []).slice();
    services.forEach(function (s) { if (cats.indexOf(s.categoria) === -1) cats.push(s.categoria); });
    cats = cats.filter(function (c) { return services.some(function (s) { return s.categoria === c; }); });

    cats.forEach(function (cat, idx) {
      var id = 'tab-' + slug(cat);
      var list = services.filter(function (s) { return s.categoria === cat; });

      var tab = el('<button class="tab" type="button" role="tab" id="' + id + '" aria-controls="panel-' + slug(cat) + '" aria-selected="' + (idx === 0) + '" tabindex="' + (idx === 0 ? 0 : -1) + '" data-tab="' + esc(cat) + '">' +
        esc(TAB_LABEL[cat] || cat) + ' <small>(' + list.length + ')</small></button>');
      tabsBox.appendChild(tab);

      var panel = el('<div class="price-panel" role="tabpanel" id="panel-' + slug(cat) + '" aria-labelledby="' + id + '"' + (idx === 0 ? '' : ' hidden') + ' data-panel="' + esc(cat) + '"></div>');
      var withImg = list.filter(function (s) { return s.img; });
      var noImg = list.filter(function (s) { return !s.img; });

      if (withImg.length) {
        var grid = el('<div class="price-grid" role="list"></div>');
        withImg.forEach(function (s) { grid.appendChild(priceCard(s)); });
        panel.appendChild(grid);
      }
      if (noImg.length) {
        var box = el('<div class="extras"' + (withImg.length ? ' style="margin-top:1.4rem"' : '') + '>' +
          '<p class="extras__intro"><span class="icon-badge">' + icon('sparkle') + '</span>' +
          (cat === 'Adicionais' ? 'Detalhes que somam ao seu procedimento principal.' : 'Outros itens desta categoria.') + '</p>' +
          '<div class="extras__list" role="list"></div></div>');
        var ul = box.querySelector('.extras__list');
        noImg.forEach(function (s) { ul.appendChild(extraRow(s)); });
        panel.appendChild(box);
      }
      panelsBox.appendChild(panel);
    });

    tabsBox.addEventListener('click', function (e) {
      var t = e.target.closest('[data-tab]');
      if (t) selectTab(t.getAttribute('data-tab'));
    });
    // setas do teclado entre as abas
    tabsBox.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var tabs = [].slice.call(tabsBox.querySelectorAll('[data-tab]'));
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      next.focus();
      selectTab(next.getAttribute('data-tab'));
    });

    movePill(false);
    window.addEventListener('resize', function () { movePill(false); }, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { movePill(false); });
  }

  function priceCard(s) {
    var img = s.img;
    var time = s.duracao ? '<span class="duration">' + icon('clock') + '~' + s.duracao + ' min</span>' : '';
    return el(
      '<article class="pcard" role="listitem" data-service-id="' + esc(s.id) + '">' +
        '<div class="pcard__media">' +
          '<img src="' + esc(img) + '-560.webp" srcset="' + esc(img) + '-560.webp 560w, ' + esc(img) + '.webp 1000w" sizes="(min-width: 1140px) 290px, (min-width: 560px) 45vw, 38vw" width="560" height="400" loading="lazy" decoding="async" alt="">' +
          '<svg viewBox="0 0 300 34" preserveAspectRatio="none" aria-hidden="true"><path d="M0 22C70 4 140 4 200 16s80 14 100 6V34H0z"/></svg>' +
        '</div>' +
        '<span class="icon-badge">' + icon(s.icon || 'sparkle') + '</span>' +
        '<div class="pcard__body">' +
          '<h3 class="pcard__name">' + esc(s.nome) + '</h3>' +
          '<p class="pcard__desc">' + esc(s.desc || '') + '</p>' +
          '<div class="pcard__foot">' +
            '<p class="price">' + D.money(s.preco) + (s.nota ? '<small>' + esc(s.nota) + '</small>' : '') + '</p>' +
            time +
          '</div>' +
          '<button class="btn btn--dark btn--small" type="button" data-booking data-service="' + esc(s.id) + '">Agendar este' + icon('arrow', 'i--arrow') + '</button>' +
        '</div>' +
      '</article>'
    );
  }

  function extraRow(s) {
    return el(
      '<div class="extra" role="listitem" data-service-id="' + esc(s.id) + '">' +
        '<p class="extra__name">' + esc(s.nome) + (s.desc ? '<small>' + esc(s.desc) + '</small>' : '') + '</p>' +
        '<p class="price">' + D.money(s.preco) + (s.nota ? '<small>' + esc(s.nota) + '</small>' : '') + '</p>' +
        '<button class="extra__add" type="button" data-booking data-service="' + esc(s.id) + '" aria-label="Agendar ' + esc(s.nome) + '">' + icon('plus') + '</button>' +
      '</div>'
    );
  }

  function selectTab(cat, instant) {
    if (!tabsBox) return;
    var current = panelsBox.querySelector('[data-panel]:not([hidden])');
    var next = panelsBox.querySelector('[data-panel="' + cssEsc(cat) + '"]');
    tabsBox.querySelectorAll('[data-tab]').forEach(function (t) {
      var on = t.getAttribute('data-tab') === cat;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
    });
    movePill(!instant);
    if (!next || next === current) return;

    if (current) current.hidden = true;
    next.hidden = false;
    if (hasGsap && !instant) {
      var items = next.querySelectorAll('.pcard, .extra');
      gsap.fromTo(items, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .6, ease: 'power3.out', stagger: .05, overwrite: true, clearProps: 'transform' });
    } else {
      next.querySelectorAll('.pcard, .extra').forEach(function (n) { n.style.opacity = ''; n.style.visibility = ''; n.style.transform = ''; });
    }
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  function movePill(animate) {
    if (!pill || !tabsBox) return;
    var active = tabsBox.querySelector('[aria-selected="true"]');
    if (!active) return;
    var props = { x: active.offsetLeft, width: active.offsetWidth };
    if (typeof window.gsap !== 'undefined') {
      if (animate && !reduce) gsap.to(pill, Object.assign({ duration: .55, ease: 'power3.out' }, props));
      else gsap.set(pill, props);
    } else {
      pill.style.transform = 'translateX(' + props.x + 'px)';
      pill.style.width = props.width + 'px';
    }
  }

  function cssEsc(s) { return String(s).replace(/"/g, '\\"'); }

  /* "Ver valores" nos cards de serviço → abre a aba certa e destaca o card */
  function gotoPrice(serviceId) {
    var s = D.getServiceById(serviceId);
    if (!s) return;
    selectTab(s.categoria, true);
    var card = document.querySelector('[data-service-id="' + cssEsc(serviceId) + '"]');
    if (card) {
      card.style.opacity = ''; card.style.visibility = ''; card.style.transform = '';
      card.classList.remove('is-flash');
      setTimeout(function () { card.classList.add('is-flash'); }, 650);
    }
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-goto-price]');
    if (!a) return;
    e.preventDefault();
    var id = a.getAttribute('data-goto-price');
    gotoPrice(id);
    var target = document.querySelector('[data-service-id="' + cssEsc(id) + '"]') || document.getElementById('precos');
    if (window.VD && window.VD.scrollTo) window.VD.scrollTo(target, 140);
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  });

  /* Copiar a chave PIX */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy]');
    if (!b) return;
    var txt = b.getAttribute('data-copy');
    var label = b.querySelector('span');
    function done() { if (label) { label.textContent = 'Copiado!'; setTimeout(function () { label.textContent = 'Copiar'; }, 1800); } }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, done);
    else done();
  });

  /* ---------------- Produtos ---------------- */
  // Ilustrações em SVG (não há fotos dos produtos no projeto)
  function productArt(nome) {
    var n = slug(nome);
    var g = '<defs><linearGradient id="pg-' + n + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7D9CC"/><stop offset="1" stop-color="#D9A08F"/></linearGradient></defs>';
    var gold = '#C8957A', dark = '#4A2E26';
    if (/oleo/.test(n)) {
      return '<svg viewBox="0 0 80 110" aria-hidden="true">' + g +
        '<rect x="34" y="4" width="12" height="20" rx="6" fill="' + dark + '"/><rect x="31" y="22" width="18" height="10" rx="2" fill="' + gold + '"/>' +
        '<path d="M22 40c0-5 4-8 9-8h18c5 0 9 3 9 8v56c0 6-4 10-10 10H32c-6 0-10-4-10-10z" fill="#E7B65C" opacity=".85"/>' +
        '<path d="M22 60h36v36c0 6-4 10-10 10H32c-6 0-10-4-10-10z" fill="#D9A040" opacity=".6"/>' +
        '<rect x="29" y="64" width="22" height="20" rx="3" fill="#FFF8F3" opacity=".9"/><path d="M33 70h14M33 75h10" stroke="' + gold + '" stroke-width="1.5"/>' +
        '<path d="M27 44v40" stroke="#fff" stroke-width="3" opacity=".45" stroke-linecap="round"/></svg>';
    }
    if (/lixa|buffer/.test(n)) {
      return '<svg viewBox="0 0 110 110" aria-hidden="true">' + g +
        '<rect x="14" y="44" width="92" height="16" rx="8" transform="rotate(-30 60 52)" fill="url(#pg-' + n + ')"/>' +
        '<rect x="40" y="62" width="44" height="30" rx="6" fill="#F2C7BA"/><rect x="40" y="62" width="44" height="10" rx="5" fill="#FBE4DC"/></svg>';
    }
    if (/creme|hidrat/.test(n)) {
      return '<svg viewBox="0 0 100 100" aria-hidden="true">' + g +
        '<path d="M20 52h60v28c0 8-6 14-14 14H34c-8 0-14-6-14-14z" fill="url(#pg-' + n + ')"/>' +
        '<rect x="18" y="44" width="64" height="12" rx="4" fill="' + gold + '"/>' +
        '<path d="M28 44c4-12 14-16 22-12 6-6 18-2 20 12z" fill="#FFF8F3"/></svg>';
    }
    // padrão: frasco de esmalte / base
    return '<svg viewBox="0 0 80 110" aria-hidden="true">' + g +
      '<rect x="31" y="4" width="18" height="36" rx="4" fill="' + dark + '"/>' +
      '<path d="M18 50c0-6 5-11 11-11h22c6 0 11 5 11 11v44c0 7-5 12-12 12H30c-7 0-12-5-12-12z" fill="url(#pg-' + n + ')" opacity=".95"/>' +
      '<path d="M25 52v38" stroke="#fff" stroke-width="3.5" opacity=".5" stroke-linecap="round"/></svg>';
  }
  var botanicMini = '<svg class="botanic-mini" viewBox="0 0 200 200" aria-hidden="true"><use href="#botanic"/></svg>';

  var prodGrid = document.querySelector('[data-products-grid]');
  var products = D.getPublicProducts();
  if (prodGrid) {
    prodGrid.innerHTML = '';
    if (!products.length) {
      prodGrid.appendChild(el('<p class="products__empty">Em breve novos produtos por aqui.</p>'));
    } else {
      products.forEach(function (p) {
        prodGrid.appendChild(el(
          '<article class="prod" data-card role="listitem">' +
            '<div class="prod__art">' + botanicMini + productArt(p.nome) + '</div>' +
            '<div class="prod__body">' +
              '<span class="prod__cat">' + esc(p.categoria) + '</span>' +
              '<h3 class="prod__name">' + esc(p.nome) + '</h3>' +
              '<p class="prod__desc">' + esc(p.desc || '') + '</p>' +
              '<div class="prod__foot">' +
                (p.preco ? '<span class="price">' + D.money(p.preco) + '</span>' : '<span></span>') +
                '<button class="btn btn--light btn--small" type="button" data-product="' + esc(p.id) + '">Ver detalhes' + icon('arrow', 'i--arrow') + '</button>' +
              '</div>' +
            '</div>' +
          '</article>'
        ));
      });
    }
  }

  // Diálogo de detalhes (apresentação; sem carrinho/pagamento)
  var pdlg = document.querySelector('[data-pdlg]');
  if (pdlg) {
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-product]');
      if (!b) return;
      var p = products.filter(function (x) { return x.id === b.getAttribute('data-product'); })[0];
      if (!p) return;
      pdlg.querySelector('[data-pdlg-art]').innerHTML = '<div class="prod__art">' + botanicMini + productArt(p.nome) + '</div>';
      pdlg.querySelector('[data-pdlg-cat]').textContent = p.categoria;
      pdlg.querySelector('[data-pdlg-name]').textContent = p.nome;
      pdlg.querySelector('[data-pdlg-desc]').textContent = p.desc || '';
      pdlg.querySelector('[data-pdlg-price]').textContent = p.preco ? D.money(p.preco) : '';
      pdlg.querySelector('[data-pdlg-wa]').href = 'https://wa.me/' + D.info.whatsapp + '?text=' +
        encodeURIComponent('Olá, Vilma! Tenho interesse no produto: ' + p.nome + '.');
      pdlg.showModal();
      if (hasGsap) gsap.fromTo(pdlg, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .45, ease: 'power3.out' });
    });
    pdlg.querySelector('[data-pdlg-close]').addEventListener('click', function () { pdlg.close(); });
    pdlg.addEventListener('click', function (e) { if (e.target === pdlg) pdlg.close(); });
  }

  window.VD_PRICES = { selectTab: selectTab, gotoPrice: gotoPrice };
})();
