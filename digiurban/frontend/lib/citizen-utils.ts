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
      description: 'Cadastro feito, ainda não conferido pela prefeitura',
      color: 'amber',
      benefits: [
        'Pedir os serviços abertos a todos os cidadãos',
        'Acompanhar os seus pedidos',
        'Completar o perfil e enviar documentos',
      ],
    },
    SILVER: {
      name: 'Prata',
      description: 'Cadastro conferido pela prefeitura',
      color: 'gray',
      benefits: [
        'Todos os benefícios do Bronze',
        'Pedir os serviços que exigem cadastro conferido',
        'Pode seguir para o nível Ouro',
      ],
    },
    GOLD: {
      name: 'Ouro',
      description: 'Cadastro com documentos válidos e biometria facial confirmada',
      color: 'yellow',
      benefits: [
        'Todos os benefícios do Prata',
        'Pedir os serviços que exigem identidade confirmada',
        'Confirmar que é você pelo rosto, sem ir à prefeitura',
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
