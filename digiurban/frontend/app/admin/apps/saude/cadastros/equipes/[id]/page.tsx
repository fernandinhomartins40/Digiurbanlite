'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Users, Loader2, MapPin, User } from 'lucide-react';

interface Equipe {
  id: string;
  ine: string;
  nome: string;
  tipo: string;
  ativo: boolean;
  unidade: {
    id: string;
    nome: string;
    tipo: string;
  };
  _count: {
    profissionais: number;
    microareas: number;
    citizens: number;
  };
}

export default function EditarEquipeESF() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [equipe, setEquipe] = useState<Equipe | null>(null);
  const [formData, setFormData] = useState({
    ine: '',
    nome: '',
    tipo: 'eSF',
    ativo: true,
  });

  useEffect(() => {
    loadEquipe();
  }, [id]);

  const loadEquipe = async () => {
    try {
      setLoadingData(true);
      const response = await fetch(`/api/apps/saude/cadastros/equipes/${id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Equipe não encontrada');
      }

      const data: Equipe = await response.json();
      setEquipe(data);
      setFormData({
        ine: data.ine,
        nome: data.nome,
        tipo: data.tipo,
        ativo: data.ativo,
      });
    } catch (error) {
      console.error('Erro ao carregar equipe:', error);
      alert('Erro ao carregar dados da equipe');
      router.push('/admin/apps/saude/cadastros/equipes');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.ine || !formData.nome || !formData.tipo) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/apps/saude/cadastros/equipes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Erro ao atualizar equipe');
        return;
      }

      alert('Equipe atualizada com sucesso!');
      router.push('/admin/apps/saude/cadastros/equipes');
    } catch (error) {
      console.error('Erro ao atualizar equipe:', error);
      alert('Erro ao atualizar equipe');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados da equipe...</p>
        </div>
      </div>
    );
  }

  if (!equipe) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8 text-green-600" />
              Editar Equipe ESF
            </h1>
            <p className="text-gray-600">
              Atualizar informações da equipe de Saúde da Família
            </p>
          </div>
        </div>

        {/* Estatísticas da Equipe */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{equipe._count.profissionais}</p>
                  <p className="text-sm text-gray-600">Profissionais</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{equipe._count.microareas}</p>
                  <p className="text-sm text-gray-600">Microáreas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{equipe._count.citizens}</p>
                  <p className="text-sm text-gray-600">Cidadãos Vinculados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Dados da Equipe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Unidade de Saúde (não editável) */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <Label className="text-sm font-medium text-gray-700">Unidade de Saúde</Label>
                <p className="mt-1 text-lg font-semibold">
                  {equipe.unidade.nome} <span className="text-gray-500">({equipe.unidade.tipo})</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  A unidade de saúde não pode ser alterada após a criação da equipe
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* INE */}
                <div className="space-y-2">
                  <Label htmlFor="ine">
                    INE (Identificação Nacional de Equipes) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ine"
                    value={formData.ine}
                    onChange={(e) => setFormData({ ...formData, ine: e.target.value })}
                    placeholder="Ex: 0123456789012"
                    maxLength={13}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Código de 13 dígitos fornecido pelo Ministério da Saúde
                  </p>
                </div>

                {/* Tipo de Equipe */}
                <div className="space-y-2">
                  <Label htmlFor="tipo">
                    Tipo de Equipe <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eSF">Equipe Saúde da Família (eSF)</SelectItem>
                      <SelectItem value="eAP">Equipe Atenção Primária (eAP)</SelectItem>
                      <SelectItem value="eAB">Equipe Atenção Básica (eAB)</SelectItem>
                      <SelectItem value="NASF">Núcleo Apoio Saúde Família (NASF)</SelectItem>
                      <SelectItem value="eCR">Equipe Consultório de Rua (eCR)</SelectItem>
                      <SelectItem value="eAD">Equipe Atenção Domiciliar (eAD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Nome da Equipe */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="nome">
                    Nome da Equipe <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Equipe ESF Bairro Centro"
                    required
                  />
                </div>

                {/* Status */}
                <div className="space-y-2">
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
                  <p className="text-xs text-gray-500">
                    Se a equipe está ativa no sistema
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Gestão da Equipe</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Para gerenciar profissionais, acesse a aba de Profissionais</li>
                  <li>Para gerenciar microáreas, acesse a aba de Microáreas</li>
                  <li>A desativação da equipe afetará todos os vínculos ativos</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="mt-6 flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/admin/apps/saude/cadastros/equipes/${id}/microareas`)}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Gerenciar Microáreas
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
