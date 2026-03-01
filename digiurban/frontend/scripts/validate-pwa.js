const fs = require('fs');
const path = require('path');

console.log('🔍 Validando configuração PWA...\n');

let errors = 0;
let warnings = 0;

// Verificar manifest.json
const manifestPath = path.join(__dirname, '../public/manifest.json');
if (fs.existsSync(manifestPath)) {
  console.log('✅ manifest.json encontrado');

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    // Verificar campos obrigatórios
    const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
    requiredFields.forEach(field => {
      if (!manifest[field]) {
        console.error(`❌ Campo obrigatório ausente no manifest: ${field}`);
        errors++;
      } else {
        console.log(`   ✓ ${field}: OK`);
      }
    });

    // Verificar ícones
    if (manifest.icons && Array.isArray(manifest.icons)) {
      console.log(`   ✓ ${manifest.icons.length} ícones declarados`);

      // Verificar se ícones 192 e 512 existem
      const has192 = manifest.icons.some(icon => icon.sizes === '192x192');
      const has512 = manifest.icons.some(icon => icon.sizes === '512x512');

      if (!has192) {
        console.warn('⚠️  Ícone 192x192 não encontrado (recomendado)');
        warnings++;
      }
      if (!has512) {
        console.warn('⚠️  Ícone 512x512 não encontrado (recomendado)');
        warnings++;
      }
    }

    // Verificar theme_color
    if (manifest.theme_color) {
      console.log(`   ✓ theme_color: ${manifest.theme_color}`);
    } else {
      console.warn('⚠️  theme_color não definido');
      warnings++;
    }

    if (manifest.screenshots && Array.isArray(manifest.screenshots)) {
      manifest.screenshots.forEach((screenshot) => {
        const screenshotPath = path.join(__dirname, '../public', screenshot.src.replace(/^\//, ''));
        if (fs.existsSync(screenshotPath)) {
          console.log(`   ✓ screenshot encontrado: ${screenshot.src}`);
        } else {
          console.warn(`⚠️  Screenshot referenciado não encontrado: ${screenshot.src}`);
          warnings++;
        }
      });
    }

  } catch (error) {
    console.error('❌ Erro ao ler manifest.json:', error.message);
    errors++;
  }
} else {
  console.error('❌ manifest.json não encontrado');
  errors++;
}

console.log('');

// Verificar ícones
const iconSizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];
console.log('📱 Verificando ícones...');

iconSizes.forEach(size => {
  const iconPath = path.join(__dirname, `../public/icon-${size}x${size}.png`);
  if (fs.existsSync(iconPath)) {
    console.log(`✅ icon-${size}x${size}.png`);
  } else {
    console.warn(`⚠️  icon-${size}x${size}.png não encontrado`);
    warnings++;
  }
});

// Verificar apple-touch-icon
const appleTouchIcon = path.join(__dirname, '../public/apple-touch-icon.png');
if (fs.existsSync(appleTouchIcon)) {
  console.log('✅ apple-touch-icon.png');
} else {
  console.warn('⚠️  apple-touch-icon.png não encontrado (necessário para iOS)');
  warnings++;
}

console.log('');

// Verificar icon.svg
const iconSVG = path.join(__dirname, '../public/icon.svg');
if (fs.existsSync(iconSVG)) {
  console.log('✅ icon.svg encontrado');
} else {
  console.error('❌ icon.svg não encontrado');
  errors++;
}

console.log('');

// Verificar offline.html
const offlineHTML = path.join(__dirname, '../public/offline.html');
if (fs.existsSync(offlineHTML)) {
  console.log('✅ offline.html encontrado');
} else {
  console.warn('⚠️  offline.html não encontrado (opcional)');
  warnings++;
}

console.log('');

// Verificar next.config.js
const nextConfig = path.join(__dirname, '../next.config.js');
if (fs.existsSync(nextConfig)) {
  console.log('✅ next.config.js encontrado');

  const configContent = fs.readFileSync(nextConfig, 'utf8');
  if (configContent.includes('withPWA')) {
    console.log('   ✓ withPWA configurado');
  } else {
    console.error('❌ withPWA não encontrado em next.config.js');
    errors++;
  }
} else {
  console.error('❌ next.config.js não encontrado');
  errors++;
}

console.log('');

// Verificar componente InstallPWABanner
const bannerComponent = path.join(__dirname, '../components/citizen/InstallPWABanner.tsx');
if (fs.existsSync(bannerComponent)) {
  console.log('✅ InstallPWABanner.tsx encontrado');
} else {
  console.warn('⚠️  InstallPWABanner.tsx não encontrado');
  warnings++;
}

console.log('');

// Verificar app/layout.tsx
const appLayout = path.join(__dirname, '../app/layout.tsx');
if (fs.existsSync(appLayout)) {
  console.log('✅ app/layout.tsx encontrado');

  const layoutContent = fs.readFileSync(appLayout, 'utf8');

  if (layoutContent.includes('manifest:')) {
    console.log('   ✓ Link para manifest configurado');
  } else {
    console.error('❌ Link para manifest não encontrado em metadata');
    errors++;
  }

  if (layoutContent.includes('appleWebApp:')) {
    console.log('   ✓ Meta tags iOS configuradas');
  } else {
    console.warn('⚠️  Meta tags iOS não encontradas');
    warnings++;
  }

  if (layoutContent.includes('themeColor:')) {
    console.log('   ✓ Theme color configurado');
  } else {
    console.warn('⚠️  Theme color não encontrado em viewport');
    warnings++;
  }
} else {
  console.error('❌ app/layout.tsx não encontrado');
  errors++;
}

console.log('');
console.log('─'.repeat(50));
console.log('');

// Resumo
if (errors === 0 && warnings === 0) {
  console.log('✨ PWA configurado perfeitamente!');
  console.log('🚀 Pronto para produção!\n');
  process.exit(0);
} else if (errors === 0) {
  console.log(`⚠️  PWA configurado com ${warnings} avisos`);
  console.log('✅ Funcional, mas pode ser melhorado\n');
  process.exit(0);
} else {
  console.log(`❌ ${errors} erros encontrados`);
  console.log(`⚠️  ${warnings} avisos`);
  console.log('🔧 Corrija os erros antes de fazer deploy\n');
  process.exit(1);
}
