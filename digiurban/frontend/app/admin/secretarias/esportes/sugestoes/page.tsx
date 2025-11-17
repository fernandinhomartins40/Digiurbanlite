'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  FileCheck,
  Plus,
  Calendar,
  Search,
  Filter
} from 'lucide-react';
import { useServiceSuggestions } from '@/hooks/useServiceSuggestions';
import { buildServiceCreationUrl } from '@/utils/service-prefill';

export default function EsportesSugestoesPage() {
  const router = useRouter();
  const { suggestions, isLoading } = useServiceSuggestions('esportes');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Filtrar sugestões por busca e categoria
  const filteredSuggestions = suggestions.filter(suggestion => {
    const matchesSearch = suggestion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         suggestion.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || suggestion.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Obter categorias únicas
  const categories = Array.from(new Set(suggestions.map(s => s.category)));

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/secretarias/esportes')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Esportes
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Todas as Sugestões de Serviços</h1>
            <p className="text-muted-foreground mt-2">
              Explore todas as {suggestions.length} sugestões disponíveis para Esportes
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={categoryFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setCategoryFilter('all')}
            size="sm"
          >
            Todas ({suggestions.length})
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={categoryFilter === category ? 'default' : 'outline'}
              onClick={() => setCategoryFilter(category)}
              size="sm"
            >
              {category} ({suggestions.filter(s => s.category === category).length})
            </Button>
          ))}
        </div>
      </div>

      {/* Resultados */}
      <div className="mb-4 text-sm text-muted-foreground">
        Mostrando {filteredSuggestions.length} de {suggestions.length} sugestões
      </div>

      {/* Grid de Sugestões */}
      {isLoading ? (
        <div className="text-center py-12">Carregando sugestões...</div>
      ) : filteredSuggestions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Filter className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Nenhuma sugestão encontrada</h3>
            <p className="text-sm text-muted-foreground">
              Tente ajustar os filtros ou a busca
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuggestions.map((suggestion) => (
            <Card key={suggestion.id} className="border-blue-200 bg-blue-50/50 hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-blue-600" />
                  {suggestion.name}
                </CardTitle>
                <CardDescription>{suggestion.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {suggestion.estimatedDays} dias
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {suggestion.category}
                    </Badge>
                    {suggestion.requiresDocuments && (
                      <Badge variant="secondary" className="text-xs">
                        Requer Docs
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <strong>Campos incluídos:</strong>
                    <ul className="mt-2 space-y-1">
                      {suggestion.suggestedFields.slice(0, 4).map((field, idx) => (
                        <li key={idx}>• {field.label}</li>
                      ))}
                      {suggestion.suggestedFields.length > 4 && (
                        <li className="text-blue-600">
                          + {suggestion.suggestedFields.length - 4} campos adicionais
                        </li>
                      )}
                    </ul>
                  </div>

                  <Button
                    variant="default"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => router.push(buildServiceCreationUrl('esportes', suggestion))}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar este Serviço
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
