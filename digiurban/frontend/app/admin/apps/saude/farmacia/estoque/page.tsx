'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { listarEstoque, atualizarEstoque } from '@/lib/api/farmacia-api';
import { Package, Search, AlertTriangle, Plus, Edit } from 'lucide-react';

export default function EstoquePage() {
  const [estoque, setEstoque] = useState<any[]>([]);
  const [filteredEstoque, setFilteredEstoque] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');

  useEffect(() => {
    loadEstoque();
  }, []);

  useEffect(() => {
    filterEstoque();
  }, [searchTerm, filtroStatus, estoque]);

  const loadEstoque = async () => {
    try {
      const data = await listarEstoque();
      setEstoque(data);
    } catch (error) {
      console.error('Erro ao carregar estoque:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEstoque = () => {
    let filtered = [...estoque];

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.medicamento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.lote?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (filtroStatus !== 'TODOS') {
      filtered = filtered.filter((item) => {
        const percentual = (item.quantidadeAtual / item.quantidadeMaxima) * 100;

        if (filtroStatus === 'CRITICO' && percentual <= 10) return true;
        if (filtroStatus === 'BAIXO' && percentual > 10 && percentual <= 20) return true;
        if (filtroStatus === 'ALERTA' && percentual > 20 && percentual <= 40) return true;
        if (filtroStatus === 'ADEQUADO' && percentual > 40) return true;

        return false;
      });
    }

    setFilteredEstoque(filtered);
  };

  const getStatusBadge = (item: any) => {
    const percentual = (item.quantidadeAtual / item.quantidadeMaxima) * 100;

    if (percentual <= 10) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Crítico
        </Badge>
      );
    }
    if (percentual <= 20) {
      return <Badge className="bg-orange-600">Baixo</Badge>;
    }
    if (percentual <= 40) {
      return <Badge className="bg-yellow-600">Alerta</Badge>;
    }
    return <Badge className="bg-green-600">Adequado</Badge>;
  };

  const getVencimentoBadge = (dataValidade: string | null) => {
    if (!dataValidade) return null;

    const hoje = new Date();
    const validade = new Date(dataValidade);
    const diasRestantes = Math.floor(
      (validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diasRestantes < 0) {
      return <Badge variant="destructive">Vencido</Badge>;
    }
    if (diasRestantes <= 30) {
      return <Badge className="bg-orange-600">Vence em {diasRestantes}d</Badge>;
    }
    if (diasRestantes <= 90) {
      return <Badge className="bg-yellow-600">Vence em {diasRestantes}d</Badge>;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando estoque...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Estoque</h1>
          <p className="text-gray-500 mt-1">
            Controle de medicamentos e insumos
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Item
        </Button>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estoque.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estoque Crítico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {estoque.filter((item) => (item.quantidadeAtual / item.quantidadeMaxima) * 100 <= 10).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {estoque.filter((item) => {
                const p = (item.quantidadeAtual / item.quantidadeMaxima) * 100;
                return p > 10 && p <= 20;
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vencimento Próximo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {estoque.filter((item) => {
                if (!item.dataValidade) return false;
                const dias = Math.floor(
                  (new Date(item.dataValidade).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                return dias >= 0 && dias <= 90;
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar medicamento ou lote..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="CRITICO">Crítico (≤10%)</SelectItem>
                <SelectItem value="BAIXO">Baixo (10-20%)</SelectItem>
                <SelectItem value="ALERTA">Alerta (20-40%)</SelectItem>
                <SelectItem value="ADEQUADO">Adequado (&gt;40%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Estoque */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Itens em Estoque
            <Badge variant="secondary" className="ml-2">
              {filteredEstoque.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEstoque.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum item encontrado
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEstoque.map((item) => {
                const percentual = (item.quantidadeAtual / item.quantidadeMaxima) * 100;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{item.medicamento}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Lote: {item.lote || '-'} | Unidade: {item.unidadeSaudeId || '-'}
                      </div>
                      {item.dataValidade && (
                        <div className="text-xs text-gray-400 mt-1">
                          Validade: {new Date(item.dataValidade).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              percentual <= 10
                                ? 'bg-red-600'
                                : percentual <= 20
                                ? 'bg-orange-600'
                                : percentual <= 40
                                ? 'bg-yellow-600'
                                : 'bg-green-600'
                            }`}
                            style={{ width: `${Math.max(percentual, 5)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">
                          {percentual.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-bold">{item.quantidadeAtual}</div>
                        <div className="text-xs text-gray-500">
                          de {item.quantidadeMaxima}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {getStatusBadge(item)}
                        {getVencimentoBadge(item.dataValidade)}
                      </div>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
