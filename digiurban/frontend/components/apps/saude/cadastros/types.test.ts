/**
 * ARQUIVO DE TESTE DE TIPOS - Não executável, apenas validação TypeScript
 *
 * Este arquivo existe para garantir que as interfaces dos selectors
 * estão corretamente definidas e compatíveis entre si.
 *
 * Para verificar: Execute `tsc --noEmit` no terminal
 */

import type {
  UnidadeSaude,
  ProfissionalSaude,
  Especialidade,
  Sala,
  Turno,
} from './index';

// Teste 1: Validar estrutura de UnidadeSaude
const testeUnidade: UnidadeSaude = {
  id: '1',
  nome: 'UBS Central',
  cnes: '1234567',
  tipo: 'UBS',
  endereco: 'Rua Teste, 123',
  bairro: 'Centro',
  cidade: 'São Paulo',
  telefone: '(11) 1234-5678',
};

// Teste 2: Validar estrutura de ProfissionalSaude
const testeProfissional: ProfissionalSaude = {
  id: '1',
  nome: 'Dr. João Silva',
  cpf: '12345678900',
  categoria: 'MEDICO',
  registroProfissional: 'CRM 123456',
  especialidades: ['Clínica Geral', 'Cardiologia'],
  status: 'ATIVO',
  telefone: '(11) 98765-4321',
  email: 'joao@exemplo.com',
};

// Teste 3: Validar estrutura de Especialidade
const testeEspecialidade: Especialidade = {
  id: '1',
  nome: 'Cardiologia',
  area: 'CLINICA_MEDICA',
  tempoMedioConsulta: 30,
  descricao: 'Especialidade médica focada em doenças do coração',
};

// Teste 4: Validar estrutura de Sala
const testeSala: Sala = {
  id: '1',
  nome: 'Consultório 1',
  numero: '101',
  tipo: 'CONSULTORIO',
  andar: '1º Andar',
  capacidade: 3,
  equipamentos: ['Estetoscópio', 'Esfigmomanômetro', 'Termômetro'],
  status: 'DISPONIVEL',
  unidadeNome: 'UBS Central',
};

// Teste 5: Validar estrutura de Turno
const testeTurno: Turno = {
  id: '1',
  nome: 'Manhã',
  horaInicio: '07:00:00',
  horaFim: '13:00:00',
  cor: 'blue',
  descricao: 'Turno matutino',
  ativo: true,
};

// Teste 6: Validar campos opcionais
const unidadeMinima: UnidadeSaude = {
  id: '2',
  nome: 'UPA Norte',
  tipo: 'UPA',
};

const profissionalMinimo: ProfissionalSaude = {
  id: '2',
  nome: 'Enf. Maria Santos',
  categoria: 'ENFERMEIRO',
  status: 'ATIVO',
};

const especialidadeMinima: Especialidade = {
  id: '2',
  nome: 'Pediatria',
};

const salaMinima: Sala = {
  id: '2',
  nome: 'Sala de Emergência',
  tipo: 'EMERGENCIA',
};

const turnoMinimo: Turno = {
  id: '2',
  nome: 'Tarde',
  horaInicio: '13:00:00',
  horaFim: '19:00:00',
};

// Teste 7: Validar arrays de especialidades (seleção múltipla)
const especialidadesArray: Especialidade[] = [
  testeEspecialidade,
  especialidadeMinima,
];

// Teste 8: Validar tipos de retorno dos selectors
type UnidadeSelectorReturn = UnidadeSaude | null;
type ProfissionalSelectorReturn = ProfissionalSaude | null;
type EspecialidadeSelectorReturn = Especialidade | Especialidade[] | null;
type SalaSelectorReturn = Sala | null;
type TurnoSelectorReturn = Turno | null;

const retornoUnidade: UnidadeSelectorReturn = testeUnidade;
const retornoProfissional: ProfissionalSelectorReturn = testeProfissional;
const retornoEspecialidadeUnica: EspecialidadeSelectorReturn = testeEspecialidade;
const retornoEspecialidadeMultipla: EspecialidadeSelectorReturn = especialidadesArray;
const retornoSala: SalaSelectorReturn = testeSala;
const retornoTurno: TurnoSelectorReturn = testeTurno;

// Teste 9: Validar null como retorno válido
const retornoNulo1: UnidadeSelectorReturn = null;
const retornoNulo2: ProfissionalSelectorReturn = null;
const retornoNulo3: EspecialidadeSelectorReturn = null;
const retornoNulo4: SalaSelectorReturn = null;
const retornoNulo5: TurnoSelectorReturn = null;

// Teste 10: Validar enums de tipos
const tiposUnidade = ['UBS', 'UPA', 'HOSPITAL', 'CLINICA', 'PRONTO_SOCORRO', 'CAPS', 'LABORATORIO'];
const categoriasProfissional = [
  'MEDICO',
  'ENFERMEIRO',
  'TECNICO_ENFERMAGEM',
  'DENTISTA',
  'PSICOLOGO',
  'FISIOTERAPEUTA',
  'NUTRICIONISTA',
  'FARMACEUTICO',
  'ASSISTENTE_SOCIAL',
  'AGENTE_SAUDE',
];
const statusProfissional = ['ATIVO', 'FERIAS', 'AFASTADO', 'LICENCA', 'INATIVO'];
const tiposSala = [
  'CONSULTORIO',
  'CIRURGICA',
  'EMERGENCIA',
  'EXAME',
  'INTERNACAO',
  'PROCEDIMENTO',
  'OBSERVACAO',
  'ENFERMAGEM',
  'ODONTOLOGIA',
  'VACINA',
];
const statusSala = ['DISPONIVEL', 'EM_USO', 'MANUTENCAO', 'DESATIVADA'];

// Teste 11: Type guards para verificação de tipo em runtime
function isEspecialidadeArray(value: EspecialidadeSelectorReturn): value is Especialidade[] {
  return Array.isArray(value);
}

function isEspecialidadeSingle(value: EspecialidadeSelectorReturn): value is Especialidade {
  return value !== null && !Array.isArray(value);
}

// Exemplo de uso dos type guards
const handleEspecialidadeSelect = (value: EspecialidadeSelectorReturn) => {
  if (isEspecialidadeArray(value)) {
    // value é Especialidade[]
    console.log(`Selecionadas ${value.length} especialidades`);
  } else if (isEspecialidadeSingle(value)) {
    // value é Especialidade
    console.log(`Selecionada especialidade: ${value.nome}`);
  } else {
    // value é null
    console.log('Nenhuma especialidade selecionada');
  }
};

// Teste 12: Validar compatibilidade com formulários
interface FormularioAgendamento {
  unidade: UnidadeSaude;
  profissional: ProfissionalSaude;
  especialidade: Especialidade;
  sala: Sala;
  turno: Turno;
  data: string;
  hora: string;
}

const formularioCompleto: FormularioAgendamento = {
  unidade: testeUnidade,
  profissional: testeProfissional,
  especialidade: testeEspecialidade,
  sala: testeSala,
  turno: testeTurno,
  data: '2024-01-15',
  hora: '10:00',
};

// Teste 13: Validar compatibilidade com estado do React
type UseStateUnidade = [
  UnidadeSaude | null,
  (value: UnidadeSaude | null) => void
];

type UseStateProfissional = [
  ProfissionalSaude | null,
  (value: ProfissionalSaude | null) => void
];

type UseStateEspecialidade = [
  Especialidade | Especialidade[] | null,
  (value: Especialidade | Especialidade[] | null) => void
];

type UseStateSala = [
  Sala | null,
  (value: Sala | null) => void
];

type UseStateTurno = [
  Turno | null,
  (value: Turno | null) => void
];

// Se este arquivo compilar sem erros, todas as interfaces estão corretas!
export type {
  UnidadeSelectorReturn,
  ProfissionalSelectorReturn,
  EspecialidadeSelectorReturn,
  SalaSelectorReturn,
  TurnoSelectorReturn,
};
