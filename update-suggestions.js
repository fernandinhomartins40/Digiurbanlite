const fs = require('fs');
const path = require('path');

// Mapeamento de códigos de departamento
const DEPARTMENT_CODES = {
  'agricultura': 'AGRICULTURA',
  'assistencia-social': 'ASSISTENCIA_SOCIAL',
  'cultura': 'CULTURA',
  'educacao': 'EDUCACAO',
  'esportes': 'ESPORTES',
  'habitacao': 'HABITACAO',
  'meio-ambiente': 'MEIO_AMBIENTE',
  'obras-publicas': 'OBRAS_PUBLICAS',
  'planejamento-urbano': 'PLANEJAMENTO_URBANO',
  'saude': 'SAUDE',
  'seguranca-publica': 'SEGURANCA_PUBLICA',
  'servicos-publicos': 'SERVICOS_PUBLICOS',
  'turismo': 'TURISMO'
};

// Duplicações a remover
const DUPLICATES_TO_REMOVE = {
  'agricultura': ['Cadastro de Produtor Rural', 'Emissão de DAP', 'Solicitação de Assistência Técnica', 'Cadastro em Programa de Agricultura Familiar', 'Solicitação de Mudas e Sementes'],
  'assistencia-social': ['Cadastro Único (CadÚnico)', 'Solicitação de Cesta Básica'],
  'cultura': ['Cadastro de Artista Local', 'Inscrição em Ponto de Cultura', 'Solicitação de Espaço Cultural', 'Cadastro em Lei de Incentivo à Cultura', 'Inscrição em Oficina Cultural'],
  'educacao': ['Matrícula Escolar', 'Transferência Escolar', 'Solicitação de Transporte Escolar', 'Histórico Escolar', 'Declaração de Escolaridade', 'Solicitação de Uniforme Escolar'],
  'esportes': ['Inscrição em Escolinha de Esportes', 'Reserva de Quadra Esportiva'],
  'habitacao': ['Inscrição em Programa Habitacional', 'Solicitação de Regularização Fundiária', 'Cadastro para Reforma Habitacional'],
  'meio-ambiente': ['Licença Ambiental', 'Denúncia Ambiental', 'Autorização para Poda de Árvores', 'Solicitação de Coleta Seletiva'],
  'planejamento-urbano': ['Certidão de Zoneamento', 'Aprovação de Projeto Arquitetônico', 'Alvará de Construção'],
  'saude': ['Agendamento de Consulta', 'Solicitação de Medicamento', 'Cartão SUS'],
  'seguranca-publica': ['Registro de Ocorrência'],
  'servicos-publicos': ['Solicitação de Iluminação Pública'],
  'turismo': ['Cadastro de Estabelecimento Turístico', 'Cadastro de Guia Turístico', 'Registro de Evento Turístico']
};

const suggestionsDir = path.join(__dirname, 'digiurban', 'frontend', 'lib', 'suggestions');

// Cores padrão por categoria
const COLORS = {
  'Agendamento': '#3b82f6',
  'Cadastro': '#10b981',
  'Licenciamento': '#f59e0b',
  'Informativo': '#6b7280',
  'Eventos': '#ec4899',
  'default': '#3b82f6'
};

function getServiceSubtype(suggestion) {
  const name = suggestion.name.toLowerCase();

  // Pagamento
  if (name.includes('pagamento') || name.includes('taxa') || name.includes('boleto')) {
    return 'ServiceSubtype.PAGAMENTO';
  }

  // Consultivo (SEM_DADOS)
  if (!suggestion.requiresDocuments) {
    return 'ServiceSubtype.CONSULTIVO';
  }

  // COM_DADOS - baseado em complexidade
  const fieldCount = suggestion.suggestedFields ? suggestion.suggestedFields.length : 0;

  if (fieldCount > 6) {
    return 'ServiceSubtype.CAPTURA_COMPLETA';
  } else {
    return 'ServiceSubtype.SOLICITACAO_SIMPLES';
  }
}

function getServiceType(serviceSubtype) {
  return serviceSubtype === 'ServiceSubtype.CONSULTIVO'
    ? 'ServiceType.SEM_DADOS'
    : 'ServiceType.COM_DADOS';
}

function getPriority(category) {
  const highPriority = ['Agendamento', 'Urgência', 'Emergência'];
  const mediumPriority = ['Cadastro', 'Licenciamento', 'Solicitação'];

  if (highPriority.some(c => category.includes(c))) return 4;
  if (mediumPriority.some(c => category.includes(c))) return 3;
  return 2;
}

function getColor(category) {
  return COLORS[category] || COLORS.default;
}

function processFile(fileName) {
  const filePath = path.join(suggestionsDir, fileName + '.ts');
  const departmentCode = DEPARTMENT_CODES[fileName];
  const duplicatesToRemove = DUPLICATES_TO_REMOVE[fileName] || [];

  console.log(`\n📝 Processando ${fileName}.ts...`);

  let content = fs.readFileSync(filePath, 'utf8');

  // Atualizar imports
  if (!content.includes('ServiceType')) {
    content = content.replace(
      "import { ServiceSuggestion } from './types';",
      "import { ServiceSuggestion, ServiceType, ServiceSubtype } from './types';"
    );
  }

  // Processar cada sugestão
  const createdAt = new Date().toISOString();
  let suggestionsProcessed = 0;
  let duplicatesRemoved = 0;

  // Encontrar array de sugestões
  const arrayMatch = content.match(/export const \w+Suggestions: ServiceSuggestion\[\] = \[([\s\S]*)\];/);

  if (!arrayMatch) {
    console.log(`   ❌ Não foi possível encontrar array de sugestões`);
    return { processed: 0, removed: 0 };
  }

  // Processar sugestões individualmente
  const suggestionsContent = arrayMatch[1];
  const suggestions = [];
  let depth = 0;
  let currentSuggestion = '';
  let inSuggestion = false;

  for (let i = 0; i < suggestionsContent.length; i++) {
    const char = suggestionsContent[i];

    if (char === '{') {
      depth++;
      if (depth === 1) {
        inSuggestion = true;
        currentSuggestion = '{';
      } else if (inSuggestion) {
        currentSuggestion += char;
      }
    } else if (char === '}') {
      if (inSuggestion) {
        currentSuggestion += char;
      }
      depth--;
      if (depth === 0 && inSuggestion) {
        suggestions.push(currentSuggestion);
        currentSuggestion = '';
        inSuggestion = false;
      }
    } else if (inSuggestion) {
      currentSuggestion += char;
    }
  }

  // Processar cada sugestão
  const updatedSuggestions = suggestions.map(suggestionStr => {
    // Extrair nome para verificar duplicação
    const nameMatch = suggestionStr.match(/name:\s*['"]([^'"]+)['"]/);
    if (nameMatch && duplicatesToRemove.includes(nameMatch[1])) {
      duplicatesRemoved++;
      return null; // Marcar para remoção
    }

    // Extrair informações necessárias
    const requiresDocsMatch = suggestionStr.match(/requiresDocuments:\s*(true|false)/);
    const categoryMatch = suggestionStr.match(/category:\s*['"]([^'"]+)['"]/);
    const fieldsMatch = suggestionStr.match(/suggestedFields:\s*\[[\s\S]*?\]/);

    const requiresDocuments = requiresDocsMatch ? requiresDocsMatch[1] === 'true' : false;
    const category = categoryMatch ? categoryMatch[1] : 'Geral';
    const fieldsCount = fieldsMatch ? (fieldsMatch[0].match(/\{/g) || []).length : 0;

    const mockSuggestion = {
      name: nameMatch ? nameMatch[1] : '',
      requiresDocuments,
      suggestedFields: new Array(fieldsCount)
    };

    const serviceSubtype = getServiceSubtype(mockSuggestion);
    const serviceType = getServiceType(serviceSubtype);
    const priority = getPriority(category);
    const color = getColor(category);

    // Adicionar novos campos antes do fechamento
    if (!suggestionStr.includes('serviceType:')) {
      const insertPosition = suggestionStr.lastIndexOf('}');
      const newFields = `,
    serviceType: ${serviceType},
    serviceSubtype: ${serviceSubtype},
    departmentCode: '${departmentCode}',
    priority: ${priority},
    color: '${color}',
    moduleType: null,
    status: 'ACTIVE' as const,
    createdAt: '${createdAt}'`;

      suggestionStr = suggestionStr.slice(0, insertPosition) + newFields + '\n  ' + suggestionStr.slice(insertPosition);
      suggestionsProcessed++;
    }

    return suggestionStr;
  }).filter(s => s !== null);

  // Reconstruir arquivo
  const newSuggestionsArray = `export const ${fileName.replace(/-/g, '')}Suggestions: ServiceSuggestion[] = [\n  ${updatedSuggestions.join(',\n  ')}\n];`;

  content = content.replace(
    /export const \w+Suggestions: ServiceSuggestion\[\] = \[[\s\S]*\];/,
    newSuggestionsArray
  );

  fs.writeFileSync(filePath, content, 'utf8');

  console.log(`   ✅ ${suggestionsProcessed} sugestões atualizadas`);
  console.log(`   🗑️  ${duplicatesRemoved} duplicações removidas`);

  return { processed: suggestionsProcessed, removed: duplicatesRemoved };
}

// Processar todos os arquivos
console.log('🚀 Iniciando atualização de sugestões...\n');

let totalProcessed = 0;
let totalRemoved = 0;

Object.keys(DEPARTMENT_CODES).forEach(fileName => {
  const result = processFile(fileName);
  totalProcessed += result.processed;
  totalRemoved += result.removed;
});

console.log('\n✅ CONCLUÍDO!');
console.log(`📊 Total: ${totalProcessed} sugestões atualizadas`);
console.log(`🗑️  Total: ${totalRemoved} duplicações removidas`);
