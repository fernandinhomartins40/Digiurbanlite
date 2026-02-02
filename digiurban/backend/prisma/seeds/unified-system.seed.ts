import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedUnifiedSystem() {
  console.log('🏛️ Seeding Sistema Unificado de Vinculação de Servidores...');

  try {
    // Buscar departamentos existentes
    const departments = await prisma.department.findMany({
      where: { isActive: true },
    });

    if (departments.length === 0) {
      console.log('⚠️  Nenhum departamento encontrado. Criando departamentos de exemplo...');

      // Criar departamentos básicos
      const depSaude = await prisma.department.create({
        data: {
          name: 'Secretaria de Saúde',
          code: 'SAUDE',
          description: 'Secretaria Municipal de Saúde',
        },
      });

      const depEducacao = await prisma.department.create({
        data: {
          name: 'Secretaria de Educação',
          code: 'EDUCACAO',
          description: 'Secretaria Municipal de Educação',
        },
      });

      const depObras = await prisma.department.create({
        data: {
          name: 'Secretaria de Obras e Urbanismo',
          code: 'OBRAS',
          description: 'Secretaria Municipal de Obras e Urbanismo',
        },
      });

      const depAssistencia = await prisma.department.create({
        data: {
          name: 'Secretaria de Assistência Social',
          code: 'ASSISTENCIA',
          description: 'Secretaria Municipal de Assistência Social',
        },
      });

      departments.push(depSaude, depEducacao, depObras, depAssistencia);
    }

    // ============================================
    // ESTRUTURA ORGANIZACIONAL
    // ============================================
    console.log('📋 Criando estrutura organizacional...');

    for (const dept of departments) {
      // Criar Secretaria (nível 1)
      const secretaria = await prisma.organizationalUnit.upsert({
        where: {
          departmentId_sigla: {
            departmentId: dept.id,
            sigla: dept.code || dept.name.substring(0, 6).toUpperCase(),
          },
        },
        update: {},
        create: {
          nome: dept.name,
          sigla: dept.code || dept.name.substring(0, 6).toUpperCase(),
          tipo: 'SECRETARIA',
          nivel: 1,
          departmentId: dept.id,
          descricao: dept.description || `Estrutura organizacional da ${dept.name}`,
          competencias: [
            'Planejamento estratégico',
            'Gestão de recursos',
            'Coordenação de atividades',
          ],
        },
      });

      console.log(`   ✅ Secretaria: ${secretaria.nome}`);

      // Criar Diretorias (nível 2)
      const diretorias = [
        {
          nome: 'Diretoria Administrativa',
          sigla: 'DIRADM',
          competencias: ['Gestão de pessoal', 'Recursos humanos', 'Administração geral'],
        },
        {
          nome: 'Diretoria Técnica',
          sigla: 'DIRTEC',
          competencias: ['Execução técnica', 'Planejamento operacional', 'Supervisão de atividades'],
        },
      ];

      for (const dir of diretorias) {
        const diretoria = await prisma.organizationalUnit.upsert({
          where: {
            departmentId_sigla: {
              departmentId: dept.id,
              sigla: dir.sigla,
            },
          },
          update: {},
          create: {
            nome: dir.nome,
            sigla: dir.sigla,
            tipo: 'DIRETORIA',
            nivel: 2,
            departmentId: dept.id,
            parentId: secretaria.id,
            competencias: dir.competencias,
          },
        });

        console.log(`      ✅ Diretoria: ${diretoria.nome}`);

        // Criar Coordenadorias (nível 3)
        const coordenadorias = [
          {
            nome: 'Coordenadoria de Gestão',
            sigla: `${dir.sigla}-CG`,
          },
          {
            nome: 'Coordenadoria de Operações',
            sigla: `${dir.sigla}-CO`,
          },
        ];

        for (const coord of coordenadorias) {
          const coordenadoria = await prisma.organizationalUnit.upsert({
            where: {
              departmentId_sigla: {
                departmentId: dept.id,
                sigla: coord.sigla,
              },
            },
            update: {},
            create: {
              nome: coord.nome,
              sigla: coord.sigla,
              tipo: 'COORDENADORIA',
              nivel: 3,
              departmentId: dept.id,
              parentId: diretoria.id,
            },
          });

          console.log(`         ✅ Coordenadoria: ${coordenadoria.nome}`);
        }
      }
    }

    // ============================================
    // CARGOS
    // ============================================
    console.log('\n💼 Criando cargos...');

    const cargosPadrao = [
      {
        nome: 'Secretário Municipal',
        tipo: 'COMISSIONADO' as const,
        nivel: 'SECRETARIADO' as const,
        categoria: 'Gestão Pública',
        cargaHorariaPadrao: 40,
      },
      {
        nome: 'Diretor',
        tipo: 'COMISSIONADO' as const,
        nivel: 'DIRECAO' as const,
        categoria: 'Gestão',
        cargaHorariaPadrao: 40,
      },
      {
        nome: 'Coordenador',
        tipo: 'COMISSIONADO' as const,
        nivel: 'COORDENACAO' as const,
        categoria: 'Coordenação',
        cargaHorariaPadrao: 40,
      },
      {
        nome: 'Assessor Técnico',
        tipo: 'COMISSIONADO' as const,
        nivel: 'ESPECIALISTA' as const,
        categoria: 'Assessoria',
        cargaHorariaPadrao: 40,
      },
      {
        nome: 'Assistente Administrativo',
        tipo: 'EFETIVO' as const,
        nivel: 'TECNICO' as const,
        categoria: 'Administrativo',
        cargaHorariaPadrao: 40,
      },
      {
        nome: 'Auxiliar Administrativo',
        tipo: 'EFETIVO' as const,
        nivel: 'OPERACIONAL' as const,
        categoria: 'Administrativo',
        cargaHorariaPadrao: 40,
      },
    ];

    for (const dept of departments) {
      for (const cargo of cargosPadrao) {
        await prisma.position.upsert({
          where: {
            departmentId_nome: {
              departmentId: dept.id,
              nome: cargo.nome,
            },
          },
          update: {},
          create: {
            ...cargo,
            departmentId: dept.id,
            descricao: `${cargo.nome} da ${dept.name}`,
          },
        });
      }
    }

    console.log(`   ✅ Criados ${cargosPadrao.length} cargos para cada departamento`);

    // ============================================
    // CARGOS ESPECÍFICOS POR ÁREA
    // ============================================

    // Saúde
    const depSaude = departments.find(d => d.code === 'SAUDE' || d.name.includes('Saúde'));
    if (depSaude) {
      const cargosSaude = [
        {
          nome: 'Médico',
          tipo: 'EFETIVO' as const,
          nivel: 'ESPECIALISTA' as const,
          categoria: 'Médico',
          cbo: '2231',
          cargaHorariaPadrao: 40,
        },
        {
          nome: 'Enfermeiro',
          tipo: 'EFETIVO' as const,
          nivel: 'ESPECIALISTA' as const,
          categoria: 'Enfermeiro',
          cbo: '2235',
          cargaHorariaPadrao: 40,
        },
        {
          nome: 'Técnico de Enfermagem',
          tipo: 'EFETIVO' as const,
          nivel: 'TECNICO' as const,
          categoria: 'Técnico de Enfermagem',
          cbo: '3222',
          cargaHorariaPadrao: 40,
        },
        {
          nome: 'Agente Comunitário de Saúde',
          tipo: 'EFETIVO' as const,
          nivel: 'OPERACIONAL' as const,
          categoria: 'ACS',
          cbo: '5151',
          cargaHorariaPadrao: 40,
        },
        {
          nome: 'Dentista',
          tipo: 'EFETIVO' as const,
          nivel: 'ESPECIALISTA' as const,
          categoria: 'Dentista',
          cbo: '2232',
          cargaHorariaPadrao: 40,
        },
      ];

      for (const cargo of cargosSaude) {
        await prisma.position.upsert({
          where: {
            departmentId_nome: {
              departmentId: depSaude.id,
              nome: cargo.nome,
            },
          },
          update: {},
          create: {
            ...cargo,
            departmentId: depSaude.id,
            descricao: `${cargo.nome} da Secretaria de Saúde`,
          },
        });
      }

      console.log(`   ✅ Criados ${cargosSaude.length} cargos específicos de Saúde`);
    }

    // Educação
    const depEducacao = departments.find(d => d.code === 'EDUCACAO' || d.name.includes('Educação'));
    if (depEducacao) {
      const cargosEducacao = [
        {
          nome: 'Professor',
          tipo: 'EFETIVO' as const,
          nivel: 'ESPECIALISTA' as const,
          categoria: 'Professor',
          cbo: '2311',
          cargaHorariaPadrao: 40,
        },
        {
          nome: 'Coordenador Pedagógico',
          tipo: 'COMISSIONADO' as const,
          nivel: 'COORDENACAO' as const,
          categoria: 'Coordenador Pedagógico',
          cbo: '2311',
          cargaHorariaPadrao: 40,
        },
        {
          nome: 'Diretor de Escola',
          tipo: 'COMISSIONADO' as const,
          nivel: 'DIRECAO' as const,
          categoria: 'Diretor',
          cargaHorariaPadrao: 40,
        },
      ];

      for (const cargo of cargosEducacao) {
        await prisma.position.upsert({
          where: {
            departmentId_nome: {
              departmentId: depEducacao.id,
              nome: cargo.nome,
            },
          },
          update: {},
          create: {
            ...cargo,
            departmentId: depEducacao.id,
            descricao: `${cargo.nome} da Secretaria de Educação`,
          },
        });
      }

      console.log(`   ✅ Criados ${cargosEducacao.length} cargos específicos de Educação`);
    }

    // ============================================
    // FUNÇÕES GRATIFICADAS E COMISSIONADAS
    // ============================================
    console.log('\n🎖️  Criando funções...');

    const funcoes = [
      {
        nome: 'Função Gratificada de Coordenação',
        tipo: 'GRATIFICADA' as const,
        simbolo: 'FG-1',
        valor: 1000.00,
      },
      {
        nome: 'Função Gratificada de Chefia',
        tipo: 'GRATIFICADA' as const,
        simbolo: 'FG-2',
        valor: 1500.00,
      },
      {
        nome: 'Cargo em Comissão - Assessor I',
        tipo: 'COMISSIONADA' as const,
        simbolo: 'CC-1',
        valor: 3000.00,
      },
      {
        nome: 'Cargo em Comissão - Assessor II',
        tipo: 'COMISSIONADA' as const,
        simbolo: 'CC-2',
        valor: 4000.00,
      },
      {
        nome: 'Cargo em Comissão - Diretor',
        tipo: 'COMISSIONADA' as const,
        simbolo: 'CC-3',
        valor: 6000.00,
      },
    ];

    for (const dept of departments) {
      for (const funcao of funcoes) {
        await prisma.function.upsert({
          where: {
            departmentId_simbolo: {
              departmentId: dept.id,
              simbolo: funcao.simbolo,
            },
          },
          update: {},
          create: {
            ...funcao,
            departmentId: dept.id,
            descricao: `${funcao.nome} - ${dept.name}`,
          },
        });
      }
    }

    console.log(`   ✅ Criadas ${funcoes.length} funções para cada departamento`);

    console.log('\n✅ Seed do Sistema Unificado concluído com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`   • ${departments.length} Departamentos/Secretarias`);
    console.log(`   • Estrutura organizacional com 3 níveis (Secretaria → Diretoria → Coordenadoria)`);
    console.log(`   • ${cargosPadrao.length} cargos padrão por departamento`);
    console.log(`   • Cargos específicos por área (Saúde, Educação, etc)`);
    console.log(`   • ${funcoes.length} funções gratificadas/comissionadas por departamento`);

  } catch (error) {
    console.error('❌ Erro ao executar seed do sistema unificado:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedUnifiedSystem()
    .then(() => {
      console.log('✅ Seed executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro ao executar seed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
