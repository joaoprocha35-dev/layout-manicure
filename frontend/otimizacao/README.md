# Otimização de mídia

Scripts em Python para deixar vídeos e imagens leves **sem perder qualidade visível**.
Rode-os sempre que adicionar mídia nova ao site.

## Instalar (uma vez só)

```bash
pip install Pillow imageio-ffmpeg
```

> `imageio-ffmpeg` já traz o ffmpeg embutido — não precisa instalar nada à parte.

## Vídeos

```bash
python otimizacao/otimizar_videos.py
```

O que ele faz:
- **Remove o áudio** (vídeo de fundo é mudo — áudio é peso puro).
- Reencoda em **H.264 com CRF** (qualidade constante, menor tamanho).
- Gera também um **WebM/VP9**, ainda menor, para navegadores modernos.
- Liga o **faststart** (começa a tocar antes de baixar tudo).
- Guarda o original em `otimizacao/originais/`.

Opções úteis:

| Opção | Para quê |
|---|---|
| `--qualidade 24` | mais qualidade (arquivo maior). Padrão: 26 |
| `--largura 1280` | reduz a resolução |
| `--simular` | mostra o plano sem alterar nada |

**Resultado obtido neste projeto:** `12,1 MB → 1,2 MB` (WebM) / `2,0 MB` (MP4) — **90% menor**.

No HTML, use as duas fontes (o navegador escolhe a melhor):

```html
<source src="assets/hero/video.webm" type="video/webm">
<source src="assets/hero/video.mp4"  type="video/mp4">
```

## Imagens

```bash
python otimizacao/otimizar_imagens.py
```

O que ele faz:
- Converte/recomprime em **WebP** com a compressão mais caprichada (`method=6`).
- Remove metadados (EXIF).
- Limita a **largura máxima** (padrão 1600px) — não adianta servir 4000px.
- **Só substitui se economizar mais de 3%**, então é seguro rodar de novo.
- Guarda os originais em `otimizacao/originais/`.

Opções: `--qualidade 85`, `--largura-maxima 1200`, `--simular`.

**Resultado obtido neste projeto:** `1,6 MB → 1,5 MB` (as imagens já estavam bem otimizadas).

## Pasta `originais/`

Guarda uma cópia de tudo que foi otimizado, **antes** da compressão.
Está no `.gitignore` — não vai para o GitHub nem para o deploy.
Se um resultado não agradar, é só copiar o arquivo de volta e rodar com outra qualidade.
