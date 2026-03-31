'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  ScanFace,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trophy,
  UserRoundSearch,
} from 'lucide-react';
import { CitizenSelector } from '@/components/admin/CitizenSelector';
import FaceCameraCapture, { type FaceCaptureSessionMetadata } from '@/components/common/FaceCameraCapture';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext';
import type { Citizen } from '@/hooks/useSearchCitizen';
import { useToast } from '@/hooks/use-toast';
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

export default function AdminCitizenFaceBiometryPage() {
  const { apiRequest } = useAdminAuth();
  const { hasPermission } = useAdminPermissions();
  const { toast } = useToast();
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [accessLevel, setAccessLevel] = useState<CitizenAccessLevelSummary | null>(null);
  const [capturedImage, setCapturedImage] = useState('');
  const [captureMetadata, setCaptureMetadata] = useState<FaceCaptureSessionMetadata | null>(null);
  const [sourceLabel, setSourceLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [lastAutoSubmittedSessionId, setLastAutoSubmittedSessionId] = useState<string | null>(null);

  const canVerify = hasPermission('citizens:verify');

  const loadAccessLevel = async (citizenId: string) => {
    try {
      setLoading(true);
      const response = await apiRequest(`/admin/citizens/${citizenId}/access-level`);
      setAccessLevel(response.data?.accessLevel || null);
    } catch (error: any) {
      console.error('Erro ao carregar acesso do cidadão:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar cidadão',
        description: error?.message || 'Não foi possível consultar os critérios do cidadão.',
      });
      setAccessLevel(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCitizen?.id) {
      void loadAccessLevel(selectedCitizen.id);
    } else {
      setAccessLevel(null);
      setCapturedImage('');
      setCaptureMetadata(null);
      setSourceLabel('');
      setLastAutoSubmittedSessionId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCitizen?.id]);

  const handleRegisterBiometry = async () => {
    if (!selectedCitizen?.id || !capturedImage || !captureMetadata) {
      return;
    }

    try {
      setSubmitting('capture');
      const response = await apiRequest(`/admin/citizens/${selectedCitizen.id}/face-biometry`, {
        method: 'POST',
        body: JSON.stringify({
          imageBase64: capturedImage,
          sourceLabel: sourceLabel.trim() || `Biometria ao vivo capturada por servidor para ${selectedCitizen.name}`,
          qualityScore: captureMetadata.qualityScore,
          livenessScore: captureMetadata.livenessScore,
          metadata: captureMetadata,
        }),
      });

      setAccessLevel(response.data?.accessLevel || null);
      setCapturedImage('');
      setCaptureMetadata(null);
      setSourceLabel('');

      toast({
        title: 'Biometria cadastrada',
        description: response.message || 'A biometria facial foi vinculada ao cidadão.',
      });
    } catch (error: any) {
      console.error('Erro ao cadastrar biometria facial:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao cadastrar biometria',
        description: error?.message || 'Não foi possível cadastrar a biometria facial.',
      });
    } finally {
      setSubmitting(null);
    }
  };

  useEffect(() => {
    const sessionId = captureMetadata?.sessionId;
    if (!selectedCitizen?.id || !sessionId || !capturedImage || submitting) {
      return;
    }

    if (lastAutoSubmittedSessionId === sessionId) {
      return;
    }

    setLastAutoSubmittedSessionId(sessionId);
    void handleRegisterBiometry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCitizen?.id, captureMetadata?.sessionId, capturedImage, submitting]);

  const handleApprovePending = async () => {
    if (!selectedCitizen?.id) {
      return;
    }

    try {
      setSubmitting('approve');
      const response = await apiRequest(`/admin/citizens/${selectedCitizen.id}/face-biometry/approve-latest`, {
        method: 'POST',
      });

      setAccessLevel(response.data?.accessLevel || null);

      toast({
        title: 'Biometria confirmada',
        description: response.message || 'A biometria facial pendente foi confirmada.',
      });
    } catch (error: any) {
      console.error('Erro ao confirmar biometria facial:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao confirmar biometria',
        description: error?.message || 'Não foi possível confirmar a biometria facial pendente.',
      });
    } finally {
      setSubmitting(null);
    }
  };

  const handlePromoteToGold = async () => {
    if (!selectedCitizen?.id) {
      return;
    }

    try {
      setSubmitting('promote');
      const response = await apiRequest(`/admin/citizens/${selectedCitizen.id}/promote-gold`, {
        method: 'PUT',
        body: JSON.stringify({}),
      });

      setAccessLevel(response.data?.accessLevel || null);

      toast({
        title: 'Cidadão promovido',
        description: response.message || 'O cidadão foi promovido para o nível Ouro.',
      });
    } catch (error: any) {
      console.error('Erro ao promover cidadão para ouro:', error);
      toast({
        variant: 'destructive',
        title: 'Erro na promoção',
        description: error?.message || 'Não foi possível promover o cidadão para o nível Ouro.',
      });
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Cadastro Biométrico de Cidadãos</h1>
        <p className="text-sm text-slate-600">
          Selecione um cidadão e faça a validação ao vivo pela webcam. O envio ocorre automaticamente ao final da
          sessão, com aprovação imediata quando os scores atingirem o limiar configurado.
        </p>
      </div>

      {!canVerify && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 p-6 text-sm text-amber-800">
            <ShieldAlert className="h-5 w-5" />
            Seu usuário não possui permissão para cadastrar ou confirmar biometria facial de cidadãos.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="h-5 w-5 text-blue-600" />
                Seleção do cidadão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CitizenSelector
                selectedCitizen={selectedCitizen}
                onCitizenSelect={setSelectedCitizen}
                label="Cidadão"
                disabled={!canVerify}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ScanFace className="h-5 w-5 text-blue-600" />
                  Validação ao vivo pela câmera
                </CardTitle>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/cidadaos/biometria-facial/leitura">
                    <UserRoundSearch className="mr-2 h-4 w-4" />
                    Leitura biométrica
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="sourceLabel" className="text-sm font-medium text-slate-900">
                  Rótulo da captura
                </label>
                <Input
                  id="sourceLabel"
                  value={sourceLabel}
                  onChange={(event) => setSourceLabel(event.target.value)}
                  placeholder="Ex.: Balcão de atendimento central"
                  disabled={!selectedCitizen || !canVerify || Boolean(submitting)}
                />
              </div>

              <FaceCameraCapture
                value={capturedImage}
                onChange={setCapturedImage}
                onMetadataChange={setCaptureMetadata}
                disabled={!selectedCitizen || !canVerify || Boolean(submitting)}
              />

              {captureMetadata && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  Sessão concluída com qualidade de {Math.round(captureMetadata.qualityScore * 100)}% e prova de
                  presença de {Math.round(captureMetadata.livenessScore * 100)}%.
                </div>
              )}

              {submitting === 'capture' && (
                <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando a biometria automaticamente para o cidadão selecionado...
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleApprovePending}
                  disabled={
                    !selectedCitizen ||
                    !canVerify ||
                    Boolean(submitting) ||
                    !accessLevel ||
                    accessLevel.goldCriteria.biometric.pendingEnrollments === 0
                  }
                >
                  {submitting === 'approve' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Confirmar biometria pendente
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg">Critérios do nível do cidadão</CardTitle>
                <p className="mt-1 text-sm text-slate-600">
                  O nível Ouro exige perfil completo, documentos válidos e biometria facial confirmada.
                </p>
              </div>

              {accessLevel && (
                <Badge className={levelStyles[accessLevel.currentLevel]}>
                  {getLevelLabel(accessLevel.currentLevel)}
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex min-h-[260px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : !selectedCitizen ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-600">
                Selecione um cidadão para visualizar o status do cadastro e da biometria facial.
              </div>
            ) : accessLevel ? (
              <div className="space-y-6">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2">
                      {accessLevel.currentLevel === 'GOLD' ? (
                        <Trophy className="h-5 w-5 text-yellow-600" />
                      ) : accessLevel.currentLevel === 'SILVER' ? (
                        <ShieldCheck className="h-5 w-5 text-slate-700" />
                      ) : (
                        <Shield className="h-5 w-5 text-amber-700" />
                      )}
                      <p className="text-sm font-semibold text-slate-900">Nível atual</p>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{getLevelLabel(accessLevel.currentLevel)}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">Documentos aprovados</p>
                    <p className="mt-2 text-sm text-slate-700">
                      {accessLevel.goldCriteria.approvedDocsCount} de {accessLevel.goldCriteria.requiredDocCount}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">Biometria facial</p>
                    <p className="mt-2 text-sm text-slate-700">
                      {accessLevel.goldCriteria.biometricConfirmed
                        ? 'Confirmada'
                        : accessLevel.goldCriteria.biometric.pendingEnrollments > 0
                          ? 'Em revisão manual'
                          : 'Ainda não cadastrada'}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h2 className="text-sm font-semibold text-slate-900">Pendências para o nível Ouro</h2>

                  <div className="mt-4 space-y-4 text-sm text-slate-700">
                    <div>
                      <p className="font-medium text-slate-900">Perfil</p>
                      {accessLevel.goldCriteria.profileComplete ? (
                        <p className="mt-1 text-emerald-700">Perfil obrigatório completo.</p>
                      ) : (
                        <p className="mt-1">Faltam: {accessLevel.goldCriteria.missingProfileFields.join(', ')}.</p>
                      )}
                    </div>

                    <div>
                      <p className="font-medium text-slate-900">Documentos</p>
                      {accessLevel.goldCriteria.missingDocumentTypes.length === 0 ? (
                        <p className="mt-1 text-emerald-700">Todos os documentos obrigatórios foram validados.</p>
                      ) : (
                        <p className="mt-1">
                          Faltam: {accessLevel.goldCriteria.missingDocumentTypes.map(getDocumentLabel).join(', ')}.
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="font-medium text-slate-900">Biometria facial</p>
                      <p className="mt-1">
                        {accessLevel.goldCriteria.biometricConfirmed
                          ? 'A biometria facial já foi confirmada e está ativa.'
                          : accessLevel.goldCriteria.biometric.pendingEnrollments > 0
                            ? 'Existe uma sessão enviada que ficou fora do limiar automático e aguarda revisão manual.'
                            : 'Ainda não existe biometria facial válida para o cidadão.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePromoteToGold}
                    disabled={
                      !canVerify ||
                      Boolean(submitting) ||
                      !accessLevel.goldCriteria.eligible ||
                      accessLevel.currentLevel === 'GOLD'
                    }
                  >
                    {submitting === 'promote' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trophy className="mr-2 h-4 w-4" />
                    )}
                    Promover para Ouro
                  </Button>

                  <p className="text-sm text-slate-600">{accessLevel.goldCriteria.reason || 'Sem observações.'}</p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
