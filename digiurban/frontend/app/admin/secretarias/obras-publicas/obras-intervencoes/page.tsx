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
import { Building2, Calendar, DollarSign, Users, MapPin, Clock, CheckCircle, AlertTriangle, TrendingUp, Plus, Search, Filter, Download, Eye, Edit, FileText, Truck, Settings, Zap } from "lucide-react";

export default function ObrasIntervencoesPage() {
  useAdminAuth("admin");

  const [obras, setObras] = useState([
    {
      id: 1,
      codigo: "OB-2024-001",
      nome: "Revitalização da Av. Principal",
      tipo: "Pavimentação",
      descricao: "Recapeamento asfáltico e implantação de ciclovia na Av. Principal",
      endereco: "Av. Principal, do Centro até Bairro Norte",
      bairro: "Centro/Norte",
      status: "Em Execução",
      progresso: 65,
      data_inicio: "2024-01-15",
      previsao_termino: "2024-06-30",
      orcamento_total: "R$ 2.850.000,00",
      orcamento_gasto: "R$ 1.852.500,00",
      empresa_responsavel: "Construtora Alpha Ltda",
      engenheiro_responsavel: "Eng. Carlos Mendes",
      beneficiarios: 25000,
      observacoes: "Obra dentro do cronograma previsto"
    },
    {
      id: 2,
      codigo: "OB-2024-002",
      nome: "Ponte sobre Rio Verde",
      tipo: "Pontes/Viadutos",
      descricao: "Construção de ponte de concreto armado ligando os bairros Sul e Leste",
      endereco: "Rio Verde, ligação Bairro Sul - Bairro Leste",
      bairro: "Sul/Leste",
      status: "Em Execução",
      progresso: 45,
      data_inicio: "2023-08-20",
      previsao_termino: "2024-05-15",
      orcamento_total: "R$ 4.200.000,00",
      orcamento_gasto: "R$ 1.890.000,00",
      empresa_responsavel: "Engenharia Beta S.A.",
      engenheiro_responsavel: "Eng. Maria Silva",
      beneficiarios: 15000,
      observacoes: "Aguardando liberação ambiental para próxima etapa"
    },
    {
      id: 3,
      codigo: "OB-2024-003",
      nome: "Sistema de Drenagem Bairro Norte",
      tipo: "Drenagem",
      descricao: "Implantação de rede de drenagem pluvial e galerias no Bairro Norte",
      endereco: "Bairro Norte - Ruas principais",
      bairro: "Norte",
      status: "Planejamento",
      progresso: 15,
      data_inicio: "2024-03-01",
      previsao_termino: "2024-12-20",
      orcamento_total: "R$ 1.680.000,00",
      orcamento_gasto: "R$ 252.000,00",
      empresa_responsavel: "Drenagem Técnica Ltda",
      engenheiro_responsavel: "Eng. João Santos",
      beneficiarios: 8500,
      observacoes: "Projeto em fase de detalhamento"
    },
    {
      id: 4,
      codigo: "OB-2023-045",
      nome: "Praça da Cidadania",
      tipo: "Urbanização",
      descricao: "Revitalização completa da praça com paisagismo, mobiliário e acessibilidade",
      endereco: "Praça da Cidadania, s/n - Centro",
      bairro: "Centro",
      status: "Concluído",
      progresso: 100,
      data_inicio: "2023-09-10",
      previsao_termino: "2023-12-15",
      orcamento_total: "R$ 420.000,00",
      orcamento_gasto: "R$ 398.500,00",
      empresa_responsavel: "Paisagismo Verde Ltda",
      engenheiro_responsavel: "Arq. Paula Costa",
      beneficiarios: 12000,
      observacoes: "Obra entregue com sucesso"
    }
  ]);

  const [cronogramas, setCronogramas] = useState([
    {
      id: 1,
      obra_codigo: "OB-2024-001",
      fase: "Preparação do terreno",
      data_inicio: "2024-01-15",
      data_fim: "2024-02-15",
      status: "Concluída",
      percentual: 100
    },
    {
      id: 2,
      obra_codigo: "OB-2024-001",
      fase: "Pavimentação base",
      data_inicio: "2024-02-16",
      data_fim: "2024-04-30",
      status: "Concluída",
      percentual: 100
    },
    {
      id: 3,
      obra_codigo: "OB-2024-001",
      fase: "Implantação ciclovia",
      data_inicio: "2024-05-01",
      data_fim: "2024-06-15",
      status: "Em Andamento",
      percentual: 60
    },
    {
      id: 4,
      obra_codigo: "OB-2024-001",
      fase: "Sinalização e entrega",
      data_inicio: "2024-06-16",
      data_fim: "2024-06-30",
      status: "Programada",
      percentual: 0
    }
  ]);

  const [orcamentos, setOrcamentos] = useState([
    {
      id: 1,
      obra_codigo: "OB-2024-001",
      item: "Material asfáltico",
      quantidade: "2.500 toneladas",
      valor_unitario: "R$ 180,00",
      valor_total: "R$ 450.000,00",
      fornecedor: "Asfaltos do Sul Ltda"
    },
    {
      id: 2,
      obra_codigo: "OB-2024-001",
      item: "Mão de obra especializada",
      quantidade: "120 dias/homem",
      valor_unitario: "R$ 350,00",
      valor_total: "R$ 420.000,00",
      fornecedor: "Construtora Alpha Ltda"
    },
    {
      id: 3,
      obra_codigo: "OB-2024-002",
      item: "Concreto estrutural",
      quantidade: "850 m³",
      valor_unitario: "R$ 280,00",
      valor_total: "R$ 238.000,00",
      fornecedor: "Concretos Premium S.A."
    }
  ]);

  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [busca, setBusca] = useState("");

  const [obraDialog, setObraDialog] = useState(false);
  const [cronogramaDialog, setCronogramaDialog] = useState(false);

  const [novaObra, setNovaObra] = useState({
    nome: "",
    tipo: "",
    descricao: "",
    endereco: "",
    bairro: "",
    data_inicio: "",
    previsao_termino: "",
    orcamento_total: "",
    empresa_responsavel: "",
    engenheiro_responsavel: "",
    beneficiarios: ""
  });

  const [novoItem, setNovoItem] = useState({
    obra_codigo: "",
    fase: "",
    data_inicio: "",
    data_fim: ""
  });

  const dataEstatisticas = [
    { mes: "Jul", iniciadas: 3, concluidas: 2, orcamento: 1850000 },
    { mes: "Ago", iniciadas: 2, concluidas: 1, orcamento: 2100000 },
    { mes: "Set", iniciadas: 4, concluidas: 3, orcamento: 3200000 },
    { mes: "Out", iniciadas: 2, concluidas: 2, orcamento: 1950000 },
    { mes: "Nov", iniciadas: 3, concluidas: 1, orcamento: 2800000 },
    { mes: "Dez", iniciadas: 1, concluidas: 4, orcamento: 2650000 }
  ];

  const dataTiposObra = [
    { tipo: "Pavimentação", quantidade: 12, valor: 8500000, cor: "#3B82F6" },
    { tipo: "Drenagem", quantidade: 8, valor: 4200000, cor: "#10B981" },
    { tipo: "Pontes/Viadutos", quantidade: 3, valor: 12600000, cor: "#F59E0B" },
    { tipo: "Urbanização", quantidade: 15, valor: 3200000, cor: "#8B5CF6" },
    { tipo: "Sinalização", quantidade: 22, valor: 1800000, cor: "#EF4444" }
  ];

  const dataStatusObras = [
    { status: "Planejamento", quantidade: 8, cor: "#F59E0B" },
    { status: "Em Execução", quantidade: 12, cor: "#3B82F6" },
    { status: "Concluído", quantidade: 25, cor: "#10B981" },
    { status: "Pausado", quantidade: 3, cor: "#EF4444" }
  ];

  const dataProgressoMensal = [
    { mes: "Jul", planejamento: 15, execucao: 25, concluidas: 18 },
    { mes: "Ago", planejamento: 12, execucao: 28, concluidas: 22 },
    { mes: "Set", planejamento: 18, execucao: 24, concluidas: 19 },
    { mes: "Out", planejamento: 14, execucao: 26, concluidas: 25 },
    { mes: "Nov", planejamento: 16, execucao: 23, concluidas: 21 },
    { mes: "Dez", planejamento: 13, execucao: 27, concluidas: 28 }
  ];

  const obrasFiltradas = obras.filter(obra => {
    const matchesBusca = obra.nome.toLowerCase().includes(busca.toLowerCase()) ||
                        obra.codigo.toLowerCase().includes(busca.toLowerCase()) ||
                        obra.endereco.toLowerCase().includes(busca.toLowerCase());
    const matchesStatus = filtroStatus === "" || obra.status === filtroStatus;
    const matchesTipo = filtroTipo === "" || obra.tipo === filtroTipo;
    return matchesBusca && matchesStatus && matchesTipo;
  });

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      "Planejamento": "outline",
      "Em Execução": "default",
      "Concluído": "secondary",
      "Pausado": "destructive",
      "Concluída": "secondary",
      "Em Andamento": "default",
      "Programada": "outline"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getProgressColor = (progresso: number) => {
    if (progresso >= 80) return "bg-green-500";
    if (progresso >= 50) return "bg-blue-500";
    if (progresso >= 30) return "bg-yellow-500";
    return "bg-red-500";
  };

  const handleCreateObra = () => {
    const obra = {
      id: obras.length + 1,
      codigo: `OB-2024-${String(obras.length + 1).padStart(3, '0')}`,
      ...novaObra,
      beneficiarios: parseInt(novaObra.beneficiarios),
      status: "Planejamento",
      progresso: 0,
      orcamento_gasto: "R$ 0,00",
      observacoes: "Obra cadastrada"
    };
    setObras([...obras, obra]);
    setNovaObra({
      nome: "",
      tipo: "",
      descricao: "",
      endereco: "",
      bairro: "",
      data_inicio: "",
      previsao_termino: "",
      orcamento_total: "",
      empresa_responsavel: "",
      engenheiro_responsavel: "",
      beneficiarios: ""
    });
    setObraDialog(false);
  };

  const handleCreateItem = () => {
    const item = {
      id: cronogramas.length + 1,
      ...novoItem,
      status: "Programada",
      percentual: 0
    };
    setCronogramas([...cronogramas, item]);
    setNovoItem({ obra_codigo: "", fase: "", data_inicio: "", data_fim: "" });
    setCronogramaDialog(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Obras e Intervenções</h1>
            <p className="text-gray-600">Cadastro e gestão de projetos de infraestrutura, cronogramas e orçamentos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Obras Ativas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">48</div>
              <p className="text-xs text-muted-foreground">12 em execução</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Investimento Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 30,3M</div>
              <p className="text-xs text-muted-foreground">Orçamento 2024</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Beneficiários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89.500</div>
              <p className="text-xs text-muted-foreground">Cidadãos impactados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prazo Médio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8.5 meses</div>
              <p className="text-xs text-muted-foreground">Tempo de execução</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evolução das Obras</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dataEstatisticas}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="iniciadas" stroke="#3B82F6" name="Iniciadas" />
                  <Line type="monotone" dataKey="concluidas" stroke="#10B981" name="Concluídas" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tipos de Obra</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={dataTiposObra}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="quantidade"
                  >
                    {dataTiposObra.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {dataTiposObra.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.cor }}></div>
                    <span className="text-xs text-gray-600">{item.tipo}: {item.quantidade}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status das Obras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dataStatusObras.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.cor }}></div>
                      <span className="font-medium">{item.status}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold">{item.quantidade}</span>
                      <span className="text-sm text-gray-500 ml-1">obras</span>
                    </div>
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
                <BarChart data={dataEstatisticas}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis tickFormatter={(value) => `R$ ${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value) => [`R$ ${(value as number).toLocaleString()}`, "Investimento"]} />
                  <Bar dataKey="orcamento" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="obras" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="obras">Obras</TabsTrigger>
          <TabsTrigger value="cronogramas">Cronogramas</TabsTrigger>
          <TabsTrigger value="orcamentos">Orçamentos</TabsTrigger>
          <TabsTrigger value="servicos">Serviços Gerados</TabsTrigger>
        </TabsList>

        <TabsContent value="obras" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Gestão de Obras</CardTitle>
                  <CardDescription>Controle de projetos de infraestrutura urbana</CardDescription>
                </div>
                <Dialog open={obraDialog} onOpenChange={setObraDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Obra
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Cadastrar Nova Obra</DialogTitle>
                      <DialogDescription>Registre um novo projeto de infraestrutura</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="nome_obra">Nome da Obra</Label>
                        <Input
                          id="nome_obra"
                          value={novaObra.nome}
                          onChange={(e) => setNovaObra({ ...novaObra, nome: e.target.value })}
                          placeholder="Ex: Revitalização da Av. Principal"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tipo_obra">Tipo de Obra</Label>
                        <Select value={novaObra.tipo} onValueChange={(value) => setNovaObra({ ...novaObra, tipo: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pavimentação">Pavimentação</SelectItem>
                            <SelectItem value="Drenagem">Drenagem</SelectItem>
                            <SelectItem value="Pontes/Viadutos">Pontes/Viadutos</SelectItem>
                            <SelectItem value="Urbanização">Urbanização</SelectItem>
                            <SelectItem value="Sinalização">Sinalização</SelectItem>
                            <SelectItem value="Acessibilidade">Acessibilidade</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="bairro_obra">Bairro</Label>
                        <Input
                          id="bairro_obra"
                          value={novaObra.bairro}
                          onChange={(e) => setNovaObra({ ...novaObra, bairro: e.target.value })}
                          placeholder="Nome do bairro"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="endereco_obra">Endereço da Obra</Label>
                        <Input
                          id="endereco_obra"
                          value={novaObra.endereco}
                          onChange={(e) => setNovaObra({ ...novaObra, endereco: e.target.value })}
                          placeholder="Localização detalhada da obra"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="descricao_obra">Descrição</Label>
                        <Textarea
                          id="descricao_obra"
                          value={novaObra.descricao}
                          onChange={(e) => setNovaObra({ ...novaObra, descricao: e.target.value })}
                          placeholder="Descrição detalhada da obra"
                        />
                      </div>
                      <div>
                        <Label htmlFor="data_inicio_obra">Data de Início</Label>
                        <Input
                          id="data_inicio_obra"
                          type="date"
                          value={novaObra.data_inicio}
                          onChange={(e) => setNovaObra({ ...novaObra, data_inicio: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="previsao_termino_obra">Previsão de Término</Label>
                        <Input
                          id="previsao_termino_obra"
                          type="date"
                          value={novaObra.previsao_termino}
                          onChange={(e) => setNovaObra({ ...novaObra, previsao_termino: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="orcamento_total_obra">Orçamento Total</Label>
                        <Input
                          id="orcamento_total_obra"
                          value={novaObra.orcamento_total}
                          onChange={(e) => setNovaObra({ ...novaObra, orcamento_total: e.target.value })}
                          placeholder="Ex: R$ 2.850.000,00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="beneficiarios_obra">Beneficiários</Label>
                        <Input
                          id="beneficiarios_obra"
                          type="number"
                          value={novaObra.beneficiarios}
                          onChange={(e) => setNovaObra({ ...novaObra, beneficiarios: e.target.value })}
                          placeholder="Número de cidadãos beneficiados"
                        />
                      </div>
                      <div>
                        <Label htmlFor="empresa_responsavel_obra">Empresa Responsável</Label>
                        <Input
                          id="empresa_responsavel_obra"
                          value={novaObra.empresa_responsavel}
                          onChange={(e) => setNovaObra({ ...novaObra, empresa_responsavel: e.target.value })}
                          placeholder="Nome da empresa executora"
                        />
                      </div>
                      <div>
                        <Label htmlFor="engenheiro_responsavel_obra">Engenheiro Responsável</Label>
                        <Input
                          id="engenheiro_responsavel_obra"
                          value={novaObra.engenheiro_responsavel}
                          onChange={(e) => setNovaObra({ ...novaObra, engenheiro_responsavel: e.target.value })}
                          placeholder="Nome do engenheiro responsável"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setObraDialog(false)}>Cancelar</Button>
                      <Button onClick={handleCreateObra}>Cadastrar Obra</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4 flex-wrap">
                <div className="flex-1 min-w-64">
                  <Input
                    placeholder="Buscar obras..."
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
                    <SelectItem value="Planejamento">Planejamento</SelectItem>
                    <SelectItem value="Em Execução">Em Execução</SelectItem>
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
                    <SelectItem value="Pavimentação">Pavimentação</SelectItem>
                    <SelectItem value="Drenagem">Drenagem</SelectItem>
                    <SelectItem value="Pontes/Viadutos">Pontes/Viadutos</SelectItem>
                    <SelectItem value="Urbanização">Urbanização</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>

              <div className="grid gap-4">
                {obrasFiltradas.map((obra) => (
                  <Card key={obra.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{obra.nome}</h3>
                          <p className="text-gray-600">{obra.codigo} • {obra.tipo}</p>
                          <p className="text-sm text-gray-500">{obra.endereco}</p>
                        </div>
                        <div className="text-right space-y-1">
                          {getStatusBadge(obra.status)}
                          <div className="text-lg font-bold text-green-600">{obra.orcamento_total}</div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progresso da Obra</span>
                          <span>{obra.progresso}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getProgressColor(obra.progresso)}`}
                            style={{ width: `${obra.progresso}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-500">Início</div>
                          <div className="font-medium">{new Date(obra.data_inicio).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Previsão</div>
                          <div className="font-medium">{new Date(obra.previsao_termino).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Beneficiários</div>
                          <div className="font-medium">{obra.beneficiarios.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Execução</div>
                          <div className="font-medium">{obra.empresa_responsavel}</div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="text-sm text-gray-500 mb-1">Engenheiro Responsável</div>
                        <div className="font-medium">{obra.engenheiro_responsavel}</div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          <div>Gasto: {obra.orcamento_gasto} / {obra.orcamento_total}</div>
                          <div>{obra.observacoes}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            Detalhes
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
                  <CardTitle>Cronogramas de Execução</CardTitle>
                  <CardDescription>Gestão de fases e prazos das obras</CardDescription>
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
                      <DialogDescription>Defina uma nova fase para a obra</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="obra_cronograma">Obra</Label>
                        <Select value={novoItem.obra_codigo} onValueChange={(value) => setNovoItem({ ...novoItem, obra_codigo: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a obra" />
                          </SelectTrigger>
                          <SelectContent>
                            {obras.map((obra) => (
                              <SelectItem key={obra.id} value={obra.codigo}>{obra.codigo} - {obra.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="fase_cronograma">Nome da Fase</Label>
                        <Input
                          id="fase_cronograma"
                          value={novoItem.fase}
                          onChange={(e) => setNovoItem({ ...novoItem, fase: e.target.value })}
                          placeholder="Ex: Preparação do terreno"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="data_inicio_cronograma">Data de Início</Label>
                          <Input
                            id="data_inicio_cronograma"
                            type="date"
                            value={novoItem.data_inicio}
                            onChange={(e) => setNovoItem({ ...novoItem, data_inicio: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="data_fim_cronograma">Data de Término</Label>
                          <Input
                            id="data_fim_cronograma"
                            type="date"
                            value={novoItem.data_fim}
                            onChange={(e) => setNovoItem({ ...novoItem, data_fim: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCronogramaDialog(false)}>Cancelar</Button>
                      <Button onClick={handleCreateItem}>Adicionar Fase</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {obras.map((obra) => {
                const fases = cronogramas.filter(c => c.obra_codigo === obra.codigo);
                if (fases.length === 0) return null;

                return (
                  <Card key={obra.id} className="mb-4">
                    <CardHeader>
                      <CardTitle className="text-lg">{obra.nome}</CardTitle>
                      <CardDescription>Cronograma de execução da obra</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {fases.map((fase, index) => (
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
                              <div className="text-sm text-gray-500">{new Date(fase.data_inicio).toLocaleDateString()} - {new Date(fase.data_fim).toLocaleDateString()}</div>
                            </div>
                            <div className="text-right">
                              {getStatusBadge(fase.status)}
                              <div className="text-sm text-gray-500 mt-1">{fase.percentual}% concluído</div>
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

        <TabsContent value="orcamentos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Orçamentos Detalhados</CardTitle>
              <CardDescription>Controle de custos e fornecedores por obra</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50 font-medium text-sm">
                  <div>Obra</div>
                  <div>Item</div>
                  <div>Quantidade</div>
                  <div>Valor Unitário</div>
                  <div>Valor Total</div>
                  <div>Fornecedor</div>
                </div>
                <div className="divide-y">
                  {orcamentos.map((item) => (
                    <div key={item.id} className="grid grid-cols-6 gap-4 p-4 items-center">
                      <div className="font-mono text-sm">{item.obra_codigo}</div>
                      <div className="font-medium">{item.item}</div>
                      <div>{item.quantidade}</div>
                      <div>{item.valor_unitario}</div>
                      <div className="font-bold text-green-600">{item.valor_total}</div>
                      <div>{item.fornecedor}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Resumo Orçamentário</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Previsto</span>
                        <span className="font-medium">R$ 30.300.000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Total Executado</span>
                        <span className="font-medium">R$ 18.250.000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Saldo</span>
                        <span className="font-medium text-green-600">R$ 12.050.000</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Execução Orçamentária</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progresso</span>
                        <span>60.2%</span>
                      </div>
                      <Progress value={60.2} className="h-2" />
                      <div className="text-xs text-gray-500">R$ 18,25M de R$ 30,3M executados</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Status Geral</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Obras no Prazo</span>
                        <span className="font-medium text-green-600">85%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Orçamento Controlado</span>
                        <span className="font-medium text-green-600">92%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Eficiência Geral</span>
                        <span className="font-medium text-blue-600">88%</span>
                      </div>
                    </div>
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
                      <h3 className="font-semibold">Acompanhamento de Obra</h3>
                      <p className="text-sm text-gray-600">Consulta ao status e progresso de obras municipais</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">Campos do formulário público:</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>• Nome ou código da obra</div>
                    <div>• Endereço ou região</div>
                    <div>• Tipo de obra</div>
                    <div>• Período de interesse</div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Cronograma de Execução</h3>
                      <p className="text-sm text-gray-600">Acesso aos cronogramas de obras públicas</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">Campos do formulário público:</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>• Obra de interesse</div>
                    <div>• Fase específica</div>
                    <div>• Alertas por email</div>
                    <div>• Tipo de notificação</div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FileText className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Informações de Projeto</h3>
                      <p className="text-sm text-gray-600">Detalhes técnicos e documentação de obras</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">Campos do formulário público:</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>• Identificação da obra</div>
                    <div>• Tipo de informação</div>
                    <div>• Justificativa da solicitação</div>
                    <div>• Dados de contato</div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Users className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Participação em Obra</h3>
                      <p className="text-sm text-gray-600">Canal para participação cidadã em obras públicas</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">Campos do formulário público:</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>• Dados do participante</div>
                    <div>• Obra de interesse</div>
                    <div>• Tipo de participação</div>
                    <div>• Sugestões ou comentários</div>
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
                  promovendo transparência nas obras públicas e permitindo que cidadãos acompanhem projetos,
                  consultem cronogramas e participem do processo de desenvolvimento urbano.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}