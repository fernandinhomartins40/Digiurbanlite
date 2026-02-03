/**
 * SEED 01: UNIDADES DE SAÚDE COMPLETAS
 *
 * Cria 12 unidades de saúde realistas com vínculo ao Sistema Unificado V2.0
 *
 * Estrutura:
 * - Secretaria de Saúde (OrganizationalUnit - Nível 1)
 *   ├─ Diretoria de Atenção Básica (Nível 2)
 *   │  ├─ UBS Central, UBS Norte, UBS Sul, UBS Vila Nova (Nível 3)
 *   │  ├─ ESF Jardim Esperança, ESF Parque das Flores (Nível 3)
 *   │  └─ Policlínica Municipal (Nível 3)
 *   ├─ Diretoria de Urgência e Emergência (Nível 2)
 *   │  ├─ UPA 24h Centro, UPA 24h Norte (Nível 3)
 *   │  └─ Hospital Municipal São João (Nível 3)
 *   └─ Diretoria de Saúde Mental (Nível 2)
 *      ├─ CAPS Centro (Nível 3)
 *      └─ Centro Especializado em Reabilitação (Nível 3)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seed01UnidadesSaudeCompletas() {
  console.log('🏥 SEED 01: Criando Unidades de Saúde Completas...\n');

  // =====================================================
  // 1. BUSCAR OU CRIAR SECRETARIA DE SAÚDE
  // =====================================================

  let departamentoSaude = await prisma.department.findFirst({
    where: { code: 'SAUDE' }
  });

  if (!departamentoSaude) {
    console.log('📋 Criando Departamento de Saúde...');
    departamentoSaude = await prisma.department.create({
      data: {
        name: 'Secretaria Municipal de Saúde',
        code: 'SAUDE',
        description: 'Secretaria responsável pela gestão da saúde pública municipal',
        isActive: true,
      }
    });
    console.log(`   ✅ Departamento criado: ${departamentoSaude.name}\n`);
  } else {
    console.log(`   ✅ Departamento encontrado: ${departamentoSaude.name}\n`);
  }

  // =====================================================
  // 2. CRIAR ESTRUTURA ORGANIZACIONAL - NÍVEL 1
  // =====================================================

  console.log('🏛️  Criando estrutura organizacional...');

  const secretariaSaude = await prisma.organizationalUnit.upsert({
    where: {
      departmentId_sigla: {
        departmentId: departamentoSaude.id,
        sigla: 'SMS',
      }
    },
    update: {},
    create: {
      nome: 'Secretaria Municipal de Saúde',
      sigla: 'SMS',
      tipo: 'SECRETARIA',
      nivel: 1,
      departmentId: departamentoSaude.id,
      descricao: 'Órgão responsável pela gestão do Sistema Único de Saúde (SUS) no município',
      competencias: [
        'Formulação da política municipal de saúde',
        'Coordenação do SUS Municipal',
        'Gestão das unidades de saúde',
        'Vigilância em saúde',
      ],
    }
  });
  console.log(`   ✅ Secretaria criada: ${secretariaSaude.nome}`);

  // =====================================================
  // 3. CRIAR DIRETORIAS - NÍVEL 2
  // =====================================================

  const diretoriaAtencaoBasica = await prisma.organizationalUnit.upsert({
    where: {
      departmentId_sigla: {
        departmentId: departamentoSaude.id,
        sigla: 'DAB',
      }
    },
    update: {},
    create: {
      nome: 'Diretoria de Atenção Básica',
      sigla: 'DAB',
      tipo: 'DIRETORIA',
      nivel: 2,
      departmentId: departamentoSaude.id,
      parentId: secretariaSaude.id,
      descricao: 'Responsável pela coordenação das UBS, ESF e atenção primária',
      competencias: [
        'Coordenação das Unidades Básicas de Saúde',
        'Gestão da Estratégia Saúde da Família',
        'Programas de atenção básica',
        'Vigilância epidemiológica',
      ],
    }
  });
  console.log(`   ✅ Diretoria criada: ${diretoriaAtencaoBasica.nome}`);

  const diretoriaUrgenciaEmergencia = await prisma.organizationalUnit.upsert({
    where: {
      departmentId_sigla: {
        departmentId: departamentoSaude.id,
        sigla: 'DUE',
      }
    },
    update: {},
    create: {
      nome: 'Diretoria de Urgência e Emergência',
      sigla: 'DUE',
      tipo: 'DIRETORIA',
      nivel: 2,
      departmentId: departamentoSaude.id,
      parentId: secretariaSaude.id,
      descricao: 'Responsável pela gestão de UPAs e serviços de urgência',
      competencias: [
        'Gestão de Unidades de Pronto Atendimento',
        'Coordenação do SAMU',
        'Atendimento de urgência e emergência',
        'Regulação médica',
      ],
    }
  });
  console.log(`   ✅ Diretoria criada: ${diretoriaUrgenciaEmergencia.nome}`);

  const diretoriaSaudeMental = await prisma.organizationalUnit.upsert({
    where: {
      departmentId_sigla: {
        departmentId: departamentoSaude.id,
        sigla: 'DSM',
      }
    },
    update: {},
    create: {
      nome: 'Diretoria de Saúde Mental',
      sigla: 'DSM',
      tipo: 'DIRETORIA',
      nivel: 2,
      departmentId: departamentoSaude.id,
      parentId: secretariaSaude.id,
      descricao: 'Responsável pelos serviços de saúde mental e reabilitação',
      competencias: [
        'Gestão dos CAPS',
        'Programas de saúde mental',
        'Reabilitação psicossocial',
        'Redução de danos',
      ],
    }
  });
  console.log(`   ✅ Diretoria criada: ${diretoriaSaudeMental.nome}\n`);

  // =====================================================
  // 4. CRIAR UNIDADES DE SAÚDE - NÍVEL 3
  // =====================================================

  console.log('🏥 Criando Unidades de Saúde...\n');

  // --------------- ATENÇÃO BÁSICA ---------------

  const unidades = [
    // UBS - Unidades Básicas de Saúde
    {
      nome: 'UBS Central Dr. José Silva',
      sigla: 'UBS-CENTRAL',
      tipo: 'UBS',
      fluxoAtendimento: 'TRADICIONAL' as const,
      cnes: '2000001',
      cnpj: '12.345.678/0001-01',
      endereco: 'Rua Principal, 100',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01000-000',
      telefone: '(11) 3000-1000',
      email: 'ubs.central@saude.sp.gov.br',
      horario: 'Segunda a Sexta: 7h às 17h',
      horarioAbertura: '07:00',
      horarioFechamento: '17:00',
      especialidades: ['Clínico Geral', 'Pediatria', 'Ginecologia', 'Odontologia', 'Enfermagem'],
      diretoriaId: diretoriaAtencaoBasica.id,
    },
    {
      nome: 'UBS Norte Maria Santos',
      sigla: 'UBS-NORTE',
      tipo: 'UBS',
      fluxoAtendimento: 'TRADICIONAL' as const,
      cnes: '2000002',
      cnpj: '12.345.678/0002-82',
      endereco: 'Avenida das Nações, 500',
      bairro: 'Jardim Norte',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '02000-000',
      telefone: '(11) 3000-1001',
      email: 'ubs.norte@saude.sp.gov.br',
      horario: 'Segunda a Sexta: 7h às 17h',
      horarioAbertura: '07:00',
      horarioFechamento: '17:00',
      especialidades: ['Clínico Geral', 'Pediatria', 'Enfermagem', 'Odontologia'],
      diretoriaId: diretoriaAtencaoBasica.id,
    },
    {
      nome: 'UBS Sul Vila Esperança',
      sigla: 'UBS-SUL',
      tipo: 'UBS',
      fluxoAtendimento: 'TRADICIONAL' as const,
      cnes: '2000003',
      cnpj: '12.345.678/0003-63',
      endereco: 'Rua das Palmeiras, 250',
      bairro: 'Vila Esperança',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '04000-000',
      telefone: '(11) 3000-1002',
      email: 'ubs.sul@saude.sp.gov.br',
      horario: 'Segunda a Sexta: 7h às 17h',
      horarioAbertura: '07:00',
      horarioFechamento: '17:00',
      especialidades: ['Clínico Geral', 'Pediatria', 'Enfermagem'],
      diretoriaId: diretoriaAtencaoBasica.id,
    },
    {
      nome: 'UBS Vila Nova Ana Costa',
      sigla: 'UBS-VILANOVA',
      tipo: 'UBS',
      fluxoAtendimento: 'MISTO' as const,
      cnes: '2000004',
      cnpj: '12.345.678/0004-44',
      endereco: 'Rua dos Lírios, 800',
      bairro: 'Vila Nova',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '05000-000',
      telefone: '(11) 3000-1003',
      email: 'ubs.vilanova@saude.sp.gov.br',
      horario: 'Segunda a Sexta: 7h às 17h',
      horarioAbertura: '07:00',
      horarioFechamento: '17:00',
      especialidades: ['Clínico Geral', 'Pediatria', 'Ginecologia', 'Enfermagem', 'Odontologia'],
      diretoriaId: diretoriaAtencaoBasica.id,
    },

    // ESF - Estratégia Saúde da Família
    {
      nome: 'ESF Jardim Esperança',
      sigla: 'ESF-JDESPERANCA',
      tipo: 'ESF',
      fluxoAtendimento: 'ESF' as const,
      cnes: '2000005',
      cnpj: '12.345.678/0005-25',
      endereco: 'Rua das Flores, 150',
      bairro: 'Jardim Esperança',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '03000-000',
      telefone: '(11) 3000-1004',
      email: 'esf.jdesperanca@saude.sp.gov.br',
      horario: 'Segunda a Sexta: 7h às 17h',
      horarioAbertura: '07:00',
      horarioFechamento: '17:00',
      especialidades: ['Medicina de Família', 'Enfermagem', 'Saúde Bucal', 'ACS'],
      diretoriaId: diretoriaAtencaoBasica.id,
    },
    {
      nome: 'ESF Parque das Flores',
      sigla: 'ESF-PQFLORES',
      tipo: 'ESF',
      fluxoAtendimento: 'ESF' as const,
      cnes: '2000006',
      cnpj: '12.345.678/0006-06',
      endereco: 'Avenida das Acácias, 320',
      bairro: 'Parque das Flores',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '06000-000',
      telefone: '(11) 3000-1005',
      email: 'esf.pqflores@saude.sp.gov.br',
      horario: 'Segunda a Sexta: 7h às 17h',
      horarioAbertura: '07:00',
      horarioFechamento: '17:00',
      especialidades: ['Medicina de Família', 'Enfermagem', 'Saúde Bucal', 'ACS'],
      diretoriaId: diretoriaAtencaoBasica.id,
    },

    // Policlínica
    {
      nome: 'Policlínica Municipal',
      sigla: 'POLICLINICA',
      tipo: 'Policlínica',
      fluxoAtendimento: 'TRADICIONAL' as const,
      cnes: '2000007',
      cnpj: '12.345.678/0007-97',
      endereco: 'Rua da Saúde, 450',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01100-000',
      telefone: '(11) 3000-1006',
      email: 'policlinica@saude.sp.gov.br',
      horario: 'Segunda a Sexta: 7h às 19h',
      horarioAbertura: '07:00',
      horarioFechamento: '19:00',
      especialidades: ['Cardiologia', 'Ortopedia', 'Dermatologia', 'Oftalmologia', 'Endocrinologia', 'Neurologia'],
      diretoriaId: diretoriaAtencaoBasica.id,
    },

    // --------------- URGÊNCIA E EMERGÊNCIA ---------------

    {
      nome: 'UPA 24h Centro',
      sigla: 'UPA-CENTRO',
      tipo: 'UPA',
      fluxoAtendimento: 'TRADICIONAL' as const,
      cnes: '2000008',
      cnpj: '12.345.678/0008-78',
      endereco: 'Avenida Brasil, 800',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01200-000',
      telefone: '(11) 3000-2000',
      email: 'upa.centro@saude.sp.gov.br',
      horario: '24 horas',
      horarioAbertura: '00:00',
      horarioFechamento: '23:59',
      especialidades: ['Emergência', 'Clínico Geral', 'Pediatria', 'Ortopedia', 'Radiologia'],
      diretoriaId: diretoriaUrgenciaEmergencia.id,
    },
    {
      nome: 'UPA 24h Norte',
      sigla: 'UPA-NORTE',
      tipo: 'UPA',
      fluxoAtendimento: 'TRADICIONAL' as const,
      cnes: '2000009',
      cnpj: '12.345.678/0009-59',
      endereco: 'Rua do Socorro, 1200',
      bairro: 'Jardim Norte',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '02100-000',
      telefone: '(11) 3000-2001',
      email: 'upa.norte@saude.sp.gov.br',
      horario: '24 horas',
      horarioAbertura: '00:00',
      horarioFechamento: '23:59',
      especialidades: ['Emergência', 'Clínico Geral', 'Pediatria', 'Ortopedia'],
      diretoriaId: diretoriaUrgenciaEmergencia.id,
    },
    {
      nome: 'Hospital Municipal São João',
      sigla: 'HOSP-SAOJOAO',
      tipo: 'Hospital',
      fluxoAtendimento: 'TRADICIONAL' as const,
      cnes: '2000010',
      cnpj: '12.345.678/0010-93',
      endereco: 'Rua Hospitalar, 1000',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01300-000',
      telefone: '(11) 3000-3000',
      email: 'hospital.saojoao@saude.sp.gov.br',
      horario: '24 horas',
      horarioAbertura: '00:00',
      horarioFechamento: '23:59',
      especialidades: ['Emergência', 'UTI', 'Cirurgia Geral', 'Cardiologia', 'Ortopedia', 'Neurologia', 'Ginecologia'],
      diretoriaId: diretoriaUrgenciaEmergencia.id,
    },

    // --------------- SAÚDE MENTAL ---------------

    {
      nome: 'CAPS Centro - Centro de Atenção Psicossocial',
      sigla: 'CAPS-CENTRO',
      tipo: 'CAPS',
      fluxoAtendimento: 'TRADICIONAL' as const,
      cnes: '2000011',
      cnpj: '12.345.678/0011-74',
      endereco: 'Rua da Mente, 200',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01400-000',
      telefone: '(11) 3000-4000',
      email: 'caps.centro@saude.sp.gov.br',
      horario: 'Segunda a Sexta: 7h às 19h',
      horarioAbertura: '07:00',
      horarioFechamento: '19:00',
      especialidades: ['Psiquiatria', 'Psicologia', 'Terapia Ocupacional', 'Assistência Social', 'Enfermagem'],
      diretoriaId: diretoriaSaudeMental.id,
    },
    {
      nome: 'Centro Especializado em Reabilitação',
      sigla: 'CER',
      tipo: 'Centro Especializado',
      fluxoAtendimento: 'TRADICIONAL' as const,
      cnes: '2000012',
      cnpj: '12.345.678/0012-55',
      endereco: 'Avenida da Recuperação, 600',
      bairro: 'Jardim Saúde',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '04100-000',
      telefone: '(11) 3000-5000',
      email: 'cer@saude.sp.gov.br',
      horario: 'Segunda a Sexta: 7h às 18h',
      horarioAbertura: '07:00',
      horarioFechamento: '18:00',
      especialidades: ['Fisioterapia', 'Fonoaudiologia', 'Terapia Ocupacional', 'Psicologia'],
      diretoriaId: diretoriaSaudeMental.id,
    },
  ];

  const unidadesCriadas = [];

  for (const unidadeData of unidades) {
    // Criar OrganizationalUnit
    const orgUnit = await prisma.organizationalUnit.upsert({
      where: {
        departmentId_sigla: {
          departmentId: departamentoSaude.id,
          sigla: unidadeData.sigla,
        }
      },
      update: {},
      create: {
        nome: unidadeData.nome,
        sigla: unidadeData.sigla,
        tipo: 'UNIDADE_SAUDE',
        nivel: 3,
        departmentId: departamentoSaude.id,
        parentId: unidadeData.diretoriaId,
        descricao: `${unidadeData.tipo} - ${unidadeData.bairro}`,
        competencias: [
          `Atendimento em ${unidadeData.especialidades.join(', ')}`,
          'Atenção à saúde da população local',
        ],
      }
    });

    // Criar UnidadeSaude vinculada ao OrganizationalUnit
    const unidadeSaude = await prisma.unidadeSaude.upsert({
      where: {
        organizationalUnitId: orgUnit.id,
      },
      update: {},
      create: {
        nome: unidadeData.nome,
        tipo: unidadeData.tipo,
        fluxoAtendimento: unidadeData.fluxoAtendimento,
        cnes: unidadeData.cnes,
        cnpj: unidadeData.cnpj,
        endereco: unidadeData.endereco,
        bairro: unidadeData.bairro,
        cidade: unidadeData.cidade,
        estado: unidadeData.estado,
        cep: unidadeData.cep,
        telefone: unidadeData.telefone,
        email: unidadeData.email,
        horario: unidadeData.horario,
        horarioAbertura: unidadeData.horarioAbertura,
        horarioFechamento: unidadeData.horarioFechamento,
        especialidades: unidadeData.especialidades,
        organizationalUnitId: orgUnit.id,
        isActive: true,
      }
    });

    unidadesCriadas.push(unidadeSaude);
    console.log(`   ✅ ${unidadeData.tipo}: ${unidadeData.nome} (CNES: ${unidadeData.cnes})`);
  }

  console.log(`\n✅ SEED 01 CONCLUÍDO: ${unidadesCriadas.length} unidades de saúde criadas com sucesso!\n`);
  console.log('📊 Resumo:');
  console.log(`   • 4 UBS (Unidades Básicas de Saúde)`);
  console.log(`   • 2 ESF (Estratégia Saúde da Família)`);
  console.log(`   • 1 Policlínica`);
  console.log(`   • 2 UPA (Unidades de Pronto Atendimento)`);
  console.log(`   • 1 Hospital Municipal`);
  console.log(`   • 1 CAPS (Centro de Atenção Psicossocial)`);
  console.log(`   • 1 Centro Especializado em Reabilitação`);
  console.log(`\n   📁 Estrutura Organizacional: SMS → 3 Diretorias → 12 Unidades\n`);

  return unidadesCriadas;
}

// Executar se chamado diretamente
if (require.main === module) {
  seed01UnidadesSaudeCompletas()
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
