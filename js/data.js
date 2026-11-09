/* =========================================================
   Vilma Delmiro — camada de dados compartilhada
   Usada pelo site (index.html) e pelo painel (admin.html).
   Guarda tudo no navegador (localStorage) — é um protótipo de apresentação.

   >>> PARA EDITAR OS PREÇOS/SERVIÇOS, mude DEFAULT_SERVICES abaixo. <<<
   ========================================================= */
(function () {
  'use strict';

  /* ----------------- VALORES DE EXEMPLO (edite à vontade) ----------------- */
  var DEFAULT_SERVICES = [
    { id: 'manicure',  nome: 'Manicure',             categoria: 'Mãos',        preco: 40,  duracao: 45,  desc: 'Cutilagem, formato e esmaltação impecável.' },
    { id: 'pedicure',  nome: 'Pedicure',             categoria: 'Pés',         preco: 45,  duracao: 50,  desc: 'Cuidado completo para os pés.' },
    { id: 'pe-mao',    nome: 'Pé e Mão',             categoria: 'Combo',       preco: 60,  duracao: 90,  desc: 'Manicure + pedicure no mesmo horário.' },
    { id: 'gel',       nome: 'Esmalte em Gel',       categoria: 'Mãos',        preco: 70,  duracao: 60,  desc: 'Brilho que dura semanas sem lascar.' },
    { id: 'arte',      nome: 'Arte nas Unhas',       categoria: 'Mãos',        preco: 25,  duracao: 30,  desc: 'Detalhes feitos à mão (por par).' },
    { id: 'fibra',     nome: 'Fibra de Vidro',       categoria: 'Alongamento', preco: 140, duracao: 150, desc: 'Alongamento leve e resistente. A especialidade da casa.' },
    { id: 'manut',     nome: 'Manutenção de Fibra',  categoria: 'Alongamento', preco: 90,  duracao: 90,  desc: 'Manutenção a cada 15–21 dias.' },
    { id: 'spa',       nome: 'SPA dos Pés',          categoria: 'Pés',         preco: 80,  duracao: 60,  desc: 'Esfoliação, hidratação e massagem.' }
  ];

  /* Estoque de exemplo — organizado por categoria */
  var DEFAULT_STOCK = [
    { id: 's1', nome: 'Esmalte nude rosado',      categoria: 'Esmaltes',     qtd: 8,  minimo: 3, custo: 12.0 },
    { id: 's2', nome: 'Esmalte vermelho-cereja',  categoria: 'Esmaltes',     qtd: 4,  minimo: 3, custo: 12.0 },
    { id: 's3', nome: 'Top coat brilho',          categoria: 'Esmaltes',     qtd: 2,  minimo: 3, custo: 18.0 },
    { id: 's4', nome: 'Fio de fibra de vidro',    categoria: 'Fibra & Gel',  qtd: 6,  minimo: 2, custo: 35.0 },
    { id: 's5', nome: 'Gel construtor',           categoria: 'Fibra & Gel',  qtd: 3,  minimo: 2, custo: 45.0 },
    { id: 's6', nome: 'Lixa 180 (unidade)',       categoria: 'Descartáveis', qtd: 30, minimo: 10, custo: 1.5 },
    { id: 's7', nome: 'Palito de laranjeira',     categoria: 'Descartáveis', qtd: 50, minimo: 15, custo: 0.3 },
    { id: 's8', nome: 'Alicate de cutícula',      categoria: 'Ferramentas',  qtd: 2,  minimo: 1, custo: 60.0 }
  ];

  /* Produtos à venda que aparecem PUBLICAMENTE no site (seção "Produtos") */
  var DEFAULT_PRODUCTS = [
    { id: 'p1', nome: 'Óleo para cutículas',       categoria: 'Cuidado em casa', preco: 29.9, publico: true,  desc: 'Hidrata e fortalece entre as manutenções.' },
    { id: 'p2', nome: 'Kit lixa + buffer',         categoria: 'Cuidado em casa', preco: 19.9, publico: true,  desc: 'Para manter o acabamento liso em casa.' },
    { id: 'p3', nome: 'Base fortalecedora',        categoria: 'Esmaltes',        preco: 34.9, publico: true,  desc: 'Para unhas fracas ou que descamam.' },
    { id: 'p4', nome: 'Creme nutritivo para mãos', categoria: 'Cuidado em casa', preco: 24.9, publico: false, desc: 'Em breve na loja.' }
  ];

  /* Alguns lançamentos de exemplo para o dashboard já nascer com gráfico */
  function seedTransactions() {
    var hoje = new Date();
    function d(diasAtras) { var x = new Date(hoje); x.setDate(x.getDate() - diasAtras); return x.toISOString().slice(0, 10); }
    return [
      { id: 't1', tipo: 'entrada', nome: 'Fibra de Vidro', categoria: 'Alongamento', valorUnit: 140, qtd: 1, total: 140, data: d(1) },
      { id: 't2', tipo: 'entrada', nome: 'Pé e Mão',       categoria: 'Combo',       valorUnit: 60,  qtd: 2, total: 120, data: d(1) },
      { id: 't3', tipo: 'entrada', nome: 'Manicure',       categoria: 'Mãos',        valorUnit: 40,  qtd: 3, total: 120, data: d(2) },
      { id: 't4', tipo: 'saida',   nome: 'Gel construtor', categoria: 'Fibra & Gel', valorUnit: 45,  qtd: 1, total: 45,  data: d(2) },
      { id: 't5', tipo: 'entrada', nome: 'SPA dos Pés',    categoria: 'Pés',         valorUnit: 80,  qtd: 1, total: 80,  data: d(3) },
      { id: 't6', tipo: 'entrada', nome: 'Esmalte em Gel', categoria: 'Mãos',        valorUnit: 70,  qtd: 2, total: 140, data: d(4) }
    ];
  }

  /* ----------------- infraestrutura ----------------- */
  var KEY = {
    services: 'vd.services',
    stock: 'vd.stock',
    products: 'vd.products',
    transactions: 'vd.transactions'
  };

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }
  function uid() { return 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function money(v) {
    return 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /* Inicializa na primeira visita */
  if (read(KEY.services, null) === null) write(KEY.services, DEFAULT_SERVICES);
  if (read(KEY.stock, null) === null) write(KEY.stock, DEFAULT_STOCK);
  if (read(KEY.products, null) === null) write(KEY.products, DEFAULT_PRODUCTS);
  if (read(KEY.transactions, null) === null) write(KEY.transactions, seedTransactions());

  /* ----------------- API pública ----------------- */
  var API = {
    money: money,
    uid: uid,

    // Serviços
    getServices: function () { return read(KEY.services, DEFAULT_SERVICES); },
    saveServices: function (list) { write(KEY.services, list); },
    getServiceById: function (id) { return this.getServices().filter(function (s) { return s.id === id; })[0] || null; },

    // Estoque
    getStock: function () { return read(KEY.stock, DEFAULT_STOCK); },
    saveStock: function (list) { write(KEY.stock, list); },

    // Produtos (loja pública)
    getProducts: function () { return read(KEY.products, DEFAULT_PRODUCTS); },
    getPublicProducts: function () { return this.getProducts().filter(function (p) { return p.publico; }); },
    saveProducts: function (list) { write(KEY.products, list); },

    // Lançamentos (entradas/saídas)
    getTransactions: function () { return read(KEY.transactions, []); },
    saveTransactions: function (list) { write(KEY.transactions, list); },

    // Restaura tudo para os exemplos
    resetAll: function () {
      write(KEY.services, DEFAULT_SERVICES);
      write(KEY.stock, DEFAULT_STOCK);
      write(KEY.products, DEFAULT_PRODUCTS);
      write(KEY.transactions, seedTransactions());
    }
  };

  window.VD_DATA = API;
})();
