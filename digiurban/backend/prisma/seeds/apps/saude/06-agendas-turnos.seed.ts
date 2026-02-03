/**
 * SEED 06: AGENDAS E TURNOS
 *
 * Cria estrutura completa para agendamento e gestão de turnos:
 * - Salas de consultório por unidade
 * - Turnos de trabalho (Manhã, Tarde, Noite, Integral)
 * - Configurações de agenda por profissional
 * - Configurações de atendimento por unidade
 *
 * Permite teste completo de:
 * - Agendamento de consultas
 * - Gestão de disponibilidade
 * - Controle de vagas
 * - Fluxo de atendimento
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seed06AgendasTurnos() {
  console.log('📅 SEED 06: Criando Agendas e Turnos...\n');

  // =====================================================
  // 1. BUSCAR UNIDADES DE SAÚDE
  // =====================================================

  const unidades = await prisma.unidadeSaude.findMany({
    where: { isActive: true },
    include: {
      organizationalUnit: true,
    }
  });

  if (unidades.length === 0) {
    throw new Error('❌ Unidades de saúde não encontradas. Execute o seed 01 primeiro.');
  }

  console.log(`✅ ${unidades.length} unidades encontradas\n`);

  // =====================================================
  // 2. CRIAR SALAS DE CONSULTÓRIO
  // =====================================================

  console.log('🏥 Criando salas de consultório...\n');

  const salasConfig = [
    // UBS Central
    {
      unidadeNome: 'UBS Central Dr. José Silva',
      salas: [
        { nome: 'Consultório Médico 1', numero: '101', tipo: 'CONSULTORIO' as const, andar: 'Térreo', equipamentos: ['Maca', 'Esfigmomanômetro', 'Estetoscópio', 'Negatoscópio'] },
        { nome: 'Consultório Médico 2', numero: '102', tipo: 'CONSULTORIO' as const, andar: 'Térreo', equipamentos: ['Maca', 'Esfigmomanômetro', 'Estetoscópio'] },
        { nome: 'Consultório Médico 3', numero: '103', tipo: 'CONSULTORIO' as const, andar: 'Térreo', equipamentos: ['Maca', 'Esfigmomanômetro', 'Estetoscópio'] },
        { nome: 'Consultório Odontológico', numero: '104', tipo: 'ODONTOLOGIA' as const, andar: 'Térreo', equipamentos: ['Cadeira odontológica', 'Autoclave', 'Compressor', 'Raio-X'] },
        { nome: 'Sala de Enfermagem', numero: '105', tipo: 'ENFERMAGEM' as const, andar: 'Térreo', equipamentos: ['Maca', 'Carrinho de curativos', 'Balança'] },
        { nome: 'Sala de Vacinação', numero: '106', tipo: 'VACINA' as const, andar: 'Térreo', equipamentos: ['Geladeira', 'Termômetro', 'Caixa térmica'] },
        { nome: 'Sala de Curativos', numero: '107', tipo: 'CURATIVO' as const, andar: 'Térreo', equipamentos: ['Maca', 'Carrinho de curativos', 'Foco cirúrgico'] },
      ]
    },
    // UBS Norte
    {
      unidadeNome: 'UBS Norte Maria Santos',
      salas: [
        { nome: 'Consultório Médico 1', numero: '201', tipo: 'CONSULTORIO' as const, andar: 'Térreo', equipamentos: ['Maca', 'Esfigmomanômetro', 'Estetoscópio'] },
        { nome: 'Consultório Médico 2', numero: '202', tipo: 'CONSULTORIO' as const, andar: 'Térreo', equipamentos: ['Maca', 'Esfigmomanômetro', 'Estetoscópio'] },
        { nome: 'Consultório Odontológico', numero: '203', tipo: 'ODONTOLOGIA' as const, andar: 'Térreo', equipamentos: ['Cadeira odontológica', 'Autoclave', 'Compressor'] },
        { nome: 'Sala de Enfermagem', numero: '204', tipo: 'ENFERMAGEM' as const, andar: 'Térreo', equipamentos: ['Maca', 'Carrinho de curativos'] },
        { nome: 'Sala de Vacinação', numero: '205', tipo: 'VACINA' as const, andar: 'Térreo', equipamentos: ['Geladeira', 'Termômetro'] },
      ]
    },
    // UPA Centro
    {
      unidadeNome: 'UPA 24h Centro',
      salas: [
        { nome: 'Consultório de Triagem 1', numero: '301', tipo: 'TRIAGEM' as const, andar: 'Térreo', equipamentos: ['Balança', 'Esfigmomanômetro', 'Termômetro', 'Oxímetro'] },
        { nome: 'Consultório de Triagem 2', numero: '302', tipo: 'TRIAGEM' as const, andar: 'Térreo', equipamentos: ['Balança', 'Esfigmomanômetro', 'Termômetro', 'Oxímetro'] },
        { nome: 'Consultório Médico 1', numero: '303', tipo: 'CONSULTORIO' as const, andar: 'Térreo', equipamentos: ['Maca', 'Monitor multiparâmetros', 'Negatoscópio'] },
        { nome: 'Consultório Médico 2', numero: '304', tipo: 'CONSULTORIO' as const, andar: 'Térreo', equipamentos: ['Maca', 'Monitor multiparâmetros', 'Negatoscópio'] },
        { nome: 'Consultório Médico 3', numero: '305', tipo: 'CONSULTORIO' as const, andar: 'Térreo', equipamentos: ['Maca', 'Monitor multiparâmetros', 'Negatoscópio'] },
        { nome: 'Sala de Procedimentos', numero: '306', tipo: 'PROCEDIMENTO' as const, andar: 'Térreo', equipamentos: ['Maca', 'Carrinho de emergência', 'Desfibrilador', 'Foco cirúrgico'] },
        { nome: 'Sala de Enfermagem', numero: '307', tipo: 'ENFERMAGEM' as const, andar: 'Térreo', equipamentos: ['Maca', 'Carrinho de medicação', 'Monitor'] },
      ]
    },
    // CAPS Centro
    {
      unidadeNome: 'CAPS Centro - Centro de Atenção Psicossocial',
      salas: [
        { nome: 'Consultório Psiquiátrico 1', numero: '401', tipo: 'CONSULTORIO' as const, andar: 'Térreo', equipamentos: ['Mesa', 'Cadeiras confortáveis'] },
        { nome: 'Consultório Psiquiátrico 2', numero: '402', tipo: 'CONSULTORIO' as const, andar: 'Térreo', equipamentos: ['Mesa', 'Cadeiras confortáveis'] },
        { nome: 'Sala de Psicologia 1', numero: '403', tipo: 'PSICOLOGIA' as const, andar: 'Térreo', equipamentos: ['Mesa', 'Cadeiras', 'Divã'] },
        { nome: 'Sala de Psicologia 2', numero: '404', tipo: 'PSICOLOGIA' as const, andar: 'Térreo', equipamentos: ['Mesa', 'Cadeiras', 'Divã'] },
        { nome: 'Sala de Enfermagem', numero: '405', tipo: 'ENFERMAGEM' as const, andar: 'Térreo', equipamentos: ['Maca', 'Armário de medicamentos'] },
      ]
    },
    // Policlínica
    {
      unidadeNome: 'Policlínica Municipal',
      salas: [
        { nome: 'Consultório Cardiologia', numero: '501', tipo: 'CONSULTORIO' as const, andar: '1º Andar', equipamentos: ['Maca', 'Eletrocardiógrafo', 'Negatoscópio'] },
        { nome: 'Consultório Dermatologia', numero: '502', tipo: 'CONSULTORIO' as const, andar: '1º Andar', equipamentos: ['Maca', 'Lupa', 'Luz de Wood'] },
        { nome: 'Consultório Ginecologia', numero: '503', tipo: 'CONSULTORIO' as const, andar: '1º Andar', equipamentos: ['Mesa ginecológica', 'Foco', 'Negatoscópio'] },
        { nome: 'Consultório Neurologia', numero: '504', tipo: 'CONSULTORIO' as const, andar: '2º Andar', equipamentos: ['Maca', 'Martelo de reflexos', 'Negatoscópio'] },
        { nome: 'Consultório Oftalmologia', numero: '505', tipo: 'CONSULTORIO' as const, andar: '2º Andar', equipamentos: ['Cadeira oftalmológica', 'Tonômetro', 'Lâmpada de fenda'] },
        { nome: 'Consultório Ortopedia', numero: '506', tipo: 'CONSULTORIO' as const, andar: '2º Andar', equipamentos: ['Maca', 'Negatoscópio', 'Material de imobilização'] },
      ]
    },
  ];

  const salasCriadas = [];

  for (const config of salasConfig) {
    const unidade = unidades.find(u => u.nome === config.unidadeNome);
    if (!unidade) continue;

    for (const sala of config.salas) {
      const salaCriada = await prisma.salaConsultorio.upsert({
        where: {
          unidadeId_numero: {
            unidadeId: unidade.id,
            numero: sala.numero,
          }
        },
        update: {},
        create: {
          nome: sala.nome,
          numero: sala.numero,
          tipo: sala.tipo,
          unidadeId: unidade.id,
          andar: sala.andar,
          capacidade: 1,
          equipamentos: sala.equipamentos,
          ativa: true,
        }
      });

      salasCriadas.push(salaCriada);
    }

    console.log(`   ✅ ${config.unidadeNome}: ${config.salas.length} salas criadas`);
  }

  console.log(`\n✅ Total: ${salasCriadas.length} salas criadas\n`);

  // =====================================================
  // 3. CRIAR TURNOS DE TRABALHO
  // =====================================================

  console.log('⏰ Criando turnos de trabalho...\n');

  const turnos = [
    {
      nome: 'Manhã',
      descricao: 'Turno matutino',
      horaInicio: '07:00',
      horaFim: '13:00',
      diasSemana: [1, 2, 3, 4, 5], // Segunda a Sexta
      cor: '#10B981', // Verde
    },
    {
      nome: 'Tarde',
      descricao: 'Turno vespertino',
      horaInicio: '13:00',
      horaFim: '19:00',
      diasSemana: [1, 2, 3, 4, 5],
      cor: '#F59E0B', // Amarelo
    },
    {
      nome: 'Noite',
      descricao: 'Turno noturno',
      horaInicio: '19:00',
      horaFim: '23:00',
      diasSemana: [1, 2, 3, 4, 5],
      cor: '#6366F1', // Roxo
    },
    {
      nome: 'Integral',
      descricao: 'Turno integral',
      horaInicio: '07:00',
      horaFim: '19:00',
      diasSemana: [1, 2, 3, 4, 5],
      cor: '#8B5CF6', // Roxo claro
    },
    {
      nome: 'Plantão 24h',
      descricao: 'Plantão ininterrupto',
      horaInicio: '00:00',
      horaFim: '23:59',
      diasSemana: [1, 2, 3, 4, 5, 6, 7], // Todos os dias
      cor: '#EF4444', // Vermelho
    },
  ];

  for (const turno of turnos) {
    await prisma.turnoTrabalho.upsert({
      where: { nome: turno.nome },
      update: {},
      create: turno,
    });

    console.log(`   ✅ Turno: ${turno.nome} (${turno.horaInicio} - ${turno.horaFim})`);
  }

  console.log(`\n✅ ${turnos.length} turnos criados\n`);

  // =====================================================
  // 4. CONFIGURAR ATENDIMENTO POR UNIDADE
  // =====================================================

  console.log('⚙️  Configurando atendimento por unidade...\n');

  const configsAtendimento = [
    {
      unidadeNome: 'UBS Central Dr. José Silva',
      config: {
        prefixoSenha: 'A',
        reiniciarSenhaDiariamente: true,
        senhaInicial: 1,
        horaAberturaAtendimento: '07:00',
        horaFechamentoAtendimento: '17:00',
        diasFuncionamento: [1, 2, 3, 4, 5],
        triagemObrigatoria: false,
        tempoMedioTriagem: 10,
        permitirAgendamento: true,
        limiteAgendamentoDias: 30,
      }
    },
    {
      unidadeNome: 'UBS Norte Maria Santos',
      config: {
        prefixoSenha: 'B',
        reiniciarSenhaDiariamente: true,
        senhaInicial: 1,
        horaAberturaAtendimento: '07:00',
        horaFechamentoAtendimento: '17:00',
        diasFuncionamento: [1, 2, 3, 4, 5],
        triagemObrigatoria: false,
        tempoMedioTriagem: 10,
        permitirAgendamento: true,
        limiteAgendamentoDias: 30,
      }
    },
    {
      unidadeNome: 'UPA 24h Centro',
      config: {
        prefixoSenha: 'U',
        reiniciarSenhaDiariamente: true,
        senhaInicial: 1,
        horaAberturaAtendimento: '00:00',
        horaFechamentoAtendimento: '23:59',
        diasFuncionamento: [1, 2, 3, 4, 5, 6, 7],
        triagemObrigatoria: true,
        tempoMedioTriagem: 15,
        permitirAgendamento: false,
        limiteAgendamentoDias: 0,
      }
    },
    {
      unidadeNome: 'CAPS Centro - Centro de Atenção Psicossocial',
      config: {
        prefixoSenha: 'P',
        reiniciarSenhaDiariamente: true,
        senhaInicial: 1,
        horaAberturaAtendimento: '07:00',
        horaFechamentoAtendimento: '19:00',
        diasFuncionamento: [1, 2, 3, 4, 5],
        triagemObrigatoria: false,
        tempoMedioTriagem: 10,
        permitirAgendamento: true,
        limiteAgendamentoDias: 60,
      }
    },
    {
      unidadeNome: 'Policlínica Municipal',
      config: {
        prefixoSenha: 'E',
        reiniciarSenhaDiariamente: true,
        senhaInicial: 1,
        horaAberturaAtendimento: '07:00',
        horaFechamentoAtendimento: '19:00',
        diasFuncionamento: [1, 2, 3, 4, 5],
        triagemObrigatoria: false,
        tempoMedioTriagem: 10,
        permitirAgendamento: true,
        limiteAgendamentoDias: 45,
      }
    },
  ];

  for (const item of configsAtendimento) {
    const unidade = unidades.find(u => u.nome === item.unidadeNome);
    if (!unidade) continue;

    await prisma.configuracaoAtendimento.upsert({
      where: { unidadeId: unidade.id },
      update: {},
      create: {
        unidadeId: unidade.id,
        ...item.config,
      }
    });

    console.log(`   ✅ ${item.unidadeNome}: Senha ${item.config.prefixoSenha}, Agendamento ${item.config.permitirAgendamento ? 'Permitido' : 'Não Permitido'}`);
  }

  console.log(`\n✅ ${configsAtendimento.length} configurações criadas\n`);

  // =====================================================
  // 5. CRIAR CONFIGURAÇÕES DE AGENDA PARA PROFISSIONAIS
  // =====================================================

  console.log('📋 Criando configurações de agenda...\n');

  const servidores = await prisma.user.findMany({
    where: {
      email: { endsWith: '@saude.sp.gov.br' }
    },
    include: {
      healthData: true,
    }
  });

  // Função auxiliar
  const getServidor = (email: string) => servidores.find(s => s.email === email);

  // Configurações de agenda realistas
  const agendasConfig = [
    // Dr. João - Clínico Geral - UBS Central
    {
      email: 'joao.silva@saude.sp.gov.br',
      unidadeNome: 'UBS Central Dr. José Silva',
      agendas: [
        { diaSemana: 1, turno: 'MANHA' as const, horaInicio: '08:00', horaFim: '12:00', duracaoConsulta: 30, vagasTotais: 8, permiteOnline: true },
        { diaSemana: 2, turno: 'MANHA' as const, horaInicio: '08:00', horaFim: '12:00', duracaoConsulta: 30, vagasTotais: 8, permiteOnline: true },
        { diaSemana: 3, turno: 'TARDE' as const, horaInicio: '14:00', horaFim: '18:00', duracaoConsulta: 30, vagasTotais: 8, permiteOnline: true },
        { diaSemana: 4, turno: 'MANHA' as const, horaInicio: '08:00', horaFim: '12:00', duracaoConsulta: 30, vagasTotais: 8, permiteOnline: true },
        { diaSemana: 5, turno: 'TARDE' as const, horaInicio: '14:00', horaFim: '18:00', duracaoConsulta: 30, vagasTotais: 8, permiteOnline: true },
      ]
    },
    // Dra. Maria - Pediatra - UBS Norte
    {
      email: 'maria.costa@saude.sp.gov.br',
      unidadeNome: 'UBS Norte Maria Santos',
      agendas: [
        { diaSemana: 1, turno: 'MANHA' as const, horaInicio: '08:00', horaFim: '12:00', duracaoConsulta: 30, vagasTotais: 8, permiteOnline: true },
        { diaSemana: 2, turno: 'MANHA' as const, horaInicio: '08:00', horaFim: '12:00', duracaoConsulta: 30, vagasTotais: 8, permiteOnline: true },
        { diaSemana: 3, turno: 'MANHA' as const, horaInicio: '08:00', horaFim: '12:00', duracaoConsulta: 30, vagasTotais: 8, permiteOnline: true },
        { diaSemana: 4, turno: 'TARDE' as const, horaInicio: '14:00', horaFim: '17:00', duracaoConsulta: 30, vagasTotais: 6, permiteOnline: true },
      ]
    },
    // Dra. Ana - Psiquiatra - CAPS
    {
      email: 'ana.rodrigues@saude.sp.gov.br',
      unidadeNome: 'CAPS Centro - Centro de Atenção Psicossocial',
      agendas: [
        { diaSemana: 1, turno: 'MANHA' as const, horaInicio: '08:00', horaFim: '12:00', duracaoConsulta: 50, vagasTotais: 4, permiteOnline: false },
        { diaSemana: 1, turno: 'TARDE' as const, horaInicio: '14:00', horaFim: '18:00', duracaoConsulta: 50, vagasTotais: 4, permiteOnline: false },
        { diaSemana: 3, turno: 'MANHA' as const, horaInicio: '08:00', horaFim: '12:00', duracaoConsulta: 50, vagasTotais: 4, permiteOnline: false },
        { diaSemana: 3, turno: 'TARDE' as const, horaInicio: '14:00', horaFim: '18:00', duracaoConsulta: 50, vagasTotais: 4, permiteOnline: false },
        { diaSemana: 5, turno: 'MANHA' as const, horaInicio: '08:00', horaFim: '12:00', duracaoConsulta: 50, vagasTotais: 4, permiteOnline: false },
      ]
    },
    // Dr. Ricardo - Cardiologista - Policlínica
    {
      email: 'ricardo.ferreira@saude.sp.gov.br',
      unidadeNome: 'Policlínica Municipal',
      agendas: [
        { diaSemana: 2, turno: 'TARDE' as const, horaInicio: '14:00', horaFim: '18:00', duracaoConsulta: 40, vagasTotais: 6, permiteOnline: true },
        { diaSemana: 4, turno: 'TARDE' as const, horaInicio: '14:00', horaFim: '18:00', duracaoConsulta: 40, vagasTotais: 6, permiteOnline: true },
      ]
    },
    // Dra. Juliana - Dermatologista - Policlínica
    {
      email: 'juliana.barbosa@saude.sp.gov.br',
      unidadeNome: 'Policlínica Municipal',
      agendas: [
        { diaSemana: 1, turno: 'MANHA' as const, horaInicio: '08:00', horaFim: '12:00', duracaoConsulta: 30, vagasTotais: 8, permiteOnline: true },
        { diaSemana: 1, turno: 'TARDE' as const, horaInicio: '14:00', horaFim: '18:00', duracaoConsulta: 30, vagasTotais: 8, permiteOnline: true },
        { diaSemana: 3, turno: 'MANHA' as const, horaInicio: '08:00', horaFim: '12:00', duracaoConsulta: 30, vagasTotais: 8, permiteOnline: true },
        { diaSemana: 3, turno: 'TARDE' as const, horaInicio: '14:00', horaFim: '18:00', duracaoConsulta: 30, vagasTotais: 8, permiteOnline: true },
        { diaSemana: 5, turno: 'MANHA' as const, horaInicio: '08:00', horaFim: '12:00', duracaoConsulta: 30, vagasTotais: 8, permiteOnline: true },
      ]
    },
  ];

  let totalAgendas = 0;

  for (const config of agendasConfig) {
    const servidor = getServidor(config.email);
    const unidade = unidades.find(u => u.nome === config.unidadeNome);

    if (!servidor || !unidade) {
      console.log(`   ⚠️  Pulando agenda: ${config.email} - dados não encontrados`);
      continue;
    }

    for (const agenda of config.agendas) {
      await prisma.configuracaoAgenda.upsert({
        where: {
          profissionalId_unidadeId_diaSemana_turno: {
            profissionalId: servidor.id,
            unidadeId: unidade.id,
            diaSemana: agenda.diaSemana,
            turno: agenda.turno,
          }
        },
        update: {},
        create: {
          profissionalId: servidor.id,
          unidadeId: unidade.id,
          diaSemana: agenda.diaSemana,
          turno: agenda.turno,
          horaInicio: agenda.horaInicio,
          horaFim: agenda.horaFim,
          duracaoConsulta: agenda.duracaoConsulta,
          vagasTotais: agenda.vagasTotais,
          vagasDisponiveis: agenda.vagasTotais,
          permiteOnline: agenda.permiteOnline,
          tiposAceitos: ['CONSULTA', 'RETORNO'],
          ativo: true,
        }
      });

      totalAgendas++;
    }

    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const resumo = config.agendas.map(a => `${diasSemana[a.diaSemana]} ${a.turno}`).join(', ');
    console.log(`   ✅ ${servidor.name}: ${config.agendas.length} agendas (${resumo})`);
  }

  console.log(`\n✅ Total: ${totalAgendas} configurações de agenda criadas\n`);

  console.log(`\n✅ SEED 06 CONCLUÍDO!\n`);
  console.log('📊 Resumo:');
  console.log(`   • ${salasCriadas.length} salas de consultório`);
  console.log(`   • ${turnos.length} turnos de trabalho`);
  console.log(`   • ${configsAtendimento.length} configurações de atendimento`);
  console.log(`   • ${totalAgendas} configurações de agenda`);
  console.log(`\n   ✅ Sistema pronto para agendamento de consultas!\n`);

  return {
    salas: salasCriadas.length,
    turnos: turnos.length,
    configs: configsAtendimento.length,
    agendas: totalAgendas,
  };
}

// Executar se chamado diretamente
if (require.main === module) {
  seed06AgendasTurnos()
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
