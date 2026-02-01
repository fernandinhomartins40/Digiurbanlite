'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Building2, AlertCircle } from 'lucide-react';

interface Unidade {
  id: string;
  nome: string;
  tipo: string;
  endereco: string;
}

export default function NovaSala() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loadingUnidades, setLoadingUnidades] = useState(true);
  const [formData, setFormData] = useState({
    unidadeId: '',
    nome: '',
    numero: '',
    tipo: 'CONSULTORIO',
    capacidade: '',
    equipamentos: '',
    ativa: true,
  });

  useEffect(() => {
    loadUnidades();
  }, []);

  const loadUnidades = async () => {
    try {
      setLoadingUnidades(true);
      const response = await fetch('/api/apps/saude/cadastros/unidades?isActive=true', {
        credentials: 'include',
      });
      const data = await response.json();
      setUnidades(data);
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
      alert('Erro ao carregar unidades de saúde');
    } finally {
      setLoadingUnidades(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome) {
      alert('Nome da sala é obrigatório');
      return;
    }

    if (!formData.unidadeId) {
      alert('Unidade de Saúde é obrigatória');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/apps/saude/cadastros/salas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          capacidade: formData.capacidade ? parseInt(formData.capacidade) : null,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        alert('Sala criada com sucesso!');
        router.push('/admin/apps/saude/cadastros/salas');
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error || 'Falha ao criar sala'}`);
      }
    } catch (error) {
      console.error('Erro ao criar sala:', error);
      alert('Erro ao criar sala');
    } finally {
      setLoading(false);
    }
  };

  const unidadeSelecionada = unidades.find((u) => u.id === formData.unidadeId);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8 text-orange-600" />
              Nova Sala/Consultório
            </h1>
            <p className="text-gray-600">Cadastrar nova sala de atendimento ou consultório</p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800">
                  <strong>Importante:</strong> Uma sala/consultório deve estar vinculada a uma
                  unidade de saúde específica. Selecione a unidade onde a sala está fisicamente localizada.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Dados da Sala</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Unidade de Saúde - PRIORIDADE MÁXIMA */}
              <div>
                <Label htmlFor="unidadeId" className="text-base font-semibold">
                  Unidade de Saúde *
                  <span className="text-sm font-normal text-gray-500 ml-2">(Obrigatório)</span>
                </Label>
                <Select
                  value={formData.unidadeId}
                  onValueChange={(value) => setFormData({ ...formData, unidadeId: value })}
                  disabled={loadingUnidades}
                >
                  <SelectTrigger id="unidadeId" className="mt-2">
                    <SelectValue placeholder={loadingUnidades ? "Carregando unidades..." : "Selecione a unidade onde a sala está localizada"} />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">Nenhuma unidade ativa disponível</div>
                    ) : (
                      unidades.map((unidade) => (
                        <SelectItem key={unidade.id} value={unidade.id}>
                          {unidade.nome} - {unidade.tipo}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {unidadeSelecionada && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-start gap-2">
                      <Building2 className="h-4 w-4 text-green-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-green-900">{unidadeSelecionada.nome}</p>
                        <p className="text-green-700">{unidadeSelecionada.tipo}</p>
                        {unidadeSelecionada.endereco && (
                          <p className="text-green-600 text-xs mt-1">{unidadeSelecionada.endereco}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Informações da Sala</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nome da Sala */}
                  <div className="md:col-span-2">
                    <Label htmlFor="nome">Nome da Sala *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Consultório 1, Sala de Enfermagem"
                      required
                    />
                  </div>

                  {/* Número */}
                  <div>
                    <Label htmlFor="numero">Número/Identificação</Label>
                    <Input
                      id="numero"
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      placeholder="Ex: 101, 102, A1"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Número ou código de identificação da sala
                    </p>
                  </div>

                  {/* Tipo */}
                  <div>
                    <Label htmlFor="tipo">Tipo de Sala *</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                    >
                      <SelectTrigger id="tipo">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CONSULTORIO">Consultório Médico</SelectItem>
                        <SelectItem value="ENFERMAGEM">Sala de Enfermagem</SelectItem>
                        <SelectItem value="ODONTOLOGIA">Consultório Odontológico</SelectItem>
                        <SelectItem value="VACINA">Sala de Vacinação</SelectItem>
                        <SelectItem value="CURATIVO">Sala de Curativo</SelectItem>
                        <SelectItem value="PROCEDIMENTO">Sala de Procedimentos</SelectItem>
                        <SelectItem value="OBSERVACAO">Sala de Observação</SelectItem>
                        <SelectItem value="COLETA">Sala de Coleta</SelectItem>
                        <SelectItem value="INALACAO">Sala de Inalação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Capacidade */}
                  <div>
                    <Label htmlFor="capacidade">Capacidade</Label>
                    <Input
                      id="capacidade"
                      type="number"
                      min="1"
                      value={formData.capacidade}
                      onChange={(e) => setFormData({ ...formData, capacidade: e.target.value })}
                      placeholder="Número de pessoas"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Quantas pessoas a sala comporta
                    </p>
                  </div>

                  {/* Equipamentos */}
                  <div className="md:col-span-2">
                    <Label htmlFor="equipamentos">Equipamentos Disponíveis</Label>
                    <Textarea
                      id="equipamentos"
                      value={formData.equipamentos}
                      onChange={(e) => setFormData({ ...formData, equipamentos: e.target.value })}
                      placeholder="Liste os equipamentos disponíveis nesta sala (ex: maca, estetoscópio, aparelho de pressão, etc.)"
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading || loadingUnidades || !formData.unidadeId}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Sala'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
