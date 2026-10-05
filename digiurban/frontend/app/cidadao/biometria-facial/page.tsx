'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, ShieldCheck, Trash2, UserRoundSearch } from 'lucide-react';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';
import { CitizenLayout } from '@/components/citizen/CitizenLayout';
import { FaceBiometryEnrollmentPanel } from '@/components/common/FaceBiometryEnrollmentPanel';
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
  const [justEnrolled, setJustEnrolled] = useState(false);

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
      setJustEnrolled(false);
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

  const showWizard = !biometricLocked || justEnrolled;

  return (
    <CitizenLayout>
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <div className="space-y-2">
          <Link href="/cidadao/perfil" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao perfil
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Biometria facial</h1>
          <p className="text-sm leading-6 text-slate-600">
            Seu rosto confirma que é você mesmo usando a conta. Você pode apagar quando quiser.
          </p>
        </div>

        {notice && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              notice.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {notice.text}
          </div>
        )}

        {loadingAccessLevel && !justEnrolled ? (
          <Card>
            <CardContent className="flex min-h-[240px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
            </CardContent>
          </Card>
        ) : showWizard ? (
          <>
            <FaceBiometryEnrollmentPanel
              title={needsReenrollment ? 'Atualize sua biometria' : 'Cadastrar meu rosto'}
              description={
                needsReenrollment
                  ? 'Trocamos o sistema de reconhecimento por um mais seguro e precisamos de uma nova captura do seu rosto.'
                  : 'São poucos passos, feitos pela câmera deste aparelho.'
              }
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

                // mantém a tela de "tudo certo" enquanto os dados da conta são atualizados
                setJustEnrolled(true);
                setNotice(null);
                await refreshCitizenData();
                setAccessLevel(response.data?.accessLevel || null);
                return { message: response.message };
              }}
            />

            {justEnrolled && (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 flex-1 text-base">
                  <Link href="/cidadao/biometria-facial/leitura">
                    <UserRoundSearch className="mr-2 h-5 w-5" />
                    Testar o reconhecimento
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 flex-1 text-base">
                  <Link href="/cidadao/perfil">Voltar ao perfil</Link>
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="space-y-6 p-5 sm:p-7">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <ShieldCheck className="h-9 w-9" />
                </div>
                <p className="text-lg font-semibold text-slate-900">Biometria cadastrada</p>
                <p className="max-w-md text-sm leading-6 text-slate-600">{biometricStatusText}</p>
              </div>

              <Button asChild size="lg" className="h-12 w-full text-base">
                <Link href="/cidadao/biometria-facial/leitura">
                  <UserRoundSearch className="mr-2 h-5 w-5" />
                  Testar o reconhecimento
                </Link>
              </Button>

              {activeConsents.length > 0 && (
                <div className="border-t border-slate-200 pt-4 text-sm text-slate-600">
                  <p className="font-medium text-slate-900">O que você autorizou</p>
                  <ul className="mt-1 space-y-1">
                    {activeConsents.map((item) => (
                      <li key={item.id}>
                        {PURPOSE_LABEL[item.purpose] || item.purpose} — desde{' '}
                        {new Date(item.grantedAt).toLocaleDateString('pt-BR')}
                        {item.relationship !== 'TITULAR' && item.grantedByName ? ` (autorizado por ${item.grantedByName})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t border-slate-200 pt-4">
                {confirmDelete ? (
                  <div className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                    <p>
                      Tem certeza? Sua biometria, as fotos e as autorizações serão apagadas. Se você tem nível Ouro, ele
                      volta para Prata até um novo cadastro.
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
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-2 text-sm text-rose-600 hover:text-rose-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Apagar minha biometria (para refazer ou deixar de usar)
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </CitizenLayout>
  );
}
