'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { ModuleConfig, ModuleRecord, ModuleStats } from '@/lib/module-configs';
import { ModuleDashboard } from './ModuleDashboard';
import { ModuleFilters } from './ModuleFilters';
import { ModuleDataTable } from './ModuleDataTable';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api-client';

interface ModulePageTemplateProps {
  config: ModuleConfig;
  departmentType: string;
}

export function ModulePageTemplate({ config, departmentType }: ModulePageTemplateProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [data, setData] = useState<ModuleRecord[]>([]);
  const [stats, setStats] = useState<ModuleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 20,
  });

  const apiPath = config.apiEndpoint
    ? config.apiEndpoint.replace('/api', '')
    : `/admin/secretarias/${departmentType}/${config.key}`;

  useEffect(() => {
    fetchData();
  }, [filters, page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...filters,
      });

      const response = await apiClient.get(`${apiPath}?${queryParams}`);

      if (!response.ok) throw new Error('Erro ao carregar dados');

      const result = await response.json();
      setData(result.data || []);
      setStats(result.stats || null);
      setPagination(result.pagination || pagination);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setPage(1);
  };

  const handleEdit = (record: ModuleRecord) => {
    router.push(`/admin/secretarias/${departmentType}/${config.key}/${record.id}/editar`);
  };

  const handleView = (record: ModuleRecord) => {
    router.push(`/admin/secretarias/${departmentType}/${config.key}/${record.id}`);
  };

  const handleDelete = async (record: ModuleRecord) => {
    try {
      const response = await fetch(apiClient.getUrl(`${apiPath}/${record.id}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Erro ao excluir');

      toast({
        title: 'Sucesso',
        description: 'Registro excluído com sucesso',
      });

      fetchData();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir registro',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(`/admin/secretarias/${departmentType}`)}
            className="hover:bg-gray-100 border-gray-300"
            title="Voltar para a secretaria"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{config.displayName}</h1>
            {config.description && (
              <p className="text-muted-foreground mt-1">{config.description}</p>
            )}
          </div>
        </div>
        <Button onClick={() => router.push(`/admin/secretarias/${departmentType}/${config.key}/novo`)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo {config.displayNameSingular}
        </Button>
      </div>

      {/* Dashboard */}
      <ModuleDashboard stats={stats} config={config.stats} loading={loading} />

      {/* Filtros */}
      {config.filters && config.filters.length > 0 && (
        <ModuleFilters
          filters={config.filters}
          values={filters}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
        />
      )}

      {/* Tabela */}
      <ModuleDataTable
        fields={config.fields}
        data={data}
        loading={loading}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        pagination={pagination}
        onPageChange={setPage}
      />
    </div>
  );
}
