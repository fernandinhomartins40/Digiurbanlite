'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  FileText,
  Clock,
  Loader2,
  AlertCircle,
  Building2,
  Folder,
  Plus
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
  departmentId: string;
  department: {
    id: string;
    name: string;
  };
}

interface ServiceSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentFilter?: string;
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
  }, [open, departmentFilter]);

  const loadServices = async () => {
    try {
      setLoading(true);

      const url = departmentFilter
        ? `/api/services?departmentCode=${departmentFilter}`
        : '/api/services?isActive=true';

      const response = await apiRequest(url);

      if (response.success && response.data) {
        setServices(response.data.filter((s: Service) => s.isActive));
      } else {
        setServices([]);
      }
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter((service) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      service.name.toLowerCase().includes(search) ||
      service.description?.toLowerCase().includes(search) ||
      service.department?.name?.toLowerCase().includes(search)
    );
  });

  const handleSelectService = (serviceId: string) => {
    onOpenChange(false);
    router.push(`/admin/servicos/${serviceId}/solicitar`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Selecione o Serviço
          </DialogTitle>
          <DialogDescription>
            Escolha o serviço para criar um novo protocolo
          </DialogDescription>
        </DialogHeader>

        <div className="relative px-6">
          <Search className="absolute left-9 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar serviço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Carregando serviços...</span>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum serviço encontrado</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm
                  ? 'Tente ajustar sua busca'
                  : 'Não há serviços disponíveis no momento'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredServices.map((service) => (
                <Card
                  key={service.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer border-green-200 bg-green-50/50"
                  onClick={() => handleSelectService(service.id)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      {service.name}
                    </CardTitle>
                    {!departmentFilter && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        {service.department.name}
                      </div>
                    )}
                    <CardDescription className="line-clamp-2">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {service.estimatedDays && (
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          ⏱️ Prazo: {service.estimatedDays} dias
                        </div>
                      )}
                      {service.category && (
                        <div className="text-sm">
                          <Badge variant="outline" className="bg-green-100">
                            {service.category}
                          </Badge>
                        </div>
                      )}
                      <div className="pt-2 border-t">
                        <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <Plus className="h-3 w-3" />
                          Clique para solicitar
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
