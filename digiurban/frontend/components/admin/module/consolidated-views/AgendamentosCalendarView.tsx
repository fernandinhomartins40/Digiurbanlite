'use client';

/**
 * MODO: AGENDAMENTO
 * Visualização em calendário para agendamentos/consultas
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Bell, FileText, Clock, CheckCircle, Users } from 'lucide-react';
import type { ConsolidatedModeConfig, ConsolidatedRecord } from '@/lib/consolidated-data-intelligence';

interface AgendamentosCalendarViewProps {
  config: ConsolidatedModeConfig;
  data: any;
}

export function AgendamentosCalendarView({ config, data }: AgendamentosCalendarViewProps) {
  const { records, stats, statusFilter, setStatusFilter, actions } = data;

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
              Total de Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Confirmados</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aprovados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.aprovados}</div>
            <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Confirmados</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aguardando
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.aguardando}</div>
            <div className="flex items-center gap-2 mt-2 text-sm text-yellow-600">
              <Clock className="h-4 w-4" />
              <span>Pendentes</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Confirmação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.taxaAprovacao}%</div>
            <div className="text-sm text-muted-foreground mt-2">
              Índice de comparecimento
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
                Todos ({stats.total})
              </Button>
              <Button
                variant={statusFilter === 'APROVADO' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('APROVADO')}
              >
                Confirmados ({stats.aprovados})
              </Button>
              <Button
                variant={statusFilter === 'AGUARDANDO' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('AGUARDANDO')}
              >
                Aguardando ({stats.aguardando})
              </Button>
            </div>

            {/* Ações */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={actions.handleExportCalendar}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Exportar Agenda
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => actions.handleSendReminder(records)}
                disabled={records.length === 0}
              >
                <Bell className="h-4 w-4 mr-2" />
                Enviar Lembretes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendário Placeholder */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle>Visualização em Calendário</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-12 text-center">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium text-muted-foreground mb-2">
              Calendário Interativo
            </p>
            <p className="text-sm text-muted-foreground">
              {records.length} agendamentos confirmados
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Agendamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Agendamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum agendamento encontrado</p>
              <p className="text-sm">Ajuste os filtros ou aguarde novos agendamentos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record: ConsolidatedRecord) => (
                <div
                  key={record.id}
                  className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Conteúdo */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{record.citizenName}</h4>
                        <Badge variant={record.status === 'APROVADO' ? 'default' : 'secondary'}>
                          {record.status === 'APROVADO' ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> Confirmado</>
                          ) : (
                            <><Clock className="h-3 w-3 mr-1" /> Aguardando</>
                          )}
                        </Badge>
                      </div>

                      {/* Informações */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Data: </span>
                          <span className="font-medium">
                            {record.data.data ? new Date(record.data.data).toLocaleDateString('pt-BR') : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Horário: </span>
                          <span className="font-medium">{record.data.horario || '—'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tipo: </span>
                          <span className="font-medium">{record.data.tipo || '—'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Protocolo: </span>
                          <span className="font-medium">{record.protocolNumber}</span>
                        </div>
                      </div>

                      {/* Botão Ver Protocolo */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => actions.handleViewProtocol(record)}
                      >
                        <FileText className="h-3 w-3 mr-2" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      {records.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Exibindo {records.length} de {stats.total} agendamentos
        </div>
      )}
    </div>
  );
}
