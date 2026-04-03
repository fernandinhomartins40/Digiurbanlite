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
import FaceMultiFaceTestPanel from '@/components/apps/seguranca-escolar/FaceMultiFaceTestPanel';
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
  preferredChannel: 'whatsapp',
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
  const [enrollmentForm, setEnrollmentForm] = useState({
    citizenId: '',
    sourceLabel: '',
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
            preferredChannel: config.preferredChannel || 'whatsapp',
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

      const [dashboardData, schoolData, deviceData, zoneData, configData, identityData, eventData] =
        await Promise.all([
          facePlatformService.getDashboard(),
          facePlatformService.listSchools(),
          facePlatformService.listDevices(),
          facePlatformService.listZones(),
          facePlatformService.listConfigurations(),
          facePlatformService.listIdentities(),
          facePlatformService.listEvents({ limit: 30 }),
        ]);

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
    imageBase64,
    metadata,
    embedding,
    modelName,
    modelVersion,
  }: {
    imageBase64: string;
    metadata: { qualityScore: number; livenessScore: number };
    embedding?: number[] | null;
    modelName?: string;
    modelVersion?: string;
  }) {
    if (!enrollmentForm.citizenId) {
      return;
    }

    try {
      setSubmitting('enrollment');
      await facePlatformService.createEnrollment({
        citizenId: enrollmentForm.citizenId,
        sourceType: 'SCHOOL_SECURITY',
        sourceLabel:
          enrollmentForm.sourceLabel ||
          `Cadastro presencial da biometria escolar${selectedSchool ? ` - ${selectedSchool.nome}` : ''}`,
        imageBase64,
        embedding,
        modelName,
        modelVersion,
        qualityScore: metadata.qualityScore,
        livenessScore: metadata.livenessScore,
        metadata,
      });
      setEnrollmentForm({ citizenId: '', sourceLabel: '' });
      await loadAll();
      await loadCitizens(selectedSchoolId);
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Erro ao cadastrar biometria do cidadão.');
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
              <TabsTrigger value="teste-multi-rosto">Teste multi-rosto</TabsTrigger>
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
                    onValueChange={(value) => setEnrollmentForm({ ...enrollmentForm, citizenId: value })}
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

                  <FaceBiometryEnrollmentPanel
                    title="Cadastro biométrico do cidadão"
                    description="A câmera do setor grava o rosto em vídeo ao vivo e envia a biometria automaticamente."
                    helperText="Abra a câmera, mantenha apenas uma pessoa no quadro e aguarde o envio automático."
                    purposeLabel="Cadastro escolar"
                    startLabel="Abrir câmera"
                    retryLabel="Refazer biometria"
                    cancelLabel="Fechar câmera"
                    disabled={!selectedSchoolId || !enrollmentForm.citizenId || Boolean(submitting)}
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
                        <Badge variant={item.faceIdentity ? 'default' : 'secondary'}>
                          {item.faceIdentity ? item.faceIdentity.status : 'Sem biometria'}
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
                    value={eventForm.expectedCitizenId || 'none'}
                    onValueChange={(value) =>
                      setEventForm({
                        ...eventForm,
                        expectedCitizenId: value === 'none' ? '' : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Cidadão esperado (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem cidadão esperado</SelectItem>
                      {citizens.map((item: any) => (
                        <SelectItem key={item.citizen.id} value={item.citizen.id}>
                          {item.citizen.name}
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
                      <SelectItem value="DETECTION">Detecção</SelectItem>
                    </SelectContent>
                  </Select>

                  <FaceBiometryReadCard
                    title="Leitura ao vivo para evento escolar"
                    description="A câmera grava o rosto em vídeo ao vivo, reconhece a biometria cadastrada e registra o evento operacional."
                    purposeLabel="Leitura escolar"
                    disabled={!selectedSchoolId || !eventForm.deviceId || Boolean(submitting)}
                    expectedOwnerLabel={
                      eventForm.expectedCitizenId
                        ? citizens.find((item: any) => item.citizen.id === eventForm.expectedCitizenId)?.citizen?.name ||
                          'Cidadão esperado'
                        : undefined
                    }
                    onRead={async ({ imageBase64, metadata, embedding, modelName, modelVersion }) => {
                      try {
                        setSubmitting('event-live');
                        setLiveEventMessage('Leitura ao vivo concluída. Registrando o evento escolar...');

                        const readResult = (await facePlatformService.readBiometry({
                          imageBase64,
                          embedding,
                          modelName,
                          modelVersion,
                          sourceType: 'SCHOOL_SECURITY_LIVE_READ',
                          sourceLabel: `Leitura ao vivo${selectedSchool ? ` - ${selectedSchool.nome}` : ''}`,
                          expectedCitizenId: eventForm.expectedCitizenId || undefined,
                          qualityScore: metadata.qualityScore,
                          livenessScore: metadata.livenessScore,
                          metadata,
                        })) as FaceReadResult;

                        setLiveEventResult(readResult);

                        await facePlatformService.ingestEvent({
                          deviceId: eventForm.deviceId,
                          zoneId: eventForm.zoneId || undefined,
                          unidadeEducacaoId: selectedSchoolId,
                          identityId: readResult.identity?.id || undefined,
                          citizenId: readResult.identity?.citizenId || undefined,
                          eventType: resolveEventType(eventForm.eventType, readResult.matchStatus),
                          confidence: readResult.confidence || undefined,
                          provider: readResult.provider || modelName || undefined,
                          modelName: readResult.modelName || modelName || undefined,
                          modelVersion: readResult.modelVersion || modelVersion || undefined,
                          imageBase64,
                          metadata: {
                            liveSession: metadata,
                            liveRead: readResult,
                            recognitionEmbedding: embedding || null,
                            recognitionModelName: modelName || null,
                            recognitionModelVersion: modelVersion || null,
                            expectedCitizenId: eventForm.expectedCitizenId || null,
                          },
                        });

                        setLiveEventMessage('Evento ao vivo registrado com sucesso na fila operacional.');
                        await loadAll();
                        return readResult;
                      } catch (error: any) {
                        setLiveEventMessage(null);
                        alert(error?.response?.data?.error || 'Erro ao registrar o evento ao vivo.');
                        throw error;
                      } finally {
                        setSubmitting(null);
                      }
                    }}
                  />

                  {liveEventMessage && (
                    <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                      {submitting === 'event-live' ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {liveEventMessage}
                        </span>
                      ) : (
                        liveEventMessage
                      )}
                    </div>
                  )}

                  {liveEventResult && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={getMatchBadgeClass(liveEventResult.matchStatus)}>
                          {liveEventResult.matchStatus === 'MATCHED'
                            ? 'Reconhecimento confirmado'
                            : liveEventResult.matchStatus === 'REVIEW_REQUIRED'
                              ? 'Correspondência em revisão'
                              : 'Sem correspondência'}
                        </Badge>
                        <Badge className="border-slate-200 bg-white text-slate-700">
                          Confiança {Math.round((liveEventResult.confidence || 0) * 100)}%
                        </Badge>
                      </div>
                      <p className="mt-3 font-medium text-slate-900">{getRecognizedName(liveEventResult)}</p>
                      {liveEventResult.reviewReason && (
                        <p className="mt-1 text-slate-600">{liveEventResult.reviewReason}</p>
                      )}
                    </div>
                  )}
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
                      </p>
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

            <TabsContent value="teste-multi-rosto" className="space-y-4">
              <FaceMultiFaceTestPanel schoolName={selectedSchool?.nome || undefined} />
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
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
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
                <a href="/admin/atendimento-presencial/biometria-facial">
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
