"use client";

import { useState } from "react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from "recharts";
import { LayoutDashboard, TrendingUp, Users, Building, MapPin, Clock, CheckCircle, AlertTriangle, FileText, Calendar, Target, Activity, Zap, Settings, Download, RefreshCw, Filter, ArrowUp, ArrowDown, Minus, Eye } from "lucide-react";

export default function DashboardPlanejamentoPage() {
  useAdminAuth("admin");

  const [periodoBusca, setPeriodoBusca] = useState("30");
  const [tipoVisao, setTipoVisao] = useState("geral");

  const dataResumoGeral = {
    atendimentos: {
      total: 1247,
      mes_atual: 98,
      variacao: 12,
      tempo_medio: "2.5 dias"
    },
    projetos: {
      total: 36,
      em_andamento: 24,
      concluidos_mes: 3,
      investimento: "R$ 12.800.000"
    },
    alvaras: {
      total: 342,
      mes_atual: 28,
      pendentes: 15,
      receita: "R$ 156.800"
    },
    consultas_publicas: {
      total: 8,
      ativas: 3,
      participacoes: 1547,
      audiencias: 12
    },
    denuncias: {
      total: 89,
      resolvidas: 67,
      em_analise: 22,
      prazo_medio: "7.2 dias"
    },
    mapa_urbano: {
      zonas: 63,
      loteamentos: 28,
      certidoes: 342,
      area_mapeada: "100%"
    }
  };

  const dataEvolucaoMensal = [
    { mes: "Jul", atendimentos: 87, projetos: 32, alvaras: 23, denuncias: 12 },
    { mes: "Ago", atendimentos: 94, projetos: 34, alvaras: 28, denuncias: 15 },
    { mes: "Set", atendimentos: 102, projetos: 35, alvaras: 31, denuncias: 11 },
    { mes: "Out", atendimentos: 89, projetos: 36, alvaras: 25, denuncias: 18 },
    { mes: "Nov", atendimentos: 95, projetos: 36, alvaras: 29, denuncias: 14 },
    { mes: "Dez", atendimentos: 98, projetos: 36, alvaras: 28, denuncias: 13 }
  ];

  const dataDistribuicaoServicos = [
    { nome: "Atendimentos", quantidade: 1247, cor: "#3B82F6", porcentagem: 35 },
    { nome: "Alvarás", quantidade: 342, cor: "#10B981", porcentagem: 28 },
    { nome: "Certidões", quantidade: 342, cor: "#F59E0B", porcentagem: 18 },
    { nome: "Projetos", quantidade: 89, cor: "#8B5CF6", porcentagem: 12 },
    { nome: "Denúncias", quantidade: 67, cor: "#EF4444", porcentagem: 7 }
  ];

  const dataInvestimentosProjetos = [
    { mes: "Jul", valor: 850000, projetos: 3 },
    { mes: "Ago", valor: 1200000, projetos: 2 },
    { mes: "Set", valor: 1850000, projetos: 4 },
    { mes: "Out", valor: 2100000, projetos: 3 },
    { mes: "Nov", valor: 1950000, projetos: 1 },
    { mes: "Dez", valor: 2800000, projetos: 5 }
  ];

  const dataTempoProcessamento = [
    { tipo: "Alvarás", tempo_medio: 12, meta: 15 },
    { tipo: "Certidões", tempo_medio: 3, meta: 5 },
    { tipo: "Projetos", tempo_medio: 45, meta: 60 },
    { tipo: "Denúncias", tempo_medio: 8, meta: 10 },
    { tipo: "Atendimentos", tempo_medio: 2, meta: 3 }
  ];

  const dataStatusProjetos = [
    { status: "Planejamento", quantidade: 5, cor: "#F59E0B" },
    { status: "Em Andamento", quantidade: 24, cor: "#3B82F6" },
    { status: "Finalizando", quantidade: 4, cor: "#8B5CF6" },
    { status: "Concluído", quantidade: 3, cor: "#10B981" }
  ];

  const indicadoresRegionais = [
    { regiao: "Centro", atendimentos: 387, projetos: 12, alvaras: 89, score: 85 },
    { regiao: "Norte", atendimentos: 294, projetos: 8, alvaras: 67, score: 78 },
    { regiao: "Sul", atendimentos: 325, projetos: 10, alvaras: 95, score: 82 },
    { regiao: "Leste", atendimentos: 156, projetos: 4, alvaras: 52, score: 71 },
    { regiao: "Oeste", atendimentos: 85, projetos: 2, alvaras: 39, score: 68 }
  ];

  const alertasUrgentes = [
    {
      id: 1,
      tipo: "Prazo",
      titulo: "Projeto Centro Histórico",
      descricao: "Prazo de licenciamento vencendo em 3 dias",
      prioridade: "Alta",
      area: "Projetos"
    },
    {
      id: 2,
      tipo: "Orçamento",
      titulo: "Parque Linear - Orçamento",
      descricao: "Execução acima do orçamento previsto (108%)",
      prioridade: "Média",
      area: "Projetos"
    },
    {
      id: 3,
      tipo: "Denúncia",
      titulo: "Construção Irregular - Rua A",
      descricao: "Denúncia sem resposta há 8 dias",
      prioridade: "Alta",
      area: "Fiscalização"
    },
    {
      id: 4,
      tipo: "Alvará",
      titulo: "Acúmulo de Solicitações",
      descricao: "15 alvarás pendentes de análise",
      prioridade: "Média",
      area: "Licenciamento"
    }
  ];

  const metasSecretaria = [
    {
      nome: "Tempo Médio Atendimento",
      atual: 2.5,
      meta: 3,
      unidade: "dias",
      progresso: 83,
      status: "success"
    },
    {
      nome: "Alvarás Processados/Mês",
      atual: 28,
      meta: 30,
      unidade: "unidades",
      progresso: 93,
      status: "warning"
    },
    {
      nome: "Projetos Concluídos/Ano",
      atual: 15,
      meta: 20,
      unidade: "projetos",
      progresso: 75,
      status: "warning"
    },
    {
      nome: "Satisfação Cidadão",
      atual: 4.2,
      meta: 4.5,
      unidade: "estrelas",
      progresso: 93,
      status: "success"
    }
  ];

  const getVariacaoIcon = (variacao: number) => {
    if (variacao > 0) return <ArrowUp className="h-4 w-4 text-green-600" />;
    if (variacao < 0) return <ArrowDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getVariacaoColor = (variacao: number) => {
    if (variacao > 0) return "text-green-600";
    if (variacao < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      "Alta": "destructive",
      "Média": "secondary",
      "Baixa": "outline"
    };
    return <Badge variant={variants[prioridade] || "outline"}>{prioridade}</Badge>;
  };

  const getMetaStatus = (status: string) => {
    const colors = {
      success: "bg-green-500",
      warning: "bg-yellow-500",
      error: "bg-red-500"
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <LayoutDashboard className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Planejamento Urbano</h1>
              <p className="text-gray-600">Visão executiva consolidada de todas as atividades da secretaria</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={periodoBusca} onValueChange={setPeriodoBusca}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 3 meses</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Atendimentos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dataResumoGeral.atendimentos.total.toLocaleString()}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {getVariacaoIcon(dataResumoGeral.atendimentos.variacao)}
                <span className={`ml-1 ${getVariacaoColor(dataResumoGeral.atendimentos.variacao)}`}>
                  {dataResumoGeral.atendimentos.variacao}% vs mês anterior
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dataResumoGeral.projetos.em_andamento}</div>
              <p className="text-xs text-muted-foreground">
                {dataResumoGeral.projetos.investimento} investidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alvarás Emitidos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dataResumoGeral.alvaras.total}</div>
              <p className="text-xs text-muted-foreground">
                {dataResumoGeral.alvaras.receita} arrecadados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dataResumoGeral.atendimentos.tempo_medio}</div>
              <p className="text-xs text-muted-foreground">Resolução de demandas</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="visao-geral" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="regional">Regional</TabsTrigger>
            <TabsTrigger value="alertas">Alertas</TabsTrigger>
            <TabsTrigger value="servicos">Serviços Gerados</TabsTrigger>
          </TabsList>

          <TabsContent value="visao-geral" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Evolução Mensal de Serviços</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={dataEvolucaoMensal}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="atendimentos" stroke="#3B82F6" name="Atendimentos" />
                      <Line type="monotone" dataKey="alvaras" stroke="#10B981" name="Alvarás" />
                      <Line type="monotone" dataKey="denuncias" stroke="#EF4444" name="Denúncias" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Distribuição de Serviços</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={dataDistribuicaoServicos}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="quantidade"
                      >
                        {dataDistribuicaoServicos.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.cor} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {dataDistribuicaoServicos.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.cor }}></div>
                        <span className="text-xs text-gray-600">{item.nome}: {item.quantidade}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status dos Projetos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dataStatusProjetos.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.cor }}></div>
                          <span className="font-medium">{item.status}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold">{item.quantidade}</span>
                          <span className="text-sm text-gray-500 ml-1">projetos</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Investimentos em Projetos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={dataInvestimentosProjetos}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis tickFormatter={(value) => `R$ ${(value / 1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(value) => [`R$ ${(value as number).toLocaleString()}`, "Investimento"]} />
                      <Area type="monotone" dataKey="valor" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Metas da Secretaria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metasSecretaria.map((meta, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{meta.nome}</span>
                          <span className="text-sm text-gray-500">
                            {meta.atual} / {meta.meta} {meta.unidade}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getMetaStatus(meta.status)}`}
                            style={{ width: `${meta.progresso}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500">{meta.progresso}% da meta</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tempo de Processamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dataTempoProcessamento} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="tipo" type="category" width={80} />
                      <Tooltip formatter={(value, name) => [`${value} dias`, name === "tempo_medio" ? "Tempo Médio" : "Meta"]} />
                      <Bar dataKey="tempo_medio" fill="#3B82F6" name="Tempo Médio" />
                      <Bar dataKey="meta" fill="#E5E7EB" name="Meta" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo por Área de Atuação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-green-600">Atendimento ao Público</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total este mês</span>
                        <span className="font-medium">98</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Tempo médio</span>
                        <span className="font-medium">2.5 dias</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Satisfação</span>
                        <span className="font-medium">4.2⭐</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-blue-600">Licenciamento</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Alvarás emitidos</span>
                        <span className="font-medium">28</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Pendentes</span>
                        <span className="font-medium">15</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Receita</span>
                        <span className="font-medium">R$ 156.8k</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-purple-600">Projetos</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Em andamento</span>
                        <span className="font-medium">24</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Investimento</span>
                        <span className="font-medium">R$ 12.8M</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Beneficiários</span>
                        <span className="font-medium">68.5k</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="regional" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Indicadores por Região</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {indicadoresRegionais.map((regiao, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold">{regiao.regiao}</h3>
                        <div className="text-right">
                          <div className="text-lg font-bold">{regiao.score}</div>
                          <div className="text-xs text-gray-500">Score Geral</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-gray-500">Atendimentos</div>
                          <div className="font-medium">{regiao.atendimentos}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Projetos</div>
                          <div className="font-medium">{regiao.projetos}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Alvarás</div>
                          <div className="font-medium">{regiao.alvaras}</div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Progress value={regiao.score} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alertas" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Alertas e Notificações Urgentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alertasUrgentes.map((alerta) => (
                    <div key={alerta.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                          <h3 className="font-semibold">{alerta.titulo}</h3>
                        </div>
                        <div className="flex gap-2">
                          {getPrioridadeBadge(alerta.prioridade)}
                          <Badge variant="outline">{alerta.area}</Badge>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-3">{alerta.descricao}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Visualizar
                        </Button>
                        <Button size="sm">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolver
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="servicos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Serviços Gerados Automaticamente</CardTitle>
                <CardDescription>
                  Esta página gera automaticamente os seguintes serviços para o catálogo público:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <LayoutDashboard className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Portal Transparência Planejamento</h3>
                        <p className="text-sm text-gray-600">Acesso público aos indicadores e estatísticas urbanas</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 mb-2">Informações disponíveis:</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>• Estatísticas de atendimento</div>
                      <div>• Status de projetos públicos</div>
                      <div>• Investimentos realizados</div>
                      <div>• Metas e indicadores</div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Activity className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Relatórios Públicos</h3>
                        <p className="text-sm text-gray-600">Download de relatórios e dados urbanísticos</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 mb-2">Tipos de relatório:</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>• Relatório mensal de atividades</div>
                      <div>• Dados de projetos por região</div>
                      <div>• Estatísticas de licenciamento</div>
                      <div>• Indicadores de desenvolvimento</div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Target className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Indicadores de Qualidade</h3>
                        <p className="text-sm text-gray-600">Métricas de qualidade dos serviços urbanísticos</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 mb-2">Indicadores públicos:</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>• Tempo médio de atendimento</div>
                      <div>• Satisfação do cidadão</div>
                      <div>• Taxa de resolução</div>
                      <div>• Comparativo histórico</div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Painel de Monitoramento</h3>
                        <p className="text-sm text-gray-600">Dashboard público em tempo real dos serviços</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 mb-2">Funcionalidades:</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>• Visualização em tempo real</div>
                      <div>• Filtros por região/período</div>
                      <div>• Alertas de manutenção</div>
                      <div>• Gráficos interativos</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
                    <Settings className="h-5 w-5" />
                    Integração com Catálogo Público
                  </div>
                  <p className="text-blue-700 text-sm">
                    Todos os serviços desta página são automaticamente disponibilizados no catálogo público da cidade,
                    promovendo transparência total das atividades de planejamento urbano e permitindo que cidadãos
                    acompanhem o desenvolvimento da cidade em tempo real.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}