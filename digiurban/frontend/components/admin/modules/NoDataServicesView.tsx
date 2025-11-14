// ============================================================
// NO DATA SERVICES VIEW - View Agregada de Serviços SEM_DADOS
// ============================================================
// Componente 100% genérico para gerenciar múltiplos serviços SEM_DADOS simultaneamente
// Usado para serviços simples que só precisam de tracking de protocolos (sem formulários)

'use client';

import { useState } from 'react';
import { useNoDataServices } from '@/hooks/useNoDataServices';
import { useServiceProtocols } from '@/hooks/useServiceProtocols';
import { CreateNoDataProtocolModal } from './CreateNoDataProtocolModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Grid3x3,
  List,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NoDataServicesViewProps {
  departmentSlug: string;
  departmentName: string;
}

export function NoDataServicesView({ departmentSlug, departmentName }: NoDataServicesViewProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Buscar serviços SEM_DADOS
  const { services, loading: loadingServices, error: servicesError, refetch: refetchServices } = useNoDataServices(departmentSlug);

  // Buscar protocolos dos serviços selecionados
  const { protocols, loading: loadingProtocols, total, refetch: refetchProtocols } = useServiceProtocols(selectedServices);

  // Selecionar todos os serviços por padrão quando carregarem
  if (services.length > 0 && selectedServices.length === 0) {
    setSelectedServices(services.map(s => s.id));
  }

  // Status config
  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    VINCULADO: { label: 'Vinculado', color: 'bg-blue-100 text-blue-800', icon: Clock },
    PROGRESSO: { label: 'Em Progresso', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
    CONCLUIDO: { label: 'Concluído', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    PENDENCIA: { label: 'Pendência', color: 'bg-orange-100 text-orange-800', icon: XCircle },
    CANCELADO: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle }
  };

  // Filtrar protocolos
  const filteredProtocols = protocols.filter(p => {
    const matchesSearch = searchQuery === '' ||
      p.protocolNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.citizen?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.service.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !statusFilter || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Estatísticas
  const stats = {
    total: protocols.length,
    vinculado: protocols.filter(p => p.status === 'VINCULADO').length,
    progresso: protocols.filter(p => p.status === 'PROGRESSO').length,
    concluido: protocols.filter(p => p.status === 'CONCLUIDO').length,
    pendencia: protocols.filter(p => p.status === 'PENDENCIA').length
  };

  if (loadingServices) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (servicesError) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Erro ao carregar serviços</h3>
          <p className="text-muted-foreground">{servicesError}</p>
        </CardContent>
      </Card>
    );
  }

  if (services.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Nenhum Serviço Geral Cadastrado</h3>
          <p className="text-muted-foreground">
            Esta secretaria ainda não possui serviços gerais (SEM_DADOS).
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Serviços Gerais</h1>
          <p className="text-muted-foreground mt-1">
            {departmentName} • {services.length} serviços • {stats.total} protocolos
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Protocolo
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent" onClick={() => setStatusFilter(statusFilter === 'VINCULADO' ? null : 'VINCULADO')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vinculados</p>
                <p className="text-2xl font-bold text-blue-600">{stats.vinculado}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent" onClick={() => setStatusFilter(statusFilter === 'PROGRESSO' ? null : 'PROGRESSO')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Progresso</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.progresso}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent" onClick={() => setStatusFilter(statusFilter === 'CONCLUIDO' ? null : 'CONCLUIDO')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Concluídos</p>
                <p className="text-2xl font-bold text-green-600">{stats.concluido}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent" onClick={() => setStatusFilter(statusFilter === 'PENDENCIA' ? null : 'PENDENCIA')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendências</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendencia}</p>
              </div>
              <XCircle className="h-8 w-8 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <List className="h-4 w-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="services">
            <Grid3x3 className="h-4 w-4 mr-2" />
            Serviços ({services.length})
          </TabsTrigger>
          <TabsTrigger value="protocols">
            <FileText className="h-4 w-4 mr-2" />
            Protocolos ({filteredProtocols.length})
          </TabsTrigger>
        </TabsList>

        {/* ABA: VISÃO GERAL */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Serviços Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {services.map(service => (
                  <div
                    key={service.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedServices.includes(service.id)
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => {
                      if (selectedServices.includes(service.id)) {
                        setSelectedServices(selectedServices.filter(id => id !== service.id));
                      } else {
                        setSelectedServices([...selectedServices, service.id]);
                      }
                    }}
                  >
                    <div className="text-sm font-medium">{service.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {protocols.filter(p => p.serviceId === service.id).length} protocolos
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Protocolos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {protocols.slice(0, 5).map(protocol => {
                  const config = statusConfig[protocol.status] || statusConfig.VINCULADO;
                  const StatusIcon = config.icon;

                  return (
                    <div key={protocol.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">#{protocol.protocolNumber}</span>
                          <Badge className={config.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {protocol.service.name} • {protocol.citizen?.name}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(protocol.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA: SERVIÇOS */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Serviços Exibidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedServices(services.map(s => s.id))}
                  >
                    Selecionar Todos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedServices([])}
                  >
                    Limpar Seleção
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {services.map(service => {
                    const serviceProtocols = protocols.filter(p => p.serviceId === service.id);
                    const isSelected = selectedServices.includes(service.id);

                    return (
                      <Card
                        key={service.id}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedServices(selectedServices.filter(id => id !== service.id));
                          } else {
                            setSelectedServices([...selectedServices, service.id]);
                          }
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">{service.name}</h4>
                              {service.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {service.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                <span>{serviceProtocols.length} protocolos</span>
                                <span>•</span>
                                <span>{service.moduleType}</span>
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircle className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA: PROTOCOLOS */}
        <TabsContent value="protocols" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por protocolo, cidadão ou serviço..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {statusFilter && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStatusFilter(null)}
                  >
                    Limpar Filtro
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista de Protocolos */}
          <Card>
            <CardContent className="p-0">
              {loadingProtocols ? (
                <div className="p-8 text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-muted-foreground">Carregando protocolos...</p>
                </div>
              ) : filteredProtocols.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    {searchQuery || statusFilter
                      ? 'Nenhum protocolo encontrado com os filtros aplicados'
                      : 'Nenhum protocolo criado ainda'}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredProtocols.map(protocol => {
                    const config = statusConfig[protocol.status] || statusConfig.VINCULADO;
                    const StatusIcon = config.icon;

                    return (
                      <div
                        key={protocol.id}
                        className="p-4 hover:bg-accent cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">#{protocol.protocolNumber}</span>
                              <Badge className={config.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {config.label}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm">
                              <p>
                                <span className="text-muted-foreground">Serviço:</span>{' '}
                                <span className="font-medium">{protocol.service.name}</span>
                              </p>
                              <p>
                                <span className="text-muted-foreground">Cidadão:</span>{' '}
                                {protocol.citizen?.name}
                              </p>
                              <p className="text-muted-foreground">
                                Criado em {format(new Date(protocol.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de criação de protocolo */}
      <CreateNoDataProtocolModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        services={services}
        departmentSlug={departmentSlug}
        onSuccess={() => {
          refetchProtocols();
        }}
      />
    </div>
  );
}
