# Layout Manicure — Protótipo

Protótipo de site para **manicures e estúdios de unhas**, criado como modelo de apresentação (exemplo: Vilma Delmiro, especialista em fibra de vidro).

## O que tem
- Hero com foto editorial (versões para computador e celular)
- Serviços, galeria de inspirações em mosaico, diferenciais, depoimentos (exemplo), dúvidas e rodapé
- Questionário de agendamento em etapas, com respostas em caixinhas, que envia tudo pronto para o WhatsApp
- Rolagem suave e animações com GSAP (ScrollTrigger + ScrollSmoother)

## Tecnologias
HTML, SCSS, JavaScript e GSAP.

## Como usar
Abra o `index.html` no navegador. Para editar estilos:

```bash
npm install
npm run watch:css   # ou npm run build:css
```

Antes de usar com uma cliente real, troque o número do WhatsApp em `js/booking.js`, os depoimentos, horários e endereço.

> As imagens da galeria são ilustrações geradas digitalmente, usadas apenas como referência de estilo.
