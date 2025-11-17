import { SecretariaConfig } from '../../schemas/secretaria.schema';

/**
 * Configuração da Secretaria de Saúde
 *
 * 11 módulos totais:
 * - 10 módulos com dados (COM_DADOS)
 * - 1 módulo de serviços gerais (SEM_DADOS)
 */
export const saudeConfig: SecretariaConfig = {
  id: 'saude',
  name: 'Secretaria de Saúde',
  slug: 'saude',
  departmentId: 'saude',

  modules: [
    // Módulos COM_DADOS (têm formSchema configurável no ServiceSimplified)
    { id: 'agendamentos', moduleType: 'AGENDAMENTOS_MEDICOS' },
    { id: 'exames', moduleType: 'EXAMES' },
    { id: 'vacinacao', moduleType: 'VACINACAO' },
    { id: 'medicamentos', moduleType: 'CONTROLE_MEDICAMENTOS' },
    { id: 'transporte', moduleType: 'TRANSPORTE_PACIENTES' },
    { id: 'campanhas', moduleType: 'CAMPANHAS_SAUDE' },
    { id: 'programas', moduleType: 'PROGRAMAS_SAUDE' },
    { id: 'encaminhamentos', moduleType: 'ENCAMINHAMENTOS_TFD' },
    { id: 'cadastro-paciente', moduleType: 'CADASTRO_PACIENTE' },
    { id: 'gestao-acs', moduleType: 'GESTAO_ACS' },

    // Módulo de serviços gerais (SEM_DADOS - apenas workflow + documentos)
    { id: 'servicos', moduleType: 'ATENDIMENTOS_SAUDE' }
  ]
};
