/**
 * Script de diagnóstico para identificar qual rota está causando o crash
 * Testa o carregamento individual de cada arquivo de rota
 */

const path = require('path');
const fs = require('fs');

// Lista de todas as rotas do index.ts na ordem em que são carregadas
const routes = [
  { path: './routes/admin-auth', mount: '/api/admin/auth', name: 'admin-auth', critical: true },
  { path: './routes/citizen-auth', mount: '/api/auth/citizen', name: 'citizen-auth', critical: true },
  { path: './routes/public', mount: '/api/public', name: 'public' },
  { path: './routes/services', mount: '/api/services', name: 'services' },
  { path: './routes/protocols-simplified.routes', mount: '/api/protocols', name: 'protocols-simplified' },
  { path: './routes/admin-management', mount: '/api/admin/management', name: 'admin-management' },
  { path: './routes/admin-chamados', mount: '/api/admin/chamados', name: 'admin-chamados' },
  { path: './routes/admin-reports', mount: '/api/admin/relatorios', name: 'admin-reports' },
  { path: './routes/admin-gabinete', mount: '/api/admin/gabinete', name: 'admin-gabinete' },
  { path: './routes/admin-citizens', mount: '/api/admin/citizens', name: 'admin-citizens' },
  { path: './routes/citizens', mount: '/api/citizens', name: 'citizens' },
  { path: './routes/citizen-services', mount: '/api/citizen/services', name: 'citizen-services' },
  { path: './routes/citizen-protocols', mount: '/api/citizen/protocols', name: 'citizen-protocols' },
  { path: './routes/citizen-programs', mount: '/api/citizen', name: 'citizen-programs' },
  { path: './routes/citizen-family', mount: '/api/citizen/family', name: 'citizen-family' },
  { path: './routes/citizen-documents', mount: '/api/citizen/documents', name: 'citizen-documents' },
  { path: './routes/citizen-notifications', mount: '/api/citizen/notifications', name: 'citizen-notifications' },
  { path: './routes/secretarias-saude', mount: '/api/secretarias/saude', name: 'secretarias-saude' },
  { path: './routes/secretarias-educacao', mount: '/api/admin/secretarias/educacao', name: 'secretarias-educacao' },
  { path: './routes/secretarias-assistencia-social', mount: '/api/secretarias/assistencia-social', name: 'secretarias-assistencia-social' },
  { path: './routes/secretarias-agricultura', mount: '/api/admin/secretarias/agricultura', name: 'secretarias-agricultura' },
  { path: './routes/secretarias-agricultura-produtores', mount: '/api/admin/secretarias/agricultura/produtores', name: 'secretarias-agricultura-produtores' },
  { path: './routes/secretarias-cultura', mount: '/api/secretarias/cultura', name: 'secretarias-cultura' },
  { path: './routes/secretarias-esportes', mount: '/api/secretarias/esportes', name: 'secretarias-esportes' },
  { path: './routes/secretarias-habitacao', mount: '/api/secretarias/habitacao', name: 'secretarias-habitacao' },
  { path: './routes/secretarias-seguranca', mount: '/api/admin/secretarias/seguranca', name: 'secretarias-seguranca' },
  { path: './routes/secretarias-meio-ambiente', mount: '/api/admin/secretarias/meio-ambiente', name: 'secretarias-meio-ambiente' },
  { path: './routes/secretarias-obras-publicas', mount: '/api/admin/secretarias/obras-publicas', name: 'secretarias-obras-publicas' },
  { path: './routes/secretarias-planejamento-urbano', mount: '/api/admin/secretarias/planejamento-urbano', name: 'secretarias-planejamento-urbano' },
  { path: './routes/secretarias-servicos-publicos', mount: '/api/admin/secretarias/servicos-publicos', name: 'secretarias-servicos-publicos' },
  { path: './routes/secretarias-turismo', mount: '/api/admin/secretarias/turismo', name: 'secretarias-turismo' },
  { path: './routes/admin-secretarias', mount: '/api/secretarias', name: 'admin-secretarias' },
  { path: './routes/custom-modules', mount: '/api/admin/custom-modules', name: 'custom-modules' },
  { path: './routes/service-templates', mount: '/api/admin/templates', name: 'service-templates' },
  { path: './routes/admin-email', mount: '/api/admin/email', name: 'admin-email' },
  { path: './routes/integrations', mount: '/api/integrations', name: 'integrations' },
  { path: './routes/municipality-config', mount: '/api/municipality', name: 'municipality-config' },
  { path: './routes/admin-agriculture', mount: '/api/admin/agriculture', name: 'admin-agriculture' },
  { path: './routes/protocol-interactions', mount: '/api/protocols', name: 'protocol-interactions' },
  { path: './routes/protocol-documents', mount: '/api/protocols', name: 'protocol-documents' },
  { path: './routes/protocol-pendings', mount: '/api/protocols', name: 'protocol-pendings' },
  { path: './routes/protocol-stages', mount: '/api/protocols', name: 'protocol-stages' },
  { path: './routes/protocol-sla', mount: '/api/protocols', name: 'protocol-sla' },
  { path: './routes/module-workflows', mount: '/api/workflows', name: 'module-workflows' },
];

console.log('🔍 DIAGNÓSTICO DE CARREGAMENTO DE ROTAS\n');
console.log('═'.repeat(80));

async function testRoute(route) {
  const startTime = Date.now();
  try {
    const filePath = path.resolve(__dirname, 'src', route.path + '.ts');

    // Verificar se arquivo existe
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  ${route.name.padEnd(40)} - ARQUIVO NÃO ENCONTRADO: ${filePath}`);
      return { success: false, error: 'FILE_NOT_FOUND', time: 0 };
    }

    // Tentar carregar o módulo
    const module = require(route.path);
    const loadTime = Date.now() - startTime;

    if (!module || !module.default) {
      console.log(`❌ ${route.name.padEnd(40)} - SEM EXPORT DEFAULT (${loadTime}ms)`);
      return { success: false, error: 'NO_DEFAULT_EXPORT', time: loadTime };
    }

    console.log(`✅ ${route.name.padEnd(40)} - OK (${loadTime}ms)`);
    return { success: true, time: loadTime };
  } catch (error) {
    const loadTime = Date.now() - startTime;
    console.log(`❌ ${route.name.padEnd(40)} - ERRO (${loadTime}ms)`);
    console.log(`   ${error.message}`);
    if (error.stack) {
      const stackLines = error.stack.split('\n').slice(1, 4);
      stackLines.forEach(line => console.log(`   ${line.trim()}`));
    }
    return { success: false, error: error.message, time: loadTime };
  }
}

async function main() {
  const results = {
    total: routes.length,
    success: 0,
    failed: 0,
    notFound: 0,
    times: []
  };

  console.log(`Testando ${routes.length} rotas...\n`);

  for (const route of routes) {
    const result = await testRoute(route);

    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      if (result.error === 'FILE_NOT_FOUND') {
        results.notFound++;
      }
    }

    if (result.time > 0) {
      results.times.push(result.time);
    }
  }

  console.log('\n' + '═'.repeat(80));
  console.log('📊 RESUMO DO DIAGNÓSTICO\n');
  console.log(`Total de rotas:           ${results.total}`);
  console.log(`✅ Carregadas com sucesso: ${results.success}`);
  console.log(`❌ Falhas no carregamento: ${results.failed}`);
  console.log(`⚠️  Arquivos não encontrados: ${results.notFound}`);

  if (results.times.length > 0) {
    const avgTime = (results.times.reduce((a, b) => a + b, 0) / results.times.length).toFixed(2);
    const maxTime = Math.max(...results.times);
    const minTime = Math.min(...results.times);
    console.log(`\n⏱️  Tempo de carregamento:`);
    console.log(`   Média: ${avgTime}ms`);
    console.log(`   Mínimo: ${minTime}ms`);
    console.log(`   Máximo: ${maxTime}ms`);
  }

  console.log('\n' + '═'.repeat(80));

  if (results.failed > 0) {
    console.log('\n⚠️  ATENÇÃO: Algumas rotas falharam ao carregar!');
    console.log('   Verifique os erros acima para identificar o problema.');
    process.exit(1);
  } else {
    console.log('\n✅ Todas as rotas foram carregadas com sucesso!');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('\n❌ ERRO FATAL:', error);
  process.exit(1);
});
