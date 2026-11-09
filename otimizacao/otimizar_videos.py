#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Otimizador de vídeos para a web — site da Vilma Delmiro.

O que faz:
  1. Remove a faixa de áudio (vídeos de fundo são mudos — é peso puro).
  2. Reencoda em H.264 com CRF (qualidade constante), que entrega o menor
     tamanho possível para a qualidade escolhida.
  3. Gera também uma versão WebM/VP9, bem menor, usada pelos navegadores
     modernos — o .mp4 fica como alternativa (Safari antigo).
  4. Ativa "faststart": o vídeo começa a tocar antes de baixar inteiro.
  5. Guarda o arquivo original em otimizacao/originais/ (nada é perdido).

Uso:
    python otimizacao/otimizar_videos.py                 # otimiza assets/
    python otimizacao/otimizar_videos.py --qualidade 24  # mais qualidade
    python otimizacao/otimizar_videos.py --simular       # só mostra o plano

Requer:  pip install imageio-ffmpeg
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PASTA_ORIGINAIS = Path(__file__).resolve().parent / "originais"
EXTENSOES = {".mp4", ".mov", ".m4v", ".avi", ".mkv"}


def localizar_ffmpeg() -> str:
    """Devolve o caminho do ffmpeg (do pacote imageio-ffmpeg ou do sistema)."""
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        caminho = shutil.which("ffmpeg")
        if caminho:
            return caminho
        sys.exit(
            "ERRO: ffmpeg nao encontrado.\n"
            "Instale com:  pip install imageio-ffmpeg"
        )


def formatar_tamanho(num_bytes: float) -> str:
    for unidade in ("B", "KB", "MB", "GB"):
        if abs(num_bytes) < 1024:
            return f"{num_bytes:.1f} {unidade}"
        num_bytes /= 1024
    return f"{num_bytes:.1f} TB"


def rodar(comando: list[str]) -> bool:
    resultado = subprocess.run(
        comando, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
    )
    if resultado.returncode != 0:
        print("   ! falhou:")
        print("   " + "\n   ".join(resultado.stdout.strip().splitlines()[-6:]))
        return False
    return True


def comando_mp4(ffmpeg: str, entrada: Path, saida: Path, crf: int, escala: int | None) -> list[str]:
    cmd = [ffmpeg, "-y", "-i", str(entrada), "-an"]
    if escala:
        # largura fixa, altura automática (par, exigido pelo H.264)
        cmd += ["-vf", f"scale={escala}:-2:flags=lanczos"]
    cmd += [
        "-c:v", "libx264",
        "-crf", str(crf),
        "-preset", "slow",
        "-profile:v", "high",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        str(saida),
    ]
    return cmd


def comando_webm(ffmpeg: str, entrada: Path, saida: Path, crf: int, escala: int | None) -> list[str]:
    cmd = [ffmpeg, "-y", "-i", str(entrada), "-an"]
    if escala:
        cmd += ["-vf", f"scale={escala}:-2:flags=lanczos"]
    cmd += [
        "-c:v", "libvpx-vp9",
        "-crf", str(crf),
        "-b:v", "0",
        "-row-mt", "1",
        "-deadline", "good",
        "-cpu-used", "2",
        "-pix_fmt", "yuv420p",
        str(saida),
    ]
    return cmd


def otimizar(video: Path, ffmpeg: str, crf_mp4: int, crf_webm: int,
             escala: int | None, simular: bool) -> tuple[int, int]:
    tamanho_antes = video.stat().st_size
    print(f"\n-> {video.relative_to(RAIZ)}  ({formatar_tamanho(tamanho_antes)})")

    if simular:
        print("   [simulacao] geraria .mp4 (H.264) e .webm (VP9), sem audio")
        return tamanho_antes, tamanho_antes

    PASTA_ORIGINAIS.mkdir(parents=True, exist_ok=True)
    backup = PASTA_ORIGINAIS / video.name
    if not backup.exists():
        shutil.copy2(video, backup)
        print(f"   original guardado em {backup.relative_to(RAIZ)}")

    temp_mp4 = video.with_suffix(".otimizado.mp4")
    saida_webm = video.with_suffix(".webm")

    print(f"   codificando H.264 (CRF {crf_mp4}, sem audio)...")
    if not rodar(comando_mp4(ffmpeg, backup, temp_mp4, crf_mp4, escala)):
        return tamanho_antes, tamanho_antes

    print(f"   codificando VP9/WebM (CRF {crf_webm})...")
    webm_ok = rodar(comando_webm(ffmpeg, backup, saida_webm, crf_webm, escala))

    # só troca se realmente ficou menor
    if temp_mp4.stat().st_size < tamanho_antes:
        temp_mp4.replace(video)
    else:
        print("   (mp4 otimizado nao ficou menor — mantendo o original)")
        temp_mp4.unlink(missing_ok=True)

    tamanho_mp4 = video.stat().st_size
    tamanho_webm = saida_webm.stat().st_size if (webm_ok and saida_webm.exists()) else 0

    print(f"   mp4 : {formatar_tamanho(tamanho_antes)} -> {formatar_tamanho(tamanho_mp4)}"
          f"  ({100 - tamanho_mp4 * 100 / tamanho_antes:.0f}% menor)")
    if tamanho_webm:
        print(f"   webm: {formatar_tamanho(tamanho_webm)}"
              f"  ({100 - tamanho_webm * 100 / tamanho_antes:.0f}% menor)")

    # o navegador baixa só UM: o webm quando suportado, senao o mp4
    return tamanho_antes, min(tamanho_mp4, tamanho_webm or tamanho_mp4)


def main() -> None:
    p = argparse.ArgumentParser(description="Otimiza videos para a web (menor tamanho, mesma qualidade visual).")
    p.add_argument("--pasta", default="assets", help="pasta a varrer (padrao: assets)")
    p.add_argument("--qualidade", type=int, default=26,
                   help="CRF do H.264: menor = mais qualidade e mais peso (padrao: 26)")
    p.add_argument("--qualidade-webm", type=int, default=34, help="CRF do VP9 (padrao: 34)")
    p.add_argument("--largura", type=int, default=None,
                   help="redimensiona para esta largura (ex.: 1280). Padrao: mantem")
    p.add_argument("--simular", action="store_true", help="mostra o que faria, sem alterar")
    args = p.parse_args()

    alvo = (RAIZ / args.pasta).resolve()
    if not alvo.exists():
        sys.exit(f"ERRO: pasta nao encontrada: {alvo}")

    ffmpeg = localizar_ffmpeg()
    videos = sorted(
        v for v in alvo.rglob("*")
        if v.suffix.lower() in EXTENSOES and PASTA_ORIGINAIS not in v.parents
    )

    if not videos:
        print(f"Nenhum video encontrado em {alvo}")
        return

    print("=" * 62)
    print(f"OTIMIZADOR DE VIDEOS — {len(videos)} arquivo(s) em {args.pasta}/")
    print("=" * 62)

    total_antes = total_depois = 0
    for v in videos:
        antes, depois = otimizar(v, ffmpeg, args.qualidade, args.qualidade_webm,
                                 args.largura, args.simular)
        total_antes += antes
        total_depois += depois

    print("\n" + "=" * 62)
    print(f"TOTAL: {formatar_tamanho(total_antes)} -> {formatar_tamanho(total_depois)}")
    if total_antes and not args.simular:
        print(f"Economia: {formatar_tamanho(total_antes - total_depois)} "
              f"({100 - total_depois * 100 / total_antes:.0f}% menor)")
        print("\nLembre-se de usar as duas fontes no HTML:")
        print('  <source src="....webm" type="video/webm">')
        print('  <source src="....mp4"  type="video/mp4">')
    print("=" * 62)


if __name__ == "__main__":
    main()
