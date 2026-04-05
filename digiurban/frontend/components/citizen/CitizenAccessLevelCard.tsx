'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, Loader2, ScanFace, Shield, ShieldCheck, Trophy, UserRoundSearch } from 'lucide-react';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CitizenAccessLevelSummary, RegistrationLevel } from '@/types/citizen-access';

const levelStyles: Record<RegistrationLevel, string> = {
  BRONZE: 'border-amber-200 bg-amber-50 text-amber-800',
  SILVER: 'border-slate-300 bg-slate-100 text-slate-800',
  GOLD: 'border-yellow-200 bg-yellow-50 text-yellow-800',
};

function getLevelLabel(level: RegistrationLevel) {
  if (level === 'BRONZE') return 'Bronze';
  if (level === 'SILVER') return 'Prata';
  return 'Ouro';
}

function getDocumentLabel(type: string) {
  const labels: Record<string, string> = {
    rg_frente: 'RG (frente)',
    rg_verso: 'RG (verso)',
    cpf: 'CPF',
    comprovante_residencia: 'Comprovante de residência',
  };

  return labels[type] || type;
}

function getCriteriaState(completed: boolean, pendingLabel: string, completedLabel: string) {
  return completed
    ? {
        label: completedLabel,
        icon: CheckCircle2,
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      }
    : {
        label: pendingLabel,
        icon: Clock3,
        className: 'border-amber-200 bg-amber-50 text-amber-700',
      };
}

function hasRegisteredBiometry(accessLevel: CitizenAccessLevelSummary | null) {
  const biometric = accessLevel?.goldCriteria.biometric;

  return Boolean(
    biometric &&
      (biometric.approvedEnrollments > 0 ||
        biometric.pendingEnrollments > 0 ||
        biometric.rejectedEnrollments > 0 ||
        biometric.totalEmbeddings > 0)
  );
}

export function CitizenAccessLevelCard() {
  const { citizen, apiRequest } = useCitizenAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessLevel, setAccessLevel] = useState<CitizenAccessLevelSummary | null>(null);

  const loadAccessLevel = async () => {
    if (!citizen?.id) {
      setAccessLevel(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiRequest('/citizen/auth/access-level');
      setAccessLevel(response.data?.accessLevel || null);
    } catch (loadError) {
      console.error('Erro ao carregar critérios do cidadão:', loadError);
      setError('Não foi possível carregar os critérios do seu cadastro agora.');
      setAccessLevel(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAccessLevel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citizen?.id, citizen?.updatedAt, citizen?.verificationStatus]);

  if (loading) {
    return (
      <Card className="border-blue-100">
        <CardContent className="flex min-h-[220px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  if (!accessLevel) {
    return (
      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ScanFace className="h-5 w-5 text-blue-600" />
            Biometria facial
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {error || 'Ainda não foi possível carregar o resumo da sua biometria facial.'}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/cidadao/biometria-facial">
                <ScanFace className="mr-2 h-4 w-4" />
                Abrir cadastro facial
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/cidadao/biometria-facial/leitura">
                <UserRoundSearch className="mr-2 h-4 w-4" />
                Testar leitura
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const profileCriteria = getCriteriaState(
    accessLevel.goldCriteria.profileComplete,
    'Perfil obrigatório pendente',
    'Perfil obrigatório completo'
  );
  const documentsCriteria = getCriteriaState(
    accessLevel.goldCriteria.missingDocumentTypes.length === 0 &&
      accessLevel.goldCriteria.approvedDocsCount >= accessLevel.goldCriteria.requiredDocCount,
    'Documentos obrigatórios pendentes',
    'Documentos obrigatórios confirmados'
  );
  const biometricCriteria = getCriteriaState(
    accessLevel.goldCriteria.biometricConfirmed,
    accessLevel.goldCriteria.biometric.pendingEnrollments > 0
      ? 'Biometria em revisão manual'
      : 'Biometria facial ainda não confirmada',
    'Biometria facial confirmada'
  );

  const criteriaCards = [profileCriteria, documentsCriteria, biometricCriteria];
  const profileSummary = accessLevel.goldCriteria.profileComplete
    ? 'Dados obrigatórios completos.'
    : `Pendências: ${accessLevel.goldCriteria.missingProfileFields.join(', ')}.`;
  const documentsSummary =
    accessLevel.goldCriteria.missingDocumentTypes.length > 0
      ? `Faltam: ${accessLevel.goldCriteria.missingDocumentTypes.map(getDocumentLabel).join(', ')}.`
      : `${accessLevel.goldCriteria.approvedDocsCount} de ${accessLevel.goldCriteria.requiredDocCount} documentos aprovados.`;
  const biometricSummary = accessLevel.goldCriteria.biometricConfirmed
    ? 'Biometria confirmada e pronta para uso no ecossistema.'
    : accessLevel.goldCriteria.biometric.pendingEnrollments > 0
      ? 'Sua última sessão foi enviada e está em revisão manual.'
      : 'Você ainda não possui biometria facial confirmada.';
  const biometricLocked = hasRegisteredBiometry(accessLevel);

  return (
    <Card className="border-blue-100">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ScanFace className="h-5 w-5 text-blue-600" />
              Biometria facial e nível Ouro
            </CardTitle>
            <p className="mt-1 text-sm text-slate-600">
              O nível Ouro depende de perfil completo, documentos válidos e biometria facial confirmada.
            </p>
          </div>
          <Badge className={levelStyles[accessLevel.currentLevel]}>{getLevelLabel(accessLevel.currentLevel)}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-3">
          {criteriaCards.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.label} className={`rounded-2xl border px-4 py-4 ${item.className}`}>
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <p className="text-sm font-medium">{item.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              {accessLevel.currentLevel === 'GOLD' ? (
                <Trophy className="h-5 w-5 text-yellow-600" />
              ) : accessLevel.currentLevel === 'SILVER' ? (
                <ShieldCheck className="h-5 w-5 text-slate-700" />
              ) : (
                <Shield className="h-5 w-5 text-amber-700" />
              )}
              <h3 className="text-sm font-semibold text-slate-900">Resumo do cadastro</h3>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {accessLevel.currentLevel === 'GOLD'
                ? 'Seu cadastro já está no nível Ouro. Você pode testar a leitura da biometria já cadastrada quando precisar.'
                : 'Para chegar ao nível Ouro, finalize os itens abaixo e conclua a biometria facial ao vivo.'}
            </p>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-medium text-slate-900">Perfil</p>
                <p className="mt-1 text-sm text-slate-600">{profileSummary}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-medium text-slate-900">Documentos</p>
                <p className="mt-1 text-sm text-slate-600">{documentsSummary}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-medium text-slate-900">Biometria facial</p>
                <p className="mt-1 text-sm text-slate-600">{biometricSummary}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-gradient-to-b from-sky-50 to-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Cadastro biométrico ao vivo</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Abra a câmera em tela cheia, enquadre o rosto na moldura oval e aguarde o envio automático.
                </p>
              </div>
              <Badge className="border-sky-200 bg-sky-100 text-sky-700">Fluxo dedicado</Badge>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {!biometricLocked && (
                <Button asChild>
                  <Link href="/cidadao/biometria-facial">
                    <ScanFace className="mr-2 h-4 w-4" />
                    Cadastrar biometria facial
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link href="/cidadao/biometria-facial/leitura">
                  <UserRoundSearch className="mr-2 h-4 w-4" />
                  Testar leitura da biometria
                </Link>
              </Button>
            </div>

            {biometricLocked && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                A biometria facial já foi cadastrada e novos envios foram bloqueados para evitar duplicidade.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CitizenAccessLevelCard;
