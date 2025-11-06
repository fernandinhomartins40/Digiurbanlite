"use client";

import { useState } from "react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { FolderOpen, Calendar, Users, Clock, CheckCircle, AlertCircle, XCircle, Plus, Search, Filter, Download, Upload, Eye, Edit, Trash2, FileText, MapPin, Building, Zap, Settings, Target, TrendingUp, Activity } from "lucide-react";

export default function ProjetosPage() {
  useAdminAuth("admin");

  const [projetos, setProjetos] = useState([
    {
      id: 1,
      nome: "Revitalização Centro Histórico",
      tipo: "Revitalização Urbana",
      responsavel: "Arq. Maria Silva",
      inicio: "2024-01-15",
      previsao_fim: "2024-12-20",
      progresso: 65,
      orcamento: "R$ 2.850.000",
      status: "Em Andamento",
      prioridade: "Alta",
      zona: "Centro",
      beneficiarios: 15000,
      etapa_atual: "Execução de Obras",
      descricao: "Projeto de revitalização do centro histórico incluindo restauro de fachadas, novo mobiliário urbano e melhoria da acessibilidade",
      equipe: ["Maria Silva", "João Santos", "Ana Costa"],
      documentos: 12,
      licencas: ["Ambiental", "Patrimônio Histórico", "Obras"]
    },
    {
      id: 2,
      nome: "Parque Linear Ribeirão Verde",
      tipo: "Parque Urbano",
      responsavel: "Eng. Carlos Lima",
      inicio: "2023-08-10",
      previsao_fim: "2024-06-30",
      progresso: 85,
      orcamento: "R$ 1.250.000",
      status: "Em Andamento",
      prioridade: "Média",
      zona: "Norte",
      beneficiarios: 8500,
      etapa_atual: "Acabamentos",
      descricao: "Criação de parque linear ao longo do Ribeirão Verde com trilhas, equipamentos de exercício e área de lazer",
      equipe: ["Carlos Lima", "Pedro Oliveira", "Lucia Fernandes"],
      documentos: 8,
      licencas: ["Ambiental", "Obras"]
    },
    {
      id: 3,
      nome: "Ciclovia Avenida Principal",
      tipo: "Mobilidade Urbana",
      responsavel: "Eng. Ana Torres",
      inicio: "2024-03-01",
      previsao_fim: "2024-09-15",
      progresso: 30,
      orcamento: "R$ 680.000",
      status: "Em Andamento",
      prioridade: "Alta",
      zona: "Central",
      beneficiarios: 25000,
      etapa_atual: "Projeto Executivo",
      descricao: "Implantação de ciclovia bidirecional na Avenida Principal conectando centro aos bairros residenciais",
      equipe: ["Ana Torres", "Roberto Silva"],
      documentos: 6,
      licencas: ["Trânsito", "Obras"]
    },
    {
      id: 4,
      nome: "Reurbanização Praça Central",
      tipo: "Espaço Público",
      responsavel: "Arq. Felipe Costa",
      inicio: "2023-11-20",
      previsao_fim: "2024-04-30",
      progresso: 95,
      orcamento: "R$ 420.000",
      status: "Finalizando",
      prioridade: "Média",
      zona: "Centro",
      beneficiarios: 12000,
      etapa_atual: "Entrega",
      descricao: "Modernização da Praça Central com novo paisagismo, iluminação LED e equipamentos de acessibilidade",
      equipe: ["Felipe Costa", "Marina Santos"],
      documentos: 10,
      licencas: ["Obras", "Meio Ambiente"]
    }
  ]);

  const [cronogramas, setCronogramas] = useState([
    {
      id: 1,
      projeto_id: 1,
      fase: "Planejamento",
      inicio: "2024-01-15",
      fim: "2024-02-28",
      status: "Concluída",
      responsavel: "Maria Silva"
    },
    {
      id: 2,
      projeto_id: 1,
      fase: "Licenciamento",
      inicio: "2024-03-01",
      fim: "2024-04-15",
      status: "Concluída",
      responsavel: "João Santos"
    },
    {
      id: 3,
      projeto_id: 1,
      fase: "Execução de Obras",
      inicio: "2024-04-16",
      fim: "2024-11-30",
      status: "Em Andamento",
      responsavel: "Ana Costa"
    },
    {
      id: 4,
      projeto_id: 1,
      fase: "Entrega",
      inicio: "2024-12-01",
      fim: "2024-12-20",
      status: "Pendente",
      responsavel: "Maria Silva"
    }
  ]);

  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroPrioridade, setFiltroPrioridade] = useState("");
  const [busca, setBusca] = useState("");

  const [projetoDialog, setProjetoDialog] = useState(false);
  const [cronogramaDialog, setCronogramaDialog] = useState(false);

  const [novoProjeto, setNovoProjeto] = useState({
    nome: "",
    tipo: "",
    responsavel: "",
    inicio: "",
    previsao_fim: "",
    orcamento: "",
    prioridade: "",
    zona: "",
    beneficiarios: "",
    descricao: ""
  });

  const [novoCronograma, setNovoCronograma] = useState({
    projeto_id: "",
    fase: "",
    inicio: "",
    fim: "",
    responsavel: ""
  });

  const dataTiposProjeto = [
    { nome: "Revitalização", quantidade: 8, cor: "#22C55E" },
    { nome: "Mobilidade", quantidade: 12, cor: "#3B82F6" },
    { nome: "Parques", quantidade: 6, cor: "#10B981" },
    { nome: "Habitação", quantidade: 9, cor: "#F59E0B" },
    { nome: "Infraestrutura", quantidade: 15, cor: "#8B5CF6" },
    { nome: "Espaços Públicos", quantidade: 11, cor: "#EF4444" }
  ];

  const dataInvestimentos = [
    { mes: "Jul", valor: 1250000 },
    { mes: "Ago", valor: 1850000 },
    { mes: "Set", valor: 2100000 },
    { mes: "Out", valor: 1950000 },
    { mes: "Nov", valor: 2300000 },
    { mes: "Dez", valor: 2800000 }
  ];

  const dataStatus = [
    { mes: "Jul", concluidos: 3, andamento: 12, planejamento: 8 },
    { mes: "Ago", concluidos: 5, andamento: 14, planejamento: 6 },
    { mes: "Set", concluidos: 7, andamento: 16, planejamento: 4 },
    { mes: "Out", concluidos: 9, andamento: 15, planejamento: 5 },
    { mes: "Nov", concluidos: 12, andamento: 17, planejamento: 3 },
    { mes: "Dez", concluidos: 15, andamento: 19, planejamento: 2 }
  ];

  const projetosFiltrados = projetos.filter(projeto => {
    const matchesBusca = projeto.nome.toLowerCase().includes(busca.toLowerCase()) ||
                        projeto.responsavel.toLowerCase().includes(busca.toLowerCase());
    const matchesStatus = filtroStatus === "" || projeto.status === filtroStatus;
    const matchesTipo = filtroTipo === "" || projeto.tipo === filtroTipo;
    const matchesPrioridade = filtroPrioridade === "" || projeto.prioridade === filtroPrioridade;
    return matchesBusca && matchesStatus && matchesTipo && matchesPrioridade;
  });

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      "Em Andamento": "default",
      "Finalizando": "secondary",
      "Concluído": "outline",
      "Pausado": "destructive",
      "Planejamento": "outline",
      "Concluída": "default",
      "Pendente": "secondary"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      "Alta": "destructive",
      "Média": "secondary",
      "Baixa": "outline"
    };
    return <Badge variant={variants[prioridade] || "outline"}>{prioridade}</Badge>;
  };

  const getProgressColor = (progresso: number) => {
    if (progresso >= 80) return "bg-green-500";
    if (progresso >= 50) return "bg-blue-500";
    if (progresso >= 30) return "bg-yellow-500";
    return "bg-red-500";
  };

  const handleCreateProjeto = () => {
    const projeto = {
      id: projetos.length + 1,
      ...novoProjeto,
      progresso: 0,
      status: "Planejamento",
      etapa_atual: "Planejamento Inicial",
      equipe: [novoProjeto.responsavel],
      documentos: 0,
      licencas: [],
      beneficiarios: parseInt(novoProjeto.beneficiarios) || 0
    };
    setProjetos([...projetos, projeto]);
    setNovoProjeto({
      nome: "",
      tipo: "",
      responsavel: "",
      inicio: "",
      previsao_fim: "",
      orcamento: "",
      prioridade: "",
      zona: "",
      beneficiarios: "",
      descricao: ""
    });
    setProjetoDialog(false);
  };

  const handleCreateCronograma = () => {
    const cronograma = {
      id: cronogramas.length + 1,
      ...novoCronograma,
      projeto_id: parseInt(novoCronograma.projeto_id),
      status: "Pendente"
    };
    setCronogramas([...cronogramas, cronograma]);
    setNovoCronograma({
      projeto_id: "",
      fase: "",
      inicio: "",
      fim: "",
      responsavel: ""
    });
    setCronogramaDialog(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <FolderOpen className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projetos Urbanísticos</h1>
            <p className="text-gray-600">Gestão completa de projetos de desenvolvimento urbano e infraestrutura</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">36</div>
              <p className="text-xs text-muted-foreground">+4 este mês</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Investimento Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 12,8M</div>
              <p className="text-xs text-muted-foreground">Orçamento 2024</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Beneficiários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">68.500</div>
              <p className="text-xs text-muted-foreground">Cidadãos impactados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progresso Médio</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">68%</div>
              <p className="text-xs text-muted-foreground">+12% este mês</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tipos de Projeto</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={dataTiposProjeto}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="quantidade"
                  >
                    {dataTiposProjeto.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {dataTiposProjeto.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.cor }}></div>
                    <span className="text-xs text-gray-600">{item.nome}: {item.quantidade}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Investimentos Mensais</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dataInvestimentos}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis tickFormatter={(value) => `R$ ${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value) => [`R$ ${(value as number).toLocaleString()}`, "Investimento"]} />
                  <Bar dataKey="valor" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status dos Projetos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dataStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="concluidos" stroke="#22C55E" name="Concluídos" />
                <Line type="monotone" dataKey="andamento" stroke="#3B82F6" name="Em Andamento" />
                <Line type="monotone" dataKey="planejamento" stroke="#F59E0B" name="Planejamento" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="projetos" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projetos">Projetos</TabsTrigger>
          <TabsTrigger value="cronogramas">Cronogramas</TabsTrigger>
          <TabsTrigger value="equipes">Equipes</TabsTrigger>
          <TabsTrigger value="servicos">Serviços Gerados</TabsTrigger>
        </TabsList>

        <TabsContent value="projetos" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Gestão de Projetos</CardTitle>
                  <CardDescription>Acompanhamento de projetos urbanísticos e de infraestrutura</CardDescription>
                </div>
                <Dialog open={projetoDialog} onOpenChange={setProjetoDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Projeto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Cadastrar Novo Projeto</DialogTitle>
                      <DialogDescription>Crie um novo projeto urbanístico no sistema</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="nome_projeto">Nome do Projeto</Label>
                        <Input
                          id="nome_projeto"
                          value={novoProjeto.nome}
                          onChange={(e) => setNovoProjeto({ ...novoProjeto, nome: e.target.value })}
                          placeholder="Ex: Revitalização Praça Principal"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tipo_projeto">Tipo de Projeto</Label>
                        <Select value={novoProjeto.tipo} onValueChange={(value) => setNovoProjeto({ ...novoProjeto, tipo: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Revitalização Urbana">Revitalização Urbana</SelectItem>
                            <SelectItem value="Mobilidade Urbana">Mobilidade Urbana</SelectItem>
                            <SelectItem value="Parque Urbano">Parque Urbano</SelectItem>
                            <SelectItem value="Espaço Público">Espaço Público</SelectItem>
                            <SelectItem value="Infraestrutura">Infraestrutura</SelectItem>
                            <SelectItem value="Habitação">Habitação</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="responsavel_projeto">Responsável</Label>
                        <Input
                          id="responsavel_projeto"
                          value={novoProjeto.responsavel}
                          onChange={(e) => setNovoProjeto({ ...novoProjeto, responsavel: e.target.value })}
                          placeholder="Nome do responsável técnico"
                        />
                      </div>
                      <div>
                        <Label htmlFor="inicio_projeto">Data de Início</Label>
                        <Input
                          id="inicio_projeto"
                          type="date"
                          value={novoProjeto.inicio}
                          onChange={(e) => setNovoProjeto({ ...novoProjeto, inicio: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="fim_projeto">Previsão de Término</Label>
                        <Input
                          id="fim_projeto"
                          type="date"
                          value={novoProjeto.previsao_fim}
                          onChange={(e) => setNovoProjeto({ ...novoProjeto, previsao_fim: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="orcamento_projeto">Orçamento</Label>
                        <Input
                          id="orcamento_projeto"
                          value={novoProjeto.orcamento}
                          onChange={(e) => setNovoProjeto({ ...novoProjeto, orcamento: e.target.value })}
                          placeholder="Ex: R$ 500.000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="prioridade_projeto">Prioridade</Label>
                        <Select value={novoProjeto.prioridade} onValueChange={(value) => setNovoProjeto({ ...novoProjeto, prioridade: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a prioridade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Alta">Alta</SelectItem>
                            <SelectItem value="Média">Média</SelectItem>
                            <SelectItem value="Baixa">Baixa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="zona_projeto">Zona</Label>
                        <Input
                          id="zona_projeto"
                          value={novoProjeto.zona}
                          onChange={(e) => setNovoProjeto({ ...novoProjeto, zona: e.target.value })}
                          placeholder="Ex: Centro, Norte, Sul"
                        />
                      </div>
                      <div>
                        <Label htmlFor="beneficiarios_projeto">Beneficiários</Label>
                        <Input
                          id="beneficiarios_projeto"
                          value={novoProjeto.beneficiarios}
                          onChange={(e) => setNovoProjeto({ ...novoProjeto, beneficiarios: e.target.value })}
                          placeholder="Número estimado de beneficiários"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="descricao_projeto">Descrição</Label>
                        <Textarea
                          id="descricao_projeto"
                          value={novoProjeto.descricao}
                          onChange={(e) => setNovoProjeto({ ...novoProjeto, descricao: e.target.value })}
                          placeholder="Descrição detalhada do projeto"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setProjetoDialog(false)}>Cancelar</Button>
                      <Button onClick={handleCreateProjeto}>Cadastrar Projeto</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4 flex-wrap">
                <div className="flex-1 min-w-64">
                  <Input
                    placeholder="Buscar projetos..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os status</SelectItem>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Finalizando">Finalizando</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                    <SelectItem value="Pausado">Pausado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os tipos</SelectItem>
                    <SelectItem value="Revitalização Urbana">Revitalização</SelectItem>
                    <SelectItem value="Mobilidade Urbana">Mobilidade</SelectItem>
                    <SelectItem value="Parque Urbano">Parques</SelectItem>
                    <SelectItem value="Espaço Público">Espaços Públicos</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filtroPrioridade} onValueChange={setFiltroPrioridade}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as prioridades</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>

              <div className="grid gap-4">
                {projetosFiltrados.map((projeto) => (
                  <Card key={projeto.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{projeto.nome}</h3>
                          <p className="text-gray-600">{projeto.tipo} • {projeto.responsavel}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="flex gap-2">
                            {getStatusBadge(projeto.status)}
                            {getPrioridadeBadge(projeto.prioridade)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {projeto.orcamento}
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progresso</span>
                          <span>{projeto.progresso}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getProgressColor(projeto.progresso)}`}
                            style={{ width: `${projeto.progresso}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-500">Início</div>
                          <div className="font-medium">{new Date(projeto.inicio).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Término Previsto</div>
                          <div className="font-medium">{new Date(projeto.previsao_fim).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Beneficiários</div>
                          <div className="font-medium">{projeto.beneficiarios.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Zona</div>
                          <div className="font-medium">{projeto.zona}</div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="text-sm text-gray-500 mb-1">Etapa Atual</div>
                        <div className="font-medium">{projeto.etapa_atual}</div>
                      </div>

                      <div className="mb-4">
                        <div className="text-sm text-gray-500 mb-2">Equipe</div>
                        <div className="flex flex-wrap gap-2">
                          {projeto.equipe.map((membro, index) => (
                            <Badge key={index} variant="outline">{membro}</Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {projeto.documentos} docs
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            {projeto.licencas.length} licenças
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            Visualizar
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button size="sm" variant="outline">
                            <Calendar className="h-4 w-4 mr-1" />
                            Cronograma
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cronogramas" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Cronogramas de Projeto</CardTitle>
                  <CardDescription>Gestão de fases e prazos dos projetos urbanísticos</CardDescription>
                </div>
                <Dialog open={cronogramaDialog} onOpenChange={setCronogramaDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Fase
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Fase ao Cronograma</DialogTitle>
                      <DialogDescription>Defina uma nova fase para o projeto</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="projeto_cronograma">Projeto</Label>
                        <Select value={novoCronograma.projeto_id} onValueChange={(value) => setNovoCronograma({ ...novoCronograma, projeto_id: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o projeto" />
                          </SelectTrigger>
                          <SelectContent>
                            {projetos.map((projeto) => (
                              <SelectItem key={projeto.id} value={projeto.id.toString()}>{projeto.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="fase_cronograma">Nome da Fase</Label>
                        <Input
                          id="fase_cronograma"
                          value={novoCronograma.fase}
                          onChange={(e) => setNovoCronograma({ ...novoCronograma, fase: e.target.value })}
                          placeholder="Ex: Execução de Obras"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="inicio_cronograma">Data de Início</Label>
                          <Input
                            id="inicio_cronograma"
                            type="date"
                            value={novoCronograma.inicio}
                            onChange={(e) => setNovoCronograma({ ...novoCronograma, inicio: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="fim_cronograma">Data de Término</Label>
                          <Input
                            id="fim_cronograma"
                            type="date"
                            value={novoCronograma.fim}
                            onChange={(e) => setNovoCronograma({ ...novoCronograma, fim: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="responsavel_cronograma">Responsável</Label>
                        <Input
                          id="responsavel_cronograma"
                          value={novoCronograma.responsavel}
                          onChange={(e) => setNovoCronograma({ ...novoCronograma, responsavel: e.target.value })}
                          placeholder="Nome do responsável pela fase"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCronogramaDialog(false)}>Cancelar</Button>
                      <Button onClick={handleCreateCronograma}>Adicionar Fase</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {projetos.map((projeto) => {
                const fasesProjeto = cronogramas.filter(c => c.projeto_id === projeto.id);
                if (fasesProjeto.length === 0) return null;

                return (
                  <Card key={projeto.id} className="mb-4">
                    <CardHeader>
                      <CardTitle className="text-lg">{projeto.nome}</CardTitle>
                      <CardDescription>Cronograma detalhado das fases do projeto</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {fasesProjeto.map((fase, index) => (
                          <div key={fase.id} className="flex items-center gap-4 p-3 border rounded-lg">
                            <div className="flex-shrink-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium
                                ${fase.status === 'Concluída' ? 'bg-green-500' :
                                  fase.status === 'Em Andamento' ? 'bg-blue-500' : 'bg-gray-400'}`}>
                                {index + 1}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{fase.fase}</div>
                              <div className="text-sm text-gray-500">{fase.responsavel}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm">{new Date(fase.inicio).toLocaleDateString()} - {new Date(fase.fim).toLocaleDateString()}</div>
                              {getStatusBadge(fase.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Equipes de Projeto</CardTitle>
              <CardDescription>Gestão de equipes técnicas e recursos humanos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Arquitetos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Maria Silva</span>
                          <Badge variant="outline">Líder</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Felipe Costa</span>
                          <Badge variant="secondary">Sênior</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Ana Torres</span>
                          <Badge variant="secondary">Sênior</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Engenheiros</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Carlos Lima</span>
                          <Badge variant="outline">Líder</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>João Santos</span>
                          <Badge variant="secondary">Pleno</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Pedro Oliveira</span>
                          <Badge variant="secondary">Júnior</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Especialistas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Lucia Fernandes</span>
                          <Badge variant="outline">Ambiental</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Roberto Silva</span>
                          <Badge variant="outline">Trânsito</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Marina Santos</span>
                          <Badge variant="outline">Paisagismo</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Distribuição de Projetos por Equipe</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={[
                        { equipe: "Arquitetura", projetos: 15, concluidos: 8 },
                        { equipe: "Engenharia", projetos: 12, concluidos: 7 },
                        { equipe: "Ambiental", projetos: 8, concluidos: 5 },
                        { equipe: "Mobilidade", projetos: 6, concluidos: 4 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="equipe" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="projetos" fill="#3B82F6" name="Total" />
                        <Bar dataKey="concluidos" fill="#22C55E" name="Concluídos" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
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
                      <Eye className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Acompanhamento de Obras</h3>
                      <p className="text-sm text-gray-600">Consulta ao status de projetos e obras em execução</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">Campos do formulário público:</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>• Nome do projeto ou obra</div>
                    <div>• Região ou endereço</div>
                    <div>• Tipo de projeto</div>
                    <div>• Período de interesse</div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Sugestão de Projetos</h3>
                      <p className="text-sm text-gray-600">Canal para cidadãos sugerirem novos projetos urbanos</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">Campos do formulário público:</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>• Título da sugestão</div>
                    <div>• Localização proposta</div>
                    <div>• Tipo de projeto</div>
                    <div>• Descrição detalhada</div>
                    <div>• Justificativa</div>
                    <div>• Dados do solicitante</div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Cronograma de Obras</h3>
                      <p className="text-sm text-gray-600">Consulta aos cronogramas e prazos de projetos públicos</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">Campos do formulário público:</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>• Projeto ou obra de interesse</div>
                    <div>• Tipo de informação</div>
                    <div>• Região</div>
                    <div>• Notificações por email</div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <MapPin className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Mapa de Projetos</h3>
                      <p className="text-sm text-gray-600">Visualização geográfica de projetos e obras municipais</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">Campos do formulário público:</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>• Filtros por tipo</div>
                    <div>• Filtros por status</div>
                    <div>• Região de interesse</div>
                    <div>• Período temporal</div>
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
                  permitindo que cidadãos acompanhem obras, sugiram projetos e consultem cronogramas de desenvolvimento
                  urbano de forma transparente e participativa.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}