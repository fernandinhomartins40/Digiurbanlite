'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Heart, Stethoscope, Syringe, Calendar, Building2, MessageCircle } from 'lucide-react';

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
  equipe?: {
    nome: string;
    ine: string;
  };
}

const condutas = [
  {
    value: 'RESOLVER_ACOLHIMENTO',
    label: 'Resolver no Acolhimento',
    desc: 'Situação resolvida com orientações e/ou procedimentos simples',
    icon: Heart,
    color: 'text-green-600',
  },
  {
    value: 'ENCAMINHAR_MEDICO',
    label: 'Encaminhar para Médico',
    desc: 'Necessita avaliação médica no mesmo dia',
    icon: Stethoscope,
    color: 'text-blue-600',
  },
  {
    value: 'ENCAMINHAR_ENFERMEIRO',
    label: 'Encaminhar para Enfermeiro',
    desc: 'Necessita avaliação ou procedimento de enfermagem',
    icon: Stethoscope,
    color: 'text-purple-600',
  },
  {
    value: 'ENCAMINHAR_PROCEDIMENTO',
    label: 'Encaminhar para Procedimento',
    desc: 'Curativo, inalação, medicação, vacinação, etc.',
    icon: Syringe,
    color: 'text-orange-600',
  },
  {
    value: 'AGENDAR_CONSULTA',
    label: 'Agendar Consulta',
    desc: 'Situação não urgente, agendar para data futura',
    icon: Calendar,
    color: 'text-teal-600',
  },
  {
    value: 'ENCAMINHAR_EXTERNO',
    label: 'Encaminhar Externamente',
    desc: 'Encaminhar para outra unidade, especialidade ou urgência',
    icon: Building2,
    color: 'text-red-600',
  },
  {
    value: 'ORIENTACAO',
    label: 'Apenas Orientação',
    desc: 'Orientações educativas, esclarecimento de dúvidas',
    icon: MessageCircle,
    color: 'text-gray-600',
  },
];

export default function AcolhimentoPage() {
  const router = useRouter();
  const params = useParams();
  const filaId = params.id as string;

  const [fila, setFila] = useState<FilaAtendimento | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [condutaSelecionada, setCondutaSelecionada] = useState<string>('');
  const [observacoes, setObservacoes] = useState('');

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

      // Se já foi acolhido, preencher dados
      if (data.condutaAcolhimento) {
        setCondutaSelecionada(data.condutaAcolhimento);
      }
      if (data.observacoes) {
        setObservacoes(data.observacoes);
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

    if (!condutaSelecionada) {
      alert('Selecione uma conduta');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/saude/fila-atendimento/${filaId}/acolhimento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          condutaAcolhimento: condutaSelecionada,
          observacoes: observacoes || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Erro ao salvar acolhimento');
        return;
      }

      router.push('/admin/apps/saude/atendimento');
    } catch (error) {
      console.error('Erro ao salvar acolhimento:', error);
      alert('Erro ao salvar acolhimento');
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
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const condutaSelecionadaObj = condutas.find((c) => c.value === condutaSelecionada);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Heart className="h-8 w-8 text-blue-600" />
              Acolhimento / Escuta Inicial
            </h1>
            <p className="text-gray-600">Avaliação inicial e definição de conduta</p>
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
            {fila.equipe && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                <span className="text-sm font-medium text-green-800">Equipe ESF:</span>
                <p className="font-semibold text-green-900">
                  {fila.equipe.nome} <Badge variant="outline">INE: {fila.equipe.ine}</Badge>
                </p>
              </div>
            )}
            <div className="mt-4">
              <span className="text-sm font-medium text-gray-700">Motivo da Busca:</span>
              <p className="mt-1">{fila.motivoBusca}</p>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          {/* Definição de Conduta */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Defina a Conduta</CardTitle>
              <p className="text-sm text-gray-600">
                Selecione a conduta mais adequada após a escuta inicial
              </p>
            </CardHeader>
            <CardContent>
              <RadioGroup value={condutaSelecionada} onValueChange={setCondutaSelecionada}>
                <div className="space-y-3">
                  {condutas.map((conduta) => {
                    const Icon = conduta.icon;
                    const isSelected = condutaSelecionada === conduta.value;

                    return (
                      <div
                        key={conduta.value}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setCondutaSelecionada(conduta.value)}
                      >
                        <div className="flex items-start gap-4">
                          <RadioGroupItem value={conduta.value} id={conduta.value} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Icon className={`h-5 w-5 ${conduta.color}`} />
                              <Label
                                htmlFor={conduta.value}
                                className="font-semibold cursor-pointer"
                              >
                                {conduta.label}
                              </Label>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{conduta.desc}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>

              {condutaSelecionadaObj && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={condutaSelecionadaObj.color}>
                      {React.createElement(condutaSelecionadaObj.icon, { className: 'h-5 w-5' })}
                    </div>
                    <span className="font-semibold text-blue-900">
                      Conduta Selecionada: {condutaSelecionadaObj.label}
                    </span>
                  </div>
                  <p className="text-sm text-blue-800">
                    {['RESOLVER_ACOLHIMENTO', 'ORIENTACAO'].includes(condutaSelecionada)
                      ? '✓ O atendimento será finalizado após salvar (resolvido no acolhimento)'
                      : '→ O paciente será encaminhado conforme a conduta selecionada'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Observações */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="observacoes">
                  Registre observações relevantes sobre o acolhimento
                </Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex: Paciente apresenta tosse seca há 3 dias, sem febre. Orientado sobre hidratação e repouso. Retornar se piorar..."
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>

          {/* Informações Importantes */}
          <Card className="mb-6 bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-900">
                ℹ️ Sobre o Acolhimento na Atenção Básica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-green-800 space-y-2">
                <li>
                  <strong>Acolhimento não é triagem:</strong> É uma postura ética de escuta
                  qualificada e acolhedora
                </li>
                <li>
                  <strong>Obrigatório em UBS:</strong> Todo cidadão que chega deve ser acolhido
                </li>
                <li>
                  <strong>Resolutividade:</strong> Muitas situações podem ser resolvidas no
                  próprio acolhimento
                </li>
                <li>
                  <strong>Encaminhamento:</strong> Quando necessário, encaminhar para médico,
                  enfermeiro ou procedimento
                </li>
                <li>
                  <strong>ESF:</strong> Em equipes de Saúde da Família, o acolhimento fortalece o
                  vínculo territorial
                </li>
              </ul>
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
            <Button type="submit" disabled={saving || !condutaSelecionada}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Acolhimento'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
