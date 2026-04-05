'use client';

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
import { FaceBiometryEnrollmentPanel } from '@/components/common/FaceBiometryEnrollmentPanel';
import FaceBiometryReadCard from '@/components/common/FaceBiometryReadCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext';
import type { Citizen } from '@/hooks/useSearchCitizen';
import { useToast } from '@/hooks/use-toast';
import facePlatformService from '@/lib/services/face-platform.service';
import type { CitizenAccessLevelSummary, RegistrationLevel } from '@/types/citizen-access';

interface FaceBiometryLiveMetadata {
  qualityScore: number;
  livenessScore: number;
}

type AttendanceTab = 'register' | 'read';

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

function maskCpf(value?: string | null) {
  if (!value) {
    return 'CPF não informado';
  }

  const digits = value.replace(/\D/g, '');
  if (digits.length !== 11) {
    return value;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function getBiometricSummary(accessLevel: CitizenAccessLevelSummary | null) {
  if (!accessLevel) {
    return {
      label: 'Sem dados',
      tone: 'border-slate-200 bg-slate-50 text-slate-700',
    };
  }

  if (accessLevel.goldCriteria.biometricConfirmed) {
    return {
      label: 'Biometria confirmada',
      tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  }

  if (accessLevel.goldCriteria.biometric.pendingEnrollments > 0) {
    return {
      label: 'Biometria em revisão manual',
      tone: 'border-amber-200 bg-amber-50 text-amber-700',
    };
  }

  return {
    label: 'Biometria ainda não cadastrada',
    tone: 'border-rose-200 bg-rose-50 text-rose-700',
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

function getUnifiedBiometricSummary(accessLevel: CitizenAccessLevelSummary | null) {
  if (!accessLevel) {
    return {
      label: 'Sem dados',
      tone: 'border-slate-200 bg-slate-50 text-slate-700',
    };
  }

  if (accessLevel.goldCriteria.biometricConfirmed) {
    return {
      label: 'Biometria confirmada',
      tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  }

  if (accessLevel.goldCriteria.biometric.pendingEnrollments > 0) {
    return {
      label: 'Biometria em revisão manual',
      tone: 'border-amber-200 bg-amber-50 text-amber-700',
    };
  }

  if (hasRegisteredBiometry(accessLevel)) {
    return {
      label: 'Cadastro biométrico já registrado',
      tone: 'border-blue-200 bg-blue-50 text-blue-700',
    };
  }

  return {
    label: 'Biometria ainda não cadastrada',
    tone: 'border-rose-200 bg-rose-50 text-rose-700',
  };
}

function buildUnifiedPendingItems(accessLevel: CitizenAccessLevelSummary | null) {
  if (!accessLevel) {
    return [];
  }

  const items: string[] = [];

  if (!accessLevel.goldCriteria.profileComplete) {
    items.push(`Completar perfil: ${accessLevel.goldCriteria.missingProfileFields.join(', ')}.`);
  }

  if (accessLevel.goldCriteria.missingDocumentTypes.length > 0) {
    items.push(
      `Validar documentos: ${accessLevel.goldCriteria.missingDocumentTypes.map(getDocumentLabel).join(', ')}.`
    );
  }

  if (!accessLevel.goldCriteria.biometricConfirmed) {
    items.push(
      accessLevel.goldCriteria.biometric.pendingEnrollments > 0
        ? 'Confirmar a biometria facial pendente.'
        : hasRegisteredBiometry(accessLevel)
          ? 'Não há recadastro biométrico. Use a leitura ao vivo para validar a biometria existente.'
          : 'Cadastrar biometria facial ao vivo.'
    );
  }

  return items;
}

function buildPendingItems(accessLevel: CitizenAccessLevelSummary | null) {
  if (!accessLevel) {
    return [];
  }

  const items: string[] = [];

  if (!accessLevel.goldCriteria.profileComplete) {
    items.push(`Completar perfil: ${accessLevel.goldCriteria.missingProfileFields.join(', ')}.`);
  }

  if (accessLevel.goldCriteria.missingDocumentTypes.length > 0) {
    items.push(
      `Validar documentos: ${accessLevel.goldCriteria.missingDocumentTypes.map(getDocumentLabel).join(', ')}.`
    );
  }

  if (!accessLevel.goldCriteria.biometricConfirmed) {
    items.push(
      accessLevel.goldCriteria.biometric.pendingEnrollments > 0
        ? 'Confirmar a biometria facial pendente.'
        : 'Cadastrar biometria facial ao vivo.'
    );
  }

  return items;
}

export default function AdminCitizenFaceBiometryPage() {
  const { apiRequest, loading: authLoading } = useAdminAuth();
  const { hasPermission } = useAdminPermissions();
  const { toast } = useToast();

  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [accessLevel, setAccessLevel] = useState<CitizenAccessLevelSummary | null>(null);
  const [sourceLabel, setSourceLabel] = useState('');
  const [activeTab, setActiveTab] = useState<AttendanceTab>('register');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const canVerify = !authLoading && hasPermission('citizens:verify');
  const biometricSummary = getUnifiedBiometricSummary(accessLevel);
  const pendingItems = buildUnifiedPendingItems(accessLevel);
  const biometricLocked = hasRegisteredBiometry(accessLevel);

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
      setActiveTab('register');
    } else {
      setAccessLevel(null);
      setSourceLabel('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCitizen?.id]);

  useEffect(() => {
    if (biometricLocked && activeTab === 'register') {
      setActiveTab('read');
    }
  }, [activeTab, biometricLocked]);

  const handleRegisterBiometry = async ({
    imageBase64,
    metadata,
    embedding,
    modelName,
    modelVersion,
  }: {
    imageBase64: string;
    metadata: FaceBiometryLiveMetadata;
    embedding?: number[] | null;
    modelName?: string;
    modelVersion?: string;
  }) => {
    if (!selectedCitizen?.id) {
      return;
    }

    try {
      setSubmitting('capture');
      const response = await apiRequest(`/admin/citizens/${selectedCitizen.id}/face-biometry`, {
        method: 'POST',
        body: JSON.stringify({
          imageBase64,
          embedding,
          modelName,
          modelVersion,
          sourceLabel: sourceLabel.trim() || `Biometria presencial capturada para ${selectedCitizen.name}`,
          qualityScore: metadata.qualityScore,
          livenessScore: metadata.livenessScore,
          metadata,
        }),
      });

      setAccessLevel(response.data?.accessLevel || null);
      setSourceLabel('');
      setActiveTab('read');

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
        <h1 className="text-2xl font-bold text-slate-900">Biometria presencial do cidadão</h1>
        <p className="text-sm text-slate-600">
          Faça todo o atendimento biométrico em um único lugar: selecione o cidadão, cadastre a biometria ao vivo e
          valide a leitura sem trocar de página.
        </p>
      </div>

      {!authLoading && !canVerify && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 p-6 text-sm text-amber-800">
            <ShieldAlert className="h-5 w-5" />
            Seu usuário não possui permissão para cadastrar ou confirmar biometria facial de cidadãos.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="space-y-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="h-5 w-5 text-blue-600" />
                Atendimento presencial
              </CardTitle>
              <p className="text-sm text-slate-600">
                Escolha o cidadão que está sendo atendido. O cadastro e a leitura biométrica usam essa mesma seleção.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <CitizenSelector
                selectedCitizen={selectedCitizen}
                onCitizenSelect={setSelectedCitizen}
                label="Cidadão em atendimento"
                disabled={!canVerify}
              />

              {selectedCitizen ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{selectedCitizen.name}</p>
                    <Badge className={accessLevel ? levelStyles[accessLevel.currentLevel] : 'border-slate-200 bg-white text-slate-700'}>
                      {accessLevel ? getLevelLabel(accessLevel.currentLevel) : 'Carregando nível'}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {maskCpf(selectedCitizen.cpf)}
                    {selectedCitizen.phone ? ` • ${selectedCitizen.phone}` : ''}
                    {selectedCitizen.email ? ` • ${selectedCitizen.email}` : ''}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                  Selecione um cidadão para habilitar o cadastro e a leitura biométrica presencial.
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AttendanceTab)} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="register" disabled={!selectedCitizen || !canVerify || biometricLocked}>
                <ScanFace className="mr-2 h-4 w-4" />
                Cadastrar biometria
              </TabsTrigger>
              <TabsTrigger value="read" disabled={!selectedCitizen || !canVerify}>
                <UserRoundSearch className="mr-2 h-4 w-4" />
                Ler e validar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="register" className="space-y-4">
              {!selectedCitizen ? (
                <Card>
                  <CardContent className="px-6 py-12 text-center text-sm text-slate-600">
                    Selecione um cidadão para iniciar o cadastro biométrico presencial.
                  </CardContent>
                </Card>
              ) : biometricLocked ? (
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-start gap-3 text-amber-800">
                      <ShieldAlert className="mt-0.5 h-5 w-5" />
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900">Biometria já cadastrada</p>
                        <p className="text-sm">
                          Este cidadão já possui biometria registrada. Novos cadastros foram bloqueados para evitar
                          duplicidade entre atendimento presencial e autoatendimento.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-700">
                      Use a aba <span className="font-medium">Ler e validar</span> para testar o reconhecimento ao vivo
                      da biometria já existente.
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="space-y-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <ScanFace className="h-5 w-5 text-blue-600" />
                      Cadastro biométrico presencial
                    </CardTitle>
                    <p className="text-sm text-slate-600">
                      Capture a biometria ao vivo no balcão de atendimento. Ao concluir, a tela muda para leitura e
                      validação.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="sourceLabel" className="text-sm font-medium text-slate-900">
                        Local ou contexto da captura
                      </label>
                      <Input
                        id="sourceLabel"
                        value={sourceLabel}
                        onChange={(event) => setSourceLabel(event.target.value)}
                        placeholder="Ex.: Balcão central de atendimento"
                        disabled={!canVerify || Boolean(submitting)}
                      />
                    </div>

                    <FaceBiometryEnrollmentPanel
                      title="Captura biométrica do cidadão"
                      description={`A webcam do atendimento usa face-api.js para registrar ${selectedCitizen.name} ao vivo e enviar a biometria automaticamente.`}
                      helperText="Mantenha apenas o cidadão em atendimento na moldura e aguarde a conclusão automática da sessão."
                      purposeLabel="Cadastro presencial"
                      startLabel="Abrir câmera"
                      retryLabel="Refazer captura"
                      cancelLabel="Fechar câmera"
                      disabled={!canVerify || Boolean(submitting)}
                      successMessage="Biometria cadastrada. Agora faça a leitura para validar o reconhecimento."
                      requireFaceApi
                      onEnroll={handleRegisterBiometry}
                      onSuccess={() => setActiveTab('read')}
                    />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="read" className="space-y-4">
              {!selectedCitizen ? (
                <Card>
                  <CardContent className="px-6 py-12 text-center text-sm text-slate-600">
                    Selecione um cidadão para validar a biometria presencial.
                  </CardContent>
                </Card>
              ) : (
                <FaceBiometryReadCard
                  title="Leitura biométrica ao vivo"
                  description="Use a mesma câmera do atendimento para confirmar se a biometria cadastrada reconhece corretamente o cidadão selecionado."
                  purposeLabel="Leitura presencial"
                  disabled={!canVerify}
                  expectedOwnerLabel={`${selectedCitizen.name} • ${maskCpf(selectedCitizen.cpf)}`}
                  onRead={async ({ imageBase64, metadata, embedding, modelName, modelVersion }) =>
                    facePlatformService.readBiometry({
                      imageBase64,
                      embedding,
                      modelName,
                      modelVersion,
                      expectedCitizenId: selectedCitizen.id,
                      sourceType: 'ADMIN_LIVE_READ',
                      sourceLabel: `Leitura biométrica presencial para ${selectedCitizen.name}`,
                      qualityScore: metadata.qualityScore,
                      livenessScore: metadata.livenessScore,
                      metadata,
                    })
                  }
                />
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg">Resumo do atendimento</CardTitle>
              <p className="text-sm text-slate-600">
                Status do nível, da biometria e das pendências para fechar o atendimento sem navegar para outras telas.
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex min-h-[220px] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : !selectedCitizen ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-600">
                  Selecione um cidadão para ver o resumo biométrico e o nível cadastral.
                </div>
              ) : accessLevel ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Nível atual</p>
                      <div className="mt-2 flex items-center gap-2">
                        {accessLevel.currentLevel === 'GOLD' ? (
                          <Trophy className="h-5 w-5 text-yellow-600" />
                        ) : accessLevel.currentLevel === 'SILVER' ? (
                          <ShieldCheck className="h-5 w-5 text-slate-700" />
                        ) : (
                          <Shield className="h-5 w-5 text-amber-700" />
                        )}
                        <Badge className={levelStyles[accessLevel.currentLevel]}>
                          {getLevelLabel(accessLevel.currentLevel)}
                        </Badge>
                      </div>
                    </div>

                    <div className={`rounded-2xl border p-4 ${biometricSummary.tone}`}>
                      <p className="text-xs uppercase tracking-[0.18em] opacity-80">Biometria facial</p>
                      <p className="mt-2 text-sm font-medium">{biometricSummary.label}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Documentos aprovados</p>
                      <p className="mt-2 text-sm font-medium text-slate-900">
                        {accessLevel.goldCriteria.approvedDocsCount} de {accessLevel.goldCriteria.requiredDocCount}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Pendências biométricas</p>
                      <p className="mt-2 text-sm font-medium text-slate-900">
                        {accessLevel.goldCriteria.biometric.pendingEnrollments}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">Próximos passos</p>
                    {pendingItems.length > 0 ? (
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        {pendingItems.map((item) => (
                          <p key={item}>{item}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-emerald-700">Nenhuma pendência crítica para o nível Ouro.</p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    {accessLevel.goldCriteria.reason || 'Sem observações adicionais para este atendimento.'}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg">Ações rápidas</CardTitle>
              <p className="text-sm text-slate-600">
                Use estas ações quando o atendimento exigir confirmação manual ou promoção para Ouro.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
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

              <Button
                type="button"
                className="w-full justify-start"
                onClick={handlePromoteToGold}
                disabled={
                  !selectedCitizen ||
                  !canVerify ||
                  Boolean(submitting) ||
                  !accessLevel ||
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

              <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                Fluxo recomendado: cadastrar biometria, validar pela leitura ao vivo e só então aplicar ações manuais.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
