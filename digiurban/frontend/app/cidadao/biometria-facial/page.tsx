'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Loader2, ScanFace, ShieldAlert, ShieldCheck, UserRoundSearch } from 'lucide-react';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';
import { CitizenLayout } from '@/components/citizen/CitizenLayout';
import { FaceBiometryEnrollmentPanel } from '@/components/common/FaceBiometryEnrollmentPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { CitizenAccessLevelSummary } from '@/types/citizen-access';

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

export default function CitizenFaceBiometryPage() {
  const { citizen, apiRequest, refreshCitizenData } = useCitizenAuth();
  const [accessLevel, setAccessLevel] = useState<CitizenAccessLevelSummary | null>(null);
  const [loadingAccessLevel, setLoadingAccessLevel] = useState(true);

  useEffect(() => {
    let active = true;

    const loadAccessLevel = async () => {
      try {
        setLoadingAccessLevel(true);
        const response = await apiRequest('/citizen/auth/access-level');
        if (active) {
          setAccessLevel(response.data?.accessLevel || null);
        }
      } catch (error) {
        console.error('Erro ao carregar biometria do cidadão:', error);
        if (active) {
          setAccessLevel(null);
        }
      } finally {
        if (active) {
          setLoadingAccessLevel(false);
        }
      }
    };

    void loadAccessLevel();

    return () => {
      active = false;
    };
  }, [apiRequest, citizen?.id, citizen?.updatedAt, citizen?.verificationStatus]);

  const biometricLocked = hasRegisteredBiometry(accessLevel);
  const biometricStatusText = accessLevel?.goldCriteria.biometricConfirmed
    ? 'Sua biometria facial já foi cadastrada e confirmada.'
    : accessLevel?.goldCriteria.biometric.pendingEnrollments
      ? 'Sua biometria facial já foi enviada e está em análise.'
      : accessLevel?.goldCriteria.biometric.rejectedEnrollments
        ? 'Já existe um cadastro biométrico registrado para sua conta.'
        : 'Sua biometria facial já está registrada nesta conta.';

  return (
    <CitizenLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <Badge className="border-sky-200 bg-sky-100 text-sky-700">Biometria ao vivo</Badge>
            <h1 className="text-2xl font-bold text-slate-900">Cadastro facial do cidadão</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Use a câmera do dispositivo para cadastrar sua biometria facial uma única vez. Depois disso, a conta
              passa a usar essa biometria nas leituras ao vivo do ecossistema.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/cidadao/perfil">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Voltar ao perfil
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/cidadao/biometria-facial/leitura">
                <UserRoundSearch className="mr-2 h-4 w-4" />
                Testar leitura
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
          <Card className="border-sky-100 bg-white/90">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <ScanFace className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Fluxo do cidadão</p>
                  <p className="text-sm text-slate-600">Cadastro ao vivo com face-api.js, envio automático e leitura opcional.</p>
                </div>
              </div>

              <div className="grid gap-3 text-sm leading-6 text-slate-700 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="font-medium text-slate-900">Antes de começar</p>
                  <p className="mt-1">Mantenha apenas o rosto no quadro e fique parado por alguns segundos.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="font-medium text-slate-900">Depois do envio</p>
                  <p className="mt-1">Após o primeiro cadastro, o sistema bloqueia novos envios e libera só a leitura.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {citizen?.name ? `Usuário autenticado: ${citizen.name}.` : 'Cadastro biométrico para cidadão autenticado.'}
              </div>
            </CardContent>
          </Card>

          {loadingAccessLevel ? (
            <Card className="border-sky-100">
              <CardContent className="flex min-h-[280px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
              </CardContent>
            </Card>
          ) : biometricLocked ? (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start gap-3 text-amber-800">
                  <ShieldAlert className="mt-0.5 h-5 w-5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">Biometria já cadastrada</p>
                    <p className="text-sm">{biometricStatusText}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-700">
                  Novos cadastros faciais foram bloqueados para evitar duplicidade entre painel do cidadão e painel
                  administrativo.
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href="/cidadao/biometria-facial/leitura">
                      <UserRoundSearch className="mr-2 h-4 w-4" />
                      Testar leitura
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/cidadao/perfil">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Voltar ao perfil
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <FaceBiometryEnrollmentPanel
              title="Cadastro facial ao vivo"
              description="A câmera do dispositivo usa face-api.js para capturar o rosto em vídeo ao vivo e enviar a biometria automaticamente."
              helperText="Abra a câmera, mantenha apenas uma pessoa no quadro e aguarde o envio automático."
              purposeLabel="Cadastro facial do cidadão"
              startLabel="Abrir câmera"
              retryLabel="Refazer captura"
              cancelLabel="Fechar câmera"
              requireFaceApi
              onEnroll={async ({ imageBase64, metadata, embedding, modelName, modelVersion }) => {
                const response = await apiRequest('/citizen/auth/face-biometry', {
                  method: 'POST',
                  body: JSON.stringify({
                    imageBase64,
                    embedding,
                    modelName,
                    modelVersion,
                    sourceLabel: 'Biometria facial por vídeo ao vivo no painel do cidadão',
                    qualityScore: metadata.qualityScore,
                    livenessScore: metadata.livenessScore,
                    metadata,
                  }),
                });

                await refreshCitizenData();
                setAccessLevel(response.data?.accessLevel || null);
                return response.data;
              }}
            />
          )}
        </div>
      </div>
    </CitizenLayout>
  );
}
