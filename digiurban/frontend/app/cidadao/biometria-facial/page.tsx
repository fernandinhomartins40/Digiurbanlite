'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Loader2, ScanFace, ShieldAlert, ShieldCheck, Trash2, UserRoundSearch } from 'lucide-react';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';
import { CitizenLayout } from '@/components/citizen/CitizenLayout';
import { FaceBiometryEnrollmentPanel } from '@/components/common/FaceBiometryEnrollmentPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { CitizenAccessLevelSummary } from '@/types/citizen-access';
import { FACE_PURPOSE_LABEL as PURPOSE_LABEL, FACE_TERMS_BODY } from '@/components/common/face-terms';

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
  const [consents, setConsents] = useState<any[]>([]);
  const [needsReenrollment, setNeedsReenrollment] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    const loadAccessLevel = async () => {
      try {
        setLoadingAccessLevel(true);
        const [response, biometry] = await Promise.all([
          apiRequest('/citizen/auth/access-level'),
          apiRequest('/citizen/auth/face-biometry').catch(() => null),
        ]);
        if (active) {
          setAccessLevel(response.data?.accessLevel || null);
          setConsents(biometry?.data?.consents || []);
          setNeedsReenrollment(Boolean(biometry?.data?.identity?.needsReenrollment));
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
  }, [apiRequest, citizen?.id, citizen?.updatedAt, citizen?.verificationStatus, reloadKey]);

  const deleteMyBiometry = async () => {
    try {
      setDeleting(true);
      const response = await apiRequest('/citizen/auth/face-biometry', { method: 'DELETE' });
      setNotice({ tone: 'success', text: response.message || 'Sua biometria foi apagada.' });
      setConfirmDelete(false);
      await refreshCitizenData();
      setReloadKey((value) => value + 1);
    } catch (error: any) {
      setNotice({ tone: 'error', text: error?.message || 'Não foi possível apagar agora. Tente de novo.' });
    } finally {
      setDeleting(false);
    }
  };

  const activeConsents = consents.filter((item) => !item.revokedAt);
  const biometricLocked = hasRegisteredBiometry(accessLevel) && !needsReenrollment;
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
              Use a câmera do dispositivo para cadastrar sua biometria facial. A conferência é feita no servidor da
              prefeitura e você pode apagar sua biometria quando quiser.
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
                  <p className="text-sm text-slate-600">Cadastro ao vivo com prova de vida, conferido no servidor.</p>
                </div>
              </div>

              <div className="grid gap-3 text-sm leading-6 text-slate-700 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="font-medium text-slate-900">Antes de começar</p>
                  <p className="mt-1">Procure um lugar iluminado. Você vai olhar de frente, virar o rosto para um lado e voltar.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="font-medium text-slate-900">Depois do envio</p>
                  <p className="mt-1">Depois do cadastro, use "Testar leitura" para conferir. Para refazer, apague e cadastre de novo.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p className="font-medium text-slate-900">Meus consentimentos</p>
                {activeConsents.length === 0 ? (
                  <p className="mt-1">Nenhum consentimento ativo.</p>
                ) : (
                  <ul className="mt-1 space-y-1">
                    {activeConsents.map((item) => (
                      <li key={item.id}>
                        {PURPOSE_LABEL[item.purpose] || item.purpose} — desde{' '}
                        {new Date(item.grantedAt).toLocaleDateString('pt-BR')}
                        {item.relationship !== 'TITULAR' && item.grantedByName ? ` (autorizado por ${item.grantedByName})` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {(hasRegisteredBiometry(accessLevel) || activeConsents.length > 0) && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {confirmDelete ? (
                    <div className="space-y-3">
                      <p>
                        Tem certeza? Sua biometria, as fotos e os consentimentos serão apagados. Se você tem nível Ouro,
                        ele volta para Prata até um novo cadastro.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="destructive" onClick={deleteMyBiometry} disabled={deleting}>
                          {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                          Sim, apagar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setConfirmDelete(true)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Apagar minha biometria
                    </Button>
                  )}
                </div>
              )}

              {notice && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    notice.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'
                  }`}
                >
                  {notice.text}
                </div>
              )}
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
                  Para refazer o cadastro, apague a biometria atual (ao lado) e cadastre de novo.
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
              title={needsReenrollment ? 'Atualize sua biometria' : 'Cadastro facial ao vivo'}
              description={
                needsReenrollment
                  ? 'Trocamos o sistema de reconhecimento por um mais seguro e precisamos de uma nova captura do seu rosto.'
                  : 'Capture o rosto ao vivo. A conferência da prova de vida e o cadastro são feitos no servidor da prefeitura.'
              }
              helperText="Fique em um lugar iluminado, sem óculos escuros ou boné, e siga as instruções na tela."
              purposeLabel="Cadastro facial do cidadão"
              startLabel="Abrir câmera"
              retryLabel="Refazer captura"
              cancelLabel="Fechar câmera"
              consent={{
                title: 'Termo de uso da biometria facial',
                body: FACE_TERMS_BODY,
                checkboxLabel: 'Li e autorizo o uso da minha biometria facial para confirmar minha identidade.',
              }}
              getChallenge={async () => {
                const response = await apiRequest('/citizen/auth/face-biometry/challenge', {
                  method: 'POST',
                  body: JSON.stringify({ mode: 'enroll' }),
                });
                return response.data;
              }}
              onEnroll={async ({ frames, challengeId, consentAccepted }) => {
                const response = await apiRequest('/citizen/auth/face-biometry', {
                  method: 'POST',
                  body: JSON.stringify({ frames, challengeId, consentAccepted }),
                });

                await refreshCitizenData();
                setAccessLevel(response.data?.accessLevel || null);
                setReloadKey((value) => value + 1);
                return { message: response.message };
              }}
            />
          )}
        </div>
      </div>
    </CitizenLayout>
  );
}
