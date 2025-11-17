'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/admin/DataTable';
import {
  Plus,
  Search,
  Table as TableIcon,
  FileText,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface CustomDataTable {
  id: string;
  tableName: string;
  displayName: string;
  moduleType: string;
  schema: any;
  createdAt: string;
  updatedAt: string;
  _count?: {
    records: number;
  };
}

export default function CustomModulesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data: tables, isLoading, refetch } = useQuery({
    queryKey: ['custom-tables'],
    queryFn: async () => {
      const res = await fetch('/api/custom-modules/tables');
      if (!res.ok) throw new Error('Erro ao carregar módulos');
      return res.json() as Promise<CustomDataTable[]>;
    }
  });

  const filteredTables = tables?.filter((table) =>
    table.displayName.toLowerCase().includes(search.toLowerCase()) ||
    table.tableName.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (tableId: string) => {
    if (!confirm('Tem certeza que deseja excluir este módulo? Todos os dados serão perdidos.')) {
      return;
    }

    try {
      const res = await fetch(`/api/custom-modules/tables/${tableId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Erro ao excluir módulo');

      toast.success('Módulo excluído com sucesso');
      refetch();
    } catch (error) {
      toast.error('Erro ao excluir módulo');
      console.error(error);
    }
  };

  const columns = [
    {
      header: 'Nome',
      accessor: (row: CustomDataTable) => (
        <div>
          <div className="font-medium">{row.displayName}</div>
          <div className="text-xs text-muted-foreground font-mono">{row.tableName}</div>
        </div>
      ),
    },
    {
      header: 'Tipo de Módulo',
      accessor: (row: CustomDataTable) => (
        <Badge variant="outline">{row.moduleType}</Badge>
      ),
    },
    {
      header: 'Campos',
      accessor: (row: CustomDataTable) => {
        const fieldCount = Object.keys(row.schema.fields || {}).length;
        return (
          <Badge variant="secondary">
            <FileText className="h-3 w-3 mr-1" />
            {fieldCount} campos
          </Badge>
        );
      },
    },
    {
      header: 'Registros',
      accessor: (row: CustomDataTable) => (
        <Badge variant="default">
          {row._count?.records || 0}
        </Badge>
      ),
    },
    {
      header: 'Criado em',
      accessor: (row: CustomDataTable) =>
        new Date(row.createdAt).toLocaleDateString('pt-BR'),
    },
    {
      header: 'Ações',
      accessor: (row: CustomDataTable) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/admin/modulos-customizados/${row.id}/registros`)}>
              <Eye className="h-4 w-4 mr-2" />
              Ver Registros
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/admin/modulos-customizados/${row.id}`)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(row.id)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Módulos Customizados</h1>
          <p className="text-muted-foreground">
            Crie e gerencie módulos de dados personalizados
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/modulos-customizados/novo">
            <Plus className="h-4 w-4 mr-2" />
            Novo Módulo
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Módulos</CardTitle>
            <TableIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tables?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tables?.reduce((acc, table) => acc + (table._count?.records || 0), 0) || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campos Customizados</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tables?.reduce((acc, table) => acc + Object.keys(table.schema.fields || {}).length, 0) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Módulos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nome do módulo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Módulos Criados</CardTitle>
          <CardDescription>
            Gerencie seus módulos customizados e visualize seus dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredTables || []}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="Nenhum módulo customizado criado ainda"
          />
        </CardContent>
      </Card>
    </div>
  );
}
