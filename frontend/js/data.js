/* =========================================================
   Vilma Delmiro — camada de dados compartilhada
   Usada pelo site (index.html) e pelo painel (admin.html).
   Guarda tudo no navegador (localStorage) — é um protótipo de apresentação.

   >>> PARA EDITAR OS PREÇOS/SERVIÇOS, mude DEFAULT_SERVICES abaixo
       e suba DATA_VERSION (assim o navegador troca os valores antigos). <<<
   ========================================================= */
(function () {
  'use strict';

  /* ----------------- TABELA OFICIAL DA VILMA -----------------
     Fonte: tabela de preços impressa da Vilma Delmiro.
     categoria: 'Tradicionais' | 'Em Gel' | 'Adicionais'
     duracao:   minutos (null = não informado; o site não mostra o tempo)
     nota:      complemento do preço ("aplicação", "a mais", "o par"...)
     img:       foto do card (sem img = aparece na lista de adicionais)
     ------------------------------------------------------------- */
  var G = 'assets/galeria/', S = 'assets/servicos/';
  var DEFAULT_SERVICES = [
    // ---- Serviços tradicionais ----
    { id: 'mao',        nome: 'Mão',                categoria: 'Tradicionais', preco: 45, duracao: 45,   icon: 'polish', img: G + '05-nude-natural',    desc: 'Cutilagem, formato e esmaltação impecável.' },
    { id: 'pe',         nome: 'Pé',                 categoria: 'Tradicionais', preco: 55, duracao: 50,   icon: 'foot',   img: S + 'pedicure',           desc: 'Cuidado completo para os pés.' },
    { id: 'pe-mao',     nome: 'Pé e Mão',           categoria: 'Tradicionais', preco: 80, duracao: 90,   icon: 'lotus',  img: G + '10-blush-rose',      desc: 'Mão + pé no mesmo horário.' },
    { id: 'spa',        nome: 'Spa dos Pés',        categoria: 'Tradicionais', preco: 40, duracao: 60,   icon: 'lotus',  img: S + 'spa-dos-pes',        desc: 'Esfoliação, hidratação e massagem relaxante.' },
    { id: 'esmaltacao', nome: 'Somente Esmaltação', categoria: 'Tradicionais', preco: 15, duracao: null, icon: 'drop',   img: G + '04-vermelho-cereja', desc: 'Troca de cor com acabamento caprichado.' },

    // ---- Serviços em gel ----
    { id: 'alongamento', nome: 'Alongamento em Gel',          categoria: 'Em Gel', preco: 180, nota: 'aplicação', duracao: 150, icon: 'layers',  img: G + '06-french-classic',    desc: 'Fibra de vidro ou tips: leve, resistente e natural.' },
    { id: 'manut-15',    nome: 'Manutenção (15 a 22 dias)',   categoria: 'Em Gel', preco: 110, duracao: 90,   icon: 'refresh', img: G + '01-fibra-de-vidro',    desc: 'Preserva a durabilidade e a beleza do alongamento.' },
    { id: 'manut-23',    nome: 'Manutenção (23 a 30 dias)',   categoria: 'Em Gel', preco: 120, duracao: 90,   icon: 'refresh', img: G + '11-rose-gold',         desc: 'Para quem passou um pouco do prazo ideal.' },
    { id: 'gel',         nome: 'Esmaltação em Gel',           categoria: 'Em Gel', preco: 70,  duracao: 60,   icon: 'drop',    img: G + '08-vinho',             desc: 'Brilho intenso e longa duração.' },
    { id: 'blindagem',   nome: 'Blindagem',                   categoria: 'Em Gel', preco: 80,  duracao: null, icon: 'shield',  img: G + '03-lilas-opalescente', desc: 'Camada de gel que fortalece a unha natural.' },
    { id: 'banho-gel',   nome: 'Banho de Gel c/ Cuticulagem', categoria: 'Em Gel', preco: 110, duracao: null, icon: 'sparkle', img: G + '12-menta',             desc: 'Gel sobre a unha natural, com cutilagem completa.' },
    { id: 'manut-gel',   nome: 'Manutenção de Gel',           categoria: 'Em Gel', preco: 70,  duracao: null, icon: 'refresh', img: G + '02-esmeralda',         desc: 'Manutenção da blindagem ou do banho de gel.' },
    { id: 'remocao',     nome: 'Remoção do Alongamento',      categoria: 'Em Gel', preco: 90,  nota: 'com blindagem', duracao: null, icon: 'heart', img: G + '09-preto', desc: 'Remoção cuidadosa, finalizada com blindagem.' },

    // ---- Adicionais (lista, sem foto) ----
    { id: 'reposicao', nome: 'Reposição de Unhas Quebradas',   categoria: 'Adicionais', preco: 20, duracao: null, desc: 'Por unha.' },
    { id: 'decoracao', nome: 'Decoração de Unhas Encapsulada', categoria: 'Adicionais', preco: 20, nota: 'o par', duracao: null, desc: 'Arte protegida dentro do gel.' },
    { id: 'francesa',  nome: 'Francesa Encapsulada',           categoria: 'Adicionais', preco: 25, nota: 'a mais', duracao: null, desc: 'Somada ao valor do alongamento.' },
    { id: 'top-coat',  nome: 'Top Coat em Gel',                categoria: 'Adicionais', preco: 10, nota: 'no esmalte normal', duracao: null, desc: 'Mais brilho e durabilidade no esmalte comum.' },
    { id: 'joias',     nome: 'Jóias',                          categoria: 'Adicionais', preco: 8,  nota: 'o par', duracao: null, desc: 'Pedrarias aplicadas à mão.' },
    { id: 'adesivos',  nome: 'Adesivos',                       categoria: 'Adicionais', preco: 7,  nota: 'o par', duracao: null, desc: 'Detalhes delicados para personalizar.' }
  ];

  /* Ordem das categorias no site e no painel */
  var CATEGORIES = ['Tradicionais', 'Em Gel', 'Adicionais'];

  /* Informações oficiais (folheto "Informações importantes") */
  var INFO = {
    telefones: ['(14) 99767-0868', '(14) 98168-7986'],
    whatsapp: '5514997670868',
    pix: '(14) 99767-0868',
    pagamento: 'PIX e cartão de crédito (com acréscimo da máquina).',
    cancelamento: 'Clientes que não desmarcarem com antecedência serão cobradas em 50% do valor do procedimento.'
  };

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
      { id: 't1', tipo: 'entrada', nome: 'Alongamento em Gel', categoria: 'Em Gel', valorUnit: 180, qtd: 1, total: 180, data: d(1) },
      { id: 't2', tipo: 'entrada', nome: 'Pé e Mão', categoria: 'Tradicionais', valorUnit: 80, qtd: 2, total: 160, data: d(1) },
      { id: 't3', tipo: 'entrada', nome: 'Mão', categoria: 'Tradicionais', valorUnit: 45, qtd: 3, total: 135, data: d(2) },
      { id: 't4', tipo: 'saida',   nome: 'Gel construtor', categoria: 'Fibra & Gel', valorUnit: 45,  qtd: 1, total: 45,  data: d(2) },
      { id: 't5', tipo: 'entrada', nome: 'Spa dos Pés', categoria: 'Tradicionais', valorUnit: 40, qtd: 1, total: 40,  data: d(3) },
      { id: 't6', tipo: 'entrada', nome: 'Esmaltação em Gel', categoria: 'Em Gel', valorUnit: 70, qtd: 2, total: 140, data: d(4) }
    ];
  }

  /* ----------------- infraestrutura ----------------- */
  var KEY = {
    services: 'vd.services',
    stock: 'vd.stock',
    products: 'vd.products',
    transactions: 'vd.transactions',
    version: 'vd.version'
  };

  /* Suba este número quando a tabela oficial mudar: força o navegador
     a trocar os preços antigos que ficaram guardados. */
  var DATA_VERSION = 2;

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

  /* Inicializa na primeira visita (ou quando a tabela oficial muda) */
  if (read(KEY.version, 0) < DATA_VERSION) {
    write(KEY.services, DEFAULT_SERVICES);
    write(KEY.version, DATA_VERSION);
  }
  if (read(KEY.stock, null) === null) write(KEY.stock, DEFAULT_STOCK);
  if (read(KEY.products, null) === null) write(KEY.products, DEFAULT_PRODUCTS);
  if (read(KEY.transactions, null) === null) write(KEY.transactions, seedTransactions());

  /* ----------------- API pública ----------------- */
  var API = {
    money: money,
    uid: uid,
    categories: CATEGORIES,
    info: INFO,

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
      write(KEY.version, DATA_VERSION);
      write(KEY.stock, DEFAULT_STOCK);
      write(KEY.products, DEFAULT_PRODUCTS);
      write(KEY.transactions, seedTransactions());
    }
  };

  window.VD_DATA = API;
})();
