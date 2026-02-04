/**
 * Script de Validação - Implementação RENAME
 *
 * Valida se todos os componentes da implementação RENAME estão funcionando corretamente
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ValidationResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
}

const results: ValidationResult[] = [];

function addResult(test: string, status: 'PASS' | 'FAIL' | 'WARN', message: string) {
  results.push({ test, status, message });
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${emoji} ${test}: ${message}`);
}

async function validateRenameImplementation() {
  console.log('🔍 Iniciando validação da implementação RENAME...\n');

  // 1. Verificar arquivo JSON de dados
  console.log('📦 Teste 1: Verificando arquivo de dados RENAME...');
  try {
    const jsonPath = path.join(__dirname, '..', 'src', 'data', 'rename-2024-medicamentos.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      if (data.length >= 100) {
        addResult(
          'Arquivo JSON RENAME',
          'PASS',
          `${data.length} medicamentos encontrados no arquivo`
        );
      } else {
        addResult('Arquivo JSON RENAME', 'WARN', `Apenas ${data.length} medicamentos (esperado: 100+)`);
      }
    } else {
      addResult('Arquivo JSON RENAME', 'FAIL', 'Arquivo não encontrado');
    }
  } catch (error: any) {
    addResult('Arquivo JSON RENAME', 'FAIL', `Erro ao ler arquivo: ${error.message}`);
  }

  // 2. Verificar medicamentos RENAME no banco
  console.log('\n💊 Teste 2: Verificando medicamentos RENAME no banco de dados...');
  try {
    const renameMedicamentos = await prisma.medicamento.findMany({
      where: { isRename: true },
    });

    if (renameMedicamentos.length >= 100) {
      addResult(
        'Medicamentos RENAME no banco',
        'PASS',
        `${renameMedicamentos.length} medicamentos RENAME cadastrados`
      );
    } else if (renameMedicamentos.length > 0) {
      addResult(
        'Medicamentos RENAME no banco',
        'WARN',
        `Apenas ${renameMedicamentos.length} medicamentos (execute: npm run db:seed:rename)`
      );
    } else {
      addResult(
        'Medicamentos RENAME no banco',
        'FAIL',
        'Nenhum medicamento RENAME encontrado. Execute: npm run db:seed:rename'
      );
    }
  } catch (error: any) {
    addResult('Medicamentos RENAME no banco', 'FAIL', `Erro de banco: ${error.message}`);
  }

  // 3. Verificar distribuição por categoria
  console.log('\n📊 Teste 3: Verificando distribuição de medicamentos...');
  try {
    const total = await prisma.medicamento.count({ where: { isRename: true } });
    const controlados = await prisma.medicamento.count({
      where: { isRename: true, isControlado: true },
    });
    const naoControlados = total - controlados;

    addResult(
      'Distribuição de medicamentos',
      'PASS',
      `Total: ${total} | Controlados: ${controlados} | Não-controlados: ${naoControlados}`
    );
  } catch (error: any) {
    addResult('Distribuição de medicamentos', 'FAIL', `Erro: ${error.message}`);
  }

  // 4. Testar busca por nome
  console.log('\n🔍 Teste 4: Testando busca por nome...');
  try {
    const paracetamol = await prisma.medicamento.findMany({
      where: {
        isRename: true,
        nome: { contains: 'Paracetamol', mode: 'insensitive' },
      },
    });

    if (paracetamol.length >= 2) {
      addResult('Busca por nome', 'PASS', `${paracetamol.length} resultados para "Paracetamol"`);
    } else {
      addResult(
        'Busca por nome',
        'WARN',
        `Apenas ${paracetamol.length} resultados (esperado: 2+ variações)`
      );
    }
  } catch (error: any) {
    addResult('Busca por nome', 'FAIL', `Erro na busca: ${error.message}`);
  }

  // 5. Testar busca por princípio ativo
  console.log('\n🧪 Teste 5: Testando busca por princípio ativo...');
  try {
    const dipirona = await prisma.medicamento.findMany({
      where: {
        isRename: true,
        principioAtivo: { contains: 'Dipirona', mode: 'insensitive' },
      },
    });

    if (dipirona.length >= 2) {
      addResult(
        'Busca por princípio ativo',
        'PASS',
        `${dipirona.length} resultados para "Dipirona"`
      );
    } else {
      addResult(
        'Busca por princípio ativo',
        'WARN',
        `Apenas ${dipirona.length} resultados`
      );
    }
  } catch (error: any) {
    addResult('Busca por princípio ativo', 'FAIL', `Erro na busca: ${error.message}`);
  }

  // 6. Verificar medicamentos controlados
  console.log('\n🔒 Teste 6: Verificando medicamentos controlados...');
  try {
    const controlados = await prisma.medicamento.findMany({
      where: {
        isRename: true,
        isControlado: true,
      },
      select: {
        nome: true,
        principioAtivo: true,
      },
    });

    if (controlados.length >= 5) {
      addResult(
        'Medicamentos controlados',
        'PASS',
        `${controlados.length} medicamentos controlados identificados`
      );
      console.log('   Exemplos:', controlados.slice(0, 3).map((m) => m.nome).join(', '));
    } else {
      addResult(
        'Medicamentos controlados',
        'WARN',
        `Apenas ${controlados.length} medicamentos controlados`
      );
    }
  } catch (error: any) {
    addResult('Medicamentos controlados', 'FAIL', `Erro: ${error.message}`);
  }

  // 7. Verificar códigos CATMAT
  console.log('\n🏷️ Teste 7: Verificando códigos CATMAT...');
  try {
    const comCatmat = await prisma.medicamento.count({
      where: {
        isRename: true,
        catmat: { not: null },
      },
    });

    const total = await prisma.medicamento.count({ where: { isRename: true } });
    const percentual = ((comCatmat / total) * 100).toFixed(1);

    if (comCatmat === total) {
      addResult('Códigos CATMAT', 'PASS', `100% dos medicamentos têm código CATMAT`);
    } else if (comCatmat > total * 0.9) {
      addResult('Códigos CATMAT', 'PASS', `${percentual}% dos medicamentos têm código CATMAT`);
    } else {
      addResult('Códigos CATMAT', 'WARN', `Apenas ${percentual}% têm código CATMAT`);
    }
  } catch (error: any) {
    addResult('Códigos CATMAT', 'FAIL', `Erro: ${error.message}`);
  }

  // 8. Verificar formas farmacêuticas
  console.log('\n💊 Teste 8: Verificando formas farmacêuticas...');
  try {
    const formas = await prisma.medicamento.groupBy({
      by: ['tipo'],
      where: { isRename: true },
      _count: { tipo: true },
    });

    if (formas.length >= 5) {
      addResult(
        'Formas farmacêuticas',
        'PASS',
        `${formas.length} formas farmacêuticas diferentes`
      );
      formas.forEach((f) => {
        if (f.tipo) {
          console.log(`   - ${f.tipo}: ${f._count.tipo} medicamentos`);
        }
      });
    } else {
      addResult(
        'Formas farmacêuticas',
        'WARN',
        `Apenas ${formas.length} formas farmacêuticas`
      );
    }
  } catch (error: any) {
    addResult('Formas farmacêuticas', 'FAIL', `Erro: ${error.message}`);
  }

  // 9. Verificar script de seed
  console.log('\n📝 Teste 9: Verificando script de seed...');
  try {
    const seedPath = path.join(__dirname, '..', 'prisma', 'seeds', 'seed-rename-medicamentos.ts');
    if (fs.existsSync(seedPath)) {
      addResult('Script de seed', 'PASS', 'Script encontrado e pronto para uso');
    } else {
      addResult('Script de seed', 'FAIL', 'Script de seed não encontrado');
    }
  } catch (error: any) {
    addResult('Script de seed', 'FAIL', `Erro: ${error.message}`);
  }

  // 10. Verificar arquivos do frontend
  console.log('\n🎨 Teste 10: Verificando arquivos do frontend...');
  try {
    const autocompleteComponent = path.join(
      __dirname,
      '..',
      '..',
      'frontend',
      'components',
      'saude',
      'farmacia',
      'MedicamentoRenameAutocomplete.tsx'
    );

    const novoEstoquePage = path.join(
      __dirname,
      '..',
      '..',
      'frontend',
      'app',
      'admin',
      'apps',
      'saude',
      'farmacia',
      'estoque',
      'novo',
      'page.tsx'
    );

    const typesFile = path.join(
      __dirname,
      '..',
      '..',
      'frontend',
      'types',
      'saude',
      'farmacia.ts'
    );

    let frontendOk = true;

    if (!fs.existsSync(autocompleteComponent)) {
      addResult('Componente Autocomplete', 'FAIL', 'Componente não encontrado');
      frontendOk = false;
    }

    if (!fs.existsSync(novoEstoquePage)) {
      addResult('Página de cadastro', 'FAIL', 'Página não encontrada');
      frontendOk = false;
    }

    if (!fs.existsSync(typesFile)) {
      addResult('Tipos TypeScript', 'FAIL', 'Arquivo de tipos não encontrado');
      frontendOk = false;
    }

    if (frontendOk) {
      addResult('Arquivos frontend', 'PASS', 'Todos os arquivos frontend encontrados');
    }
  } catch (error: any) {
    addResult('Arquivos frontend', 'FAIL', `Erro: ${error.message}`);
  }

  // Resumo final
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMO DA VALIDAÇÃO');
  console.log('='.repeat(80));

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const warnings = results.filter((r) => r.status === 'WARN').length;

  console.log(`\n✅ Passou: ${passed}`);
  console.log(`❌ Falhou: ${failed}`);
  console.log(`⚠️  Avisos: ${warnings}`);

  const successRate = ((passed / results.length) * 100).toFixed(1);
  console.log(`\n📈 Taxa de sucesso: ${successRate}%`);

  if (failed === 0 && warnings === 0) {
    console.log('\n🎉 IMPLEMENTAÇÃO 100% VALIDADA! Sistema pronto para produção.');
    process.exit(0);
  } else if (failed === 0) {
    console.log('\n✅ Implementação validada com avisos. Revise os avisos antes de produção.');
    process.exit(0);
  } else {
    console.log('\n❌ Implementação FALHOU na validação. Corrija os erros antes de continuar.');
    process.exit(1);
  }
}

// Executar validação
validateRenameImplementation()
  .catch((error) => {
    console.error('💥 Erro fatal durante validação:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
