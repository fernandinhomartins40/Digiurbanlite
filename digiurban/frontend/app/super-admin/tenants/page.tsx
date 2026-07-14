'use client';

/**
 * ============================================================================
 * GESTÃO DE MUNICÍPIOS (TENANTS) — painel super-admin multi-tenant
 * ============================================================================
 * Lista municípios com uso + wizard de provisionamento em 6 passos
 * (dados → plano/limites → branding → módulos → admin → revisão). Restaura o
 * fluxo completo pré-single-tenant sobre o backend multi-tenant atual.
 * Consome /api/platform/tenants (GET/POST/PATCH) e navega para o detalhe.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Building2, Plus, Loader2, Users, FileText, UserCheck, Ban, CheckCircle,
  Globe, Copy, ArrowRight, ArrowLeft, CreditCard, Palette, LayoutGrid,
  UserPlus, ClipboardCheck, Settings2,
} from 'lucide-react';

interface TenantRow {
  id: string; slug: string; nome: string; cnpj: string;
  nomeMunicipio: string; ufMunicipio: string; status: string;
  suspensionReason: string | null; plan: string; customDomain: string | null;
  createdAt: string;
  _counts: { users: number; citizens: number; protocols: number };
}

interface ProvisionResult {
  tenant: TenantRow;
  admin: { email: string; name: string };
  temporaryPassword: string;
  departmentsCreated: number; servicesCreated: number;
  accessUrl?: string;
}

interface ModuleDef { slug: string; label: string; }

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Ativo', className: 'bg-green-100 text-green-800' },
  TRIAL: { label: 'Trial', className: 'bg-blue-100 text-blue-800' },
  SUSPENDED: { label: 'Suspenso', className: 'bg-red-100 text-red-800' },
  INACTIVE: { label: 'Inativo', className: 'bg-gray-200 text-gray-700' },
  EXPIRED: { label: 'Expirado', className: 'bg-orange-100 text-orange-800' },
  CANCELLED: { label: 'Cancelado', className: 'bg-gray-300 text-gray-800' },
};

const PLANS = [
  { value: 'basic', label: 'Básico', users: 10, citizens: 10000, price: 'R$ 299/mês' },
  { value: 'professional', label: 'Profissional', users: 50, citizens: 100000, price: 'R$ 799/mês' },
  { value: 'enterprise', label: 'Enterprise', users: 200, citizens: 1000000, price: 'R$ 1.999/mês' },
];

const STEPS = [
  { title: 'Dados', icon: Building2 },
  { title: 'Plano', icon: CreditCard },
  { title: 'Branding', icon: Palette },
  { title: 'Módulos', icon: LayoutGrid },
  { title: 'Administrador', icon: UserPlus },
  { title: 'Revisão', icon: ClipboardCheck },
];

const EMPTY_WIZARD = {
  slug: '', nome: '', cnpj: '', nomeMunicipio: '', ufMunicipio: '',
  codigoIbge: '', customDomain: '',
  plan: 'basic', maxUsers: 10, maxCitizens: 10000, planEndsAt: '',
  corPrimaria: '#2563eb', corSecundaria: '#f59e0b', logoUrl: '',
  disabledModules: [] as string[],
  adminName: '', adminEmail: '',
};

export default function TenantsPage() {
  const { toast } = useToast();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<ModuleDef[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ ...EMPTY_WIZARD });
  const [saving, setSaving] = useState(false);
  const [provisioned, setProvisioned] = useState<ProvisionResult | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [baseDomain, setBaseDomain] = useState<string | null>(null);
  const [subdomainEnabled, setSubdomainEnabled] = useState<boolean>(true);

  useEffect(() => {
    fetchTenants();
    fetch('/api/platform/modules')
      .then((r) => (r.ok ? r.json() : { modules: [] }))
      .then((d) => setModules(d.modules || []))
      .catch(() => setModules([]));
    fetch('/api/platform/platform-info')
      .then((r) => (r.ok ? r.json() : {}))
      .then((d: { tenantBaseDomain?: string | null; subdomainEnabled?: boolean }) => {
        setBaseDomain(d.tenantBaseDomain ?? null);
        setSubdomainEnabled(d.subdomainEnabled !== false);
      })
      .catch(() => {});
  }, []);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/platform/tenants');
      if (res.ok) setTenants((await res.json()).tenants || []);
    } catch (err) {
      console.error('Erro ao listar municípios:', err);
    } finally {
      setLoading(false);
    }
  };

  const set = <K extends keyof typeof EMPTY_WIZARD>(k: K, v: (typeof EMPTY_WIZARD)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const applyPlan = (planValue: string) => {
    const p = PLANS.find((x) => x.value === planValue);
    if (p) setForm((f) => ({ ...f, plan: p.value, maxUsers: p.users, maxCitizens: p.citizens }));
  };

  const toggleModule = (slug: string) =>
    setForm((f) => ({
      ...f,
      disabledModules: f.disabledModules.includes(slug)
        ? f.disabledModules.filter((s) => s !== slug)
        : [...f.disabledModules, slug],
    }));

  const stepValid = (): boolean => {
    if (step === 0)
      return !!(form.slug && form.nome && form.cnpj && form.nomeMunicipio && form.ufMunicipio.length === 2);
    if (step === 4) return !!(form.adminName && form.adminEmail.includes('@'));
    return true;
  };

  const resetWizard = () => {
    setForm({ ...EMPTY_WIZARD });
    setStep(0);
    setShowWizard(false);
  };

  const handleProvision = async () => {
    setSaving(true);
    try {
      // Módulos: apenas os DESABILITADOS entram como false (contrato do requireFeature)
      const features: Record<string, boolean> = {};
      for (const slug of form.disabledModules) features[slug] = false;

      const branding: Record<string, string> = {};
      if (form.corPrimaria) branding.corPrimaria = form.corPrimaria;
      if (form.corSecundaria) branding.corSecundaria = form.corSecundaria;
      if (form.logoUrl) branding.logoUrl = form.logoUrl;

      const payload = {
        slug: form.slug, nome: form.nome, cnpj: form.cnpj,
        nomeMunicipio: form.nomeMunicipio, ufMunicipio: form.ufMunicipio,
        codigoIbge: form.codigoIbge || undefined,
        customDomain: form.customDomain || undefined,
        plan: form.plan, maxUsers: form.maxUsers, maxCitizens: form.maxCitizens,
        planEndsAt: form.planEndsAt || undefined,
        features: Object.keys(features).length ? features : undefined,
        branding: Object.keys(branding).length ? branding : undefined,
        adminName: form.adminName, adminEmail: form.adminEmail,
      };

      const res = await fetch('/api/platform/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Erro ao provisionar', description: data.error || 'Verifique os dados', variant: 'destructive' });
        return;
      }
      setProvisioned(data as ProvisionResult);
      resetWizard();
      fetchTenants();
      toast({ title: 'Município provisionado', description: `${data.tenant.nome} está pronto.` });
    } catch {
      toast({ title: 'Erro de rede', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (t: TenantRow, status: 'ACTIVE' | 'SUSPENDED') => {
    setActingId(t.id);
    try {
      const res = await fetch(`/api/platform/tenants/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          status === 'SUSPENDED'
            ? { status, suspensionReason: 'Suspenso pelo painel de plataforma' }
            : { status, suspensionReason: null }
        ),
      });
      if (res.ok) {
        toast({ title: status === 'SUSPENDED' ? 'Município suspenso' : 'Município reativado' });
        fetchTenants();
      } else {
        toast({ title: 'Erro', description: (await res.json()).error, variant: 'destructive' });
      }
    } finally {
      setActingId(null);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado' });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" /> Municípios
          </h1>
          <p className="text-muted-foreground text-sm">
            Provisionamento e gestão dos municípios da plataforma
          </p>
        </div>
        {!showWizard && (
          <Button onClick={() => setShowWizard(true)}>
            <Plus className="h-4 w-4 mr-2" /> Novo município
          </Button>
        )}
      </div>

      {/* Credenciais do provisionamento — exibidas UMA única vez */}
      {provisioned && (
        <Card className="border-green-300 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900 text-base flex items-center gap-2">
              <CheckCircle className="h-5 w-5" /> {provisioned.tenant.nome} provisionado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Admin:</strong> {provisioned.admin.name} ({provisioned.admin.email})</p>
            <p className="flex items-center gap-2">
              <strong>Senha temporária:</strong>
              <code className="bg-white border rounded px-2 py-0.5">{provisioned.temporaryPassword}</code>
              <Button size="sm" variant="ghost" onClick={() => copy(provisioned.temporaryPassword)}>
                <Copy className="h-3 w-3" />
              </Button>
            </p>
            {provisioned.accessUrl && (
              <p className="flex items-center gap-2">
                <Globe className="h-4 w-4" /> <a className="underline" href={provisioned.accessUrl}>{provisioned.accessUrl}</a>
              </p>
            )}
            <p className="text-green-800">
              {provisioned.departmentsCreated} secretarias e {provisioned.servicesCreated} serviços criados.
              A senha não será exibida novamente — o admin trocará no primeiro login.
            </p>
            <Button size="sm" variant="outline" onClick={() => setProvisioned(null)}>
              Entendi, ocultar credenciais
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Wizard de provisionamento */}
      {showWizard && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-3">
              <CardTitle className="text-base">Provisionar novo município</CardTitle>
              <Button size="sm" variant="ghost" onClick={resetWizard}>Cancelar</Button>
            </div>
            <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />
            <div className="flex justify-between mt-3">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const active = i === step;
                const done = i < step;
                return (
                  <div key={s.title} className={`flex flex-col items-center gap-1 text-xs ${active ? 'text-primary font-medium' : done ? 'text-green-600' : 'text-muted-foreground'}`}>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center border ${active ? 'border-primary bg-primary/10' : done ? 'border-green-600 bg-green-50' : 'border-muted'}`}>
                      {done ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <span className="hidden sm:block">{s.title}</span>
                  </div>
                );
              })}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Passo 0 — Dados */}
            {step === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Slug (subdomínio) *</Label>
                  <Input placeholder="novaterra" value={form.slug} onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} />
                </div>
                <div>
                  <Label>Nome oficial *</Label>
                  <Input placeholder="Prefeitura de Nova Terra" value={form.nome} onChange={(e) => set('nome', e.target.value)} />
                </div>
                <div>
                  <Label>CNPJ *</Label>
                  <Input placeholder="00.000.000/0001-00" value={form.cnpj} onChange={(e) => set('cnpj', e.target.value)} />
                </div>
                <div>
                  <Label>Código IBGE</Label>
                  <Input placeholder="3550308" value={form.codigoIbge} onChange={(e) => set('codigoIbge', e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Label>Município *</Label>
                    <Input placeholder="Nova Terra" value={form.nomeMunicipio} onChange={(e) => set('nomeMunicipio', e.target.value)} />
                  </div>
                  <div>
                    <Label>UF *</Label>
                    <Input placeholder="MG" maxLength={2} value={form.ufMunicipio} onChange={(e) => set('ufMunicipio', e.target.value.toUpperCase())} />
                  </div>
                </div>
                <div>
                  <Label>Domínio próprio (opcional)</Label>
                  <Input placeholder="portal.cidade.mg.gov.br" value={form.customDomain} onChange={(e) => set('customDomain', e.target.value)} />
                  <p className="text-xs text-muted-foreground mt-1">Se a prefeitura tem domínio próprio. Deixe vazio para usar o subdomínio.</p>
                </div>

                {/* Endereço da prefeitura (subdomínio) — prévia em tempo real */}
                <div className="md:col-span-2">
                  <Label>Endereço da prefeitura</Label>
                  <div className="rounded-lg border p-3 bg-muted/30 flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    {baseDomain ? (
                      <code className="font-medium">
                        https://{form.slug || '{slug}'}.{baseDomain}
                      </code>
                    ) : (
                      <span className="text-muted-foreground">
                        {form.customDomain
                          ? <>domínio próprio: <code>https://{form.customDomain}</code></>
                          : 'o subdomínio será {slug}.<domínio-base>'}
                      </span>
                    )}
                  </div>
                  {!subdomainEnabled && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ O domínio base ainda não está configurado no servidor (TENANT_BASE_DOMAIN).
                      O município será criado, mas o subdomínio só responderá após a configuração de infraestrutura (DNS + TLS + env).
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Passo 1 — Plano */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {PLANS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => applyPlan(p.value)}
                      className={`text-left border rounded-lg p-4 transition ${form.plan === p.value ? 'border-primary ring-2 ring-primary/30 bg-primary/5' : 'hover:border-primary/50'}`}
                    >
                      <div className="font-semibold">{p.label}</div>
                      <div className="text-primary text-lg font-bold">{p.price}</div>
                      <div className="text-xs text-muted-foreground mt-2">
                        {p.users} usuários · {p.citizens.toLocaleString('pt-BR')} cidadãos
                      </div>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Máx. usuários</Label>
                    <Input type="number" value={form.maxUsers} onChange={(e) => set('maxUsers', Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>Máx. cidadãos</Label>
                    <Input type="number" value={form.maxCitizens} onChange={(e) => set('maxCitizens', Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>Validade do plano</Label>
                    <Input type="date" value={form.planEndsAt} onChange={(e) => set('planEndsAt', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* Passo 2 — Branding */}
            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Cor primária</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={form.corPrimaria} onChange={(e) => set('corPrimaria', e.target.value)} className="h-10 w-14 rounded border" />
                    <Input value={form.corPrimaria} onChange={(e) => set('corPrimaria', e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Cor secundária</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={form.corSecundaria} onChange={(e) => set('corSecundaria', e.target.value)} className="h-10 w-14 rounded border" />
                    <Input value={form.corSecundaria} onChange={(e) => set('corSecundaria', e.target.value)} />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label>URL do logo (opcional)</Label>
                  <Input placeholder="https://.../logo.png" value={form.logoUrl} onChange={(e) => set('logoUrl', e.target.value)} />
                </div>
                <div className="md:col-span-2 flex items-center gap-3 p-3 rounded-lg border">
                  <div className="h-10 w-10 rounded" style={{ background: form.corPrimaria }} />
                  <div className="h-10 w-10 rounded" style={{ background: form.corSecundaria }} />
                  <span className="text-sm text-muted-foreground">Prévia das cores do município</span>
                </div>
              </div>
            )}

            {/* Passo 3 — Módulos */}
            {step === 3 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Todos os módulos vêm habilitados. Desmarque os que este município NÃO deve acessar.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {modules.map((m) => {
                    const enabled = !form.disabledModules.includes(m.slug);
                    return (
                      <label key={m.slug} className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer ${enabled ? 'border-primary/40 bg-primary/5' : 'opacity-60'}`}>
                        <Checkbox checked={enabled} onCheckedChange={() => toggleModule(m.slug)} />
                        <span className="text-sm">{m.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Passo 4 — Admin */}
            {step === 4 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome do administrador *</Label>
                  <Input placeholder="Maria Silva" value={form.adminName} onChange={(e) => set('adminName', e.target.value)} />
                </div>
                <div>
                  <Label>Email do administrador *</Label>
                  <Input type="email" placeholder="admin@municipio.gov.br" value={form.adminEmail} onChange={(e) => set('adminEmail', e.target.value)} />
                </div>
                <p className="md:col-span-2 text-xs text-muted-foreground">
                  Uma senha temporária será gerada e exibida uma única vez. O admin a troca no primeiro acesso.
                </p>
              </div>
            )}

            {/* Passo 5 — Revisão */}
            {step === 5 && (
              <div className="space-y-3 text-sm">
                <ReviewRow label="Município" value={`${form.nome} — ${form.nomeMunicipio}/${form.ufMunicipio}`} />
                <ReviewRow label="Slug / Domínio" value={`${form.slug}${form.customDomain ? ` · ${form.customDomain}` : ''}`} />
                <ReviewRow label="CNPJ" value={form.cnpj} />
                <ReviewRow label="Plano" value={`${PLANS.find((p) => p.value === form.plan)?.label} · ${form.maxUsers} usuários · ${form.maxCitizens.toLocaleString('pt-BR')} cidadãos${form.planEndsAt ? ` · até ${form.planEndsAt}` : ''}`} />
                <ReviewRow label="Módulos desabilitados" value={form.disabledModules.length ? form.disabledModules.map((s) => modules.find((m) => m.slug === s)?.label || s).join(', ') : 'nenhum (todos habilitados)'} />
                <ReviewRow label="Administrador" value={`${form.adminName} (${form.adminEmail})`} />
              </div>
            )}

            {/* Navegação */}
            <div className="flex justify-between pt-2 border-t">
              <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
              </Button>
              {step < STEPS.length - 1 ? (
                <Button disabled={!stepValid()} onClick={() => setStep((s) => s + 1)}>
                  Próximo <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button disabled={saving} onClick={handleProvision}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Provisionar município
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Carregando municípios...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tenants.map((t) => {
            const badge = STATUS_BADGE[t.status] || STATUS_BADGE.INACTIVE;
            return (
              <Card key={t.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{t.nome}</CardTitle>
                    <Badge className={badge.className}>{badge.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t.nomeMunicipio}/{t.ufMunicipio} · plano {t.plan}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Endereço da prefeitura */}
                  {(() => {
                    const url = t.customDomain
                      ? `https://${t.customDomain}`
                      : baseDomain
                      ? `https://${t.slug}.${baseDomain}`
                      : null;
                    return (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        {url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                            {url.replace('https://', '')}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">slug <code>{t.slug}</code></span>
                        )}
                      </div>
                    );
                  })()}
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><UserCheck className="h-4 w-4" />{t._counts.users}</span>
                    <span className="flex items-center gap-1"><Users className="h-4 w-4" />{t._counts.citizens}</span>
                    <span className="flex items-center gap-1"><FileText className="h-4 w-4" />{t._counts.protocols}</span>
                  </div>
                  {t.status === 'SUSPENDED' && t.suspensionReason && (
                    <p className="text-xs text-red-700">{t.suspensionReason}</p>
                  )}
                  <div className="flex gap-2">
                    <Link href={`/super-admin/tenants/${t.id}`}>
                      <Button size="sm" variant="outline">
                        <Settings2 className="h-3 w-3 mr-1" /> Gerenciar
                      </Button>
                    </Link>
                    {t.status === 'SUSPENDED' ? (
                      <Button size="sm" variant="outline" disabled={actingId === t.id} onClick={() => handleStatus(t, 'ACTIVE')}>
                        {actingId === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                        Reativar
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="text-red-600"
                        disabled={actingId === t.id || t.slug === 'default'}
                        onClick={() => handleStatus(t, 'SUSPENDED')}>
                        {actingId === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban className="h-3 w-3 mr-1" />}
                        Suspender
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {tenants.length === 0 && (
            <p className="text-muted-foreground col-span-full text-center py-8">
              Nenhum município cadastrado.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
