'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, Plus, Filter } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ServiceTemplate {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  icon?: string;
  estimatedTime: string;
  moduleType?: string;
  isActive: boolean;
  _count?: {
    instances: number;
  };
}

const categories = [
  'Todos',
  'Educação',
  'Saúde',
  'Assistência Social',
  'Obras Públicas',
  'Serviços Públicos',
  'Habitação',
  'Cultura',
  'Esporte',
  'Turismo',
  'Meio Ambiente',
  'Agricultura',
  'Planejamento Urbano',
  'Segurança Pública'
];

export default function ServiceTemplatesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const { data: templates, isLoading } = useQuery({
    queryKey: ['service-templates', selectedCategory, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== 'Todos') params.append('category', selectedCategory);
      if (search) params.append('search', search);

      const res = await fetch(`/api/service-templates?${params.toString()}`);
      if (!res.ok) throw new Error('Erro ao carregar templates');
      return res.json() as Promise<ServiceTemplate[]>;
    }
  });

  const groupedTemplates = templates?.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, ServiceTemplate[]>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Catálogo de Templates</h1>
        <p className="text-muted-foreground">
          Explore e ative templates pré-configurados de serviços
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome ou descrição do serviço..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedTemplates && Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{category}</h2>
                <Badge variant="secondary">{categoryTemplates.length} templates</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription className="text-xs font-mono">
                            {template.code}
                          </CardDescription>
                        </div>
                        {template.moduleType && (
                          <Badge variant="outline" className="ml-2">
                            Módulo
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>⏱️ {template.estimatedTime}</span>
                        {template._count && template._count.instances > 0 && (
                          <span>✓ {template._count.instances} ativo(s)</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          asChild
                        >
                          <Link href={`/admin/servicos/templates/${template.id}/preview`}>
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => router.push(`/admin/servicos/templates/${template.id}/activate`)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Ativar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {templates && templates.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Filter className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
            <p className="text-muted-foreground text-center">
              Tente ajustar os filtros de busca
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
