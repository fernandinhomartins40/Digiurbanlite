'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

interface ServiceTemplate {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  icon?: string;
  defaultFields: any[];
  requiredDocs: string[];
  estimatedTime: string;
  moduleType?: string;
  moduleEntity?: string;
  fieldMapping?: any;
}

export default function ActivateTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const templateId = params.templateId as string;

  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');

  const { data: template, isLoading } = useQuery({
    queryKey: ['service-template', templateId],
    queryFn: async () => {
      const res = await fetch(`/api/service-templates/${templateId}`);
      if (!res.ok) throw new Error('Erro ao carregar template');
      const data = await res.json();
      setCustomName(data.name);
      setCustomDescription(data.description);
      return data as ServiceTemplate;
    }
  });

  const activateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/service-templates/${templateId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customizations: {
            name: customName,
            description: customDescription
          }
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao ativar template');
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success('Template ativado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['services'] });
      router.push('/admin/servicos');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!template) {
    return <div>Template não encontrado</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/servicos/templates/${template.id}/preview`}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Ativar Template</h1>
        <p className="text-muted-foreground">
          Personalize e ative o template "{template.name}"
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Customização */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personalização</CardTitle>
              <CardDescription>
                Ajuste o nome e descrição do serviço para sua cidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Serviço</Label>
                <Input
                  id="name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Ex: Matrícula Escolar 2024"
                />
                <p className="text-xs text-muted-foreground">
                  Este será o nome exibido no portal do cidadão
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  rows={4}
                  placeholder="Descreva o serviço..."
                />
                <p className="text-xs text-muted-foreground">
                  Explique de forma clara como o serviço funciona
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Campos e Documentos</p>
                  <p className="text-sm text-muted-foreground">
                    {template.defaultFields.length} campos • {template.requiredDocs.length} documentos
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/servicos/templates/${template.id}/preview`}>
                    Visualizar
                  </Link>
                </Button>
              </div>

              {template.moduleType && (
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Check className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">Módulo Especializado Ativo</p>
                    <p className="text-sm text-blue-700 mt-1">
                      As solicitações serão automaticamente salvas no módulo de {template.category}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => activateMutation.mutate()}
                  disabled={activateMutation.isPending || !customName.trim()}
                >
                  {activateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Ativar Serviço
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Código</label>
                <p className="font-mono text-sm">{template.code}</p>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Categoria</label>
                <p className="text-sm">{template.category}</p>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tempo Estimado</label>
                <p className="text-sm">{template.estimatedTime}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Após Ativação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5" />
                <p>O serviço ficará disponível no portal do cidadão</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5" />
                <p>Solicitações serão vinculadas a protocolos</p>
              </div>
              {template.moduleType && (
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  <p>Dados salvos automaticamente no módulo da secretaria</p>
                </div>
              )}
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5" />
                <p>Você poderá gerenciar as solicitações no painel admin</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
