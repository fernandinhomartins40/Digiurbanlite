/**
 * SEED 03: VÍNCULOS PROFISSIONAIS
 *
 * Cria vínculos entre servidores de saúde e unidades através do Sistema Unificado V2.0
 *
 * Para cada profissional cria:
 * - Position (cargo no sistema unificado)
 * - EmployeeAssignment (vínculo servidor ↔ cargo ↔ unidade)
 * - AssignmentAudit (registro de auditoria)
 *
 * Cenários realistas:
 * - Médicos vinculados a UBS/ESF/UPA/Hospital
 * - Enfermeiros com múltiplos vínculos (exemplo: 30h UBS + 10h UPA)
 * - ACS vinculados exclusivamente a equipes ESF
 * - Profissionais com cargas horárias variadas (20h, 30h, 40h)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seed03VinculosProfissionais() {
  console.log('🔗 SEED 03: Criando Vínculos Profissionais...\n');

  // =====================================================
  // 1. BUSCAR DEPARTAMENTO E UNIDADES
  // =====================================================

  const departamentoSaude = await prisma.department.findFirst({
    where: { code: 'SAUDE' }
  });

  if (!departamentoSaude) {
    throw new Error('❌ Departamento de Saúde não encontrado. Execute o seed 01 primeiro.');
  }

  // Buscar unidades organizacionais
  const unidadesOrg = await prisma.organizationalUnit.findMany({
    where: {
      departmentId: departamentoSaude.id,
      tipo: 'SETOR',
    },
    include: {
      unidadeSaude: true,
    }
  });

  if (unidadesOrg.length === 0) {
    throw new Error('❌ Unidades de saúde não encontradas. Execute o seed 01 primeiro.');
  }

  // Mapear unidades por tipo
  const ubsCentral = unidadesOrg.find(u => u.sigla === 'UBS-CENTRAL');
  const ubsNorte = unidadesOrg.find(u => u.sigla === 'UBS-NORTE');
  const ubsSul = unidadesOrg.find(u => u.sigla === 'UBS-SUL');
  const ubsVilaNova = unidadesOrg.find(u => u.sigla === 'UBS-VILANOVA');
  const esfJardim = unidadesOrg.find(u => u.sigla === 'ESF-JDESPERANCA');
  const esfParque = unidadesOrg.find(u => u.sigla === 'ESF-PQFLORES');
  const policlinica = unidadesOrg.find(u => u.sigla === 'POLICLINICA');
  const upaCentro = unidadesOrg.find(u => u.sigla === 'UPA-CENTRO');
  const upaNorte = unidadesOrg.find(u => u.sigla === 'UPA-NORTE');
  const hospital = unidadesOrg.find(u => u.sigla === 'HOSP-SAOJOAO');
  const caps = unidadesOrg.find(u => u.sigla === 'CAPS-CENTRO');
  const cer = unidadesOrg.find(u => u.sigla === 'CER');

  console.log(`✅ ${unidadesOrg.length} unidades organizacionais encontradas\n`);

  // =====================================================
  // 2. BUSCAR SERVIDORES DE SAÚDE
  // =====================================================

  const servidores = await prisma.user.findMany({
    where: {
      email: {
        endsWith: '@saude.sp.gov.br'
      }
    },
    include: {
      healthData: true,
    }
  });

  if (servidores.length === 0) {
    throw new Error('❌ Servidores de saúde não encontrados. Execute o seed 02 primeiro.');
  }

  console.log(`✅ ${servidores.length} servidores de saúde encontrados\n`);

  // =====================================================
  // 3. CRIAR CARGOS (POSITIONS)
  // =====================================================

  console.log('💼 Criando cargos...');

  const cargos = [
    // Médicos
    {
      nome: 'Médico - Clínico Geral',
      tipo: 'EFETIVO' as const,
      nivel: 'ESPECIALISTA' as const,
      categoria: 'SAUDE',
      cbo: '225125',
    },
    {
      nome: 'Médico - Pediatra',
      tipo: 'EFETIVO' as const,
      nivel: 'ESPECIALISTA' as const,
      categoria: 'SAUDE',
      cbo: '225142',
    },
    {
      nome: 'Médico - Ginecologista',
      tipo: 'EFETIVO' as const,
      nivel: 'ESPECIALISTA' as const,
      categoria: 'SAUDE',
      cbo: '225260',
    },
    {
      nome: 'Médico - Cardiologista',
      tipo: 'EFETIVO' as const,
      nivel: 'ESPECIALISTA' as const,
      categoria: 'SAUDE',
      cbo: '225118',
    },
    {
      nome: 'Médico - Psiquiatra',
      tipo: 'EFETIVO' as const,
      nivel: 'ESPECIALISTA' as const,
      categoria: 'SAUDE',
      cbo: '225330',
    },
    {
      nome: 'Médico - Ortopedista',
      tipo: 'EFETIVO' as const,
      nivel: 'ESPECIALISTA' as const,
      categoria: 'SAUDE',
      cbo: '225150',
    },
    {
      nome: 'Médico - Dermatologista',
      tipo: 'EFETIVO' as const,
      nivel: 'ESPECIALISTA' as const,
      categoria: 'SAUDE',
      cbo: '225136',
    },
    {
      nome: 'Médico - Neurologista',
      tipo: 'EFETIVO' as const,
      nivel: 'ESPECIALISTA' as const,
      categoria: 'SAUDE',
      cbo: '225151',
    },
    // Enfermagem
    {
      nome: 'Enfermeiro',
      tipo: 'EFETIVO' as const,
      nivel: 'TECNICO' as const,
      categoria: 'SAUDE',
      cbo: '223565',
    },
    {
      nome: 'Técnico de Enfermagem',
      tipo: 'EFETIVO' as const,
      nivel: 'OPERACIONAL' as const,
      categoria: 'SAUDE',
      cbo: '322205',
    },
    // Odontologia
    {
      nome: 'Cirurgião-Dentista',
      tipo: 'EFETIVO' as const,
      nivel: 'ESPECIALISTA' as const,
      categoria: 'SAUDE',
      cbo: '223293',
    },
    // Psicologia
    {
      nome: 'Psicólogo',
      tipo: 'EFETIVO' as const,
      nivel: 'ESPECIALISTA' as const,
      categoria: 'SAUDE',
      cbo: '251510',
    },
    // ACS
    {
      nome: 'Agente Comunitário de Saúde',
      tipo: 'EFETIVO' as const,
      nivel: 'OPERACIONAL' as const,
      categoria: 'SAUDE',
      cbo: '515105',
    },
  ];

  const cargosCriados = new Map();

  for (const cargoData of cargos) {
    const cargo = await prisma.position.upsert({
      where: {
        departmentId_nome: {
          departmentId: departamentoSaude.id,
          nome: cargoData.nome,
        }
      },
      update: {},
      create: {
        nome: cargoData.nome,
        tipo: cargoData.tipo,
        nivel: cargoData.nivel,
        departmentId: departamentoSaude.id,
        categoria: cargoData.categoria,
        requisitos: ['Registro profissional válido', 'Diploma reconhecido pelo MEC'],
        atribuicoes: ['Atendimento à população', 'Registro de procedimentos', 'Participação em reuniões de equipe'],
      }
    });

    cargosCriados.set(cargoData.nome, cargo);
    console.log(`   ✅ Cargo: ${cargoData.nome}`);
  }

  console.log(`\n✅ ${cargosCriados.size} cargos criados\n`);

  // =====================================================
  // 4. CRIAR VÍNCULOS (EMPLOYEE ASSIGNMENTS)
  // =====================================================

  console.log('🔗 Criando vínculos profissionais...\n');

  const dataInicioBase = new Date('2024-01-02'); // 02/01/2024

  const vinculos = [
    // =============== MÉDICOS ===============

    // Dr. João Pedro Silva - Clínico Geral - UBS Central (40h)
    {
      userEmail: 'joao.silva@saude.sp.gov.br',
      cargoId: cargosCriados.get('Médico - Clínico Geral')?.id,
      unidadeOrgId: ubsCentral?.id,
      tipo: 'LOTACAO' as const,
      situacao: 'ATIVO' as const,
      isPrimary: true,
      dataInicio: dataInicioBase,
      cargaHoraria: 40,
      percentualDedicacao: 100,
      observacoes: 'Atendimento em Clínica Geral e Medicina de Família',
      documentoVinculo: 'Portaria SMS nº 001/2024',
    },

    // Dra. Maria Santos Costa - Pediatra - UBS Norte (40h)
    {
      userEmail: 'maria.costa@saude.sp.gov.br',
      cargoId: cargosCriados.get('Médico - Pediatra')?.id,
      unidadeOrgId: ubsNorte?.id,
      tipo: 'LOTACAO' as const,
      situacao: 'ATIVO' as const,
      isPrimary: true,
      dataInicio: dataInicioBase,
      cargaHoraria: 40,
      percentualDedicacao: 100,
      observacoes: 'Atendimento pediátrico e puericultura',
      documentoVinculo: 'Portaria SMS nº 002/2024',
    },

    // Dr. Carlos Eduardo Oliveira - Ginecologista - UBS Central (30h) + Policlínica (10h)
    {
      userEmail: 'carlos.oliveira@saude.sp.gov.br',
      cargoId: cargosCriados.get('Médico - Ginecologista')?.id,
      unidadeOrgId: ubsCentral?.id,
      tipo: 'LOTACAO' as const,
      situacao: 'ATIVO' as const,
      isPrimary: true,
      dataInicio: dataInicioBase,
      cargaHoraria: 30,
      percentualDedicacao: 75,
      observacoes: 'Atendimento ginecológico e pré-natal',
      documentoVinculo: 'Portaria SMS nº 003/2024',
    },
    {
      userEmail: 'carlos.oliveira@saude.sp.gov.br',
      cargoId: cargosCriados.get('Médico - Ginecologista')?.id,
      unidadeOrgId: policlinica?.id,
      tipo: 'LOTACAO' as const,
      situacao: 'ATIVO' as const,
      isPrimary: false,
      dataInicio: dataInicioBase,
      cargaHoraria: 10,
      percentualDedicacao: 25,
      observacoes: 'Atendimento especializado semanal',
      documentoVinculo: 'Portaria SMS nº 003/2024',
    },

    // Dr. Ricardo Almeida Ferreira - Cardiologista - Hospital (30h) + Policlínica (10h)
    {
      userEmail: 'ricardo.ferreira@saude.sp.gov.br',
      cargoId: cargosCriados.get('Médico - Cardiologista')?.id,
      unidadeOrgId: hospital?.id,
      tipo: 'LOTACAO' as const,
      situacao: 'ATIVO' as const,
      isPrimary: true,
      dataInicio: dataInicioBase,
      cargaHoraria: 30,
      percentualDedicacao: 75,
      observacoes: 'Atendimento hospitalar e emergências cardiológicas',
      documentoVinculo: 'Portaria SMS nº 004/2024',
    },
    {
      userEmail: 'ricardo.ferreira@saude.sp.gov.br',
      cargoId: cargosCriados.get('Médico - Cardiologista')?.id,
      unidadeOrgId: policlinica?.id,
      tipo: 'LOTACAO' as const,
      situacao: 'ATIVO' as const,
      isPrimary: false,
      dataInicio: dataInicioBase,
      cargaHoraria: 10,
      percentualDedicacao: 25,
      observacoes: 'Consultas especializadas',
      documentoVinculo: 'Portaria SMS nº 004/2024',
    },

    // Dra. Ana Paula Rodrigues - Psiquiatra - CAPS (40h)
    {
      userEmail: 'ana.rodrigues@saude.sp.gov.br',
      cargoId: cargosCriados.get('Médico - Psiquiatra')?.id,
      unidadeOrgId: caps?.id,
      tipo: 'LOTACAO' as const,
      situacao: 'ATIVO' as const,
      isPrimary: true,
      dataInicio: dataInicioBase,
      cargaHoraria: 40,
      percentualDedicacao: 100,
      observacoes: 'Atendimento psiquiátrico e coordenação clínica',
      documentoVinculo: 'Portaria SMS nº 005/2024',
    },

    // Dr. Fernando Lima Souza - Ortopedista - UPA Centro (24h) + Hospital (16h)
    {
      userEmail: 'fernando.souza@saude.sp.gov.br',
      cargoId: cargosCriados.get('Médico - Ortopedista')?.id,
      unidadeOrgId: upaCentro?.id,
      tipo: 'LOTACAO' as const,
      situacao: 'ATIVO' as const,
      isPrimary: true,
      dataInicio: dataInicioBase,
      cargaHoraria: 24,
      percentualDedicacao: 60,
      observacoes: 'Plantões de urgência ortopédica',
      documentoVinculo: 'Portaria SMS nº 006/2024',
    },
    {
      userEmail: 'fernando.souza@saude.sp.gov.br',
      cargoId: cargosCriados.get('Médico - Ortopedista')?.id,
      unidadeOrgId: hospital?.id,
      tipo: 'LOTACAO' as const,
      situacao: 'ATIVO' as const,
      isPrimary: false,
      dataInicio: dataInicioBase,
      cargaHoraria: 16,
      percentualDedicacao: 40,
      observacoes: 'Cirurgias ortopédicas eletivas',
      documentoVinculo: 'Portaria SMS nº 006/2024',
    },

    // Dra. Juliana Mendes Barbosa - Dermatologista - Policlínica (40h)
    {
      userEmail: 'juliana.barbosa@saude.sp.gov.br',
      cargoId: cargosCriados.get('Médico - Dermatologista')?.id,
      unidadeOrgId: policlinica?.id,
      tipo: 'LOTACAO' as const,
      situacao: 'ATIVO' as const,
      isPrimary: true,
      dataInicio: dataInicioBase,
      cargaHoraria: 40,
      percentualDedicacao: 100,
      observacoes: 'Atendimento dermatológico especializado',
      documentoVinculo: 'Portaria SMS nº 007/2024',
    },

    // Dr. Roberto Castro Nunes - Neurologista - Hospital (40h)
    {
      userEmail: 'roberto.nunes@saude.sp.gov.br',
      cargoId: cargosCriados.get('Médico - Neurologista')?.id,
      unidadeOrgId: hospital?.id,
      tipo: 'LOTACAO' as const,
      situacao: 'ATIVO' as const,
      isPrimary: true,
      dataInicio: dataInicioBase,
      cargaHoraria: 40,
      percentualDedicacao: 100,
      observacoes: 'Atendimento neurológico e interconsultas hospitalares',
      documentoVinculo: 'Portaria SMS nº 008/2024',
    },

    // =============== ENFERMEIROS ===============

    // Enf. Patrícia Lima Santos - UBS Central (40h)
    {
      userEmail: 'patricia.santos@saude.sp.gov.br',
      cargoId: cargosCriados.get('Enfermeiro')?.id,
      unidadeOrgId: ubsCentral?.id,
      tipo: 'LOTACAO' as const,
      situacao: 'ATIVO' as const,
      isPrimary: true,
      dataInicio: dataInicioBase,
      cargaHoraria: 40,
      percentualDedicacao: 100,
      observacoes: 'Coordenação de enfermagem da unidade',
      documentoVinculo: 'Portaria SMS nº 009/2024',
    },

    // Enf. Marcos Vieira Lopes - UPA Centro (40h)
    {
      userEmail: 'marcos.lopes@saude.sp.gov.br',
      cargoId: cargosCriados.get('Enfermeiro')?.id,
      unidadeOrgId: upaCentro?.id,
      tipo: 'LOTACAO' as const,
      situacao: 'ATIVO' as const,
      isPrimary: true,
      dataInicio: dataInicioBase,
      cargaHoraria: 40,
      percentualDedicacao: 100,
      observacoes: 'Enfermagem de urgência e emergência',
      documentoVinculo: 'Portaria SMS nº 010/2024',
    },

    // Enf. Camila Ferreira Costa - UBS Norte (30h) + UBS Sul (10h)
    {
      userEmail: 'camila.costa@saude.sp.gov.br',
      cargoId: cargosCriados.get('Enfermeiro')?.id,
      unidadeOrgId: ubsNorte?.id,
      tipo: 'LOTACAO' as const,
      situacao: 'ATIVO' as const,
      isPrimary: true,
      dataInicio: dataInicioBase,
      cargaHoraria: 30,
      percentualDedicacao: 75,
      observacoes: 'Enfermagem obstétrica e saúde da mulher',
      documentoVinculo: 'Portaria SMS nº 011/2024',
    },
    {
      userEmail: 'camila.costa@saude.sp.gov.br',
      cargoId: cargosCriados.get('Enfermeiro')?.id,
      unidadeOrgId: ubsSul?.id,
      tipo: 'LOTACAO' as const,
      situacao: 'ATIVO' as const,
      isPrimary: false,
      dataInicio: dataInicioBase,
      cargaHoraria: 10,
      percentualDedicacao: 25,
      observacoes: 'Apoio matricial semanal',
      documentoVinculo: 'Portaria SMS nº 011/2024',
    },

    // Enf. Rafael Souza Martins - CAPS (40h)
    {
      userEmail: 'rafael.martins@saude.sp.gov.br',
      cargoId: cargosCriados.get('Enfermeiro')?.id,
      unidadeOrgId: caps?.id,
      tipo: 'LOTACAO' as const,
      situacao: 'ATIVO' as const,
      isPrimary: true,
      dataInicio: dataInicioBase,
      cargaHoraria: 40,
      percentualDedicacao: 100,
      observacoes: 'Enfermagem em saúde mental',
      documentoVinculo: 'Portaria SMS nº 012/2024',
    },

    // Enf. Luciana Alves Pereira - UBS Sul (40h)
    {
      userEmail: 'luciana.pereira@saude.sp.gov.br',
      cargoId: cargosCriados.get('Enfermeiro')?.id,
      unidadeOrgId: ubsSul?.id,
      tipo: 'LOTACAO' as const,
      situacao: 'ATIVO' as const,
      isPrimary: true,
      dataInicio: dataInicioBase,
      cargaHoraria: 40,
      percentualDedicacao: 100,
      observacoes: 'Enfermagem pediátrica',
      documentoVinculo: 'Portaria SMS nº 013/2024',
    },

    // Enf. André Oliveira Silva - Hospital (40h)
    {
      userEmail: 'andre.silva@saude.sp.gov.br',
      cargoId: cargosCriados.get('Enfermeiro')?.id,
      unidadeOrgId: hospital?.id,
      tipo: 'LOTACAO' as const,
      situacao: 'ATIVO' as const,
      isPrimary: true,
      dataInicio: dataInicioBase,
      cargaHoraria: 40,
      percentualDedicacao: 100,
      observacoes: 'Enfermagem hospitalar',
      documentoVinculo: 'Portaria SMS nº 014/2024',
    },

    // =============== TÉCNICOS DE ENFERMAGEM ===============

    // Téc. Enf. Sandra Regina Dias - UBS Central (40h)
    {
      userEmail: 'sandra.dias@saude.sp.gov.br',
      cargoId: cargosCriados.get('Técnico de Enfermagem')?.id,
      unidadeOrgId: ubsCentral?.id,
      tipo: 'LOTACAO' as const,
      situacao: 'ATIVO' as const,
      isPrimary: true,
      dataInicio: dataInicioBase,
      cargaHoraria: 40,
      percentualDedicacao: 100,
      observacoes: 'Sala de procedimentos e vacinação',
      documentoVinculo: 'Portaria SMS nº 015/2024',
    },

    // Téc. Enf. Paulo Roberto Gomes - UPA Centro (40h)
    {
      userEmail: 'paulo.gomes@saude.sp.gov.br',
      cargoId: cargosCriados.get('Técnico de Enfermagem')?.id,
      unidadeOrgId: upaCentro?.id,
      tipo: 'LOTACAO' as const,
      situacao: 'ATIVO' as const,
      isPrimary: true,
      dataInicio: dataInicioBase,
      cargaHoraria: 40,
      percentualDedicacao: 100,
      observacoes: 'Atendimento de urgência',
      documentoVinculo: 'Portaria SMS nº 016/2024',
    },

    // Téc. Enf. Mariana Silva Santos - UBS Norte (40h)
    {
      userEmail: 'mariana.santos@saude.sp.gov.br',
      cargoId: cargosCriados.get('Técnico de Enfermagem')?.id,
      unidadeOrgId: ubsNorte?.id,
      tipo: 'LOTACAO' as const,
      situacao: 'ATIVO' as const,
      isPrimary: true,
      dataInicio: dataInicioBase,
      cargaHoraria: 40,
      percentualDedicacao: 100,
      observacoes: 'Sala de procedimentos e curativos',
      documentoVinculo: 'Portaria SMS nº 017/2024',
    },

    // Téc. Enf. Diego Ferreira Lima - Hospital (40h)
    {
      userEmail: 'diego.lima@saude.sp.gov.br',
      cargoId: cargosCriados.get('Técnico de Enfermagem')?.id,
      unidadeOrgId: hospital?.id,
      tipo: 'LOTACAO' as const,
      situacao: 'ATIVO' as const,
      isPrimary: true,
      dataInicio: dataInicioBase,
      cargaHoraria: 40,
      percentualDedicacao: 100,
      observacoes: 'Enfermagem hospitalar',
      documentoVinculo: 'Portaria SMS nº 018/2024',
    },

    // =============== DENTISTAS ===============

    // Dra. Fabiana Costa Ribeiro - UBS Central (40h)
    {
      userEmail: 'fabiana.ribeiro@saude.sp.gov.br',
      cargoId: cargosCriados.get('Cirurgião-Dentista')?.id,
      unidadeOrgId: ubsCentral?.id,
      tipo: 'LOTACAO' as const,
      situacao: 'ATIVO' as const,
      isPrimary: true,
      dataInicio: dataInicioBase,
      cargaHoraria: 40,
      percentualDedicacao: 100,
      observacoes: 'Atendimento odontológico geral',
      documentoVinculo: 'Portaria SMS nº 019/2024',
    },

    // Dr. Thiago Almeida Rocha - UBS Norte (40h)
    {
      userEmail: 'thiago.rocha@saude.sp.gov.br',
      cargoId: cargosCriados.get('Cirurgião-Dentista')?.id,
      unidadeOrgId: ubsNorte?.id,
      tipo: 'LOTACAO' as const,
      situacao: 'ATIVO' as const,
      isPrimary: true,
      dataInicio: dataInicioBase,
      cargaHoraria: 40,
      percentualDedicacao: 100,
      observacoes: 'Atendimento odontológico geral',
      documentoVinculo: 'Portaria SMS nº 020/2024',
    },

    // Dra. Renata Oliveira Campos - UBS Vila Nova (40h)
    {
      userEmail: 'renata.campos@saude.sp.gov.br',
      cargoId: cargosCriados.get('Cirurgião-Dentista')?.id,
      unidadeOrgId: ubsVilaNova?.id,
      tipo: 'LOTACAO' as const,
      situacao: 'ATIVO' as const,
      isPrimary: true,
      dataInicio: dataInicioBase,
      cargaHoraria: 40,
      percentualDedicacao: 100,
      observacoes: 'Atendimento odontológico geral',
      documentoVinculo: 'Portaria SMS nº 021/2024',
    },

    // =============== PSICÓLOGOS ===============

    // Psic. Beatriz Mendes Lima - CAPS (40h)
    {
      userEmail: 'beatriz.lima@saude.sp.gov.br',
      cargoId: cargosCriados.get('Psicólogo')?.id,
      unidadeOrgId: caps?.id,
      tipo: 'LOTACAO' as const,
      situacao: 'ATIVO' as const,
      isPrimary: true,
      dataInicio: dataInicioBase,
      cargaHoraria: 40,
      percentualDedicacao: 100,
      observacoes: 'Atendimento psicológico em saúde mental',
      documentoVinculo: 'Portaria SMS nº 022/2024',
    },

    // Psic. Gustavo Henrique Dias - CER (40h)
    {
      userEmail: 'gustavo.dias@saude.sp.gov.br',
      cargoId: cargosCriados.get('Psicólogo')?.id,
      unidadeOrgId: cer?.id,
      tipo: 'LOTACAO' as const,
      situacao: 'ATIVO' as const,
      isPrimary: true,
      dataInicio: dataInicioBase,
      cargaHoraria: 40,
      percentualDedicacao: 100,
      observacoes: 'Psicologia e reabilitação',
      documentoVinculo: 'Portaria SMS nº 023/2024',
    },

    // =============== ACS ===============

    // Josefa Maria da Silva - ESF Jardim Esperança (40h)
    {
      userEmail: 'josefa.silva@saude.sp.gov.br',
      cargoId: cargosCriados.get('Agente Comunitário de Saúde')?.id,
      unidadeOrgId: esfJardim?.id,
      tipo: 'LOTACAO' as const,
      situacao: 'ATIVO' as const,
      isPrimary: true,
      dataInicio: dataInicioBase,
      cargaHoraria: 40,
      percentualDedicacao: 100,
      observacoes: 'Visitas domiciliares Microárea 01',
      documentoVinculo: 'Portaria SMS nº 024/2024',
    },

    // Antonio Carlos Souza - ESF Parque das Flores (40h)
    {
      userEmail: 'antonio.souza@saude.sp.gov.br',
      cargoId: cargosCriados.get('Agente Comunitário de Saúde')?.id,
      unidadeOrgId: esfParque?.id,
      tipo: 'LOTACAO' as const,
      situacao: 'ATIVO' as const,
      isPrimary: true,
      dataInicio: dataInicioBase,
      cargaHoraria: 40,
      percentualDedicacao: 100,
      observacoes: 'Visitas domiciliares Microárea 02',
      documentoVinculo: 'Portaria SMS nº 025/2024',
    },
  ];

  const vinculosCriados = [];
  let vinculosPrimarios = 0;
  let vinculosSecundarios = 0;

  for (const vinculoData of vinculos) {
    const user = servidores.find(s => s.email === vinculoData.userEmail);

    if (!user || !vinculoData.cargoId || !vinculoData.unidadeOrgId) {
      console.log(`   ⚠️  Pulando vínculo: dados incompletos para ${vinculoData.userEmail}`);
      continue;
    }

    // ⚠️ IDEMPOTÊNCIA (corrigido 2026-09-15): era `create` puro, então rodar o
    // seed duas vezes quebrava com
    //   Unique constraint failed on the fields:
    //   (`userId`,`organizationalUnitId`,`positionId`,`dataInicio`)
    // Seed tem de poder rodar novamente sem erro — pulamos o que já existe.
    const vinculoExistente = await prisma.employeeAssignment.findFirst({
      where: {
        userId: user.id,
        organizationalUnitId: vinculoData.unidadeOrgId,
        positionId: vinculoData.cargoId,
        dataInicio: vinculoData.dataInicio,
      },
      select: { id: true },
    });

    if (vinculoExistente) {
      console.log(`   ↩️  Vínculo já existe para ${vinculoData.userEmail}, pulando`);
      continue;
    }

    // Criar vínculo
    const vinculo = await prisma.employeeAssignment.create({
      data: {
        userId: user.id,
        departmentId: departamentoSaude.id,
        organizationalUnitId: vinculoData.unidadeOrgId,
        positionId: vinculoData.cargoId,
        tipo: vinculoData.tipo,
        situacao: vinculoData.situacao,
        isPrimary: vinculoData.isPrimary,
        dataInicio: vinculoData.dataInicio,
        cargaHoraria: vinculoData.cargaHoraria,
        percentualDedicacao: vinculoData.percentualDedicacao,
        observacoes: vinculoData.observacoes,
        documentoVinculo: vinculoData.documentoVinculo,
      },
      include: {
        user: true,
        position: true,
        organizationalUnit: true,
      }
    });

    // Criar registro de auditoria
    // ⚠️ (corrigido 2026-09-15) O model AssignmentAudit foi reestruturado e o
    // seed ficou para trás: passava `tipoOperacao`/`executadoPor`/`aprovadoPor`,
    // campos que não existem mais. Erro em runtime:
    //   Argument `tipo` is missing.
    // Os obrigatórios hoje são `tipo` (enum TipoOperacaoVinculo), `userId` e
    // `userName` (denormalizado). Os dados descritivos que não têm mais coluna
    // própria (aprovador, documento legal) foram preservados em `detalhes`,
    // para não perder a informação que o seed pretendia registrar.
    await prisma.assignmentAudit.create({
      data: {
        assignmentId: vinculo.id,
        tipo: 'CRIACAO',
        userId: user.id,
        userName: user.name,
        departmentId: departamentoSaude.id,
        motivo: 'Lotação inicial - Implantação do sistema',
        detalhes: {
          servidor: user.name,
          cargo: vinculo.position?.nome,
          unidade: vinculo.organizationalUnit?.nome,
          cargaHoraria: vinculoData.cargaHoraria,
          aprovadoPor: 'Secretário Municipal de Saúde',
          documentoLegal: vinculoData.documentoVinculo,
          dataEfetivacao: vinculoData.dataInicio,
        },
      } as any
    });

    vinculosCriados.push(vinculo);

    if (vinculoData.isPrimary) {
      vinculosPrimarios++;
      console.log(`   ✅ [PRIMÁRIO] ${user.name} → ${vinculo.organizationalUnit?.sigla} (${vinculoData.cargaHoraria}h)`);
    } else {
      vinculosSecundarios++;
      console.log(`   ✅ [SECUNDÁRIO] ${user.name} → ${vinculo.organizationalUnit?.sigla} (${vinculoData.cargaHoraria}h)`);
    }
  }

  console.log(`\n✅ SEED 03 CONCLUÍDO: ${vinculosCriados.length} vínculos criados com sucesso!\n`);
  console.log('📊 Resumo:');
  console.log(`   • ${vinculosPrimarios} vínculos primários`);
  console.log(`   • ${vinculosSecundarios} vínculos secundários`);
  console.log(`   • ${cargosCriados.size} cargos no sistema unificado`);
  console.log(`   • ${vinculosCriados.length} registros de auditoria criados`);
  console.log(`\n   🔗 Todos os vínculos estão integrados ao Sistema Unificado V2.0\n`);

  return vinculosCriados;
}

// Executar se chamado diretamente
if (require.main === module) {
  seed03VinculosProfissionais()
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
