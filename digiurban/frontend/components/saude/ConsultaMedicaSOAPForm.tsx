'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Save, FileText, Activity, Heart, Pill } from 'lucide-react';

interface ConsultaMedicaSOAPFormProps {
  citizenId: string;
  atendimentoId?: string;
}

export function ConsultaMedicaSOAPForm({
  citizenId,
  atendimentoId,
}: ConsultaMedicaSOAPFormProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // S - SUBJETIVO
  const [motivoConsulta, setMotivoConsulta] = useState('');
  const [historiaAtual, setHistoriaAtual] = useState('');
  const [historiaPregressa, setHistoriaPregressa] = useState('');
  const [historiaFamiliar, setHistoriaFamiliar] = useState('');
  const [historiaSocial, setHistoriaSocial] = useState('');

  // O - OBJETIVO
  const [pressaoArterial, setPressaoArterial] = useState('');
  const [temperatura, setTemperatura] = useState('');
  const [frequenciaCardiaca, setFrequenciaCardiaca] = useState('');
  const [frequenciaRespiratoria, setFrequenciaRespiratoria] = useState('');
  const [saturacaoO2, setSaturacaoO2] = useState('');
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [imc, setIMC] = useState('');
  const [circunferenciaAbdominal, setCircunferenciaAbdominal] = useState('');
  const [exameFisicoGeral, setExameFisicoGeral] = useState('');
  const [exameSistemaCardio, setExameSistemaCardio] = useState('');
  const [exameSistemaResp, setExameSistemaResp] = useState('');
  const [exameSistemaGastro, setExameSistemaGastro] = useState('');
  const [exameSistemaNeuro, setExameSistemaNeuro] = useState('');
  const [exameSistemaOutros, setExameSistemaOutros] = useState('');

  // A - AVALIAÇÃO
  const [hipoteseDiagnostica, setHipoteseDiagnostica] = useState('');
  const [diagnosticoPrincipalCID10, setDiagnosticoPrincipalCID10] = useState('');
  const [diagnosticoPrincipalDescricao, setDiagnosticoPrincipalDescricao] = useState('');
  const [diagnosticoPrincipalCIAP2, setDiagnosticoPrincipalCIAP2] = useState('');
  const [diagnosticosSecundarios, setDiagnosticosSecundarios] = useState<string[]>([]);

  // P - PLANO
  const [condutaTerapeutica, setCondutaTerapeutica] = useState('');
  const [orientacoes, setOrientacoes] = useState('');
  const [retornoNecessario, setRetornoNecessario] = useState(false);
  const [prazoRetornoDias, setPrazoRetornoDias] = useState('');
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

  const handleSave = async () => {
    try {
      setSaving(true);

      const data = {
        citizenId,
        atendimentoId,
        // Subjetivo
        motivoConsulta,
        historiaAtual,
        historiaPregressa,
        historiaFamiliar,
        historiaSocial,
        // Objetivo
        sinaisVitais: {
          pressaoArterial: pressaoArterial || undefined,
          temperatura: temperatura ? parseFloat(temperatura) : undefined,
          frequenciaCardiaca: frequenciaCardiaca ? parseInt(frequenciaCardiaca) : undefined,
          frequenciaRespiratoria: frequenciaRespiratoria
            ? parseInt(frequenciaRespiratoria)
            : undefined,
          saturacaoO2: saturacaoO2 ? parseFloat(saturacaoO2) : undefined,
        },
        antropometria: {
          peso: peso ? parseFloat(peso) : undefined,
          altura: altura ? parseFloat(altura) : undefined,
          imc: imc ? parseFloat(imc) : undefined,
          circunferenciaAbdominal: circunferenciaAbdominal
            ? parseFloat(circunferenciaAbdominal)
            : undefined,
        },
        exameFisicoGeral,
        exameFisicoSistemas: {
          cardiovascular: exameSistemaCardio || undefined,
          respiratorio: exameSistemaResp || undefined,
          gastrointestinal: exameSistemaGastro || undefined,
          neurologico: exameSistemaNeuro || undefined,
          outros: exameSistemaOutros || undefined,
        },
        // Avaliação
        hipoteseDiagnostica,
        diagnosticoPrincipal: {
          cid10: diagnosticoPrincipalCID10 || undefined,
          ciap2: diagnosticoPrincipalCIAP2 || undefined,
          descricao: diagnosticoPrincipalDescricao || undefined,
        },
        diagnosticosSecundarios,
        // Plano
        condutaTerapeutica,
        orientacoes,
        retornoNecessario,
        prazoRetornoDias: prazoRetornoDias ? parseInt(prazoRetornoDias) : undefined,
        observacoes,
      };

      const response = await fetch('/api/saude/consulta-medica', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert('Consulta salva com sucesso!');
      } else {
        throw new Error('Erro ao salvar consulta');
      }
    } catch (error) {
      console.error('Erro ao salvar consulta:', error);
      alert('Erro ao salvar consulta médica');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Consulta Médica - SOAP</h2>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Consulta
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="subjetivo" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="subjetivo" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Subjetivo
          </TabsTrigger>
          <TabsTrigger value="objetivo" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Objetivo
          </TabsTrigger>
          <TabsTrigger value="avaliacao" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Avaliação
          </TabsTrigger>
          <TabsTrigger value="plano" className="flex items-center gap-2">
            <Pill className="h-4 w-4" />
            Plano
          </TabsTrigger>
        </TabsList>

        {/* S - SUBJETIVO */}
        <TabsContent value="subjetivo">
          <Card>
            <CardHeader>
              <CardTitle>S - Subjetivo</CardTitle>
              <p className="text-sm text-gray-500">
                Informações relatadas pelo paciente
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="motivoConsulta">Motivo da Consulta *</Label>
                <Textarea
                  id="motivoConsulta"
                  value={motivoConsulta}
                  onChange={(e) => setMotivoConsulta(e.target.value)}
                  placeholder="Por que o paciente procurou o serviço?"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="historiaAtual">História da Doença Atual (HDA)</Label>
                <Textarea
                  id="historiaAtual"
                  value={historiaAtual}
                  onChange={(e) => setHistoriaAtual(e.target.value)}
                  placeholder="Descrição detalhada da queixa principal, início dos sintomas, evolução, características, fatores de melhora/piora..."
                  rows={5}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="historiaPregressa">História Médica Pregressa</Label>
                <Textarea
                  id="historiaPregressa"
                  value={historiaPregressa}
                  onChange={(e) => setHistoriaPregressa(e.target.value)}
                  placeholder="Doenças anteriores, cirurgias, internações, traumas..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="historiaFamiliar">História Familiar</Label>
                <Textarea
                  id="historiaFamiliar"
                  value={historiaFamiliar}
                  onChange={(e) => setHistoriaFamiliar(e.target.value)}
                  placeholder="Doenças na família (pais, irmãos, avós): diabetes, hipertensão, câncer, doenças cardíacas..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="historiaSocial">História Social</Label>
                <Textarea
                  id="historiaSocial"
                  value={historiaSocial}
                  onChange={(e) => setHistoriaSocial(e.target.value)}
                  placeholder="Hábitos de vida: tabagismo, etilismo, atividade física, alimentação, condições de moradia, trabalho..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* O - OBJETIVO */}
        <TabsContent value="objetivo">
          <Card>
            <CardHeader>
              <CardTitle>O - Objetivo</CardTitle>
              <p className="text-sm text-gray-500">
                Dados observáveis e mensuráveis
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sinais Vitais */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Sinais Vitais</h3>
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
                    <Label htmlFor="frequenciaCardiaca">FC (bpm)</Label>
                    <Input
                      id="frequenciaCardiaca"
                      type="number"
                      value={frequenciaCardiaca}
                      onChange={(e) => setFrequenciaCardiaca(e.target.value)}
                      placeholder="Ex: 80"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="frequenciaRespiratoria">FR (irpm)</Label>
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
                </div>
              </div>

              <Separator />

              {/* Antropometria */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Antropometria</h3>
                <div className="grid grid-cols-4 gap-4">
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
                    <Input
                      id="imc"
                      value={imc}
                      readOnly
                      placeholder="Auto-calculado"
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="circunferenciaAbdominal">Circ. Abdominal (cm)</Label>
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
              </div>

              <Separator />

              {/* Exame Físico */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Exame Físico</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="exameFisicoGeral">Exame Físico Geral</Label>
                    <Textarea
                      id="exameFisicoGeral"
                      value={exameFisicoGeral}
                      onChange={(e) => setExameFisicoGeral(e.target.value)}
                      placeholder="Estado geral, consciência, hidratação, coloração, fácies, marcha..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exameSistemaCardio">Sistema Cardiovascular</Label>
                    <Textarea
                      id="exameSistemaCardio"
                      value={exameSistemaCardio}
                      onChange={(e) => setExameSistemaCardio(e.target.value)}
                      placeholder="Ausculta cardíaca, sopros, ritmo, bulhas, pulsos..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exameSistemaResp">Sistema Respiratório</Label>
                    <Textarea
                      id="exameSistemaResp"
                      value={exameSistemaResp}
                      onChange={(e) => setExameSistemaResp(e.target.value)}
                      placeholder="Ausculta pulmonar, murmúrio vesicular, ruídos adventícios..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exameSistemaGastro">Sistema Gastrointestinal</Label>
                    <Textarea
                      id="exameSistemaGastro"
                      value={exameSistemaGastro}
                      onChange={(e) => setExameSistemaGastro(e.target.value)}
                      placeholder="Abdome: inspeção, palpação, percussão, ausculta..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exameSistemaNeuro">Sistema Neurológico</Label>
                    <Textarea
                      id="exameSistemaNeuro"
                      value={exameSistemaNeuro}
                      onChange={(e) => setExameSistemaNeuro(e.target.value)}
                      placeholder="Consciência, orientação, força, reflexos, sensibilidade..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exameSistemaOutros">Outros Sistemas</Label>
                    <Textarea
                      id="exameSistemaOutros"
                      value={exameSistemaOutros}
                      onChange={(e) => setExameSistemaOutros(e.target.value)}
                      placeholder="Músculo-esquelético, dermatológico, oftalmológico, ORL..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* A - AVALIAÇÃO */}
        <TabsContent value="avaliacao">
          <Card>
            <CardHeader>
              <CardTitle>A - Avaliação</CardTitle>
              <p className="text-sm text-gray-500">
                Hipóteses diagnósticas e diagnósticos
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="hipoteseDiagnostica">Hipótese Diagnóstica</Label>
                <Textarea
                  id="hipoteseDiagnostica"
                  value={hipoteseDiagnostica}
                  onChange={(e) => setHipoteseDiagnostica(e.target.value)}
                  placeholder="Possíveis diagnósticos considerados..."
                  rows={3}
                />
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Diagnóstico Principal</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="diagnosticoPrincipalCID10">CID-10</Label>
                    <Input
                      id="diagnosticoPrincipalCID10"
                      value={diagnosticoPrincipalCID10}
                      onChange={(e) => setDiagnosticoPrincipalCID10(e.target.value)}
                      placeholder="Ex: I10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="diagnosticoPrincipalCIAP2">CIAP-2</Label>
                    <Input
                      id="diagnosticoPrincipalCIAP2"
                      value={diagnosticoPrincipalCIAP2}
                      onChange={(e) => setDiagnosticoPrincipalCIAP2(e.target.value)}
                      placeholder="Ex: K86"
                    />
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="diagnosticoPrincipalDescricao">Descrição</Label>
                  <Input
                    id="diagnosticoPrincipalDescricao"
                    value={diagnosticoPrincipalDescricao}
                    onChange={(e) => setDiagnosticoPrincipalDescricao(e.target.value)}
                    placeholder="Ex: Hipertensão arterial essencial"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Diagnósticos Secundários</Label>
                <p className="text-sm text-gray-500">
                  Adicione outros diagnósticos relevantes (funcionalidade a implementar)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* P - PLANO */}
        <TabsContent value="plano">
          <Card>
            <CardHeader>
              <CardTitle>P - Plano</CardTitle>
              <p className="text-sm text-gray-500">
                Conduta, tratamento e orientações
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="condutaTerapeutica">Conduta Terapêutica</Label>
                <Textarea
                  id="condutaTerapeutica"
                  value={condutaTerapeutica}
                  onChange={(e) => setCondutaTerapeutica(e.target.value)}
                  placeholder="Plano de tratamento, medicações, procedimentos..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="orientacoes">Orientações ao Paciente</Label>
                <Textarea
                  id="orientacoes"
                  value={orientacoes}
                  onChange={(e) => setOrientacoes(e.target.value)}
                  placeholder="Orientações sobre hábitos de vida, sinais de alerta, cuidados..."
                  rows={4}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="retornoNecessario"
                    checked={retornoNecessario}
                    onCheckedChange={(checked) => setRetornoNecessario(checked as boolean)}
                  />
                  <Label htmlFor="retornoNecessario" className="cursor-pointer">
                    Retorno necessário
                  </Label>
                </div>

                {retornoNecessario && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="prazoRetornoDias">Prazo de Retorno (dias)</Label>
                    <Input
                      id="prazoRetornoDias"
                      type="number"
                      value={prazoRetornoDias}
                      onChange={(e) => setPrazoRetornoDias(e.target.value)}
                      placeholder="Ex: 30"
                      className="w-32"
                    />
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações Adicionais</Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações gerais sobre o atendimento..."
                  rows={3}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Após salvar a consulta, você poderá adicionar prescrições,
                  solicitar exames, emitir atestados e fazer encaminhamentos nas abas específicas do prontuário.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
