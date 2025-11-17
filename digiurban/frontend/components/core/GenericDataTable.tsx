'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Search, Eye, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GenericDataTableProps {
  protocols: any[];
  service: any;
  onViewDetails: (protocol: any) => void;
  onExport?: () => void;
}

export function GenericDataTable({
  protocols,
  service,
  onViewDetails,
  onExport
}: GenericDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Extrair colunas dinamicamente do formSchema
  const columns = useMemo(() => {
    if (!service?.formSchema?.properties) return [];

    const cols: any[] = [];

    // Adicionar coluna de protocolo
    cols.push({
      key: 'protocolNumber',
      label: 'Protocolo',
      type: 'string',
      fixed: true
    });

    // Adicionar colunas do formSchema (primeiras 5)
    const schemaProps = Object.entries(service.formSchema.properties).slice(0, 5);
    schemaProps.forEach(([key, prop]: [string, any]) => {
      if (prop.showInList !== false) {
        cols.push({
          key,
          label: prop.title || key,
          type: prop.type,
          format: prop.format,
          enum: prop.enum,
          enumNames: prop.enumNames
        });
      }
    });

    // Adicionar colunas fixas
    cols.push(
      { key: 'createdAt', label: 'Data', type: 'date', fixed: true },
      { key: 'status', label: 'Status', type: 'status', fixed: true }
    );

    return cols;
  }, [service]);

  // Formatar valor baseado no tipo
  const formatValue = (value: any, column: any): string => {
    if (value === null || value === undefined) return '—';

    switch (column.type) {
      case 'boolean':
        return value ? 'Sim' : 'Não';

      case 'date':
        try {
          return format(new Date(value), 'dd/MM/yyyy', { locale: ptBR });
        } catch {
          return String(value);
        }

      case 'number':
      case 'integer':
        return new Intl.NumberFormat('pt-BR').format(value);

      case 'string':
        if (column.format === 'date' || column.format === 'date-time') {
          try {
            return format(
              new Date(value),
              column.format === 'date-time' ? "dd/MM/yyyy HH:mm" : 'dd/MM/yyyy',
              { locale: ptBR }
            );
          } catch {
            return String(value);
          }
        }
        if (column.format === 'email' || column.format === 'tel') {
          return String(value);
        }
        // Truncar strings longas
        const str = String(value);
        return str.length > 50 ? str.substring(0, 47) + '...' : str;

      default:
        if (column.enum && column.enumNames) {
          const index = column.enum.indexOf(value);
          return column.enumNames[index] || String(value);
        }
        return String(value);
    }
  };

  // Filtrar e buscar
  const filteredData = useMemo(() => {
    let filtered = protocols;

    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    // Busca por texto
    if (searchTerm) {
      filtered = filtered.filter((protocol) => {
        const searchLower = searchTerm.toLowerCase();

        // Buscar no número do protocolo
        if (protocol.number?.toLowerCase().includes(searchLower)) return true;
        if (protocol.protocolNumber?.toLowerCase().includes(searchLower)) return true;

        // Buscar em todos os campos do customData
        if (protocol.customData) {
          const dataStr = JSON.stringify(protocol.customData).toLowerCase();
          if (dataStr.includes(searchLower)) return true;
        }

        return false;
      });
    }

    return filtered;
  }, [protocols, statusFilter, searchTerm]);

  // Paginação
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Status badge
  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      VINCULADO: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
      PROGRESSO: { label: 'Em Análise', className: 'bg-blue-100 text-blue-800' },
      CONCLUIDO: { label: 'Concluído', className: 'bg-green-100 text-green-800' },
      CANCELADO: { label: 'Cancelado', className: 'bg-gray-100 text-gray-800' },
      PENDENCIA: { label: 'Pendência', className: 'bg-red-100 text-red-800' }
    };

    const info = config[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

    return (
      <Badge variant="outline" className={info.className}>
        {info.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Dados Coletados</CardTitle>
            <CardDescription>
              {filteredData.length} registro(s) encontrado(s)
            </CardDescription>
          </div>
          {onExport && (
            <Button variant="outline" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar em todos os campos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="VINCULADO">Pendentes</SelectItem>
              <SelectItem value="PROGRESSO">Em Análise</SelectItem>
              <SelectItem value="CONCLUIDO">Concluídos</SelectItem>
              <SelectItem value="CANCELADO">Cancelados</SelectItem>
              <SelectItem value="PENDENCIA">Com Pendência</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {columns.map((col) => (
                  <TableHead key={col.key} className="font-medium">
                    {col.label}
                  </TableHead>
                ))}
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="text-center py-12 text-muted-foreground">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((protocol) => (
                  <TableRow key={protocol.id} className="hover:bg-muted/50">
                    {columns.map((col) => (
                      <TableCell key={col.key}>
                        {col.type === 'status' ? (
                          getStatusBadge(protocol[col.key])
                        ) : col.key === 'protocolNumber' ? (
                          <span className="font-mono text-xs">
                            {protocol.number || protocol.protocolNumber}
                          </span>
                        ) : col.fixed ? (
                          formatValue(protocol[col.key], col)
                        ) : (
                          formatValue(protocol.customData?.[col.key], col)
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewDetails(protocol)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
