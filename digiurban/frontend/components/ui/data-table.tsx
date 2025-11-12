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
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface DataTableColumn<T = any> {
  id: string;
  header: string;
  accessorKey?: string;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
}

interface DataTableProps<T = any> {
  data: T[];
  columns: DataTableColumn<T>[];
  title?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
  };
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onFilter?: (column: string, value: string) => void;
  actions?: {
    label: string;
    onClick: (item: T) => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  }[];
  className?: string;
}

export function DataTable<T = any>({
  data,
  columns,
  title,
  searchPlaceholder = "Buscar...",
  loading = false,
  pagination,
  onSort,
  onFilter,
  actions = [],
  className
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (columnId: string) => {
    if (!onSort) return;

    const newDirection = sortColumn === columnId && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(columnId);
    setSortDirection(newDirection);
    onSort(columnId, newDirection);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (onFilter) {
      onFilter('search', value);
    }
  };

  const getCellValue = (item: T, column: DataTableColumn<T>) => {
    if (column.cell) {
      return column.cell(item);
    }
    if (column.accessorKey) {
      return (item as any)[column.accessorKey];
    }
    return '';
  };

  const renderSortIcon = (columnId: string) => {
    if (sortColumn !== columnId) {
      return <span className="text-muted-foreground">↕</span>;
    }
    return sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>;
  };

  if (loading) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-4">
            <div className="h-10 bg-muted animate-pulse rounded"></div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        {/* Search and Filters */}
        <div className="flex items-center justify-between mb-4">
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-sm"
          />

          {pagination && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Itens por página:</span>
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3">
                  {pagination.limit}
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Itens por página</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {[10, 20, 50, 100].map((limit) => (
                    <DropdownMenuItem
                      key={limit}
                      onClick={() => pagination.onLimitChange(limit)}
                    >
                      {limit}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column.id}
                    className={cn(
                      column.sortable && "cursor-pointer select-none hover:bg-muted/50",
                      column.width && `w-[${column.width}]`
                    )}
                    onClick={() => column.sortable && handleSort(column.id)}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{column.header}</span>
                      {column.sortable && renderSortIcon(column.id)}
                    </div>
                  </TableHead>
                ))}
                {actions.length > 0 && (
                  <TableHead className="w-[100px]">Ações</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                    className="h-24 text-center"
                  >
                    Nenhum resultado encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow key={index}>
                    {columns.map((column) => (
                      <TableCell key={column.id}>
                        {getCellValue(item, column)}
                      </TableCell>
                    ))}
                    {actions.length > 0 && (
                      <TableCell>
                        <div className="flex space-x-2">
                          {actions.map((action, actionIndex) => (
                            <Button
                              key={actionIndex}
                              variant={action.variant || 'outline'}
                              size="sm"
                              onClick={() => action.onClick(item)}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {(pagination.page - 1) * pagination.limit + 1} a{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
              {pagination.total} resultados
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                Anterior
              </Button>
              <span className="text-sm">
                Página {pagination.page} de {Math.ceil(pagination.total / pagination.limit)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
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

// Types are already exported above