'use client';

/**
 * ============================================================================
 * GESTÃO DE MUNICÍPIOS (TENANTS) — Fase 5/8 Multi-Tenant
 * ============================================================================
 * Painel de plataforma: lista municípios com uso, provisiona novos (tenant +
 * admin inicial + secretarias + serviços padrão) e suspende/reativa.
 * Consome /api/super-admin/tenants (GET/POST/PATCH).
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Building2,
  Plus,
  Loader2,
  Users,
  FileText,
  UserCheck,
  Ban,
  CheckCircle,
  Globe,
  Copy,
} from 'lucide-react';

interface TenantRow {
  id: string;
  slug: string;
  nome: string;
  cnpj: string;
  nomeMunicipio: string;
  ufMunicipio: string;
  status: string;
  suspensionReason: string | null;
  plan: string;
  customDomain: string | null;
  createdAt: string;
  _counts: { users: number; citizens: number; protocols: number };
}

interface ProvisionResult {
  tenant: TenantRow;
  admin: { email: string; name: string };
  temporaryPassword: string;
  departmentsCreated: number;
  servicesCreated: number;
  accessUrl?: string;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Ativo', className: 'bg-green-100 text-green-800' },
  TRIAL: { label: 'Trial', className: 'bg-blue-100 text-blue-800' },
  SUSPENDED: { label: 'Suspenso', className: 'bg-red-100 text-red-800' },
  INACTIVE: { label: 'Inativo', className: 'bg-gray-200 text-gray-700' },
  EXPIRED: { label: 'Expirado', className: 'bg-orange-100 text-orange-800' },
  CANCELLED: { label: 'Cancelado', className: 'bg-gray-300 text-gray-800' },
};

const EMPTY_FORM = {
  slug: '',
  nome: '',
  cnpj: '',
  nomeMunicipio: '',
  ufMunicipio: '',
  adminName: '',
  adminEmail: '',
};

export default function TenantsPage() {
  const { toast } = useToast();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [provisioned, setProvisioned] = useState<ProvisionResult | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/super-admin/tenants');
      if (res.ok) {
        const data = await res.json();
        setTenants(data.tenants || []);
      }
    } catch (err) {
      console.error('Erro ao listar municípios:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProvision = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/super-admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: 'Erro ao provisionar',
          description: data.error || 'Verifique os dados informados',
          variant: 'destructive',
        });
        return;
      }
      setProvisioned(data as ProvisionResult);
      setForm({ ...EMPTY_FORM });
      setShowForm(false);
      fetchTenants();
      toast({ title: 'Município provisionado', description: `${data.tenant.nome} está pronto.` });
    } catch (err) {
      toast({ title: 'Erro de rede', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (t: TenantRow, status: 'ACTIVE' | 'SUSPENDED') => {
    setActingId(t.id);
    try {
      const res = await fetch(`/api/super-admin/tenants/${t.id}`, {
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
        const data = await res.json();
        toast({ title: 'Erro', description: data.error, variant: 'destructive' });
      }
    } finally {
      setActingId(null);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado' });
  };

  const setField = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" /> Municípios
          </h1>
          <p className="text-muted-foreground text-sm">
            Provisionamento e gestão dos tenants da plataforma
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4 mr-2" /> Novo município
        </Button>
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
            <p>
              <strong>Admin:</strong> {provisioned.admin.name} ({provisioned.admin.email})
            </p>
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

      {/* Formulário de provisionamento */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Provisionar novo município</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Slug (subdomínio)</Label>
                <Input placeholder="novaterra" value={form.slug} onChange={setField('slug')} />
              </div>
              <div>
                <Label>Nome oficial</Label>
                <Input placeholder="Prefeitura de Nova Terra" value={form.nome} onChange={setField('nome')} />
              </div>
              <div>
                <Label>CNPJ</Label>
                <Input placeholder="00.000.000/0001-00" value={form.cnpj} onChange={setField('cnpj')} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Label>Município</Label>
                  <Input placeholder="Nova Terra" value={form.nomeMunicipio} onChange={setField('nomeMunicipio')} />
                </div>
                <div>
                  <Label>UF</Label>
                  <Input placeholder="MG" maxLength={2} value={form.ufMunicipio} onChange={setField('ufMunicipio')} />
                </div>
              </div>
              <div>
                <Label>Nome do administrador</Label>
                <Input placeholder="Maria Silva" value={form.adminName} onChange={setField('adminName')} />
              </div>
              <div>
                <Label>Email do administrador</Label>
                <Input type="email" placeholder="admin@municipio.gov.br" value={form.adminEmail} onChange={setField('adminEmail')} />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleProvision} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Provisionar
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
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
                    {t.nomeMunicipio}/{t.ufMunicipio} · slug <code>{t.slug}</code> · plano {t.plan}
                    {t.customDomain ? <> · {t.customDomain}</> : null}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><UserCheck className="h-4 w-4" />{t._counts.users}</span>
                    <span className="flex items-center gap-1"><Users className="h-4 w-4" />{t._counts.citizens}</span>
                    <span className="flex items-center gap-1"><FileText className="h-4 w-4" />{t._counts.protocols}</span>
                  </div>
                  {t.status === 'SUSPENDED' && t.suspensionReason && (
                    <p className="text-xs text-red-700">{t.suspensionReason}</p>
                  )}
                  <div className="flex gap-2">
                    {t.status === 'SUSPENDED' ? (
                      <Button size="sm" variant="outline" disabled={actingId === t.id} onClick={() => handleStatus(t, 'ACTIVE')}>
                        {actingId === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                        Reativar
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        disabled={actingId === t.id || t.slug === 'default'}
                        onClick={() => handleStatus(t, 'SUSPENDED')}
                      >
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
