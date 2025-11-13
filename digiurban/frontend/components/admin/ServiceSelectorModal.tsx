'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  FileText,
  Clock,
  Loader2,
  AlertCircle,
  Building2,
  Folder
} from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

interface Service {
  id: string;
  name: string;
  description: string | null;
  estimatedDays: number | null;
  category: string | null;
  serviceType: 'INFORMATIVO' | 'COM_DADOS' | 'SEM_DADOS';
  moduleType?: string | null;
  requiresDocuments?: boolean;
  isActive: boolean;
  department: {
    id: string;
    name: string;
    code: string;
  };
}

interface ServiceSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentFilter?: string; // código do departamento (ex: 'agricultura', 'saude')
}

export function ServiceSelectorModal({
  open,
  onOpenChange,
  departmentFilter,
}: ServiceSelectorModalProps) {
  const router = useRouter();
  const { apiRequest } = useAdminAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      loadServices();
    }
  }, [open]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/api/services?isActive=true');
      const allServices = response.data || [];

      // Filtrar apenas serviços ativos
      const activeServices = allServices.filter((s: Service) => s.isActive);

      setServices(activeServices);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar serviços
  const filteredServices = useMemo(() => {
    let filtered = services;

    // Filtrar por departamento se especificado
    if (departmentFilter) {
      filtered = filtered.filter(
        (s) => s.department.code === departmentFilter
      );
    }

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.department.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [services, departmentFilter, searchTerm]);

  // Agrupar serviços por departamento (quando não há filtro)
  const servicesByDepartment = useMemo(() => {
    const grouped: Record<string, { department: Service['department']; services: Service[] }> = {};

    filteredServices.forEach((service) => {
      const deptCode = service.department.code;
      if (!grouped[deptCode]) {
        grouped[deptCode] = {
          department: service.department,
          services: [],
        };
      }
      grouped[deptCode].services.push(service);
    });

    return grouped;
  }, [filteredServices]);

  const handleSelectService = (serviceId: string) => {
    // Fechar modal e navegar para a página de solicitação
    onOpenChange(false);
    router.push(`/admin/servicos/${serviceId}/solicitar`);
  };

  const renderServiceCard = (service: Service) => (
    <Card
      key={service.id}
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => handleSelectService(service.id)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              {service.name}
            </CardTitle>
            {!departmentFilter && (
              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                <Building2 className="h-3 w-3" />
                {service.department.name}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            {service.moduleType && (
              <Badge className="bg-green-600">Motor</Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {service.serviceType === 'COM_DADOS' ? 'Com Dados' :
               service.serviceType === 'SEM_DADOS' ? 'Documento' :
               'Informativo'}
            </Badge>
          </div>
        </div>
        <CardDescription className="line-clamp-2">
          {service.description || 'Sem descrição disponível'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {service.estimatedDays && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Prazo estimado: {service.estimatedDays} dias</span>
            </div>
          )}
          {service.category && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Folder className="h-4 w-4" />
              <span>{service.category}</span>
            </div>
          )}
          {service.requiresDocuments && (
            <div className="text-sm text-amber-600">
              📎 Requer documentação
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Carregando serviços...</span>
        </div>
      );
    }

    if (filteredServices.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum serviço encontrado</h3>
          <p className="text-sm text-muted-foreground">
            {searchTerm
              ? 'Tente ajustar sua busca'
              : 'Não há serviços ativos disponíveis no momento'}
          </p>
        </div>
      );
    }

    // Se há filtro de departamento, mostrar lista simples
    if (departmentFilter) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
          {filteredServices.map(renderServiceCard)}
        </div>
      );
    }

    // Sem filtro: mostrar agrupado por departamento em tabs
    const departmentEntries = Object.entries(servicesByDepartment);

    if (departmentEntries.length === 1) {
      // Se houver apenas um departamento, mostrar lista simples
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
          {filteredServices.map(renderServiceCard)}
        </div>
      );
    }

    return (
      <Tabs defaultValue={departmentEntries[0]?.[0]} className="w-full">
        <TabsList className="w-full flex-wrap h-auto justify-start">
          {departmentEntries.map(([code, { department }]) => (
            <TabsTrigger key={code} value={code} className="text-xs">
              {department.name}
              <Badge variant="secondary" className="ml-2">
                {servicesByDepartment[code].services.length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {departmentEntries.map(([code, { services: deptServices }]) => (
          <TabsContent key={code} value={code} className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto p-1">
              {deptServices.map(renderServiceCard)}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {departmentFilter
              ? 'Selecione o Serviço'
              : 'Selecione o Serviço para Criar Protocolo'}
          </DialogTitle>
          <DialogDescription>
            {departmentFilter
              ? 'Escolha o serviço para criar um novo protocolo'
              : 'Escolha o serviço em qualquer secretaria para criar um novo protocolo'}
          </DialogDescription>
        </DialogHeader>

        {/* Busca */}
        <div className="relative px-6">
          <Search className="absolute left-9 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar serviço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-hidden px-6 pb-6">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
