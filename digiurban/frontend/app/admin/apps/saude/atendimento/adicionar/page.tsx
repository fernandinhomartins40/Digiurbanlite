'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { CidadaoSelector } from '@/components/apps/saude/CidadaoSelector';
import { useUnidade } from '@/contexts/UnidadeContext';
import { SeletorUnidade } from '@/components/saude/SeletorUnidade';
import { UserPlus, Stethoscope, ArrowRight, Clock, AlertCircle, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdicionarCidadaoListaPage() {
  const router = useRouter();
  const { unidadeSelecionada } = useUnidade();
  const [loading, setLoading] = useState(false);
  const [selectedCidadao, setSelectedCidadao] = useState<any>(null);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [unidadeDetalhes, setUnidadeDetalhes] = useState<any>(null);
  const [formData, setFormData] = useState({
    profissionalId: '',
    equipeId: '',
    tipoAtendimento: 'DEMANDA_ESPONTANEA',
    motivoChegada: '',
    acompanhante: '',
    observacoes: '',
  });

  // Carregar detalhes da unidade e profissionais
  useEffect(() => {
    if (unidadeSelecionada?.id) {
      loadUnidadeDetalhes(unidadeSelecionada.id);
      loadProfissionais(unidadeSelecionada.id);
    }
  }, [unidadeSelecionada]);

  // Auto-detectar equipe quando cidadão for selecionado (modo ESF)
  useEffect(() => {
    if (selectedCidadao && unidadeDetalhes?.fluxoAtendimento === 'ESF') {
      if (selectedCidadao.equipeId) {
        setFormData((prev) => ({ ...prev, equipeId: selectedCidadao.equipeId, profissionalId: '' }));
      } else {
        // Cidadão sem equipe vinculada em unidade ESF
        setFormData((prev) => ({ ...prev, equipeId: '', profissionalId: '' }));
      }
    }
  }, [selectedCidadao, unidadeDetalhes]);

  const loadUnidadeDetalhes = async (unidadeId: string) => {
    try {
      const response = await fetch(`/api/apps/saude/cadastros/unidades/${unidadeId}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUnidadeDetalhes(data);
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes da unidade:', error);
    }
  };

  const loadProfissionais = async (unidadeId: string) => {
    try {
      const response = await fetch(
        `/api/apps/saude/cadastros/profissionais?unidadeId=${unidadeId}&isActive=true`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setProfissionais(data);
      }
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCidadao) {
      alert('Selecione um cidadão antes de continuar');
      return;
    }

    if (!unidadeSelecionada?.id) {
      alert('Selecione uma unidade antes de continuar');
      return;
    }

    // Validações específicas por tipo de fluxo
    const fluxo = unidadeDetalhes?.fluxoAtendimento || 'TRADICIONAL';

    if (fluxo === 'ESF') {
      // Em modo ESF, precisa ter equipe vinculada
      if (!formData.equipeId && !selectedCidadao.equipeId) {
        alert(
          'Este cidadão não está vinculado a nenhuma equipe ESF. ' +
          'Por favor, vincule o cidadão a uma equipe antes de adicionar à lista.'
        );
        return;
      }
    } else {
      // Em modo TRADICIONAL, precisa selecionar profissional
      if (!formData.profissionalId) {
        alert('Selecione um profissional de saúde');
        return;
      }
    }

    setLoading(true);

    try {
      // Preparar dados baseado no fluxo
      const requestBody: any = {
        citizenId: selectedCidadao.id,
        unidadeId: unidadeSelecionada.id,
        tipoAtendimento: formData.tipoAtendimento,
        motivoBusca: formData.motivoChegada,
        vacinacao: formData.tipoAtendimento === 'VACINA',
      };

      // Se ESF, enviar equipeId; se TRADICIONAL, enviar profissionalId
      if (fluxo === 'ESF') {
        requestBody.equipeId = formData.equipeId || selectedCidadao.equipeId;
        // Em ESF, ainda precisa de um profissional (pode ser o enfermeiro da equipe)
        // Mas será definido automaticamente ou no acolhimento
        requestBody.profissionalId = formData.profissionalId || profissionais[0]?.id;
      } else {
        requestBody.profissionalId = formData.profissionalId;
      }

      // Adicionar cidadão à fila de atendimento
      const response = await fetch('/api/saude/fila-atendimento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao adicionar à fila');
      }

      const atendimento = await response.json();

      // Mensagem de sucesso diferente por tipo de fluxo
      if (fluxo === 'ESF') {
        alert(`Cidadão adicionado à fila da equipe com sucesso!\nPróximo passo: Acolhimento`);
      } else if (unidadeDetalhes?.tipo === 'UPA') {
        alert(`Cidadão adicionado à fila com sucesso!\nPróximo passo: Classificação de Risco (Manchester)`);
      } else {
        alert(`Cidadão adicionado à fila com sucesso!\nPróximo passo: Acolhimento`);
      }

      // Redirecionar para lista de atendimentos
      router.push('/admin/apps/saude/atendimento');
    } catch (error: any) {
      console.error('Erro ao adicionar cidadão à lista:', error);
      alert(`Erro ao adicionar cidadão à lista: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Seletor de Unidade */}
      <SeletorUnidade />

      {!unidadeSelecionada && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Selecione uma unidade para adicionar cidadão à lista de atendimentos
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <UserPlus className="h-8 w-8 text-blue-600" />
            Adicionar Cidadão à Lista de Atendimentos
          </h1>
          <p className="text-gray-500 mt-1">
            Registre o cidadão na lista de atendimentos em{' '}
            <span className="font-semibold">{unidadeSelecionada?.nome || '...'}</span>
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/admin/apps/saude/atendimento')}>
          Voltar para Lista
        </Button>
      </div>

      {/* Fluxo do Atendimento PEC e-SUS */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600 text-white rounded-full">
                <UserPlus className="h-4 w-4" />
              </div>
              <div>
                <div className="font-semibold text-blue-900">1. Adicionar à Lista</div>
                <div className="text-xs text-blue-700">Você está aqui</div>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
            <div className="flex items-center gap-2 opacity-50">
              <div className="p-2 bg-gray-300 rounded-full">
                <Activity className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-600">2. Escuta Inicial</div>
                <div className="text-xs text-gray-500">Próximo passo</div>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
            <div className="flex items-center gap-2 opacity-50">
              <div className="p-2 bg-gray-300 rounded-full">
                <Stethoscope className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-600">3. Triagem</div>
                <div className="text-xs text-gray-500">Se necessário</div>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
            <div className="flex items-center gap-2 opacity-50">
              <div className="p-2 bg-gray-300 rounded-full">
                <Clock className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-600">4. Consulta</div>
                <div className="text-xs text-gray-500">SOAP</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seleção de Cidadão */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Cidadão</CardTitle>
            <CardDescription>
              Busque o cidadão por CPF, CNS ou nome completo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CidadaoSelector
              onSelect={setSelectedCidadao}
              selectedCidadao={selectedCidadao}
              label="Cidadão"
              required
            />
          </CardContent>
        </Card>

        {/* Informação ESF */}
        {selectedCidadao && unidadeDetalhes?.fluxoAtendimento === 'ESF' && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center gap-2">
                <Badge className="bg-green-600">ESF</Badge>
                Atendimento Territorializado
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCidadao.equipeId ? (
                <div className="space-y-2">
                  <p className="text-green-800">
                    ✓ Este cidadão está vinculado a uma <strong>Equipe de Saúde da Família</strong>
                  </p>
                  {selectedCidadao.equipe && (
                    <div className="bg-white border border-green-200 rounded p-3">
                      <div className="font-semibold text-green-900">
                        {selectedCidadao.equipe.nome}
                      </div>
                      <div className="text-sm text-green-700">
                        INE: {selectedCidadao.equipe.ine}
                      </div>
                    </div>
                  )}
                  {selectedCidadao.microarea && (
                    <div className="text-sm text-green-700">
                      Microárea: {selectedCidadao.microarea.numero}
                      {selectedCidadao.microarea.acs && (
                        <span> - ACS: {selectedCidadao.microarea.acs.nome}</span>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-green-700 mt-2">
                    O atendimento será direcionado automaticamente para a equipe responsável.
                  </p>
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Atenção:</strong> Este cidadão não está vinculado a nenhuma equipe ESF.
                    <br />
                    Em unidades com ESF, o cidadão deve estar vinculado a uma equipe com base no seu território de residência.
                    <br />
                    <strong>Ação necessária:</strong> Vincule o cidadão a uma equipe antes de adicionar à lista.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Informação UPA */}
        {selectedCidadao && unidadeDetalhes?.tipo === 'UPA' && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900 flex items-center gap-2">
                <Badge className="bg-red-600">UPA</Badge>
                Protocolo de Manchester
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-800">
                Após adicionar à lista, o paciente passará pela <strong>Classificação de Risco</strong> (Protocolo de Manchester).
              </p>
              <p className="text-sm text-red-700 mt-2">
                O atendimento será priorizado com base na cor da classificação: 🔴 Vermelho, 🟠 Laranja, 🟡 Amarelo, 🟢 Verde, 🔵 Azul
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dados do Atendimento */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Atendimento</CardTitle>
            <CardDescription>
              Preencha as informações conforme PEC e-SUS APS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tipoAtendimento">Tipo de Atendimento *</Label>
              <Select
                value={formData.tipoAtendimento}
                onValueChange={(value) => handleChange('tipoAtendimento', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AGENDADO">📅 Agendado</SelectItem>
                  <SelectItem value="DEMANDA_ESPONTANEA">🚶 Demanda Espontânea</SelectItem>
                  <SelectItem value="URGENCIA">🚨 Urgência</SelectItem>
                  <SelectItem value="RETORNO">🔄 Retorno</SelectItem>
                  <SelectItem value="VACINA">💉 Vacinação</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Conforme Manual PEC e-SUS APS
              </p>
            </div>

            {/* Seleção de Profissional - Apenas em modo TRADICIONAL */}
            {unidadeDetalhes?.fluxoAtendimento !== 'ESF' && (
              <div>
                <Label htmlFor="profissional">
                  Profissional *
                  {unidadeDetalhes?.tipo === 'UPA' && (
                    <Badge className="ml-2 bg-red-100 text-red-800">UPA - Individual</Badge>
                  )}
                </Label>
                {profissionais.length === 0 ? (
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-amber-50 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-amber-700">
                      Nenhum profissional vinculado a esta unidade
                    </span>
                  </div>
                ) : (
                  <Select
                    value={formData.profissionalId}
                    onValueChange={(value) => handleChange('profissionalId', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o profissional" />
                    </SelectTrigger>
                    <SelectContent>
                      {profissionais.map((prof) => (
                        <SelectItem key={prof.id} value={prof.id}>
                          {prof.nome} - {prof.categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Profissional que irá atender o cidadão
                </p>
              </div>
            )}

            {/* Em modo ESF, mostrar informação */}
            {unidadeDetalhes?.fluxoAtendimento === 'ESF' && selectedCidadao?.equipeId && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-green-600">Atendimento por Equipe</Badge>
                </div>
                <p className="text-sm text-green-800">
                  O cidadão será atendido pela <strong>equipe ESF vinculada</strong>.
                  <br />
                  O profissional específico (enfermeiro ou médico) será definido durante o acolhimento.
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="motivoChegada">Motivo da Busca *</Label>
              <Textarea
                id="motivoChegada"
                value={formData.motivoChegada}
                onChange={(e) => handleChange('motivoChegada', e.target.value)}
                placeholder="Ex: Dor de cabeça há 3 dias, febre, tosse..."
                rows={3}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Descreva brevemente o motivo da busca pelo atendimento
              </p>
            </div>

            <div>
              <Label htmlFor="acompanhante">Acompanhante (opcional)</Label>
              <Input
                id="acompanhante"
                value={formData.acompanhante}
                onChange={(e) => handleChange('acompanhante', e.target.value)}
                placeholder="Nome do acompanhante, se houver"
              />
            </div>

            <div>
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleChange('observacoes', e.target.value)}
                placeholder="Informações adicionais relevantes..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/apps/saude/atendimento')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || !selectedCidadao || !unidadeSelecionada || !formData.profissionalId}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              'Adicionando à Lista...'
            ) : (
              <>
                Adicionar à Lista de Atendimentos
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
