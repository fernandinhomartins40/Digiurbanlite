'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { criarConsultaMedica } from '@/lib/api/atendimento-api';
import {
  FileText,
  Stethoscope,
  ClipboardList,
  Pill,
  FileCheck,
  ArrowRight,
} from 'lucide-react';

export default function ConsultaMedicaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('anamnese');
  const [formData, setFormData] = useState({
    atendimentoId: '',
    medicoId: '',
    queixaPrincipal: '',
    historiaDoencaAtual: '',
    historicoMedico: '',
    exameFisico: '',
    hipoteseDiagnostica: '',
    diagnosticoPrincipal: '',
    diagnosticosSecundarios: '',
    conduta: '',
    observacoes: '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const diagnosticos: any = {};

      if (formData.diagnosticoPrincipal) {
        diagnosticos.principal = { descricao: formData.diagnosticoPrincipal };
      }

      if (formData.diagnosticosSecundarios) {
        diagnosticos.secundarios = formData.diagnosticosSecundarios
          .split('\n')
          .filter((d: string) => d.trim())
          .map((d: string) => ({ descricao: d.trim() }));
      }

      await criarConsultaMedica({
        atendimentoId: formData.atendimentoId,
        medicoId: formData.medicoId,
        queixaPrincipal: formData.queixaPrincipal,
        historiaDoencaAtual: formData.historiaDoencaAtual,
        historicoMedico: formData.historicoMedico || undefined,
        exameFisico: formData.exameFisico,
        hipoteseDiagnostica: formData.hipoteseDiagnostica || undefined,
        diagnosticos: Object.keys(diagnosticos).length > 0 ? diagnosticos : undefined,
        conduta: formData.conduta,
        observacoes: formData.observacoes || undefined,
      });

      alert('Consulta registrada com sucesso!');
      router.push('/admin/apps/saude/atendimento');
    } catch (error) {
      console.error('Erro ao registrar consulta:', error);
      alert('Erro ao registrar consulta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Consulta Médica</h1>
          <p className="text-gray-500 mt-1">Registro completo da consulta médica</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Básicos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Dados Básicos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="atendimentoId">ID do Atendimento *</Label>
                <Input
                  id="atendimentoId"
                  value={formData.atendimentoId}
                  onChange={(e) => handleChange('atendimentoId', e.target.value)}
                  placeholder="Digite o ID do atendimento"
                  required
                />
              </div>
              <div>
                <Label htmlFor="medicoId">ID do Médico *</Label>
                <Input
                  id="medicoId"
                  value={formData.medicoId}
                  onChange={(e) => handleChange('medicoId', e.target.value)}
                  placeholder="Digite o ID do médico"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de Consulta */}
        <Card>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="anamnese" className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Anamnese
                </TabsTrigger>
                <TabsTrigger value="exame" className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Exame Físico
                </TabsTrigger>
                <TabsTrigger value="diagnostico" className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  Diagnóstico
                </TabsTrigger>
                <TabsTrigger value="conduta" className="flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  Conduta
                </TabsTrigger>
              </TabsList>

              {/* Anamnese */}
              <TabsContent value="anamnese" className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="queixaPrincipal">Queixa Principal *</Label>
                  <Textarea
                    id="queixaPrincipal"
                    value={formData.queixaPrincipal}
                    onChange={(e) => handleChange('queixaPrincipal', e.target.value)}
                    placeholder="Descreva a queixa principal do paciente"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="historiaDoencaAtual">
                    História da Doença Atual *
                  </Label>
                  <Textarea
                    id="historiaDoencaAtual"
                    value={formData.historiaDoencaAtual}
                    onChange={(e) => handleChange('historiaDoencaAtual', e.target.value)}
                    placeholder="Descreva a evolução da doença atual"
                    rows={6}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="historicoMedico">Histórico Médico</Label>
                  <Textarea
                    id="historicoMedico"
                    value={formData.historicoMedico}
                    onChange={(e) => handleChange('historicoMedico', e.target.value)}
                    placeholder="Antecedentes pessoais, familiares, cirurgias prévias, etc."
                    rows={4}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setActiveTab('exame')}
                    className="flex items-center gap-2"
                  >
                    Próximo: Exame Físico
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Exame Físico */}
              <TabsContent value="exame" className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="exameFisico">Exame Físico *</Label>
                  <Textarea
                    id="exameFisico"
                    value={formData.exameFisico}
                    onChange={(e) => handleChange('exameFisico', e.target.value)}
                    placeholder="Descreva os achados do exame físico detalhado"
                    rows={8}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Inclua: estado geral, sinais vitais, exame segmentar (cabeça e
                    pescoço, tórax, abdome, membros, sistema nervoso)
                  </p>
                </div>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab('anamnese')}
                  >
                    Voltar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveTab('diagnostico')}
                    className="flex items-center gap-2"
                  >
                    Próximo: Diagnóstico
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Diagnóstico */}
              <TabsContent value="diagnostico" className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="hipoteseDiagnostica">Hipótese Diagnóstica</Label>
                  <Textarea
                    id="hipoteseDiagnostica"
                    value={formData.hipoteseDiagnostica}
                    onChange={(e) => handleChange('hipoteseDiagnostica', e.target.value)}
                    placeholder="Descreva as hipóteses diagnósticas consideradas"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="diagnosticoPrincipal">Diagnóstico Principal</Label>
                  <Input
                    id="diagnosticoPrincipal"
                    value={formData.diagnosticoPrincipal}
                    onChange={(e) => handleChange('diagnosticoPrincipal', e.target.value)}
                    placeholder="Ex: CID-10 + Descrição"
                  />
                </div>

                <div>
                  <Label htmlFor="diagnosticosSecundarios">
                    Diagnósticos Secundários
                  </Label>
                  <Textarea
                    id="diagnosticosSecundarios"
                    value={formData.diagnosticosSecundarios}
                    onChange={(e) =>
                      handleChange('diagnosticosSecundarios', e.target.value)
                    }
                    placeholder="Um diagnóstico por linha"
                    rows={4}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Digite um diagnóstico por linha
                  </p>
                </div>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab('exame')}
                  >
                    Voltar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveTab('conduta')}
                    className="flex items-center gap-2"
                  >
                    Próximo: Conduta
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Conduta */}
              <TabsContent value="conduta" className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="conduta">Conduta Terapêutica *</Label>
                  <Textarea
                    id="conduta"
                    value={formData.conduta}
                    onChange={(e) => handleChange('conduta', e.target.value)}
                    placeholder="Descreva a conduta adotada: tratamento medicamentoso, procedimentos, encaminhamentos, orientações"
                    rows={6}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => handleChange('observacoes', e.target.value)}
                    placeholder="Observações adicionais sobre a consulta"
                    rows={3}
                  />
                </div>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab('diagnostico')}
                  >
                    Voltar
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Finalizar Consulta'}
          </Button>
        </div>
      </form>
    </div>
  );
}
