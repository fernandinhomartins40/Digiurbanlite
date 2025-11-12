import * as fs from 'fs';
import * as path from 'path';

// Diretório dos templates
const templatesDir = path.join(process.cwd(), 'prisma', 'templates');

// Ler todos os arquivos JSON
const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));

console.log('='.repeat(100));
console.log('🔄 CONVERSÃO DE TEMPLATES PARA NOVA ESTRUTURA');
console.log('='.repeat(100));
console.log('');

let totalFiles = 0;
let totalServices = 0;
let convertedServices = 0;

files.forEach(file => {
  const filePath = path.join(templatesDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const services = JSON.parse(content);

  totalFiles++;
  let fileModified = false;

  services.forEach((service: any, index: number) => {
    totalServices++;

    // Verificar se tem defaultFields como array (formato antigo)
    if (service.defaultFields && Array.isArray(service.defaultFields)) {
      console.log(`📝 Convertendo: [${service.code}] ${service.name}`);

      // Converter para nova estrutura
      service.defaultFields = {
        fields: service.defaultFields
      };

      convertedServices++;
      fileModified = true;
    }

    // Verificar se tem requiredDocs como array simples
    if (service.requiredDocs && Array.isArray(service.requiredDocs) && typeof service.requiredDocs[0] === 'string') {
      service.requiredDocs = {
        documents: service.requiredDocs
      };
      fileModified = true;
    }
  });

  // Salvar arquivo se foi modificado
  if (fileModified) {
    fs.writeFileSync(filePath, JSON.stringify(services, null, 2), 'utf-8');
    console.log(`✅ Arquivo salvo: ${file}`);
    console.log('');
  }
});

console.log('='.repeat(100));
console.log('📊 RESUMO DA CONVERSÃO');
console.log('-'.repeat(100));
console.log(`Arquivos processados: ${totalFiles}`);
console.log(`Serviços processados: ${totalServices}`);
console.log(`Serviços convertidos: ${convertedServices}`);
console.log('='.repeat(100));
