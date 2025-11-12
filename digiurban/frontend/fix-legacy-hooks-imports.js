const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔍 Procurando arquivos com imports de hooks legados...\n');

// Buscar todos os arquivos com imports de hooks legados
const grepResult = execSync(
  `grep -r "from '@/hooks/api" --include="*.tsx" --include="*.ts" app/ components/ lib/ 2>/dev/null || true`,
  { cwd: __dirname, encoding: 'utf-8' }
);

if (!grepResult.trim()) {
  console.log('✅ Nenhum import de hook legado encontrado!');
  process.exit(0);
}

const lines = grepResult.trim().split('\n');
const fileImports = {};

// Agrupar imports por arquivo
lines.forEach(line => {
  const match = line.match(/^([^:]+):(.+)$/);
  if (match) {
    const [, filepath, content] = match;
    if (!fileImports[filepath]) {
      fileImports[filepath] = [];
    }
    fileImports[filepath].push(content.trim());
  }
});

console.log(`📄 Encontrados ${Object.keys(fileImports).length} arquivos com imports legados\n`);

// Processar cada arquivo
Object.entries(fileImports).forEach(([filepath, imports]) => {
  console.log(`\n📝 ${filepath}`);
  console.log(`   Imports legados: ${imports.length}`);

  try {
    let content = fs.readFileSync(filepath, 'utf-8');
    let modified = false;

    // Comentar cada import de hook legado
    imports.forEach(importLine => {
      // Verificar se já não está comentado
      if (!importLine.startsWith('//')) {
        const escapedImport = importLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`^(\\s*)${escapedImport}`, 'gm');

        if (content.match(regex)) {
          content = content.replace(
            regex,
            `$1// LEGADO: ${importLine}`
          );
          modified = true;
          console.log(`   ✅ Comentado: ${importLine.substring(0, 60)}...`);
        }
      }
    });

    // Se o arquivo foi modificado, salvar
    if (modified) {
      fs.writeFileSync(filepath, content, 'utf-8');
      console.log(`   💾 Arquivo atualizado`);
    } else {
      console.log(`   ⏭️  Nenhuma mudança necessária`);
    }

  } catch (error) {
    console.error(`   ❌ Erro ao processar: ${error.message}`);
  }
});

console.log('\n✅ Processamento concluído!');
