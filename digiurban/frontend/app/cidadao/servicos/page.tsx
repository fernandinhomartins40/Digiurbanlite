'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CitizenLayout } from '@/components/citizen/CitizenLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  FileText,
  Search,
  Clock,
  ArrowRight,
  Loader2,
  Building2,
  X,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useCitizenServices, CitizenService } from '@/hooks/useCitizenServices';
import { getDepartmentTheme, getCategoryColor } from '@/lib/department-colors';
import { Badge } from '@/components/ui/badge';

export default function ServicosPage() {
  const router = useRouter();
  const { services, loading, error } = useCitizenServices();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('todos');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const popularScrollRef = useRef<HTMLDivElement>(null);
  const categoryScrollRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const handleSolicitar = (serviceId: string) => {
    router.push(`/cidadao/servicos/${serviceId}/solicitar`);
  };

  // Função para rolar os sliders
  const scroll = (ref: React.RefObject<HTMLDivElement | null> | HTMLDivElement | null | undefined, direction: 'left' | 'right') => {
    const container = ref && 'current' in ref ? ref.current : ref;
    if (!container) return;

    const scrollAmount = 300; // Pixels para rolar
    const newScrollPosition = container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);

    container.scrollTo({
      left: newScrollPosition,
      behavior: 'smooth'
    });
  };

  // Extrair departamentos únicos
  const departments = useMemo(() => {
    const uniqueDepts = new Map<string, { id: string; name: string; count: number }>();

    services.forEach(service => {
      if (service.department) {
        const existing = uniqueDepts.get(service.departmentId);
        if (existing) {
          existing.count++;
        } else {
          uniqueDepts.set(service.departmentId, {
            id: service.departmentId,
            name: service.department.name,
            count: 1
          });
        }
      }
    });

    return [
      { id: 'todos', name: 'Todos', icon: '📋', count: services.length },
      ...Array.from(uniqueDepts.values())
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(dept => ({
          ...dept,
          icon: '🏛️'
        }))
    ];
  }, [services]);

  // Filtrar serviços
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (service.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           service.department?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = selectedDepartment === 'todos' || service.departmentId === selectedDepartment;
      return matchesSearch && matchesDepartment;
    });
  }, [services, searchTerm, selectedDepartment]);

  // Agrupar serviços por categoria (para o slider)
  const servicesByCategory = useMemo(() => {
    const groups = new Map<string, CitizenService[]>();

    filteredServices.forEach(service => {
      const category = service.category || 'Outros';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(service);
    });

    return Array.from(groups.entries())
      .sort((a, b) => b[1].length - a[1].length); // Ordenar por quantidade
  }, [filteredServices]);

  // Serviços mais populares (mock - em produção viria do backend)
  const popularServices = useMemo(() => {
    return filteredServices.slice(0, 6);
  }, [filteredServices]);

  // Card compacto para slider horizontal
  const ServiceCard = ({ service, variant = 'default' }: { service: CitizenService; variant?: 'default' | 'compact' }) => {
    const categoryColor = service.category ? getCategoryColor(service.category) : getDepartmentTheme(service.department?.name || '');
    const isCompact = variant === 'compact';
    const [isHovered, setIsHovered] = React.useState(false);

    return (
      <Card
        className={cn(
          "flex-shrink-0 hover:shadow-lg transition-all duration-200 cursor-pointer group border-0",
          isCompact ? "w-[280px]" : "w-full"
        )}
        onClick={() => handleSolicitar(service.id)}
      >
        <CardContent className={cn("p-4", isCompact && "p-3")}>
          {/* Header com ícone e título */}
          <div className="flex items-start gap-3 mb-3">
            <div className={cn(
              "rounded-lg flex-shrink-0",
              categoryColor.bgClass,
              isCompact ? "p-2" : "p-2.5"
            )}>
              <FileText className={cn(categoryColor.textClass, isCompact ? "h-4 w-4" : "h-5 w-5")} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors",
                isCompact ? "text-sm mb-1" : "text-base mb-1.5"
              )}>
                {service.name}
              </h3>
              <Badge
                variant="outline"
                className={cn(
                  "text-gray-600 font-normal border-gray-300",
                  isCompact ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5"
                )}
              >
                {service.department?.name}
              </Badge>
            </div>
          </div>

          {/* Descrição (apenas em cards normais) */}
          {!isCompact && service.description && (
            <p className="text-xs text-gray-600 mb-3 line-clamp-2">
              {service.description}
            </p>
          )}

          {/* Footer com info e botão */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{service.estimatedDays ? `${service.estimatedDays}d` : '-'}</span>
              </div>
              {service.requiredDocuments && Array.isArray(service.requiredDocuments) && service.requiredDocuments.length > 0 && (
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  <span>{service.requiredDocuments.length}</span>
                </div>
              )}
            </div>
            <Button
              size="sm"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={isHovered ? {
                backgroundColor: categoryColor.primary,
                borderColor: categoryColor.primary,
                color: 'white'
              } : {}}
              className={cn(
                "bg-white border group-hover:shadow-md transition-all",
                !isHovered && categoryColor.textClass,
                !isHovered && categoryColor.borderClass,
                isCompact ? "h-7 text-xs px-2" : "h-8 text-sm px-3"
              )}
              onClick={(e) => {
                e.stopPropagation();
                handleSolicitar(service.id);
              }}
            >
              {isCompact ? "Ver" : "Solicitar"}
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <CitizenLayout>
      <div className="space-y-5 animate-fade-in">
        {/* Header Compacto */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Serviços</h1>
            <p className="text-sm text-gray-600 mt-0.5">
              {filteredServices.length} disponíveis
            </p>
          </div>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar serviços..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-10 h-11 text-sm border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Chips de Departamento - Scroll Horizontal */}
        <div className="relative">
          {/* Setas de navegação - apenas desktop */}
          <div className="hidden lg:flex items-center gap-2 mb-2 justify-end">
            <button
              onClick={() => scroll(scrollContainerRef, 'left')}
              className="h-8 w-8 rounded-full bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center"
              aria-label="Rolar departamentos para esquerda"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={() => scroll(scrollContainerRef, 'right')}
              className="h-8 w-8 rounded-full bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center"
              aria-label="Rolar departamentos para direita"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          <div
            ref={scrollContainerRef}
            className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {departments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => setSelectedDepartment(dept.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all snap-start flex-shrink-0",
                  selectedDepartment === dept.id
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-gray-700 border border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                )}
              >
                <span>{dept.icon}</span>
                <span>{dept.name}</span>
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  selectedDepartment === dept.id
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600"
                )}>
                  {dept.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-3" />
            <span className="text-gray-600">Carregando serviços...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Serviços Populares - Slider Horizontal */}
        {!loading && !error && popularServices.length > 0 && searchTerm === '' && selectedDepartment === 'todos' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                <h2 className="text-lg font-bold text-gray-900">Mais Procurados</h2>
              </div>
              {/* Setas de navegação - apenas desktop */}
              <div className="hidden lg:flex items-center gap-2">
                <button
                  onClick={() => scroll(popularScrollRef, 'left')}
                  className="h-8 w-8 rounded-full bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center"
                  aria-label="Rolar para esquerda"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={() => scroll(popularScrollRef, 'right')}
                  className="h-8 w-8 rounded-full bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center"
                  aria-label="Rolar para direita"
                >
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
            <div
              ref={popularScrollRef}
              className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
            >
              {popularServices.map(service => (
                <ServiceCard key={service.id} service={service} variant="compact" />
              ))}
            </div>
          </div>
        )}

        {/* Serviços por Categoria - Sliders Horizontais */}
        {!loading && !error && servicesByCategory.length > 0 && (
          <div className="space-y-6">
            {servicesByCategory.map(([categoryName, categoryServices]) => {
              const categoryColor = getCategoryColor(categoryName);

              return (
                <div key={categoryName} className="space-y-3">
                  {/* Header da Categoria */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-1 h-6 rounded-full",
                        categoryColor.bgClass.replace('bg-opacity-10', '')
                      )} />
                      <div>
                        <h2 className="text-base font-bold text-gray-900">{categoryName}</h2>
                        <p className="text-xs text-gray-500">{categoryServices.length} serviços</p>
                      </div>
                    </div>
                    {/* Setas de navegação - apenas desktop */}
                    <div className="hidden lg:flex items-center gap-2">
                      <button
                        onClick={() => scroll(categoryScrollRefs.current.get(categoryName), 'left')}
                        className="h-8 w-8 rounded-full bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center"
                        aria-label="Rolar para esquerda"
                      >
                        <ChevronLeft className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => scroll(categoryScrollRefs.current.get(categoryName), 'right')}
                        className="h-8 w-8 rounded-full bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center"
                        aria-label="Rolar para direita"
                      >
                        <ChevronRight className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* Slider de Cards */}
                  <div
                    ref={(el) => {
                      if (el) categoryScrollRefs.current.set(categoryName, el);
                    }}
                    className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
                  >
                    {categoryServices.map(service => (
                      <ServiceCard key={service.id} service={service} variant="compact" />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Mensagem de nenhum resultado */}
        {!loading && !error && filteredServices.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Nenhum serviço encontrado
              </h3>
              <p className="text-sm text-gray-600 mb-4 max-w-sm mx-auto">
                Não encontramos serviços que correspondam à sua busca. Tente usar termos diferentes ou limpar os filtros.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDepartment('todos');
                }}
                className="mx-auto"
              >
                Limpar Filtros
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* CSS para ocultar scrollbar mas manter funcionalidade */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </CitizenLayout>
  );
}
