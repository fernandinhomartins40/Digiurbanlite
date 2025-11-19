const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];
const inputSVG = path.join(__dirname, '../public/icon.svg');
const outputDir = path.join(__dirname, '../public');

async function generateIcons() {
  console.log('🎨 Gerando ícones PWA...\n');

  // Verificar se o SVG existe
  if (!fs.existsSync(inputSVG)) {
    console.error('❌ Erro: icon.svg não encontrado em /public/');
    process.exit(1);
  }

  // Gerar ícones em todos os tamanhos
  for (const size of sizes) {
    const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);

    try {
      await sharp(inputSVG)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputFile);

      console.log(`✅ Gerado: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`❌ Erro ao gerar icon-${size}x${size}.png:`, error.message);
    }
  }

  // Gerar apple-touch-icon (180x180)
  try {
    await sharp(inputSVG)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 15, g: 111, b: 190, alpha: 1 } // Fundo azul #0f6fbe
      })
      .png()
      .toFile(path.join(outputDir, 'apple-touch-icon.png'));

    console.log('✅ Gerado: apple-touch-icon.png');
  } catch (error) {
    console.error('❌ Erro ao gerar apple-touch-icon.png:', error.message);
  }

  // Gerar favicon.ico (32x32)
  try {
    await sharp(inputSVG)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(path.join(outputDir, 'favicon.png'));

    console.log('✅ Gerado: favicon.png');
  } catch (error) {
    console.error('❌ Erro ao gerar favicon.png:', error.message);
  }

  console.log('\n✨ Todos os ícones foram gerados com sucesso!\n');
  console.log('📁 Localização: digiurban/frontend/public/');
  console.log('📊 Total de ícones: ' + (sizes.length + 2));
}

generateIcons().catch(console.error);
