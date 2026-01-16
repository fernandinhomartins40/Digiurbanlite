'use client';

/**
 * MODO: INSCRIÇÕES
 * Visualização em tabela com status para inscrições em cursos/eventos
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FileText, Mail, Award, CheckCircle, Clock, Users } from 'lucide-react';
import type { ConsolidatedModeConfig, ConsolidatedRecord } from '@/lib/consolidated-data-intelligence';

interface InscricoesViewProps {
  config: ConsolidatedModeConfig;
  data: any;
}

export function InscricoesView({ config, data }: InscricoesViewProps) {
  const { records, stats, statusFilter, setStatusFilter, actions } = data;
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);

  const handleSelectAll = () => {
    if (selectedRecords.length === records.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(records.map((r: ConsolidatedRecord) => r.id));
    }
  };

  const handleSelectRecord = (id: string) => {
    setSelectedRecords(prev =>
      prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
    );
  };

  const getSelectedRecords = () => {
    return records.filter((r: ConsolidatedRecord) => selectedRecords.includes(r.id));
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
              Total de Inscritos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Registrados</span>
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
              <span>{stats.taxaAprovacao}% confirmados</span>
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
              Selecionados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{selectedRecords.length}</div>
            <div className="text-sm text-muted-foreground mt-2">
              Para ações em lote
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
                Aprovados ({stats.aprovados})
              </Button>
              <Button
                variant={statusFilter === 'AGUARDANDO' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('AGUARDANDO')}
              >
                Aguardando ({stats.aguardando})
              </Button>
            </div>

            {/* Ações em Lote */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={actions.handleExportAttendance}
                disabled={records.length === 0}
              >
                <FileText className="h-4 w-4 mr-2" />
                Exportar Lista
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => actions.handleSendBulkEmail(getSelectedRecords())}
                disabled={selectedRecords.length === 0}
              >
                <Mail className="h-4 w-4 mr-2" />
                Enviar Email ({selectedRecords.length})
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => actions.handleGenerateCertificates(getSelectedRecords())}
                disabled={selectedRecords.length === 0}
              >
                <Award className="h-4 w-4 mr-2" />
                Gerar Certificados ({selectedRecords.length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Inscritos */}
      <Card>
        <CardContent className="p-0">
          {records.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhuma inscrição encontrada</p>
              <p className="text-sm">Aguarde novas inscrições para este curso/evento</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left">
                      <Checkbox
                        checked={selectedRecords.length === records.length && records.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="p-3 text-left font-medium">Nome</th>
                    <th className="p-3 text-left font-medium">CPF</th>
                    <th className="p-3 text-left font-medium">Email</th>
                    <th className="p-3 text-left font-medium">Data Inscrição</th>
                    <th className="p-3 text-left font-medium">Status</th>
                    <th className="p-3 text-left font-medium">Protocolo</th>
                    <th className="p-3 text-left font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record: ConsolidatedRecord) => (
                    <tr key={record.id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <Checkbox
                          checked={selectedRecords.includes(record.id)}
                          onCheckedChange={() => handleSelectRecord(record.id)}
                        />
                      </td>
                      <td className="p-3 font-medium">{record.citizenName}</td>
                      <td className="p-3 text-sm">{record.citizenCpf || '—'}</td>
                      <td className="p-3 text-sm">{record.data.email || '—'}</td>
                      <td className="p-3 text-sm">
                        {new Date(record.approvedAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-3">
                        <Badge variant={record.status === 'APROVADO' ? 'default' : 'secondary'}>
                          {record.status === 'APROVADO' ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> Aprovado</>
                          ) : (
                            <><Clock className="h-3 w-3 mr-1" /> Aguardando</>
                          )}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {record.protocolNumber}
                      </td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => actions.handleViewProtocol(record)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      {records.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Exibindo {records.length} inscrições | {selectedRecords.length} selecionados
        </div>
      )}
    </div>
  );
}
