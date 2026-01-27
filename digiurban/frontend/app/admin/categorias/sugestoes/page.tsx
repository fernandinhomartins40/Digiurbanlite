'use client';

import { useState } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useCategorySuggestions } from '@/hooks/useCategorySuggestions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Filter,
  RefreshCw,
  Sparkles,
  BarChart3,
  Clock,
  CheckCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

// ============================================================================
// PÁGINA: Dashboard de Sugestões de Categorização
// ============================================================================

export default function CategorySuggestionsPage() {
  const { user } = useAdminAuth();

  // ========================================================================
  // FILTROS
  // ========================================================================
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [confidenceFilter, setConfidenceFilter] = useState<number | undefined>(undefined);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);

  // ========================================================================
  // HOOK: Buscar sugestões
  // ========================================================================
  const {
    suggestions,
    loading,
    error,
    stats,
    refetch,
    approveSuggestion,
    rejectSuggestion,
    approveMultiple,
  } = useCategorySuggestions({
    departmentCode: departmentFilter || undefined,
    minConfidence: confidenceFilter,
    autoRefresh: true, // Auto-refresh a cada 30s
    refreshInterval: 30000,
  });

  // ========================================================================
  // HANDLERS
  // ========================================================================
  const handleApprove = async (id: string) => {
    try {
      await approveSuggestion(id);
      // Remover da seleção se estava selecionado
      setSelectedSuggestions((prev) => prev.filter((s) => s !== id));
    } catch (error) {
      console.error('Erro ao aprovar:', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectSuggestion(id, 'Categorização não adequada');
      // Remover da seleção se estava selecionado
      setSelectedSuggestions((prev) => prev.filter((s) => s !== id));
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
    }
  };

  const handleApproveMultiple = async () => {
    if (selectedSuggestions.length === 0) {
      toast.error('Selecione ao menos uma sugestão');
      return;
    }

    try {
      await approveMultiple(selectedSuggestions);
      setSelectedSuggestions([]);
    } catch (error) {
      console.error('Erro ao aprovar múltiplas:', error);
    }
  };

  const handleToggleSelection = (id: string) => {
    setSelectedSuggestions((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedSuggestions.length === suggestions.length) {
      setSelectedSuggestions([]);
    } else {
      setSelectedSuggestions(suggestions.map((s) => s.id));
    }
  };

  // ========================================================================
  // HELPERS
  // ========================================================================
  const getMatchTypeLabel = (matchType: string) => {
    const labels: Record<string, string> = {
      EXACT: 'Exato',
      PATTERN: 'Padrão',
      SEMANTIC: 'Semântico',
      MANUAL: 'Manual',
    };
    return labels[matchType] || matchType;
  };

  const getMatchTypeBadge = (matchType: string) => {
    const classes: Record<string, string> = {
      EXACT: 'bg-green-100 text-green-800',
      PATTERN: 'bg-blue-100 text-blue-800',
      SEMANTIC: 'bg-purple-100 text-purple-800',
      MANUAL: 'bg-gray-100 text-gray-800',
    };
    return classes[matchType] || 'bg-gray-100 text-gray-800';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 85) return 'bg-green-100 text-green-800';
    if (confidence >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-orange-100 text-orange-800';
  };

  // ========================================================================
  // RENDER
  // ========================================================================
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ================================================================== */}
      {/* HEADER */}
      {/* ================================================================== */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sugestões de Categorização</h1>
          <p className="text-muted-foreground">
            Aprovação de vínculos automáticos entre serviços e categorias cidadãs
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          {selectedSuggestions.length > 0 && (
            <Button size="sm" onClick={handleApproveMultiple}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Aprovar {selectedSuggestions.length} selecionadas
            </Button>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* CARDS DE ESTATÍSTICAS */}
      {/* ================================================================== */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">Vínculos confirmados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Auto-atribuídas</CardTitle>
              <Sparkles className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.autoAssigned}</div>
              <p className="text-xs text-muted-foreground">Alta confiança (&gt;85%)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejected}</div>
              <p className="text-xs text-muted-foreground">Descartadas</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ================================================================== */}
      {/* FILTROS */}
      {/* ================================================================== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Departamento</label>
              <Input
                placeholder="Ex: AGRICULTURA"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Confiança Mínima</label>
              <Select
                value={confidenceFilter?.toString() || 'all'}
                onValueChange={(value) =>
                  setConfidenceFilter(value === 'all' ? undefined : parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="85">Alta (&gt;= 85%)</SelectItem>
                  <SelectItem value="70">Média (&gt;= 70%)</SelectItem>
                  <SelectItem value="60">Baixa (&gt;= 60%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setDepartmentFilter('');
                  setConfidenceFilter(undefined);
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* TABELA DE SUGESTÕES */}
      {/* ================================================================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Sugestões Pendentes ({suggestions.length})</span>
            {suggestions.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                {selectedSuggestions.length === suggestions.length
                  ? 'Desmarcar Todas'
                  : 'Selecionar Todas'}
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            Sugestões inteligentes de categorização aguardando aprovação manual
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Carregando...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          ) : suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Todas as sugestões foram processadas!</h3>
              <p className="text-muted-foreground">
                Não há sugestões pendentes de aprovação no momento.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={
                          suggestions.length > 0 && selectedSuggestions.length === suggestions.length
                        }
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Categoria Sugerida</TableHead>
                    <TableHead>Tipo de Match</TableHead>
                    <TableHead>Confiança</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suggestions.map((suggestion) => (
                    <TableRow key={suggestion.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedSuggestions.includes(suggestion.id)}
                          onChange={() => handleToggleSelection(suggestion.id)}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{suggestion.service.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {suggestion.service.moduleType}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {suggestion.category.icon && (
                            <span className="text-xl">{suggestion.category.icon}</span>
                          )}
                          <div>
                            <div className="font-medium">{suggestion.category.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {suggestion.category.code}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getMatchTypeBadge(suggestion.matchType)}>
                          {getMatchTypeLabel(suggestion.matchType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getConfidenceBadge(suggestion.confidence)}>
                          {suggestion.confidence}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{suggestion.service.departmentCode}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(suggestion.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleApprove(suggestion.id)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleReject(suggestion.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* ESTATÍSTICAS POR DEPARTAMENTO */}
      {/* ================================================================== */}
      {stats && stats.byDepartment && stats.byDepartment.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Estatísticas por Departamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.byDepartment.map((dept: any) => (
                <div key={dept.departmentCode} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{dept.departmentCode}</span>
                      <span className="text-sm text-muted-foreground">
                        {dept.pending} pendentes de {dept.total} total
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(dept.pending / dept.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
