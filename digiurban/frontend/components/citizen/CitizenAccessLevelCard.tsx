'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  Loader2,
  ScanFace,
  Shield,
  ShieldCheck,
  Trophy,
  UserRoundSearch,
} from 'lucide-react';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';
import FaceCameraCapture, { type FaceCaptureSessionMetadata } from '@/components/common/FaceCameraCapture';
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

export function CitizenAccessLevelCard() {
  const { citizen, apiRequest, refreshCitizenData } = useCitizenAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [capturedImage, setCapturedImage] = useState('');
  const [captureMetadata, setCaptureMetadata] = useState<FaceCaptureSessionMetadata | null>(null);
  const [accessLevel, setAccessLevel] = useState<CitizenAccessLevelSummary | null>(null);
  const [lastAutoSubmittedSessionId, setLastAutoSubmittedSessionId] = useState<string | null>(null);

  const citizenProfileSignature = useMemo(
    () =>
      JSON.stringify({
        id: citizen?.id,
        updatedAt: citizen?.updatedAt,
        verificationStatus: citizen?.verificationStatus,
      }),
    [citizen?.id, citizen?.updatedAt, citizen?.verificationStatus]
  );

  const loadAccessLevel = async () => {
    if (!citizen?.id) {
      return;
    }

    try {
      setLoading(true);
      const response = await apiRequest('/citizen/auth/access-level');
      setAccessLevel(response.data?.accessLevel || null);
    } catch (error) {
      console.error('Erro ao carregar critérios do cidadão:', error);
      setMessage({
        type: 'error',
        text: 'Não foi possível carregar os critérios do seu cadastro agora.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAccessLevel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citizenProfileSignature]);

  const handleSubmitBiometry = async () => {
    if (!capturedImage || !captureMetadata) {
      return;
    }

    try {
      setSubmitting(true);
      setMessage({
        type: 'success',
        text: 'Sessão ao vivo concluída. Enviando e validando a biometria automaticamente...',
      });

      const response = await apiRequest('/citizen/auth/face-biometry', {
        method: 'POST',
        body: JSON.stringify({
          imageBase64: capturedImage,
          sourceLabel: 'Biometria facial por vídeo ao vivo no painel do cidadão',
          qualityScore: captureMetadata.qualityScore,
          livenessScore: captureMetadata.livenessScore,
          metadata: captureMetadata,
        }),
      });

      setAccessLevel(response.data?.accessLevel || null);
      setCapturedImage('');
      setCaptureMetadata(null);
      await refreshCitizenData();

      setMessage({
        type: 'success',
        text: response.message || 'Biometria facial enviada com sucesso.',
      });
    } catch (error: any) {
      console.error('Erro ao enviar biometria facial do cidadão:', error);
      setMessage({
        type: 'error',
        text: error?.message || 'Não foi possível enviar a biometria facial.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const sessionId = captureMetadata?.sessionId;
    if (!sessionId || !capturedImage || submitting) {
      return;
    }

    if (lastAutoSubmittedSessionId === sessionId) {
      return;
    }

    setLastAutoSubmittedSessionId(sessionId);
    void handleSubmitBiometry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captureMetadata?.sessionId, capturedImage, submitting]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex min-h-[180px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  if (!accessLevel) {
    return null;
  }

  const profileCriteria = getCriteriaState(
    accessLevel.goldCriteria.profileComplete,
    'Perfil ainda incompleto',
    'Perfil completo'
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
  const biometricActionTitle = accessLevel.goldCriteria.biometricConfirmed
    ? 'Atualizar biometria facial'
    : 'Cadastrar biometria facial';

  return (
    <Card className="border-blue-100">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ScanFace className="h-5 w-5 text-blue-600" />
              Nível de cadastro e biometria facial
            </CardTitle>
            <p className="mt-1 text-sm text-slate-600">
              O nível Ouro depende de perfil completo, documentos válidos e biometria facial confirmada.
            </p>
          </div>
          <Badge className={levelStyles[accessLevel.currentLevel]}>
            {getLevelLabel(accessLevel.currentLevel)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {message && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              message.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {message.text}
          </div>
        )}

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
              <h3 className="text-sm font-semibold text-slate-900">Resumo do nível Ouro</h3>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {accessLevel.currentLevel === 'GOLD'
                ? 'Seu cadastro já está no nível Ouro. Você pode testar ou atualizar a biometria sempre que precisar.'
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

            <Button asChild type="button" variant="outline" className="mt-5 w-full sm:w-auto">
              <Link href="/cidadao/biometria-facial/leitura">
                <UserRoundSearch className="mr-2 h-4 w-4" />
                Testar leitura da biometria
              </Link>
            </Button>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-gradient-to-b from-sky-50 to-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{biometricActionTitle}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Abra a câmera em tela cheia, enquadre o rosto na moldura oval e aguarde a validação automática.
                </p>
              </div>
              <Badge className="border-sky-200 bg-sky-100 text-sky-700">Envio automático</Badge>
            </div>

            <FaceCameraCapture
              className="mt-4"
              value={capturedImage}
              onChange={setCapturedImage}
              onMetadataChange={setCaptureMetadata}
              disabled={submitting}
              startLabel="Abrir câmera para biometria"
              retryLabel="Refazer biometria"
              cancelLabel="Fechar câmera"
              showDetailedStatus={false}
            />

            {captureMetadata && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Sessão concluída com qualidade de {Math.round(captureMetadata.qualityScore * 100)}% e prova de
                presença de {Math.round(captureMetadata.livenessScore * 100)}%.
              </div>
            )}

            {submitting && (
              <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando e validando a biometria automaticamente...
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CitizenAccessLevelCard;
