/**
 * Utilitários para gerenciamento de cidadãos
 */

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'GOLD' | 'REJECTED';
export type RegistrationLevel = 'BRONZE' | 'SILVER' | 'GOLD';

/**
 * Mapeia o status de verificação do backend para o nível de cadastro visual
 *
 * @param verificationStatus - Status de verificação do cidadão
 * @returns Nível de cadastro correspondente
 */
export function mapVerificationStatusToLevel(
  verificationStatus: VerificationStatus
): RegistrationLevel {
  const mapping: Record<VerificationStatus, RegistrationLevel> = {
    PENDING: 'BRONZE',  // Cadastro pendente de verificação
    VERIFIED: 'SILVER', // Cadastro verificado pelo admin
    GOLD: 'GOLD',       // Cadastro completo com documentação adicional
    REJECTED: 'BRONZE'  // Rejeitado volta para bronze
  };

  return mapping[verificationStatus] || 'BRONZE';
}

/**
 * Retorna informações sobre o nível de cadastro
 */
export function getRegistrationLevelInfo(level: RegistrationLevel) {
  const info = {
    BRONZE: {
      name: 'Bronze',
      description: 'Cadastro básico - Pendente de verificação',
      color: 'amber',
      icon: '🥉',
      benefits: [
        'Acesso aos serviços básicos',
        'Criar protocolos simples',
        'Acompanhar solicitações'
      ]
    },
    SILVER: {
      name: 'Prata',
      description: 'Cadastro verificado - Documentação validada',
      color: 'gray',
      icon: '🥈',
      benefits: [
        'Todos os benefícios do Bronze',
        'Acesso prioritário aos serviços',
        'Participação em programas sociais',
        'Maior credibilidade em solicitações'
      ]
    },
    GOLD: {
      name: 'Ouro',
      description: 'Cadastro completo - Documentação adicional validada',
      color: 'yellow',
      icon: '🥇',
      benefits: [
        'Todos os benefícios do Prata',
        'Máxima prioridade no atendimento',
        'Acesso a todos os programas municipais',
        'Agilidade em processos administrativos',
        'Isenção de taxas em alguns serviços'
      ]
    }
  };

  return info[level];
}

/**
 * Verifica se o cidadão pode ser promovido para o próximo nível
 */
export function canPromoteToNextLevel(currentStatus: VerificationStatus): boolean {
  return currentStatus === 'PENDING' || currentStatus === 'VERIFIED';
}

/**
 * Retorna o próximo nível disponível
 */
export function getNextLevel(currentStatus: VerificationStatus): RegistrationLevel | null {
  const nextLevel: Record<VerificationStatus, RegistrationLevel | null> = {
    PENDING: 'SILVER',
    VERIFIED: 'GOLD',
    GOLD: null,
    REJECTED: 'SILVER'
  };

  return nextLevel[currentStatus];
}
