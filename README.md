# Layout Manicure — Protótipo

Protótipo de site para **manicures e estúdios de unhas**, criado como modelo de apresentação
(exemplo: Vilma Delmiro, especialista em fibra de vidro).

## O que tem

### Site (`index.html`)
- **Hero em vídeo** cinematográfico (WebM + MP4), com imagem de apoio e `poster`
- Fundo em **degradê contínuo** — as seções se fundem umas nas outras
- **Fita rosa** em zigue-zague com as palavras-chave, atravessando a página
- Tira de números, **faixa rosa animada**, serviços, **preços**, galeria,
  diferenciais, depoimentos, **produtos**, dúvidas e rodapé
- **Modal de agendamento preto/rosa**: procedimento + calendário + horário + valor na tela
- Cursor personalizado no desktop, rolagem suave (GSAP ScrollSmoother)
- **60 FPS** parado e rolando

### Painel (`admin.html`)
Link no rodapé do site. Dados no navegador (localStorage), sem login — é demonstração.
- **Caixa**: entradas e saídas (categoria × quantidade = total na hora), KPIs e gráficos
- **Serviços e preços**: alimentam o site e o caixa
- **Estoque**: por categoria, com alerta de reposição
- **Produtos**: marque “público” para aparecer no site

## Onde editar

| O quê | Arquivo |
|---|---|
| **Preços e serviços** | `js/data.js` → `DEFAULT_SERVICES` |
| Estoque / produtos de exemplo | `js/data.js` → `DEFAULT_STOCK`, `DEFAULT_PRODUCTS` |
| Estilos do site | `scss/` → `npm run build:css` |
| Estilos do painel | `css/admin.css` (CSS puro, sem build) |

> Para zerar tudo e voltar aos exemplos: botão **“Restaurar exemplos”** no painel.

## Estrutura

```
index.html  admin.html        páginas
css/  js/  assets/            o que vai para o ar
scss/                         fonte dos estilos (compila para css/main.css)
otimizacao/                   scripts Python para comprimir vídeo e imagem
```

## Tecnologias
HTML, SCSS, JavaScript e GSAP (ScrollTrigger + ScrollSmoother).
Gráficos em SVG feitos à mão, sem dependências.

## Como usar

```bash
npm install
npm run watch:css   # ou npm run build:css
```

Abra o `index.html` no navegador.

- **Publicar:** veja [`DEPLOY.md`](DEPLOY.md)
- **Comprimir mídia nova:** veja [`otimizacao/README.md`](otimizacao/README.md)

> As imagens da galeria são ilustrações geradas digitalmente, usadas como referência de estilo.
> Antes de usar com uma cliente real, troque depoimentos, números, horários, endereço e preços.
