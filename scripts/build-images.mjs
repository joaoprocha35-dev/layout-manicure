// Converte as fotos originais (fotos-unhas/*.png) para WebP na estrutura assets/.
// Uso: npm run images
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'fotos-unhas';
const OUT = 'assets';

// [arquivo de origem, destino sem extensão, larguras extras (srcset)]
const MAP = [
  // HERO
  ['hero.png', 'hero/hero-desktop', [1000]],
  ['Mãos delicadas sobre linho creme-1.png', 'hero/hero-mobile', [600]],

  // SERVIÇOS (somente os que não estão na galeria)
  ['Pedicure nude em toalha creme-11.png', 'servicos/pedicure', [560]],
  ['Spa dos pés com nail art delicada-13.png', 'servicos/spa-dos-pes', [560]],

  // GALERIA: alternância vertical (V, 4:5) / quadrada (S, 1:1)
  ['Unhas de fibra rosadas com flores delicadas-5.png', 'galeria/01-fibra-de-vidro', [560]], // V
  ['Unhas esmeralda sobre tricô creme-7.png', 'galeria/02-esmeralda', [560]],                // S
  ['Unhas lilás com brilho opalescente-4.png', 'galeria/03-lilas-opalescente', [560]],      // V
  ['Unhas vermelho-cereja em mão elegante-15.png', 'galeria/04-vermelho-cereja', [560]],    // S
  ['Unhas nude naturais em luz suave-6.png', 'galeria/05-nude-natural', [560]],             // S
  ['Manicure francesa clássica com toalha marfim-3.png', 'galeria/06-french-classic', [560]], // V
  ['Manicure coral em luz suave-12.png', 'galeria/07-coral', [560]],                       // S
  ['Brilho vinho sobre linho creme-9.png', 'galeria/08-vinho', [560]],                     // V
  ['Manicure preta sob luz suave-10.png', 'galeria/09-preto', [560]],                      // V
  ['Unhas rosa blush em toalha creme-8.png', 'galeria/10-blush-rose', [560]],               // S
  ['Unhas rose gold sobre cetim suave-16.png', 'galeria/11-rose-gold', [560]],              // V
  ['Unhas menta em almofada marfim-14.png', 'galeria/12-menta', [560]],                    // S
];

const MAX_W = 1000; // largura máxima das imagens que não são hero

for (const [file, dest, extras] of MAP) {
  const input = path.join(SRC, file);
  const isHero = dest.startsWith('hero/');
  const outBase = path.join(OUT, dest);
  fs.mkdirSync(path.dirname(outBase), { recursive: true });

  const meta = await sharp(input).metadata();
  const mainW = isHero ? meta.width : Math.min(MAX_W, meta.width);

  await sharp(input).resize({ width: mainW }).webp({ quality: 80, effort: 6 }).toFile(`${outBase}.webp`);
  for (const w of extras) {
    await sharp(input).resize({ width: w }).webp({ quality: 76, effort: 6 }).toFile(`${outBase}-${w}.webp`);
  }
  const h = Math.round((meta.height * mainW) / meta.width);
  console.log(`${dest}.webp  ${mainW}x${h}`);
}
