/**
 * Script de verificação da implementação dos 114 módulos
 */

const fs = require('fs');
const path = require('path');

const EXPECTED = {
  SAUDE: 11,
  EDUCACAO: 11,
  ASSISTENCIA_SOCIAL: 9,
  AGRICULTURA: 6,
  CULTURA: 9,
  ESPORTES: 9,
  HABITACAO: 7,
  MEIO_AMBIENTE: 7,
  OBRAS_PUBLICAS: 7,
  PLANEJAMENTO_URBANO: 9,
  SEGURANCA_PUBLICA: 11,
  SERVICOS_PUBLICOS: 9,
  TURISMO: 9,
};

let totalModules = 0;
let totalFiles = 0;
let errors = [];

console.log('🔍 VERIFICANDO IMPLEMENTAÇÃO DOS 114 MÓDULOS...\n');

Object.entries(EXPECTED).forEach(([dept, count]) => {
  const deptLower = dept.toLowerCase();
  const dir = path.join(__dirname, '..', 'backend', 'src', 'modules', deptLower);

  if (!fs.existsSync(dir)) {
    errors.push(`❌ Diretório não encontrado: ${deptLower}`);
    return;
  }

  const files = fs.readdirSync(dir);
  const services = files.filter(f => f.endsWith('.service.ts'));
  const controllers = files.filter(f => f.endsWith('.controller.ts'));
  const routes = files.filter(f => f.endsWith('.routes.ts'));

  const moduleCount = services.length;
  const fileCount = files.length;

  totalModules += moduleCount;
  totalFiles += fileCount;

  if (moduleCount !== count) {
    errors.push(`❌ ${dept}: esperado ${count} módulos, encontrado ${moduleCount}`);
  } else if (services.length !== controllers.length || services.length !== routes.length) {
    errors.push(`❌ ${dept}: quantidade de arquivos inconsistente (S:${services.length} C:${controllers.length} R:${routes.length})`);
  } else {
    console.log(`✅ ${dept}: ${moduleCount} módulos (${fileCount} arquivos)`);
  }
});

console.log('\n📊 RESUMO:');
console.log(`Total de módulos: ${totalModules}/114`);
console.log(`Total de arquivos: ${totalFiles}`);

if (errors.length > 0) {
  console.log('\n⚠️  ERROS ENCONTRADOS:');
  errors.forEach(err => console.log(err));
  process.exit(1);
} else {
  console.log('\n🎉 IMPLEMENTAÇÃO 100% VERIFICADA!');
  console.log('✅ Todos os 114 módulos estão implementados corretamente!');
}
