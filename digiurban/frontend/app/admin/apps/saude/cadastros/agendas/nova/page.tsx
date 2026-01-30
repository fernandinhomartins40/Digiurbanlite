'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';

export default function NovaAgenda() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'Consultas',
    dataInicio: '',
    dataFim: '',
    horaInicio: '',
    horaFim: '',
    vagasPorDia: '',
    duracaoConsulta: '30',
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.dataInicio) {
      alert('Nome e data de início são obrigatórios');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/apps/saude/cadastros/agendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (response.ok) {
        alert('Agenda criada com sucesso!');
        router.push('/admin/apps/saude/cadastros/agendas');
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error || 'Falha ao criar agenda'}`);
      }
    } catch (error) {
      console.error('Erro ao criar agenda:', error);
      alert('Erro ao criar agenda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nova Agenda Médica</h1>
            <p className="text-gray-600">Cadastrar nova agenda de atendimentos</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados da Agenda</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="nome">Nome da Agenda *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Consultas Pediatria - Dr. João"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="tipo">Tipo de Agenda *</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Consultas">Consultas Médicas</SelectItem>
                      <SelectItem value="Procedimentos">Procedimentos</SelectItem>
                      <SelectItem value="Exames">Exames</SelectItem>
                      <SelectItem value="Vacinação">Vacinação</SelectItem>
                      <SelectItem value="Enfermagem">Enfermagem</SelectItem>
                      <SelectItem value="Odontologia">Odontologia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="duracaoConsulta">Duração por Atendimento (minutos)</Label>
                  <Input
                    id="duracaoConsulta"
                    type="number"
                    value={formData.duracaoConsulta}
                    onChange={(e) => setFormData({ ...formData, duracaoConsulta: e.target.value })}
                    placeholder="30"
                  />
                </div>

                <div>
                  <Label htmlFor="dataInicio">Data de Início *</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="dataFim">Data de Término</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={formData.dataFim}
                    onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="horaInicio">Horário de Início</Label>
                  <Input
                    id="horaInicio"
                    type="time"
                    value={formData.horaInicio}
                    onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="horaFim">Horário de Término</Label>
                  <Input
                    id="horaFim"
                    type="time"
                    value={formData.horaFim}
                    onChange={(e) => setFormData({ ...formData, horaFim: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="vagasPorDia">Vagas por Dia</Label>
                  <Input
                    id="vagasPorDia"
                    type="number"
                    value={formData.vagasPorDia}
                    onChange={(e) => setFormData({ ...formData, vagasPorDia: e.target.value })}
                    placeholder="Ex: 20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Agenda'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
