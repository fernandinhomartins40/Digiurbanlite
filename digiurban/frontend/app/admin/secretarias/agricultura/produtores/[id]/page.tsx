'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ruralProducersConfig } from '@/lib/module-configs/agriculture';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function VisualizarProdutorPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const apiEndpoint = ruralProducersConfig.apiEndpoint || '/api/admin/secretarias/agricultura/produtores';

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const response = await fetch(`${apiEndpoint}/${id}`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Erro ao carregar dados');

      const result = await response.json();
      setData(result.data || result);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados do produtor',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este produtor?')) return;

    try {
      const response = await fetch(`${apiEndpoint}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Erro ao excluir');

      toast({
        title: 'Sucesso',
        description: 'Produtor excluído com sucesso',
      });

      router.push('/admin/secretarias/agricultura/produtores');
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir produtor',
        variant: 'destructive',
      });
    }
  };

  const renderFieldValue = (field: any, value: any) => {
    if (value === null || value === undefined) return '-';

    switch (field.type) {
      case 'date':
        return new Date(value).toLocaleDateString('pt-BR');
      case 'select':
        const option = field.options?.find((o: any) => o.value === value);
        return option ? option.label : value;
      case 'boolean':
        return value ? 'Sim' : 'Não';
      default:
        return value;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-96" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Produtor não encontrado</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{data.name}</h1>
            <p className="text-muted-foreground mt-1">
              {ruralProducersConfig.displayNameSingular}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/secretarias/agricultura/produtores/${id}/editar`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Dados */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Produtor</CardTitle>
          <CardDescription>Dados cadastrais e informações detalhadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ruralProducersConfig.fields
              .filter((field) => field.showInDetails)
              .map((field) => (
                <div key={field.name} className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    {field.label}
                  </div>
                  <div className="text-base">
                    {field.name === 'status' ? (
                      <Badge variant={data[field.name] === 'ACTIVE' ? 'default' : 'secondary'}>
                        {renderFieldValue(field, data[field.name])}
                      </Badge>
                    ) : (
                      renderFieldValue(field, data[field.name])
                    )}
                  </div>
                </div>
              ))}
          </div>

          {/* Metadados */}
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Metadados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {data.createdAt && (
                <div>
                  <span className="text-muted-foreground">Cadastrado em:</span>{' '}
                  <span className="font-medium">
                    {new Date(data.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>
              )}
              {data.updatedAt && (
                <div>
                  <span className="text-muted-foreground">Última atualização:</span>{' '}
                  <span className="font-medium">
                    {new Date(data.updatedAt).toLocaleString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
