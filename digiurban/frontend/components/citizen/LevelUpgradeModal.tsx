'use client';

import { X, CheckCircle2 } from 'lucide-react';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';
import { mapVerificationStatusToLevel, getNextLevel, getRegistrationLevelInfo } from '@/lib/citizen-utils';

interface LevelUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LevelUpgradeModal({ isOpen, onClose }: LevelUpgradeModalProps) {
  const { citizen } = useCitizenAuth();

  if (!isOpen) return null;

  const currentLevel = mapVerificationStatusToLevel(citizen?.verificationStatus || 'PENDING');
  const nextLevelName = getNextLevel(citizen?.verificationStatus || 'PENDING');
  const currentLevelInfo = getRegistrationLevelInfo(currentLevel);
  const nextLevelInfo = nextLevelName ? getRegistrationLevelInfo(nextLevelName) : null;

  const requirementsByLevel: Record<string, string[]> = {
    BRONZE: [
      'CPF válido',
      'Nome completo',
      'Data de nascimento',
      'Email ou telefone'
    ],
    SILVER: [
      'Documento de identidade (RG ou CNH)',
      'Comprovante de residência atualizado',
      'Título de eleitor',
      'Foto 3x4 recente'
    ],
    GOLD: [
      'Certidão de nascimento ou casamento',
      'Comprovante de renda (3 últimos meses)',
      'Declaração de composição familiar',
      'Certificado de quitação eleitoral',
      'Comprovante de escolaridade'
    ]
  };

  const requirements = nextLevelName ? requirementsByLevel[nextLevelName] || [] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-xl">{nextLevelInfo?.icon || '🎖️'}</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Solicitar Aumento de Nível
              </h2>
              {nextLevelInfo && (
                <p className="text-sm text-gray-600">
                  {currentLevelInfo.name} → {nextLevelInfo.name}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!nextLevelInfo ? (
            <div className="text-center py-8">
              <span className="text-6xl">🏆</span>
              <h3 className="text-lg font-semibold text-gray-900 mt-4">
                Parabéns!
              </h3>
              <p className="text-gray-600 mt-2">
                Você já possui o nível máximo de cadastro.
              </p>
            </div>
          ) : (
            <>
              {/* Benefícios */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Benefícios do Nível {nextLevelInfo.name}
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  {nextLevelInfo.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Requisitos */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Documentos Necessários
                </h3>
                <ul className="space-y-2">
                  {requirements.map((req: string, index: number) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-sm text-gray-700"
                    >
                      <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-gray-600">
                          {index + 1}
                        </span>
                      </div>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Aviso */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Atenção:</strong> Esta funcionalidade está em desenvolvimento.
                  Em breve você poderá enviar os documentos e solicitar o aumento de nível
                  diretamente pelo portal.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Fechar
          </button>
          {nextLevelInfo && (
            <button
              onClick={() => {
                alert('Funcionalidade em desenvolvimento. Em breve você poderá solicitar o aumento de nível!');
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Solicitar Agora
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
