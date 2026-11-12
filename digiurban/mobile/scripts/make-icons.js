// Monta as imagens de origem em assets/ a partir do ícone novo (assets/icon-master.png: "D" ciano→azul
// sobre azul-marinho). Depois o @capacitor/assets gera todos os tamanhos de Android e iOS (npm run assets).
// Também gera, recortando o "D" do mesmo desenho, o ícone dos avisos e o ícone de uma cor do Android.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const MASTER = path.join(ROOT, 'assets', 'icon-master.png');
const OUT = path.join(ROOT, 'assets');
const RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');
const NAVY = '#011552';
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

// O "D" é a parte clara: azul forte (o fundo e o brilho em volta ficam bem abaixo)
async function letterMask(size) {
  const { data, info } = await sharp(MASTER).resize(size, size).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const alpha = Buffer.alloc(info.width * info.height);
  for (let i = 0; i < alpha.length; i++) {
    const b = data[i * 3 + 2];
    alpha[i] = Math.max(0, Math.min(255, (b - 170) * 4)); // borda suave
  }
  return sharp({ create: { width: size, height: size, channels: 3, background: '#ffffff' } }).joinChannel(alpha, { raw: { width: size, height: size, channels: 1 } });
}

// Ícone branco de fundo transparente, com o "D" ocupando `fill` do lado
async function whiteIcon(dp, fill, name, folder) {
  const trimmed = await (await letterMask(1024)).png().toBuffer().then((b) => sharp(b).trim().toBuffer());
  for (const [density, scale] of Object.entries(DENSITIES)) {
    const px = Math.round(dp * scale);
    const inner = Math.round(px * fill);
    const letter = await sharp(trimmed).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
    const dir = path.join(RES, `${folder}-${density}`);
    fs.mkdirSync(dir, { recursive: true });
    await sharp({ create: { width: px, height: px, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: letter, gravity: 'center' }]).png().toFile(path.join(dir, `${name}.png`));
  }
}

(async () => {
  // iOS e lojas: quadrado cheio, sem transparência
  await sharp(MASTER).resize(1024, 1024).flatten({ background: NAVY }).png().toFile(path.join(OUT, 'icon-only.png'));
  // Android adaptativo: fundo = o desenho inteiro; frente vazia (o "D" já está no centro, dentro da área segura)
  await sharp(MASTER).resize(1024, 1024).flatten({ background: NAVY }).png().toFile(path.join(OUT, 'icon-background.png'));
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toFile(path.join(OUT, 'icon-foreground.png'));
  // Abertura: azul-marinho com o ícone no centro
  const logo = await sharp(MASTER).resize(900, 900).png().toBuffer();
  for (const name of ['splash.png', 'splash-dark.png']) {
    await sharp({ create: { width: 2732, height: 2732, channels: 4, background: NAVY } })
      .composite([{ input: logo, gravity: 'center' }]).png().toFile(path.join(OUT, name));
  }
  // Avisos (barra de status): 24dp, "D" com folga; ícone de uma cor (Android 13+): 108dp, "D" na área segura
  await whiteIcon(24, 0.84, 'ic_stat_digiurban', 'drawable');
  await whiteIcon(108, 0.5, 'ic_launcher_monochrome', 'drawable');
  console.log('assets/ e ícones brancos gerados');
})().catch((e) => { console.error(e); process.exit(1); });
