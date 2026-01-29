'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, User } from 'lucide-react';
import {
  RiscoEsperado,
  VulnerabilidadeSocial,
  CondutaEscutaInicial,
  CORES_RISCO_ESPERADO,
  FilaAtendimento,
} from '@/types/saude';

interface Profissional {
  id: string;
  name: string;
}

interface EscutaInicialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  filaAtendimento: FilaAtendimento | null;
  profissionais: Profissional[];
  currentUserId: string;
}

export function EscutaInicialDialog({
  open,
  onOpenChange,
  onSubmit,
  filaAtendimento,
  profissionais,
  currentUserId,
}: EscutaInicialDialogProps) {
  const [loading, setLoading] = useState(false);

  // Subjetivo
  const [motivoBusca, setMotivoBusca] = useState('');
  const [historiaBreve, setHistoriaBreve] = useState('');
  const [tempoEvolucao, setTempoEvolucao] = useState('');
  const [tentativasAnteriores, setTentativasAnteriores] = useState('');

  // Objetivo (opcional)
  const [pressaoArterial, setPressaoArterial] = useState('');
  const [temperatura, setTemperatura] = useState('');
  const [frequenciaCardiaca, setFrequenciaCardiaca] = useState('');
  const [observacoesVisuais, setObservacoesVisuais] = useState('');

  // Classificação
  const [riscoEsperado, setRiscoEsperado] = useState<RiscoEsperado>('NAO_URGENTE');
  const [vulnerabilidadeSocial, setVulnerabilidadeSocial] = useState<VulnerabilidadeSocial>('BAIXA');

  // Conduta
  const [condutaDefinida, setCondutaDefinida] = useState<CondutaEscutaInicial>('ENCAMINHADO_ATENDIMENTO_DIA');
  const [profissionalEncaminhadoId, setProfissionalEncaminhadoId] = useState('');
  const [dataAgendamento, setDataAgendamento] = useState('');
  const [orientacoes, setOrientacoes] = useState('');

  const handleSubmit = async () => {
    if (!motivoBusca || !riscoEsperado || !vulnerabilidadeSocial || !condutaDefinida) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    if (condutaDefinida === 'ENCAMINHADO_ATENDIMENTO_DIA' && !profissionalEncaminhadoId) {
      alert('Selecione o profissional para encaminhamento');
      return;
    }

    if (condutaDefinida === 'AGENDAMENTO_CONSULTA' && !dataAgendamento) {
      alert('Informe a data do agendamento');
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        filaAtendimentoId: filaAtendimento?.id,
        profissionalId: currentUserId,
        equipeId: filaAtendimento?.equipeId,
        // Subjetivo
        motivoBusca,
        historiaBreve: historiaBreve || undefined,
        tempoEvolucao: tempoEvolucao || undefined,
        tentativasAnteriores: tentativasAnteriores || undefined,
        // Objetivo
        pressaoArterial: pressaoArterial || undefined,
        temperatura: temperatura ? parseFloat(temperatura) : undefined,
        frequenciaCardiaca: frequenciaCardiaca ? parseInt(frequenciaCardiaca) : undefined,
        observacoesVisuais: observacoesVisuais || undefined,
        // Classificação
        riscoEsperado,
        vulnerabilidadeSocial,
        // Conduta
        condutaDefinida,
        profissionalEncaminhadoId: profissionalEncaminhadoId || undefined,
        dataAgendamento: dataAgendamento ? new Date(dataAgendamento) : undefined,
        orientacoes: orientacoes || undefined,
        unidadeId: filaAtendimento?.unidadeId,
      });

      // Resetar formulário
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar escuta inicial:', error);
      alert('Erro ao salvar escuta inicial');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMotivoBusca('');
    setHistoriaBreve('');
    setTempoEvolucao('');
    setTentativasAnteriores('');
    setPressaoArterial('');
    setTemperatura('');
    setFrequenciaCardiaca('');
    setObservacoesVisuais('');
    setRiscoEsperado('NAO_URGENTE');
    setVulnerabilidadeSocial('BAIXA');
    setCondutaDefinida('ENCAMINHADO_ATENDIMENTO_DIA');
    setProfissionalEncaminhadoId('');
    setDataAgendamento('');
    setOrientacoes('');
  };

  const getRiscoBadgeColor = (risco: RiscoEsperado) => {
    const colors = CORES_RISCO_ESPERADO[risco];
    return colors;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Escuta Inicial / Acolhimento
          </DialogTitle>
        </DialogHeader>

        {filaAtendimento && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-blue-900">
                {filaAtendimento.citizen?.name}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
              <div>CPF: {filaAtendimento.citizen?.cpf}</div>
              {filaAtendimento.citizen?.birthDate && (
                <div>
                  Nascimento:{' '}
                  {new Date(filaAtendimento.citizen.birthDate).toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-6 py-4">
          {/* SUBJETIVO */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 bg-blue-600 rounded"></div>
              <h3 className="text-lg font-semibold">Subjetivo</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivoBusca">Motivo da Busca *</Label>
              <Textarea
                id="motivoBusca"
                value={motivoBusca}
                onChange={(e) => setMotivoBusca(e.target.value)}
                placeholder="Por que o usuário procurou o serviço hoje?"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="historiaBreve">História Breve</Label>
              <Textarea
                id="historiaBreve"
                value={historiaBreve}
                onChange={(e) => setHistoriaBreve(e.target.value)}
                placeholder="Resumo da queixa e história atual..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tempoEvolucao">Tempo de Evolução</Label>
                <Input
                  id="tempoEvolucao"
                  value={tempoEvolucao}
                  onChange={(e) => setTempoEvolucao(e.target.value)}
                  placeholder="Ex: 3 dias, 2 semanas..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tentativasAnteriores">Tentativas Anteriores</Label>
                <Input
                  id="tentativasAnteriores"
                  value={tentativasAnteriores}
                  onChange={(e) => setTentativasAnteriores(e.target.value)}
                  placeholder="Já tentou tratar? Como?"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* OBJETIVO (Opcional) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 bg-green-600 rounded"></div>
              <h3 className="text-lg font-semibold">Objetivo (Opcional)</h3>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pressaoArterial">Pressão Arterial</Label>
                <Input
                  id="pressaoArterial"
                  value={pressaoArterial}
                  onChange={(e) => setPressaoArterial(e.target.value)}
                  placeholder="Ex: 120/80"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperatura">Temperatura (°C)</Label>
                <Input
                  id="temperatura"
                  type="number"
                  step="0.1"
                  value={temperatura}
                  onChange={(e) => setTemperatura(e.target.value)}
                  placeholder="Ex: 36.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequenciaCardiaca">Freq. Cardíaca (bpm)</Label>
                <Input
                  id="frequenciaCardiaca"
                  type="number"
                  value={frequenciaCardiaca}
                  onChange={(e) => setFrequenciaCardiaca(e.target.value)}
                  placeholder="Ex: 80"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoesVisuais">Observações Visuais</Label>
              <Textarea
                id="observacoesVisuais"
                value={observacoesVisuais}
                onChange={(e) => setObservacoesVisuais(e.target.value)}
                placeholder="Aparência geral, estado de consciência, hidratação..."
                rows={2}
              />
            </div>
          </div>

          <Separator />

          {/* CLASSIFICAÇÃO */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 bg-yellow-600 rounded"></div>
              <h3 className="text-lg font-semibold">Classificação *</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="riscoEsperado">Risco Esperado *</Label>
                <Select value={riscoEsperado} onValueChange={(v) => setRiscoEsperado(v as RiscoEsperado)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMERGENCIA">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        Emergência - Imediato
                      </div>
                    </SelectItem>
                    <SelectItem value="MUITO_URGENTE">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        Muito Urgente
                      </div>
                    </SelectItem>
                    <SelectItem value="URGENTE">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        Urgente
                      </div>
                    </SelectItem>
                    <SelectItem value="POUCO_URGENTE">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        Pouco Urgente
                      </div>
                    </SelectItem>
                    <SelectItem value="NAO_URGENTE">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                        Não Urgente
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Badge className={getRiscoBadgeColor(riscoEsperado)}>
                  {riscoEsperado.replace(/_/g, ' ')}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vulnerabilidadeSocial">Vulnerabilidade Social *</Label>
                <Select
                  value={vulnerabilidadeSocial}
                  onValueChange={(v) => setVulnerabilidadeSocial(v as VulnerabilidadeSocial)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BAIXA">Baixa</SelectItem>
                    <SelectItem value="MEDIA">Média</SelectItem>
                    <SelectItem value="ALTA">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* CONDUTA */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 bg-purple-600 rounded"></div>
              <h3 className="text-lg font-semibold">Conduta *</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condutaDefinida">Conduta Definida *</Label>
              <Select
                value={condutaDefinida}
                onValueChange={(v) => setCondutaDefinida(v as CondutaEscutaInicial)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RESOLVIDO_NA_ESCUTA">Resolvido na Escuta</SelectItem>
                  <SelectItem value="ENCAMINHADO_ATENDIMENTO_DIA">
                    Encaminhado para Atendimento no Dia
                  </SelectItem>
                  <SelectItem value="PROCEDIMENTO_UBS">Procedimento na UBS</SelectItem>
                  <SelectItem value="AGENDAMENTO_CONSULTA">Agendamento de Consulta</SelectItem>
                  <SelectItem value="ENCAMINHAMENTO_EXTERNO">Encaminhamento Externo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {condutaDefinida === 'ENCAMINHADO_ATENDIMENTO_DIA' && (
              <div className="space-y-2">
                <Label htmlFor="profissionalEncaminhado">Profissional Encaminhado *</Label>
                <Select
                  value={profissionalEncaminhadoId}
                  onValueChange={setProfissionalEncaminhadoId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {profissionais.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {condutaDefinida === 'AGENDAMENTO_CONSULTA' && (
              <div className="space-y-2">
                <Label htmlFor="dataAgendamento">Data do Agendamento *</Label>
                <Input
                  id="dataAgendamento"
                  type="datetime-local"
                  value={dataAgendamento}
                  onChange={(e) => setDataAgendamento(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="orientacoes">Orientações</Label>
              <Textarea
                id="orientacoes"
                value={orientacoes}
                onChange={(e) => setOrientacoes(e.target.value)}
                placeholder="Orientações dadas ao usuário..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Escuta Inicial'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
