'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AssignProtocolDialog } from '@/components/admin/AssignProtocolDialog';
import { toast } from 'sonner';
import {
  Bell,
  UserPlus,
  RefreshCw,
  Filter,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Protocol {
  id: string;
  number: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  createdAt: string;
  citizen?: {
    id: string;
    name: string;
    cpf?: string;
    email?: string;
  };
  service?: {
    id: string;
    name: string;
    category?: string;
  };
  department?: {
    id: string;
    name: string;
  };
  assignedUser?: {
    id: string;
    name: string;
    role?: string;
  };
  createdBy?: {
    id: string;
    name: string;
    role?: string;
  };
}

const statusLabels: Record<string, string> = {
  VINCULADO: 'Pendente',
  PROGRESSO: 'Em Progresso',
  ATUALIZACAO: 'Atualização',
  CONCLUIDO: 'Concluído',
  PENDENCIA: 'Pendência',
  CANCELADO: 'Cancelado'
};

const statusColors: Record<string, string> = {
  VINCULADO: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PROGRESSO: 'bg-blue-100 text-blue-800 border-blue-200',
  ATUALIZACAO: 'bg-orange-100 text-orange-800 border-orange-200',
  CONCLUIDO: 'bg-green-100 text-green-800 border-green-200',
  PENDENCIA: 'bg-red-100 text-red-800 border-red-200',
  CANCELADO: 'bg-gray-100 text-gray-800 border-gray-200'
};

const priorityLabels: Record<number, string> = {
  1: 'Baixa',
  2: 'Média',
  3: 'Alta',
  4: 'Urgente',
  5: 'Crítica'
};

const priorityColors: Record<number, string> = {
  1: 'bg-gray-100 text-gray-800',
  2: 'bg-blue-100 text-blue-800',
  3: 'bg-orange-100 text-orange-800',
  4: 'bg-red-100 text-red-800',
  5: 'bg-purple-100 text-purple-800'
};

export default function ChamadosRecebidosPage() {
  const params = useParams();
  const { apiRequest, user } = useAdminAuth();
  const departmentSlug = params.department as string;

  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, unassigned: 0, assigned: 0 });

  // Carregar chamados recebidos
  const loadIncomingCalls = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (assignedFilter !== 'all') params.append('assignedFilter', assignedFilter);

      const response = await apiRequest(`/api/protocols/incoming-calls?${params.toString()}`);

      if (response.success) {
        setProtocols(response.protocols || []);
        setStats(response.stats || { total: 0, unassigned: 0, assigned: 0 });
      }
    } catch (error: any) {
      console.error('Erro ao carregar chamados:', error);
      toast.error(error.response?.data?.error || 'Erro ao carregar chamados recebidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncomingCalls();
  }, [statusFilter, assignedFilter]);

  const handleAssign = (protocol: Protocol) => {
    setSelectedProtocol(protocol);
    setIsAssignDialogOpen(true);
  };

  const handleAssignSuccess = () => {
    loadIncomingCalls();
    setIsAssignDialogOpen(false);
    setSelectedProtocol(null);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bell className="h-8 w-8" />
            Chamados Recebidos
          </h1>
          <p className="text-muted-foreground mt-2">
            Protocolos criados pelo prefeito para este departamento
          </p>
        </div>
        <Button onClick={loadIncomingCalls} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Chamados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Não Atribuídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.unassigned}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Atribuídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.assigned}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <div className="flex gap-4 flex-1">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="VINCULADO">Pendente</SelectItem>
                  <SelectItem value="PROGRESSO">Em Progresso</SelectItem>
                  <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                  <SelectItem value="PENDENCIA">Pendência</SelectItem>
                </SelectContent>
              </Select>

              <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por atribuição" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="unassigned">Não Atribuídos</SelectItem>
                  <SelectItem value="assigned">Atribuídos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {protocols.length} chamado(s)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Chamados */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : protocols.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Nenhum chamado recebido</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {protocols.map((protocol) => (
            <Card key={protocol.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">
                        Protocolo #{protocol.number}
                      </CardTitle>
                      <Badge className={statusColors[protocol.status]}>
                        {statusLabels[protocol.status]}
                      </Badge>
                      <Badge className={priorityColors[protocol.priority]}>
                        {priorityLabels[protocol.priority]}
                      </Badge>
                    </div>
                    <CardDescription>{protocol.title}</CardDescription>
                    {protocol.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {protocol.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant={protocol.assignedUser ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => handleAssign(protocol)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {protocol.assignedUser ? 'Reatribuir' : 'Atribuir'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {protocol.citizen && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Cidadão</p>
                        <p className="font-medium">{protocol.citizen.name}</p>
                      </div>
                    </div>
                  )}

                  {protocol.service && (
                    <div>
                      <p className="text-xs text-muted-foreground">Serviço</p>
                      <p className="font-medium">{protocol.service.name}</p>
                    </div>
                  )}

                  {protocol.createdBy && (
                    <div>
                      <p className="text-xs text-muted-foreground">Criado por</p>
                      <p className="font-medium">{protocol.createdBy.name}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Data</p>
                      <p className="font-medium">
                        {format(new Date(protocol.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>

                {protocol.assignedUser && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        <User className="h-3 w-3 mr-1" />
                        Atribuído para: {protocol.assignedUser.name}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de Atribuição */}
      <AssignProtocolDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        protocol={selectedProtocol as any}
        onSuccess={handleAssignSuccess}
      />
    </div>
  );
}
