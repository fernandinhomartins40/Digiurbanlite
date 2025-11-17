const fs = require('fs');
const path = require('path');

const departmentMapping = {
  'assistencia-social.ts': 'social-assistance',
  'cultura.ts': 'culture',
  'educacao.ts': 'education',
  'esportes.ts': 'sports',
  'habitacao.ts': 'housing',
  'meio-ambiente.ts': 'environment',
  'obras-publicas.ts': 'public-works',
  'planejamento-urbano.ts': 'urban-planning',
  'saude.ts': 'health',
  'seguranca-publica.ts': 'public-security',
  'servicos-publicos.ts': 'public-services',
  'turismo.ts': 'tourism'
};

const configsDir = path.join(__dirname, 'lib', 'module-configs');

Object.entries(departmentMapping).forEach(([filename, departmentType]) => {
  const filepath = path.join(configsDir, filename);

  if (!fs.existsSync(filepath)) {
    console.log(`⚠️  Arquivo não encontrado: ${filename}`);
    return;
  }

  let content = fs.readFileSync(filepath, 'utf-8');
  let modified = false;

  // Encontrar configs sem departmentType
  // Padrão: key: 'algo',\n  entityName:
  const pattern = /(export const \w+Config: ModuleConfig = \{\s+key: '[^']+',\s+)(entityName:)/g;

  content = content.replace(pattern, (match, before, entityName) => {
    // Verificar se departmentType já existe nos próximos 200 caracteres
    const nextChars = content.substring(content.indexOf(match), content.indexOf(match) + 500);
    if (nextChars.includes('departmentType:')) {
      return match; // Já tem, não modificar
    }

    modified = true;
    return `${before}departmentType: '${departmentType}',\n  ${entityName}`;
  });

  if (modified) {
    fs.writeFileSync(filepath, content, 'utf-8');
    console.log(`✅ ${filename}: departmentType adicionado`);
  } else {
    console.log(`⏭️  ${filename}: nenhuma mudança necessária`);
  }
});

console.log('\n✅ Correção concluída!');
