'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/admin/DataTable';
import { ProtocolBadge } from '@/components/admin/ProtocolBadge';
import { ArrowLeft, Plus, Download, Loader2, Trash2, Search } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

interface CustomDataTable {
  id: string;
  tableName: string;
  displayName: string;
  schema: {
    fields: Record<string, any>;
  };
}

interface CustomDataRecord {
  id: string;
  protocol?: string;
  serviceId?: string;
  data: Record<string, any>;
  createdAt: string;
}

export default function CustomModuleRecordsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const tableId = params.tableId as string;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const { data: table } = useQuery({
    queryKey: ['custom-table', tableId],
    queryFn: async () => {
      const res = await fetch(`/api/custom-modules/tables/${tableId}`);
      if (!res.ok) throw new Error('Erro ao carregar módulo');
      return res.json() as Promise<CustomDataTable>;
    },
  });

  const { data: recordsData, isLoading } = useQuery({
    queryKey: ['custom-records', tableId, page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
      });

      const res = await fetch(`/api/custom-modules/tables/${tableId}/records?${params.toString()}`);
      if (!res.ok) throw new Error('Erro ao carregar registros');
      return res.json();
    },
    enabled: !!table,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/custom-modules/tables/${tableId}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao criar registro');
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success('Registro criado com sucesso!');
      setAddDialogOpen(false);
      setFormData({});
      queryClient.invalidateQueries({ queryKey: ['custom-records', tableId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const res = await fetch(`/api/custom-modules/tables/${tableId}/records/${recordId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Erro ao excluir registro');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Registro excluído com sucesso');
      queryClient.invalidateQueries({ queryKey: ['custom-records', tableId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/custom-modules/tables/${tableId}/records/export`);
      if (!res.ok) throw new Error('Erro ao exportar dados');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${table?.tableName}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Dados exportados com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar dados');
      console.error(error);
    }
  };

  const handleDelete = (recordId: string) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      deleteMutation.mutate(recordId);
    }
  };

  const handleSubmit = () => {
    if (!table) return;

    // Validar campos obrigatórios
    const requiredFields = Object.entries(table.schema.fields)
      .filter(([_, config]: [string, any]) => config.required)
      .map(([name]) => name);

    const missingFields = requiredFields.filter((field) => !formData[field]);

    if (missingFields.length > 0) {
      toast.error(`Preencha os campos obrigatórios: ${missingFields.join(', ')}`);
      return;
    }

    createMutation.mutate(formData);
  };

  if (!table) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const fields = Object.entries(table.schema.fields);

  const columns = [
    {
      header: 'ID',
      accessor: (row: CustomDataRecord) => (
        <span className="font-mono text-xs">{row.id.slice(0, 8)}</span>
      ),
    },
    ...fields.slice(0, 3).map(([fieldName, fieldConfig]: [string, any]) => ({
      header: fieldConfig.label,
      accessor: (row: CustomDataRecord) => {
        const value = row.data[fieldName];
        if (value === undefined || value === null) return '-';
        if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
        if (fieldConfig.type === 'date') {
          return new Date(value).toLocaleDateString('pt-BR');
        }
        return String(value);
      },
    })),
    {
      header: 'Protocolo',
      accessor: (row: CustomDataRecord) =>
        row.protocol ? <ProtocolBadge protocol={row.protocol} /> : '-',
    },
    {
      header: 'Criado em',
      accessor: (row: CustomDataRecord) =>
        new Date(row.createdAt).toLocaleDateString('pt-BR'),
    },
    {
      header: 'Ações',
      accessor: (row: CustomDataRecord) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDelete(row.id)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/admin/modulos-customizados/${tableId}`}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{table.displayName}</h1>
          <p className="text-muted-foreground">Gerencie os registros deste módulo</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Registro
          </Button>
        </div>
      </div>

      {/* Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de Registros</p>
              <p className="text-2xl font-bold">{recordsData?.total || 0}</p>
            </div>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar registros..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registros</CardTitle>
          <CardDescription>Lista de todos os registros cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={recordsData?.records || []}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="Nenhum registro encontrado"
            pagination={{
              page,
              limit: 20,
              total: recordsData?.total || 0,
              onPageChange: setPage,
            }}
          />
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Registro</DialogTitle>
            <DialogDescription>Preencha os dados do novo registro</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {fields.map(([fieldName, fieldConfig]: [string, any]) => (
              <div key={fieldName} className="space-y-2">
                <Label htmlFor={fieldName}>
                  {fieldConfig.label}
                  {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {fieldConfig.type === 'textarea' ? (
                  <Textarea
                    id={fieldName}
                    value={formData[fieldName] || ''}
                    onChange={(e) => setFormData({ ...formData, [fieldName]: e.target.value })}
                    rows={3}
                  />
                ) : fieldConfig.type === 'select' ? (
                  <Select
                    value={formData[fieldName] || ''}
                    onValueChange={(value) => setFormData({ ...formData, [fieldName]: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldConfig.options?.map((option: string) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : fieldConfig.type === 'boolean' ? (
                  <Select
                    value={formData[fieldName]?.toString() || 'false'}
                    onValueChange={(value) =>
                      setFormData({ ...formData, [fieldName]: value === 'true' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={fieldName}
                    type={fieldConfig.type}
                    value={formData[fieldName] || ''}
                    onChange={(e) => setFormData({ ...formData, [fieldName]: e.target.value })}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Registro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
