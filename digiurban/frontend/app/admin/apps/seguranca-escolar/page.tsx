'use client';

import { useEffect, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Eye,
  Loader2,
  ScanFace,
  Shield,
  Siren,
} from 'lucide-react';
import { SchoolSecurityHeader } from '@/components/apps/seguranca-escolar/SchoolSecurityHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { KPICard, KPICardGrid } from '@/components/ui/kpi-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import facePlatformService from '@/lib/services/face-platform.service';

async function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const defaultConfig = {
  notifyOnEntry: true,
  notifyOnExit: true,
  preferredChannel: 'whatsapp',
  dedupeWindowSecs: 180,
  entryMessageTemplate: '',
  exitMessageTemplate: '',
};

export default function SegurancaEscolarPage() {
  const [loading, setLoading] = useState(true);
  const [serviceStatus, setServiceStatus] = useState<any>(null);
  const [tab, setTab] = useState('painel');
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const [identities, setIdentities] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [deviceForm, setDeviceForm] = useState({ code: '', name: '', streamUrl: '', username: '', password: '' });
  const [zoneForm, setZoneForm] = useState({ deviceId: '', name: '', gateName: '', direction: 'ENTRY' });
  const [enrollmentForm, setEnrollmentForm] = useState({ citizenId: '', sourceLabel: '', imageBase64: '' });
  const [eventForm, setEventForm] = useState({ deviceId: '', zoneId: '', studentCitizenId: '', eventType: 'ENTRY', confidence: '0.98', imageBase64: '' });
  const [configForm, setConfigForm] = useState(defaultConfig);

  const selectedSchool = schools.find((item) => item.id === selectedSchoolId);
  const selectedConfig = configs.find((item) => item.unidadeEducacaoId === selectedSchoolId);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!selectedSchoolId) return;
    loadStudents(selectedSchoolId);
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
  }, [selectedSchoolId, configs.length]);

  async function loadAll() {
    try {
      setLoading(true);
      const status = await facePlatformService.getStatus();
      setServiceStatus(status);

      if (!status?.available) {
        setDashboard(null);
        setSchools([]);
        setSelectedSchoolId('');
        setStudents([]);
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

  async function loadStudents(schoolId: string) {
    try {
      const response = await facePlatformService.listSchoolStudents(schoolId);
      setStudents(response.students || []);
    } catch (error) {
      console.error(error);
      setStudents([]);
    }
  }

  async function handleFile(setter: (value: string) => void, file?: File | null) {
    setter(file ? await fileToBase64(file) : '');
  }

  async function handleCreateDevice() {
    if (!selectedSchoolId || !deviceForm.code || !deviceForm.name) return alert('Informe escola, cÃ³digo e nome.');
    try {
      setSubmitting('device');
      await facePlatformService.createDevice({ ...deviceForm, unidadeEducacaoId: selectedSchoolId, type: 'CAMERA', protocol: 'RTSP' });
      setDeviceForm({ code: '', name: '', streamUrl: '', username: '', password: '' });
      await loadAll();
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Erro ao cadastrar cÃ¢mera.');
    } finally {
      setSubmitting(null);
    }
  }

  async function handleCreateZone() {
    if (!zoneForm.deviceId || !zoneForm.name) return alert('Selecione a cÃ¢mera e nomeie a zona.');
    try {
      setSubmitting('zone');
      await facePlatformService.createZone({ ...zoneForm, unidadeEducacaoId: selectedSchoolId });
      setZoneForm({ deviceId: '', name: '', gateName: '', direction: 'ENTRY' });
      await loadAll();
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Erro ao cadastrar zona.');
    } finally {
      setSubmitting(null);
    }
  }

  async function handleCreateEnrollment() {
    if (!enrollmentForm.citizenId) return alert('Selecione o aluno.');
    try {
      setSubmitting('enrollment');
      await facePlatformService.createEnrollment({
        citizenId: enrollmentForm.citizenId,
        sourceType: 'SCHOOL_SECURITY',
        sourceLabel: enrollmentForm.sourceLabel || 'Cadastro inicial',
        imageBase64: enrollmentForm.imageBase64 || undefined,
      });
      setEnrollmentForm({ citizenId: '', sourceLabel: '', imageBase64: '' });
      await loadAll();
      await loadStudents(selectedSchoolId);
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Erro ao cadastrar biometria.');
    } finally {
      setSubmitting(null);
    }
  }

  async function handleIngestEvent() {
    if (!selectedSchoolId || !eventForm.deviceId) return alert('Selecione a escola e a cÃ¢mera.');
    try {
      setSubmitting('event');
      await facePlatformService.ingestEvent({
        ...eventForm,
        unidadeEducacaoId: selectedSchoolId,
        confidence: Number(eventForm.confidence) || undefined,
        zoneId: eventForm.zoneId || undefined,
        studentCitizenId: eventForm.studentCitizenId || undefined,
        imageBase64: eventForm.imageBase64 || undefined,
      });
      setEventForm({ deviceId: '', zoneId: '', studentCitizenId: '', eventType: 'ENTRY', confidence: '0.98', imageBase64: '' });
      await loadAll();
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Erro ao registrar evento.');
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
    if (!selectedSchoolId) return;
    try {
      setSubmitting('config');
      await facePlatformService.saveConfiguration(selectedSchoolId, configForm);
      await loadAll();
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Erro ao salvar configuraÃ§Ã£o.');
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div>;
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
        <SchoolSecurityHeader title="SeguranÃ§a Escolar" description="CÃ¢meras, zonas, biometria e notificaÃ§Ã£o ao responsÃ¡vel em uma central Ãºnica." icon={Shield} actions={<Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Escola: {selectedSchool?.nome || 'Selecione'}</Badge>} />

        <div className="grid gap-4 md:grid-cols-[1fr_280px]">
          <Tabs value={tab} onValueChange={setTab} className="space-y-4">
            <TabsList className="h-auto flex-wrap gap-2 rounded-2xl border border-amber-100 bg-white/80 p-2 shadow-sm">
              <TabsTrigger value="painel">Painel</TabsTrigger>
              <TabsTrigger value="cameras">CÃ¢meras</TabsTrigger>
              <TabsTrigger value="biometrias">Biometrias</TabsTrigger>
              <TabsTrigger value="eventos">Eventos</TabsTrigger>
              <TabsTrigger value="configuracao">ConfiguraÃ§Ã£o</TabsTrigger>
            </TabsList>

            <TabsContent value="painel" className="space-y-4">
              <KPICardGrid>
                <KPICard title="Identidades" value={dashboard?.totals?.totalIdentities || 0} icon={<ScanFace className="h-4 w-4" />} />
                <KPICard title="CÃ¢meras" value={dashboard?.totals?.totalDevices || 0} icon={<Camera className="h-4 w-4" />} />
                <KPICard title="Eventos hoje" value={dashboard?.totals?.eventsToday || 0} icon={<Eye className="h-4 w-4" />} />
                <KPICard title="Pendentes" value={dashboard?.totals?.notificationsPending || 0} icon={<Siren className="h-4 w-4" />} />
              </KPICardGrid>
              <Card className="border-amber-100 bg-white/85"><CardHeader><CardTitle>Ãšltimos eventos</CardTitle></CardHeader><CardContent className="space-y-3">{(dashboard?.recentEvents || []).slice(0, 8).map((event: any) => <div key={event.id} className="rounded-xl border border-slate-200 p-3 text-sm"><div className="flex items-center justify-between gap-3"><span className="font-medium">{event.studentCitizen?.name || 'NÃ£o identificado'}</span><Badge>{event.notificationStatus}</Badge></div><p className="text-slate-600">{event.unidadeEducacao?.nome || '-'} â€¢ {event.type} â€¢ {event.matchStatus}</p></div>)}</CardContent></Card>
            </TabsContent>

            <TabsContent value="cameras" className="grid gap-4 lg:grid-cols-2">
              <Card className="border-amber-100 bg-white/85"><CardHeader><CardTitle>Nova cÃ¢mera</CardTitle></CardHeader><CardContent className="space-y-3"><Input placeholder="CÃ³digo" value={deviceForm.code} onChange={(e) => setDeviceForm({ ...deviceForm, code: e.target.value })} /><Input placeholder="Nome" value={deviceForm.name} onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })} /><Input placeholder="RTSP/ONVIF" value={deviceForm.streamUrl} onChange={(e) => setDeviceForm({ ...deviceForm, streamUrl: e.target.value })} /><div className="grid grid-cols-2 gap-3"><Input placeholder="UsuÃ¡rio" value={deviceForm.username} onChange={(e) => setDeviceForm({ ...deviceForm, username: e.target.value })} /><Input type="password" placeholder="Senha" value={deviceForm.password} onChange={(e) => setDeviceForm({ ...deviceForm, password: e.target.value })} /></div><Button onClick={handleCreateDevice} disabled={submitting === 'device'} className="w-full bg-amber-600 hover:bg-amber-700">{submitting === 'device' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Salvar cÃ¢mera</Button></CardContent></Card>
              <Card className="border-amber-100 bg-white/85"><CardHeader><CardTitle>Nova zona</CardTitle></CardHeader><CardContent className="space-y-3"><Select value={zoneForm.deviceId} onValueChange={(value) => setZoneForm({ ...zoneForm, deviceId: value })}><SelectTrigger><SelectValue placeholder="CÃ¢mera" /></SelectTrigger><SelectContent>{devices.map((device) => <SelectItem key={device.id} value={device.id}>{device.name}</SelectItem>)}</SelectContent></Select><Input placeholder="Nome da zona" value={zoneForm.name} onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })} /><Input placeholder="PortÃ£o / acesso" value={zoneForm.gateName} onChange={(e) => setZoneForm({ ...zoneForm, gateName: e.target.value })} /><Select value={zoneForm.direction} onValueChange={(value) => setZoneForm({ ...zoneForm, direction: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ENTRY">Entrada</SelectItem><SelectItem value="EXIT">SaÃ­da</SelectItem><SelectItem value="BOTH">Bidirecional</SelectItem></SelectContent></Select><Button onClick={handleCreateZone} disabled={submitting === 'zone'} className="w-full bg-slate-900 hover:bg-slate-800">{submitting === 'zone' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Salvar zona</Button></CardContent></Card>
            </TabsContent>

            <TabsContent value="biometrias" className="grid gap-4 lg:grid-cols-2">
              <Card className="border-amber-100 bg-white/85"><CardHeader><CardTitle>Enrollment do aluno</CardTitle></CardHeader><CardContent className="space-y-3"><Select value={enrollmentForm.citizenId} onValueChange={(value) => setEnrollmentForm({ ...enrollmentForm, citizenId: value })}><SelectTrigger><SelectValue placeholder="Aluno" /></SelectTrigger><SelectContent>{students.map((item: any) => <SelectItem key={item.aluno.id} value={item.aluno.id}>{item.aluno.name}</SelectItem>)}</SelectContent></Select><Input placeholder="RÃ³tulo da captura" value={enrollmentForm.sourceLabel} onChange={(e) => setEnrollmentForm({ ...enrollmentForm, sourceLabel: e.target.value })} /><Input type="file" accept="image/*" onChange={(e) => handleFile((value) => setEnrollmentForm((current) => ({ ...current, imageBase64: value })), e.target.files?.[0])} /><Button onClick={handleCreateEnrollment} disabled={submitting === 'enrollment'} className="w-full bg-emerald-600 hover:bg-emerald-700">{submitting === 'enrollment' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Salvar biometria</Button></CardContent></Card>
              <Card className="border-amber-100 bg-white/85"><CardHeader><CardTitle>Alunos da unidade</CardTitle></CardHeader><CardContent className="space-y-3">{students.slice(0, 10).map((item: any) => <div key={item.matriculaId} className="rounded-xl border border-slate-200 p-3 text-sm"><div className="flex items-center justify-between gap-3"><span className="font-medium">{item.aluno.name}</span><Badge variant={item.faceIdentity ? 'default' : 'secondary'}>{item.faceIdentity ? item.faceIdentity.status : 'Sem biometria'}</Badge></div><p className="text-slate-600">ResponsÃ¡vel: {item.responsavel?.name || 'NÃ£o informado'}</p></div>)}</CardContent></Card>
            </TabsContent>

            <TabsContent value="eventos" className="grid gap-4 lg:grid-cols-2">
              <Card className="border-amber-100 bg-white/85"><CardHeader><CardTitle>Evento de teste</CardTitle></CardHeader><CardContent className="space-y-3"><Select value={eventForm.deviceId} onValueChange={(value) => setEventForm({ ...eventForm, deviceId: value })}><SelectTrigger><SelectValue placeholder="CÃ¢mera" /></SelectTrigger><SelectContent>{devices.map((device) => <SelectItem key={device.id} value={device.id}>{device.name}</SelectItem>)}</SelectContent></Select><Select value={eventForm.zoneId} onValueChange={(value) => setEventForm({ ...eventForm, zoneId: value })}><SelectTrigger><SelectValue placeholder="Zona" /></SelectTrigger><SelectContent>{zones.map((zone) => <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>)}</SelectContent></Select><Select value={eventForm.studentCitizenId} onValueChange={(value) => setEventForm({ ...eventForm, studentCitizenId: value })}><SelectTrigger><SelectValue placeholder="Aluno" /></SelectTrigger><SelectContent>{students.map((item: any) => <SelectItem key={item.aluno.id} value={item.aluno.id}>{item.aluno.name}</SelectItem>)}</SelectContent></Select><Select value={eventForm.eventType} onValueChange={(value) => setEventForm({ ...eventForm, eventType: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ENTRY">Entrada</SelectItem><SelectItem value="EXIT">SaÃ­da</SelectItem><SelectItem value="DETECTION">DetecÃ§Ã£o</SelectItem></SelectContent></Select><Input placeholder="ConfianÃ§a" value={eventForm.confidence} onChange={(e) => setEventForm({ ...eventForm, confidence: e.target.value })} /><Input type="file" accept="image/*" onChange={(e) => handleFile((value) => setEventForm((current) => ({ ...current, imageBase64: value })), e.target.files?.[0])} /><Button onClick={handleIngestEvent} disabled={submitting === 'event'} className="w-full bg-indigo-600 hover:bg-indigo-700">{submitting === 'event' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Registrar evento</Button></CardContent></Card>
              <Card className="border-amber-100 bg-white/85"><CardHeader><CardTitle>Fila operacional</CardTitle></CardHeader><CardContent className="space-y-3">{events.slice(0, 8).map((event) => <div key={event.id} className="rounded-xl border border-slate-200 p-3 text-sm"><div className="flex items-center justify-between gap-3"><span className="font-medium">{event.studentCitizen?.name || 'NÃ£o identificado'}</span><Badge>{event.notificationStatus}</Badge></div><p className="text-slate-600">{event.type} â€¢ {event.matchStatus}</p>{event.matchStatus === 'REVIEW_REQUIRED' ? <div className="mt-3 flex gap-2"><Button size="sm" onClick={() => handleReview(event.id, 'approve')} disabled={submitting === event.id}><CheckCircle2 className="mr-2 h-4 w-4" />Aprovar</Button><Button size="sm" variant="outline" onClick={() => handleReview(event.id, 'reject')} disabled={submitting === event.id}>Negar</Button></div> : null}</div>)}</CardContent></Card>
            </TabsContent>

            <TabsContent value="configuracao" className="grid gap-4 lg:grid-cols-2">
              <Card className="border-amber-100 bg-white/85"><CardHeader><CardTitle>ConfiguraÃ§Ã£o da unidade</CardTitle></CardHeader><CardContent className="space-y-3"><Select value={configForm.preferredChannel} onValueChange={(value) => setConfigForm({ ...configForm, preferredChannel: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="whatsapp">WhatsApp</SelectItem><SelectItem value="web">Web</SelectItem><SelectItem value="email">E-mail</SelectItem><SelectItem value="sms">SMS</SelectItem></SelectContent></Select><Input type="number" value={String(configForm.dedupeWindowSecs)} onChange={(e) => setConfigForm({ ...configForm, dedupeWindowSecs: Number(e.target.value) || 180 })} /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={configForm.notifyOnEntry} onChange={(e) => setConfigForm({ ...configForm, notifyOnEntry: e.target.checked })} />Notificar entrada</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={configForm.notifyOnExit} onChange={(e) => setConfigForm({ ...configForm, notifyOnExit: e.target.checked })} />Notificar saÃ­da</label><Textarea placeholder="Template de entrada" value={configForm.entryMessageTemplate} onChange={(e) => setConfigForm({ ...configForm, entryMessageTemplate: e.target.value })} /><Textarea placeholder="Template de saÃ­da" value={configForm.exitMessageTemplate} onChange={(e) => setConfigForm({ ...configForm, exitMessageTemplate: e.target.value })} /><Button onClick={handleSaveConfig} disabled={submitting === 'config'} className="w-full bg-slate-900 hover:bg-slate-800">{submitting === 'config' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Salvar configuraÃ§Ã£o</Button></CardContent></Card>
              <Card className="border-amber-100 bg-white/85"><CardHeader><CardTitle>Estado atual</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><div className="rounded-xl border border-slate-200 p-4"><p className="font-medium">{selectedSchool?.nome || 'Nenhuma unidade'}</p><p className="text-slate-600">{selectedConfig ? 'ConfiguraÃ§Ã£o ativa' : 'Sem configuraÃ§Ã£o salva'}</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-xl border border-slate-200 p-4"><p className="text-slate-500">CÃ¢meras</p><p className="text-2xl font-bold">{devices.filter((item) => item.unidadeEducacaoId === selectedSchoolId).length}</p></div><div className="rounded-xl border border-slate-200 p-4"><p className="text-slate-500">Zonas</p><p className="text-2xl font-bold">{zones.filter((item) => item.unidadeEducacaoId === selectedSchoolId).length}</p></div></div></CardContent></Card>
            </TabsContent>
          </Tabs>

          <Card className="h-fit border-amber-100 bg-white/85">
            <CardHeader><CardTitle>Unidade escolar</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                <SelectTrigger><SelectValue placeholder="Selecione a escola" /></SelectTrigger>
                <SelectContent>{schools.map((school) => <SelectItem key={school.id} value={school.id}>{school.nome}</SelectItem>)}</SelectContent>
              </Select>
              <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 text-sm text-slate-700">
                <p className="font-medium text-slate-900">ImplantaÃ§Ã£o</p>
                <p className="mt-2">Esta central jÃ¡ permite cadastrar cÃ¢mera, zona, biometria, evento de teste e regras de notificaÃ§Ã£o antes da integraÃ§Ã£o do conector de borda.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

