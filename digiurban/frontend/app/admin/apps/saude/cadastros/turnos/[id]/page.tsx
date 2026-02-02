'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Clock, Loader2 } from 'lucide-react';

interface Turno {
  id: string;
  nome: string;
  descricao: string | null;
  horaInicio: string;
  horaFim: string;
  ativo: boolean;
}

export default function EditarTurno() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState({
    nome: '',
    periodo: 'Manhã',
    horaInicio: '',
    horaFim: '',
    ativo: true,
  });

  useEffect(() => {
    loadTurno();
  }, [id]);

  const loadTurno = async () => {
    try {
      setLoadingData(true);
      const response = await fetch(`/api/apps/saude/cadastros/turnos/${id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Turno não encontrado');
      }

      const data: Turno = await response.json();
      setFormData({
        nome: data.nome,
        periodo: data.descricao || 'Manhã',
        horaInicio: data.horaInicio,
        horaFim: data.horaFim,
        ativo: data.ativo,
      });
    } catch (error) {
      console.error('Erro ao carregar turno:', error);
      alert('Erro ao carregar dados do turno');
      router.push('/admin/apps/saude/cadastros/turnos');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.horaInicio || !formData.horaFim) {
      alert('Nome, horário de início e fim são obrigatórios');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/apps/saude/cadastros/turnos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome,
          descricao: formData.periodo,
          horaInicio: formData.horaInicio,
          horaFim: formData.horaFim,
          ativo: formData.ativo,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        alert('Turno atualizado com sucesso!');
        router.push('/admin/apps/saude/cadastros/turnos');
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error || 'Falha ao atualizar turno'}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar turno:', error);
      alert('Erro ao atualizar turno');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados do turno...</p>
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
              <Clock className="h-8 w-8 text-indigo-600" />
              Editar Turno de Trabalho
            </h1>
            <p className="text-gray-600">Atualizar informações do turno e horário de atendimento</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Turno</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="nome">Nome do Turno *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Manhã, Tarde, Noite, Plantão 24h"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="periodo">Período *</Label>
                  <Select
                    value={formData.periodo}
                    onValueChange={(value) => setFormData({ ...formData, periodo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manhã">Manhã</SelectItem>
                      <SelectItem value="Tarde">Tarde</SelectItem>
                      <SelectItem value="Noite">Noite</SelectItem>
                      <SelectItem value="Integral">Integral (Dia todo)</SelectItem>
                      <SelectItem value="Madrugada">Madrugada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
                      <SelectItem value="true">Ativo</SelectItem>
                      <SelectItem value="false">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">
                    Se o turno está disponível no sistema
                  </p>
                </div>

                <div>
                  <Label htmlFor="horaInicio">Horário de Início *</Label>
                  <Input
                    id="horaInicio"
                    type="time"
                    value={formData.horaInicio}
                    onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="horaFim">Horário de Término *</Label>
                  <Input
                    id="horaFim"
                    type="time"
                    value={formData.horaFim}
                    onChange={(e) => setFormData({ ...formData, horaFim: e.target.value })}
                    required
                  />
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
