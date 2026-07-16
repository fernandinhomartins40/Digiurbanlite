'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { obterProntuarioCidadao } from '@/lib/api/atendimento-api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  User,
  FileText,
  Calendar,
  Pill,
  FileCheck,
  ArrowRight,
  AlertCircle,
  Activity,
  Download,
  ArrowLeft,
  Syringe,
  Plus,
} from 'lucide-react';

export default function ProntuarioPage() {
  const params = useParams();
  const router = useRouter();
  const [prontuario, setProntuario] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('consultas');
  const [imunizacoes, setImunizacoes] = useState<any[]>([]);
  const [vacinaDialogAberto, setVacinaDialogAberto] = useState(false);
  const [salvandoVacina, setSalvandoVacina] = useState(false);
  const [novaVacina, setNovaVacina] = useState({
    vacina: '',
    dose: '',
    lote: '',
    dataAplicacao: new Date().toISOString().split('T')[0],
    observacoes: '',
  });

  useEffect(() => {
    if (params.id) {
      loadProntuario(params.id as string);
      loadImunizacoes(params.id as string);
    }
  }, [params.id]);

  const loadProntuario = async (citizenId: string) => {
    try {
      const data = await obterProntuarioCidadao(citizenId);
      setProntuario(data);
    } catch (error) {
      console.error('Erro ao carregar prontuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadImunizacoes = async (citizenId: string) => {
    try {
      const res = await fetch(`/api/saude/imunizacao/cidadao/${citizenId}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setImunizacoes(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar imunizações:', error);
    }
  };

  const registrarVacina = async () => {
    if (!novaVacina.vacina || !novaVacina.dose) {
      alert('Informe a vacina e a dose');
      return;
    }
    setSalvandoVacina(true);
    try {
      const res = await fetch('/api/saude/imunizacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...novaVacina, citizenId: params.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao registrar dose');
      }
      setVacinaDialogAberto(false);
      setNovaVacina({
        vacina: '',
        dose: '',
        lote: '',
        dataAplicacao: new Date().toISOString().split('T')[0],
        observacoes: '',
      });
      await loadImunizacoes(params.id as string);
    } catch (error: any) {
      alert(String(error?.message || error));
    } finally {
      setSalvandoVacina(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando prontuário...</div>
        </div>
      </div>
    );
  }

  if (!prontuario) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Prontuário não encontrado</h2>
            <p className="text-gray-500 mb-4">
              Não foi possível carregar o prontuário deste paciente
            </p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { cidadao, atendimentos, consultas, prescricoes, exames, encaminhamentos, atestados } =
    prontuario;

  return (
    <div className="p-6 space-y-6">
      {/* Header com dados do paciente */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{cidadao?.name || 'Paciente'}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span>CPF: {cidadao?.cpf || '-'}</span>
              {cidadao?.birthDate && (
                <span>
                  Nascimento: {new Date(cidadao.birthDate).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
            {cidadao?.phone && (
              <div className="text-sm text-gray-600 mt-1">Telefone: {cidadao.phone}</div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Prontuário
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Atendimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{atendimentos?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Consultas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultas?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Pill className="h-4 w-4" />
              Prescrições
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prescricoes?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Exames
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exames?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs do Prontuário */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="consultas">
                <FileText className="h-4 w-4 mr-2" />
                Consultas
              </TabsTrigger>
              <TabsTrigger value="prescricoes">
                <Pill className="h-4 w-4 mr-2" />
                Prescrições
              </TabsTrigger>
              <TabsTrigger value="exames">
                <FileCheck className="h-4 w-4 mr-2" />
                Exames
              </TabsTrigger>
              <TabsTrigger value="atestados">
                <Calendar className="h-4 w-4 mr-2" />
                Atestados
              </TabsTrigger>
              <TabsTrigger value="encaminhamentos">
                <ArrowRight className="h-4 w-4 mr-2" />
                Encaminhamentos
              </TabsTrigger>
              <TabsTrigger value="vacinas">
                <Syringe className="h-4 w-4 mr-2" />
                Vacinas
              </TabsTrigger>
            </TabsList>

            {/* Consultas */}
            <TabsContent value="consultas" className="space-y-4">
              {!consultas || consultas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma consulta registrada
                </div>
              ) : (
                consultas.map((consulta: any) => (
                  <Card key={consulta.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {new Date(consulta.dataHora).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(consulta.dataHora).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </CardTitle>
                        <Badge variant="outline">
                          Dr(a). {consulta.medico?.name || 'Médico'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {consulta.queixaPrincipal && (
                        <div>
                          <div className="text-sm font-medium text-gray-700">
                            Queixa Principal
                          </div>
                          <div className="text-sm text-gray-600">
                            {consulta.queixaPrincipal}
                          </div>
                        </div>
                      )}
                      {consulta.diagnosticos && (
                        <div>
                          <div className="text-sm font-medium text-gray-700">Diagnóstico</div>
                          <div className="text-sm text-gray-600">
                            {JSON.stringify(consulta.diagnosticos)}
                          </div>
                        </div>
                      )}
                      {consulta.conduta && (
                        <div>
                          <div className="text-sm font-medium text-gray-700">Conduta</div>
                          <div className="text-sm text-gray-600">{consulta.conduta}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Prescrições */}
            <TabsContent value="prescricoes" className="space-y-4">
              {!prescricoes || prescricoes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma prescrição registrada
                </div>
              ) : (
                prescricoes.map((prescricao: any) => (
                  <Card key={prescricao.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {new Date(prescricao.dataHora).toLocaleDateString('pt-BR')}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Badge variant="outline">
                            {prescricao.medicamentos?.length || 0} medicamento(s)
                          </Badge>
                          {prescricao.validade && (
                            <Badge variant="secondary">
                              Válido até:{' '}
                              {new Date(prescricao.validade).toLocaleDateString('pt-BR')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Array.isArray(prescricao.medicamentos) &&
                          prescricao.medicamentos.map((med: any, idx: number) => (
                            <div key={idx} className="p-3 border rounded-lg">
                              <div className="font-medium">{med.nome || med.medicamento}</div>
                              {med.posologia && (
                                <div className="text-sm text-gray-600">{med.posologia}</div>
                              )}
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Exames */}
            <TabsContent value="exames" className="space-y-4">
              {!exames || exames.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum exame solicitado
                </div>
              ) : (
                exames.map((exame: any) => (
                  <Card key={exame.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{exame.tipoExame}</CardTitle>
                        <Badge
                          variant={
                            exame.status === 'REALIZADO'
                              ? 'default'
                              : exame.status === 'AGENDADO'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {exame.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {exame.justificativa && (
                        <div className="text-sm text-gray-600">{exame.justificativa}</div>
                      )}
                      {exame.dataSolicitacao && (
                        <div className="text-xs text-gray-500 mt-2">
                          Solicitado em:{' '}
                          {new Date(exame.dataSolicitacao).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Atestados */}
            <TabsContent value="atestados" className="space-y-4">
              {!atestados || atestados.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum atestado emitido
                </div>
              ) : (
                atestados.map((atestado: any) => (
                  <Card key={atestado.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {atestado.tipo === 'AFASTAMENTO'
                            ? 'Atestado de Afastamento'
                            : atestado.tipo === 'COMPARECIMENTO'
                            ? 'Atestado de Comparecimento'
                            : 'Atestado para Acompanhante'}
                        </CardTitle>
                        <Badge variant="outline">
                          {atestado.diasAfastamento || 0} dia(s)
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {atestado.dataInicio && atestado.dataFim && (
                        <div className="text-sm text-gray-600">
                          Período: {new Date(atestado.dataInicio).toLocaleDateString('pt-BR')}{' '}
                          até {new Date(atestado.dataFim).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                      {atestado.observacoes && (
                        <div className="text-sm text-gray-600 mt-2">
                          {atestado.observacoes}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Encaminhamentos */}
            <TabsContent value="encaminhamentos" className="space-y-4">
              {!encaminhamentos || encaminhamentos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum encaminhamento registrado
                </div>
              ) : (
                encaminhamentos.map((encaminhamento: any) => (
                  <Card key={encaminhamento.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          Encaminhamento para {encaminhamento.especialidade}
                        </CardTitle>
                        <Badge
                          variant={
                            encaminhamento.prioridade === 'URGENCIA'
                              ? 'destructive'
                              : 'outline'
                          }
                        >
                          {encaminhamento.prioridade}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {encaminhamento.motivo && (
                        <div className="text-sm text-gray-600">{encaminhamento.motivo}</div>
                      )}
                      {encaminhamento.dataHora && (
                        <div className="text-xs text-gray-500 mt-2">
                          Emitido em:{' '}
                          {new Date(encaminhamento.dataHora).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Vacinas */}
            <TabsContent value="vacinas" className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setVacinaDialogAberto(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar dose
                </Button>
              </div>
              {imunizacoes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma vacina registrada
                </div>
              ) : (
                imunizacoes.map((dose: any) => (
                  <Card key={dose.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Syringe className="h-4 w-4 text-green-600" />
                          {dose.vacina}
                        </CardTitle>
                        <Badge variant="outline">{dose.dose}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600">
                        Aplicada em{' '}
                        {new Date(dose.dataAplicacao).toLocaleDateString('pt-BR')}
                        {dose.lote && ` | Lote: ${dose.lote}`}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {dose.unidade?.nome && `Unidade: ${dose.unidade.nome}`}
                        {dose.profissional?.name &&
                          ` | Profissional: ${dose.profissional.name}`}
                      </div>
                      {dose.observacoes && (
                        <div className="text-sm text-gray-600 mt-2">{dose.observacoes}</div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog registrar vacina */}
      <Dialog open={vacinaDialogAberto} onOpenChange={setVacinaDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar dose de vacina</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="vacina-nome">Vacina *</Label>
              <Input
                id="vacina-nome"
                placeholder="Ex.: Influenza, COVID-19, Tétano"
                value={novaVacina.vacina}
                onChange={(e) => setNovaVacina({ ...novaVacina, vacina: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vacina-dose">Dose *</Label>
                <Input
                  id="vacina-dose"
                  placeholder="Ex.: 1ª dose, Reforço"
                  value={novaVacina.dose}
                  onChange={(e) => setNovaVacina({ ...novaVacina, dose: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="vacina-lote">Lote</Label>
                <Input
                  id="vacina-lote"
                  value={novaVacina.lote}
                  onChange={(e) => setNovaVacina({ ...novaVacina, lote: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="vacina-data">Data da aplicação</Label>
              <Input
                id="vacina-data"
                type="date"
                value={novaVacina.dataAplicacao}
                onChange={(e) =>
                  setNovaVacina({ ...novaVacina, dataAplicacao: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="vacina-obs">Observações</Label>
              <Input
                id="vacina-obs"
                value={novaVacina.observacoes}
                onChange={(e) =>
                  setNovaVacina({ ...novaVacina, observacoes: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVacinaDialogAberto(false)}
              disabled={salvandoVacina}
            >
              Cancelar
            </Button>
            <Button onClick={registrarVacina} disabled={salvandoVacina}>
              {salvandoVacina ? 'Salvando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
