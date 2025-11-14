/**
 * Script para remover campos de dados pessoais das sugestões de serviços
 * Esses campos já são preenchidos automaticamente pelo perfil do cidadão
 */

const fs = require('fs');
const path = require('path');

// Campos que devem ser removidos (dados pessoais que vêm do perfil)
const PERSONAL_FIELD_PATTERNS = [
  // Variações de nome
  /^nome(_.*)?$/i,
  /^nome_completo$/i,
  /^nome_paciente$/i,
  /^nome_gestante$/i,
  /^nome_responsavel$/i,
  /^nome_crianca$/i,
  /^nome_beneficiario$/i,
  /^nome_solicitante$/i,
  /^nome_participante$/i,

  // CPF
  /^cpf$/i,
  /^cpf_responsavel$/i,
  /^cpf_solicitante$/i,

  // RG
  /^rg$/i,
  /^rg_numero$/i,

  // Telefone
  /^telefone$/i,
  /^telefone_contato$/i,
  /^telefone_residencial$/i,
  /^telefone_celular$/i,
  /^celular$/i,

  // Email
  /^email$/i,
  /^email_contato$/i,

  // Endereço (componentes)
  /^endereco$/i,
  /^endereco_completo$/i,
  /^rua$/i,
  /^logradouro$/i,
  /^numero$/i,
  /^complemento$/i,
  /^bairro$/i,
  /^cidade$/i,
  /^estado$/i,
  /^uf$/i,
  /^cep$/i,
];

// Campos que devem ser mantidos SEMPRE (mesmo que pareçam pessoais)
const KEEP_FIELD_PATTERNS = [
  /^data_nascimento$/i, // Às vezes necessário para cálculo de idade
  /^numero_.*$/i, // Ex: numero_protocolo, numero_cartao_sus (não é endereço)
  /^nome_.*_mae$/i, // Nome da mãe (necessário em alguns serviços)
];

function shouldRemoveField(fieldName) {
  // Se estiver na lista de "manter", não remove
  for (const keepPattern of KEEP_FIELD_PATTERNS) {
    if (keepPattern.test(fieldName)) {
      return false;
    }
  }

  // Se bater com padrão de campo pessoal, remove
  for (const pattern of PERSONAL_FIELD_PATTERNS) {
    if (pattern.test(fieldName)) {
      return true;
    }
  }

  return false;
}

function cleanSuggestions(filePath) {
  console.log(`\n🔍 Processando: ${path.basename(filePath)}`);

  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  let totalRemoved = 0;

  // Regex para encontrar blocos suggestedFields
  const fieldBlockRegex = /suggestedFields:\s*\[([\s\S]*?)\]/g;

  content = content.replace(fieldBlockRegex, (match, fieldsContent) => {
    const lines = fieldsContent.split('\n');
    const cleanedLines = [];
    let removedInBlock = 0;

    for (const line of lines) {
      // Extrair nome do campo
      const nameMatch = line.match(/name:\s*['"]([^'"]+)['"]/);

      if (nameMatch) {
        const fieldName = nameMatch[1];

        if (shouldRemoveField(fieldName)) {
          console.log(`   ❌ Removendo: ${fieldName}`);
          removedInBlock++;
          totalRemoved++;
          modified = true;
          continue; // Pula essa linha
        }
      }

      cleanedLines.push(line);
    }

    if (removedInBlock > 0) {
      console.log(`   ✓ ${removedInBlock} campos removidos neste bloco`);
    }

    return `suggestedFields: [${cleanedLines.join('\n')}]`;
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Arquivo atualizado! Total de campos removidos: ${totalRemoved}`);
  } else {
    console.log(`⏭️  Nenhuma alteração necessária`);
  }

  return totalRemoved;
}

async function main() {
  console.log('🧹 REMOVENDO CAMPOS DE DADOS PESSOAIS DAS SUGESTÕES');
  console.log('='.repeat(60));

  const suggestionsDir = path.join(__dirname, 'digiurban', 'frontend', 'lib', 'suggestions');

  const files = [
    'agricultura.ts',
    'assistencia-social.ts',
    'cultura.ts',
    'educacao.ts',
    'esportes.ts',
    'habitacao.ts',
    'meio-ambiente.ts',
    'obras-publicas.ts',
    'planejamento-urbano.ts',
    'saude.ts',
    'seguranca-publica.ts',
    'servicos-publicos.ts',
    'turismo.ts',
  ];

  let grandTotal = 0;

  for (const file of files) {
    const filePath = path.join(suggestionsDir, file);

    if (fs.existsSync(filePath)) {
      const removed = cleanSuggestions(filePath);
      grandTotal += removed;
    } else {
      console.log(`\n⚠️  Arquivo não encontrado: ${file}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ LIMPEZA CONCLUÍDA!');
  console.log('='.repeat(60));
  console.log(`🗑️  Total de campos removidos: ${grandTotal}`);
  console.log('='.repeat(60) + '\n');

  console.log('📋 Campos que foram removidos (padrões):');
  console.log('   • Variações de nome (nome, nome_paciente, nome_completo, etc.)');
  console.log('   • CPF e RG');
  console.log('   • Telefone e email');
  console.log('   • Endereço completo e componentes');
  console.log('\n✅ Esses campos serão preenchidos automaticamente do perfil do cidadão!\n');
}

main()
  .then(() => {
    console.log('✅ Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });
