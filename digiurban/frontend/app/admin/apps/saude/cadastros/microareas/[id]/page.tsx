'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, MapPin, Save, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Equipe {
  id: string;
  nome: string;
  ine: string;
  unidade: {
    id: string;
    nome: string;
  };
}

interface ACS {
  id: string;
  name: string;
  email: string;
}

interface Microarea {
  id: string;
  numero: string;
  descricao: string | null;
  ativo: boolean;
  equipeId: string;
  acsId: string | null;
  equipe: {
    id: string;
    nome: string;
    ine: string;
    unidade: {
      id: string;
      nome: string;
    };
  };
  acs: {
    id: string;
    name: string;
    email: string;
  } | null;
  _count: {
    citizens: number;
  };
}

export default function EditarMicroarea() {
  const router = useRouter();
  const params = useParams();
  const microareaId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [microarea, setMicroarea] = useState<Microarea | null>(null);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [acsDisponiveis, setAcsDisponiveis] = useState<ACS[]>([]);
  const [formData, setFormData] = useState({
    numero: '',
    descricao: '',
    equipeId: '',
    acsId: '',
    ativo: true,
  });

  useEffect(() => {
    loadMicroarea();
    loadEquipes();
    loadACS();
  }, [microareaId]);

  const loadMicroarea = async () => {
    try {
      const response = await fetch(`/api/apps/saude/cadastros/microareas/${microareaId}`, {
        credentials: 'include',
      });
      const data = await response.json();
      setMicroarea(data);
      setFormData({
        numero: data.numero,
        descricao: data.descricao || '',
        equipeId: data.equipeId,
        acsId: data.acsId || '',
        ativo: data.ativo,
      });
    } catch (error) {
      console.error('Erro ao carregar microárea:', error);
      alert('Erro ao carregar microárea');
    } finally {
      setLoading(false);
    }
  };

  const loadEquipes = async () => {
    try {
      const response = await fetch('/api/apps/saude/cadastros/equipes?ativo=true', {
        credentials: 'include',
      });
      const data = await response.json();
      setEquipes(data);
    } catch (error) {
      console.error('Erro ao carregar equipes:', error);
    }
  };

  const loadACS = async () => {
    try {
      const response = await fetch('/api/apps/saude/cadastros/dados-saude?categoria=ACS&ativo=true', {
        credentials: 'include',
      });
      const data = await response.json();
      setAcsDisponiveis(data);
    } catch (error) {
      console.error('Erro ao carregar ACS:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.numero || !formData.equipeId) {
      alert('Número da microárea e Equipe ESF são obrigatórios');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        numero: formData.numero,
        descricao: formData.descricao || null,
        equipeId: formData.equipeId,
        acsId: formData.acsId || null,
        ativo: formData.ativo,
      };

      const response = await fetch(`/api/apps/saude/cadastros/microareas/${microareaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Erro ao atualizar microárea');
        return;
      }

      alert('Microárea atualizada com sucesso!');
      router.push('/admin/apps/saude/cadastros/microareas');
    } catch (error) {
      console.error('Erro ao atualizar microárea:', error);
      alert('Erro ao atualizar microárea');
    } finally {
      setSaving(false);
    }
  };

  const equipeInfo = equipes.find((e) => e.id === formData.equipeId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Carregando microárea...</p>
        </div>
      </div>
    );
  }

  if (!microarea) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Microárea não encontrada</p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MapPin className="h-8 w-8 text-purple-600" />
              Editar Microárea {microarea.numero}
            </h1>
            <p className="text-gray-600">Atualizar dados da microárea</p>
          </div>
          <Badge variant={microarea.ativo ? 'default' : 'secondary'}>
            {microarea.ativo ? 'Ativa' : 'Inativa'}
          </Badge>
        </div>

        {/* Stats Card */}
        {microarea._count.citizens > 0 && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-800">Famílias Cadastradas</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {microarea._count.citizens}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Dados da Microárea</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Equipe ESF */}
              <div>
                <Label htmlFor="equipeId" className="required">
                  Equipe ESF *
                </Label>
                <Select
                  value={formData.equipeId}
                  onValueChange={(value) => setFormData({ ...formData, equipeId: value })}
                >
                  <SelectTrigger id="equipeId">
                    <SelectValue placeholder="Selecione a equipe responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipes.map((equipe) => (
                      <SelectItem key={equipe.id} value={equipe.id}>
                        {equipe.nome} - {equipe.unidade.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {equipeInfo && (
                  <p className="text-sm text-gray-500 mt-1">
                    INE: {equipeInfo.ine} | Unidade: {equipeInfo.unidade.nome}
                  </p>
                )}
              </div>

              {/* Número da Microárea */}
              <div>
                <Label htmlFor="numero" className="required">
                  Número da Microárea *
                </Label>
                <Input
                  id="numero"
                  type="text"
                  placeholder="Ex: 01, 02, 03..."
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Número de identificação única da microárea dentro da equipe
                </p>
              </div>

              {/* Descrição */}
              <div>
                <Label htmlFor="descricao">Descrição / Localização</Label>
                <Textarea
                  id="descricao"
                  placeholder="Ex: Bairro Centro, entre Rua A e Rua B..."
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Descrição opcional para identificar o território
                </p>
              </div>

              {/* ACS Responsável */}
              <div>
                <Label htmlFor="acsId">Agente Comunitário de Saúde (ACS)</Label>
                <Select
                  value={formData.acsId}
                  onValueChange={(value) => setFormData({ ...formData, acsId: value })}
                >
                  <SelectTrigger id="acsId">
                    <SelectValue placeholder="Selecione o ACS responsável (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem ACS designado</SelectItem>
                    {acsDisponiveis.map((acs) => (
                      <SelectItem key={acs.id} value={acs.id}>
                        {acs.name} - {acs.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  ACS que realizará as visitas domiciliares neste território
                </p>
              </div>

              {/* Status */}
              <div>
                <Label htmlFor="ativo">Status</Label>
                <Select
                  value={formData.ativo ? 'true' : 'false'}
                  onValueChange={(value) => setFormData({ ...formData, ativo: value === 'true' })}
                >
                  <SelectTrigger id="ativo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Ativa</SelectItem>
                    <SelectItem value="false">Inativa</SelectItem>
                  </SelectContent>
                </Select>
                {!formData.ativo && (
                  <p className="text-sm text-orange-600 mt-1">
                    ⚠️ Microáreas inativas não aparecem em listagens de atendimento
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
