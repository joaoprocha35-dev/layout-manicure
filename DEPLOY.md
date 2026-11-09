# Deploy — Site da Vilma Delmiro

Site **100% estático** (HTML + CSS + JS). **Não precisa de build no servidor** — é só servir a pasta.

## ℹ️ Protótipo de demonstração
Sem domínio personalizado: o site usa o endereço que a hospedagem gerar (ex.: `xxx.netlify.app`).
Por isso não há `canonical`, `sitemap.xml` nem URLs absolutas. O WhatsApp configurado é `14998813787`.
O painel (`admin.html`) fica **aberto** de propósito (é demonstração, sem login).

## ✅ Verificado
- **60 FPS** parado e rolando (0 quadros ruins medidos).
- **Zero erros de console** e **zero requisições 404** (site e painel).
- **Sem rolagem horizontal** em 360, 390, 768, 1024, 1366 e 1920px.
- Caminhos **relativos** — funciona em qualquer domínio ou subpasta.
- `css/main.css` já compilado e versionado (o servidor não roda SASS).
- Vídeo com `poster` + imagem de apoio (se o autoplay for bloqueado, não fica vazio).
- Animações respeitam `prefers-reduced-motion`.

## 📦 Peso
| Item | Antes | Agora |
|---|---|---|
| Vídeo da hero | 12,1 MB | **1,2 MB** (WebM) / 2,0 MB (MP4) |
| Imagens | 1,6 MB | 1,5 MB |
| **Projeto publicável** | ~50 MB | **~5 MB** |

O navegador baixa **só um** vídeo: WebM no Chrome/Firefox/Edge, MP4 no Safari.

## 📂 O que subir

```
index.html   admin.html   robots.txt   .nojekyll
css/   js/   assets/
```

**Não precisa subir:** `otimizacao/`, `scss/`, `node_modules/`, `package*.json`, `*.md`.
(São ferramentas e código-fonte; não afetam o site no ar.)

## 🚀 Como publicar

**Netlify / Vercel (mais fácil)**
1. Arraste a pasta em [app.netlify.com/drop](https://app.netlify.com/drop) — ou conecte o repositório.
2. Sem comando de build. Publish directory = raiz (`.`).

**GitHub Pages**
1. Commite tudo (o `.mp4`/`.webm` incluídos).
2. Settings → Pages → Branch `main` / pasta `/ (root)`.
3. O `.nojekyll` (já incluído) evita que o Jekyll atrapalhe.

**Hospedagem comum / cPanel**
- Suba os arquivos da lista acima para `public_html`.

## ✍️ Conteúdo real (antes de divulgar)
- Preços e serviços: `js/data.js` → `DEFAULT_SERVICES`.
- Depoimentos, números (anos, atendimentos, nota), endereço e horários: `index.html`.
- Links de Instagram e WhatsApp no rodapé.
- No JSON-LD do `index.html`, vale adicionar o endereço real (`address`) — ajuda muito no Google Maps.
- O painel (`admin.html`) guarda dados no navegador (localStorage); é demonstração, sem login,
  e fica acessível de propósito.

## ♻️ Manutenção

```bash
npm install          # só na primeira vez
npm run build:css    # depois de editar qualquer arquivo em scss/
```

Para mídia nova, veja `otimizacao/README.md` (scripts Python de compressão).
