import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ========================================
// PROFISSIONAIS DE SAÚDE
// ========================================

export const profissionaisSaudeData = [
  {
    nome: 'Dr. João Silva',
    cpf: '123.456.789-01',
    registroProfissional: 'CRM-SP 123456',
    especialidade: 'Clínico Geral',
    categoria: 'Médico',
    unidadesAtendimento: ['UBS Centro', 'UBS Norte'],
    horarioAtendimento: {
      segunda: '08:00-12:00',
      terca: '08:00-12:00',
      quarta: '14:00-18:00',
      quinta: '08:00-12:00',
      sexta: '14:00-18:00',
    },
    diasSemana: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
    tempoMedioConsulta: 20,
    aceitaAgendamento: true,
  },
  {
    nome: 'Dra. Maria Santos',
    cpf: '234.567.890-12',
    registroProfissional: 'CRM-SP 234567',
    especialidade: 'Pediatria',
    categoria: 'Médico',
    unidadesAtendimento: ['UBS Centro'],
    horarioAtendimento: {
      segunda: '08:00-12:00',
      terca: '08:00-12:00',
      quinta: '08:00-12:00',
    },
    diasSemana: ['Segunda', 'Terça', 'Quinta'],
    tempoMedioConsulta: 30,
    aceitaAgendamento: true,
  },
  {
    nome: 'Dra. Ana Paula Costa',
    cpf: '345.678.901-23',
    registroProfissional: 'CRM-SP 345678',
    especialidade: 'Ginecologia e Obstetrícia',
    categoria: 'Médico',
    unidadesAtendimento: ['Hospital Municipal'],
    horarioAtendimento: {
      terca: '14:00-18:00',
      quarta: '14:00-18:00',
      quinta: '14:00-18:00',
    },
    diasSemana: ['Terça', 'Quarta', 'Quinta'],
    tempoMedioConsulta: 30,
    aceitaAgendamento: true,
  },
  {
    nome: 'Dr. Carlos Eduardo Souza',
    cpf: '456.789.012-34',
    registroProfissional: 'CRM-SP 456789',
    especialidade: 'Cardiologia',
    categoria: 'Médico',
    unidadesAtendimento: ['Hospital Municipal'],
    horarioAtendimento: {
      segunda: '14:00-18:00',
      quarta: '14:00-18:00',
    },
    diasSemana: ['Segunda', 'Quarta'],
    tempoMedioConsulta: 30,
    aceitaAgendamento: true,
  },
  {
    nome: 'Enf. Juliana Oliveira',
    cpf: '567.890.123-45',
    registroProfissional: 'COREN-SP 123456',
    categoria: 'Enfermeiro',
    unidadesAtendimento: ['UBS Centro', 'UBS Norte', 'UBS Sul'],
    horarioAtendimento: {
      segunda: '07:00-13:00',
      terca: '07:00-13:00',
      quarta: '07:00-13:00',
      quinta: '07:00-13:00',
      sexta: '07:00-13:00',
    },
    diasSemana: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
    tempoMedioConsulta: 15,
    aceitaAgendamento: true,
  },
  {
    nome: 'Dra. Patricia Lima',
    cpf: '678.901.234-56',
    registroProfissional: 'CRO-SP 12345',
    especialidade: 'Odontologia Geral',
    categoria: 'Dentista',
    unidadesAtendimento: ['UBS Centro'],
    horarioAtendimento: {
      segunda: '08:00-17:00',
      terca: '08:00-17:00',
      quarta: '08:00-17:00',
      quinta: '08:00-17:00',
      sexta: '08:00-12:00',
    },
    diasSemana: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
    tempoMedioConsulta: 40,
    aceitaAgendamento: true,
  },
  {
    nome: 'Psi. Roberto Alves',
    cpf: '789.012.345-67',
    registroProfissional: 'CRP-SP 06/12345',
    especialidade: 'Psicologia Clínica',
    categoria: 'Psicólogo',
    unidadesAtendimento: ['CAPS Centro'],
    horarioAtendimento: {
      segunda: '14:00-20:00',
      terca: '14:00-20:00',
      quarta: '14:00-20:00',
      quinta: '14:00-20:00',
    },
    diasSemana: ['Segunda', 'Terça', 'Quarta', 'Quinta'],
    tempoMedioConsulta: 50,
    aceitaAgendamento: true,
  },
];

export async function seedProfissionaisSaude() {
  console.log('   👨‍⚕️  Profissionais de Saúde...');

  // 🔴 FUNCIONALIDADE QUEBRADA (detectado 2026-09-15) — NÃO é código morto.
  //
  // O model `ProfissionalSaude` NÃO existe mais: não está no schema.prisma e a
  // tabela não existe no banco (há apenas profissionais_equipes e
  // profissionais_atividades). Este seed quebrava com
  //   TypeError: Cannot read properties of undefined (reading 'upsert')
  // e derrubava TODO o bloco de dados auxiliares junto (categorias, tipos,
  // entidades municipais), que rodam depois dele.
  //
  // ⚠️ O problema é MAIOR que este seed: `src/apps/saude/integracao/
  // ledi-converter.service.ts` (linhas 150 e 279) também chama
  // `prisma.profissionalSaude.findUnique` — código de PRODUÇÃO da integração
  // e-SUS/LEDI, que falha em runtime pelo mesmo motivo. O `tsc` não acusa
  // porque o projeto roda com ignoreBuildErrors.
  //
  // DECISÃO PENDENTE (restaurar o model, migrar para HealthProfessionalData, ou
  // descontinuar de vez). Até lá, este seed AVISA e segue, em vez de derrubar os
  // demais dados auxiliares. Os dados de origem foram preservados acima.
  if (!(prisma as any).profissionalSaude) {
    console.warn(
      '   ⚠️  PULADO: o model ProfissionalSaude não existe no schema.\n' +
        '      Os dados continuam em profissionaisSaudeData, aguardando decisão.\n' +
        '      Ver também: src/apps/saude/integracao/ledi-converter.service.ts'
    );
    return;
  }

  for (const data of profissionaisSaudeData) {
    await (prisma as any).profissionalSaude.upsert({
      where: { cpf: data.cpf },
      update: data,
      create: data,
    });
  }

  console.log(`   ✅ ${profissionaisSaudeData.length} profissionais de saúde criados`);
}

// ========================================
// PROFESSORES E INSTRUTORES
// ========================================

export const professoresData = [
  {
    nome: 'Prof. Fernando Martins',
    cpf: '111.222.333-44',
    formacao: 'Licenciatura em Educação Física',
    especializacoes: ['Treinamento Esportivo', 'Educação Física Escolar'],
    areasAtuacao: ['Futebol', 'Vôlei', 'Atletismo'],
    vinculo: 'Efetivo',
    cargaHoraria: 40,
    disponibilidade: {
      segunda: '14:00-18:00',
      terca: '14:00-18:00',
      quarta: '14:00-18:00',
      quinta: '14:00-18:00',
      sexta: '14:00-18:00',
    },
    avaliacaoMedia: 4.8,
  },
  {
    nome: 'Profa. Camila Rodrigues',
    cpf: '222.333.444-55',
    formacao: 'Bacharel em Música',
    especializacoes: ['Canto', 'Regência Coral'],
    areasAtuacao: ['Música', 'Canto Coral'],
    vinculo: 'Contratado',
    cargaHoraria: 20,
    disponibilidade: {
      terca: '19:00-22:00',
      quinta: '19:00-22:00',
      sabado: '09:00-12:00',
    },
    avaliacaoMedia: 5.0,
  },
  {
    nome: 'Inst. Rafael Santos',
    cpf: '333.444.555-66',
    formacao: 'Técnico em Informática',
    especializacoes: ['Informática Básica', 'Manutenção de Computadores'],
    areasAtuacao: ['Informática', 'Tecnologia'],
    vinculo: 'Contratado',
    cargaHoraria: 30,
    disponibilidade: {
      segunda: '08:00-12:00, 14:00-18:00',
      quarta: '08:00-12:00, 14:00-18:00',
      sexta: '08:00-12:00',
    },
    avaliacaoMedia: 4.5,
  },
  {
    nome: 'Profa. Beatriz Almeida',
    cpf: '444.555.666-77',
    formacao: 'Licenciatura em Artes Visuais',
    especializacoes: ['Pintura', 'Desenho', 'Artesanato'],
    areasAtuacao: ['Pintura', 'Artesanato'],
    vinculo: 'Efetivo',
    cargaHoraria: 40,
    disponibilidade: {
      segunda: '14:00-18:00',
      terca: '14:00-18:00',
      quarta: '14:00-18:00',
      quinta: '14:00-18:00',
      sexta: '14:00-18:00',
    },
    avaliacaoMedia: 4.9,
  },
  {
    nome: 'Inst. Marcelo Costa',
    cpf: '555.666.777-88',
    formacao: 'Técnico em Mecânica Automotiva',
    especializacoes: ['Mecânica de Automóveis', 'Manutenção Preventiva'],
    areasAtuacao: ['Mecânica Automotiva'],
    vinculo: 'Voluntário',
    cargaHoraria: 12,
    disponibilidade: {
      sabado: '08:00-12:00',
    },
    avaliacaoMedia: 4.7,
  },
  {
    nome: 'Profa. Luciana Ferreira',
    cpf: '666.777.888-99',
    formacao: 'Graduação em Dança',
    especializacoes: ['Ballet Clássico', 'Dança Contemporânea', 'Dança de Salão'],
    areasAtuacao: ['Dança'],
    vinculo: 'Contratado',
    cargaHoraria: 25,
    disponibilidade: {
      segunda: '18:00-21:00',
      quarta: '18:00-21:00',
      sexta: '18:00-21:00',
    },
    avaliacaoMedia: 4.8,
  },
];

export async function seedProfessores() {
  console.log('   👨‍🏫 Professores e Instrutores...');

  // ⚠️ MULTI-TENANT (2026-09-15): Professor tem unique composta com tenantId,
  // então `where: { cpf }` não valida. findFirst escopado + create/update por id.
  for (const data of professoresData) {
    const existente = await prisma.professor.findFirst({
      where: { cpf: data.cpf },
      select: { id: true },
    });

    if (existente) {
      await prisma.professor.update({ where: { id: existente.id }, data });
    } else {
      await prisma.professor.create({ data });
    }
  }

  console.log(`   ✅ ${professoresData.length} professores e instrutores criados`);
}

// ========================================
// GUIAS TURÍSTICOS
// ========================================

export const guiasTuristicosData = [
  {
    nome: 'Ricardo Oliveira',
    cpf: '777.888.999-00',
    cadastur: 'CADASTUR-12.345678.90.0001-1',
    idiomas: ['Português', 'Inglês', 'Espanhol'],
    especialidades: ['Turismo Histórico', 'Turismo Cultural'],
    certificacoes: ['Guia de Turismo Regional', 'Primeiros Socorros'],
    disponibilidade: {
      segunda: 'Disponível',
      terca: 'Disponível',
      quarta: 'Disponível',
      quinta: 'Disponível',
      sexta: 'Disponível',
      sabado: 'Disponível',
      domingo: 'Disponível',
    },
    valorDiaria: 300.0,
    avaliacaoMedia: 4.9,
    totalTours: 127,
  },
  {
    nome: 'Amanda Silva',
    cpf: '888.999.000-11',
    cadastur: 'CADASTUR-12.345678.90.0002-2',
    idiomas: ['Português', 'Inglês'],
    especialidades: ['Ecoturismo', 'Turismo de Aventura'],
    certificacoes: ['Guia de Turismo de Aventura', 'Condutor Ambiental', 'Escalada'],
    disponibilidade: {
      sexta: 'Disponível',
      sabado: 'Disponível',
      domingo: 'Disponível',
    },
    valorDiaria: 350.0,
    avaliacaoMedia: 5.0,
    totalTours: 89,
  },
  {
    nome: 'Pedro Henrique Costa',
    cpf: '999.000.111-22',
    cadastur: 'CADASTUR-12.345678.90.0003-3',
    idiomas: ['Português', 'Inglês', 'Francês', 'Italiano'],
    especialidades: ['Turismo Gastronômico', 'Turismo Cultural', 'Turismo Religioso'],
    certificacoes: ['Guia de Turismo Nacional', 'Sommelier', 'História da Arte'],
    disponibilidade: {
      quinta: 'Disponível',
      sexta: 'Disponível',
      sabado: 'Disponível',
      domingo: 'Disponível',
    },
    valorDiaria: 400.0,
    avaliacaoMedia: 4.8,
    totalTours: 203,
  },
  {
    nome: 'Juliana Pereira',
    cpf: '000.111.222-33',
    cadastur: 'CADASTUR-12.345678.90.0004-4',
    idiomas: ['Português'],
    especialidades: ['Turismo Rural', 'Agroturismo'],
    certificacoes: ['Guia de Turismo Regional', 'Produção Orgânica'],
    disponibilidade: {
      sabado: 'Disponível',
      domingo: 'Disponível',
    },
    valorDiaria: 250.0,
    avaliacaoMedia: 4.7,
    totalTours: 56,
  },
];

export async function seedGuiasTuristicos() {
  console.log('   🌍 Guias Turísticos...');

  // ⚠️ MULTI-TENANT (2026-09-15): GuiaTuristico tem unique composta com
  // tenantId — mesmo tratamento do Professor acima.
  for (const data of guiasTuristicosData) {
    const existente = await prisma.guiaTuristico.findFirst({
      where: { cpf: data.cpf },
      select: { id: true },
    });

    if (existente) {
      await prisma.guiaTuristico.update({ where: { id: existente.id }, data });
    } else {
      await prisma.guiaTuristico.create({ data });
    }
  }

  console.log(`   ✅ ${guiasTuristicosData.length} guias turísticos criados`);
}

// ========================================
// FUNÇÃO PRINCIPAL
// ========================================

export async function seedProfissionais() {
  console.log('\n═══ PROFISSIONAIS ═══\n');

  await seedProfissionaisSaude();
  await seedProfessores();
  await seedGuiasTuristicos();

  console.log('\n✅ Profissionais criados com sucesso!\n');
}
