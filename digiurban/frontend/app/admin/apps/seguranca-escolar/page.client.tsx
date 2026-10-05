'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Eye,
  Loader2,
  ScanFace,
  Shield,
  Siren,
  UserRoundSearch,
} from 'lucide-react';
import { FaceBiometryEnrollmentPanel } from '@/components/common/FaceBiometryEnrollmentPanel';
import FaceBiometryReadCard from '@/components/common/FaceBiometryReadCard';
import SchoolGateCapture from '@/components/apps/seguranca-escolar/SchoolGateCapture';
import { FACE_TERMS_SCHOOL } from '@/components/common/face-terms';
import { SchoolSecurityHeader } from '@/components/apps/seguranca-escolar/SchoolSecurityHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { KPICard, KPICardGrid } from '@/components/ui/kpi-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import facePlatformService from '@/lib/services/face-platform.service';

const defaultConfig = {
  notifyOnEntry: true,
  notifyOnExit: true,
  preferredChannel: 'chat',
  dedupeWindowSecs: 180,
  entryMessageTemplate: '',
  exitMessageTemplate: '',
};

interface FaceReadResult {
  recognized: boolean;
  matchStatus: 'MATCHED' | 'REVIEW_REQUIRED' | 'UNMATCHED';
  confidence: number;
  reviewReason?: string | null;
  provider?: string | null;
  modelName?: string | null;
  modelVersion?: string | null;
  identity?: {
    id: string;
    citizenId?: string | null;
    citizen?: {
      id: string;
      name: string;
      cpf?: string | null;
    } | null;
    person?: {
      id: string;
      name: string;
      cpf?: string | null;
    } | null;
  } | null;
}

function resolveEventType(
  desiredType: 'ENTRY' | 'EXIT' | 'DETECTION',
  matchStatus: FaceReadResult['matchStatus']
) {
  if (matchStatus === 'MATCHED') {
    return desiredType;
  }

  if (matchStatus === 'REVIEW_REQUIRED') {
    return 'REVIEW';
  }

  return 'UNMATCHED';
}

function getRecognizedName(result: FaceReadResult | null) {
  if (!result?.identity) {
    return 'Nenhuma biometria reconhecida';
  }

  return result.identity.citizen?.name || result.identity.person?.name || 'Biometria reconhecida';
}

function getMatchBadgeClass(matchStatus?: FaceReadResult['matchStatus']) {
  if (matchStatus === 'MATCHED') {
    return 'border-emerald-200 bg-emerald-100 text-emerald-800';
  }

  if (matchStatus === 'REVIEW_REQUIRED') {
    return 'border-amber-200 bg-amber-100 text-amber-800';
  }

  return 'border-rose-200 bg-rose-100 text-rose-800';
}

export default function SegurancaEscolarPage() {
  const [loading, setLoading] = useState(true);
  const [serviceStatus, setServiceStatus] = useState<any>(null);
  const [tab, setTab] = useState('painel');
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [citizens, setCitizens] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const [identities, setIdentities] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [deviceForm, setDeviceForm] = useState({
    code: '',
    name: '',
    streamUrl: '',
    username: '',
    password: '',
  });
  const [zoneForm, setZoneForm] = useState({
    deviceId: '',
    name: '',
    gateName: '',
    direction: 'ENTRY',
  });
  const [enrollmentForm, setEnrollmentForm] = useState<{
    citizenId: string;
    sourceLabel: string;
    relationship: 'MAE' | 'PAI' | 'RESPONSAVEL_LEGAL' | 'TITULAR';
    guardianName: string;
    signedTerm: boolean;
  }>({
    citizenId: '',
    sourceLabel: '',
    relationship: 'RESPONSAVEL_LEGAL',
    guardianName: '',
    signedTerm: false,
  });
  const [eventForm, setEventForm] = useState({
    deviceId: '',
    zoneId: '',
    expectedCitizenId: '',
    eventType: 'ENTRY' as 'ENTRY' | 'EXIT' | 'DETECTION',
  });
  const [configForm, setConfigForm] = useState(defaultConfig);
  const [liveEventResult, setLiveEventResult] = useState<FaceReadResult | null>(null);
  const [liveEventMessage, setLiveEventMessage] = useState<string | null>(null);

  const selectedSchool = useMemo(
    () => schools.find((item) => item.id === selectedSchoolId) || null,
    [schools, selectedSchoolId]
  );

  const selectedConfig = useMemo(
    () => configs.find((item) => item.unidadeEducacaoId === selectedSchoolId) || null,
    [configs, selectedSchoolId]
  );

  const schoolDevices = useMemo(
    () => devices.filter((item) => item.unidadeEducacaoId === selectedSchoolId),
    [devices, selectedSchoolId]
  );

  const schoolZones = useMemo(
    () => zones.filter((item) => item.unidadeEducacaoId === selectedSchoolId),
    [zones, selectedSchoolId]
  );

  const schoolEvents = useMemo(
    () =>
      events.filter((item) => !selectedSchoolId || item.unidadeEducacaoId === selectedSchoolId).slice(0, 8),
    [events, selectedSchoolId]
  );

  const schoolCitizensWithBiometry = useMemo(
    () => citizens.filter((item) => item.faceIdentity),
    [citizens]
  );

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    if (!selectedSchoolId) {
      setCitizens([]);
      setConfigForm(defaultConfig);
      return;
    }

    void loadCitizens(selectedSchoolId);

    const config = configs.find((item) => item.unidadeEducacaoId === selectedSchoolId);
    setConfigForm(
      config
        ? {
            notifyOnEntry: config.notifyOnEntry,
            notifyOnExit: config.notifyOnExit,
            preferredChannel: config.preferredChannel === 'whatsapp' || !config.preferredChannel ? 'chat' : config.preferredChannel,
            dedupeWindowSecs: config.dedupeWindowSecs || 180,
            entryMessageTemplate: config.entryMessageTemplate || '',
            exitMessageTemplate: config.exitMessageTemplate || '',
          }
        : defaultConfig
    );
  }, [configs, selectedSchoolId]);

  async function loadAll() {
    try {
      setLoading(true);
      const status = await facePlatformService.getStatus();
      setServiceStatus(status);

      if (!status?.available) {
        setDashboard(null);
        setSchools([]);
        setSelectedSchoolId('');
        setCitizens([]);
        setDevices([]);
        setZones([]);
        setConfigs([]);
        setIdentities([]);
        setEvents([]);
        return;
      }

      const [dashboardData, schoolData, deviceData, zoneData, configData, eventData] =
        await Promise.all([
          facePlatformService.getDashboard(),
          facePlatformService.listSchools(),
          facePlatformService.listDevices(),
          facePlatformService.listZones(),
          facePlatformService.listConfigurations(),
          facePlatformService.listEvents({ limit: 30 }),
        ]);
      const identityData = Array.from({ length: dashboardData?.totals?.totalIdentities || 0 });

      setDashboard(dashboardData);
      setSchools(schoolData);
      setDevices(deviceData);
      setZones(zoneData);
      setConfigs(configData);
      setIdentities(identityData);
      setEvents(eventData);

      if (!selectedSchoolId && schoolData[0]) {
        setSelectedSchoolId(schoolData[0].id);
      }
    } catch (error) {
      console.error(error);
      setServiceStatus({
        available: false,
        message: 'Não foi possível carregar o módulo de Segurança Escolar.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadCitizens(schoolId: string) {
    try {
      const response = await facePlatformService.listSchoolCitizens(schoolId);
      setCitizens(response.citizens || []);
    } catch (error) {
      console.error(error);
      setCitizens([]);
    }
  }

  async function handleCreateDevice() {
    if (!selectedSchoolId || !deviceForm.code || !deviceForm.name) {
      alert('Informe a escola, o código e o nome da câmera.');
      return;
    }

    try {
      setSubmitting('device');
      await facePlatformService.createDevice({
        ...deviceForm,
        unidadeEducacaoId: selectedSchoolId,
        type: 'CAMERA',
        protocol: 'RTSP',
      });
      setDeviceForm({ code: '', name: '', streamUrl: '', username: '', password: '' });
      await loadAll();
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Erro ao cadastrar câmera.');
    } finally {
      setSubmitting(null);
    }
  }

  async function handleCreateZone() {
    if (!selectedSchoolId || !zoneForm.deviceId || !zoneForm.name) {
      alert('Selecione a câmera e informe o nome da zona.');
      return;
    }

    try {
      setSubmitting('zone');
      await facePlatformService.createZone({
        ...zoneForm,
        unidadeEducacaoId: selectedSchoolId,
      });
      setZoneForm({ deviceId: '', name: '', gateName: '', direction: 'ENTRY' });
      await loadAll();
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Erro ao cadastrar zona.');
    } finally {
      setSubmitting(null);
    }
  }

  async function handleCreateEnrollment({
    frames,
    challengeId,
    consentAccepted,
  }: {
    frames: string[];
    challengeId: string;
    consentAccepted: boolean;
  }) {
    if (!enrollmentForm.citizenId) {
      return;
    }

    try {
      setSubmitting('enrollment');
      const response = await facePlatformService.enrollCitizen(enrollmentForm.citizenId, {
        purpose: 'SCHOOL_SECURITY',
        frames,
        challengeId,
        sourceLabel:
          enrollmentForm.sourceLabel ||
          `Cadastro presencial da biometria escolar${selectedSchool ? ` - ${selectedSchool.nome}` : ''}`,
        consent: {
          accepted: consentAccepted,
          relationship: enrollmentForm.relationship,
          grantedByName: enrollmentForm.guardianName.trim(),
          signedTermOnFile: enrollmentForm.signedTerm,
        },
      });
      setEnrollmentForm({ citizenId: '', sourceLabel: '', relationship: 'RESPONSAVEL_LEGAL', guardianName: '', signedTerm: false });
      await loadAll();
      await loadCitizens(selectedSchoolId);
      return {
        message: response?.approved
          ? 'Biometria do aluno cadastrada.'
          : `Biometria enviada para conferência: ${(response?.reviewReasons || [])[0] || 'confirme antes de usar.'}`,
      };
    } finally {
      setSubmitting(null);
    }
  }

  async function handleReview(eventId: string, decision: 'approve' | 'reject') {
    try {
      setSubmitting(eventId);
      await facePlatformService.reviewEvent(eventId, decision);
      await loadAll();
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Erro ao revisar evento.');
    } finally {
      setSubmitting(null);
    }
  }

  async function handleSaveConfig() {
    if (!selectedSchoolId) {
      return;
    }

    try {
      setSubmitting('config');
      await facePlatformService.saveConfiguration(selectedSchoolId, configForm);
      await loadAll();
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Erro ao salvar configuração.');
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (serviceStatus && serviceStatus.available === false) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.14),_transparent_28%),linear-gradient(180deg,_#fffdf7_0%,_#fff7ed_100%)] p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <SchoolSecurityHeader
            title="Segurança Escolar"
            description="Câmeras, zonas, biometria e notificação ao responsável em uma central única."
            icon={Shield}
          />

          <Card className="border-amber-200 bg-white/90">
            <CardHeader>
              <CardTitle>Serviço facial indisponível</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <p>{serviceStatus.message || 'O ultrazend-face-server não está acessível no momento.'}</p>
              <p>Valide se o serviço separado foi iniciado e se `FACE_PLATFORM_API_URL` aponta para ele.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.14),_transparent_28%),linear-gradient(180deg,_#fffdf7_0%,_#fff7ed_100%)] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <SchoolSecurityHeader
          title="Segurança Escolar"
          description="Câmeras, zonas, biometria e notificação ao responsável em uma central única."
          icon={Shield}
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                className="border-amber-200 bg-white text-amber-800 hover:bg-amber-50"
                onClick={() => setTab('teste-multi-rosto')}
              >
                Teste multi-rosto
              </Button>
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                Escola: {selectedSchool?.nome || 'Selecione'}
              </Badge>
            </>
          }
        />

        <div className="grid gap-4 md:grid-cols-[1fr_300px]">
          <Tabs value={tab} onValueChange={setTab} className="space-y-4">
            <TabsList className="h-auto flex-wrap gap-2 rounded-2xl border border-amber-100 bg-white/80 p-2 shadow-sm">
              <TabsTrigger value="painel">Painel</TabsTrigger>
              <TabsTrigger value="cameras">Câmeras</TabsTrigger>
              <TabsTrigger value="biometrias">Biometria</TabsTrigger>
              <TabsTrigger value="eventos">Eventos</TabsTrigger>
              <TabsTrigger value="configuracao">Configuração</TabsTrigger>
            </TabsList>

            <TabsContent value="painel" className="space-y-4">
              <KPICardGrid>
                <KPICard
                  title="Identidades"
                  value={dashboard?.totals?.totalIdentities || 0}
                  icon={<ScanFace className="h-4 w-4" />}
                />
                <KPICard
                  title="Câmeras"
                  value={dashboard?.totals?.totalDevices || 0}
                  icon={<Camera className="h-4 w-4" />}
                />
                <KPICard
                  title="Eventos hoje"
                  value={dashboard?.totals?.eventsToday || 0}
                  icon={<Eye className="h-4 w-4" />}
                />
                <KPICard
                  title="Pendentes"
                  value={dashboard?.totals?.notificationsPending || 0}
                  icon={<Siren className="h-4 w-4" />}
                />
              </KPICardGrid>

              <Card className="border-amber-100 bg-white/85">
                <CardHeader>
                  <CardTitle>Últimos eventos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(dashboard?.recentEvents || []).slice(0, 8).map((event: any) => (
                    <div key={event.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium">{event.citizen?.name || 'Não identificado'}</span>
                        <Badge>{event.notificationStatus}</Badge>
                      </div>
                      <p className="text-slate-600">
                        {event.unidadeEducacao?.nome || '-'} • {event.type} • {event.matchStatus}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cameras" className="grid gap-4 lg:grid-cols-2">
              <Card className="border-amber-100 bg-white/85">
                <CardHeader>
                  <CardTitle>Nova câmera</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Código"
                    value={deviceForm.code}
                    onChange={(event) => setDeviceForm({ ...deviceForm, code: event.target.value })}
                  />
                  <Input
                    placeholder="Nome"
                    value={deviceForm.name}
                    onChange={(event) => setDeviceForm({ ...deviceForm, name: event.target.value })}
                  />
                  <Input
                    placeholder="RTSP/ONVIF"
                    value={deviceForm.streamUrl}
                    onChange={(event) => setDeviceForm({ ...deviceForm, streamUrl: event.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Usuário"
                      value={deviceForm.username}
                      onChange={(event) => setDeviceForm({ ...deviceForm, username: event.target.value })}
                    />
                    <Input
                      type="password"
                      placeholder="Senha"
                      value={deviceForm.password}
                      onChange={(event) => setDeviceForm({ ...deviceForm, password: event.target.value })}
                    />
                  </div>
                  <Button
                    onClick={handleCreateDevice}
                    disabled={submitting === 'device'}
                    className="w-full bg-amber-600 hover:bg-amber-700"
                  >
                    {submitting === 'device' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Salvar câmera
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-amber-100 bg-white/85">
                <CardHeader>
                  <CardTitle>Nova zona</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select
                    value={zoneForm.deviceId}
                    onValueChange={(value) => setZoneForm({ ...zoneForm, deviceId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Câmera" />
                    </SelectTrigger>
                    <SelectContent>
                      {schoolDevices.map((device) => (
                        <SelectItem key={device.id} value={device.id}>
                          {device.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Nome da zona"
                    value={zoneForm.name}
                    onChange={(event) => setZoneForm({ ...zoneForm, name: event.target.value })}
                  />
                  <Input
                    placeholder="Portão / acesso"
                    value={zoneForm.gateName}
                    onChange={(event) => setZoneForm({ ...zoneForm, gateName: event.target.value })}
                  />
                  <Select
                    value={zoneForm.direction}
                    onValueChange={(value) => setZoneForm({ ...zoneForm, direction: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ENTRY">Entrada</SelectItem>
                      <SelectItem value="EXIT">Saída</SelectItem>
                      <SelectItem value="BOTH">Bidirecional</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleCreateZone}
                    disabled={submitting === 'zone'}
                    className="w-full bg-slate-900 hover:bg-slate-800"
                  >
                    {submitting === 'zone' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Salvar zona
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="biometrias" className="grid gap-4 lg:grid-cols-2">
              <Card className="border-amber-100 bg-white/85">
                <CardHeader>
                  <CardTitle>Cadastro ao vivo do cidadão</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    value={enrollmentForm.citizenId}
                    onValueChange={(value) => {
                      const selected = citizens.find((item: any) => item.citizen.id === value);
                      setEnrollmentForm({
                        ...enrollmentForm,
                        citizenId: value,
                        guardianName: selected?.guardian?.name || selected?.responsavel?.name || '',
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Cidadão" />
                    </SelectTrigger>
                    <SelectContent>
                      {citizens.map((item: any) => (
                        <SelectItem key={item.citizen.id} value={item.citizen.id}>
                          {item.citizen.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Rótulo da captura"
                    value={enrollmentForm.sourceLabel}
                    onChange={(event) => setEnrollmentForm({ ...enrollmentForm, sourceLabel: event.target.value })}
                  />

                  <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">Quem autoriza</label>
                      <select
                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                        value={enrollmentForm.relationship}
                        onChange={(event) => setEnrollmentForm({ ...enrollmentForm, relationship: event.target.value as any })}
                      >
                        <option value="MAE">Mãe</option>
                        <option value="PAI">Pai</option>
                        <option value="RESPONSAVEL_LEGAL">Responsável legal</option>
                        <option value="TITULAR">O próprio aluno (maior de idade)</option>
                      </select>
                    </div>
                    {enrollmentForm.relationship !== 'TITULAR' && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-600">Nome do responsável</label>
                        <Input
                          value={enrollmentForm.guardianName}
                          onChange={(event) => setEnrollmentForm({ ...enrollmentForm, guardianName: event.target.value })}
                          placeholder="Nome completo"
                        />
                      </div>
                    )}
                    <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={enrollmentForm.signedTerm}
                        onChange={(event) => setEnrollmentForm({ ...enrollmentForm, signedTerm: event.target.checked })}
                      />
                      Termo de autorização assinado e arquivado na escola
                    </label>
                  </div>

                  <FaceBiometryEnrollmentPanel
                    title="Cadastro biométrico do aluno"
                    description="A câmera captura o aluno ao vivo; a prova de vida e o cadastro são conferidos no servidor."
                    helperText="Deixe só o aluno na moldura. Ele vai olhar de frente, virar o rosto para o lado pedido e voltar."
                    purposeLabel="Cadastro escolar"
                    startLabel="Abrir câmera"
                    retryLabel="Refazer biometria"
                    cancelLabel="Fechar câmera"
                    disabled={!selectedSchoolId || !enrollmentForm.citizenId || Boolean(submitting)}
                    readyToCapture={enrollmentForm.relationship === 'TITULAR' || enrollmentForm.guardianName.trim().length >= 3}
                    consent={{
                      title: 'Autorização para a biometria escolar',
                      body: FACE_TERMS_SCHOOL,
                      checkboxLabel: 'O responsável foi informado e autorizou o uso da biometria do aluno para a segurança escolar.',
                    }}
                    getChallenge={() => facePlatformService.createChallenge({ mode: 'enroll', citizenId: enrollmentForm.citizenId })}
                    onEnroll={handleCreateEnrollment}
                  />
                </CardContent>
              </Card>

              <Card className="border-amber-100 bg-white/85">
                <CardHeader>
                  <CardTitle>Base biométrica da unidade</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {schoolCitizensWithBiometry.length} cidadão(s) com biometria vinculada nesta unidade.
                  </div>

                  {citizens.slice(0, 12).map((item: any) => (
                    <div key={item.matriculaId} className="rounded-xl border border-slate-200 p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium">{item.citizen.name}</span>
                        <Badge variant={item.faceIdentity?.totalEmbeddings ? 'default' : 'secondary'}>
                          {item.faceIdentity?.needsReenrollment
                            ? 'Refazer cadastro'
                            : item.faceIdentity?.totalEmbeddings
                              ? item.schoolConsent
                                ? 'Biometria ativa'
                                : 'Sem autorização escolar'
                              : 'Sem biometria'}
                        </Badge>
                      </div>
                      <p className="text-slate-600">Responsável: {item.guardian?.name || item.responsavel?.name || 'Não informado'}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="eventos" className="grid gap-4 lg:grid-cols-2">
              <Card className="border-amber-100 bg-white/85">
                <CardHeader>
                  <CardTitle>Leitura ao vivo para evento escolar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    value={eventForm.deviceId}
                    onValueChange={(value) => setEventForm({ ...eventForm, deviceId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Câmera" />
                    </SelectTrigger>
                    <SelectContent>
                      {schoolDevices.map((device) => (
                        <SelectItem key={device.id} value={device.id}>
                          {device.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={eventForm.zoneId || 'none'}
                    onValueChange={(value) =>
                      setEventForm({
                        ...eventForm,
                        zoneId: value === 'none' ? '' : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Zona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem zona específica</SelectItem>
                      {schoolZones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={eventForm.eventType}
                    onValueChange={(value) =>
                      setEventForm({
                        ...eventForm,
                        eventType: value as 'ENTRY' | 'EXIT' | 'DETECTION',
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ENTRY">Entrada</SelectItem>
                      <SelectItem value="EXIT">Saída</SelectItem>
                      <SelectItem value="DETECTION">Só registrar (sem avisar responsável)</SelectItem>
                    </SelectContent>
                  </Select>

                  <SchoolGateCapture
                    deviceId={eventForm.deviceId}
                    zoneId={eventForm.zoneId || undefined}
                    eventType={eventForm.eventType}
                    disabled={!selectedSchoolId || Boolean(submitting)}
                    onRegistered={() => void loadAll()}
                  />
                </CardContent>
              </Card>

              <Card className="border-amber-100 bg-white/85">
                <CardHeader>
                  <CardTitle>Fila operacional</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {schoolEvents.map((event: any) => (
                    <div key={event.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium">{event.citizen?.name || 'Não identificado'}</span>
                        <Badge>{event.notificationStatus}</Badge>
                      </div>
                      <p className="text-slate-600">
                        {event.type} • {event.matchStatus}
                        {event.reviewReason ? ` • ${event.reviewReason}` : ''}
                      </p>
                      {event.hasPreview && (
                        <a
                          className="text-xs text-sky-700 underline"
                          href={facePlatformService.mediaUrl('event', event.id)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ver foto (acesso registrado)
                        </a>
                      )}
                      {event.matchStatus === 'REVIEW_REQUIRED' && (
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleReview(event.id, 'approve')}
                            disabled={submitting === event.id}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReview(event.id, 'reject')}
                            disabled={submitting === event.id}
                          >
                            Negar
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>


            <TabsContent value="configuracao" className="grid gap-4 lg:grid-cols-2">
              <Card className="border-amber-100 bg-white/85">
                <CardHeader>
                  <CardTitle>Configuração da unidade</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select
                    value={configForm.preferredChannel}
                    onValueChange={(value) => setConfigForm({ ...configForm, preferredChannel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chat">Mensagem no app (chat)</SelectItem>
                      <SelectItem value="web">Web</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={String(configForm.dedupeWindowSecs)}
                    onChange={(event) =>
                      setConfigForm({
                        ...configForm,
                        dedupeWindowSecs: Number(event.target.value) || 180,
                      })
                    }
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={configForm.notifyOnEntry}
                      onChange={(event) =>
                        setConfigForm({
                          ...configForm,
                          notifyOnEntry: event.target.checked,
                        })
                      }
                    />
                    Notificar entrada
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={configForm.notifyOnExit}
                      onChange={(event) =>
                        setConfigForm({
                          ...configForm,
                          notifyOnExit: event.target.checked,
                        })
                      }
                    />
                    Notificar saída
                  </label>
                  <Textarea
                    placeholder="Template de entrada"
                    value={configForm.entryMessageTemplate}
                    onChange={(event) =>
                      setConfigForm({
                        ...configForm,
                        entryMessageTemplate: event.target.value,
                      })
                    }
                  />
                  <Textarea
                    placeholder="Template de saída"
                    value={configForm.exitMessageTemplate}
                    onChange={(event) =>
                      setConfigForm({
                        ...configForm,
                        exitMessageTemplate: event.target.value,
                      })
                    }
                  />
                  <Button
                    onClick={handleSaveConfig}
                    disabled={submitting === 'config'}
                    className="w-full bg-slate-900 hover:bg-slate-800"
                  >
                    {submitting === 'config' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Salvar configuração
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-amber-100 bg-white/85">
                <CardHeader>
                  <CardTitle>Estado atual</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="font-medium">{selectedSchool?.nome || 'Nenhuma unidade'}</p>
                    <p className="text-slate-600">
                      {selectedConfig ? 'Configuração ativa' : 'Sem configuração salva'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-slate-500">Câmeras</p>
                      <p className="text-2xl font-bold">{schoolDevices.length}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-slate-500">Zonas</p>
                      <p className="text-2xl font-bold">{schoolZones.length}</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-slate-500">Identidades vinculadas</p>
                    <p className="mt-1 text-2xl font-bold">{identities.length}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="h-fit border-amber-100 bg-white/85">
            <CardHeader>
              <CardTitle>Unidade escolar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a escola" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 text-sm text-slate-700">
                <p className="font-medium text-slate-900">Operação atual</p>
                <p className="mt-2">
                  Esta central agora usa captura facial ao vivo para cadastro de cidadãos e leitura de eventos, no mesmo
                  serviço facial central do ecossistema Digiurban.
                </p>
              </div>

              <Button asChild variant="outline" className="w-full">
                <a href="/admin/cidadaos/biometria-facial">
                  <UserRoundSearch className="mr-2 h-4 w-4" />
                  Atendimento presencial
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
