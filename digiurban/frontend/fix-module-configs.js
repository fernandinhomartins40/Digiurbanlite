const fs = require('fs');
const path = require('path');

// Mapeamento de arquivos -> departmentType
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

  // Regex para encontrar todas as configs exportadas
  const configRegex = /export const (\w+Config): ModuleConfig = \{([^}]+key: '([^']+)',)/g;

  let match;
  const matches = [];

  // Primeiro, coletar todas as correspondências
  while ((match = configRegex.exec(content)) !== null) {
    matches.push({
      configName: match[1],
      key: match[3],
      startIndex: match.index,
      fullMatch: match[0]
    });
  }

  console.log(`\n📄 ${filename} (${matches.length} configs)`);

  // Para cada config encontrada, verificar se precisa adicionar campos
  matches.forEach(({ configName, key, startIndex, fullMatch }) => {
    // Procurar o texto após o key até encontrar displayName
    const afterKey = content.substring(startIndex + fullMatch.length);
    const displayNameMatch = afterKey.match(/displayName: '([^']+)'/);

    if (!displayNameMatch) {
      console.log(`  ⚠️  ${configName}: displayName não encontrado`);
      return;
    }

    const displayName = displayNameMatch[1];

    // Gerar displayNameSingular a partir do displayName
    let displayNameSingular = displayName;
    if (displayName.endsWith('s')) {
      // Remover 's' final (ex: "Produtores Rurais" -> "Produtor Rural")
      displayNameSingular = displayName.replace(/(\w+)s\b/g, '$1');
    }
    if (displayName.includes(' - ')) {
      // Ex: "Atendimentos - Saúde" -> "Atendimento - Saúde"
      displayNameSingular = displayName.replace(/Atendimentos/g, 'Atendimento');
    }

    // Verificar se já tem departmentType
    const hasDepartmentType = content.includes(`departmentType: '${departmentType}'`);

    // Verificar se já tem displayNameSingular
    const hasDisplayNameSingular = afterKey.substring(0, 500).includes('displayNameSingular:');

    if (!hasDepartmentType || !hasDisplayNameSingular) {
      // Encontrar a posição correta para inserir (após entityName, antes de displayName)
      const entityNamePos = content.indexOf(`entityName: '`, startIndex);
      if (entityNamePos === -1) {
        console.log(`  ⚠️  ${configName}: entityName não encontrado`);
        return;
      }

      // Encontrar o final da linha de entityName
      const lineEnd = content.indexOf('\n', entityNamePos);
      const insertPos = lineEnd + 1;

      // Construir o texto a inserir
      let insertText = '';
      if (!hasDepartmentType) {
        insertText += `  departmentType: '${departmentType}',\n`;
      }

      // Inserir no conteúdo
      if (insertText) {
        content = content.substring(0, insertPos) + insertText + content.substring(insertPos);
        modified = true;
        console.log(`  ✅ ${configName}: Adicionado departmentType`);
      }

      // Agora adicionar displayNameSingular após displayName
      const displayNamePos = content.indexOf(`displayName: '${displayName}'`, insertPos);
      if (displayNamePos !== -1 && !hasDisplayNameSingular) {
        const displayLineEnd = content.indexOf('\n', displayNamePos);
        const singularInsertPos = displayLineEnd + 1;

        const singularText = `  displayNameSingular: '${displayNameSingular}',\n`;
        content = content.substring(0, singularInsertPos) + singularText + content.substring(singularInsertPos);
        modified = true;
        console.log(`  ✅ ${configName}: Adicionado displayNameSingular`);
      }
    } else {
      console.log(`  ⏭️  ${configName}: Já possui todos os campos`);
    }
  });

  if (modified) {
    fs.writeFileSync(filepath, content, 'utf-8');
    console.log(`  💾 Arquivo salvo`);
  }
});

console.log('\n✅ Correção concluída!');
