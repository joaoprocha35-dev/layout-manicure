# Redesign — Vilma Delmiro · Nail Designer

## 1. Estrutura de pastas

```text
site-manicure/
├── frontend/                ← diretório raiz do projeto na Vercel
│   ├── assets/
│   │   ├── galeria/         fotos dos trabalhos (+ versões -560)
│   │   ├── hero/            vídeo da hero (webm + mp4) e imagem de apoio
│   │   ├── servicos/        pedicure / spa dos pés
│   │   ├── vilma.webp       foto da Vilma (900px)  ← gerada de vilma.png
│   │   └── vilma-560.webp   foto da Vilma (560px)
│   ├── css/                 main.css (compilado do scss) e admin.css (CSS puro)
│   ├── js/                  data.js, pricing.js, schedule.js, main.js, admin.js, vendor/ (GSAP)
│   ├── scss/                fonte dos estilos do site
│   ├── otimizacao/          scripts Python de compressão de mídia
│   ├── index.html  admin.html  robots.txt  vercel.json  package.json
│   └── REDESIGN.md  DEPLOY.md
├── .gitignore
└── README.md
```

`assets/vilma.png` (2,2 MB) fica fora do Git; o site usa as versões `.webp` geradas a partir dela.

## 2. Seções e arquivos

| Seção | HTML (`index.html`) | Estilo (`scss/`) | Lógica (`js/`) |
|---|---|---|---|
| Tela de abertura | `.loader` | `_loader.scss` | `main.js` §1 |
| Navbar horizontal | `.nav` | `_nav.scss` | `main.js` §3 |
| Hero com vídeo + faixa de credibilidade | `#topo` | `_hero.scss` | `main.js` §2, §9 |
| Faixa preta animada | `.ticker` | `_hero.scss` | `main.js` §4 |
| Serviços | `#servicos` | `_services.scss` | `pricing.js` (“Ver valores”) |
| Trabalhos (filtros + lightbox) | `#trabalhos` | `_gallery.scss` | `main.js` §7 |
| Preços (abas) + Informações importantes | `#precos` | `_prices.scss` | `pricing.js` |
| Sobre a Vilma | `#sobre` | `_about.scss` | `main.js` §5 |
| Produtos | `#produtos` | `_products.scss` | `pricing.js` |
| Depoimentos + Dúvidas | `#depoimentos`, `#duvidas` | `_voices.scss` | `main.js` §8 |
| CTA final + Footer | `.cta`, `.footer` | `_footer.scss` | — |
| Modal de agendamento | `#agendar` | `_modal.scss` | `schedule.js` |
| Painel da Vilma | `admin.html` | `css/admin.css` | `admin.js` |

**Preços e serviços** vêm de `js/data.js` → `DEFAULT_SERVICES` (tabela oficial impressa da Vilma).
Ao mudar a tabela, **suba `DATA_VERSION`** — assim o navegador das clientes troca os valores antigos guardados.

## 3. Navbar

- Pílula flutuante fixa, compacta (62px) e um pouco abaixo do topo. Sobre a hero o fundo é **transparente** (o vídeo aparece por trás); ao rolar ganha vidro bege/rosa para manter a leitura.
- A “corcova” central em SVG (`.nav__bump`) continua no código, desligada no ajuste final (bloco “AJUSTE” no fim de `_nav.scss`).
- Esquerda: Início · Serviços · Trabalhos. Centro: logo. Direita: Preços · Dúvidas · **Agendar horário**.
- “Produtos” saiu do menu (a seção continua na página).
- Selo **“Manicure há mais de 30 anos”** como etiqueta pendurada sob o logo (não é botão).
- Item ativo: sublinhado rosé, controlado por `ScrollTrigger` conforme a seção visível.
- Ao rolar, `.is-scrolled` reduz a altura e reforça a sombra.
- Abaixo de 1200px: barra compacta (logo + Agendar + menu) com painel animado contendo todos os itens e o selo.

## 4. Ondas entre as seções

- Cada seção termina com um `<svg class="wave">` (`viewBox 0 0 1440 150`, `preserveAspectRatio="none"`) pintado com a **cor da próxima seção** (`--wave-fill`), então uma seção “flui” para dentro da outra.
- Curvas Bézier diferentes e assimétricas em cada transição.
- Linha rosé gold opcional (`.wave__line`, gradiente `#gold-stroke`, `vector-effect: non-scaling-stroke`) nas transições claras; ela é “desenhada” ao entrar na tela.
- A faixa preta usa uma “cauda” SVG própria (`.ticker__tail`); o CTA usa `.wave--top` (onda invertida sobre a foto).
- As seções usam `overflow-x: clip`: nada vaza para os lados no celular.

## 5. Animações (GSAP 3 — `js/vendor/`)

- **Abertura** (1× por sessão, `sessionStorage`): anel rosé gold desenhado, letras V e D traçadas e preenchidas, sparkle, nome letra a letra (SplitText), painel sobe com borda em onda (morph do `path`). Tem failsafe em CSS (some sozinha em 6 s se o JS falhar).
- **Hero**: zoom suave do vídeo, linhas do título em cascata, traço “à mão” sob *do seu jeito*, botões e faixa de credibilidade.
- **Scroll**: títulos palavra a palavra (SplitText), cards em cascata (`ScrollTrigger.batch`), foto da Vilma revelada com recorte + parallax, selo girando, ramos botânicos desenhados.
- **Galeria**: filtros com **GSAP Flip**, lightbox com setas/teclado.
- **Preços**: abas com pílula deslizante; “Ver valores” abre a aba certa e destaca o card.
- **Botões** (sutil): leve elevação, brilho que atravessa, seta que avança; botões principais levemente “magnéticos” no desktop.
- Faixa preta: loop contínuo com GSAP, desacelera no hover e pausa fora da tela.
- `prefers-reduced-motion`: sem abertura, sem animações, tudo visível.

## 6. Executar

```bash
cd frontend
npm ci              # instala dependências (sass, gsap, sharp, puppeteer-core)
npm run build       # copia o GSAP para js/vendor e compila o CSS
npm run watch:css   # enquanto edita o scss
```

Abra `index.html` com um servidor estático (ex.: extensão Live Server) — `admin.html` é o painel.

## 7. Deploy na Vercel

- **Root Directory: `frontend`** (Project Settings → General).
- Framework: *Other* · sem Build Command · Output Directory `.` (já em `frontend/vercel.json`).
- `css/main.css` e `js/vendor/` estão versionados: o servidor não precisa compilar nada.

## 8. Pendências reais

- **Depoimentos**: os 4 textos são exemplos (marcados como “Exemplo”). Trocar por avaliações reais, com autorização.
- **Instagram**: falta o @ real (o link do rodapé aponta para instagram.com).
- **Horários** (seg–sex 9h–19h, sáb 9h–14h) e **endereço**: confirmar com a Vilma.
- **Duração** dos serviços novos da tabela (blindagem, banho de gel, remoção, adicionais) não foi informada — o site não mostra tempo para eles. Dá para preencher no painel.
- “**Manutenção R$ 70**” (último item da tabela em gel) foi cadastrado como *Manutenção de Gel* (blindagem / banho de gel) — confirmar o nome com a Vilma.
- Produtos não têm fotos: usam ilustrações em SVG até haver fotos reais.
- O painel guarda os dados só no navegador (localStorage) e não tem login.
