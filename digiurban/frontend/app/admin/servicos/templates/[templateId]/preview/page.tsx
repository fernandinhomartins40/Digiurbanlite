'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Clock, FileText, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
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
  isActive: boolean;
  version: string;
}

export default function TemplatePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as string;

  const { data: template, isLoading } = useQuery({
    queryKey: ['service-template', templateId],
    queryFn: async () => {
      const res = await fetch(`/api/service-templates/${templateId}`);
      if (!res.ok) throw new Error('Erro ao carregar template');
      return res.json() as Promise<ServiceTemplate>;
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
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/servicos/templates">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{template.name}</h1>
          <p className="text-muted-foreground">{template.description}</p>
        </div>
        <Button size="lg" onClick={() => router.push(`/admin/servicos/templates/${template.id}/activate`)}>
          <Plus className="h-4 w-4 mr-2" />
          Ativar Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Principais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Formulário Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Campos do Formulário</CardTitle>
              <CardDescription>
                Preview dos campos que serão exibidos ao cidadão
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {template.defaultFields.map((field: any, index: number) => (
                <div key={index} className="space-y-2 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <Badge variant="outline" className="text-xs">
                      {field.type}
                    </Badge>
                  </div>
                  {field.placeholder && (
                    <p className="text-xs text-muted-foreground">{field.placeholder}</p>
                  )}
                  {field.options && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {field.options.slice(0, 5).map((option: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {option}
                        </Badge>
                      ))}
                      {field.options.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{field.options.length - 5} mais
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Documentos Necessários */}
          <Card>
            <CardHeader>
              <CardTitle>Documentos Necessários</CardTitle>
              <CardDescription>
                Lista de documentos que o cidadão deve anexar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {template.requiredDocs.map((doc: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <span className="text-sm">{doc}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informações Gerais */}
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
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
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  {template.estimatedTime}
                </div>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Versão</label>
                <p className="text-sm">{template.version}</p>
              </div>
            </CardContent>
          </Card>

          {/* Módulo Especializado */}
          {template.moduleType && (
            <Card>
              <CardHeader>
                <CardTitle>Módulo Especializado</CardTitle>
                <CardDescription>
                  Este template está vinculado a um módulo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                  <Badge className="mt-1">{template.moduleType}</Badge>
                </div>
                {template.moduleEntity && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Entidade</label>
                      <p className="text-sm font-mono">{template.moduleEntity}</p>
                    </div>
                  </>
                )}
                <Separator />
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <LinkIcon className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-blue-900">Persistência Automática</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Os dados serão salvos automaticamente no módulo da secretaria
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Campos</span>
                <Badge variant="secondary">{template.defaultFields.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Documentos</span>
                <Badge variant="secondary">{template.requiredDocs.length}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
