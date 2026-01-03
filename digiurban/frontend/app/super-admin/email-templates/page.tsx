'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Mail, Edit, Copy, Trash2, Send, Eye, Power } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { TemplateEditor } from './components/TemplateEditor';
import { TemplatePreview } from './components/TemplatePreview';
import { TestEmailDialog } from './components/TestEmailDialog';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string | null;
  variables: string[];
  category: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/email-templates');
      const data = await response.json();

      if (data.success) {
        setTemplates(data.data);
      } else {
        toast.error('Erro ao carregar templates');
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedTemplate(null);
    setIsCreating(true);
    setEditorOpen(true);
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsCreating(false);
    setEditorOpen(true);
  };

  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const handleTestEmail = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setTestEmailOpen(true);
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    try {
      const response = await fetch(`/api/email-templates/${template.id}/duplicate`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Template duplicado com sucesso');
        loadTemplates();
      } else {
        toast.error(data.message || 'Erro ao duplicar template');
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Erro ao duplicar template');
    }
  };

  const handleToggleActive = async (template: EmailTemplate) => {
    try {
      const response = await fetch(`/api/email-templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !template.isActive }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Template ${template.isActive ? 'desativado' : 'ativado'} com sucesso`);
        loadTemplates();
      } else {
        toast.error(data.message || 'Erro ao atualizar template');
      }
    } catch (error) {
      console.error('Error toggling template:', error);
      toast.error('Erro ao atualizar template');
    }
  };

  const handleDelete = async (template: EmailTemplate) => {
    if (!confirm(`Tem certeza que deseja deletar o template "${template.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/email-templates/${template.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Template deletado com sucesso');
        loadTemplates();
      } else {
        toast.error(data.message || 'Erro ao deletar template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Erro ao deletar template');
    }
  };

  const handleSaveTemplate = async (templateData: Partial<EmailTemplate>) => {
    try {
      const url = selectedTemplate
        ? `/api/email-templates/${selectedTemplate.id}`
        : '/api/email-templates';

      const method = selectedTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Template ${selectedTemplate ? 'atualizado' : 'criado'} com sucesso`);
        loadTemplates();
        setEditorOpen(false);
        setSelectedTemplate(null);
      } else {
        toast.error(data.message || 'Erro ao salvar template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Erro ao salvar template');
    }
  };

  const systemTemplates = ['user-confirmation', 'password-recovery', 'protocol-confirmation', 'protocol-update', 'citizen-welcome'];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Templates de Email</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie templates de emails transacionais
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Templates Cadastrados</CardTitle>
          <CardDescription>
            {templates.length} template(s) disponível(is)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando templates...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum template cadastrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Variáveis</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => {
                  const isSystem = systemTemplates.includes(template.name);

                  return (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {template.name}
                          {isSystem && (
                            <Badge variant="secondary" className="text-xs">
                              Sistema
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {template.subject}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {template.category || 'custom'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {template.variables.slice(0, 3).map((variable) => (
                            <Badge key={variable} variant="secondary" className="text-xs">
                              {`{{${variable}}}`}
                            </Badge>
                          ))}
                          {template.variables.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.variables.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={template.isActive ? 'default' : 'secondary'}
                          className={template.isActive ? 'bg-green-500' : ''}
                        >
                          {template.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePreview(template)}
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(template)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleTestEmail(template)}
                            title="Enviar teste"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDuplicate(template)}
                            title="Duplicar"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleActive(template)}
                            title={template.isActive ? 'Desativar' : 'Ativar'}
                          >
                            <Power
                              className={`h-4 w-4 ${
                                template.isActive ? 'text-green-500' : 'text-gray-400'
                              }`}
                            />
                          </Button>
                          {!isSystem && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(template)}
                              title="Deletar"
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? 'Novo Template' : `Editar Template: ${selectedTemplate?.name}`}
            </DialogTitle>
            <DialogDescription>
              Configure o template de email. Use variáveis no formato {`{{variableName}}`}
            </DialogDescription>
          </DialogHeader>
          <TemplateEditor
            template={selectedTemplate}
            onSave={handleSaveTemplate}
            onCancel={() => setEditorOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Visualização do template com variáveis de exemplo
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && <TemplatePreview template={selectedTemplate} />}
        </DialogContent>
      </Dialog>

      {/* Test Email Dialog */}
      {selectedTemplate && (
        <TestEmailDialog
          template={selectedTemplate}
          open={testEmailOpen}
          onOpenChange={setTestEmailOpen}
        />
      )}
    </div>
  );
}
