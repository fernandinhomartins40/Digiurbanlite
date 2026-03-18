'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

interface FilaAtendimento {
  id: string;
  citizen: {
    name: string;
    cpf: string;
    birthDate: string;
  };
  motivoBusca: string;
  status: string;
  dataHoraChegada: string;
}

const coresManchester = [
  {
    cor: 'VERMELHO',
    nome: 'Emergência',
    tempo: '0 minutos',
    desc: 'Risco imediato de vida',
    color: 'bg-red-600 text-white',
    borderColor: 'border-red-600',
  },
  {
    cor: 'LARANJA',
    nome: 'Muito Urgente',
    tempo: '10 minutos',
    desc: 'Risco potencial de vida',
    color: 'bg-orange-500 text-white',
    borderColor: 'border-orange-500',
  },
  {
    cor: 'AMARELO',
    nome: 'Urgente',
    tempo: '60 minutos',
    desc: 'Quadros agudos',
    color: 'bg-yellow-400 text-black',
    borderColor: 'border-yellow-400',
  },
  {
    cor: 'VERDE',
    nome: 'Pouco Urgente',
    tempo: '120 minutos',
    desc: 'Quadros estáveis',
    color: 'bg-green-500 text-white',
    borderColor: 'border-green-500',
  },
  {
    cor: 'AZUL',
    nome: 'Não Urgente',
    tempo: '240 minutos',
    desc: 'Pode aguardar ou ser atendido em UBS',
    color: 'bg-blue-500 text-white',
    borderColor: 'border-blue-500',
  },
];

export default function ClassificacaoRiscoPage() {
  const router = useRouter();
  const params = useParams();
  const filaId = params.id as string;

  const [fila, setFila] = useState<FilaAtendimento | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [corSelecionada, setCorSelecionada] = useState<string>('');

  const [formData, setFormData] = useState({
    queixaPrincipal: '',
    pressaoArterial: '',
    frequenciaCardiaca: '',
    frequenciaRespiratoria: '',
    temperatura: '',
    saturacaoO2: '',
    glicemia: '',
  });

  useEffect(() => {
    loadFila();
  }, [filaId]);

  const loadFila = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/saude/fila-atendimento/${filaId}`, {
        credentials: 'include',
      });
      const data = await response.json();
      setFila(data);

      // Se já foi classificado, preencher dados
      if (data.classificacaoRisco) {
        setCorSelecionada(data.classificacaoRisco);
      }
      if (data.queixaPrincipal) {
        setFormData((prev) => ({ ...prev, queixaPrincipal: data.queixaPrincipal }));
      }
      if (data.sinaisVitais) {
        setFormData((prev) => ({ ...prev, ...data.sinaisVitais }));
      }
    } catch (error) {
      console.error('Erro ao carregar fila:', error);
      alert('Erro ao carregar dados do paciente');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!corSelecionada) {
      alert('Selecione uma classificação de risco');
      return;
    }

    if (!formData.queixaPrincipal) {
      alert('Informe a queixa principal do paciente');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/saude/fila-atendimento/${filaId}/classificacao-risco`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          classificacaoRisco: corSelecionada,
          queixaPrincipal: formData.queixaPrincipal,
          sinaisVitais: {
            pressaoArterial: formData.pressaoArterial,
            frequenciaCardiaca: formData.frequenciaCardiaca,
            frequenciaRespiratoria: formData.frequenciaRespiratoria,
            temperatura: formData.temperatura,
            saturacaoO2: formData.saturacaoO2,
            glicemia: formData.glicemia,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Erro ao salvar classificação');
        return;
      }

      router.push('/admin/apps/saude/atendimento');
    } catch (error) {
      console.error('Erro ao salvar classificação:', error);
      alert('Erro ao salvar classificação de risco');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!fila) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Paciente não encontrado</p>
          <Button className="mt-4" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <AlertCircle className="h-8 w-8 text-red-600" />
              Classificação de Risco - Protocolo de Manchester
            </h1>
            <p className="text-gray-600">Triagem e priorização de atendimento</p>
          </div>
        </div>

        {/* Dados do Paciente */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Dados do Paciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Nome:</span>
                <p className="font-semibold">{fila.citizen.name}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">CPF:</span>
                <p className="font-semibold">{fila.citizen.cpf}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Chegada:</span>
                <p className="font-semibold">
                  {new Date(fila.dataHoraChegada).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm font-medium text-gray-700">Motivo da Busca:</span>
              <p className="mt-1">{fila.motivoBusca}</p>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          {/* Seleção de Cor Manchester */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Selecione a Classificação de Risco</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {coresManchester.map((item) => (
                  <div
                    key={item.cor}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      corSelecionada === item.cor
                        ? `${item.borderColor} shadow-lg scale-105`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setCorSelecionada(item.cor)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-lg ${item.color} flex items-center justify-center font-bold text-lg`}>
                        {item.cor[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{item.nome}</span>
                          <Badge variant="outline">{item.tempo}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
                      </div>
                      {corSelecionada === item.cor && (
                        <div className="text-green-600">✓</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Queixa Principal */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Queixa Principal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="queixa">
                  Descreva a queixa principal do paciente <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="queixa"
                  value={formData.queixaPrincipal}
                  onChange={(e) =>
                    setFormData({ ...formData, queixaPrincipal: e.target.value })
                  }
                  placeholder="Ex: Dor torácica intensa há 30 minutos, irradiando para braço esquerdo..."
                  rows={4}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Sinais Vitais */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Sinais Vitais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pa">Pressão Arterial</Label>
                  <Input
                    id="pa"
                    value={formData.pressaoArterial}
                    onChange={(e) =>
                      setFormData({ ...formData, pressaoArterial: e.target.value })
                    }
                    placeholder="Ex: 120/80"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fc">Frequência Cardíaca (bpm)</Label>
                  <Input
                    id="fc"
                    type="number"
                    value={formData.frequenciaCardiaca}
                    onChange={(e) =>
                      setFormData({ ...formData, frequenciaCardiaca: e.target.value })
                    }
                    placeholder="Ex: 75"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fr">Frequência Respiratória (rpm)</Label>
                  <Input
                    id="fr"
                    type="number"
                    value={formData.frequenciaRespiratoria}
                    onChange={(e) =>
                      setFormData({ ...formData, frequenciaRespiratoria: e.target.value })
                    }
                    placeholder="Ex: 18"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temp">Temperatura (°C)</Label>
                  <Input
                    id="temp"
                    type="number"
                    step="0.1"
                    value={formData.temperatura}
                    onChange={(e) =>
                      setFormData({ ...formData, temperatura: e.target.value })
                    }
                    placeholder="Ex: 36.5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sat">Saturação O₂ (%)</Label>
                  <Input
                    id="sat"
                    type="number"
                    value={formData.saturacaoO2}
                    onChange={(e) =>
                      setFormData({ ...formData, saturacaoO2: e.target.value })
                    }
                    placeholder="Ex: 98"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="glicemia">Glicemia (mg/dL)</Label>
                  <Input
                    id="glicemia"
                    type="number"
                    value={formData.glicemia}
                    onChange={(e) =>
                      setFormData({ ...formData, glicemia: e.target.value })
                    }
                    placeholder="Ex: 95"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !corSelecionada}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Classificação'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
