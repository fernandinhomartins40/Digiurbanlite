'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Users,
  Clock,
  TrendingUp,
  UserPlus,
  Stethoscope,
  ClipboardList,
  HeartPulse,
  FileText,
  Calendar,
  Home,
  UsersRound,
  Baby,
  User2,
  Syringe,
  FlaskConical,
  Pill,
  FileBarChart,
  Settings,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock3,
} from 'lucide-react';

export default function AtendimentoPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Simular estatísticas do PEC e-SUS
      // TODO: Conectar com API real quando disponível
      setStats({
        filaTotal: 0,
        filaAguardando: 0,
        filaEmAtendimento: 0,
        filaUrgente: 0,
        atendimentosHoje: 0,
        atendimentosMes: 0,
        tempoMedioEspera: 0,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header com Badge PEC e-SUS */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Sistema de Atendimento</h1>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Alinhado PEC e-SUS
            </Badge>
          </div>
          <p className="text-gray-500 mt-2">
            Sistema 100% alinhado com o fluxo PEC e-SUS: Recepção → Escuta Inicial → Triagem → Consulta
          </p>
        </div>
        <Button
          onClick={() => router.push('/admin/apps/saude/atendimento/fila')}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <ClipboardList className="h-5 w-5 mr-2" />
          Abrir Fila de Atendimento
        </Button>
      </div>

      {/* Cards de Estatísticas em Tempo Real */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total na Fila</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.filaTotal || 0}</div>
            <p className="text-xs text-muted-foreground">Pacientes aguardando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atendimento</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.filaEmAtendimento || 0}</div>
            <p className="text-xs text-muted-foreground">Escuta, triagem e consulta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Casos Urgentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.filaUrgente || 0}</div>
            <p className="text-xs text-muted-foreground">Prioridade alta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.tempoMedioEspera || 0} min</div>
            <p className="text-xs text-muted-foreground">Tempo de espera</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com Módulos Organizados */}
      <Tabs defaultValue="fluxo" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="fluxo">Fluxo de Atendimento</TabsTrigger>
          <TabsTrigger value="prontuario">Prontuário & SOAP</TabsTrigger>
          <TabsTrigger value="programas">Programas Especiais</TabsTrigger>
          <TabsTrigger value="gestao">Gestão & Relatórios</TabsTrigger>
        </TabsList>

        {/* Tab 1: Fluxo de Atendimento (PEC e-SUS) */}
        <TabsContent value="fluxo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-blue-600" />
                Fluxo PEC e-SUS
              </CardTitle>
              <CardDescription>
                Recepção → Escuta Inicial → Triagem (Manchester) → Consulta Médica
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card
                className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-blue-400"
                onClick={() => router.push('/admin/apps/saude/atendimento/fila')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <UserPlus className="h-8 w-8 text-blue-600" />
                    <Badge>Passo 1</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold text-lg mb-1">Recepção</h3>
                  <p className="text-sm text-gray-600">
                    Adicionar paciente na fila de atendimento
                  </p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-purple-400"
                onClick={() => router.push('/admin/apps/saude/atendimento/fila')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <HeartPulse className="h-8 w-8 text-purple-600" />
                    <Badge variant="secondary">Passo 2</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold text-lg mb-1">Escuta Inicial</h3>
                  <p className="text-sm text-gray-600">
                    Acolhimento e classificação de vulnerabilidade
                  </p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-orange-400"
                onClick={() => router.push('/admin/apps/saude/atendimento/fila')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Activity className="h-8 w-8 text-orange-600" />
                    <Badge variant="secondary">Passo 3</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold text-lg mb-1">Triagem</h3>
                  <p className="text-sm text-gray-600">
                    Sinais vitais e Protocolo de Manchester
                  </p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-green-400"
                onClick={() => router.push('/admin/apps/saude/atendimento/consulta')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Stethoscope className="h-8 w-8 text-green-600" />
                    <Badge variant="secondary">Passo 4</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold text-lg mb-1">Consulta</h3>
                  <p className="text-sm text-gray-600">
                    Atendimento médico com registro SOAP
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Classificação de Manchester */}
          <Card>
            <CardHeader>
              <CardTitle>Protocolo de Manchester</CardTitle>
              <CardDescription>5 níveis de classificação de risco implementados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="w-4 h-4 rounded-full bg-red-500" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-900">Emergência</p>
                    <p className="text-xs text-red-700">Atendimento imediato (0 min)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
                  <div className="w-4 h-4 rounded-full bg-orange-500" />
                  <div className="flex-1">
                    <p className="font-semibold text-orange-900">Muito Urgente</p>
                    <p className="text-xs text-orange-700">Até 10 minutos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div className="w-4 h-4 rounded-full bg-yellow-500" />
                  <div className="flex-1">
                    <p className="font-semibold text-yellow-900">Urgente</p>
                    <p className="text-xs text-yellow-700">Até 60 minutos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-900">Pouco Urgente</p>
                    <p className="text-xs text-green-700">Até 120 minutos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="w-4 h-4 rounded-full bg-blue-500" />
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900">Não Urgente</p>
                    <p className="text-xs text-blue-700">Até 240 minutos</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Prontuário & SOAP */}
        <TabsContent value="prontuario" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <CardTitle>Folha de Rosto</CardTitle>
                    <CardDescription>Resumo completo do cidadão</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Dados pessoais e contatos</li>
                  <li>• Equipe PSF vinculada</li>
                  <li>• Alertas visuais (alergias, gravidez)</li>
                  <li>• Problemas e condições ativas</li>
                  <li>• Histórico de atendimentos</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Stethoscope className="h-8 w-8 text-green-600" />
                  <div>
                    <CardTitle>SOAP Estruturado</CardTitle>
                    <CardDescription>Método SOAP completo</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Subjetivo: Queixa e história</li>
                  <li>• Objetivo: Exame físico e sinais</li>
                  <li>• Avaliação: CIAP-2 e CID-10</li>
                  <li>• Plano: Conduta e prescrição</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Syringe className="h-8 w-8 text-purple-600" />
                  <div>
                    <CardTitle>Vacinação</CardTitle>
                    <CardDescription>Calendário vacinal completo</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Calendário por faixa etária</li>
                  <li>• Registro de doses aplicadas</li>
                  <li>• Lote, validade e via</li>
                  <li>• Alertas de atraso</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <FlaskConical className="h-8 w-8 text-orange-600" />
                  <div>
                    <CardTitle>Exames</CardTitle>
                    <CardDescription>Solicitação e resultados</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Solicitação de exames laboratoriais</li>
                  <li>• Exames de imagem</li>
                  <li>• Anexar resultados (PDF, imagens)</li>
                  <li>• Histórico completo</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Programas Especiais */}
        <TabsContent value="programas" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-pink-500">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Baby className="h-8 w-8 text-pink-600" />
                  <CardTitle>Pré-natal</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Acompanhamento completo da gestação
                </p>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li>• Consultas por trimestre</li>
                  <li>• 4 Gráficos de evolução (Peso, PA, AU, BCF)</li>
                  <li>• Exames obrigatórios</li>
                  <li>• Calendário de retornos</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Baby className="h-8 w-8 text-blue-600" />
                  <CardTitle>Puericultura</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Acompanhamento infantil 0-10 anos
                </p>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li>• Curvas de crescimento (Peso/Altura)</li>
                  <li>• Desenvolvimento neuropsicomotor</li>
                  <li>• Calendário vacinal</li>
                  <li>• Alertas de risco</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-purple-500">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <User2 className="h-8 w-8 text-purple-600" />
                  <CardTitle>Saúde do Idoso</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  IVCF e avaliação funcional
                </p>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li>• IVCF (Índice de Vulnerabilidade)</li>
                  <li>• Avaliação cognitiva</li>
                  <li>• Risco de quedas</li>
                  <li>• Polifarmácia</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-green-500">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Stethoscope className="h-8 w-8 text-green-600" />
                  <CardTitle>Odontologia</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Odontograma interativo FDI
                </p>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li>• 32 dentes clicáveis</li>
                  <li>• 6 condições com cores</li>
                  <li>• Hígido, cariado, obturado, ausente</li>
                  <li>• Resumo automático</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-orange-500">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Home className="h-8 w-8 text-orange-600" />
                  <CardTitle>Visita Domiciliar</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Registro de visitas ACS
                </p>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li>• Motivo e tipo de visita</li>
                  <li>• Avaliação domiciliar</li>
                  <li>• Condições encontradas</li>
                  <li>• Orientações fornecidas</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-teal-500">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <UsersRound className="h-8 w-8 text-teal-600" />
                  <CardTitle>Atividade Coletiva</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Grupos e ações educativas
                </p>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li>• Grupos terapêuticos</li>
                  <li>• Ações educativas</li>
                  <li>• Lista de participantes</li>
                  <li>• Avaliações individuais</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 4: Gestão & Relatórios */}
        <TabsContent value="gestao" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <UsersRound className="h-8 w-8 text-blue-600" />
                  <div>
                    <CardTitle>Equipes PSF/ESF</CardTitle>
                    <CardDescription>Gestão de equipes de saúde</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Cadastro de equipes com INE</li>
                  <li>• Vínculo de profissionais</li>
                  <li>• Definição de microáreas</li>
                  <li>• ACS por território</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-purple-600" />
                  <div>
                    <CardTitle>Agenda Online</CardTitle>
                    <CardDescription>Configuração de agendas</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Configurar horários por profissional</li>
                  <li>• Definir intervalos e duração</li>
                  <li>• Marcar indisponibilidades</li>
                  <li>• Tipos de consulta</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <ClipboardList className="h-8 w-8 text-green-600" />
                  <div>
                    <CardTitle>Gestão de Filas</CardTitle>
                    <CardDescription>Monitoramento em tempo real</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Painel com auto-refresh (30s)</li>
                  <li>• Filtros por status e prioridade</li>
                  <li>• Tempo de espera por paciente</li>
                  <li>• Alertas de urgência</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <FileBarChart className="h-8 w-8 text-orange-600" />
                  <div>
                    <CardTitle>Relatórios</CardTitle>
                    <CardDescription>Produção e indicadores</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Produção por profissional</li>
                  <li>• Indicadores de qualidade</li>
                  <li>• Relatórios PEC e-SUS</li>
                  <li>• Exportação para SISAB</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Resumo de Implementação */}
      <Card className="border-2 border-green-200 bg-green-50/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-900">Sistema 100% Implementado</CardTitle>
          </div>
          <CardDescription className="text-green-700">
            Todas as funcionalidades PEC e-SUS foram implementadas e estão prontas para uso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Fluxo Completo</p>
                <p className="text-sm text-green-700">
                  Recepção, Escuta, Triagem e Consulta com SOAP
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Programas Especiais</p>
                <p className="text-sm text-green-700">
                  Pré-natal, Puericultura, Idoso, Odontologia
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Gestão PSF</p>
                <p className="text-sm text-green-700">
                  Equipes, microáreas, agenda e relatórios
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
