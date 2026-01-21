'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Bot,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  Copy,
  BarChart3,
  Eye,
} from 'lucide-react';

interface FlowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  isActive: boolean;
  isDefault: boolean;
  nodes: any[];
  metadata?: {
    icon?: string;
    color?: string;
    category?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface FlowStats {
  totalFlows: number;
  activeFlows: number;
  totalExecutions: number;
  activeExecutions: number;
  completedToday: number;
}

export default function BotFlowsPage() {
  const router = useRouter();
  const [flows, setFlows] = useState<FlowDefinition[]>([]);
  const [stats, setStats] = useState<FlowStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<FlowDefinition | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [newFlowName, setNewFlowName] = useState('');

  useEffect(() => {
    loadFlows();
    loadStats();
  }, []);

  const loadFlows = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/flows', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar fluxos');
      }

      const data = await response.json();
      setFlows(data.flows || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao carregar fluxos:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/flows/stats', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  const toggleFlowStatus = async (flowId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/flows/${flowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar status');
      }

      await loadFlows();
      await loadStats();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDuplicate = async () => {
    if (!selectedFlow || !newFlowName.trim()) return;

    try {
      const response = await fetch(`/api/admin/flows/${selectedFlow.id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newFlowName }),
      });

      if (!response.ok) {
        throw new Error('Erro ao duplicar fluxo');
      }

      setDuplicateDialogOpen(false);
      setNewFlowName('');
      setSelectedFlow(null);
      await loadFlows();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedFlow) return;

    try {
      const response = await fetch(`/api/admin/flows/${selectedFlow.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao deletar fluxo');
      }

      setDeleteDialogOpen(false);
      setSelectedFlow(null);
      await loadFlows();
      await loadStats();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filteredFlows = flows.filter((flow) => {
    const matchesSearch =
      flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flow.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterActive === null || flow.isActive === filterActive;

    return matchesSearch && matchesFilter;
  });

  if (loading && flows.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Bot className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Fluxos do Bot</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              loadFlows();
              loadStats();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => router.push('/admin/bot-flows/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Fluxo
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Fluxos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFlows}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Fluxos Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeFlows}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Execuções Totais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalExecutions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Em Andamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.activeExecutions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Concluídas Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.completedToday}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center flex-wrap">
            <Input
              placeholder="Buscar fluxos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
            <div className="flex gap-2">
              <Button
                variant={filterActive === null ? 'default' : 'outline'}
                onClick={() => setFilterActive(null)}
                size="sm"
              >
                Todos
              </Button>
              <Button
                variant={filterActive === true ? 'default' : 'outline'}
                onClick={() => setFilterActive(true)}
                size="sm"
              >
                Ativos
              </Button>
              <Button
                variant={filterActive === false ? 'default' : 'outline'}
                onClick={() => setFilterActive(false)}
                size="sm"
              >
                Inativos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flows Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-center">Versão</TableHead>
              <TableHead className="text-center">Nodos</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Padrão</TableHead>
              <TableHead className="text-center">Atualização</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFlows.map((flow) => (
              <TableRow key={flow.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{flow.metadata?.icon || '📋'}</span>
                    <span className={flow.isDefault ? 'font-semibold' : ''}>{flow.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{flow.description}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">{flow.version}</Badge>
                </TableCell>
                <TableCell className="text-center">{flow.nodes?.length || 0}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Switch
                      checked={flow.isActive}
                      onCheckedChange={(checked) => toggleFlowStatus(flow.id, checked)}
                    />
                    <span className="text-sm">{flow.isActive ? 'Ativo' : 'Inativo'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {flow.isDefault && <Badge>Padrão</Badge>}
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">
                  {new Date(flow.updatedAt).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/admin/bot-flows/${flow.id}`)}
                      title="Visualizar"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/admin/bot-flows/${flow.id}/edit`)}
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedFlow(flow);
                        setNewFlowName(`${flow.name}_copia`);
                        setDuplicateDialogOpen(true);
                      }}
                      title="Duplicar"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/admin/bot-flows/${flow.id}/analytics`)}
                      title="Analytics"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedFlow(flow);
                        setDeleteDialogOpen(true);
                      }}
                      disabled={flow.isDefault}
                      title="Deletar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredFlows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhum fluxo encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o fluxo <strong>{selectedFlow?.name}</strong>?
              Esta ação não pode ser desfeita. Fluxos com execuções ativas não podem ser deletados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicar Fluxo</DialogTitle>
            <DialogDescription>
              Digite o nome para a cópia do fluxo <strong>{selectedFlow?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="flowName">Nome do novo fluxo</Label>
              <Input
                id="flowName"
                value={newFlowName}
                onChange={(e) => setNewFlowName(e.target.value)}
                placeholder="Digite o nome..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDuplicate} disabled={!newFlowName.trim()}>
              Duplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
