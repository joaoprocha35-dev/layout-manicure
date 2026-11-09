/* =========================================================
   Painel da Vilma — lógica do admin (dados em localStorage)
   ========================================================= */
(function () {
  'use strict';
  var D = window.VD_DATA;
  if (!D) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && !reduce;

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var money = D.money;
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /* ---------------- navegação ---------------- */
  $$('[data-view]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var name = btn.getAttribute('data-view');
      $$('[data-view]').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      $$('[data-view-panel]').forEach(function (p) { p.classList.toggle('is-active', p.getAttribute('data-view-panel') === name); });
      if (name === 'dashboard') renderDashboard();
    });
  });

  /* ---------------- toast ---------------- */
  var toastEl = $('[data-toast]');
  var toastT;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2200);
  }

  /* ---------------- diálogo genérico ---------------- */
  var dlg = $('[data-dialog]');
  var dlgForm = $('[data-dialog-form]');
  function openDialog(title, fields, onSave) {
    dlgForm.innerHTML = '';
    var h = document.createElement('h2'); h.className = 'dlg__title'; h.textContent = title;
    dlgForm.appendChild(h);

    fields.forEach(function (f) {
      var wrap = document.createElement('div');
      if (f.type === 'switch') {
        wrap.className = 'field';
        wrap.innerHTML = '<label class="switch"><input type="checkbox" name="' + f.name + '"' + (f.value ? ' checked' : '') + '> <span>' + esc(f.label) + '</span></label>';
      } else {
        wrap.className = 'field';
        var input;
        if (f.type === 'select') {
          input = '<select class="select" name="' + f.name + '">' + f.options.map(function (o) {
            return '<option value="' + esc(o) + '"' + (o === f.value ? ' selected' : '') + '>' + esc(o) + '</option>';
          }).join('') + '</select>';
        } else if (f.type === 'textarea') {
          input = '<textarea class="input" name="' + f.name + '" rows="2">' + esc(f.value || '') + '</textarea>';
        } else {
          input = '<input class="input" name="' + f.name + '" type="' + (f.type || 'text') + '"' +
            (f.type === 'number' ? ' step="' + (f.step || '0.01') + '" min="0"' : '') +
            ' value="' + esc(f.value == null ? '' : f.value) + '"' + (f.required ? ' required' : '') + '>';
        }
        wrap.innerHTML = '<label>' + esc(f.label) + '</label>' + input;
      }
      dlgForm.appendChild(wrap);
    });

    var foot = document.createElement('div');
    foot.className = 'dlg__foot';
    foot.innerHTML = '<button type="button" class="btn btn--ghost" data-cancel>Cancelar</button><button type="submit" class="btn btn--rose">Salvar</button>';
    dlgForm.appendChild(foot);

    $('[data-cancel]', dlgForm).addEventListener('click', function () { dlg.close(); });
    dlgForm.onsubmit = function (e) {
      e.preventDefault();
      var data = {};
      fields.forEach(function (f) {
        var node = dlgForm.querySelector('[name="' + f.name + '"]');
        if (f.type === 'switch') data[f.name] = node.checked;
        else if (f.type === 'number') data[f.name] = parseFloat(node.value) || 0;
        else data[f.name] = node.value.trim();
      });
      onSave(data);
      dlg.close();
    };
    dlg.showModal();
  }

  /* ========================================================
     DASHBOARD — lançamentos e gráficos
     ======================================================== */
  var tipo = 'entrada';
  var itemSel = $('[data-launch-item]');
  var qtdInput = $('[data-launch-qtd]');
  var customBox = $('[data-custom]');
  var descInput = $('[data-launch-desc]');
  var valorInput = $('[data-launch-valor]');
  var calcBox = $('[data-calc]');
  var calcValue = $('[data-calc-value]');
  var calcDetail = $('[data-calc-detail]');
  var addBtn = $('[data-launch-add]');

  $$('[data-tipo-toggle] button').forEach(function (b) {
    b.addEventListener('click', function () {
      tipo = b.getAttribute('data-tipo');
      $$('[data-tipo-toggle] button').forEach(function (x) { x.classList.toggle('is-on', x === b); });
      calcBox.classList.toggle('is-out', tipo === 'saida');
      populateItems();
      recalc();
    });
  });

  function populateItems() {
    itemSel.innerHTML = '';
    if (tipo === 'entrada') {
      D.getServices().forEach(function (s) {
        itemSel.appendChild(opt('srv:' + s.id, s.nome + ' — ' + money(s.preco)));
      });
    } else {
      D.getStock().forEach(function (s) {
        itemSel.appendChild(opt('stk:' + s.id, s.nome + ' — custo ' + money(s.custo)));
      });
      itemSel.appendChild(opt('custom', 'Outro (valor avulso)'));
    }
  }
  function opt(v, label) { var o = document.createElement('option'); o.value = v; o.textContent = label; return o; }

  function currentItem() {
    var v = itemSel.value;
    if (v === 'custom') {
      return { nome: descInput.value.trim() || 'Item avulso', categoria: 'Outros', valorUnit: parseFloat(valorInput.value) || 0 };
    }
    var id = v.slice(4);
    if (v.indexOf('srv:') === 0) {
      var s = D.getServiceById(id);
      return s ? { nome: s.nome, categoria: s.categoria, valorUnit: s.preco } : null;
    }
    var stk = D.getStock().filter(function (x) { return x.id === id; })[0];
    return stk ? { nome: stk.nome, categoria: stk.categoria, valorUnit: stk.custo } : null;
  }

  function recalc() {
    customBox.hidden = !(tipo === 'saida' && itemSel.value === 'custom');
    var item = currentItem();
    var qtd = Math.max(1, parseInt(qtdInput.value, 10) || 1);
    var total = item ? item.valorUnit * qtd : 0;
    calcValue.textContent = money(total);
    calcDetail.textContent = item ? (qtd + ' × ' + money(item.valorUnit) + ' · ' + item.nome) : 'Selecione um item';
    addBtn.disabled = !(item && total > 0);
    if (hasGsap) gsap.fromTo(calcValue, { scale: 1.1 }, { scale: 1, duration: .3, ease: 'back.out(2)' });
  }

  itemSel.addEventListener('change', recalc);
  qtdInput.addEventListener('input', recalc);
  descInput.addEventListener('input', recalc);
  valorInput.addEventListener('input', recalc);

  addBtn.addEventListener('click', function () {
    var item = currentItem();
    var qtd = Math.max(1, parseInt(qtdInput.value, 10) || 1);
    if (!item || item.valorUnit <= 0) return;
    var list = D.getTransactions();
    list.unshift({
      id: D.uid(), tipo: tipo, nome: item.nome, categoria: item.categoria,
      valorUnit: item.valorUnit, qtd: qtd, total: item.valorUnit * qtd,
      data: new Date().toISOString().slice(0, 10)
    });
    D.saveTransactions(list);
    qtdInput.value = 1; descInput.value = ''; valorInput.value = '';
    recalc();
    renderDashboard();
    toast('Lançamento registrado 💅');
  });

  function renderTxList() {
    var box = $('[data-tx-list]');
    var list = D.getTransactions();
    if (!list.length) { box.innerHTML = '<p class="empty">Nenhum lançamento ainda.</p>'; return; }
    box.innerHTML = '';
    list.slice(0, 12).forEach(function (t) {
      var row = document.createElement('div');
      row.className = 'item';
      row.innerHTML =
        '<div class="item__main"><p class="item__name">' + esc(t.nome) + '</p>' +
        '<p class="item__meta">' + esc(t.categoria) + ' · ' + t.qtd + ' × ' + money(t.valorUnit) + ' · ' + fmtDate(t.data) + '</p></div>' +
        '<p class="item__value ' + (t.tipo === 'entrada' ? 'is-in' : 'is-out') + '">' + (t.tipo === 'entrada' ? '+' : '−') + money(t.total) + '</p>' +
        '<div class="item__actions"><button class="icon-btn is-danger" title="Excluir" data-del="' + t.id + '"><svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button></div>';
      box.appendChild(row);
    });
    $$('[data-del]', box).forEach(function (b) {
      b.addEventListener('click', function () {
        D.saveTransactions(D.getTransactions().filter(function (t) { return t.id !== b.getAttribute('data-del'); }));
        renderDashboard();
        toast('Lançamento removido');
      });
    });
  }

  function fmtDate(iso) {
    var p = iso.split('-');
    return p[2] + '/' + p[1];
  }

  function renderKpis() {
    var list = D.getTransactions();
    var ins = list.filter(function (t) { return t.tipo === 'entrada'; });
    var outs = list.filter(function (t) { return t.tipo === 'saida'; });
    var totIn = ins.reduce(function (a, t) { return a + t.total; }, 0);
    var totOut = outs.reduce(function (a, t) { return a + t.total; }, 0);
    $('[data-kpi-in]').textContent = money(totIn);
    $('[data-kpi-out]').textContent = money(totOut);
    $('[data-kpi-net]').textContent = money(totIn - totOut);
    $('[data-kpi-in-count]').textContent = ins.length + ' lançamentos';
    $('[data-kpi-out-count]').textContent = outs.length + ' lançamentos';
    return { totIn: totIn, totOut: totOut };
  }

  /* ---------------- tooltip dos gráficos ---------------- */
  var tip = $('[data-tooltip]');
  function showTip(html, e) {
    tip.innerHTML = html;
    tip.classList.add('is-on');
    moveTip(e);
  }
  function moveTip(e) {
    tip.style.left = (e.clientX + 14) + 'px';
    tip.style.top = (e.clientY + 14) + 'px';
  }
  function hideTip() { tip.classList.remove('is-on'); }

  /* ---------------- gráfico DONUT (entradas × saídas) ---------------- */
  function renderDonut(totIn, totOut) {
    var box = $('[data-chart-donut]');
    var total = totIn + totOut;
    var size = 220, r = 80, cx = size / 2, cy = size / 2, sw = 26;
    var C = 2 * Math.PI * r;
    box.innerHTML = '';
    var svg = svgEl('svg', { viewBox: '0 0 ' + size + ' ' + size, role: 'img' });

    // trilha de fundo
    svg.appendChild(svgEl('circle', { cx: cx, cy: cy, r: r, fill: 'none', stroke: 'rgba(62,43,34,.08)', 'stroke-width': sw }));

    if (total === 0) {
      var t0 = svgEl('text', { x: cx, y: cy, 'text-anchor': 'middle', 'dominant-baseline': 'middle', class: 'axis-label' });
      t0.textContent = 'Sem dados';
      svg.appendChild(t0);
      box.appendChild(svg);
      return;
    }

    var segs = [
      { label: 'Entradas', value: totIn, color: '#3F9D6A' },
      { label: 'Saídas', value: totOut, color: '#C06A5E' }
    ];
    var offset = 0;
    segs.forEach(function (s) {
      if (s.value <= 0) return;
      var frac = s.value / total;
      var len = frac * C;
      var circle = svgEl('circle', {
        cx: cx, cy: cy, r: r, fill: 'none', stroke: s.color, 'stroke-width': sw,
        'stroke-dasharray': len + ' ' + (C - len),
        'stroke-dashoffset': -offset,
        transform: 'rotate(-90 ' + cx + ' ' + cy + ')',
        'stroke-linecap': 'butt'
      });
      circle.style.cursor = 'pointer';
      circle.addEventListener('mouseenter', function (e) {
        showTip('<strong>' + s.label + '</strong><br>' + money(s.value) + ' · ' + Math.round(frac * 100) + '%', e);
      });
      circle.addEventListener('mousemove', moveTip);
      circle.addEventListener('mouseleave', hideTip);
      svg.appendChild(circle);
      if (hasGsap) {
        gsap.fromTo(circle, { 'stroke-dasharray': '0 ' + C }, { 'stroke-dasharray': len + ' ' + (C - len), duration: 1, ease: 'power3.out' });
      }
      offset += len;
    });

    // saldo ao centro
    var pct = Math.round((totIn - totOut) / (total || 1) * 100);
    var tl = svgEl('text', { x: cx, y: cy - 6, 'text-anchor': 'middle', class: 'axis-label' });
    tl.textContent = 'Saldo';
    var tv = svgEl('text', { x: cx, y: cy + 18, 'text-anchor': 'middle' });
    tv.setAttribute('style', 'font-family:var(--serif);font-size:24px;font-weight:600;fill:var(--ink)');
    tv.textContent = money(totIn - totOut);
    svg.appendChild(tl); svg.appendChild(tv);
    box.appendChild(svg);
  }

  /* ---------------- gráfico BARRAS (entradas por categoria) ---------------- */
  function renderBars() {
    var box = $('[data-chart-bars]');
    var list = D.getTransactions().filter(function (t) { return t.tipo === 'entrada'; });
    var byCat = {};
    list.forEach(function (t) { byCat[t.categoria] = (byCat[t.categoria] || 0) + t.total; });
    var cats = Object.keys(byCat);
    box.innerHTML = '';
    if (!cats.length) { box.innerHTML = '<p class="empty">Lance uma entrada para ver o gráfico.</p>'; return; }

    var data = cats.map(function (c) { return { cat: c, value: byCat[c] }; }).sort(function (a, b) { return b.value - a.value; });
    var max = Math.max.apply(null, data.map(function (d) { return d.value; }));

    var W = 640, H = 260, padL = 16, padR = 16, padB = 46, padT = 10;
    var plotH = H - padB - padT;
    var n = data.length;
    var gap = 18;
    var bw = Math.min(90, (W - padL - padR - gap * (n - 1)) / n);
    var step = bw + gap;
    var startX = padL + (W - padL - padR - (step * n - gap)) / 2;

    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', preserveAspectRatio: 'xMidYMid meet' });

    // linha de base
    svg.appendChild(svgEl('line', { x1: padL, y1: padT + plotH, x2: W - padR, y2: padT + plotH, stroke: 'rgba(62,43,34,.14)', 'stroke-width': 1 }));

    data.forEach(function (d, i) {
      var h = max > 0 ? (d.value / max) * plotH : 0;
      var x = startX + i * step;
      var y = padT + plotH - h;

      var bar = svgEl('rect', {
        x: x, y: y, width: bw, height: h, rx: 6, class: 'bar', fill: '#B9776E'
      });
      bar.addEventListener('mouseenter', function (e) { showTip('<strong>' + esc(d.cat) + '</strong><br>' + money(d.value), e); });
      bar.addEventListener('mousemove', moveTip);
      bar.addEventListener('mouseleave', hideTip);
      svg.appendChild(bar);

      if (hasGsap) {
        gsap.fromTo(bar, { attr: { height: 0, y: padT + plotH } }, { attr: { height: h, y: y }, duration: .9, ease: 'power3.out', delay: i * .06 });
      }

      // valor acima
      var val = svgEl('text', { x: x + bw / 2, y: y - 7, 'text-anchor': 'middle' });
      val.setAttribute('style', 'font-family:var(--serif);font-size:15px;font-weight:600;fill:var(--ink)');
      val.textContent = 'R$' + Math.round(d.value);
      svg.appendChild(val);

      // rótulo categoria
      var lbl = svgEl('text', { x: x + bw / 2, y: padT + plotH + 20, 'text-anchor': 'middle', class: 'axis-label' });
      lbl.textContent = d.cat;
      svg.appendChild(lbl);
    });

    box.appendChild(svg);
  }

  function svgEl(tag, attrs) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
    return e;
  }

  function renderDashboard() {
    populateItems();
    recalc();
    var k = renderKpis();
    renderDonut(k.totIn, k.totOut);
    renderBars();
    renderTxList();
  }

  /* ========================================================
     SERVIÇOS
     ======================================================== */
  function renderServices() {
    var box = $('[data-services-list]');
    var list = D.getServices();
    box.innerHTML = '';
    if (!list.length) { box.innerHTML = '<p class="empty">Nenhum serviço cadastrado.</p>'; return; }
    list.forEach(function (s) {
      var row = document.createElement('div');
      row.className = 'item';
      row.innerHTML =
        '<div class="item__main"><p class="item__name">' + esc(s.nome) + ' <span class="badge">' + esc(s.categoria) + '</span></p>' +
        '<p class="item__meta">' + esc(s.desc || '') + ' · ~' + (s.duracao || 60) + ' min</p></div>' +
        '<p class="item__value is-in">' + money(s.preco) + '</p>' +
        '<div class="item__actions">' +
        '<button class="icon-btn" title="Editar" data-edit><svg viewBox="0 0 24 24"><path d="M4 20h4L18 10l-4-4L4 16zM14 6l4 4"/></svg></button>' +
        '<button class="icon-btn is-danger" title="Excluir" data-del><svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button></div>';
      $('[data-edit]', row).addEventListener('click', function () { editService(s); });
      $('[data-del]', row).addEventListener('click', function () {
        D.saveServices(D.getServices().filter(function (x) { return x.id !== s.id; }));
        renderServices(); toast('Serviço removido');
      });
      box.appendChild(row);
    });
  }
  function editService(s) {
    var isNew = !s;
    openDialog(isNew ? 'Novo serviço' : 'Editar serviço', [
      { name: 'nome', label: 'Nome', value: s && s.nome, required: true },
      { name: 'categoria', label: 'Categoria', value: s && s.categoria, required: true },
      { name: 'preco', label: 'Preço (R$)', type: 'number', value: s && s.preco },
      { name: 'duracao', label: 'Duração (min)', type: 'number', step: '1', value: s ? s.duracao : 60 },
      { name: 'desc', label: 'Descrição', type: 'textarea', value: s && s.desc }
    ], function (data) {
      var list = D.getServices();
      if (isNew) {
        list.push({ id: D.uid(), nome: data.nome, categoria: data.categoria, preco: data.preco, duracao: data.duracao, desc: data.desc });
      } else {
        list = list.map(function (x) { return x.id === s.id ? Object.assign({}, x, data) : x; });
      }
      D.saveServices(list); renderServices(); toast('Serviço salvo');
    });
  }
  $('[data-add-service]').addEventListener('click', function () { editService(null); });

  /* ========================================================
     ESTOQUE (agrupado por categoria)
     ======================================================== */
  function renderStock() {
    var box = $('[data-stock-list]');
    var list = D.getStock();
    box.innerHTML = '';
    if (!list.length) { box.innerHTML = '<p class="empty">Estoque vazio.</p>'; return; }
    var cats = {};
    list.forEach(function (s) { (cats[s.categoria] = cats[s.categoria] || []).push(s); });
    Object.keys(cats).forEach(function (cat) {
      var group = document.createElement('div');
      group.className = 'cat-group';
      var totalItens = cats[cat].reduce(function (a, s) { return a + s.qtd; }, 0);
      group.innerHTML = '<div class="cat-group__head"><span>' + esc(cat) + '</span><span>' + totalItens + ' un.</span></div>';
      var listEl = document.createElement('div'); listEl.className = 'list';
      cats[cat].forEach(function (s) {
        var low = s.qtd <= s.minimo;
        var row = document.createElement('div');
        row.className = 'item';
        row.innerHTML =
          '<div class="item__main"><p class="item__name">' + esc(s.nome) +
          (low ? ' <span class="badge badge--low">repor</span>' : '') + '</p>' +
          '<p class="item__meta">' + s.qtd + ' em estoque · mín. ' + s.minimo + ' · custo ' + money(s.custo) + '</p></div>' +
          '<div class="item__actions">' +
          '<button class="icon-btn" title="−" data-minus><svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button>' +
          '<button class="icon-btn" title="+" data-plus><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>' +
          '<button class="icon-btn" title="Editar" data-edit><svg viewBox="0 0 24 24"><path d="M4 20h4L18 10l-4-4L4 16zM14 6l4 4"/></svg></button>' +
          '<button class="icon-btn is-danger" title="Excluir" data-del><svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button></div>';
        $('[data-minus]', row).addEventListener('click', function () { bumpStock(s.id, -1); });
        $('[data-plus]', row).addEventListener('click', function () { bumpStock(s.id, 1); });
        $('[data-edit]', row).addEventListener('click', function () { editStock(s); });
        $('[data-del]', row).addEventListener('click', function () {
          D.saveStock(D.getStock().filter(function (x) { return x.id !== s.id; }));
          renderStock(); toast('Item removido');
        });
        listEl.appendChild(row);
      });
      group.appendChild(listEl);
      box.appendChild(group);
    });
  }
  function bumpStock(id, delta) {
    D.saveStock(D.getStock().map(function (s) {
      return s.id === id ? Object.assign({}, s, { qtd: Math.max(0, s.qtd + delta) }) : s;
    }));
    renderStock();
  }
  function editStock(s) {
    var isNew = !s;
    openDialog(isNew ? 'Novo item de estoque' : 'Editar item', [
      { name: 'nome', label: 'Nome', value: s && s.nome, required: true },
      { name: 'categoria', label: 'Categoria', value: s && s.categoria, required: true },
      { name: 'qtd', label: 'Quantidade', type: 'number', step: '1', value: s ? s.qtd : 0 },
      { name: 'minimo', label: 'Estoque mínimo', type: 'number', step: '1', value: s ? s.minimo : 1 },
      { name: 'custo', label: 'Custo unitário (R$)', type: 'number', value: s && s.custo }
    ], function (data) {
      var list = D.getStock();
      if (isNew) list.push({ id: D.uid(), nome: data.nome, categoria: data.categoria, qtd: data.qtd, minimo: data.minimo, custo: data.custo });
      else list = list.map(function (x) { return x.id === s.id ? Object.assign({}, x, data) : x; });
      D.saveStock(list); renderStock(); toast('Estoque salvo');
    });
  }
  $('[data-add-stock]').addEventListener('click', function () { editStock(null); });

  /* ========================================================
     PRODUTOS (loja pública)
     ======================================================== */
  function renderProducts() {
    var box = $('[data-products-list]');
    var list = D.getProducts();
    box.innerHTML = '';
    if (!list.length) { box.innerHTML = '<p class="empty">Nenhum produto cadastrado.</p>'; return; }
    list.forEach(function (p) {
      var row = document.createElement('div');
      row.className = 'item';
      row.innerHTML =
        '<div class="item__main"><p class="item__name">' + esc(p.nome) + ' ' +
        (p.publico ? '<span class="badge badge--pub">no site</span>' : '<span class="badge badge--off">oculto</span>') + '</p>' +
        '<p class="item__meta">' + esc(p.categoria) + ' · ' + esc(p.desc || '') + '</p></div>' +
        '<p class="item__value">' + money(p.preco) + '</p>' +
        '<div class="item__actions">' +
        '<button class="icon-btn" title="Mostrar/ocultar no site" data-toggle><svg viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg></button>' +
        '<button class="icon-btn" title="Editar" data-edit><svg viewBox="0 0 24 24"><path d="M4 20h4L18 10l-4-4L4 16zM14 6l4 4"/></svg></button>' +
        '<button class="icon-btn is-danger" title="Excluir" data-del><svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button></div>';
      $('[data-toggle]', row).addEventListener('click', function () {
        D.saveProducts(D.getProducts().map(function (x) { return x.id === p.id ? Object.assign({}, x, { publico: !x.publico }) : x; }));
        renderProducts(); toast(p.publico ? 'Ocultado do site' : 'Publicado no site');
      });
      $('[data-edit]', row).addEventListener('click', function () { editProduct(p); });
      $('[data-del]', row).addEventListener('click', function () {
        D.saveProducts(D.getProducts().filter(function (x) { return x.id !== p.id; }));
        renderProducts(); toast('Produto removido');
      });
      box.appendChild(row);
    });
  }
  function editProduct(p) {
    var isNew = !p;
    openDialog(isNew ? 'Novo produto' : 'Editar produto', [
      { name: 'nome', label: 'Nome', value: p && p.nome, required: true },
      { name: 'categoria', label: 'Categoria', value: p && p.categoria, required: true },
      { name: 'preco', label: 'Preço (R$)', type: 'number', value: p && p.preco },
      { name: 'desc', label: 'Descrição', type: 'textarea', value: p && p.desc },
      { name: 'publico', label: 'Mostrar no site (público)', type: 'switch', value: p ? p.publico : true }
    ], function (data) {
      var list = D.getProducts();
      if (isNew) list.push({ id: D.uid(), nome: data.nome, categoria: data.categoria, preco: data.preco, desc: data.desc, publico: data.publico });
      else list = list.map(function (x) { return x.id === p.id ? Object.assign({}, x, data) : x; });
      D.saveProducts(list); renderProducts(); toast('Produto salvo');
    });
  }
  $('[data-add-product]').addEventListener('click', function () { editProduct(null); });

  /* ---------------- restaurar exemplos ---------------- */
  $('[data-reset]').addEventListener('click', function () {
    if (!confirm('Restaurar todos os dados de exemplo? Isso apaga suas alterações.')) return;
    D.resetAll();
    renderDashboard(); renderServices(); renderStock(); renderProducts();
    toast('Dados de exemplo restaurados');
  });

  /* ---------------- init ---------------- */
  renderDashboard();
  renderServices();
  renderStock();
  renderProducts();
})();
