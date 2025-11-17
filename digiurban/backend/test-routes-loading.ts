/**
 * Script de diagnóstico para identificar qual rota está causando o crash
 * Testa o carregamento individual de cada arquivo de rota TypeScript
 */

import path from 'path';
import fs from 'fs';

// Lista de todas as rotas do index.ts na ordem em que são carregadas
const routes = [
  { path: './src/routes/admin-auth', mount: '/api/admin/auth', name: 'admin-auth', critical: true },
  { path: './src/routes/citizen-auth', mount: '/api/auth/citizen', name: 'citizen-auth', critical: true },
  { path: './src/routes/public', mount: '/api/public', name: 'public' },
  { path: './src/routes/services', mount: '/api/services', name: 'services' },
  { path: './src/routes/protocols-simplified.routes', mount: '/api/protocols', name: 'protocols-simplified' },
  { path: './src/routes/admin-management', mount: '/api/admin/management', name: 'admin-management' },
  { path: './src/routes/admin-chamados', mount: '/api/admin/chamados', name: 'admin-chamados' },
  { path: './src/routes/admin-reports', mount: '/api/admin/relatorios', name: 'admin-reports' },
  { path: './src/routes/admin-gabinete', mount: '/api/admin/gabinete', name: 'admin-gabinete' },
  { path: './src/routes/admin-citizens', mount: '/api/admin/citizens', name: 'admin-citizens' },
  { path: './src/routes/citizens', mount: '/api/citizens', name: 'citizens' },
  { path: './src/routes/citizen-services', mount: '/api/citizen/services', name: 'citizen-services' },
  { path: './src/routes/citizen-protocols', mount: '/api/citizen/protocols', name: 'citizen-protocols' },
  { path: './src/routes/citizen-programs', mount: '/api/citizen', name: 'citizen-programs' },
  { path: './src/routes/citizen-family', mount: '/api/citizen/family', name: 'citizen-family' },
  { path: './src/routes/citizen-documents', mount: '/api/citizen/documents', name: 'citizen-documents' },
  { path: './src/routes/citizen-notifications', mount: '/api/citizen/notifications', name: 'citizen-notifications' },
  { path: './src/routes/secretarias-saude', mount: '/api/secretarias/saude', name: 'secretarias-saude' },
  { path: './src/routes/secretarias-educacao', mount: '/api/admin/secretarias/educacao', name: 'secretarias-educacao' },
  { path: './src/routes/secretarias-assistencia-social', mount: '/api/secretarias/assistencia-social', name: 'secretarias-assistencia-social' },
  { path: './src/routes/secretarias-agricultura', mount: '/api/admin/secretarias/agricultura', name: 'secretarias-agricultura' },
  { path: './src/routes/secretarias-agricultura-produtores', mount: '/api/admin/secretarias/agricultura/produtores', name: 'secretarias-agricultura-produtores' },
  { path: './src/routes/secretarias-cultura', mount: '/api/secretarias/cultura', name: 'secretarias-cultura' },
  { path: './src/routes/secretarias-esportes', mount: '/api/secretarias/esportes', name: 'secretarias-esportes' },
  { path: './src/routes/secretarias-habitacao', mount: '/api/secretarias/habitacao', name: 'secretarias-habitacao' },
  { path: './src/routes/secretarias-seguranca', mount: '/api/admin/secretarias/seguranca', name: 'secretarias-seguranca' },
  { path: './src/routes/secretarias-meio-ambiente', mount: '/api/admin/secretarias/meio-ambiente', name: 'secretarias-meio-ambiente' },
  { path: './src/routes/secretarias-obras-publicas', mount: '/api/admin/secretarias/obras-publicas', name: 'secretarias-obras-publicas' },
  { path: './src/routes/secretarias-planejamento-urbano', mount: '/api/admin/secretarias/planejamento-urbano', name: 'secretarias-planejamento-urbano' },
  { path: './src/routes/secretarias-servicos-publicos', mount: '/api/admin/secretarias/servicos-publicos', name: 'secretarias-servicos-publicos' },
  { path: './src/routes/secretarias-turismo', mount: '/api/admin/secretarias/turismo', name: 'secretarias-turismo' },
  { path: './src/routes/admin-secretarias', mount: '/api/secretarias', name: 'admin-secretarias' },
  { path: './src/routes/custom-modules', mount: '/api/admin/custom-modules', name: 'custom-modules' },
  { path: './src/routes/service-templates', mount: '/api/admin/templates', name: 'service-templates' },
  { path: './src/routes/admin-email', mount: '/api/admin/email', name: 'admin-email' },
  { path: './src/routes/integrations', mount: '/api/integrations', name: 'integrations' },
  { path: './src/routes/municipality-config', mount: '/api/municipality', name: 'municipality-config' },
  { path: './src/routes/admin-agriculture', mount: '/api/admin/agriculture', name: 'admin-agriculture' },
  { path: './src/routes/protocol-interactions', mount: '/api/protocols', name: 'protocol-interactions' },
  { path: './src/routes/protocol-documents', mount: '/api/protocols', name: 'protocol-documents' },
  { path: './src/routes/protocol-pendings', mount: '/api/protocols', name: 'protocol-pendings' },
  { path: './src/routes/protocol-stages', mount: '/api/protocols', name: 'protocol-stages' },
  { path: './src/routes/protocol-sla', mount: '/api/protocols', name: 'protocol-sla' },
  { path: './src/routes/module-workflows', mount: '/api/workflows', name: 'module-workflows' },
];

console.log('🔍 DIAGNÓSTICO DE CARREGAMENTO DE ROTAS\n');
console.log('═'.repeat(80));

interface RouteTestResult {
  success: boolean;
  error?: string;
  time: number;
  errorDetails?: string;
}

async function testRoute(route: typeof routes[0]): Promise<RouteTestResult> {
  const startTime = Date.now();
  try {
    // Verificar se arquivo existe
    const filePath = path.resolve(__dirname, route.path + '.ts');
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  ${route.name.padEnd(40)} - ARQUIVO NÃO ENCONTRADO`);
      return { success: false, error: 'FILE_NOT_FOUND', time: 0 };
    }

    // Tentar carregar o módulo dinamicamente
    const module = await import(route.path);
    const loadTime = Date.now() - startTime;

    if (!module || !module.default) {
      console.log(`❌ ${route.name.padEnd(40)} - SEM EXPORT DEFAULT (${loadTime}ms)`);
      return { success: false, error: 'NO_DEFAULT_EXPORT', time: loadTime };
    }

    console.log(`✅ ${route.name.padEnd(40)} - OK (${loadTime}ms)`);
    return { success: true, time: loadTime };
  } catch (error: any) {
    const loadTime = Date.now() - startTime;
    console.log(`❌ ${route.name.padEnd(40)} - ERRO (${loadTime}ms)`);
    console.log(`   ${error.message}`);

    // Pegar primeiras linhas do stack trace
    if (error.stack) {
      const stackLines = error.stack.split('\n').slice(1, 4);
      stackLines.forEach((line: string) => console.log(`   ${line.trim()}`));
    }

    return { success: false, error: error.message, time: loadTime, errorDetails: error.stack };
  }
}

async function main() {
  const results = {
    total: routes.length,
    success: 0,
    failed: 0,
    notFound: 0,
    times: [] as number[],
    failedRoutes: [] as string[]
  };

  console.log(`Testando ${routes.length} rotas...\n`);

  for (const route of routes) {
    const result = await testRoute(route);

    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.failedRoutes.push(route.name);
      if (result.error === 'FILE_NOT_FOUND') {
        results.notFound++;
      }
    }

    if (result.time > 0) {
      results.times.push(result.time);
    }

    // Pequeno delay para evitar problemas de concorrência
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  console.log('\n' + '═'.repeat(80));
  console.log('📊 RESUMO DO DIAGNÓSTICO\n');
  console.log(`Total de rotas:            ${results.total}`);
  console.log(`✅ Carregadas com sucesso:  ${results.success}`);
  console.log(`❌ Falhas no carregamento:  ${results.failed}`);
  console.log(`⚠️  Arquivos não encontrados: ${results.notFound}`);

  if (results.times.length > 0) {
    const avgTime = (results.times.reduce((a, b) => a + b, 0) / results.times.length).toFixed(2);
    const maxTime = Math.max(...results.times);
    const minTime = Math.min(...results.times);
    console.log(`\n⏱️  Tempo de carregamento:`);
    console.log(`   Média: ${avgTime}ms`);
    console.log(`   Mínimo: ${minTime}ms`);
    console.log(`   Máximo: ${maxTime}ms`);
    console.log(`   Total: ${results.times.reduce((a, b) => a + b, 0)}ms`);
  }

  if (results.failed > 0) {
    console.log(`\n❌ ROTAS COM FALHA (${results.failed}):`);
    results.failedRoutes.forEach(route => console.log(`   - ${route}`));
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
  console.error(error.stack);
  process.exit(1);
});
