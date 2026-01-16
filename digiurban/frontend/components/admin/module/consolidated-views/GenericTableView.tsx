'use client';

/**
 * MODO: GENÉRICO
 * Visualização em tabela pesquisável para qualquer tipo de dado (fallback)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Download, Table as TableIcon, Database } from 'lucide-react';
import type { ConsolidatedModeConfig, ConsolidatedRecord } from '@/lib/consolidated-data-intelligence';

interface GenericTableViewProps {
  config: ConsolidatedModeConfig;
  data: any;
}

export function GenericTableView({ config, data }: GenericTableViewProps) {
  const { records, stats, searchTerm, setSearchTerm, actions } = data;

  // Usar campos disponíveis no schema
  const displayFields = [config.keyField, ...config.secondaryFields].slice(0, 5);

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Registros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Database className="h-4 w-4" />
              <span>Dados consolidados</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Campos Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{displayFields.length}</div>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <TableIcon className="h-4 w-4" />
              <span>Colunas visíveis</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={actions.handleExport}
              size="sm"
              variant="outline"
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Dados
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar em todos os campos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Dados */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TableIcon className="h-5 w-5" />
            <CardTitle>Dados Registrados</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {records.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum registro encontrado</p>
              <p className="text-sm">Ajuste os filtros de busca ou aguarde novos registros</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left font-medium text-sm">Protocolo</th>
                    <th className="p-3 text-left font-medium text-sm">Cidadão</th>
                    {displayFields.map(field => (
                      <th key={field} className="p-3 text-left font-medium text-sm capitalize">
                        {field.replace(/_/g, ' ')}
                      </th>
                    ))}
                    <th className="p-3 text-left font-medium text-sm">Data Aprovação</th>
                    <th className="p-3 text-left font-medium text-sm">Status</th>
                    <th className="p-3 text-left font-medium text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record: ConsolidatedRecord) => (
                    <tr key={record.id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-sm font-mono">{record.protocolNumber}</td>
                      <td className="p-3 text-sm font-medium">{record.citizenName}</td>
                      {displayFields.map(field => {
                        const value = record.data[field];
                        return (
                          <td key={field} className="p-3 text-sm">
                            {value ? (
                              typeof value === 'boolean' ? (
                                <Badge variant={value ? 'default' : 'secondary'}>
                                  {value ? 'Sim' : 'Não'}
                                </Badge>
                              ) : typeof value === 'object' ? (
                                JSON.stringify(value)
                              ) : (
                                String(value)
                              )
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-3 text-sm text-muted-foreground">
                        {new Date(record.approvedAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-3">
                        <Badge variant={record.status === 'ATIVO' ? 'default' : 'secondary'}>
                          {record.status}
                        </Badge>
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
          Exibindo {records.length} de {stats.total} registros
        </div>
      )}
    </div>
  );
}
