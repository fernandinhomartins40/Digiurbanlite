'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Stethoscope, Loader2 } from 'lucide-react';

interface Especialidade {
  id: string;
  nome: string;
  descricao: string | null;
  isActive: boolean;
}

export default function EditarEspecialidade() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    isActive: true,
  });

  useEffect(() => {
    loadEspecialidade();
  }, [id]);

  const loadEspecialidade = async () => {
    try {
      setLoadingData(true);
      const response = await fetch(`/api/apps/saude/cadastros/especialidades/${id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Especialidade não encontrada');
      }

      const data: Especialidade = await response.json();
      setFormData({
        nome: data.nome,
        descricao: data.descricao || '',
        isActive: data.isActive,
      });
    } catch (error) {
      console.error('Erro ao carregar especialidade:', error);
      alert('Erro ao carregar dados da especialidade');
      router.push('/admin/apps/saude/cadastros/especialidades');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome) {
      alert('Nome é obrigatório');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/apps/saude/cadastros/especialidades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (response.ok) {
        alert('Especialidade atualizada com sucesso!');
        router.push('/admin/apps/saude/cadastros/especialidades');
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error || 'Falha ao atualizar especialidade'}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar especialidade:', error);
      alert('Erro ao atualizar especialidade');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados da especialidade...</p>
        </div>
      </div>
    );
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
              <Stethoscope className="h-8 w-8 text-purple-600" />
              Editar Especialidade Médica
            </h1>
            <p className="text-gray-600">Atualizar informações da especialidade ou área de atuação</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados da Especialidade</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="nome">Nome da Especialidade *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Clínico Geral, Pediatria, Cardiologia"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descreva a área de atuação desta especialidade..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="isActive">Status</Label>
                  <Select
                    value={formData.isActive ? 'true' : 'false'}
                    onValueChange={(value) => setFormData({ ...formData, isActive: value === 'true' })}
                  >
                    <SelectTrigger id="isActive">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Ativa</SelectItem>
                      <SelectItem value="false">Inativa</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">
                    Se a especialidade está disponível no sistema
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
