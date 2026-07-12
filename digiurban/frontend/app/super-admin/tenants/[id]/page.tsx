'use client';

/**
 * ============================================================================
 * DETALHE DO MUNICÍPIO — painel super-admin
 * ============================================================================
 * Uso vs limites, plano/limites editáveis, branding, módulos (toggle),
 * suspensão, administradores (criar / reset de senha / ativar) e faturas.
 * Consome /api/super-admin/tenants/:id e sub-recursos.
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Loader2, Save, Ban, CheckCircle, UserPlus, KeyRound, Copy,
  Users, FileText, UserCheck, Building2, CreditCard, Plus, Globe,
} from 'lucide-react';

interface Admin {
  id: string; name: string; email: string; role: string; isActive: boolean;
  mustChangePassword: boolean; lastLogin: string | null; createdAt: string;
}
interface Invoice {
  id: string; number: string; amount: number; plan: string; period: string;
  status: string; dueDate: string; paidAt: string | null; description: string | null;
}
interface TenantDetail {
  id: string; slug: string; nome: string; cnpj: string; nomeMunicipio: string;
  ufMunicipio: string; status: string; suspensionReason: string | null;
  plan: string; planEndsAt: string | null; customDomain: string | null;
  maxUsers: number; maxCitizens: number;
  features: Record<string, unknown> | null;
  branding: Record<string, string> | null;
  usage: { users: number; citizens: number; protocols: number; maxUsers: number; maxCitizens: number };
  admins: Admin[];
}

const MODULES_FALLBACK: Array<{ slug: string; label: string }> = [];
const INVOICE_BADGE: Record<string, string> = {
  PAID: 'bg-green-100 text-green-800', PENDING: 'bg-yellow-100 text-yellow-800',
  OVERDUE: 'bg-orange-100 text-orange-800', CANCELLED: 'bg-gray-200 text-gray-700',
  FAILED: 'bg-red-100 text-red-800',
};

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [modules, setModules] = useState(MODULES_FALLBACK);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tempPassword, setTempPassword] = useState<{ label: string; value: string } | null>(null);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '' });

  // Estado editável
  const [plan, setPlan] = useState('basic');
  const [maxUsers, setMaxUsers] = useState(10);
  const [maxCitizens, setMaxCitizens] = useState(10000);
  const [planEndsAt, setPlanEndsAt] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [slug, setSlug] = useState('');
  const [corPrimaria, setCorPrimaria] = useState('#2563eb');
  const [corSecundaria, setCorSecundaria] = useState('#f59e0b');
  const [disabled, setDisabled] = useState<string[]>([]);
  const [baseDomain, setBaseDomain] = useState<string | null>(null);
  const [subdomainEnabled, setSubdomainEnabled] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, mRes, iRes, pRes] = await Promise.all([
        fetch(`/api/super-admin/tenants/${id}`),
        fetch('/api/super-admin/modules'),
        fetch(`/api/super-admin/tenants/${id}/invoices`),
        fetch('/api/super-admin/platform-info'),
      ]);
      if (tRes.ok) {
        const t: TenantDetail = (await tRes.json()).tenant;
        setTenant(t);
        setPlan(t.plan);
        setMaxUsers(t.maxUsers);
        setMaxCitizens(t.maxCitizens);
        setPlanEndsAt(t.planEndsAt ? t.planEndsAt.slice(0, 10) : '');
        setCustomDomain(t.customDomain || '');
        setSlug(t.slug);
        setCorPrimaria(t.branding?.corPrimaria || '#2563eb');
        setCorSecundaria(t.branding?.corSecundaria || '#f59e0b');
        const feats = t.features || {};
        setDisabled(Object.keys(feats).filter((k) => feats[k] === false));
      }
      if (mRes.ok) setModules((await mRes.json()).modules || []);
      if (iRes.ok) setInvoices((await iRes.json()).invoices || []);
      if (pRes.ok) {
        const p = await pRes.json();
        setBaseDomain(p.tenantBaseDomain ?? null);
        setSubdomainEnabled(p.subdomainEnabled !== false);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const patchTenant = async (body: Record<string, unknown>, successMsg: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/super-admin/tenants/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (res.ok) { toast({ title: successMsg }); load(); }
      else toast({ title: 'Erro', description: (await res.json()).error, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const saveConfig = () => {
    const features: Record<string, boolean> = {};
    for (const s of disabled) features[s] = false;
    const branding: Record<string, string> = { corPrimaria, corSecundaria };
    if (tenant?.branding?.logoUrl) branding.logoUrl = tenant.branding.logoUrl;
    patchTenant(
      { plan, maxUsers, maxCitizens, planEndsAt: planEndsAt || null, features, branding },
      'Configurações salvas'
    );
  };

  // Endereço da prefeitura: slug (subdomínio) + domínio próprio
  const saveAddress = () => {
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (cleanSlug.length < 3) {
      toast({ title: 'Slug inválido', description: 'Mínimo de 3 caracteres (a-z, 0-9, hífen)', variant: 'destructive' });
      return;
    }
    patchTenant(
      { slug: cleanSlug, customDomain: customDomain || undefined },
      'Endereço atualizado'
    );
  };

  const toggleModule = (moduleSlug: string) =>
    setDisabled((d) => (d.includes(moduleSlug) ? d.filter((s) => s !== moduleSlug) : [...d, moduleSlug]));

  const suspend = () => patchTenant({ status: 'SUSPENDED', suspensionReason: 'Suspenso pelo painel de plataforma' }, 'Município suspenso');
  const reactivate = () => patchTenant({ status: 'ACTIVE', suspensionReason: null }, 'Município reativado');

  const addAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email.includes('@')) {
      toast({ title: 'Preencha nome e email válidos', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/super-admin/tenants/${id}/admins`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAdmin),
      });
      const data = await res.json();
      if (res.ok) {
        setTempPassword({ label: `Senha de ${data.admin.name}`, value: data.admin.temporaryPassword });
        setNewAdmin({ name: '', email: '' });
        load();
        toast({ title: 'Administrador criado' });
      } else toast({ title: 'Erro', description: data.error, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const resetPassword = async (userId: string, name: string) => {
    const res = await fetch(`/api/super-admin/tenants/${id}/users/${userId}/reset-password`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) setTempPassword({ label: `Nova senha de ${name}`, value: data.temporaryPassword });
    else toast({ title: 'Erro', description: data.error, variant: 'destructive' });
  };

  const toggleUserActive = async (userId: string, isActive: boolean) => {
    const res = await fetch(`/api/super-admin/tenants/${id}/users/${userId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive }),
    });
    if (res.ok) load();
  };

  const generateInvoice = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/super-admin/tenants/${id}/invoices`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (res.ok) { toast({ title: 'Fatura gerada' }); load(); }
      else toast({ title: 'Erro', description: (await res.json()).error, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const setInvoiceStatus = async (invoiceId: string, status: string) => {
    const res = await fetch(`/api/super-admin/invoices/${invoiceId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    });
    if (res.ok) load();
  };

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast({ title: 'Copiado' }); };

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Carregando...</div>;
  }
  if (!tenant) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Município não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/super-admin/tenants')}>Voltar</Button>
      </div>
    );
  }

  const usersPct = Math.min(100, Math.round((tenant.usage.users / Math.max(1, tenant.usage.maxUsers)) * 100));
  const citizensPct = Math.min(100, Math.round((tenant.usage.citizens / Math.max(1, tenant.usage.maxCitizens)) * 100));

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/super-admin/tenants"><Button size="sm" variant="ghost"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="h-6 w-6" /> {tenant.nome}</h1>
            <p className="text-sm text-muted-foreground">{tenant.nomeMunicipio}/{tenant.ufMunicipio} · slug <code>{tenant.slug}</code> · {tenant.status}</p>
          </div>
        </div>
        {tenant.status === 'SUSPENDED' ? (
          <Button variant="outline" onClick={reactivate} disabled={saving}><CheckCircle className="h-4 w-4 mr-2" /> Reativar</Button>
        ) : (
          <Button variant="outline" className="text-red-600" onClick={suspend} disabled={saving || tenant.slug === 'default'}><Ban className="h-4 w-4 mr-2" /> Suspender</Button>
        )}
      </div>

      {tempPassword && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="flex items-center gap-3 py-4 text-sm">
            <KeyRound className="h-4 w-4 text-green-700" />
            <strong>{tempPassword.label}:</strong>
            <code className="bg-white border rounded px-2 py-0.5">{tempPassword.value}</code>
            <Button size="sm" variant="ghost" onClick={() => copy(tempPassword.value)}><Copy className="h-3 w-3" /></Button>
            <Button size="sm" variant="outline" className="ml-auto" onClick={() => setTempPassword(null)}>Ocultar</Button>
          </CardContent>
        </Card>
      )}

      {/* Uso */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UsageCard icon={UserCheck} label="Usuários" value={tenant.usage.users} max={tenant.usage.maxUsers} pct={usersPct} />
        <UsageCard icon={Users} label="Cidadãos" value={tenant.usage.citizens} max={tenant.usage.maxCitizens} pct={citizensPct} />
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><FileText className="h-4 w-4" /> Protocolos</div>
            <div className="text-2xl font-bold mt-1">{tenant.usage.protocols.toLocaleString('pt-BR')}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="config">
        <TabsList>
          <TabsTrigger value="config">Plano & Configuração</TabsTrigger>
          <TabsTrigger value="address">Endereço</TabsTrigger>
          <TabsTrigger value="modules">Módulos</TabsTrigger>
          <TabsTrigger value="admins">Administradores</TabsTrigger>
          <TabsTrigger value="billing">Faturas</TabsTrigger>
        </TabsList>

        {/* Config + branding */}
        <TabsContent value="config">
          <Card>
            <CardHeader><CardTitle className="text-base">Plano, limites e branding</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Plano</Label>
                  <select className="w-full h-10 border rounded-md px-2" value={plan} onChange={(e) => setPlan(e.target.value)}>
                    <option value="basic">Básico</option>
                    <option value="professional">Profissional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div><Label>Máx. usuários</Label><Input type="number" value={maxUsers} onChange={(e) => setMaxUsers(Number(e.target.value))} /></div>
                <div><Label>Máx. cidadãos</Label><Input type="number" value={maxCitizens} onChange={(e) => setMaxCitizens(Number(e.target.value))} /></div>
                <div><Label>Validade</Label><Input type="date" value={planEndsAt} onChange={(e) => setPlanEndsAt(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Cor primária</Label>
                  <div className="flex gap-2 items-center"><input type="color" value={corPrimaria} onChange={(e) => setCorPrimaria(e.target.value)} className="h-10 w-14 rounded border" /><Input value={corPrimaria} onChange={(e) => setCorPrimaria(e.target.value)} /></div>
                </div>
                <div>
                  <Label>Cor secundária</Label>
                  <div className="flex gap-2 items-center"><input type="color" value={corSecundaria} onChange={(e) => setCorSecundaria(e.target.value)} className="h-10 w-14 rounded border" /><Input value={corSecundaria} onChange={(e) => setCorSecundaria(e.target.value)} /></div>
                </div>
              </div>
              <Button onClick={saveConfig} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Salvar configuração</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Endereço — subdomínio (slug) + domínio próprio */}
        <TabsContent value="address">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" /> Endereço da prefeitura</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* URL efetiva */}
              <div className="rounded-lg border p-4 bg-muted/30">
                <div className="text-xs text-muted-foreground mb-1">Endereço atual</div>
                {(() => {
                  const url = customDomain
                    ? `https://${customDomain}`
                    : baseDomain
                    ? `https://${slug}.${baseDomain}`
                    : null;
                  return url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium flex items-center gap-1.5">
                      <Globe className="h-4 w-4" /> {url}
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-sm">slug <code>{slug}</code> (domínio base não configurado)</span>
                  );
                })()}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Slug (subdomínio)</Label>
                  <div className="flex items-center gap-1">
                    <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} disabled={tenant.slug === 'default'} />
                    {baseDomain && <span className="text-sm text-muted-foreground whitespace-nowrap">.{baseDomain}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tenant.slug === 'default' ? 'O município padrão não pode alterar o slug.' : 'Alterar o slug muda o endereço de acesso da prefeitura.'}
                  </p>
                </div>
                <div>
                  <Label>Domínio próprio (opcional)</Label>
                  <Input value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder="portal.cidade.gov.br" />
                  <p className="text-xs text-muted-foreground mt-1">Sobrepõe o subdomínio. Requer o DNS do domínio apontando para a plataforma.</p>
                </div>
              </div>

              {!subdomainEnabled && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
                  ⚠️ O domínio base (TENANT_BASE_DOMAIN) ainda não está configurado no servidor. O slug é salvo, mas o
                  subdomínio só responderá após a configuração de infraestrutura (DNS wildcard + TLS + variável de ambiente).
                </div>
              )}

              <Button onClick={saveAddress} disabled={saving || tenant.slug === 'default'}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Salvar endereço
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Módulos */}
        <TabsContent value="modules">
          <Card>
            <CardHeader><CardTitle className="text-base">Módulos habilitados</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Desmarque os módulos que este município não deve acessar (API + menu).</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {modules.map((m) => {
                  const enabled = !disabled.includes(m.slug);
                  return (
                    <label key={m.slug} className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer ${enabled ? 'border-primary/40 bg-primary/5' : 'opacity-60'}`}>
                      <Checkbox checked={enabled} onCheckedChange={() => toggleModule(m.slug)} />
                      <span className="text-sm">{m.label}</span>
                    </label>
                  );
                })}
              </div>
              <Button onClick={saveConfig} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Salvar módulos</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admins */}
        <TabsContent value="admins">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserPlus className="h-4 w-4" /> Novo administrador</CardTitle></CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-3 md:items-end">
              <div className="flex-1"><Label>Nome</Label><Input value={newAdmin.name} onChange={(e) => setNewAdmin((a) => ({ ...a, name: e.target.value }))} /></div>
              <div className="flex-1"><Label>Email</Label><Input type="email" value={newAdmin.email} onChange={(e) => setNewAdmin((a) => ({ ...a, email: e.target.value }))} /></div>
              <Button onClick={addAdmin} disabled={saving}><Plus className="h-4 w-4 mr-2" /> Criar</Button>
            </CardContent>
          </Card>
          <div className="mt-4 space-y-2">
            {tenant.admins.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium text-sm flex items-center gap-2">
                      {a.name} <Badge variant="outline">{a.role}</Badge>
                      {!a.isActive && <Badge className="bg-gray-200 text-gray-700">inativo</Badge>}
                      {a.mustChangePassword && <Badge className="bg-yellow-100 text-yellow-800">senha temporária</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">{a.email} · último acesso {a.lastLogin ? new Date(a.lastLogin).toLocaleDateString('pt-BR') : 'nunca'}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => resetPassword(a.id, a.name)}><KeyRound className="h-3 w-3 mr-1" /> Resetar senha</Button>
                    <Button size="sm" variant="outline" onClick={() => toggleUserActive(a.id, !a.isActive)}>{a.isActive ? 'Desativar' : 'Ativar'}</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Billing */}
        <TabsContent value="billing">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" /> Faturas</CardTitle>
              <Button size="sm" onClick={generateInvoice} disabled={saving}><Plus className="h-4 w-4 mr-2" /> Gerar fatura do plano</Button>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Nenhuma fatura emitida.</p>
              ) : (
                <div className="space-y-2">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between border rounded-lg p-3 text-sm">
                      <div>
                        <div className="font-medium">{inv.number} · {inv.period}</div>
                        <div className="text-xs text-muted-foreground">
                          R$ {inv.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} · vence {new Date(inv.dueDate).toLocaleDateString('pt-BR')}
                          {inv.paidAt ? ` · pago em ${new Date(inv.paidAt).toLocaleDateString('pt-BR')}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={INVOICE_BADGE[inv.status] || 'bg-gray-100'}>{inv.status}</Badge>
                        {inv.status === 'PENDING' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => setInvoiceStatus(inv.id, 'PAID')}>Marcar paga</Button>
                            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setInvoiceStatus(inv.id, 'CANCELLED')}>Cancelar</Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UsageCard({ icon: Icon, label, value, max, pct }: { icon: any; label: string; value: number; max: number; pct: number }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center gap-2 text-muted-foreground text-sm"><Icon className="h-4 w-4" /> {label}</div>
        <div className="text-2xl font-bold mt-1">{value.toLocaleString('pt-BR')} <span className="text-sm font-normal text-muted-foreground">/ {max.toLocaleString('pt-BR')}</span></div>
        <Progress value={pct} className={`h-2 mt-2 ${pct >= 90 ? '[&>div]:bg-red-500' : ''}`} />
      </CardContent>
    </Card>
  );
}
