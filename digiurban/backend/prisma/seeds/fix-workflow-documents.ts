/**
 * Script para alinhar requiredDocumentTypes dos workflows com os requiredDocuments dos serviços.
 *
 * Regra: os requiredDocumentTypes de cada etapa do workflow devem usar EXATAMENTE
 * os mesmos nomes que existem no requiredDocuments do serviço correspondente.
 *
 * Uso: npx ts-node prisma/seeds/fix-workflow-documents.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Carregar mapeamentos extraídos
const servicesPath = path.join(__dirname, 'services-extracted.json');
const workflowsPath = path.join(__dirname, 'workflows-extracted.json');

const services: Record<string, { file: string; requiredDocuments: string[] }> = JSON.parse(
  fs.readFileSync(servicesPath, 'utf-8')
);

const workflows: Record<string, string[]> = JSON.parse(
  fs.readFileSync(workflowsPath, 'utf-8')
);

// Ler o arquivo original de workflows
const workflowSeedPath = path.join(__dirname, 'service-workflows.seed.ts');
let content = fs.readFileSync(workflowSeedPath, 'utf-8');

// Estatísticas
let totalFixed = 0;
let totalOrphaned = 0;
let totalAlreadyCorrect = 0;
const fixes: Array<{
  moduleType: string;
  stageName: string;
  before: string[];
  after: string[];
  reason: string;
}> = [];

// Para cada workflow, encontrar o serviço correspondente e corrigir
for (const [moduleType, workflowDocs] of Object.entries(workflows)) {
  const service = services[moduleType];

  if (!service) {
    // Workflow órfão - sem serviço correspondente
    // Esvaziar requiredDocumentTypes para não bloquear
    totalOrphaned++;
    continue; // Esses já têm [] na maioria dos casos, tratamos separadamente
  }

  const serviceDocs = service.requiredDocuments;
  if (!serviceDocs || serviceDocs.length === 0) {
    continue; // Serviço sem documentos requeridos
  }
}

// Abordagem: processar o arquivo linha por linha para encontrar e corrigir
// cada requiredDocumentTypes dentro de cada workflow

// Regex para encontrar blocos de workflow com moduleType e requiredDocumentTypes
const workflowBlockRegex = /(\w+):\s*\{[^}]*?moduleType:\s*'([^']+)'/g;

// Encontrar todos os moduleTypes e suas posições no arquivo
const moduleTypePositions: Array<{ moduleType: string; startPos: number }> = [];
let match;

// Encontrar todos os moduleType declarations
const moduleTypeRegex = /moduleType:\s*'([^']+)'/g;
while ((match = moduleTypeRegex.exec(content)) !== null) {
  moduleTypePositions.push({
    moduleType: match[1],
    startPos: match.index
  });
}

console.log(`\nEncontrados ${moduleTypePositions.length} workflows no arquivo.`);
console.log(`Encontrados ${Object.keys(services).length} serviços mapeados.\n`);

// Para cada moduleType, encontrar seus requiredDocumentTypes e corrigir
let newContent = content;
let offset = 0; // Track offset from replacements

for (let i = 0; i < moduleTypePositions.length; i++) {
  const { moduleType, startPos } = moduleTypePositions[i];
  const service = services[moduleType];

  if (!service || !service.requiredDocuments || service.requiredDocuments.length === 0) {
    continue;
  }

  const serviceDocs = service.requiredDocuments;

  // Encontrar o escopo do workflow (até o próximo workflow ou fim do objeto)
  const endPos = i + 1 < moduleTypePositions.length
    ? moduleTypePositions[i + 1].startPos
    : content.length;

  const workflowSection = content.substring(startPos, endPos);

  // Encontrar todos os requiredDocumentTypes neste workflow
  const reqDocRegex = /requiredDocumentTypes:\s*\[([^\]]*)\]/g;
  let docMatch;

  while ((docMatch = reqDocRegex.exec(workflowSection)) !== null) {
    const fullMatch = docMatch[0]; // requiredDocumentTypes: ['...', '...']
    const docsContent = docMatch[1].trim();

    if (!docsContent) {
      continue; // Array vazio, nada a corrigir
    }

    // Parse dos documentos atuais
    const currentDocs = docsContent
      .split(',')
      .map(d => d.trim().replace(/^['"]|['"]$/g, ''))
      .filter(d => d.length > 0);

    if (currentDocs.length === 0) {
      continue;
    }

    // Verificar se cada documento do workflow existe no serviço
    const correctedDocs: string[] = [];
    let hasChanges = false;

    for (const wDoc of currentDocs) {
      // Verificar match exato
      if (serviceDocs.includes(wDoc)) {
        correctedDocs.push(wDoc);
        continue;
      }

      // Tentar match case-insensitive
      const ciMatch = serviceDocs.find(
        sd => sd.toLowerCase() === wDoc.toLowerCase()
      );
      if (ciMatch) {
        correctedDocs.push(ciMatch);
        hasChanges = true;
        continue;
      }

      // Tentar match parcial inteligente
      const partialMatch = findBestMatch(wDoc, serviceDocs);
      if (partialMatch) {
        correctedDocs.push(partialMatch);
        hasChanges = true;
        continue;
      }

      // Documento não encontrado no serviço - REMOVER
      hasChanges = true;
      fixes.push({
        moduleType,
        stageName: '(ver contexto)',
        before: currentDocs,
        after: [], // Será preenchido depois
        reason: `Documento "${wDoc}" removido - não existe no serviço (serviço tem: ${serviceDocs.join(', ')})`
      });
    }

    // Remover duplicatas mantendo ordem
    const uniqueDocs = [...new Set(correctedDocs)];

    if (hasChanges || uniqueDocs.length !== currentDocs.length) {
      // Se ficou vazio mas o serviço tem docs, usar todos os docs do serviço
      const finalDocs = uniqueDocs.length > 0 ? uniqueDocs : serviceDocs;

      const newValue = finalDocs.length > 0
        ? `requiredDocumentTypes: [${finalDocs.map(d => `'${d}'`).join(', ')}]`
        : `requiredDocumentTypes: []`;

      // Calcular posição absoluta
      const absolutePos = startPos + docMatch.index + offset;
      const oldLen = fullMatch.length;

      newContent = newContent.substring(0, absolutePos) +
        newValue +
        newContent.substring(absolutePos + oldLen);

      offset += newValue.length - oldLen;
      totalFixed++;

      console.log(`✅ ${moduleType}: ${currentDocs.join(', ')}`);
      console.log(`   → ${finalDocs.join(', ')}\n`);
    } else {
      totalAlreadyCorrect++;
    }
  }
}

// Para workflows órfãos, esvaziar requiredDocumentTypes não-vazios
const orphanModuleTypes = Object.keys(workflows).filter(mt => !services[mt]);
console.log(`\n🔍 Workflows órfãos (sem serviço): ${orphanModuleTypes.length}`);
for (const mt of orphanModuleTypes) {
  console.log(`   - ${mt}`);
}

// Escrever arquivo corrigido
const outputPath = path.join(__dirname, 'service-workflows.seed.ts');
const backupPath = path.join(__dirname, 'service-workflows.seed.backup.ts');

// Backup
fs.copyFileSync(outputPath, backupPath);
console.log(`\n📦 Backup criado: service-workflows.seed.backup.ts`);

// Gravar
fs.writeFileSync(outputPath, newContent, 'utf-8');

console.log(`\n========================================`);
console.log(`📊 RESULTADO:`);
console.log(`   Corrigidos: ${totalFixed} blocos de documentos`);
console.log(`   Já corretos: ${totalAlreadyCorrect}`);
console.log(`   Workflows órfãos: ${orphanModuleTypes.length}`);
console.log(`========================================\n`);

/**
 * Encontra a melhor correspondência entre um documento do workflow e os do serviço.
 * Usa heurísticas para lidar com variações de nome.
 */
function findBestMatch(workflowDoc: string, serviceDocs: string[]): string | null {
  const wLower = workflowDoc.toLowerCase();

  // Mapeamento de termos equivalentes
  const equivalences: Record<string, string[]> = {
    'cpf/cnpj': ['cpf', 'cnpj', 'cpf ou cnpj', 'cpf e cnpj'],
    'cpf': ['cpf/cnpj', 'rg e cpf', 'cpf e rg'],
    'cnpj/cpf': ['cnpj', 'cpf', 'cpf ou cnpj'],
    'rg ou certidão': ['rg ou cnh', 'rg', 'certidão de nascimento'],
    'rg ou certidão de nascimento': ['rg ou cnh', 'rg', 'certidão de nascimento', 'rg ou certidão de nascimento'],
    'rg ou cnh': ['rg', 'rg ou certidão'],
    'rg (se possuir)': ['rg', 'rg do responsável', 'rg ou cpf'],
    'cpf (se possuir)': ['cpf', 'cpf do responsável', 'rg ou cpf'],
    'documento do imóvel': ['matrícula do imóvel', 'escritura do imóvel', 'comprovante de propriedade'],
    'documento do proprietário': ['rg', 'cpf', 'matrícula do imóvel'],
    'documento da propriedade': ['escritura ou contrato', 'comprovante de propriedade', 'comprovante de propriedade ou posse'],
    'comprovante de propriedade': ['comprovante de propriedade ou posse', 'escritura ou contrato', 'documento da propriedade (opcional)'],
    'car (cadastro ambiental rural)': ['car - cadastro ambiental rural (opcional)'],
    'dap': ['dap - declaração de aptidão ao pronaf (opcional)', 'dap (declaração de aptidão ao pronaf)'],
    'dap ou cadastro de produtor': ['dap - declaração de aptidão ao pronaf (opcional)', 'cadastro de produtor rural (opcional)', 'dap'],
    'cadastro de produtor': ['cadastro de produtor rural (opcional)', 'cadastro de produtor rural'],
    'art/rrt': ['art', 'art (anotação de responsabilidade técnica)'],
    'requisição médica': ['pedido médico', 'receita médica'],
    'projeto arquitetônico': ['projeto aprovado', 'projeto de reforma', 'projeto'],
    'atestado de antecedentes': ['certidão de antecedentes criminais'],
    'certidões': ['certidão de antecedentes criminais', 'certidões negativas'],
    'seguro': ['seguro obrigatório', 'seguro de responsabilidade civil', 'seguro do veículo', 'seguro dos veículos'],
    'curso transporte escolar': ['curso de transporte escolar'],
    'declaração de matrícula': ['comprovante de matrícula', 'comprovante de matrícula (se aplicável)'],
    'fotos': ['fotos do local', 'foto do problema', 'fotos da edificação', 'fotos do local (se possível)'],
    'comprovantes': ['comprovantes (se houver)'],
    'histórico escolar': ['histórico escolar (se possuir)'],
    'escritura_imovel': ['escritura do imóvel', 'escritura ou contrato'],
    'laudo_tecnico': ['laudo técnico', 'laudo de avaliação (se houver)'],
    'comprovante_residencia': ['comprovante de residência', 'comprovante de endereço'],
  };

  // Verificar equivalências
  const wEquivs = equivalences[wLower];
  if (wEquivs) {
    for (const equiv of wEquivs) {
      const match = serviceDocs.find(sd => sd.toLowerCase() === equiv);
      if (match) return match;
    }
  }

  // Match por substring significativa (>= 70% da menor string)
  for (const sd of serviceDocs) {
    const sdLower = sd.toLowerCase();

    // Se um contém o outro
    if (sdLower.includes(wLower) || wLower.includes(sdLower)) {
      return sd;
    }

    // Palavras-chave compartilhadas
    const wWords = wLower.split(/[\s,/()-]+/).filter(w => w.length > 2);
    const sWords = sdLower.split(/[\s,/()-]+/).filter(w => w.length > 2);
    const common = wWords.filter(w => sWords.includes(w));

    if (common.length >= Math.min(wWords.length, sWords.length) * 0.7 && common.length >= 1) {
      return sd;
    }
  }

  return null;
}
