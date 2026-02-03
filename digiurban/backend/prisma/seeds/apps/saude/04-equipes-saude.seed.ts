/**
 * SEED 04: EQUIPES DE SAÚDE
 *
 * Cria 8 equipes de saúde realistas integradas ao Sistema Unificado V2.0
 *
 * Equipes criadas:
 * - 4 Equipes ESF (Estratégia Saúde da Família)
 * - 2 Equipes NASF (Núcleo de Apoio à Saúde da Família)
 * - 1 Equipe CAPS (Centro de Atenção Psicossocial)
 * - 1 Equipe de Pronto Atendimento
 *
 * Para cada equipe cria:
 * - EquipeSaude (app-specific)
 * - Team (sistema unificado)
 * - TeamMember (membros no sistema unificado)
 * - ProfissionalEquipe (vínculo legado, mantido por compatibilidade)
 * - Microarea (para equipes ESF)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seed04EquipesSaude() {
  console.log('👥 SEED 04: Criando Equipes de Saúde...\n');

  // =====================================================
  // 1. BUSCAR DEPARTAMENTO E UNIDADES
  // =====================================================

  const departamentoSaude = await prisma.department.findFirst({
    where: { code: 'SAUDE' }
  });

  if (!departamentoSaude) {
    throw new Error('❌ Departamento de Saúde não encontrado. Execute o seed 01 primeiro.');
  }

  // Buscar unidades
  const esfJardim = await prisma.organizationalUnit.findFirst({
    where: { sigla: 'ESF-JDESPERANCA', departmentId: departamentoSaude.id },
    include: { UnidadeSaude: true }
  });

  const esfParque = await prisma.organizationalUnit.findFirst({
    where: { sigla: 'ESF-PQFLORES', departmentId: departamentoSaude.id },
    include: { UnidadeSaude: true }
  });

  const ubsCentral = await prisma.organizationalUnit.findFirst({
    where: { sigla: 'UBS-CENTRAL', departmentId: departamentoSaude.id },
    include: { UnidadeSaude: true }
  });

  const ubsNorte = await prisma.organizationalUnit.findFirst({
    where: { sigla: 'UBS-NORTE', departmentId: departamentoSaude.id },
    include: { UnidadeSaude: true }
  });

  const upaCentro = await prisma.organizationalUnit.findFirst({
    where: { sigla: 'UPA-CENTRO', departmentId: departamentoSaude.id },
    include: { UnidadeSaude: true }
  });

  const caps = await prisma.organizationalUnit.findFirst({
    where: { sigla: 'CAPS-CENTRO', departmentId: departamentoSaude.id },
    include: { UnidadeSaude: true }
  });

  console.log('✅ Unidades organizacionais encontradas\n');

  // =====================================================
  // 2. BUSCAR SERVIDORES
  // =====================================================

  const servidores = await prisma.user.findMany({
    where: {
      email: { endsWith: '@saude.sp.gov.br' }
    },
    include: {
      healthData: true,
    }
  });

  if (servidores.length === 0) {
    throw new Error('❌ Servidores de saúde não encontrados. Execute o seed 02 primeiro.');
  }

  console.log(`✅ ${servidores.length} servidores encontrados\n`);

  // Função auxiliar para buscar servidor por email
  const getServidor = (email: string) => servidores.find(s => s.email === email);

  // =====================================================
  // 3. CRIAR EQUIPES
  // =====================================================

  console.log('👥 Criando equipes de saúde...\n');

  const dataInicio = new Date('2024-01-02');
  const equipesCriadas = [];

  // =============== EQUIPE ESF 01 - JARDIM ESPERANÇA ===============

  if (esfJardim?.UnidadeSaude) {
    const drJoao = getServidor('joao.silva@saude.sp.gov.br');
    const enfPatricia = getServidor('patricia.santos@saude.sp.gov.br');
    const tecSandra = getServidor('sandra.dias@saude.sp.gov.br');
    const draFabiana = getServidor('fabiana.ribeiro@saude.sp.gov.br');
    const acsJosefa = getServidor('josefa.silva@saude.sp.gov.br');

    // Criar Team (sistema unificado)
    const team = await prisma.team.create({
      data: {
        nome: 'Equipe Saúde da Família 01 - Jardim Esperança',
        sigla: 'ESF-01-JE',
        tipo: 'PERMANENTE',
        finalidade: 'Atenção Básica à Saúde com foco em territorialização e vínculo',
        departmentId: departamentoSaude.id,
        organizationalUnitId: esfJardim.id,
        coordenadorId: drJoao?.id,
        dataInicio,
        ativo: true,
      }
    });

    // Criar EquipeSaude (app-specific)
    const equipeSaude = await prisma.equipeSaude.create({
      data: {
        ine: '0001234567', // INE fictício mas realista (10 dígitos)
        nome: 'ESF 01 - Jardim Esperança',
        tipo: 'eSF',
        unidadeId: esfJardim.UnidadeSaude.id,
        teamId: team.id,
        ativo: true,
      }
    });

    // Adicionar membros ao Team
    const membros = [
      { user: drJoao, papel: 'COORDENADOR', atribuicoes: 'Coordenação da equipe e atendimento médico' },
      { user: enfPatricia, papel: 'MEMBRO', atribuicoes: 'Enfermagem e gestão de cuidados' },
      { user: tecSandra, papel: 'MEMBRO', atribuicoes: 'Procedimentos de enfermagem e vacinação' },
      { user: draFabiana, papel: 'MEMBRO', atribuicoes: 'Saúde bucal' },
      { user: acsJosefa, papel: 'MEMBRO', atribuicoes: 'Visitas domiciliares e territorialização' },
    ];

    for (const membro of membros) {
      if (membro.user) {
        await prisma.teamMember.create({
          data: {
            teamId: team.id,
            userId: membro.user.id,
            papel: membro.papel,
            atribuicoes: membro.atribuicoes,
            dataInicio,
            ativo: true,
          }
        });

        // Criar também ProfissionalEquipe (legado)
        await prisma.profissionalEquipe.create({
          data: {
            profissionalId: membro.user.id,
            equipeId: equipeSaude.id,
            cbo: membro.user.healthData?.cbo || '999999',
            funcao: membro.atribuicoes,
            dataInicio,
            ativo: true,
          }
        });
      }
    }

    // Criar microáreas
    if (acsJosefa) {
      await prisma.microarea.create({
        data: {
          numero: '01',
          descricao: 'Quadras 1 a 5 - Jardim Esperança',
          equipeId: equipeSaude.id,
          acsId: acsJosefa.id,
          ativo: true,
        }
      });
    }

    equipesCriadas.push(equipeSaude);
    console.log(`   ✅ ESF 01 - Jardim Esperança (INE: ${equipeSaude.ine}) - ${membros.length} membros`);
  }

  // =============== EQUIPE ESF 02 - PARQUE DAS FLORES ===============

  if (esfParque?.UnidadeSaude) {
    const draMaria = getServidor('maria.costa@saude.sp.gov.br');
    const enfMarcos = getServidor('marcos.lopes@saude.sp.gov.br');
    const tecPaulo = getServidor('paulo.gomes@saude.sp.gov.br');
    const drThiago = getServidor('thiago.rocha@saude.sp.gov.br');
    const acsAntonio = getServidor('antonio.souza@saude.sp.gov.br');

    const team = await prisma.team.create({
      data: {
        nome: 'Equipe Saúde da Família 02 - Parque das Flores',
        sigla: 'ESF-02-PF',
        tipo: 'PERMANENTE',
        finalidade: 'Atenção Básica à Saúde com foco em territorialização e vínculo',
        departmentId: departamentoSaude.id,
        organizationalUnitId: esfParque.id,
        coordenadorId: draMaria?.id,
        dataInicio,
        ativo: true,
      }
    });

    const equipeSaude = await prisma.equipeSaude.create({
      data: {
        ine: '0002345678',
        nome: 'ESF 02 - Parque das Flores',
        tipo: 'eSF',
        unidadeId: esfParque.UnidadeSaude.id,
        teamId: team.id,
        ativo: true,
      }
    });

    const membros = [
      { user: draMaria, papel: 'COORDENADOR', atribuicoes: 'Coordenação da equipe e atendimento pediátrico' },
      { user: enfMarcos, papel: 'MEMBRO', atribuicoes: 'Enfermagem e gestão de cuidados' },
      { user: tecPaulo, papel: 'MEMBRO', atribuicoes: 'Procedimentos de enfermagem e vacinação' },
      { user: drThiago, papel: 'MEMBRO', atribuicoes: 'Saúde bucal' },
      { user: acsAntonio, papel: 'MEMBRO', atribuicoes: 'Visitas domiciliares e territorialização' },
    ];

    for (const membro of membros) {
      if (membro.user) {
        await prisma.teamMember.create({
          data: {
            teamId: team.id,
            userId: membro.user.id,
            papel: membro.papel,
            atribuicoes: membro.atribuicoes,
            dataInicio,
            ativo: true,
          }
        });

        await prisma.profissionalEquipe.create({
          data: {
            profissionalId: membro.user.id,
            equipeId: equipeSaude.id,
            cbo: membro.user.healthData?.cbo || '999999',
            funcao: membro.atribuicoes,
            dataInicio,
            ativo: true,
          }
        });
      }
    }

    if (acsAntonio) {
      await prisma.microarea.create({
        data: {
          numero: '01',
          descricao: 'Quadras 1 a 6 - Parque das Flores',
          equipeId: equipeSaude.id,
          acsId: acsAntonio.id,
          ativo: true,
        }
      });
    }

    equipesCriadas.push(equipeSaude);
    console.log(`   ✅ ESF 02 - Parque das Flores (INE: ${equipeSaude.ine}) - ${membros.length} membros`);
  }

  // =============== EQUIPE ESF 03 - UBS CENTRAL (MISTA) ===============

  if (ubsCentral?.UnidadeSaude) {
    const drCarlos = getServidor('carlos.oliveira@saude.sp.gov.br');
    const enfCamila = getServidor('camila.costa@saude.sp.gov.br');
    const tecMariana = getServidor('mariana.santos@saude.sp.gov.br');

    const team = await prisma.team.create({
      data: {
        nome: 'Equipe Saúde da Família 03 - UBS Central',
        sigla: 'ESF-03-UBSC',
        tipo: 'PERMANENTE',
        finalidade: 'Atenção Básica integrada a modelo tradicional',
        departmentId: departamentoSaude.id,
        organizationalUnitId: ubsCentral.id,
        coordenadorId: drCarlos?.id,
        dataInicio,
        ativo: true,
      }
    });

    const equipeSaude = await prisma.equipeSaude.create({
      data: {
        ine: '0003456789',
        nome: 'ESF 03 - UBS Central',
        tipo: 'eSF',
        unidadeId: ubsCentral.UnidadeSaude.id,
        teamId: team.id,
        ativo: true,
      }
    });

    const membros = [
      { user: drCarlos, papel: 'COORDENADOR', atribuicoes: 'Coordenação e atendimento ginecológico' },
      { user: enfCamila, papel: 'MEMBRO', atribuicoes: 'Enfermagem obstétrica e saúde da mulher' },
      { user: tecMariana, papel: 'MEMBRO', atribuicoes: 'Procedimentos de enfermagem' },
    ];

    for (const membro of membros) {
      if (membro.user) {
        await prisma.teamMember.create({
          data: {
            teamId: team.id,
            userId: membro.user.id,
            papel: membro.papel,
            atribuicoes: membro.atribuicoes,
            dataInicio,
            ativo: true,
          }
        });

        await prisma.profissionalEquipe.create({
          data: {
            profissionalId: membro.user.id,
            equipeId: equipeSaude.id,
            cbo: membro.user.healthData?.cbo || '999999',
            funcao: membro.atribuicoes,
            dataInicio,
            ativo: true,
          }
        });
      }
    }

    equipesCriadas.push(equipeSaude);
    console.log(`   ✅ ESF 03 - UBS Central (INE: ${equipeSaude.ine}) - ${membros.length} membros`);
  }

  // =============== EQUIPE ESF 04 - UBS NORTE ===============

  if (ubsNorte?.UnidadeSaude) {
    const enfLuciana = getServidor('luciana.pereira@saude.sp.gov.br');
    const draRenata = getServidor('renata.campos@saude.sp.gov.br');

    const team = await prisma.team.create({
      data: {
        nome: 'Equipe Saúde da Família 04 - UBS Norte',
        sigla: 'ESF-04-UBSN',
        tipo: 'PERMANENTE',
        finalidade: 'Atenção Básica com foco materno-infantil',
        departmentId: departamentoSaude.id,
        organizationalUnitId: ubsNorte.id,
        coordenadorId: enfLuciana?.id,
        dataInicio,
        ativo: true,
      }
    });

    const equipeSaude = await prisma.equipeSaude.create({
      data: {
        ine: '0004567890',
        nome: 'ESF 04 - UBS Norte',
        tipo: 'eSF',
        unidadeId: ubsNorte.UnidadeSaude.id,
        teamId: team.id,
        ativo: true,
      }
    });

    const membros = [
      { user: enfLuciana, papel: 'COORDENADOR', atribuicoes: 'Coordenação e enfermagem pediátrica' },
      { user: draRenata, papel: 'MEMBRO', atribuicoes: 'Saúde bucal infantil' },
    ];

    for (const membro of membros) {
      if (membro.user) {
        await prisma.teamMember.create({
          data: {
            teamId: team.id,
            userId: membro.user.id,
            papel: membro.papel,
            atribuicoes: membro.atribuicoes,
            dataInicio,
            ativo: true,
          }
        });

        await prisma.profissionalEquipe.create({
          data: {
            profissionalId: membro.user.id,
            equipeId: equipeSaude.id,
            cbo: membro.user.healthData?.cbo || '999999',
            funcao: membro.atribuicoes,
            dataInicio,
            ativo: true,
          }
        });
      }
    }

    equipesCriadas.push(equipeSaude);
    console.log(`   ✅ ESF 04 - UBS Norte (INE: ${equipeSaude.ine}) - ${membros.length} membros`);
  }

  // =============== EQUIPE NASF 01 ===============

  if (ubsCentral?.UnidadeSaude) {
    const drRicardo = getServidor('ricardo.ferreira@saude.sp.gov.br');
    const psiBeatriz = getServidor('beatriz.lima@saude.sp.gov.br');

    const team = await prisma.team.create({
      data: {
        nome: 'NASF 01 - Núcleo de Apoio à Saúde da Família',
        sigla: 'NASF-01',
        tipo: 'PERMANENTE',
        finalidade: 'Apoio matricial às equipes de Saúde da Família',
        departmentId: departamentoSaude.id,
        organizationalUnitId: ubsCentral.id,
        coordenadorId: drRicardo?.id,
        dataInicio,
        ativo: true,
      }
    });

    const equipeSaude = await prisma.equipeSaude.create({
      data: {
        ine: '0005678901',
        nome: 'NASF 01',
        tipo: 'NASF',
        unidadeId: ubsCentral.UnidadeSaude.id,
        teamId: team.id,
        ativo: true,
      }
    });

    const membros = [
      { user: drRicardo, papel: 'COORDENADOR', atribuicoes: 'Coordenação NASF e apoio em cardiologia' },
      { user: psiBeatriz, papel: 'MEMBRO', atribuicoes: 'Apoio em saúde mental' },
    ];

    for (const membro of membros) {
      if (membro.user) {
        await prisma.teamMember.create({
          data: {
            teamId: team.id,
            userId: membro.user.id,
            papel: membro.papel,
            atribuicoes: membro.atribuicoes,
            dataInicio,
            ativo: true,
          }
        });

        await prisma.profissionalEquipe.create({
          data: {
            profissionalId: membro.user.id,
            equipeId: equipeSaude.id,
            cbo: membro.user.healthData?.cbo || '999999',
            funcao: membro.atribuicoes,
            dataInicio,
            ativo: true,
          }
        });
      }
    }

    equipesCriadas.push(equipeSaude);
    console.log(`   ✅ NASF 01 (INE: ${equipeSaude.ine}) - ${membros.length} membros`);
  }

  // =============== EQUIPE NASF 02 ===============

  if (ubsNorte?.UnidadeSaude) {
    const draJuliana = getServidor('juliana.barbosa@saude.sp.gov.br');
    const psiGustavo = getServidor('gustavo.dias@saude.sp.gov.br');

    const team = await prisma.team.create({
      data: {
        nome: 'NASF 02 - Núcleo de Apoio à Saúde da Família',
        sigla: 'NASF-02',
        tipo: 'PERMANENTE',
        finalidade: 'Apoio matricial às equipes de Saúde da Família',
        departmentId: departamentoSaude.id,
        organizationalUnitId: ubsNorte.id,
        coordenadorId: draJuliana?.id,
        dataInicio,
        ativo: true,
      }
    });

    const equipeSaude = await prisma.equipeSaude.create({
      data: {
        ine: '0006789012',
        nome: 'NASF 02',
        tipo: 'NASF',
        unidadeId: ubsNorte.UnidadeSaude.id,
        teamId: team.id,
        ativo: true,
      }
    });

    const membros = [
      { user: draJuliana, papel: 'COORDENADOR', atribuicoes: 'Coordenação NASF e apoio em dermatologia' },
      { user: psiGustavo, papel: 'MEMBRO', atribuicoes: 'Apoio em saúde mental e TCC' },
    ];

    for (const membro of membros) {
      if (membro.user) {
        await prisma.teamMember.create({
          data: {
            teamId: team.id,
            userId: membro.user.id,
            papel: membro.papel,
            atribuicoes: membro.atribuicoes,
            dataInicio,
            ativo: true,
          }
        });

        await prisma.profissionalEquipe.create({
          data: {
            profissionalId: membro.user.id,
            equipeId: equipeSaude.id,
            cbo: membro.user.healthData?.cbo || '999999',
            funcao: membro.atribuicoes,
            dataInicio,
            ativo: true,
          }
        });
      }
    }

    equipesCriadas.push(equipeSaude);
    console.log(`   ✅ NASF 02 (INE: ${equipeSaude.ine}) - ${membros.length} membros`);
  }

  // =============== EQUIPE CAPS ===============

  if (caps?.UnidadeSaude) {
    const draAna = getServidor('ana.rodrigues@saude.sp.gov.br');
    const enfRafael = getServidor('rafael.martins@saude.sp.gov.br');
    const psiBeatriz = getServidor('beatriz.lima@saude.sp.gov.br');

    const team = await prisma.team.create({
      data: {
        nome: 'Equipe CAPS Centro',
        sigla: 'EQ-CAPS',
        tipo: 'PERMANENTE',
        finalidade: 'Atenção psicossocial e saúde mental',
        departmentId: departamentoSaude.id,
        organizationalUnitId: caps.id,
        coordenadorId: draAna?.id,
        dataInicio,
        ativo: true,
      }
    });

    const equipeSaude = await prisma.equipeSaude.create({
      data: {
        ine: '0007890123',
        nome: 'Equipe CAPS Centro',
        tipo: 'eAP', // Atenção Primária especializada
        unidadeId: caps.UnidadeSaude.id,
        teamId: team.id,
        ativo: true,
      }
    });

    const membros = [
      { user: draAna, papel: 'COORDENADOR', atribuicoes: 'Coordenação clínica e atendimento psiquiátrico' },
      { user: enfRafael, papel: 'MEMBRO', atribuicoes: 'Enfermagem em saúde mental' },
      { user: psiBeatriz, papel: 'MEMBRO', atribuicoes: 'Atendimento psicológico individual e grupal' },
    ];

    for (const membro of membros) {
      if (membro.user) {
        await prisma.teamMember.create({
          data: {
            teamId: team.id,
            userId: membro.user.id,
            papel: membro.papel,
            atribuicoes: membro.atribuicoes,
            dataInicio,
            ativo: true,
          }
        });

        await prisma.profissionalEquipe.create({
          data: {
            profissionalId: membro.user.id,
            equipeId: equipeSaude.id,
            cbo: membro.user.healthData?.cbo || '999999',
            funcao: membro.atribuicoes,
            dataInicio,
            ativo: true,
          }
        });
      }
    }

    equipesCriadas.push(equipeSaude);
    console.log(`   ✅ Equipe CAPS Centro (INE: ${equipeSaude.ine}) - ${membros.length} membros`);
  }

  // =============== EQUIPE UPA CENTRO ===============

  if (upaCentro?.UnidadeSaude) {
    const drFernando = getServidor('fernando.souza@saude.sp.gov.br');
    const enfMarcos = getServidor('marcos.lopes@saude.sp.gov.br');
    const tecPaulo = getServidor('paulo.gomes@saude.sp.gov.br');

    const team = await prisma.team.create({
      data: {
        nome: 'Equipe UPA Centro - Urgência e Emergência',
        sigla: 'EQ-UPA-CENTRO',
        tipo: 'PERMANENTE',
        finalidade: 'Atendimento de urgência e emergência 24h',
        departmentId: departamentoSaude.id,
        organizationalUnitId: upaCentro.id,
        coordenadorId: drFernando?.id,
        dataInicio,
        ativo: true,
      }
    });

    const equipeSaude = await prisma.equipeSaude.create({
      data: {
        ine: '0008901234',
        nome: 'Equipe UPA Centro',
        tipo: 'eAP',
        unidadeId: upaCentro.UnidadeSaude.id,
        teamId: team.id,
        ativo: true,
      }
    });

    const membros = [
      { user: drFernando, papel: 'COORDENADOR', atribuicoes: 'Coordenação médica e ortopedia de urgência' },
      { user: enfMarcos, papel: 'MEMBRO', atribuicoes: 'Enfermagem de urgência e triagem' },
      { user: tecPaulo, papel: 'MEMBRO', atribuicoes: 'Procedimentos de urgência' },
    ];

    for (const membro of membros) {
      if (membro.user) {
        await prisma.teamMember.create({
          data: {
            teamId: team.id,
            userId: membro.user.id,
            papel: membro.papel,
            atribuicoes: membro.atribuicoes,
            dataInicio,
            ativo: true,
          }
        });

        await prisma.profissionalEquipe.create({
          data: {
            profissionalId: membro.user.id,
            equipeId: equipeSaude.id,
            cbo: membro.user.healthData?.cbo || '999999',
            funcao: membro.atribuicoes,
            dataInicio,
            ativo: true,
          }
        });
      }
    }

    equipesCriadas.push(equipeSaude);
    console.log(`   ✅ Equipe UPA Centro (INE: ${equipeSaude.ine}) - ${membros.length} membros`);
  }

  console.log(`\n✅ SEED 04 CONCLUÍDO: ${equipesCriadas.length} equipes de saúde criadas com sucesso!\n`);
  console.log('📊 Resumo:');
  console.log(`   • 4 Equipes ESF (Estratégia Saúde da Família)`);
  console.log(`   • 2 Equipes NASF (Núcleo de Apoio)`);
  console.log(`   • 1 Equipe CAPS (Saúde Mental)`);
  console.log(`   • 1 Equipe UPA (Urgência e Emergência)`);
  console.log(`\n   🔗 Todas as equipes integradas ao Sistema Unificado V2.0`);
  console.log(`   📍 Microáreas criadas para equipes ESF\n`);

  return equipesCriadas;
}

// Executar se chamado diretamente
if (require.main === module) {
  seed04EquipesSaude()
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
