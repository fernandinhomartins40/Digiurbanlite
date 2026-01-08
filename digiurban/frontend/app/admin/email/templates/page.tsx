'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  X,
  Loader2,
  Send
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  textContent: string;
  htmlContent?: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TemplatesPage() {
  const { apiRequest } = useAdminAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    textContent: '',
    category: ''
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);

      const response = await apiRequest('/admin/email-service/templates', {
        method: 'GET'
      });

      if (response && Array.isArray(response)) {
        setTemplates(response);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os templates',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.subject || !formData.textContent) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingTemplate) {
        // Atualizar
        const response = await apiRequest(`/admin/email-service/templates/${editingTemplate.name}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });

        if (response?.success) {
          toast({
            title: 'Template atualizado',
            description: 'O template foi atualizado com sucesso'
          });
          fetchTemplates();
          closeModal();
        }
      } else {
        // Criar
        const response = await apiRequest('/admin/email/templates', {
          method: 'POST',
          body: JSON.stringify(formData)
        });

        if (response?.success) {
          toast({
            title: 'Template criado',
            description: 'O template foi criado com sucesso'
          });
          fetchTemplates();
          closeModal();
        }
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar template',
        variant: 'destructive'
      });
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Deseja excluir este template permanentemente?')) return;

    try {
      await apiRequest(`/admin/email/templates/${templateId}`, {
        method: 'DELETE'
      });

      setTemplates(prev => prev.filter(t => t.id !== templateId));

      toast({
        title: 'Template excluído',
        description: 'O template foi excluído com sucesso'
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir template',
        variant: 'destructive'
      });
    }
  };

  const duplicateTemplate = (template: EmailTemplate) => {
    setFormData({
      name: `${template.name} (Cópia)`,
      subject: template.subject,
      textContent: template.textContent,
      category: template.category || ''
    });
    setEditingTemplate(null);
    setShowModal(true);
  };

  const useTemplate = (template: EmailTemplate) => {
    router.push(`/admin/email/compose?templateId=${template.id}&subject=${encodeURIComponent(template.subject)}&message=${encodeURIComponent(template.textContent)}`);
  };

  const openNewModal = () => {
    setFormData({
      name: '',
      subject: '',
      textContent: '',
      category: ''
    });
    setEditingTemplate(null);
    setShowModal(true);
  };

  const openEditModal = (template: EmailTemplate) => {
    setFormData({
      name: template.name,
      subject: template.subject,
      textContent: template.textContent,
      category: template.category || ''
    });
    setEditingTemplate(template);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
    setFormData({
      name: '',
      subject: '',
      textContent: '',
      category: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Templates de Email</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            {templates.length} template{templates.length !== 1 ? 's' : ''} disponível{templates.length !== 1 ? 'eis' : ''}
          </p>
        </div>
        <Button onClick={openNewModal} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Template
        </Button>
      </div>

      {/* Grid de templates */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Nenhum template criado</h3>
              <p className="text-muted-foreground mb-4 text-center max-w-md">
                Crie templates para facilitar o envio de emails recorrentes
              </p>
              <Button onClick={openNewModal}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg truncate">{template.name}</CardTitle>
                    {template.category && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        {template.category}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Assunto:</p>
                  <p className="text-xs sm:text-sm truncate">{template.subject}</p>
                </div>

                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Conteúdo:</p>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3">
                    {template.textContent}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-3 border-t">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 min-w-[100px]"
                    onClick={() => useTemplate(template)}
                  >
                    <Send className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">Usar</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewTemplate(template)}
                    title="Visualizar"
                  >
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(template)}
                    title="Editar"
                  >
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => duplicateTemplate(template)}
                    title="Duplicar"
                  >
                    <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteTemplate(template.id)}
                    title="Excluir"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start gap-4">
                <CardTitle className="text-lg sm:text-xl">
                  {editingTemplate ? 'Editar Template' : 'Novo Template'}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={closeModal}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm sm:text-base">Nome do Template *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Confirmação de Protocolo"
                    className="text-sm sm:text-base"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm sm:text-base">Categoria</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Ex: Atendimento, Notificações, etc"
                    className="text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-sm sm:text-base">Assunto *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Assunto do email"
                    className="text-sm sm:text-base"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="textContent" className="text-sm sm:text-base">Conteúdo *</Label>
                  <Textarea
                    id="textContent"
                    value={formData.textContent}
                    onChange={(e) => setFormData(prev => ({ ...prev, textContent: e.target.value }))}
                    placeholder="Corpo do email..."
                    rows={12}
                    className="text-sm sm:text-base"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Você pode usar variáveis como {"{{nome}}"}, {"{{protocolo}}"}, etc
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={closeModal} className="flex-1 w-full">
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 w-full">
                    {editingTemplate ? 'Atualizar' : 'Criar'} Template
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Preview */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start gap-4">
                <CardTitle className="text-lg sm:text-xl">{previewTemplate.name}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setPreviewTemplate(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm sm:text-base">Assunto:</Label>
                <p className="mt-1 font-medium text-sm sm:text-base">{previewTemplate.subject}</p>
              </div>

              <div>
                <Label className="text-sm sm:text-base">Conteúdo:</Label>
                <div className="mt-2 p-3 sm:p-4 bg-gray-50 rounded-lg border overflow-x-auto">
                  <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm">
                    {previewTemplate.textContent}
                  </pre>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                <Button
                  variant="default"
                  onClick={() => {
                    useTemplate(previewTemplate);
                    setPreviewTemplate(null);
                  }}
                  className="flex-1 w-full"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Usar Template
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPreviewTemplate(null)}
                  className="w-full sm:w-auto"
                >
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
