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
import { Construction, MessageSquare, Clock, MapPin, Users, CheckCircle, AlertTriangle, Wrench, TrendingUp, Plus, Search, Filter, Download, Eye, Edit, Calendar, Phone, FileText, Camera, Settings, Zap, RefreshCw } from "lucide-react";

export default function AtendimentosObrasPublicasPage() {
  useAdminAuth("admin");

  const [atendimentos, setAtendimentos] = useState([
    {
      id: 1,
      protocolo: "OP-2024-001234",
      cidadao: "Carlos Silva Santos",
      cpf: "123.456.789-00",
      telefone: "(11) 98765-4321",
      email: "carlos.silva@email.com",
      tipo_solicitacao: "Solicitação de Obra",
      categoria: "Pavimentação",
      assunto: "Solicitação de asfaltamento da Rua das Flores",
      descricao: "Rua em péssimo estado de conservação, com muitos buracos e dificultando o trânsito de veículos e pedestres",
      endereco_problema: "Rua das Flores, entre números 100 e 300",
      bairro: "Centro",
      status: "Em Análise",
      prioridade: "Alta",
      data_abertura: "2024-01-15",
      previsao_resposta: "2024-01-25",
      atendente: "Eng. Maria Costa",
      observacoes: "Solicitação com fotos anexadas, região de grande movimento",
      tem_foto: true,
      urgencia: "Alta"
    },
    {
      id: 2,
      protocolo: "OP-2024-001567",
      cidadao: "Ana Oliveira Lima",
      cpf: "987.654.321-00",
      telefone: "(11) 94567-8901",
      email: "ana.oliveira@email.com",
      tipo_solicitacao: "Reclamação de Infraestrutura",
      categoria: "Drenagem",
      assunto: "Problema de alagamento na Av. Principal",
      descricao: "Alagamentos constantes na avenida durante períodos de chuva, prejudicando comércio local",
      endereco_problema: "Av. Principal, altura do número 1500",
      bairro: "Norte",
      status: "Vistoria Agendada",
      prioridade: "Alta",
      data_abertura: "2024-01-12",
      previsao_resposta: "2024-01-20",
      atendente: "Eng. João Silva",
      observacoes: "Vistoria técnica agendada para verificar sistema de drenagem",
      tem_foto: true,
      urgencia: "Alta"
    },
    {
      id: 3,
      protocolo: "OP-2024-001890",
      cidadao: "Pedro Fernandes Costa",
      cpf: "456.789.123-00",
      telefone: "(11) 91234-5678",
      email: "pedro.costa@email.com",
      tipo_solicitacao: "Sugestão de Melhoria",
      categoria: "Acessibilidade",
      assunto: "Instalação de rampas de acessibilidade",
      descricao: "Sugestão para instalação de rampas para cadeirantes na praça central",
      endereco_problema: "Praça Central, s/n",
      bairro: "Centro",
      status: "Aprovado",
      prioridade: "Média",
      data_abertura: "2024-01-10",
      previsao_resposta: "2024-01-18",
      atendente: "Arq. Paula Santos",
      observacoes: "Projeto aprovado, aguardando execução",
      tem_foto: false,
      urgencia: "Média"
    },
    {
      id: 4,
      protocolo: "OP-2024-002123",
      cidadao: "Lucia Martinez Silva",
      cpf: "321.654.987-00",
      telefone: "(11) 95678-1234",
      email: "lucia.martinez@email.com",
      tipo_solicitacao: "Informações de Obra",
      categoria: "Consulta",
      assunto: "Informações sobre obra da ponte",
      descricao: "Solicitação de informações sobre cronograma e previsão de conclusão da obra da ponte",
      endereco_problema: "Ponte do Rio Verde",
      bairro: "Sul",
      status: "Respondido",
      prioridade: "Baixa",
      data_abertura: "2024-01-08",
      previsao_resposta: "2024-01-12",
      atendente: "Eng. Roberto Lima",
      observacoes: "Informações fornecidas sobre cronograma da obra",
      tem_foto: false,
      urgencia: "Baixa"
    }
  ]);

  const [equipes, setEquipes] = useState([
    {
      id: 1,
      nome: "Equipe Pavimentação",
      especialidade: "Pavimentação e Asfaltamento",
      responsavel: "Eng. Carlos Mendes",
      membros: 8,
      equipamentos: ["Rolo Compactador", "Usina de Asfalto", "Caminhões"],
      status: "Disponível",
      regiao_atuacao: "Centro/Norte"
    },
    {
      id: 2,
      nome: "Equipe Drenagem",
      especialidade: "Sistemas de Drenagem",
      responsavel: "Eng. Ana Torres",
      membros: 6,
      equipamentos: ["Escavadeira", "Caminhão Sugador", "Equipos de Soldagem"],
      status: "Em Campo",
      regiao_atuacao: "Sul/Leste"
    },
    {
      id: 3,
      nome: "Equipe Acessibilidade",
      especialidade: "Obras de Acessibilidade",
      responsavel: "Arq. Paula Santos",
      membros: 4,
      equipamentos: ["Betoneira", "Ferramentas Manuais", "Nível Laser"],
      status: "Disponível",
      regiao_atuacao: "Toda cidade"
    }
  ]);

  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroPrioridade, setFiltroPrioridade] = useState("");
  const [busca, setBusca] = useState("");

  const [atendimentoDialog, setAtendimentoDialog] = useState(false);
  const [equipeDialog, setEquipeDialog] = useState(false);

  const [novoAtendimento, setNovoAtendimento] = useState({
    cidadao: "",
    cpf: "",
    telefone: "",
    email: "",
    tipo_solicitacao: "",
    categoria: "",
    assunto: "",
    descricao: "",
    endereco_problema: "",
    bairro: "",
    prioridade: "",
    urgencia: ""
  });

  const [novaEquipe, setNovaEquipe] = useState({
    nome: "",
    especialidade: "",
    responsavel: "",
    membros: "",
    regiao_atuacao: ""
  });

  const dataEstatisticas = [
    { mes: "Jul", solicitacoes: 187, reclamacoes: 89, sugestoes: 45, informacoes: 67 },
    { mes: "Ago", solicitacoes: 234, reclamacoes: 123, sugestoes: 56, informacoes: 78 },
    { mes: "Set", solicitacoes: 198, reclamacoes: 98, sugestoes: 62, informacoes: 89 },
    { mes: "Out", solicitacoes: 267, reclamacoes: 134, sugestoes: 48, informacoes: 95 },
    { mes: "Nov", solicitacoes: 223, reclamacoes: 107, sugestoes: 73, informacoes: 82 },
    { mes: "Dez", solicitacoes: 289, reclamacoes: 145, sugestoes: 68, informacoes: 104 }
  ];

  const dataTiposAtendimento = [
    { nome: "Solicitação de Obra", quantidade: 156, cor: "#3B82F6" },
    { nome: "Reclamação de Infraestrutura", quantidade: 134, cor: "#EF4444" },
    { nome: "Sugestão de Melhoria", quantidade: 89, cor: "#10B981" },
    { nome: "Informações de Obra", quantidade: 67, cor: "#F59E0B" }
  ];

  const dataCategorias = [
    { categoria: "Pavimentação", quantidade: 145, tempo_medio: 18 },
    { categoria: "Drenagem", quantidade: 98, tempo_medio: 25 },
    { categoria: "Acessibilidade", quantidade: 67, tempo_medio: 12 },
    { categoria: "Sinalização", quantidade: 54, tempo_medio: 8 },
    { categoria: "Pontes/Viadutos", quantidade: 32, tempo_medio: 45 },
    { categoria: "Consulta", quantidade: 72, tempo_medio: 3 }
  ];

  const dataUrgencia = [
    { urgencia: "Alta", quantidade: 89, cor: "#EF4444" },
    { urgencia: "Média", quantidade: 234, cor: "#F59E0B" },
    { urgencia: "Baixa", quantidade: 123, cor: "#10B981" }
  ];

  const atendimentosFiltrados = atendimentos.filter(atendimento => {
    const matchesBusca = atendimento.cidadao.toLowerCase().includes(busca.toLowerCase()) ||
                        atendimento.protocolo.toLowerCase().includes(busca.toLowerCase()) ||
                        atendimento.assunto.toLowerCase().includes(busca.toLowerCase());
    const matchesStatus = filtroStatus === "" || atendimento.status === filtroStatus;
    const matchesTipo = filtroTipo === "" || atendimento.tipo_solicitacao === filtroTipo;
    const matchesPrioridade = filtroPrioridade === "" || atendimento.prioridade === filtroPrioridade;
    return matchesBusca && matchesStatus && matchesTipo && matchesPrioridade;
  });

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      "Em Análise": "secondary",
      "Vistoria Agendada": "outline",
      "Aprovado": "default",
      "Em Execução": "secondary",
      "Concluído": "outline",
      "Respondido": "default",
      "Cancelado": "destructive",
      "Disponível": "default",
      "Em Campo": "secondary"
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

  const getUrgenciaBadge = (urgencia: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      "Alta": "destructive",
      "Média": "secondary",
      "Baixa": "outline"
    };
    return <Badge variant={variants[urgencia] || "outline"}>{urgencia}</Badge>;
  };

  const handleCreateAtendimento = () => {
    const atendimento = {
      id: atendimentos.length + 1,
      protocolo: `OP-2024-${String(Math.floor(Math.random() * 900000) + 100000)}`,
      ...novoAtendimento,
      status: "Em Análise",
      data_abertura: new Date().toISOString().split('T')[0],
      previsao_resposta: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      atendente: "Sistema",
      observacoes: "Solicitação registrada",
      tem_foto: false
    };
    setAtendimentos([...atendimentos, atendimento]);
    setNovoAtendimento({
      cidadao: "",
      cpf: "",
      telefone: "",
      email: "",
      tipo_solicitacao: "",
      categoria: "",
      assunto: "",
      descricao: "",
      endereco_problema: "",
      bairro: "",
      prioridade: "",
      urgencia: ""
    });
    setAtendimentoDialog(false);
  };

  const handleCreateEquipe = () => {
    const equipe = {
      id: equipes.length + 1,
      ...novaEquipe,
      membros: parseInt(novaEquipe.membros),
      equipamentos: [],
      status: "Disponível"
    };
    setEquipes([...equipes, equipe]);
    setNovaEquipe({
      nome: "",
      especialidade: "",
      responsavel: "",
      membros: "",
      regiao_atuacao: ""
    });
    setEquipeDialog(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Construction className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Atendimentos Obras Públicas</h1>
            <p className="text-gray-600">PDV para solicitações relacionadas a obras públicas e infraestrutura urbana</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atendimentos Hoje</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">73</div>
              <p className="text-xs text-muted-foreground">+18% vs ontem</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15 dias</div>
              <p className="text-xs text-muted-foreground">Resposta completa</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa Resolução</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">78%</div>
              <p className="text-xs text-muted-foreground">Problemas resolvidos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Equipes Ativas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">2 em campo agora</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evolução de Atendimentos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dataEstatisticas}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="solicitacoes" stroke="#3B82F6" name="Solicitações" />
                  <Line type="monotone" dataKey="reclamacoes" stroke="#EF4444" name="Reclamações" />
                  <Line type="monotone" dataKey="sugestoes" stroke="#10B981" name="Sugestões" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tipos de Atendimento</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={dataTiposAtendimento}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="quantidade"
                  >
                    {dataTiposAtendimento.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-1 gap-2 mt-4">
                {dataTiposAtendimento.map((item, index) => (
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
              <CardTitle className="text-lg">Categorias Mais Solicitadas</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dataCategorias}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="categoria" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="#8B5CF6" name="Quantidade" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribuição por Urgência</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dataUrgencia.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.cor }}></div>
                      <span className="font-medium">{item.urgencia}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold">{item.quantidade}</span>
                      <span className="text-sm text-gray-500 ml-1">casos</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="atendimentos" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="atendimentos">Atendimentos</TabsTrigger>
          <TabsTrigger value="equipes">Equipes Técnicas</TabsTrigger>
          <TabsTrigger value="fila">Fila de Serviços</TabsTrigger>
          <TabsTrigger value="servicos">Serviços Gerados</TabsTrigger>
        </TabsList>

        <TabsContent value="atendimentos" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Gestão de Atendimentos</CardTitle>
                  <CardDescription>Controle de solicitações de obras e infraestrutura urbana</CardDescription>
                </div>
                <Dialog open={atendimentoDialog} onOpenChange={setAtendimentoDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Atendimento
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Registrar Novo Atendimento</DialogTitle>
                      <DialogDescription>Cadastre uma nova solicitação de obras públicas</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cidadao">Nome do Cidadão</Label>
                        <Input
                          id="cidadao"
                          value={novoAtendimento.cidadao}
                          onChange={(e) => setNovoAtendimento({ ...novoAtendimento, cidadao: e.target.value })}
                          placeholder="Nome completo"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cpf">CPF</Label>
                        <Input
                          id="cpf"
                          value={novoAtendimento.cpf}
                          onChange={(e) => setNovoAtendimento({ ...novoAtendimento, cpf: e.target.value })}
                          placeholder="000.000.000-00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input
                          id="telefone"
                          value={novoAtendimento.telefone}
                          onChange={(e) => setNovoAtendimento({ ...novoAtendimento, telefone: e.target.value })}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={novoAtendimento.email}
                          onChange={(e) => setNovoAtendimento({ ...novoAtendimento, email: e.target.value })}
                          placeholder="email@exemplo.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tipo_solicitacao">Tipo de Solicitação</Label>
                        <Select value={novoAtendimento.tipo_solicitacao} onValueChange={(value) => setNovoAtendimento({ ...novoAtendimento, tipo_solicitacao: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Solicitação de Obra">Solicitação de Obra</SelectItem>
                            <SelectItem value="Reclamação de Infraestrutura">Reclamação de Infraestrutura</SelectItem>
                            <SelectItem value="Sugestão de Melhoria">Sugestão de Melhoria</SelectItem>
                            <SelectItem value="Informações de Obra">Informações de Obra</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="categoria">Categoria</Label>
                        <Select value={novoAtendimento.categoria} onValueChange={(value) => setNovoAtendimento({ ...novoAtendimento, categoria: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pavimentação">Pavimentação</SelectItem>
                            <SelectItem value="Drenagem">Drenagem</SelectItem>
                            <SelectItem value="Acessibilidade">Acessibilidade</SelectItem>
                            <SelectItem value="Sinalização">Sinalização</SelectItem>
                            <SelectItem value="Pontes/Viadutos">Pontes/Viadutos</SelectItem>
                            <SelectItem value="Consulta">Consulta</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="bairro">Bairro</Label>
                        <Input
                          id="bairro"
                          value={novoAtendimento.bairro}
                          onChange={(e) => setNovoAtendimento({ ...novoAtendimento, bairro: e.target.value })}
                          placeholder="Nome do bairro"
                        />
                      </div>
                      <div>
                        <Label htmlFor="prioridade">Prioridade</Label>
                        <Select value={novoAtendimento.prioridade} onValueChange={(value) => setNovoAtendimento({ ...novoAtendimento, prioridade: value })}>
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
                        <Label htmlFor="urgencia">Urgência</Label>
                        <Select value={novoAtendimento.urgencia} onValueChange={(value) => setNovoAtendimento({ ...novoAtendimento, urgencia: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a urgência" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Alta">Alta</SelectItem>
                            <SelectItem value="Média">Média</SelectItem>
                            <SelectItem value="Baixa">Baixa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="endereco_problema">Endereço do Problema</Label>
                        <Input
                          id="endereco_problema"
                          value={novoAtendimento.endereco_problema}
                          onChange={(e) => setNovoAtendimento({ ...novoAtendimento, endereco_problema: e.target.value })}
                          placeholder="Endereço detalhado do local"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="assunto">Assunto</Label>
                        <Input
                          id="assunto"
                          value={novoAtendimento.assunto}
                          onChange={(e) => setNovoAtendimento({ ...novoAtendimento, assunto: e.target.value })}
                          placeholder="Resumo do assunto"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="descricao">Descrição Detalhada</Label>
                        <Textarea
                          id="descricao"
                          value={novoAtendimento.descricao}
                          onChange={(e) => setNovoAtendimento({ ...novoAtendimento, descricao: e.target.value })}
                          placeholder="Descrição completa do problema ou solicitação"
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAtendimentoDialog(false)}>Cancelar</Button>
                      <Button onClick={handleCreateAtendimento}>Registrar Atendimento</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4 flex-wrap">
                <div className="flex-1 min-w-64">
                  <Input
                    placeholder="Buscar atendimentos..."
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
                    <SelectItem value="Em Análise">Em Análise</SelectItem>
                    <SelectItem value="Vistoria Agendada">Vistoria Agendada</SelectItem>
                    <SelectItem value="Aprovado">Aprovado</SelectItem>
                    <SelectItem value="Em Execução">Em Execução</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os tipos</SelectItem>
                    <SelectItem value="Solicitação de Obra">Solicitação</SelectItem>
                    <SelectItem value="Reclamação de Infraestrutura">Reclamação</SelectItem>
                    <SelectItem value="Sugestão de Melhoria">Sugestão</SelectItem>
                    <SelectItem value="Informações de Obra">Informações</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-8 gap-4 p-4 bg-gray-50 font-medium text-sm">
                  <div>Protocolo</div>
                  <div>Cidadão</div>
                  <div>Tipo</div>
                  <div>Categoria</div>
                  <div>Status</div>
                  <div>Prioridade</div>
                  <div>Data</div>
                  <div>Ações</div>
                </div>
                <div className="divide-y">
                  {atendimentosFiltrados.map((atendimento) => (
                    <div key={atendimento.id} className="grid grid-cols-8 gap-4 p-4 items-center">
                      <div className="font-mono text-sm">{atendimento.protocolo}</div>
                      <div className="font-medium">{atendimento.cidadao}</div>
                      <div className="text-sm">{atendimento.tipo_solicitacao}</div>
                      <div>{atendimento.categoria}</div>
                      <div>{getStatusBadge(atendimento.status)}</div>
                      <div>{getPrioridadeBadge(atendimento.prioridade)}</div>
                      <div>{new Date(atendimento.data_abertura).toLocaleDateString()}</div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipes" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Equipes Técnicas</CardTitle>
                  <CardDescription>Gestão de equipes especializadas em obras públicas</CardDescription>
                </div>
                <Dialog open={equipeDialog} onOpenChange={setEquipeDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Equipe
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cadastrar Nova Equipe</DialogTitle>
                      <DialogDescription>Registre uma nova equipe técnica</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="nome_equipe">Nome da Equipe</Label>
                        <Input
                          id="nome_equipe"
                          value={novaEquipe.nome}
                          onChange={(e) => setNovaEquipe({ ...novaEquipe, nome: e.target.value })}
                          placeholder="Ex: Equipe Pavimentação Norte"
                        />
                      </div>
                      <div>
                        <Label htmlFor="especialidade_equipe">Especialidade</Label>
                        <Input
                          id="especialidade_equipe"
                          value={novaEquipe.especialidade}
                          onChange={(e) => setNovaEquipe({ ...novaEquipe, especialidade: e.target.value })}
                          placeholder="Ex: Pavimentação e Asfaltamento"
                        />
                      </div>
                      <div>
                        <Label htmlFor="responsavel_equipe">Responsável</Label>
                        <Input
                          id="responsavel_equipe"
                          value={novaEquipe.responsavel}
                          onChange={(e) => setNovaEquipe({ ...novaEquipe, responsavel: e.target.value })}
                          placeholder="Nome do responsável técnico"
                        />
                      </div>
                      <div>
                        <Label htmlFor="membros_equipe">Número de Membros</Label>
                        <Input
                          id="membros_equipe"
                          type="number"
                          value={novaEquipe.membros}
                          onChange={(e) => setNovaEquipe({ ...novaEquipe, membros: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="regiao_equipe">Região de Atuação</Label>
                        <Input
                          id="regiao_equipe"
                          value={novaEquipe.regiao_atuacao}
                          onChange={(e) => setNovaEquipe({ ...novaEquipe, regiao_atuacao: e.target.value })}
                          placeholder="Ex: Centro/Norte"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEquipeDialog(false)}>Cancelar</Button>
                      <Button onClick={handleCreateEquipe}>Cadastrar Equipe</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {equipes.map((equipe) => (
                  <Card key={equipe.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{equipe.nome}</h3>
                          <p className="text-gray-600">{equipe.especialidade}</p>
                          <p className="text-sm text-gray-500">Responsável: {equipe.responsavel}</p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(equipe.status)}
                          <div className="text-sm text-gray-500 mt-1">{equipe.regiao_atuacao}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-500">Membros</div>
                          <div className="font-medium">{equipe.membros} pessoas</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Status</div>
                          <div className="font-medium">{equipe.status}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Região</div>
                          <div className="font-medium">{equipe.regiao_atuacao}</div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="text-sm text-gray-500 mb-2">Equipamentos</div>
                        <div className="flex flex-wrap gap-2">
                          {equipe.equipamentos.map((equipamento, index) => (
                            <Badge key={index} variant="outline">{equipamento}</Badge>
                          ))}
                        </div>
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
                          <MapPin className="h-4 w-4 mr-1" />
                          Localizar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fila" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fila de Serviços</CardTitle>
              <CardDescription>Acompanhamento da fila de execução de obras e serviços</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded-lg bg-red-50">
                  <div>
                    <div className="font-medium text-red-800">URGENTE - Reparo de via principal</div>
                    <div className="text-sm text-red-600">Av. Central - Cratera na pista • Prazo: 24h</div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="destructive">Alta Prioridade</Badge>
                    <Badge variant="outline">Em Execução</Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 border rounded-lg bg-yellow-50">
                  <div>
                    <div className="font-medium text-yellow-800">Drenagem Rua das Flores</div>
                    <div className="text-sm text-yellow-600">Entupimento de bueiro • Prazo: 3 dias</div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">Média Prioridade</Badge>
                    <Badge variant="outline">Agendado</Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Sinalização Praça Central</div>
                    <div className="text-sm text-gray-600">Instalação de placas • Prazo: 7 dias</div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">Baixa Prioridade</Badge>
                    <Badge variant="secondary">Planejado</Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Acessibilidade Escola Municipal</div>
                    <div className="text-sm text-gray-600">Rampa para cadeirantes • Prazo: 10 dias</div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">Média Prioridade</Badge>
                    <Badge variant="secondary">Planejado</Badge>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-800">Estatísticas da Fila</h4>
                    <p className="text-blue-600">Urgentes: 1 • Programados: 12 • Concluídos hoje: 5</p>
                  </div>
                  <Button variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                </div>
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
                      <Construction className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Solicitação de Obra</h3>
                      <p className="text-sm text-gray-600">Solicitação de obras públicas e melhorias urbanas</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">Campos do formulário público:</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>• Dados pessoais do solicitante</div>
                    <div>• Tipo de obra necessária</div>
                    <div>• Localização detalhada</div>
                    <div>• Descrição do problema</div>
                    <div>• Justificativa da necessidade</div>
                    <div>• Upload de fotos</div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Reclamação de Infraestrutura</h3>
                      <p className="text-sm text-gray-600">Relato de problemas em obras e infraestrutura</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">Campos do formulário público:</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>• Identificação do cidadão</div>
                    <div>• Tipo de problema</div>
                    <div>• Endereço do problema</div>
                    <div>• Urgência da situação</div>
                    <div>• Evidências (fotos/vídeos)</div>
                    <div>• Impacto na comunidade</div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Sugestão de Melhoria</h3>
                      <p className="text-sm text-gray-600">Propostas de melhorias na infraestrutura urbana</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">Campos do formulário público:</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>• Dados do proponente</div>
                    <div>• Tipo de melhoria</div>
                    <div>• Local da sugestão</div>
                    <div>• Descrição da proposta</div>
                    <div>• Benefícios esperados</div>
                    <div>• Esboços ou referências</div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <FileText className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Informações de Obra</h3>
                      <p className="text-sm text-gray-600">Consulta sobre cronogramas e status de obras</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">Campos do formulário público:</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>• Nome ou endereço da obra</div>
                    <div>• Tipo de informação desejada</div>
                    <div>• Dados de contato</div>
                    <div>• Finalidade da consulta</div>
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
                  permitindo que cidadãos solicitem obras, reportem problemas, façam sugestões e consultem
                  informações sobre projetos de infraestrutura de forma digital e transparente.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}