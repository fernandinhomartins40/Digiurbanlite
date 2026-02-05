'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Download, Filter, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface FilterOptions {
  periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  departmentId?: string;
  serviceId?: string;
}

interface Department {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
}

export default function ReportFilters() {
  const [filters, setFilters] = useState<FilterOptions>({
    periodType: 'MONTHLY'
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadDepartments();
    loadServices();
  }, []);

  const loadDepartments = async () => {
    try {
      const response = await fetch('/api/departments', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setDepartments(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error);
    }
  };

  const loadServices = async () => {
    try {
      const response = await fetch('/api/services', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setServices(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);

      const params = new URLSearchParams({
        periodType: filters.periodType,
        ...(filters.departmentId && { departmentId: filters.departmentId }),
        ...(filters.serviceId && { serviceId: filters.serviceId })
      });

      const response = await fetch(`/api/protocol-analytics/export/csv?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Erro ao exportar relatório');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-analytics-${filters.periodType}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Relatório exportado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao exportar:', error);
      toast.error(error.message || 'Erro ao exportar relatório');
    } finally {
      setExporting(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/protocol-analytics/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          periodType: filters.periodType
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Erro ao recalcular métricas');
      }

      const result = await response.json();
      toast.success(`Métricas recalculadas! ${result.data.bottlenecksFound} gargalo(s) identificado(s).`);

      // Dispara evento customizado para que DashboardOverview recarregue
      window.dispatchEvent(new CustomEvent('analytics-recalculated'));
    } catch (error: any) {
      console.error('Erro ao recalcular:', error);
      toast.error(error.message || 'Erro ao recalcular métricas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros e Exportação
        </CardTitle>
        <CardDescription>
          Configure os filtros para personalizar os relatórios e exportações
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {/* Período */}
          <div className="space-y-2">
            <Label htmlFor="periodType">Período</Label>
            <Select
              value={filters.periodType}
              onValueChange={(value: any) => setFilters({ ...filters, periodType: value })}
            >
              <SelectTrigger id="periodType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">Diário</SelectItem>
                <SelectItem value="WEEKLY">Semanal</SelectItem>
                <SelectItem value="MONTHLY">Mensal</SelectItem>
                <SelectItem value="YEARLY">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Departamento */}
          <div className="space-y-2">
            <Label htmlFor="department">Departamento</Label>
            <Select
              value={filters.departmentId || 'all'}
              onValueChange={(value) =>
                setFilters({ ...filters, departmentId: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger id="department">
                <SelectValue placeholder="Todos os departamentos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os departamentos</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Serviço */}
          <div className="space-y-2">
            <Label htmlFor="service">Serviço</Label>
            <Select
              value={filters.serviceId || 'all'}
              onValueChange={(value) =>
                setFilters({ ...filters, serviceId: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger id="service">
                <SelectValue placeholder="Todos os serviços" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os serviços</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={handleExportCSV}
            disabled={exporting}
            className="flex-1"
          >
            <Download className="mr-2 h-4 w-4" />
            {exporting ? 'Exportando...' : 'Exportar CSV'}
          </Button>
          <Button
            onClick={handleRecalculate}
            disabled={loading}
            variant="outline"
            className="flex-1"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Recalculando...' : 'Recalcular Métricas'}
          </Button>
        </div>

        {/* Informações sobre exportação */}
        <div className="bg-muted p-3 rounded-md text-sm">
          <p className="font-medium mb-1">Sobre a Exportação CSV</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Contém visão geral, performance por departamento, top servidores e gargalos</li>
            <li>Dados são calculados em tempo real com base nos filtros selecionados</li>
            <li>Compatível com Excel, Google Sheets e outros softwares (UTF-8 com BOM)</li>
          </ul>
        </div>

        <div className="bg-blue-50 p-3 rounded-md text-sm">
          <p className="font-medium mb-1 text-blue-900">Recálculo de Métricas</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>Atualiza as métricas agregadas (ProtocolMetrics, DepartmentMetrics)</li>
            <li>Detecta e persiste novos gargalos no banco de dados</li>
            <li>Recomendado executar periodicamente ou após alterações importantes</li>
            <li>Requer permissões de administrador</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
