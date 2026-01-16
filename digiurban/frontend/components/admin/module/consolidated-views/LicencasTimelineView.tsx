'use client';

/**
 * MODO: LICENÇA
 * Visualização em timeline para licenças/alvarás com controle de validade
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Bell, RefreshCw, FileText, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { ConsolidatedModeConfig, ConsolidatedRecord } from '@/lib/consolidated-data-intelligence';

interface LicencasTimelineViewProps {
  config: ConsolidatedModeConfig;
  data: any;
}

export function LicencasTimelineView({ config, data }: LicencasTimelineViewProps) {
  const { records, stats, statusFilter, setStatusFilter, actions } = data;

  // Calcular estatísticas de vencimento
  const now = new Date();
  const vencendo = records.filter((r: ConsolidatedRecord) => {
    if (!r.metadata?.expiryDate) return false;
    const daysToExpiry = Math.ceil((r.metadata.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysToExpiry > 0 && daysToExpiry <= 30;
  }).length;

  const getExpiryStatus = (record: ConsolidatedRecord) => {
    if (!record.metadata?.expiryDate) return { status: 'sem_data', color: 'gray', label: 'Sem data', icon: Calendar };

    const daysToExpiry = Math.ceil((record.metadata.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysToExpiry < 0) {
      return { status: 'vencida', color: 'red', label: `Vencida há ${Math.abs(daysToExpiry)} dias`, icon: XCircle };
    } else if (daysToExpiry <= 30) {
      return { status: 'vencendo', color: 'yellow', label: `Vence em ${daysToExpiry} dias`, icon: AlertTriangle };
    } else {
      return { status: 'ativa', color: 'green', label: `Válida por ${daysToExpiry} dias`, icon: CheckCircle };
    }
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
              Total de Licenças
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Registradas</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.ativos}</div>
            <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Dentro da validade</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vencendo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{vencendo}</div>
            <div className="flex items-center gap-2 mt-2 text-sm text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <span>Próximas 30 dias</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vencidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.vencidos}</div>
            <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
              <XCircle className="h-4 w-4" />
              <span>Requerem renovação</span>
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
                <CheckCircle className="h-4 w-4 mr-2" />
                Ativas ({stats.ativos})
              </Button>
              <Button
                variant={statusFilter === 'VENCENDO' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('VENCENDO')}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Vencendo ({vencendo})
              </Button>
              <Button
                variant={statusFilter === 'VENCIDO' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('VENCIDO')}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Vencidas ({stats.vencidos})
              </Button>
            </div>

            {/* Ações */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => actions.handleSendExpiryNotification(records.filter((r: ConsolidatedRecord) => getExpiryStatus(r).status === 'vencendo'))}
                disabled={vencendo === 0}
              >
                <Bell className="h-4 w-4 mr-2" />
                Notificar Vencimento ({vencendo})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline de Licenças */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline de Validade</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhuma licença encontrada</p>
              <p className="text-sm">Ajuste os filtros ou aguarde novas licenças</p>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record: ConsolidatedRecord) => {
                const expiryInfo = getExpiryStatus(record);
                const ExpiryIcon = expiryInfo.icon;

                return (
                  <div
                    key={record.id}
                    className="border-l-4 pl-4 py-3 hover:bg-muted/30 transition-colors rounded-r-lg"
                    style={{
                      borderLeftColor:
                        expiryInfo.color === 'red' ? '#ef4444' :
                        expiryInfo.color === 'yellow' ? '#eab308' :
                        expiryInfo.color === 'green' ? '#22c55e' : '#6b7280'
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Conteúdo */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <ExpiryIcon className={`h-5 w-5 text-${expiryInfo.color}-600`} />
                          <div>
                            <h4 className="font-semibold">
                              {record.data[config.keyField] || `Licença ${record.protocolNumber}`}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Titular: {record.citizenName}
                            </p>
                          </div>
                        </div>

                        {/* Informações */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Protocolo: </span>
                            <span className="font-medium">{record.protocolNumber}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Emissão: </span>
                            <span className="font-medium">
                              {new Date(record.approvedAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          {record.metadata?.expiryDate && (
                            <div>
                              <span className="text-muted-foreground">Validade: </span>
                              <span className="font-medium">
                                {new Date(record.metadata.expiryDate).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          )}
                          <div>
                            <Badge variant={expiryInfo.color === 'green' ? 'default' : 'destructive'}>
                              {expiryInfo.label}
                            </Badge>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => actions.handleViewProtocol(record)}
                          >
                            <FileText className="h-3 w-3 mr-2" />
                            Ver Detalhes
                          </Button>
                          {expiryInfo.status === 'vencida' || expiryInfo.status === 'vencendo' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => actions.handleRenewLicense(record)}
                            >
                              <RefreshCw className="h-3 w-3 mr-2" />
                              Renovar
                            </Button>
                          ) : null}
                        </div>
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
          Exibindo {records.length} de {stats.total} licenças
        </div>
      )}
    </div>
  );
}
