'use client';

/**
 * ============================================================================
 * MÓDULO: Lista de Protocolos
 * ============================================================================
 *
 * ABA 1: Lista compacta e moderna de protocolos do módulo
 * Ao clicar em um protocolo, redireciona para /admin/protocolos/[id]
 */

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Users,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ModuleProtocolsListProps {
  protocols: any[];
  service: any;
  returnUrl?: string;
}

export function ModuleProtocolsList({
  protocols,
  service,
  returnUrl
}: ModuleProtocolsListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtrar protocolos
  const filteredProtocols = useMemo(() => {
    let filtered = protocols;

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Busca por texto
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(protocol => {
        const number = (protocol.number || protocol.protocolNumber || '').toLowerCase();
        const citizenName = (protocol.citizen?.name || '').toLowerCase();
        const dataStr = JSON.stringify(protocol.customData || {}).toLowerCase();

        return number.includes(searchLower) ||
               citizenName.includes(searchLower) ||
               dataStr.includes(searchLower);
      });
    }

    return filtered;
  }, [protocols, statusFilter, searchTerm]);

  // Paginação
  const totalPages = Math.ceil(filteredProtocols.length / itemsPerPage);
  const paginatedProtocols = filteredProtocols.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Estatísticas
  const stats = useMemo(() => ({
    total: protocols.length,
    vinculado: protocols.filter(p => p.status === 'VINCULADO').length,
    progresso: protocols.filter(p => p.status === 'PROGRESSO').length,
    concluido: protocols.filter(p => p.status === 'CONCLUIDO').length,
    cancelado: protocols.filter(p => p.status === 'CANCELADO').length,
  }), [protocols]);

  // Click no protocolo
  const handleProtocolClick = (protocol: any) => {
    const currentUrl = returnUrl || window.location.pathname;
    router.push(`/admin/protocolos/${protocol.id}?returnTo=${encodeURIComponent(currentUrl)}`);
  };

  // Badge de status
  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; icon: any; label: string }> = {
      VINCULADO: { variant: 'outline', icon: Clock, label: 'Pendente' },
      PROGRESSO: { variant: 'default', icon: AlertCircle, label: 'Em Análise' },
      CONCLUIDO: { variant: 'default', icon: CheckCircle, label: 'Concluído' },
      CANCELADO: { variant: 'destructive', icon: XCircle, label: 'Cancelado' },
    };

    const { variant, icon: Icon, label } = config[status] || config.VINCULADO;

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.vinculado}</div>
            <div className="text-xs text-muted-foreground">Pendentes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.progresso}</div>
            <div className="text-xs text-muted-foreground">Em Análise</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.concluido}</div>
            <div className="text-xs text-muted-foreground">Concluídos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.cancelado}</div>
            <div className="text-xs text-muted-foreground">Cancelados</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, cidadão ou dados..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full md:w-[200px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="VINCULADO">Pendentes</SelectItem>
                  <SelectItem value="PROGRESSO">Em Análise</SelectItem>
                  <SelectItem value="CONCLUIDO">Concluídos</SelectItem>
                  <SelectItem value="CANCELADO">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Protocolos */}
      <div className="space-y-3">
        {paginatedProtocols.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all'
                  ? 'Nenhum protocolo encontrado com os filtros aplicados'
                  : 'Nenhum protocolo criado ainda'}
              </p>
            </CardContent>
          </Card>
        ) : (
          paginatedProtocols.map((protocol) => (
            <Card
              key={protocol.id}
              className="hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => handleProtocolClick(protocol)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Info Principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="font-semibold text-lg">
                        #{protocol.number || protocol.protocolNumber}
                      </div>
                      {getStatusBadge(protocol.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                      {protocol.citizen && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span className="truncate">{protocol.citizen.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          {format(new Date(protocol.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      {protocol.stages && protocol.stages.length > 0 && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>
                            Etapa {protocol.stages.filter((s: any) => s.status === 'COMPLETED').length}/{protocol.stages.length}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Seta de navegação */}
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}
