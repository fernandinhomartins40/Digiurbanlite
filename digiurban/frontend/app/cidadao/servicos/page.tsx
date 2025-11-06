'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CitizenLayout } from '@/components/citizen/CitizenLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Search,
  Clock,
  ArrowRight,
  Filter,
  Loader2,
  Building2,
  Grid3x3,
  List,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useCitizenServices, CitizenService } from '@/hooks/useCitizenServices';
import { getDepartmentTheme, getCategoryColor } from '@/lib/department-colors';
import { Badge } from '@/components/ui/badge';

type ViewMode = 'grid' | 'list' | 'grouped';

export default function ServicosPage() {
  const router = useRouter();
  const { services, loading, error } = useCitizenServices();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('todos');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());

  const handleSolicitar = (serviceId: string) => {
    router.push(`/cidadao/servicos/${serviceId}/solicitar`);
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
      { id: 'todos', name: 'Todas as Secretarias', count: services.length },
      ...Array.from(uniqueDepts.values()).sort((a, b) => a.name.localeCompare(b.name))
    ];
  }, [services]);

  // Extrair categorias únicas
  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      services
        .filter(s => s.category && (selectedDepartment === 'todos' || s.departmentId === selectedDepartment))
        .map(s => s.category as string)
    );

    return [
      { id: 'todos', name: 'Todas as Categorias' },
      ...Array.from(uniqueCategories).sort().map(cat => ({
        id: cat,
        name: cat
      }))
    ];
  }, [services, selectedDepartment]);

  // Filtrar serviços
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (service.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           service.department?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = selectedDepartment === 'todos' || service.departmentId === selectedDepartment;
      const matchesCategory = selectedCategory === 'todos' || service.category === selectedCategory;
      return matchesSearch && matchesDepartment && matchesCategory;
    });
  }, [services, searchTerm, selectedDepartment, selectedCategory]);

  // Agrupar por departamento e categoria
  const groupedServices = useMemo(() => {
    const groups = new Map<string, Map<string, CitizenService[]>>();

    filteredServices.forEach(service => {
      const deptId = service.departmentId;
      const category = service.category || 'Sem Categoria';

      if (!groups.has(deptId)) {
        groups.set(deptId, new Map());
      }

      const deptGroups = groups.get(deptId)!;
      if (!deptGroups.has(category)) {
        deptGroups.set(category, []);
      }

      deptGroups.get(category)!.push(service);
    });

    return groups;
  }, [filteredServices]);

  const toggleDepartment = (deptId: string) => {
    setExpandedDepartments(prev => {
      const next = new Set(prev);
      if (next.has(deptId)) {
        next.delete(deptId);
      } else {
        next.add(deptId);
      }
      return next;
    });
  };

  // Expandir todos os departamentos ao carregar no modo agrupado
  useMemo(() => {
    if (viewMode === 'grouped' && groupedServices.size > 0 && expandedDepartments.size === 0) {
      setExpandedDepartments(new Set(Array.from(groupedServices.keys())));
    }
  }, [viewMode, groupedServices]);

  const ServiceCard = ({ service }: { service: CitizenService }) => {
    const deptTheme = getDepartmentTheme(service.department?.name || '');
    // Usar cor da categoria para o card, mantendo secretaria no badge
    const categoryColor = service.category ? getCategoryColor(service.category) : deptTheme;

    return (
      <Card
        className={`hover:shadow-md transition-all duration-200 border-l-4 ${categoryColor.borderClass} group cursor-pointer`}
        onClick={() => handleSolicitar(service.id)}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className={`${categoryColor.bgClass} p-2 rounded flex-shrink-0`}>
              <FileText className={`h-4 w-4 ${categoryColor.textClass}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:underline">
                {service.name}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {service.category && (
                  <Badge variant="outline" className={`text-xs px-2 py-0 text-gray-700 ${categoryColor.borderClass}`}>
                    {service.category}
                  </Badge>
                )}
                <Badge variant="outline" className={`text-xs px-2 py-0 text-gray-700 ${deptTheme.borderClass}`}>
                  {service.department?.name}
                </Badge>
              </div>
            </div>
          </div>

          {/* Descrição */}
          {service.description && (
            <p className="text-xs text-gray-600 mb-3 line-clamp-2">
              {service.description}
            </p>
          )}

          {/* Info footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{service.estimatedDays ? `${service.estimatedDays}d` : 'A definir'}</span>
              </div>
              {service.requiredDocuments && Array.isArray(service.requiredDocuments) && service.requiredDocuments.length > 0 && (
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  <span>{service.requiredDocuments.length} doc{service.requiredDocuments.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
            <Button
              size="sm"
              className={`h-7 text-xs px-3 text-gray-700 hover:bg-gray-50 border ${categoryColor.borderClass}`}
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleSolicitar(service.id);
              }}
            >
              Solicitar
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <CitizenLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg p-4 text-white shadow-lg">
          <h1 className="text-xl sm:text-2xl font-bold mb-1">Catálogo de Serviços</h1>
          <p className="text-sm text-blue-100">Encontre e solicite os serviços municipais disponíveis</p>
        </div>

        {/* Busca e Filtros */}
        <Card>
          <CardContent className="p-3 space-y-3">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar serviços..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 text-sm"
              />
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Secretaria */}
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                  <Building2 className="h-3 w-3 inline mr-1" />
                  Secretaria
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value);
                    setSelectedCategory('todos');
                  }}
                  className="w-full h-9 rounded-md border border-gray-300 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Categoria */}
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                  <Filter className="h-3 w-3 inline mr-1" />
                  Categoria
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-9 rounded-md border border-gray-300 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={categories.length === 1}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Modo de visualização */}
              <div className="sm:w-auto">
                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                  Visualização
                </label>
                <div className="flex gap-1 bg-gray-100 p-0.5 rounded">
                  <Button
                    size="sm"
                    variant={viewMode === 'grouped' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('grouped')}
                    className="h-8 px-2"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('grid')}
                    className="h-8 px-2"
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <span className="ml-2 text-gray-600">Carregando serviços...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Estatísticas */}
        {!loading && !error && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-3">
                <p className="text-xs text-gray-600 mb-0.5">Serviços</p>
                <p className="text-2xl font-bold text-gray-900">{services.length}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-3">
                <p className="text-xs text-gray-600 mb-0.5">Secretarias</p>
                <p className="text-2xl font-bold text-gray-900">{departments.length - 1}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-3">
                <p className="text-xs text-gray-600 mb-0.5">Resultados</p>
                <p className="text-2xl font-bold text-gray-900">{filteredServices.length}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lista de Serviços - Modo Agrupado */}
        {!loading && !error && viewMode === 'grouped' && (
          <div className="space-y-4">
            {Array.from(groupedServices.entries()).map(([deptId, categories]) => {
              const service = filteredServices.find(s => s.departmentId === deptId);
              if (!service?.department) return null;

              const theme = getDepartmentTheme(service.department.name);
              const isExpanded = expandedDepartments.has(deptId);

              return (
                <Card key={deptId} className={`border-l-4 ${theme.borderClass}`}>
                  <CardContent className="p-0">
                    {/* Header da Secretaria */}
                    <button
                      onClick={() => toggleDepartment(deptId)}
                      className={`w-full p-3 flex items-center justify-between hover:${theme.bgClass} transition-colors border-b`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`${theme.bgClass} p-2 rounded`}>
                          <Building2 className={`h-5 w-5 ${theme.textClass}`} />
                        </div>
                        <div className="text-left">
                          <h2 className={`text-base font-bold ${theme.textClass}`}>
                            {service.department.name}
                          </h2>
                          <p className="text-xs text-gray-500">
                            {Array.from(categories.values()).reduce((acc, services) => acc + services.length, 0)} serviço(s)
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className={`h-5 w-5 ${theme.textClass}`} />
                      ) : (
                        <ChevronRight className={`h-5 w-5 ${theme.textClass}`} />
                      )}
                    </button>

                    {/* Categorias e Serviços */}
                    {isExpanded && (
                      <div className="p-3 space-y-4 bg-gray-50">
                        {Array.from(categories.entries()).map(([categoryName, categoryServices]) => {
                          const categoryColor = getCategoryColor(categoryName);

                          return (
                            <div key={categoryName}>
                              <div className="flex items-center gap-2 mb-2 pb-1 border-b">
                                <div className={`w-3 h-3 rounded-full ${categoryColor.bgClass} border-2 ${categoryColor.borderClass}`} />
                                <h3 className="text-sm font-semibold text-gray-800">
                                  {categoryName}
                                </h3>
                                <span className="text-xs text-gray-500">({categoryServices.length})</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {categoryServices.map(service => (
                                  <ServiceCard key={service.id} service={service} />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Lista de Serviços - Modo Grid */}
        {!loading && !error && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredServices.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}

        {/* Mensagem de nenhum resultado */}
        {!loading && !error && filteredServices.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Nenhum serviço encontrado
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Tente ajustar os filtros ou realizar uma nova busca
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDepartment('todos');
                  setSelectedCategory('todos');
                }}
              >
                Limpar Filtros
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </CitizenLayout>
  );
}
