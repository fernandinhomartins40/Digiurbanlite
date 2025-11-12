'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Building2,
  Save,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Loader2
} from 'lucide-react';

interface MunicipioConfig {
  id: string;
  nome: string;
  cnpj: string;
  codigoIbge: string | null;
  nomeMunicipio: string;
  ufMunicipio: string;
  brasao: string | null;
  corPrimaria: string | null;
  isActive: boolean;
  isSuspended: boolean;
  suspensionReason: string | null;
  paymentStatus: string;
  subscriptionPlan: string;
  subscriptionEnds: string | null;
  maxUsers: number;
  maxCitizens: number;
  features: any;
  createdAt: string;
  updatedAt: string;
}

export default function MunicipioPage() {
  const { toast } = useToast();
  const [municipio, setMunicipio] = useState<MunicipioConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<MunicipioConfig>>({});

  useEffect(() => {
    fetchMunicipio();
  }, []);

  const fetchMunicipio = async () => {
    try {
      const response = await fetch('/api/super-admin/municipio');
      if (response.ok) {
        const data = await response.json();
        setMunicipio(data.data);
        setFormData(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar município:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do município',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/super-admin/municipio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setMunicipio(data.data);
        setFormData(data.data);
        setEditing(false);
        toast({
          title: 'Sucesso',
          description: 'Configurações do município atualizadas com sucesso'
        });
      } else {
        throw new Error('Erro ao salvar');
      }
    } catch (error) {
      console.error('Erro ao salvar município:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as alterações',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSuspend = async () => {
    const reason = prompt('Motivo da suspensão:');
    if (!reason) return;

    try {
      const response = await fetch('/api/super-admin/municipio/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        fetchMunicipio();
        toast({
          title: 'Município Suspenso',
          description: 'O município foi suspenso com sucesso'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível suspender o município',
        variant: 'destructive'
      });
    }
  };

  const handleActivate = async () => {
    try {
      const response = await fetch('/api/super-admin/municipio/activate', {
        method: 'POST'
      });

      if (response.ok) {
        fetchMunicipio();
        toast({
          title: 'Município Ativado',
          description: 'O município foi ativado com sucesso'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível ativar o município',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações do Município</h1>
          <p className="text-gray-600">Gerencie as configurações e limites do município</p>
        </div>
        <div className="flex gap-2">
          {!editing ? (
            <Button onClick={() => setEditing(true)} variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          ) : (
            <>
              <Button onClick={() => {
                setEditing(false);
                setFormData(municipio || {});
              }} variant="outline">
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status Card */}
      <Card className={`border-l-4 ${municipio?.isSuspended ? 'border-l-red-600' : municipio?.isActive ? 'border-l-green-600' : 'border-l-gray-600'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <CardTitle className="text-2xl">{municipio?.nomeMunicipio} - {municipio?.ufMunicipio}</CardTitle>
                <p className="text-sm text-gray-500">{municipio?.nome}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {municipio?.isSuspended && (
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Suspenso
                </span>
              )}
              {municipio?.isActive && !municipio?.isSuspended && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Ativo
                </span>
              )}
              {!municipio?.isActive && !municipio?.isSuspended && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                  Inativo
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-500">CNPJ</Label>
              <p className="text-lg font-semibold">{municipio?.cnpj}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Código IBGE</Label>
              <p className="text-lg font-semibold">{municipio?.codigoIbge || '-'}</p>
            </div>
          </div>
          {municipio?.isSuspended && municipio?.suspensionReason && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900">Motivo da Suspensão:</p>
                  <p className="text-sm text-red-700">{municipio.suspensionReason}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome do Órgão</Label>
              <Input
                id="nome"
                value={formData.nome || ''}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                disabled={!editing}
              />
            </div>
            <div>
              <Label htmlFor="nomeMunicipio">Nome do Município</Label>
              <Input
                id="nomeMunicipio"
                value={formData.nomeMunicipio || ''}
                onChange={(e) => setFormData({ ...formData, nomeMunicipio: e.target.value })}
                disabled={!editing}
              />
            </div>
            <div>
              <Label htmlFor="ufMunicipio">UF</Label>
              <Input
                id="ufMunicipio"
                value={formData.ufMunicipio || ''}
                onChange={(e) => setFormData({ ...formData, ufMunicipio: e.target.value })}
                disabled={!editing}
                maxLength={2}
              />
            </div>
            <div>
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={formData.cnpj || ''}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                disabled={!editing}
              />
            </div>
            <div>
              <Label htmlFor="codigoIbge">Código IBGE</Label>
              <Input
                id="codigoIbge"
                value={formData.codigoIbge || ''}
                onChange={(e) => setFormData({ ...formData, codigoIbge: e.target.value })}
                disabled={!editing}
              />
            </div>
            <div>
              <Label htmlFor="corPrimaria">Cor Primária</Label>
              <div className="flex gap-2">
                <Input
                  id="corPrimaria"
                  type="color"
                  value={formData.corPrimaria || '#3b82f6'}
                  onChange={(e) => setFormData({ ...formData, corPrimaria: e.target.value })}
                  disabled={!editing}
                  className="w-20"
                />
                <Input
                  value={formData.corPrimaria || '#3b82f6'}
                  onChange={(e) => setFormData({ ...formData, corPrimaria: e.target.value })}
                  disabled={!editing}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Limites e Assinatura */}
      <Card>
        <CardHeader>
          <CardTitle>Limites e Assinatura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="maxUsers">Máximo de Usuários</Label>
              <Input
                id="maxUsers"
                type="number"
                value={formData.maxUsers || 0}
                onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) })}
                disabled={!editing}
              />
            </div>
            <div>
              <Label htmlFor="maxCitizens">Máximo de Cidadãos</Label>
              <Input
                id="maxCitizens"
                type="number"
                value={formData.maxCitizens || 0}
                onChange={(e) => setFormData({ ...formData, maxCitizens: parseInt(e.target.value) })}
                disabled={!editing}
              />
            </div>
            <div>
              <Label htmlFor="subscriptionPlan">Plano</Label>
              <select
                id="subscriptionPlan"
                value={formData.subscriptionPlan || 'basic'}
                onChange={(e) => setFormData({ ...formData, subscriptionPlan: e.target.value })}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
              >
                <option value="basic">Básico</option>
                <option value="professional">Profissional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <Label htmlFor="subscriptionEnds">Data de Renovação</Label>
              <Input
                id="subscriptionEnds"
                type="date"
                value={formData.subscriptionEnds ? new Date(formData.subscriptionEnds).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, subscriptionEnds: e.target.value })}
                disabled={!editing}
              />
            </div>
            <div>
              <Label htmlFor="paymentStatus">Status de Pagamento</Label>
              <select
                id="paymentStatus"
                value={formData.paymentStatus || 'active'}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
              >
                <option value="active">Ativo</option>
                <option value="pending">Pendente</option>
                <option value="overdue">Vencido</option>
                <option value="suspended">Suspenso</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações Críticas */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-700">Ações Críticas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {municipio?.isSuspended ? (
              <Button onClick={handleActivate} variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                <CheckCircle className="h-4 w-4 mr-2" />
                Ativar Município
              </Button>
            ) : (
              <Button onClick={handleSuspend} variant="outline" className="border-red-600 text-red-600 hover:bg-red-50">
                <XCircle className="h-4 w-4 mr-2" />
                Suspender Município
              </Button>
            )}
          </div>
          <p className="text-sm text-gray-500">
            <AlertTriangle className="h-4 w-4 inline mr-1" />
            Suspender o município bloqueará o acesso ao sistema para todos os usuários e cidadãos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
