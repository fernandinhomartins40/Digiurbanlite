'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Eye, Plus, X } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string | null;
  variables: string[];
  category: string | null;
  isActive: boolean;
}

interface TemplateEditorProps {
  template: EmailTemplate | null;
  onSave: (data: Partial<EmailTemplate>) => void;
  onCancel: () => void;
}

export function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps) {
  const [name, setName] = useState(template?.name || '');
  const [subject, setSubject] = useState(template?.subject || '');
  const [htmlContent, setHtmlContent] = useState(template?.htmlContent || '');
  const [textContent, setTextContent] = useState(template?.textContent || '');
  const [category, setCategory] = useState(template?.category || 'custom');
  const [isActive, setIsActive] = useState(template?.isActive ?? true);
  const [variables, setVariables] = useState<string[]>(template?.variables || []);
  const [newVariable, setNewVariable] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');

  useEffect(() => {
    // Extract variables from content
    const extractedVars = new Set<string>();
    const regex = /\{\{(\w+)\}\}/g;

    let match;
    while ((match = regex.exec(subject)) !== null) {
      extractedVars.add(match[1]);
    }
    while ((match = regex.exec(htmlContent)) !== null) {
      extractedVars.add(match[1]);
    }
    while ((match = regex.exec(textContent)) !== null) {
      extractedVars.add(match[1]);
    }

    setVariables(Array.from(extractedVars));
  }, [subject, htmlContent, textContent]);

  useEffect(() => {
    // Update preview with sample data
    let preview = htmlContent;
    variables.forEach(variable => {
      const sampleValue = getSampleValue(variable);
      preview = preview.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), sampleValue);
    });
    setPreviewHtml(preview);
  }, [htmlContent, variables]);

  const getSampleValue = (variable: string): string => {
    const samples: Record<string, string> = {
      citizenName: 'João Silva',
      userName: 'João Silva',
      tenantName: 'DigiUrban',
      siteName: 'Portal do Cidadão',
      siteUrl: 'https://digiurban.com.br',
      supportEmail: 'suporte@digiurban.com.br',
      protocolNumber: '2024-0001',
      serviceName: 'Solicitação de Exemplo',
      confirmationUrl: 'https://digiurban.com.br/confirm/123456',
      recoveryUrl: 'https://digiurban.com.br/recover/123456',
      trackingUrl: 'https://digiurban.com.br/protocol/2024-0001',
      status: 'Em andamento',
      createdAt: new Date().toLocaleDateString('pt-BR'),
      comment: 'Esta é uma observação de exemplo.',
    };

    return samples[variable] || `[${variable}]`;
  };

  const handleAddVariable = () => {
    if (newVariable && !variables.includes(newVariable)) {
      setVariables([...variables, newVariable]);
      setNewVariable('');
    }
  };

  const handleRemoveVariable = (variable: string) => {
    setVariables(variables.filter(v => v !== variable));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: Partial<EmailTemplate> = {
      name,
      subject,
      htmlContent,
      textContent,
      category,
      isActive,
      variables,
    };

    onSave(data);
  };

  const insertVariable = (variable: string, target: 'subject' | 'html' | 'text') => {
    const placeholder = `{{${variable}}}`;

    if (target === 'subject') {
      setSubject(subject + placeholder);
    } else if (target === 'html') {
      setHtmlContent(htmlContent + placeholder);
    } else {
      setTextContent(textContent + placeholder);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Template *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex: welcome-email"
            required
          />
          <p className="text-xs text-muted-foreground">
            Identificador único (sem espaços, use hífens)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="ex: transactional"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Assunto do Email *</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Ex: Bem-vindo ao {{tenantName}}"
          required
        />
      </div>

      {/* Variables */}
      <div className="space-y-2">
        <Label>Variáveis Detectadas</Label>
        <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md min-h-[60px]">
          {variables.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma variável detectada. Use {`{{nomeVariavel}}`} no conteúdo.
            </p>
          ) : (
            variables.map((variable) => (
              <Badge key={variable} variant="secondary">
                {`{{${variable}}}`}
                <button
                  type="button"
                  onClick={() => handleRemoveVariable(variable)}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
      </div>

      {/* Content Editor */}
      <Tabs defaultValue="html" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="html">
            <Code className="mr-2 h-4 w-4" />
            HTML
          </TabsTrigger>
          <TabsTrigger value="text">Texto Simples</TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="html" className="space-y-2">
          <Label htmlFor="htmlContent">Conteúdo HTML *</Label>
          <Textarea
            id="htmlContent"
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            placeholder="Digite o HTML do email..."
            className="font-mono text-sm min-h-[400px]"
            required
          />
          <div className="flex gap-2 flex-wrap">
            {variables.map((variable) => (
              <Button
                key={variable}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => insertVariable(variable, 'html')}
              >
                <Plus className="mr-1 h-3 w-3" />
                {`{{${variable}}}`}
              </Button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="text" className="space-y-2">
          <Label htmlFor="textContent">Versão em Texto Simples</Label>
          <Textarea
            id="textContent"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="Versão em texto simples (fallback para clientes sem suporte HTML)"
            className="min-h-[400px]"
          />
          <div className="flex gap-2 flex-wrap">
            {variables.map((variable) => (
              <Button
                key={variable}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => insertVariable(variable, 'text')}
              >
                <Plus className="mr-1 h-3 w-3" />
                {`{{${variable}}}`}
              </Button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <div className="border rounded-md p-4 bg-white min-h-[400px]">
            <div className="mb-4 pb-4 border-b">
              <p className="text-sm font-medium">Assunto:</p>
              <p className="text-lg">
                {subject.replace(/\{\{(\w+)\}\}/g, (_, v) => getSampleValue(v))}
              </p>
            </div>
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Status */}
      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={isActive}
          onCheckedChange={setIsActive}
        />
        <Label htmlFor="isActive">Template ativo</Label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {template ? 'Atualizar Template' : 'Criar Template'}
        </Button>
      </div>
    </form>
  );
}
