'use client';

import { X, ArrowRight, CheckCircle2, Medal, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';
import {
  getNextLevel,
  getRegistrationLevelInfo,
  mapVerificationStatusToLevel,
} from '@/lib/citizen-utils';

interface LevelUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LevelUpgradeModal({ isOpen, onClose }: LevelUpgradeModalProps) {
  const { citizen } = useCitizenAuth();
  const router = useRouter();

  if (!isOpen) {
    return null;
  }

  const currentLevel = mapVerificationStatusToLevel(citizen?.verificationStatus || 'PENDING');
  const nextLevelName = getNextLevel(citizen?.verificationStatus || 'PENDING');
  const currentLevelInfo = getRegistrationLevelInfo(currentLevel);
  const nextLevelInfo = nextLevelName ? getRegistrationLevelInfo(nextLevelName) : null;

  const requirementsByLevel: Record<string, string[]> = {
    SILVER: [
      'Manter o perfil do cidadão completo e atualizado',
      'Aguardar a análise e validação da administração municipal',
    ],
    GOLD: [
      'Perfil completo com dados civis e endereço atualizados',
      'Documentos pessoais obrigatórios aprovados',
      'Biometria facial cadastrada e confirmada por um servidor',
    ],
  };

  const requirements = nextLevelName ? requirementsByLevel[nextLevelName] || [] : [];

  const handleOpenProfile = () => {
    onClose();
    router.push('/cidadao/perfil');
  };

  const handleOpenDocuments = () => {
    onClose();
    router.push('/cidadao/documentos');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              {nextLevelInfo?.name === 'Ouro' ? (
                <Trophy className="h-5 w-5 text-blue-600" />
              ) : (
                <Medal className="h-5 w-5 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Critérios de nível</h2>
              {nextLevelInfo && (
                <p className="flex items-center gap-1 text-sm text-gray-600">
                  <span>{currentLevelInfo.name}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span>{nextLevelInfo.name}</span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {!nextLevelInfo ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
                <Trophy className="h-10 w-10 text-yellow-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Nível máximo alcançado</h3>
              <p className="mt-2 text-gray-600">
                Seu cadastro já está no nível máximo disponível para o cidadão.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-blue-900">
                  Benefícios do nível {nextLevelInfo.name}
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  {nextLevelInfo.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">O que é necessário</h3>
                <ul className="space-y-2">
                  {requirements.map((requirement, index) => (
                    <li key={requirement} className="flex items-start gap-3 text-sm text-gray-700">
                      <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                        <span className="text-xs font-medium text-gray-600">{index + 1}</span>
                      </div>
                      <span>{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {nextLevelName === 'GOLD' && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  A confirmação do nível Ouro agora depende também da biometria facial. Use a página de perfil para cadastrar a imagem do rosto e acompanhe a confirmação administrativa.
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-200 p-6">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Fechar
          </button>
          {nextLevelName === 'SILVER' && (
            <button
              onClick={handleOpenProfile}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Revisar meu perfil
            </button>
          )}
          {nextLevelName === 'GOLD' && (
            <>
              <button
                onClick={handleOpenDocuments}
                className="rounded-md border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50"
              >
                Abrir documentos
              </button>
              <button
                onClick={handleOpenProfile}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Abrir perfil
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
