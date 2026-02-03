/**
 * SEED 02: SERVIDORES DE SAÚDE
 *
 * Cria 25 servidores de saúde com dados realistas:
 * - 8 Médicos (diversas especialidades)
 * - 6 Enfermeiros
 * - 4 Técnicos de Enfermagem
 * - 3 Dentistas
 * - 2 Psicólogos
 * - 2 Agentes Comunitários de Saúde
 *
 * Para cada servidor cria:
 * - User (dados básicos)
 * - HealthProfessionalData (dados profissionais de saúde)
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Função auxiliar para hash de senha
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function seed02ServidoresSaude() {
  console.log('👨‍⚕️ SEED 02: Criando Servidores de Saúde...\n');

  const senhaHash = await hashPassword('senha123'); // Senha padrão para todos

  const servidores = [
    // =====================================================
    // MÉDICOS (8)
    // =====================================================
    {
      // User
      name: 'Dr. João Pedro Silva',
      email: 'joao.silva@saude.sp.gov.br',
      cpf: '123.456.789-01',
      rg: '12.345.678-9',
      birthdate: new Date('1975-03-15'),
      phone: '(11) 98765-4321',
      gender: 'M' as const,
      address: 'Rua das Acácias, 100',
      addressNumber: '100',
      neighborhood: 'Jardim Paulista',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '01400-000',
      // HealthProfessionalData
      categoria: 'MEDICO',
      registroProfissional: 'CRM-SP 123456',
      tipoRegistro: 'CRM',
      ufRegistro: 'SP',
      cns: '700500123456789', // 15 dígitos
      cbo: '225125', // Médico Clínico
      especialidades: ['Clínica Geral', 'Medicina de Família'],
      aceitaAgendamento: true,
      tempoMedioConsulta: 30,
    },
    {
      name: 'Dra. Maria Santos Costa',
      email: 'maria.costa@saude.sp.gov.br',
      cpf: '234.567.890-12',
      rg: '23.456.789-0',
      birthdate: new Date('1980-07-22'),
      phone: '(11) 98765-4322',
      gender: 'F' as const,
      address: 'Avenida Paulista, 1500',
      addressNumber: '1500',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '01310-000',
      categoria: 'MEDICO',
      registroProfissional: 'CRM-SP 234567',
      tipoRegistro: 'CRM',
      ufRegistro: 'SP',
      cns: '700500234567890',
      cbo: '225142', // Médico Pediatra
      especialidades: ['Pediatria', 'Puericultura'],
      aceitaAgendamento: true,
      tempoMedioConsulta: 30,
    },
    {
      name: 'Dr. Carlos Eduardo Oliveira',
      email: 'carlos.oliveira@saude.sp.gov.br',
      cpf: '345.678.901-23',
      rg: '34.567.890-1',
      birthdate: new Date('1978-11-10'),
      phone: '(11) 98765-4323',
      gender: 'M' as const,
      address: 'Rua Augusta, 800',
      addressNumber: '800',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '01305-000',
      categoria: 'MEDICO',
      registroProfissional: 'CRM-SP 345678',
      tipoRegistro: 'CRM',
      ufRegistro: 'SP',
      cns: '700500345678901',
      cbo: '225260', // Médico Ginecologista
      especialidades: ['Ginecologia', 'Obstetrícia'],
      aceitaAgendamento: true,
      tempoMedioConsulta: 40,
    },
    {
      name: 'Dr. Ricardo Almeida Ferreira',
      email: 'ricardo.ferreira@saude.sp.gov.br',
      cpf: '456.789.012-34',
      rg: '45.678.901-2',
      birthdate: new Date('1972-05-18'),
      phone: '(11) 98765-4324',
      gender: 'M' as const,
      address: 'Rua da Consolação, 1200',
      addressNumber: '1200',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '01302-000',
      categoria: 'MEDICO',
      registroProfissional: 'CRM-SP 456789',
      tipoRegistro: 'CRM',
      ufRegistro: 'SP',
      cns: '700500456789012',
      cbo: '225118', // Médico Cardiologista
      especialidades: ['Cardiologia', 'Clínica Médica'],
      aceitaAgendamento: true,
      tempoMedioConsulta: 40,
    },
    {
      name: 'Dra. Ana Paula Rodrigues',
      email: 'ana.rodrigues@saude.sp.gov.br',
      cpf: '567.890.123-45',
      rg: '56.789.012-3',
      birthdate: new Date('1985-09-25'),
      phone: '(11) 98765-4325',
      gender: 'F' as const,
      address: 'Rua Haddock Lobo, 500',
      addressNumber: '500',
      neighborhood: 'Cerqueira César',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '01414-000',
      categoria: 'MEDICO',
      registroProfissional: 'CRM-SP 567890',
      tipoRegistro: 'CRM',
      ufRegistro: 'SP',
      cns: '700500567890123',
      cbo: '225330', // Médico Psiquiatra
      especialidades: ['Psiquiatria', 'Saúde Mental'],
      aceitaAgendamento: true,
      tempoMedioConsulta: 50,
    },
    {
      name: 'Dr. Fernando Lima Souza',
      email: 'fernando.souza@saude.sp.gov.br',
      cpf: '678.901.234-56',
      rg: '67.890.123-4',
      birthdate: new Date('1983-12-08'),
      phone: '(11) 98765-4326',
      gender: 'M' as const,
      address: 'Avenida Rebouças, 3000',
      addressNumber: '3000',
      neighborhood: 'Pinheiros',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '05401-000',
      categoria: 'MEDICO',
      registroProfissional: 'CRM-SP 678901',
      tipoRegistro: 'CRM',
      ufRegistro: 'SP',
      cns: '700500678901234',
      cbo: '225150', // Médico Ortopedista
      especialidades: ['Ortopedia', 'Traumatologia'],
      aceitaAgendamento: true,
      tempoMedioConsulta: 30,
    },
    {
      name: 'Dra. Juliana Mendes Barbosa',
      email: 'juliana.barbosa@saude.sp.gov.br',
      cpf: '789.012.345-67',
      rg: '78.901.234-5',
      birthdate: new Date('1987-04-14'),
      phone: '(11) 98765-4327',
      gender: 'F' as const,
      address: 'Rua Pamplona, 1200',
      addressNumber: '1200',
      neighborhood: 'Jardim Paulista',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '01405-000',
      categoria: 'MEDICO',
      registroProfissional: 'CRM-SP 789012',
      tipoRegistro: 'CRM',
      ufRegistro: 'SP',
      cns: '700500789012345',
      cbo: '225136', // Médico Dermatologista
      especialidades: ['Dermatologia'],
      aceitaAgendamento: true,
      tempoMedioConsulta: 30,
    },
    {
      name: 'Dr. Roberto Castro Nunes',
      email: 'roberto.nunes@saude.sp.gov.br',
      cpf: '890.123.456-78',
      rg: '89.012.345-6',
      birthdate: new Date('1976-08-30'),
      phone: '(11) 98765-4328',
      gender: 'M' as const,
      address: 'Avenida Angélica, 2400',
      addressNumber: '2400',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '01228-000',
      categoria: 'MEDICO',
      registroProfissional: 'CRM-SP 890123',
      tipoRegistro: 'CRM',
      ufRegistro: 'SP',
      cns: '700500890123456',
      cbo: '225151', // Médico Neurologista
      especialidades: ['Neurologia'],
      aceitaAgendamento: true,
      tempoMedioConsulta: 40,
    },

    // =====================================================
    // ENFERMEIROS (6)
    // =====================================================
    {
      name: 'Enf. Patrícia Lima Santos',
      email: 'patricia.santos@saude.sp.gov.br',
      cpf: '901.234.567-89',
      rg: '90.123.456-7',
      birthdate: new Date('1988-06-20'),
      phone: '(11) 98765-4329',
      gender: 'F' as const,
      address: 'Rua Marquês de Paranaguá, 100',
      addressNumber: '100',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '01303-000',
      categoria: 'ENFERMEIRO',
      registroProfissional: 'COREN-SP 123456',
      tipoRegistro: 'COREN',
      ufRegistro: 'SP',
      cns: '700600123456789',
      cbo: '223565', // Enfermeiro
      especialidades: ['Enfermagem Geral', 'Saúde da Família'],
      aceitaAgendamento: true,
      tempoMedioConsulta: 20,
    },
    {
      name: 'Enf. Marcos Vieira Lopes',
      email: 'marcos.lopes@saude.sp.gov.br',
      cpf: '012.345.678-90',
      rg: '01.234.567-8',
      birthdate: new Date('1990-02-12'),
      phone: '(11) 98765-4330',
      gender: 'M' as const,
      address: 'Rua Maria Antônia, 300',
      addressNumber: '300',
      neighborhood: 'Vila Buarque',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '01222-000',
      categoria: 'ENFERMEIRO',
      registroProfissional: 'COREN-SP 234567',
      tipoRegistro: 'COREN',
      ufRegistro: 'SP',
      cns: '700600234567890',
      cbo: '223565',
      especialidades: ['Enfermagem Geral', 'Urgência e Emergência'],
      aceitaAgendamento: true,
      tempoMedioConsulta: 20,
    },
    {
      name: 'Enf. Camila Ferreira Costa',
      email: 'camila.costa@saude.sp.gov.br',
      cpf: '123.456.780-01',
      rg: '12.345.680-9',
      birthdate: new Date('1986-10-05'),
      phone: '(11) 98765-4331',
      gender: 'F' as const,
      address: 'Rua Dona Veridiana, 200',
      addressNumber: '200',
      neighborhood: 'Santa Cecília',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '01238-000',
      categoria: 'ENFERMEIRO',
      registroProfissional: 'COREN-SP 345678',
      tipoRegistro: 'COREN',
      ufRegistro: 'SP',
      cns: '700600345678901',
      cbo: '223565',
      especialidades: ['Enfermagem Obstétrica', 'Saúde da Mulher'],
      aceitaAgendamento: true,
      tempoMedioConsulta: 30,
    },
    {
      name: 'Enf. Rafael Souza Martins',
      email: 'rafael.martins@saude.sp.gov.br',
      cpf: '234.567.801-12',
      rg: '23.456.801-0',
      birthdate: new Date('1992-01-28'),
      phone: '(11) 98765-4332',
      gender: 'M' as const,
      address: 'Rua Bela Cintra, 1800',
      addressNumber: '1800',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '01415-000',
      categoria: 'ENFERMEIRO',
      registroProfissional: 'COREN-SP 456789',
      tipoRegistro: 'COREN',
      ufRegistro: 'SP',
      cns: '700600456789012',
      cbo: '223565',
      especialidades: ['Enfermagem Geral', 'Saúde Mental'],
      aceitaAgendamento: true,
      tempoMedioConsulta: 25,
    },
    {
      name: 'Enf. Luciana Alves Pereira',
      email: 'luciana.pereira@saude.sp.gov.br',
      cpf: '345.678.012-23',
      rg: '34.567.012-1',
      birthdate: new Date('1989-07-16'),
      phone: '(11) 98765-4333',
      gender: 'F' as const,
      address: 'Avenida São Luís, 100',
      addressNumber: '100',
      neighborhood: 'República',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '01046-000',
      categoria: 'ENFERMEIRO',
      registroProfissional: 'COREN-SP 567890',
      tipoRegistro: 'COREN',
      ufRegistro: 'SP',
      cns: '700600567890123',
      cbo: '223565',
      especialidades: ['Enfermagem Pediátrica'],
      aceitaAgendamento: true,
      tempoMedioConsulta: 20,
    },
    {
      name: 'Enf. André Oliveira Silva',
      email: 'andre.silva@saude.sp.gov.br',
      cpf: '456.789.123-34',
      rg: '45.678.123-2',
      birthdate: new Date('1991-11-22'),
      phone: '(11) 98765-4334',
      gender: 'M' as const,
      address: 'Rua da Consolação, 3000',
      addressNumber: '3000',
      neighborhood: 'Cerqueira César',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '01416-000',
      categoria: 'ENFERMEIRO',
      registroProfissional: 'COREN-SP 678901',
      tipoRegistro: 'COREN',
      ufRegistro: 'SP',
      cns: '700600678901234',
      cbo: '223565',
      especialidades: ['Enfermagem Geral', 'Home Care'],
      aceitaAgendamento: true,
      tempoMedioConsulta: 30,
    },

    // =====================================================
    // TÉCNICOS DE ENFERMAGEM (4)
    // =====================================================
    {
      name: 'Téc. Enf. Sandra Regina Dias',
      email: 'sandra.dias@saude.sp.gov.br',
      cpf: '567.890.234-45',
      rg: '56.789.234-3',
      birthdate: new Date('1993-03-10'),
      phone: '(11) 98765-4335',
      gender: 'F' as const,
      address: 'Rua Frei Caneca, 500',
      addressNumber: '500',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '01307-000',
      categoria: 'TECNICO_ENFERMAGEM',
      registroProfissional: 'COREN-SP 789012',
      tipoRegistro: 'COREN',
      ufRegistro: 'SP',
      cns: '700700123456789',
      cbo: '322205', // Técnico de Enfermagem
      especialidades: null,
      aceitaAgendamento: false,
      tempoMedioConsulta: 15,
    },
    {
      name: 'Téc. Enf. Paulo Roberto Gomes',
      email: 'paulo.gomes@saude.sp.gov.br',
      cpf: '678.901.345-56',
      rg: '67.890.345-4',
      birthdate: new Date('1994-08-19'),
      phone: '(11) 98765-4336',
      gender: 'M' as const,
      address: 'Rua Augusta, 1500',
      addressNumber: '1500',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '01304-000',
      categoria: 'TECNICO_ENFERMAGEM',
      registroProfissional: 'COREN-SP 890123',
      tipoRegistro: 'COREN',
      ufRegistro: 'SP',
      cns: '700700234567890',
      cbo: '322205',
      especialidades: null,
      aceitaAgendamento: false,
      tempoMedioConsulta: 15,
    },
    {
      name: 'Téc. Enf. Mariana Silva Santos',
      email: 'mariana.santos@saude.sp.gov.br',
      cpf: '789.012.456-67',
      rg: '78.901.456-5',
      birthdate: new Date('1995-12-03'),
      phone: '(11) 98765-4337',
      gender: 'F' as const,
      address: 'Avenida Brigadeiro Luís Antônio, 2000',
      addressNumber: '2000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '01318-000',
      categoria: 'TECNICO_ENFERMAGEM',
      registroProfissional: 'COREN-SP 901234',
      tipoRegistro: 'COREN',
      ufRegistro: 'SP',
      cns: '700700345678901',
      cbo: '322205',
      especialidades: null,
      aceitaAgendamento: false,
      tempoMedioConsulta: 15,
    },
    {
      name: 'Téc. Enf. Diego Ferreira Lima',
      email: 'diego.lima@saude.sp.gov.br',
      cpf: '890.123.567-78',
      rg: '89.012.567-6',
      birthdate: new Date('1996-05-27'),
      phone: '(11) 98765-4338',
      gender: 'M' as const,
      address: 'Rua Martins Fontes, 300',
      addressNumber: '300',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '01050-000',
      categoria: 'TECNICO_ENFERMAGEM',
      registroProfissional: 'COREN-SP 012345',
      tipoRegistro: 'COREN',
      ufRegistro: 'SP',
      cns: '700700456789012',
      cbo: '322205',
      especialidades: null,
      aceitaAgendamento: false,
      tempoMedioConsulta: 15,
    },

    // =====================================================
    // DENTISTAS (3)
    // =====================================================
    {
      name: 'Dra. Fabiana Costa Ribeiro',
      email: 'fabiana.ribeiro@saude.sp.gov.br',
      cpf: '901.234.678-89',
      rg: '90.123.678-7',
      birthdate: new Date('1984-04-08'),
      phone: '(11) 98765-4339',
      gender: 'F' as const,
      address: 'Rua Oscar Freire, 800',
      addressNumber: '800',
      neighborhood: 'Pinheiros',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '05409-000',
      categoria: 'DENTISTA',
      registroProfissional: 'CRO-SP 12345',
      tipoRegistro: 'CRO',
      ufRegistro: 'SP',
      cns: '700800123456789',
      cbo: '223293', // Cirurgião-Dentista
      especialidades: ['Odontologia Geral', 'Endodontia'],
      aceitaAgendamento: true,
      tempoMedioConsulta: 40,
    },
    {
      name: 'Dr. Thiago Almeida Rocha',
      email: 'thiago.rocha@saude.sp.gov.br',
      cpf: '012.345.789-90',
      rg: '01.234.789-8',
      birthdate: new Date('1982-09-14'),
      phone: '(11) 98765-4340',
      gender: 'M' as const,
      address: 'Rua Teodoro Sampaio, 1200',
      addressNumber: '1200',
      neighborhood: 'Pinheiros',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '05405-000',
      categoria: 'DENTISTA',
      registroProfissional: 'CRO-SP 23456',
      tipoRegistro: 'CRO',
      ufRegistro: 'SP',
      cns: '700800234567890',
      cbo: '223293',
      especialidades: ['Odontologia Geral', 'Periodontia'],
      aceitaAgendamento: true,
      tempoMedioConsulta: 40,
    },
    {
      name: 'Dra. Renata Oliveira Campos',
      email: 'renata.campos@saude.sp.gov.br',
      cpf: '123.456.890-01',
      rg: '12.345.890-9',
      birthdate: new Date('1988-01-30'),
      phone: '(11) 98765-4341',
      gender: 'F' as const,
      address: 'Avenida Doutor Arnaldo, 500',
      addressNumber: '500',
      neighborhood: 'Sumaré',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '01246-000',
      categoria: 'DENTISTA',
      registroProfissional: 'CRO-SP 34567',
      tipoRegistro: 'CRO',
      ufRegistro: 'SP',
      cns: '700800345678901',
      cbo: '223293',
      especialidades: ['Odontologia Geral', 'Ortodontia'],
      aceitaAgendamento: true,
      tempoMedioConsulta: 50,
    },

    // =====================================================
    // PSICÓLOGOS (2)
    // =====================================================
    {
      name: 'Psic. Beatriz Mendes Lima',
      email: 'beatriz.lima@saude.sp.gov.br',
      cpf: '234.567.901-12',
      rg: '23.456.901-0',
      birthdate: new Date('1987-06-11'),
      phone: '(11) 98765-4342',
      gender: 'F' as const,
      address: 'Rua Cardoso de Almeida, 600',
      addressNumber: '600',
      neighborhood: 'Perdizes',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '05013-000',
      categoria: 'PSICOLOGO',
      registroProfissional: 'CRP-SP 06/123456',
      tipoRegistro: 'CRP',
      ufRegistro: 'SP',
      cns: '700900123456789',
      cbo: '251510', // Psicólogo Clínico
      especialidades: ['Psicologia Clínica', 'Saúde Mental'],
      aceitaAgendamento: true,
      tempoMedioConsulta: 50,
    },
    {
      name: 'Psic. Gustavo Henrique Dias',
      email: 'gustavo.dias@saude.sp.gov.br',
      cpf: '345.678.012-23',
      rg: '34.567.012-1',
      birthdate: new Date('1985-10-25'),
      phone: '(11) 98765-4343',
      gender: 'M' as const,
      address: 'Rua Monte Alegre, 800',
      addressNumber: '800',
      neighborhood: 'Perdizes',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '05014-000',
      categoria: 'PSICOLOGO',
      registroProfissional: 'CRP-SP 06/234567',
      tipoRegistro: 'CRP',
      ufRegistro: 'SP',
      cns: '700900234567890',
      cbo: '251510',
      especialidades: ['Psicologia Clínica', 'Terapia Cognitivo-Comportamental'],
      aceitaAgendamento: true,
      tempoMedioConsulta: 50,
    },

    // =====================================================
    // AGENTES COMUNITÁRIOS DE SAÚDE (2)
    // =====================================================
    {
      name: 'Josefa Maria da Silva',
      email: 'josefa.silva@saude.sp.gov.br',
      cpf: '456.789.123-34',
      rg: '45.678.123-2',
      birthdate: new Date('1990-02-18'),
      phone: '(11) 98765-4344',
      gender: 'F' as const,
      address: 'Rua do Bosque, 50',
      addressNumber: '50',
      neighborhood: 'Jardim Esperança',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '03000-000',
      categoria: 'ACS',
      registroProfissional: null,
      tipoRegistro: null,
      ufRegistro: null,
      cns: '701000123456789',
      cbo: '515105', // Agente Comunitário de Saúde
      especialidades: null,
      aceitaAgendamento: false,
      tempoMedioConsulta: null,
    },
    {
      name: 'Antonio Carlos Souza',
      email: 'antonio.souza@saude.sp.gov.br',
      cpf: '567.890.234-45',
      rg: '56.789.234-3',
      birthdate: new Date('1988-08-05'),
      phone: '(11) 98765-4345',
      gender: 'M' as const,
      address: 'Avenida das Flores, 200',
      addressNumber: '200',
      neighborhood: 'Parque das Flores',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '06000-000',
      categoria: 'ACS',
      registroProfissional: null,
      tipoRegistro: null,
      ufRegistro: null,
      cns: '701000234567890',
      cbo: '515105',
      especialidades: null,
      aceitaAgendamento: false,
      tempoMedioConsulta: null,
    },
  ];

  const servidoresCriados = [];

  for (const servidor of servidores) {
    // Criar User
    const user = await prisma.user.upsert({
      where: { email: servidor.email },
      update: {},
      create: {
        name: servidor.name,
        email: servidor.email,
        password: senhaHash,
        role: 'USER',
        isActive: true,
      }
    });

    // Criar HealthProfessionalData
    const healthData = await prisma.healthProfessionalData.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        categoria: servidor.categoria,
        registroProfissional: servidor.registroProfissional,
        tipoRegistro: servidor.tipoRegistro,
        ufRegistro: servidor.ufRegistro,
        cns: servidor.cns,
        cbo: servidor.cbo,
        especialidades: servidor.especialidades,
        aceitaAgendamento: servidor.aceitaAgendamento,
        tempoMedioConsulta: servidor.tempoMedioConsulta,
      }
    });

    servidoresCriados.push({ user, healthData });
    console.log(`   ✅ ${servidor.categoria}: ${servidor.name} (${servidor.registroProfissional || 'CNS: ' + servidor.cns})`);
  }

  console.log(`\n✅ SEED 02 CONCLUÍDO: ${servidoresCriados.length} servidores de saúde criados com sucesso!\n`);
  console.log('📊 Resumo:');
  console.log(`   • 8 Médicos`);
  console.log(`   • 6 Enfermeiros`);
  console.log(`   • 4 Técnicos de Enfermagem`);
  console.log(`   • 3 Dentistas`);
  console.log(`   • 2 Psicólogos`);
  console.log(`   • 2 Agentes Comunitários de Saúde`);
  console.log(`\n   🔑 Senha padrão para todos: senha123\n`);

  return servidoresCriados;
}

// Executar se chamado diretamente
if (require.main === module) {
  seed02ServidoresSaude()
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
