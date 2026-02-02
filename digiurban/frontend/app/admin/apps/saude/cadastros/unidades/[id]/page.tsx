'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Building2, Loader2 } from 'lucide-react';

interface Unidade {
  id: string;
  nome: string;
  tipo: string;
  cnes: string | null;
  endereco: string | null;
  bairro: string | null;
  cep: string | null;
  telefone: string | null;
  email: string | null;
  horario: string | null;
  isActive: boolean;
}

export default function EditarUnidade() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'UBS',
    cnes: '',
    endereco: '',
    bairro: '',
    cep: '',
    telefone: '',
    email: '',
    horarioFuncionamento: '',
    isActive: true,
  });

  useEffect(() => {
    loadUnidade();
  }, [id]);

  const loadUnidade = async () => {
    try {
      setLoadingData(true);
      const response = await fetch(`/api/apps/saude/cadastros/unidades/${id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Unidade não encontrada');
      }

      const data: Unidade = await response.json();
      setFormData({
        nome: data.nome,
        tipo: data.tipo,
        cnes: data.cnes || '',
        endereco: data.endereco || '',
        bairro: data.bairro || '',
        cep: data.cep || '',
        telefone: data.telefone || '',
        email: data.email || '',
        horarioFuncionamento: data.horario || '',
        isActive: data.isActive,
      });
    } catch (error) {
      console.error('Erro ao carregar unidade:', error);
      alert('Erro ao carregar dados da unidade');
      router.push('/admin/apps/saude/cadastros/unidades');
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
      const response = await fetch(`/api/apps/saude/cadastros/unidades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (response.ok) {
        alert('Unidade atualizada com sucesso!');
        router.push('/admin/apps/saude/cadastros/unidades');
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error || 'Falha ao atualizar unidade'}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar unidade:', error);
      alert('Erro ao atualizar unidade');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados da unidade...</p>
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
              <Building2 className="h-8 w-8 text-blue-600" />
              Editar Unidade de Saúde
            </h1>
            <p className="text-gray-600">Atualizar informações da UBS, UPA, Hospital ou Clínica</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados da Unidade</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="nome">Nome da Unidade *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: UBS Centro"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UBS">UBS - Unidade Básica de Saúde</SelectItem>
                      <SelectItem value="UPA">UPA - Unidade de Pronto Atendimento</SelectItem>
                      <SelectItem value="Hospital">Hospital</SelectItem>
                      <SelectItem value="Clínica">Clínica</SelectItem>
                      <SelectItem value="Posto">Posto de Saúde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cnes">CNES</Label>
                  <Input
                    id="cnes"
                    value={formData.cnes}
                    onChange={(e) => setFormData({ ...formData, cnes: e.target.value })}
                    placeholder="Código CNES"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    placeholder="Rua, número"
                  />
                </div>

                <div>
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={formData.bairro}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                    placeholder="Bairro"
                  />
                </div>

                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                    placeholder="00000-000"
                  />
                </div>

                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 0000-0000"
                  />
                </div>

                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contato@unidade.com"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="horario">Horário de Funcionamento</Label>
                  <Textarea
                    id="horario"
                    value={formData.horarioFuncionamento}
                    onChange={(e) => setFormData({ ...formData, horarioFuncionamento: e.target.value })}
                    placeholder="Ex: Segunda a Sexta: 7h às 17h"
                    rows={2}
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
                    Se a unidade está ativa no sistema
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
