'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Filter, Eye, Download } from 'lucide-react';

interface Solicitacao {
  id: string;
  protocolId: string;
  citizenName: string;
  citizenCpf: string;
  especialidade: string;
  cidadeDestino: string;
  status: string;
  prioridade: string;
  dataConsulta?: string;
  createdAt: string;
}

export default function SolicitacoesPage() {
  const router = useRouter();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [prioridadeFilter, setPrioridadeFilter] = useState('all');

  useEffect(() => {
    loadSolicitacoes();
  }, [statusFilter, prioridadeFilter]);

  const loadSolicitacoes = async () => {
    try {
      // TODO: Implementar chamada real à API
      // let url = '/api/tfd/solicitacoes?';
      // if (statusFilter !== 'all') url += `status=${statusFilter}&`;
      // if (prioridadeFilter !== 'all') url += `prioridade=${prioridadeFilter}`;
      // const response = await fetch(url);
      // const data = await response.json();

      // Mock data temporário
      setSolicitacoes([
        {
          id: '1',
          protocolId: 'TFD-2025-001',
          citizenName: 'Maria Silva Santos',
          citizenCpf: '123.456.789-00',
          especialidade: 'Oncologia',
          cidadeDestino: 'São Paulo - SP',
          status: 'AGUARDANDO_ANALISE_DOCUMENTAL',
          prioridade: 'ALTA',
          createdAt: '2025-11-20',
        },
        {
          id: '2',
          protocolId: 'TFD-2025-002',
          citizenName: 'João Santos Oliveira',
          citizenCpf: '987.654.321-00',
          especialidade: 'Cardiologia',
          cidadeDestino: 'Campinas - SP',
          status: 'AGUARDANDO_REGULACAO_MEDICA',
          prioridade: 'EMERGENCIA',
          dataConsulta: '2025-11-28',
          createdAt: '2025-11-19',
        },
        {
          id: '3',
          protocolId: 'TFD-2025-003',
          citizenName: 'Ana Paula Costa',
          citizenCpf: '456.789.123-00',
          especialidade: 'Neurologia',
          cidadeDestino: 'São Paulo - SP',
          status: 'AGENDADO',
          prioridade: 'MEDIA',
          dataConsulta: '2025-12-05',
          createdAt: '2025-11-18',
        },
      ]);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      AGUARDANDO_ANALISE_DOCUMENTAL: { label: 'Análise Documental', variant: 'default' },
      DOCUMENTACAO_PENDENTE: { label: 'Documentação Pendente', variant: 'secondary' },
      AGUARDANDO_REGULACAO_MEDICA: { label: 'Regulação Médica', variant: 'default' },
      AGUARDANDO_APROVACAO_GESTAO: { label: 'Aprovação Gestão', variant: 'default' },
      AGENDADO: { label: 'Agendado', variant: 'outline' },
      EM_VIAGEM: { label: 'Em Viagem', variant: 'default' },
      REALIZADO: { label: 'Realizado', variant: 'outline' },
      CANCELADO: { label: 'Cancelado', variant: 'destructive' },
    };

    const config = statusMap[status] || { label: status, variant: 'default' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const prioridadeMap: Record<string, { color: string; label: string }> = {
      EMERGENCIA: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Emergência' },
      ALTA: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Alta' },
      MEDIA: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Média' },
      ROTINA: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Rotina' },
    };

    const config = prioridadeMap[prioridade] || prioridadeMap.ROTINA;
    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const filteredSolicitacoes = solicitacoes.filter((sol) => {
    const matchesSearch =
      sol.citizenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sol.protocolId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sol.citizenCpf.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || sol.status === statusFilter;
    const matchesPrioridade = prioridadeFilter === 'all' || sol.prioridade === prioridadeFilter;

    return matchesSearch && matchesStatus && matchesPrioridade;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Solicitações TFD</h1>
          <p className="text-muted-foreground">
            Gerenciar todas as solicitações de tratamento fora do domicílio
          </p>
        </div>
        <Button
          size="lg"
          className="bg-orange-600 hover:bg-orange-700"
          onClick={() => router.push('/admin/apps/saude/tfd/solicitacoes/nova')}
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Solicitação
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CPF ou protocolo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="AGUARDANDO_ANALISE_DOCUMENTAL">Análise Documental</SelectItem>
                <SelectItem value="AGUARDANDO_REGULACAO_MEDICA">Regulação Médica</SelectItem>
                <SelectItem value="AGUARDANDO_APROVACAO_GESTAO">Aprovação Gestão</SelectItem>
                <SelectItem value="AGENDADO">Agendado</SelectItem>
                <SelectItem value="EM_VIAGEM">Em Viagem</SelectItem>
                <SelectItem value="REALIZADO">Realizado</SelectItem>
                <SelectItem value="CANCELADO">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                <SelectItem value="EMERGENCIA">Emergência</SelectItem>
                <SelectItem value="ALTA">Alta</SelectItem>
                <SelectItem value="MEDIA">Média</SelectItem>
                <SelectItem value="ROTINA">Rotina</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {filteredSolicitacoes.length} Solicitação(ões)
            </CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : filteredSolicitacoes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma solicitação encontrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Consulta</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSolicitacoes.map((sol) => (
                  <TableRow key={sol.id}>
                    <TableCell className="font-medium">{sol.protocolId}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{sol.citizenName}</div>
                        <div className="text-xs text-muted-foreground">{sol.citizenCpf}</div>
                      </div>
                    </TableCell>
                    <TableCell>{sol.especialidade}</TableCell>
                    <TableCell>{sol.cidadeDestino}</TableCell>
                    <TableCell>{getPrioridadeBadge(sol.prioridade)}</TableCell>
                    <TableCell>{getStatusBadge(sol.status)}</TableCell>
                    <TableCell>
                      {sol.dataConsulta
                        ? new Date(sol.dataConsulta).toLocaleDateString('pt-BR')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {new Date(sol.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/apps/saude/tfd/solicitacoes/${sol.id}`)
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
