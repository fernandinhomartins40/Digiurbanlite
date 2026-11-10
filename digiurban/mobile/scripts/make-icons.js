// Monta as imagens de origem em assets/ a partir do ícone do PWA (frontend/public/icon.svg).
// Depois o @capacitor/assets gera todos os tamanhos de Android e iOS (npm run assets).
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svg = fs.readFileSync(path.join(__dirname, '..', '..', 'frontend', 'public', 'icon.svg'), 'utf8');
const OUT = path.join(__dirname, '..', 'assets');
const defs = svg.match(/<defs>[\s\S]*<\/defs>/)[0];
const letter = svg.match(/<path class="st0"[\s\S]*?\/>/)[0];
const wrap = (body, bg = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${defs}${bg}${body}</svg>`;
const square = '<rect class="st1" width="512" height="512"/>'; // sem cantos: a loja/sistema recorta
const png = (s, size) => sharp(Buffer.from(s), { density: 300 }).resize(size, size).png();

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  // iOS e lojas: quadrado cheio, sem transparência
  await png(wrap(letter, square), 1024).flatten({ background: '#0f6fbe' }).toFile(path.join(OUT, 'icon-only.png'));
  // Android adaptativo: o "D" encolhido para caber na área segura do recorte
  await png(wrap(`<g transform="translate(256 256) scale(0.82) translate(-271 -256)">${letter}</g>`), 1024)
    .toFile(path.join(OUT, 'icon-foreground.png'));
  await png(wrap('', square), 1024).toFile(path.join(OUT, 'icon-background.png'));
  // Abertura: fundo #0f6fbe com o ícone do PWA (cantos redondos) no centro
  const logo = await png(svg, 640).toBuffer();
  for (const name of ['splash.png', 'splash-dark.png']) {
    await sharp({ create: { width: 2732, height: 2732, channels: 4, background: '#0f6fbe' } })
      .composite([{ input: logo, gravity: 'center' }]).png().toFile(path.join(OUT, name));
  }
  console.log('assets/ gerado');
})().catch((e) => { console.error(e); process.exit(1); });
