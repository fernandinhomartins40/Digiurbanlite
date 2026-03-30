/**
 * Utilitários de cadastro do cidadão.
 */

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'GOLD' | 'REJECTED';
export type RegistrationLevel = 'BRONZE' | 'SILVER' | 'GOLD';

export function mapVerificationStatusToLevel(
  verificationStatus: VerificationStatus
): RegistrationLevel {
  const mapping: Record<VerificationStatus, RegistrationLevel> = {
    PENDING: 'BRONZE',
    VERIFIED: 'SILVER',
    GOLD: 'GOLD',
    REJECTED: 'BRONZE',
  };

  return mapping[verificationStatus] || 'BRONZE';
}

export function getRegistrationLevelInfo(level: RegistrationLevel) {
  const info = {
    BRONZE: {
      name: 'Bronze',
      description: 'Cadastro básico em análise administrativa',
      color: 'amber',
      benefits: [
        'Acesso inicial ao portal do cidadão',
        'Acompanhamento de protocolos e solicitações',
        'Atualização do perfil e envio de documentos',
      ],
    },
    SILVER: {
      name: 'Prata',
      description: 'Cadastro validado pela administração municipal',
      color: 'gray',
      benefits: [
        'Todos os benefícios do Bronze',
        'Maior confiança cadastral para serviços municipais',
        'Elegibilidade para concluir os critérios do nível Ouro',
      ],
    },
    GOLD: {
      name: 'Ouro',
      description: 'Cadastro com documentos válidos e biometria facial confirmada',
      color: 'yellow',
      benefits: [
        'Todos os benefícios do Prata',
        'Identidade reforçada para o ecossistema Digiurban',
        'Pronto para módulos que exigem biometria facial',
      ],
    },
  };

  return info[level];
}

export function canPromoteToNextLevel(currentStatus: VerificationStatus): boolean {
  return currentStatus === 'PENDING' || currentStatus === 'VERIFIED' || currentStatus === 'REJECTED';
}

export function getNextLevel(currentStatus: VerificationStatus): RegistrationLevel | null {
  const nextLevel: Record<VerificationStatus, RegistrationLevel | null> = {
    PENDING: 'SILVER',
    VERIFIED: 'GOLD',
    GOLD: null,
    REJECTED: 'SILVER',
  };

  return nextLevel[currentStatus];
}
