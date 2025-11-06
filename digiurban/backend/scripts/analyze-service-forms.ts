import * as fs from 'fs';
import * as path from 'path';

// Diretório dos templates
const templatesDir = path.join(process.cwd(), 'prisma', 'templates');

// Ler todos os arquivos JSON
const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));

console.log('='.repeat(100));
console.log('📋 ANÁLISE DE SERVIÇOS COM DADOS - AUDITORIA DE FORMULÁRIOS');
console.log('='.repeat(100));
console.log('');

let totalServices = 0;
let servicesWithData = 0;
let servicesWithForms = 0;
let servicesWithoutForms = 0;

const missingForms: any[] = [];
const departmentStats: any = {};
const detailedMissing: any = {};

files.forEach(file => {
  const content = fs.readFileSync(path.join(templatesDir, file), 'utf-8');
  const services = JSON.parse(content);
  const department = file.replace('.json', '');

  if (!departmentStats[department]) {
    departmentStats[department] = {
      total: 0,
      withData: 0,
      withForms: 0,
      missingForms: []
    };
  }

  if (!detailedMissing[department]) {
    detailedMissing[department] = [];
  }

  services.forEach((service: any) => {
    totalServices++;
    departmentStats[department].total++;

    // Verifica se tem defaultFields ou formSchema
    const hasDefaultFields = service.defaultFields && service.defaultFields.fields && service.defaultFields.fields.length > 0;
    const hasFormSchema = service.formSchema && service.formSchema.fields && service.formSchema.fields.length > 0;
    const hasAnyForm = hasDefaultFields || hasFormSchema;

    if (hasAnyForm) {
      servicesWithData++;
      departmentStats[department].withData++;
      servicesWithForms++;
      departmentStats[department].withForms++;
    } else {
      // Serviço sem formulário - pode ser informativo
      if (service.moduleType && service.moduleEntity) {
        // Tem moduleType mas não tem formulário
        servicesWithoutForms++;
        detailedMissing[department].push({
          code: service.code,
          name: service.name,
          moduleType: service.moduleType,
          moduleEntity: service.moduleEntity
        });
      }
    }
  });
});

console.log('📊 RESUMO GERAL');
console.log('-'.repeat(100));
console.log(`Total de serviços cadastrados: ${totalServices}`);
console.log(`Serviços COM formulários (defaultFields/formSchema): ${servicesWithForms}`);
console.log(`Serviços SEM formulários mas COM moduleType: ${servicesWithoutForms}`);
console.log(`Coverage de formulários: ${servicesWithData > 0 ? Math.round((servicesWithForms / (servicesWithForms + servicesWithoutForms)) * 100) : 0}%`);
console.log('');

console.log('📈 ESTATÍSTICAS POR SECRETARIA');
console.log('-'.repeat(100));
Object.keys(departmentStats).sort().forEach(dept => {
  const stats = departmentStats[dept];
  const missing = detailedMissing[dept].length;
  const coverage = (stats.total - missing) > 0 ? Math.round(((stats.withForms) / stats.total) * 100) : 0;

  console.log(`${dept.toUpperCase()}:`);
  console.log(`  Total de serviços: ${stats.total}`);
  console.log(`  Com formulários: ${stats.withForms}`);
  console.log(`  Sem formulários: ${missing}`);
  console.log(`  Coverage: ${coverage}%`);
  console.log('');
});

console.log('');
console.log('🔍 SERVIÇOS SEM FORMULÁRIOS (MAS COM DADOS)');
console.log('-'.repeat(100));

let totalMissing = 0;
Object.keys(detailedMissing).sort().forEach(dept => {
  const services = detailedMissing[dept];
  if (services.length > 0) {
    console.log('');
    console.log(`📂 ${dept.toUpperCase()} (${services.length} serviços sem formulário)`);
    console.log('-'.repeat(100));
    services.forEach((s: any, index: number) => {
      console.log(`  ${index + 1}. [${s.code}] ${s.name}`);
      console.log(`     ModuleType: ${s.moduleType} | ModuleEntity: ${s.moduleEntity}`);
      totalMissing++;
    });
  }
});

console.log('');
console.log('='.repeat(100));
console.log(`⚠️  TOTAL DE SERVIÇOS SEM FORMULÁRIOS: ${totalMissing}`);
console.log('='.repeat(100));
console.log('');

console.log('💡 RECOMENDAÇÕES:');
console.log('   1. Os serviços listados acima possuem moduleType/moduleEntity mas não possuem formulários');
console.log('   2. Isso significa que os cidadãos não conseguem preencher dados estruturados');
console.log('   3. Recomenda-se adicionar defaultFields ou formSchema para cada um deles');
console.log('   4. Use como referência os templates que já possuem formulários implementados');
console.log('');
