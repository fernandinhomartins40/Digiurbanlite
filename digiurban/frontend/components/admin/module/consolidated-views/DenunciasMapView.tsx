'use client';

/**
 * MODO: DENÚNCIA
 * Visualização em mapa para denúncias/fiscalizações
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Map, Filter, FileText, Download, MapPin, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import type { ConsolidatedModeConfig, ConsolidatedRecord } from '@/lib/consolidated-data-intelligence';

interface DenunciasMapViewProps {
  config: ConsolidatedModeConfig;
  data: any;
}

export function DenunciasMapView({ config, data }: DenunciasMapViewProps) {
  const { records, stats, statusFilter, setStatusFilter, actions } = data;

  // Filtrar registros com geolocalização
  const recordsWithGeo = records.filter((r: ConsolidatedRecord) =>
    r.metadata?.latitude && r.metadata?.longitude
  );

  const statusIcons = {
    ATIVO: { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-100', label: 'Pendente' },
    INATIVO: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Resolvida' },
    EM_ANALISE: { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'Em Análise' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{config.icon}</span>
          <div>
            <h2 className="text-2xl font-bold">{config.title}</h2>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Denúncias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{recordsWithGeo.length} geolocalizadas</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.ativos}</div>
            <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>Aguardando solução</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolvidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.inativos}</div>
            <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Concluídas</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Resolução
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats.total > 0 ? Math.round((stats.inativos / stats.total) * 100) : 0}%
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Índice de efetividade
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Ações */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            {/* Filtros */}
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'ALL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('ALL')}
              >
                Todas ({stats.total})
              </Button>
              <Button
                variant={statusFilter === 'ATIVO' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('ATIVO')}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Pendentes ({stats.ativos})
              </Button>
              <Button
                variant={statusFilter === 'INATIVO' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('INATIVO')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Resolvidas ({stats.inativos})
              </Button>
            </div>

            {/* Ações */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={actions.handleExportMap}
              >
                <Map className="h-4 w-4 mr-2" />
                Exportar Mapa
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={actions.handleGenerateReport}
              >
                <FileText className="h-4 w-4 mr-2" />
                Gerar Relatório
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mapa Placeholder */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            <CardTitle>Visualização Geográfica</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-12 text-center">
            <Map className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium text-muted-foreground mb-2">
              Mapa Interativo
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {recordsWithGeo.length} denúncias com localização mapeadas
            </p>
            <div className="flex justify-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Pendentes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>Em Análise</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Resolvidas</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Denúncias */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Denúncias</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhuma denúncia encontrada</p>
              <p className="text-sm">Ajuste os filtros ou aguarde novas denúncias</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record: ConsolidatedRecord) => {
                const statusInfo = statusIcons[record.status as keyof typeof statusIcons] || statusIcons.ATIVO;
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={record.id}
                    className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Ícone de Status */}
                      <div className={`p-3 rounded-full ${statusInfo.bgColor}`}>
                        <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">
                              {record.data[config.keyField] || 'Denúncia sem descrição'}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {record.citizenName} | Protocolo: {record.protocolNumber}
                            </p>
                          </div>
                          <Badge variant={record.status === 'INATIVO' ? 'default' : 'secondary'}>
                            {statusInfo.label}
                          </Badge>
                        </div>

                        {/* Informações adicionais */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {record.data.endereco && (
                            <div>
                              <span className="text-muted-foreground">Endereço: </span>
                              <span>{record.data.endereco}</span>
                            </div>
                          )}
                          {record.metadata?.latitude && record.metadata?.longitude && (
                            <div>
                              <span className="text-muted-foreground">Coordenadas: </span>
                              <span className="font-mono text-xs">
                                {record.metadata.latitude.toFixed(6)}, {record.metadata.longitude.toFixed(6)}
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Data: </span>
                            <span>{new Date(record.approvedAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>

                        {/* Botão Ver Protocolo */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => actions.handleViewProtocol(record)}
                        >
                          <FileText className="h-3 w-3 mr-2" />
                          Ver Detalhes Completos
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      {records.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Exibindo {records.length} de {stats.total} denúncias
        </div>
      )}
    </div>
  );
}
