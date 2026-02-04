/**
 * FAMILY CONSTANTS: Constantes para validação e mensagens de composição familiar
 */

export const FAMILY_VALIDATION_RULES = {
  // Regras de idade para relacionamentos
  MIN_AGE_PARENT: 15, // Idade mínima para ser pai/mãe
  MIN_AGE_SPOUSE: 16, // Idade mínima para cônjuge
  MIN_AGE_GRANDPARENT: 35, // Idade mínima para ser avô/avó
  MIN_AGE_DIFFERENCE_PARENT_CHILD: 15, // Diferença mínima entre pai/mãe e filho/filha
  MAX_AGE_DIFFERENCE_SIBLINGS: 30, // Diferença máxima entre irmãos (aviso)
  MIN_AGE_DIFFERENCE_GRANDPARENT: 35, // Diferença mínima entre avô/avó e neto/neta

  // Faixas etárias
  CHILD_MAX_AGE: 18, // Idade máxima para ser considerado criança
  ELDERLY_MIN_AGE: 60, // Idade mínima para ser considerado idoso

  // Limites do sistema
  MAX_FAMILY_MEMBERS: 50,
  INVITE_EXPIRATION_DAYS: 30,
  MAX_PENDING_INVITES: 10,
};

export const FAMILY_MESSAGES = {
  // Mensagens de sucesso
  SUCCESS_MEMBER_ADDED: 'Membro adicionado à composição familiar com sucesso',
  SUCCESS_MEMBER_UPDATED: 'Membro da família atualizado com sucesso',
  SUCCESS_MEMBER_REMOVED: 'Membro removido da composição familiar',
  SUCCESS_INVITE_SENT: 'Convite enviado com sucesso',
  SUCCESS_INVITE_ACCEPTED: 'Convite aceito com sucesso',
  SUCCESS_INVITE_REJECTED: 'Convite rejeitado',
  SUCCESS: 'Operação realizada com sucesso',

  // Mensagens de erro
  ERROR_CITIZEN_NOT_FOUND: 'Cidadão não encontrado',
  ERROR_MEMBER_NOT_FOUND: 'Membro não encontrado',
  ERROR_INVALID_RELATIONSHIP: 'Relacionamento inválido',
  ERROR_DUPLICATE_MEMBER: 'Este cidadão já está na composição familiar',
  ERROR_SELF_REFERENCE: 'Não é possível adicionar a si mesmo como membro',
  ERROR_MAX_MEMBERS_REACHED: 'Número máximo de membros atingido',
  ERROR_INVITE_EXPIRED: 'Convite expirado',
  ERROR_INVITE_NOT_FOUND: 'Convite não encontrado',
  ERROR_INVALID_TOKEN: 'Token de convite inválido',
  ERROR_CITIZEN_NOT_REGISTERED: 'Cidadão não cadastrado no sistema',
  ERROR_CANNOT_ADD_SELF: 'Não é possível adicionar a si mesmo',
  ERROR_MEMBER_ALREADY_EXISTS: 'Membro já existe na composição familiar',
  ERROR_INVITE_ACCEPTED: 'Convite já foi aceito',
  ERROR_INVITE_REJECTED: 'Convite já foi rejeitado',
  ERROR: 'Erro ao processar a operação',

  // Mensagens de aviso
  WARNING_AGE_MISMATCH: 'A idade não condiz com o relacionamento declarado',
  WARNING_YOUNG_PARENT: 'Idade muito jovem para ser pai/mãe',
  WARNING_AGE_DIFFERENCE_SIBLINGS: 'Diferença de idade significativa entre irmãos',
  WARNING_RELATIONSHIP_SUGGESTION: 'Sugestão: o relacionamento poderia ser {suggestion} baseado na idade',
};

export const RELATIONSHIP_LABELS: Record<string, string> = {
  SPOUSE: 'Cônjuge',
  SON: 'Filho',
  DAUGHTER: 'Filha',
  FATHER: 'Pai',
  MOTHER: 'Mãe',
  BROTHER: 'Irmão',
  SISTER: 'Irmã',
  GRANDFATHER: 'Avô',
  GRANDMOTHER: 'Avó',
  GRANDSON: 'Neto',
  GRANDDAUGHTER: 'Neta',
  OTHER: 'Outro',
};

// Mapa de relacionamentos reversos
export const REVERSE_RELATIONSHIPS: Record<string, string> = {
  SPOUSE: 'SPOUSE',
  SON: 'FATHER',
  DAUGHTER: 'FATHER',
  FATHER: 'SON',
  MOTHER: 'SON',
  BROTHER: 'BROTHER',
  SISTER: 'SISTER',
  GRANDFATHER: 'GRANDSON',
  GRANDMOTHER: 'GRANDSON',
  GRANDSON: 'GRANDFATHER',
  GRANDDAUGHTER: 'GRANDFATHER',
  OTHER: 'OTHER',
};
