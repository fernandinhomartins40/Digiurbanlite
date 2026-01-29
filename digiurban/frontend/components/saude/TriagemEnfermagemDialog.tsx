'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Activity, User, Ruler, AlertTriangle, Stethoscope } from 'lucide-react';
import {
  ClassificacaoManchester,
  MomentoGlicemia,
  CORES_MANCHESTER,
  FilaAtendimento,
} from '@/types/saude';

interface TriagemEnfermagemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  filaAtendimento: FilaAtendimento | null;
  currentUserId: string;
}

export function TriagemEnfermagemDialog({
  open,
  onOpenChange,
  onSubmit,
  filaAtendimento,
  currentUserId,
}: TriagemEnfermagemDialogProps) {
  const [loading, setLoading] = useState(false);

  // Sinais Vitais
  const [pressaoArterial, setPressaoArterial] = useState('');
  const [temperatura, setTemperatura] = useState('');
  const [frequenciaCardiaca, setFrequenciaCardiaca] = useState('');
  const [frequenciaRespiratoria, setFrequenciaRespiratoria] = useState('');
  const [saturacaoO2, setSaturacaoO2] = useState('');
  const [dor, setDor] = useState('');

  // Antropometria
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [imc, setIMC] = useState('');
  const [perimetroCefalico, setPerimetroCefalico] = useState('');
  const [circunferenciaAbdominal, setCircunferenciaAbdominal] = useState('');

  // Glicemia
  const [glicemiaCapilar, setGlicemiaCapilar] = useState('');
  const [momentoGlicemia, setMomentoGlicemia] = useState<MomentoGlicemia>('ALEATORIA');

  // Avaliação
  const [queixaPrincipal, setQueixaPrincipal] = useState('');
  const [historiaDoencaAtual, setHistoriaDoencaAtual] = useState('');
  const [alergiasConhecidas, setAlergiasConhecidas] = useState('');
  const [medicamentosUso, setMedicamentosUso] = useState('');
  const [comorbidades, setComorbidades] = useState('');

  // Classificação Manchester
  const [classificacaoRisco, setClassificacaoRisco] = useState<ClassificacaoManchester>('NAO_URGENTE');
  const [discriminadorUtilizado, setDiscriminadorUtilizado] = useState('');

  // Encaminhamento
  const [profissionalEncaminhadoId, setProfissionalEncaminhadoId] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Auto-cálculo de IMC
  useEffect(() => {
    if (peso && altura) {
      const pesoNum = parseFloat(peso);
      const alturaNum = parseFloat(altura);
      if (pesoNum > 0 && alturaNum > 0) {
        const imcCalc = pesoNum / (alturaNum * alturaNum);
        setIMC(imcCalc.toFixed(2));
      }
    } else {
      setIMC('');
    }
  }, [peso, altura]);

  const handleSubmit = async () => {
    if (!queixaPrincipal || !classificacaoRisco) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        filaAtendimentoId: filaAtendimento?.id,
        enfermeiroId: currentUserId,
        // Sinais Vitais
        pressaoArterial: pressaoArterial || undefined,
        temperatura: temperatura ? parseFloat(temperatura) : undefined,
        frequenciaCardiaca: frequenciaCardiaca ? parseInt(frequenciaCardiaca) : undefined,
        frequenciaRespiratoria: frequenciaRespiratoria ? parseInt(frequenciaRespiratoria) : undefined,
        saturacaoO2: saturacaoO2 ? parseFloat(saturacaoO2) : undefined,
        dor: dor ? parseInt(dor) : undefined,
        // Antropometria
        peso: peso ? parseFloat(peso) : undefined,
        altura: altura ? parseFloat(altura) : undefined,
        imc: imc ? parseFloat(imc) : undefined,
        perimetroCefalico: perimetroCefalico ? parseFloat(perimetroCefalico) : undefined,
        circunferenciaAbdominal: circunferenciaAbdominal ? parseFloat(circunferenciaAbdominal) : undefined,
        // Glicemia
        glicemiaCapilar: glicemiaCapilar ? parseFloat(glicemiaCapilar) : undefined,
        momentoGlicemia: glicemiaCapilar ? momentoGlicemia : undefined,
        // Avaliação
        queixaPrincipal,
        historiaDoencaAtual: historiaDoencaAtual || undefined,
        alergiasConhecidas: alergiasConhecidas || undefined,
        medicamentosUso: medicamentosUso || undefined,
        comorbidades: comorbidades || undefined,
        // Classificação
        classificacaoRisco,
        discriminadorUtilizado: discriminadorUtilizado || undefined,
        // Encaminhamento
        profissionalEncaminhadoId: profissionalEncaminhadoId || undefined,
        observacoes: observacoes || undefined,
        unidadeId: filaAtendimento?.unidadeId,
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar triagem:', error);
      alert('Erro ao salvar triagem de enfermagem');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPressaoArterial('');
    setTemperatura('');
    setFrequenciaCardiaca('');
    setFrequenciaRespiratoria('');
    setSaturacaoO2('');
    setDor('');
    setPeso('');
    setAltura('');
    setIMC('');
    setPerimetroCefalico('');
    setCircunferenciaAbdominal('');
    setGlicemiaCapilar('');
    setMomentoGlicemia('ALEATORIA');
    setQueixaPrincipal('');
    setHistoriaDoencaAtual('');
    setAlergiasConhecidas('');
    setMedicamentosUso('');
    setComorbidades('');
    setClassificacaoRisco('NAO_URGENTE');
    setDiscriminadorUtilizado('');
    setProfissionalEncaminhadoId('');
    setObservacoes('');
  };

  const getIMCClassificacao = (imcValue: number) => {
    if (imcValue < 18.5) return { texto: 'Abaixo do peso', cor: 'text-blue-600' };
    if (imcValue < 25) return { texto: 'Peso normal', cor: 'text-green-600' };
    if (imcValue < 30) return { texto: 'Sobrepeso', cor: 'text-yellow-600' };
    if (imcValue < 35) return { texto: 'Obesidade Grau I', cor: 'text-orange-600' };
    if (imcValue < 40) return { texto: 'Obesidade Grau II', cor: 'text-red-600' };
    return { texto: 'Obesidade Grau III', cor: 'text-red-700 font-bold' };
  };

  const getTempoAtendimentoManchester = (classificacao: ClassificacaoManchester) => {
    switch (classificacao) {
      case 'EMERGENCIA': return 'Imediato (0 min)';
      case 'MUITO_URGENTE': return 'Muito Urgente (10 min)';
      case 'URGENTE': return 'Urgente (60 min)';
      case 'POUCO_URGENTE': return 'Pouco Urgente (120 min)';
      case 'NAO_URGENTE': return 'Não Urgente (240 min)';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-green-600" />
            Triagem de Enfermagem
          </DialogTitle>
        </DialogHeader>

        {filaAtendimento && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-green-900">
                {filaAtendimento.citizen?.name}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
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

        <Tabs defaultValue="sinais-vitais" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sinais-vitais">
              <Activity className="h-4 w-4 mr-2" />
              Sinais Vitais
            </TabsTrigger>
            <TabsTrigger value="antropometria">
              <Ruler className="h-4 w-4 mr-2" />
              Antropometria
            </TabsTrigger>
            <TabsTrigger value="avaliacao">
              <User className="h-4 w-4 mr-2" />
              Avaliação
            </TabsTrigger>
            <TabsTrigger value="classificacao">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Classificação
            </TabsTrigger>
          </TabsList>

          {/* SINAIS VITAIS */}
          <TabsContent value="sinais-vitais" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pressaoArterial">Pressão Arterial (mmHg)</Label>
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
                <Label htmlFor="frequenciaCardiaca">Frequência Cardíaca (bpm)</Label>
                <Input
                  id="frequenciaCardiaca"
                  type="number"
                  value={frequenciaCardiaca}
                  onChange={(e) => setFrequenciaCardiaca(e.target.value)}
                  placeholder="Ex: 80"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequenciaRespiratoria">Frequência Respiratória (irpm)</Label>
                <Input
                  id="frequenciaRespiratoria"
                  type="number"
                  value={frequenciaRespiratoria}
                  onChange={(e) => setFrequenciaRespiratoria(e.target.value)}
                  placeholder="Ex: 18"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="saturacaoO2">Saturação O2 (%)</Label>
                <Input
                  id="saturacaoO2"
                  type="number"
                  step="0.1"
                  value={saturacaoO2}
                  onChange={(e) => setSaturacaoO2(e.target.value)}
                  placeholder="Ex: 98"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dor">Escala de Dor (0-10)</Label>
                <Input
                  id="dor"
                  type="number"
                  min="0"
                  max="10"
                  value={dor}
                  onChange={(e) => setDor(e.target.value)}
                  placeholder="0 = sem dor, 10 = pior dor"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="glicemiaCapilar">Glicemia Capilar (mg/dL)</Label>
                <Input
                  id="glicemiaCapilar"
                  type="number"
                  value={glicemiaCapilar}
                  onChange={(e) => setGlicemiaCapilar(e.target.value)}
                  placeholder="Ex: 95"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="momentoGlicemia">Momento da Glicemia</Label>
                <Select
                  value={momentoGlicemia}
                  onValueChange={(v) => setMomentoGlicemia(v as MomentoGlicemia)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JEJUM">Jejum</SelectItem>
                    <SelectItem value="POS_PRANDIAL">Pós-Prandial</SelectItem>
                    <SelectItem value="ALEATORIA">Aleatória</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* ANTROPOMETRIA */}
          <TabsContent value="antropometria" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="peso">Peso (kg)</Label>
                <Input
                  id="peso"
                  type="number"
                  step="0.1"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  placeholder="Ex: 70.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="altura">Altura (m)</Label>
                <Input
                  id="altura"
                  type="number"
                  step="0.01"
                  value={altura}
                  onChange={(e) => setAltura(e.target.value)}
                  placeholder="Ex: 1.75"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imc">IMC (kg/m²)</Label>
                <div className="relative">
                  <Input
                    id="imc"
                    value={imc}
                    readOnly
                    placeholder="Auto-calculado"
                    className="bg-gray-50"
                  />
                  {imc && (
                    <div className="absolute right-2 top-2">
                      <Badge variant="outline" className={getIMCClassificacao(parseFloat(imc)).cor}>
                        {getIMCClassificacao(parseFloat(imc)).texto}
                      </Badge>
                    </div>
                  )}
                </div>
                {imc && (
                  <p className={`text-sm font-medium ${getIMCClassificacao(parseFloat(imc)).cor}`}>
                    {getIMCClassificacao(parseFloat(imc)).texto}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="perimetroCefalico">Perímetro Cefálico (cm)</Label>
                <Input
                  id="perimetroCefalico"
                  type="number"
                  step="0.1"
                  value={perimetroCefalico}
                  onChange={(e) => setPerimetroCefalico(e.target.value)}
                  placeholder="Ex: 35.5"
                />
                <p className="text-xs text-gray-500">Para crianças até 2 anos</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="circunferenciaAbdominal">Circunferência Abdominal (cm)</Label>
                <Input
                  id="circunferenciaAbdominal"
                  type="number"
                  step="0.1"
                  value={circunferenciaAbdominal}
                  onChange={(e) => setCircunferenciaAbdominal(e.target.value)}
                  placeholder="Ex: 85.0"
                />
              </div>
            </div>
          </TabsContent>

          {/* AVALIAÇÃO */}
          <TabsContent value="avaliacao" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="queixaPrincipal">Queixa Principal *</Label>
              <Textarea
                id="queixaPrincipal"
                value={queixaPrincipal}
                onChange={(e) => setQueixaPrincipal(e.target.value)}
                placeholder="Descreva a queixa principal do paciente..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="historiaDoencaAtual">História da Doença Atual</Label>
              <Textarea
                id="historiaDoencaAtual"
                value={historiaDoencaAtual}
                onChange={(e) => setHistoriaDoencaAtual(e.target.value)}
                placeholder="Evolução do quadro, sintomas associados..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alergiasConhecidas">Alergias Conhecidas</Label>
              <Input
                id="alergiasConhecidas"
                value={alergiasConhecidas}
                onChange={(e) => setAlergiasConhecidas(e.target.value)}
                placeholder="Ex: Penicilina, dipirona..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicamentosUso">Medicamentos em Uso</Label>
              <Textarea
                id="medicamentosUso"
                value={medicamentosUso}
                onChange={(e) => setMedicamentosUso(e.target.value)}
                placeholder="Liste os medicamentos que o paciente utiliza regularmente..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comorbidades">Comorbidades</Label>
              <Input
                id="comorbidades"
                value={comorbidades}
                onChange={(e) => setComorbidades(e.target.value)}
                placeholder="Ex: Diabetes, Hipertensão..."
              />
            </div>
          </TabsContent>

          {/* CLASSIFICAÇÃO MANCHESTER */}
          <TabsContent value="classificacao" className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-2">Classificação de Risco Manchester</h4>
              <p className="text-sm text-yellow-700">
                Avalie a urgência do atendimento de acordo com o Protocolo de Manchester
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="classificacaoRisco">Classificação de Risco *</Label>
              <Select
                value={classificacaoRisco}
                onValueChange={(v) => setClassificacaoRisco(v as ClassificacaoManchester)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMERGENCIA">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      <span className="font-semibold">Vermelho - Emergência</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="MUITO_URGENTE">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                      <span className="font-semibold">Laranja - Muito Urgente</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="URGENTE">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                      <span className="font-semibold">Amarelo - Urgente</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="POUCO_URGENTE">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500"></div>
                      <span className="font-semibold">Verde - Pouco Urgente</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="NAO_URGENTE">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                      <span className="font-semibold">Azul - Não Urgente</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 mt-2">
                <Badge className={CORES_MANCHESTER[classificacaoRisco]}>
                  {classificacaoRisco.replace(/_/g, ' ')}
                </Badge>
                <span className="text-sm text-gray-600">
                  {getTempoAtendimentoManchester(classificacaoRisco)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discriminadorUtilizado">Discriminador Utilizado</Label>
              <Input
                id="discriminadorUtilizado"
                value={discriminadorUtilizado}
                onChange={(e) => setDiscriminadorUtilizado(e.target.value)}
                placeholder="Ex: Dor torácica, dificuldade respiratória..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações adicionais sobre a triagem..."
                rows={3}
              />
            </div>
          </TabsContent>
        </Tabs>

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
              'Salvar Triagem'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
