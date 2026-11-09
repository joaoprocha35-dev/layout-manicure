#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Otimizador de imagens para a web — site da Vilma Delmiro.

O que faz:
  1. Converte/recomprime em WebP, que é bem menor que PNG e JPG
     mantendo a mesma aparência.
  2. Usa "method=6" (compressão mais caprichada do WebP) e remove
     metadados (EXIF) que só ocupam espaço.
  3. Limita a largura máxima — não adianta servir 4000px se o site
     mostra no máximo ~1000px.
  4. Só substitui o arquivo se o novo ficar REALMENTE menor.
  5. Guarda os originais em otimizacao/originais/ (nada é perdido).

Uso:
    python otimizacao/otimizar_imagens.py                    # otimiza assets/
    python otimizacao/otimizar_imagens.py --qualidade 85
    python otimizacao/otimizar_imagens.py --simular          # só relatório

Requer:  pip install Pillow
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("ERRO: Pillow nao instalado.\nInstale com:  pip install Pillow")

RAIZ = Path(__file__).resolve().parent.parent
PASTA_ORIGINAIS = Path(__file__).resolve().parent / "originais"
EXTENSOES = {".png", ".jpg", ".jpeg", ".webp"}
GANHO_MINIMO = 0.03  # só troca se economizar mais de 3%


def formatar_tamanho(num_bytes: float) -> str:
    for unidade in ("B", "KB", "MB", "GB"):
        if abs(num_bytes) < 1024:
            return f"{num_bytes:.1f} {unidade}"
        num_bytes /= 1024
    return f"{num_bytes:.1f} TB"


def otimizar(caminho: Path, qualidade: int, largura_max: int | None,
             simular: bool) -> tuple[int, int]:
    tamanho_antes = caminho.stat().st_size

    try:
        with Image.open(caminho) as img:
            img.load()
            largura_original = img.width
            # converte para um modo que o WebP aceita bem
            if img.mode in ("P", "LA", "RGBA"):
                img = img.convert("RGBA")
            elif img.mode != "RGB":
                img = img.convert("RGB")

            if largura_max and img.width > largura_max:
                nova_altura = round(img.height * largura_max / img.width)
                img = img.resize((largura_max, nova_altura), Image.LANCZOS)

            destino = caminho.with_suffix(".webp")
            temporario = caminho.with_suffix(".tmp.webp")

            if simular:
                print(f"   [simulacao] {caminho.name} ({formatar_tamanho(tamanho_antes)})"
                      f" -> WebP q{qualidade}")
                return tamanho_antes, tamanho_antes

            img.save(temporario, "WEBP", quality=qualidade, method=6)
    except Exception as erro:  # arquivo corrompido, formato exótico etc.
        print(f"   ! {caminho.name}: {erro}")
        return tamanho_antes, tamanho_antes

    tamanho_depois = temporario.stat().st_size
    ganho = (tamanho_antes - tamanho_depois) / tamanho_antes

    if ganho <= GANHO_MINIMO:
        temporario.unlink(missing_ok=True)
        print(f"   = {caminho.name:<34} {formatar_tamanho(tamanho_antes):>9}  (ja otimizado)")
        return tamanho_antes, tamanho_antes

    PASTA_ORIGINAIS.mkdir(parents=True, exist_ok=True)
    backup = PASTA_ORIGINAIS / caminho.name
    if not backup.exists():
        shutil.copy2(caminho, backup)

    temporario.replace(destino)
    if destino != caminho:
        caminho.unlink(missing_ok=True)  # trocou png/jpg por webp

    extra = f"  [{largura_original}px -> {largura_max}px]" if (largura_max and largura_original > largura_max) else ""
    print(f"   v {caminho.name:<34} {formatar_tamanho(tamanho_antes):>9}"
          f" -> {formatar_tamanho(tamanho_depois):>9}  (-{ganho * 100:.0f}%){extra}")
    return tamanho_antes, tamanho_depois


def main() -> None:
    p = argparse.ArgumentParser(description="Otimiza imagens para a web (WebP).")
    p.add_argument("--pasta", default="assets", help="pasta a varrer (padrao: assets)")
    p.add_argument("--qualidade", type=int, default=82,
                   help="qualidade WebP 0-100 (padrao: 82 — otimo equilibrio)")
    p.add_argument("--largura-maxima", type=int, default=1600,
                   help="largura maxima em px (padrao: 1600)")
    p.add_argument("--simular", action="store_true", help="mostra o que faria, sem alterar")
    args = p.parse_args()

    alvo = (RAIZ / args.pasta).resolve()
    if not alvo.exists():
        sys.exit(f"ERRO: pasta nao encontrada: {alvo}")

    imagens = sorted(
        i for i in alvo.rglob("*")
        if i.suffix.lower() in EXTENSOES and PASTA_ORIGINAIS not in i.parents
    )
    if not imagens:
        print(f"Nenhuma imagem encontrada em {alvo}")
        return

    print("=" * 70)
    print(f"OTIMIZADOR DE IMAGENS — {len(imagens)} arquivo(s) em {args.pasta}/")
    print(f"qualidade={args.qualidade}  largura maxima={args.largura_maxima}px")
    print("=" * 70)

    total_antes = total_depois = 0
    for img in imagens:
        antes, depois = otimizar(img, args.qualidade, args.largura_maxima, args.simular)
        total_antes += antes
        total_depois += depois

    print("=" * 70)
    print(f"TOTAL: {formatar_tamanho(total_antes)} -> {formatar_tamanho(total_depois)}")
    if total_antes and not args.simular:
        economia = total_antes - total_depois
        print(f"Economia: {formatar_tamanho(economia)} "
              f"({economia * 100 / total_antes:.0f}% menor)")
    print("=" * 70)


if __name__ == "__main__":
    main()
