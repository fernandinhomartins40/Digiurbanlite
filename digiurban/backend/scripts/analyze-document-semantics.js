/**
 * Análise semântica: Verifica se os documentos fazem sentido para cada serviço
 */

const fs = require('fs');
const path = require('path');

const SEEDS_DIR = path.join(__dirname, '../prisma/seeds/services');

// Documentos genéricos que são aceitáveis em qualquer serviço
const GENERIC_DOCS = ['cpf', 'rg', 'comprovante_residencia', 'comprovante_endereco'];

function extractServices(content) {
  const services = [];

  // Regex melhorado para capturar serviços completos
  const servicePattern = /{[\s\S]*?name:\s*'([^']+)'[\s\S]*?requiresDocuments:\s*(true|false)[\s\S]*?requiredDocuments:\s*(\[[^\]]*?\])[\s\S]*?}/g;

  let match;
  while ((match = servicePattern.exec(content)) !== null) {
    const name = match[1];
    const requiresDocs = match[2] === 'true';
    let docs = [];

    if (requiresDocs) {
      const docsStr = match[3];
      // Extrair IDs dos documentos
      const idMatches = docsStr.matchAll(/id:\s*'([^']+)'/g);
      for (const m of idMatches) {
        docs.push(m[1]);
      }
    }

    services.push({ name, requiresDocs, docs });
  }

  return services;
}

function analyzeSemantics(serviceName, docs) {
  const suggestions = [];
  const name = serviceName.toLowerCase();

  // Análise contextual
  if (name.includes('comprovante') && docs.length === 1 && GENERIC_DOCS.includes(docs[0])) {
    suggestions.push(`💡 Serviço de COMPROVANTE só pede ${docs[0].toUpperCase()}? Deveria pedir o comprovante em si?`);
  }

  if (name.includes('certidão') && !docs.some(d => d.includes('cpf') || d.includes('rg'))) {
    suggestions.push(`⚠️  Certidão sem documento de identificação?`);
  }

  if (name.includes('reserva') && !docs.some(d => d.includes('reserva') || d.includes('comprovante'))) {
    suggestions.push(`💡 Serviço de RESERVA deveria pedir comprovante de reserva?`);
  }

  if (name.includes('inscrição') && docs.length < 2) {
    suggestions.push(`⚠️  Inscrição com poucos documentos (${docs.length})?`);
  }

  if (name.includes('segunda via') && !docs.some(d => d.includes('boletim') || d.includes('protocolo'))) {
    suggestions.push(`💡 Segunda via poderia pedir boletim de ocorrência ou protocolo original?`);
  }

  return suggestions;
}

console.log('🧠 ANÁLISE SEMÂNTICA DE DOCUMENTOS x SERVIÇOS\n');
console.log('='.repeat(100));

const files = fs.readdirSync(SEEDS_DIR)
  .filter(f => f.endsWith('.seed.ts'))
  .map(f => path.join(SEEDS_DIR, f));

let totalSuggestions = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const services = extractServices(content);
  const fileName = path.basename(file);

  const servicesWithSuggestions = services
    .map(s => ({ ...s, suggestions: analyzeSemantics(s.name, s.docs) }))
    .filter(s => s.suggestions.length > 0);

  if (servicesWithSuggestions.length > 0) {
    console.log(`\n📄 ${fileName}`);

    servicesWithSuggestions.forEach(service => {
      console.log(`\n  📋 ${service.name}`);
      console.log(`     Documentos: [${service.docs.join(', ')}]`);
      service.suggestions.forEach(sug => {
        console.log(`     ${sug}`);
        totalSuggestions++;
      });
    });
  }
});

console.log('\n' + '='.repeat(100));
console.log(`\n📊 Total de sugestões: ${totalSuggestions}`);
console.log('\n' + '='.repeat(100));
