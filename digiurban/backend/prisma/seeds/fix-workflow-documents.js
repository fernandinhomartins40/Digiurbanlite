/**
 * Script para alinhar requiredDocumentTypes dos workflows com os requiredDocuments dos serviços.
 *
 * Regra: os requiredDocumentTypes de cada etapa devem usar EXATAMENTE
 * os mesmos nomes que existem no requiredDocuments do serviço correspondente.
 *
 * Se um documento do workflow não existe no serviço, ele é substituído pelo
 * documento mais similar do serviço ou removido.
 *
 * Uso: node prisma/seeds/fix-workflow-documents.js
 */

const fs = require('fs');
const path = require('path');

// Carregar mapeamentos extraídos
const services = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'services-extracted.json'), 'utf-8')
);
const workflows = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'workflows-extracted.json'), 'utf-8')
);

// Ler o arquivo original
const seedPath = path.join(__dirname, 'service-workflows.seed.ts');
let content = fs.readFileSync(seedPath, 'utf-8');

// Backup
fs.copyFileSync(seedPath, path.join(__dirname, 'service-workflows.seed.backup.ts'));
console.log('Backup criado: service-workflows.seed.backup.ts\n');

// Mapa de equivalências de nomes de documentos
const EQUIVALENCES = {
  'cpf/cnpj': ['cpf', 'cnpj', 'cpf ou cnpj', 'cnpj/cpf'],
  'cnpj/cpf': ['cnpj', 'cpf', 'cpf ou cnpj', 'cpf/cnpj'],
  'cpf (se possuir)': ['cpf', 'cpf do responsável', 'rg ou cpf', 'rg e cpf'],
  'rg (se possuir)': ['rg', 'rg do responsável', 'rg ou cpf', 'rg e cpf', 'rg ou cnh'],
  'rg ou certidão de nascimento': ['rg ou cnh', 'rg', 'certidão de nascimento'],
  'rg ou certidão': ['rg ou cnh', 'rg', 'certidão de nascimento'],
  'documento do imóvel': ['matrícula do imóvel', 'escritura do imóvel', 'comprovante de propriedade', 'iptu', 'escritura ou contrato'],
  'documento do proprietário': ['matrícula do imóvel', 'iptu', 'escritura do imóvel'],
  'documento da propriedade': ['escritura ou contrato', 'comprovante de propriedade ou posse', 'comprovante de propriedade', 'documento da propriedade (opcional)'],
  'comprovante de propriedade': ['comprovante de propriedade ou posse', 'escritura ou contrato', 'documento da propriedade (opcional)', 'comprovante de propriedade'],
  'car (cadastro ambiental rural)': ['car - cadastro ambiental rural (opcional)'],
  'dap': ['dap - declaração de aptidão ao pronaf (opcional)', 'dap (declaração de aptidão ao pronaf)', 'dap'],
  'dap - declaração de aptidão ao pronaf (opcional)': ['dap', 'dap (declaração de aptidão ao pronaf)'],
  'dap ou cadastro de produtor': ['cadastro de produtor rural (opcional)', 'cadastro de produtor rural', 'dap'],
  'cadastro de produtor': ['cadastro de produtor rural (opcional)', 'cadastro de produtor rural'],
  'art/rrt': ['art', 'art (anotação de responsabilidade técnica)', 'art do responsável técnico'],
  'requisição médica': ['pedido médico', 'receita médica'],
  'pedido médico': ['requisição médica', 'pedido médico'],
  'projeto arquitetônico': ['projeto aprovado', 'projeto', 'projeto de reforma'],
  'atestado de antecedentes': ['certidão de antecedentes criminais'],
  'certidões': ['certidão de antecedentes criminais', 'certidões negativas'],
  'seguro': ['seguro obrigatório', 'seguro de responsabilidade civil', 'seguro do veículo', 'seguro dos veículos'],
  'curso transporte escolar': ['curso de transporte escolar'],
  'declaração de matrícula': ['comprovante de matrícula', 'comprovante de matrícula (se aplicável)'],
  'comprovante de matrícula': ['declaração de matrícula', 'comprovante de matrícula (se aplicável)'],
  'fotos': ['fotos do local', 'foto do problema', 'fotos da edificação', 'fotos do local (se possível)', 'fotos da moradia', 'fotos do imóvel'],
  'comprovantes': ['comprovantes (se houver)'],
  'histórico escolar': ['histórico escolar', 'histórico escolar (se possuir)'],
  'comprovante de endereço': ['comprovante de residência', 'comprovante de endereço'],
  'comprovante de residência': ['comprovante de endereço', 'comprovante de residência'],
  'escritura_imovel': ['escritura do imóvel', 'escritura ou contrato'],
  'laudo_tecnico': ['laudo técnico', 'laudo de avaliação (se houver)'],
  'comprovante_residencia': ['comprovante de residência', 'comprovante de endereço'],
  'relatório de vistoria': ['fotos da edificação', 'fotos do local'],
  'exames': ['exames complementares', 'pedido médico'],
  'guia de encaminhamento': ['encaminhamento médico (se houver)'],
  'projeto do evento': ['projeto do evento'],
  'cpf/cnpj responsável': ['cpf', 'cnpj', 'cpf ou cnpj'],
  'ficha de inscrição': ['rg', 'cpf'],
  'documento de identidade': ['rg', 'cpf', 'rg ou cpf'],
  'título de eleitor': ['documentos pessoais'],
  'comprovante de renda': ['comprovante de renda', 'comprovante de renda familiar', 'comprovante de renda (se houver)'],
};

function findBestMatch(workflowDoc, serviceDocs) {
  const wLower = workflowDoc.toLowerCase();

  // 1. Match exato
  const exact = serviceDocs.find(sd => sd === workflowDoc);
  if (exact) return exact;

  // 2. Match case-insensitive
  const ci = serviceDocs.find(sd => sd.toLowerCase() === wLower);
  if (ci) return ci;

  // 3. Equivalências
  const equivs = EQUIVALENCES[wLower];
  if (equivs) {
    for (const equiv of equivs) {
      const match = serviceDocs.find(sd => sd.toLowerCase() === equiv.toLowerCase());
      if (match) return match;
    }
  }

  // 4. Substring match - se o doc do serviço contém o do workflow ou vice-versa
  for (const sd of serviceDocs) {
    const sdLower = sd.toLowerCase();
    if (sdLower.includes(wLower) || wLower.includes(sdLower)) {
      return sd;
    }
  }

  // 5. Match por palavras-chave significativas
  const wWords = wLower.split(/[\s,/()-]+/).filter(w => w.length > 2);
  for (const sd of serviceDocs) {
    const sWords = sd.toLowerCase().split(/[\s,/()-]+/).filter(w => w.length > 2);
    const common = wWords.filter(w => sWords.includes(w));
    if (common.length >= Math.max(1, Math.min(wWords.length, sWords.length) * 0.6)) {
      return sd;
    }
  }

  return null;
}

// Processar: encontrar cada bloco de workflow pelo moduleType e corrigir
let stats = {
  workflowsProcessed: 0,
  stagesFixed: 0,
  stagesAlreadyCorrect: 0,
  stagesEmpty: 0,
  orphanWorkflows: 0,
  docsRemoved: 0,
  docsReplaced: 0,
};

const report = [];

// Encontrar todos os workflows no arquivo
// Pattern: moduleType: 'XXX', e depois os requiredDocumentTypes dentro do mesmo workflow
// Abordagem: split por moduleType e processar cada bloco

// Encontrar posições de todos os moduleType: 'XXX'
const moduleTypePattern = /moduleType:\s*'([^']+)'/g;
const positions = [];
let m;
while ((m = moduleTypePattern.exec(content)) !== null) {
  positions.push({ moduleType: m[1], index: m.index });
}

console.log(`Total de moduleType encontrados: ${positions.length}\n`);

// Processar de trás para frente (para que os offsets não mudem)
for (let i = positions.length - 1; i >= 0; i--) {
  const { moduleType, index: startIdx } = positions[i];
  const endIdx = i + 1 < positions.length ? positions[i + 1].index : content.length;

  const service = services[moduleType];

  if (!service) {
    stats.orphanWorkflows++;
    report.push(`⚠️  ÓRFÃO: ${moduleType} (sem serviço correspondente)`);
    // Esvaziar todos os requiredDocumentTypes não-vazios neste bloco
    const block = content.substring(startIdx, endIdx);
    const fixedBlock = block.replace(
      /requiredDocumentTypes:\s*\[([^\]]+)\]/g,
      (fullMatch, inner) => {
        const docs = inner.split(',').map(d => d.trim().replace(/^['"]|['"]$/g, '')).filter(d => d);
        if (docs.length > 0) {
          stats.stagesFixed++;
          report.push(`   Esvaziado: [${docs.join(', ')}] → []`);
          return 'requiredDocumentTypes: []';
        }
        return fullMatch;
      }
    );
    content = content.substring(0, startIdx) + fixedBlock + content.substring(endIdx);
    continue;
  }

  const serviceDocs = service.requiredDocuments;
  if (!serviceDocs || serviceDocs.length === 0) {
    // Serviço sem documentos - esvaziar workflow
    const block = content.substring(startIdx, endIdx);
    const fixedBlock = block.replace(
      /requiredDocumentTypes:\s*\[([^\]]+)\]/g,
      (fullMatch, inner) => {
        const docs = inner.split(',').map(d => d.trim().replace(/^['"]|['"]$/g, '')).filter(d => d);
        if (docs.length > 0) {
          stats.stagesFixed++;
          report.push(`🗑️  ${moduleType}: serviço sem docs → esvaziado [${docs.join(', ')}]`);
          return 'requiredDocumentTypes: []';
        }
        return fullMatch;
      }
    );
    content = content.substring(0, startIdx) + fixedBlock + content.substring(endIdx);
    stats.workflowsProcessed++;
    continue;
  }

  stats.workflowsProcessed++;

  // Processar cada requiredDocumentTypes neste bloco
  const block = content.substring(startIdx, endIdx);
  let hasAnyFix = false;

  const fixedBlock = block.replace(
    /requiredDocumentTypes:\s*\[([^\]]*)\]/g,
    (fullMatch, inner) => {
      const trimmed = inner.trim();
      if (!trimmed) {
        stats.stagesEmpty++;
        return fullMatch; // Array vazio, manter
      }

      // Parse documentos atuais
      const currentDocs = trimmed
        .split(',')
        .map(d => d.trim().replace(/^['"]|['"]$/g, ''))
        .filter(d => d.length > 0);

      if (currentDocs.length === 0) {
        stats.stagesEmpty++;
        return fullMatch;
      }

      // Mapear cada documento para o serviço
      const newDocs = [];
      let changed = false;

      for (const wDoc of currentDocs) {
        const match = findBestMatch(wDoc, serviceDocs);
        if (match) {
          newDocs.push(match);
          if (match !== wDoc) {
            changed = true;
            stats.docsReplaced++;
          }
        } else {
          // Não encontrado - remover
          changed = true;
          stats.docsRemoved++;
        }
      }

      // Remover duplicatas
      const uniqueDocs = [...new Set(newDocs)];

      // Se ficou vazio mas tinha docs antes, usar todos os docs do serviço
      if (uniqueDocs.length === 0 && currentDocs.length > 0) {
        const finalDocs = serviceDocs;
        hasAnyFix = true;
        stats.stagesFixed++;
        report.push(`🔄 ${moduleType}: [${currentDocs.join(', ')}] → [${finalDocs.join(', ')}] (todos do serviço)`);
        return `requiredDocumentTypes: [${finalDocs.map(d => `'${d}'`).join(', ')}]`;
      }

      if (changed || uniqueDocs.length !== currentDocs.length) {
        hasAnyFix = true;
        stats.stagesFixed++;
        report.push(`✅ ${moduleType}: [${currentDocs.join(', ')}] → [${uniqueDocs.join(', ')}]`);
        return `requiredDocumentTypes: [${uniqueDocs.map(d => `'${d}'`).join(', ')}]`;
      }

      stats.stagesAlreadyCorrect++;
      return fullMatch;
    }
  );

  content = content.substring(0, startIdx) + fixedBlock + content.substring(endIdx);
}

// Gravar resultado
fs.writeFileSync(seedPath, content, 'utf-8');

// Imprimir relatório
console.log('='.repeat(60));
console.log('RELATÓRIO DE CORREÇÕES');
console.log('='.repeat(60));

for (const line of report) {
  console.log(line);
}

console.log('\n' + '='.repeat(60));
console.log('ESTATÍSTICAS');
console.log('='.repeat(60));
console.log(`Workflows processados:    ${stats.workflowsProcessed}`);
console.log(`Workflows órfãos:         ${stats.orphanWorkflows}`);
console.log(`Etapas corrigidas:        ${stats.stagesFixed}`);
console.log(`Etapas já corretas:       ${stats.stagesAlreadyCorrect}`);
console.log(`Etapas sem documentos:    ${stats.stagesEmpty}`);
console.log(`Documentos substituídos:  ${stats.docsReplaced}`);
console.log(`Documentos removidos:     ${stats.docsRemoved}`);
console.log('='.repeat(60));
console.log(`\nArquivo corrigido: ${seedPath}`);
