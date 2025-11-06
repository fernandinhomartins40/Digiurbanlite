'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Eye } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

interface CustomDataTable {
  id: string;
  tableName: string;
  displayName: string;
  moduleType: string;
  schema: {
    fields: Record<string, any>;
  };
  createdAt: string;
  updatedAt: string;
  _count?: {
    records: number;
  };
}

export default function EditCustomModulePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const tableId = params.tableId as string;

  const [displayName, setDisplayName] = useState('');

  const { data: table, isLoading } = useQuery({
    queryKey: ['custom-table', tableId],
    queryFn: async () => {
      const res = await fetch(`/api/custom-modules/tables/${tableId}`);
      if (!res.ok) throw new Error('Erro ao carregar módulo');
      const data = await res.json();
      setDisplayName(data.displayName);
      return data as CustomDataTable;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/custom-modules/tables/${tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao atualizar módulo');
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success('Módulo atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['custom-table', tableId] });
      queryClient.invalidateQueries({ queryKey: ['custom-tables'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!table) {
    return <div>Módulo não encontrado</div>;
  }

  const fields = Object.entries(table.schema.fields || {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/modulos-customizados">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Módulo</h1>
          <p className="text-muted-foreground">{table.tableName}</p>
        </div>
        <Button asChild>
          <Link href={`/admin/modulos-customizados/${tableId}/registros`}>
            <Eye className="h-4 w-4 mr-2" />
            Ver Registros
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Edite as informações do módulo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tableName">Nome da Tabela</Label>
                <Input
                  id="tableName"
                  value={table.tableName}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  O nome da tabela não pode ser alterado
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Nome de Exibição</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ex: Cadastro de Fornecedores"
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Módulo</Label>
                <Badge>{table.moduleType}</Badge>
                <p className="text-xs text-muted-foreground">
                  O tipo de módulo não pode ser alterado
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => updateMutation.mutate()}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin/modulos-customizados">Cancelar</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Fields */}
          <Card>
            <CardHeader>
              <CardTitle>Campos do Módulo</CardTitle>
              <CardDescription>
                Estrutura de dados do módulo (somente leitura)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum campo definido</p>
              ) : (
                <div className="space-y-3">
                  {fields.map(([fieldName, fieldConfig]: [string, any]) => (
                    <div key={fieldName} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{fieldConfig.label}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {fieldConfig.type}
                          </Badge>
                          {fieldConfig.required && (
                            <Badge variant="secondary" className="text-xs">
                              Obrigatório
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{fieldName}</p>
                      {fieldConfig.options && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {fieldConfig.options.map((option: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {option}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Criado em</Label>
                <p className="text-sm">{new Date(table.createdAt).toLocaleString('pt-BR')}</p>
              </div>
              <Separator />
              <div>
                <Label>Última atualização</Label>
                <p className="text-sm">{new Date(table.updatedAt).toLocaleString('pt-BR')}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total de Campos</span>
                <Badge variant="secondary">{fields.length}</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Registros</span>
                <Badge variant="default">{table._count?.records || 0}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
