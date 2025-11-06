'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ModuleField, ModuleRecord } from '@/lib/module-configs';
import { Edit, Trash2, Eye, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface ModuleDataTableProps {
  fields: ModuleField[];
  data: ModuleRecord[];
  loading?: boolean;
  onEdit?: (record: ModuleRecord) => void;
  onDelete?: (record: ModuleRecord) => void;
  onView?: (record: ModuleRecord) => void;
  pagination?: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
  onPageChange?: (page: number) => void;
}

export function ModuleDataTable({
  fields,
  data,
  loading,
  onEdit,
  onDelete,
  onView,
  pagination,
  onPageChange,
}: ModuleDataTableProps) {
  const router = useRouter();
  const listFields = fields.filter((f) => f.showInList);

  const formatFieldValue = (value: any, field: ModuleField): React.ReactNode => {
    if (value === null || value === undefined) return '-';

    switch (field.type) {
      case 'date':
        try {
          return format(new Date(value), 'dd/MM/yyyy', { locale: ptBR });
        } catch {
          return value;
        }

      case 'datetime':
        try {
          return format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: ptBR });
        } catch {
          return value;
        }

      case 'boolean':
        return value ? (
          <Badge variant="default">Sim</Badge>
        ) : (
          <Badge variant="secondary">Não</Badge>
        );

      case 'select':
        const option = field.options?.find((opt) => opt.value === value);
        return option ? option.label : value;

      case 'number':
        return typeof value === 'number' ? value.toLocaleString('pt-BR') : value;

      case 'json':
        return Array.isArray(value) ? `${value.length} itens` : 'Objeto';

      default:
        return String(value);
    }
  };

  const getSourceBadge = (source?: string) => {
    switch (source) {
      case 'service':
        return <Badge variant="default">Portal</Badge>;
      case 'manual':
        return <Badge variant="secondary">Manual</Badge>;
      case 'import':
        return <Badge variant="outline">Importado</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return <Badge className="bg-green-600">Ativo</Badge>;
      case 'INACTIVE':
        return <Badge variant="secondary">Inativo</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-600">Pendente</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-blue-600">Concluído</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return status ? <Badge variant="outline">{status}</Badge> : null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center p-12 border rounded-lg bg-gray-50">
        <p className="text-gray-600">Nenhum registro encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {listFields.map((field) => (
                <TableHead key={field.name}>{field.label}</TableHead>
              ))}
              {data[0]?.source && <TableHead>Origem</TableHead>}
              {data[0]?.protocol && <TableHead>Protocolo</TableHead>}
              {data[0]?.status && <TableHead>Status</TableHead>}
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((record) => (
              <TableRow key={record.id}>
                {listFields.map((field) => (
                  <TableCell key={field.name}>
                    {formatFieldValue(record[field.name], field)}
                  </TableCell>
                ))}
                {record.source && <TableCell>{getSourceBadge(record.source)}</TableCell>}
                {record.protocol && (
                  <TableCell>
                    <Badge variant="outline">{record.protocol}</Badge>
                  </TableCell>
                )}
                {record.status && <TableCell>{getStatusBadge(record.status)}</TableCell>}
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    {record.protocolId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/protocolos/${record.protocolId}`)}
                        title="Ver protocolo completo (interações, documentos, pendências)"
                      >
                        <FileText className="h-4 w-4 text-blue-600" />
                      </Button>
                    )}
                    {onView && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(record)}
                        title="Ver detalhes do registro"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(record)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(record)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {(pagination.page - 1) * pagination.limit + 1} a{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
            {pagination.total} registros
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                .filter(
                  (page) =>
                    page === 1 ||
                    page === pagination.pages ||
                    Math.abs(page - pagination.page) <= 1
                )
                .map((page, idx, arr) => (
                  <>
                    {idx > 0 && arr[idx - 1] !== page - 1 && (
                      <span key={`ellipsis-${page}`} className="px-2">
                        ...
                      </span>
                    )}
                    <Button
                      key={page}
                      variant={page === pagination.page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onPageChange?.(page)}
                    >
                      {page}
                    </Button>
                  </>
                ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
