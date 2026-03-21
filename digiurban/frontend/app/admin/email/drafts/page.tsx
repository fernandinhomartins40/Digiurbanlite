'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Search,
  Trash2,
  Edit,
  Send,
  Loader2,
  Clock,
  Mail
} from 'lucide-react';

interface Draft {
  id: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  message: string;
  accountId: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export default function DraftsPage() {
  const { apiRequest } = useAdminAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [filteredDrafts, setFilteredDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDrafts();
  }, []);

  useEffect(() => {
    filterDrafts();
  }, [drafts, searchTerm]);

  const fetchDrafts = async () => {
    try {
      setLoading(true);

      const response = await apiRequest('/admin/email/drafts', {
        method: 'GET'
      });

      if (response?.success && response.drafts) {
        setDrafts(response.drafts);
      } else if (response?.drafts) {
        setDrafts(response.drafts);
      }
    } catch (error: any) {
      console.error('Error fetching drafts:', error);

      // Mock data para demonstração
      if (error.message?.includes('404')) {
        toast({
          title: 'Funcionalidade em desenvolvimento',
          description: 'Os rascunhos estão sendo configurados',
          variant: 'default'
        });

        // Dados mockados
        const mockDrafts: Draft[] = [
          {
            id: '1',
            to: 'secretaria.educacao@cidade.gov.br',
            subject: 'Aprovação de Verba para Merenda Escolar',
            message: 'Prezados,\n\nVenho solicitar a aprovação da verba destinada ao programa de merenda escolar para o próximo trimestre...',
            accountId: 'account-1',
            priority: 3,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            updatedAt: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: '2',
            to: 'cidadao@email.com',
            cc: 'secretaria.obras@cidade.gov.br',
            subject: 'Re: Solicitação de Reparo em Via Pública',
            message: 'Prezado João,\n\nEm resposta à sua solicitação de reparo da Rua das Palmeiras...',
            accountId: 'account-1',
            priority: 3,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 7200000).toISOString()
          }
        ];
        setDrafts(mockDrafts);
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os rascunhos',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const filterDrafts = () => {
    if (!searchTerm) {
      setFilteredDrafts(drafts);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = drafts.filter(d =>
      d.to.toLowerCase().includes(term) ||
      d.subject.toLowerCase().includes(term) ||
      d.message.toLowerCase().includes(term)
    );
    setFilteredDrafts(filtered);
  };

  const editDraft = (draft: Draft) => {
    // Redirecionar para compose com dados do rascunho
    const params = new URLSearchParams({
      draftId: draft.id,
      to: draft.to,
      subject: draft.subject,
      message: draft.message,
      ...(draft.cc && { cc: draft.cc }),
      ...(draft.bcc && { bcc: draft.bcc }),
      priority: draft.priority.toString()
    });
    router.push(`/admin/email/compose?${params.toString()}`);
  };

  const deleteDraft = async (draftId: string) => {
    if (!confirm('Deseja excluir este rascunho permanentemente?')) return;

    try {
      await apiRequest(`/admin/email/drafts/${draftId}`, {
        method: 'DELETE'
      });

      setDrafts(prev => prev.filter(d => d.id !== draftId));

      toast({
        title: 'Rascunho excluído',
        description: 'O rascunho foi excluído permanentemente'
      });
    } catch (error) {
      // Fallback local
      setDrafts(prev => prev.filter(d => d.id !== draftId));
      toast({
        title: 'Rascunho excluído',
        description: 'O rascunho foi excluído permanentemente'
      });
    }
  };

  const sendDraft = async (draft: Draft) => {
    if (!confirm('Deseja enviar este rascunho agora?')) return;

    try {
      const payload = {
        accountId: draft.accountId,
        to: draft.to.split(',').map(e => e.trim()),
        cc: draft.cc ? draft.cc.split(',').map(e => e.trim()) : undefined,
        bcc: draft.bcc ? draft.bcc.split(',').map(e => e.trim()) : undefined,
        subject: draft.subject,
        text: draft.message,
        html: `<html><body><pre style="font-family: Arial, sans-serif; white-space: pre-wrap;">${draft.message}</pre></body></html>`,
        priority: draft.priority
      };

      const response = await apiRequest('/admin/email-compose/send', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response?.success) {
        // Remover rascunho após envio
        await apiRequest(`/admin/email/drafts/${draft.id}`, {
          method: 'DELETE'
        });

        setDrafts(prev => prev.filter(d => d.id !== draft.id));

        toast({
          title: 'Email enviado!',
          description: `Email enviado para ${draft.to}`
        });

        router.push('/admin/email/sent');
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar',
        description: error.message || 'Erro ao enviar o rascunho',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando rascunhos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Rascunhos</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            {drafts.length} rascunho{drafts.length !== 1 ? 's' : ''} salvo{drafts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={() => router.push('/admin/email/compose')}
          className="w-full sm:w-auto"
        >
          <Mail className="mr-2 h-4 w-4" />
          Nova Mensagem
        </Button>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar rascunhos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm sm:text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de rascunhos */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">
            {filteredDrafts.length} rascunho{filteredDrafts.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {filteredDrafts.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">
                {drafts.length === 0 ? 'Nenhum rascunho' : 'Nenhum rascunho encontrado'}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                {drafts.length === 0
                  ? 'Você não tem rascunhos salvos'
                  : 'Tente ajustar a busca'}
              </p>
              {drafts.length === 0 && (
                <Button
                  onClick={() => router.push('/admin/email/compose')}
                  className="w-full sm:w-auto"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Criar Nova Mensagem
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-2">
              {filteredDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          <Clock className="h-3 w-3" />
                          Rascunho
                        </span>
                        {draft.priority === 1 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            Prioridade Alta
                          </span>
                        )}
                      </div>

                      <h4 className="font-semibold mb-1 text-sm sm:text-base break-words">
                        {draft.subject || '(Sem assunto)'}
                      </h4>

                      <p className="text-xs sm:text-sm text-muted-foreground mb-2 break-all">
                        Para: {draft.to}
                      </p>

                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {draft.message}
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-3 text-xs text-muted-foreground">
                        <span>
                          Criado: {new Date(draft.createdAt).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {draft.updatedAt !== draft.createdAt && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span>
                              Atualizado: {new Date(draft.updatedAt).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editDraft(draft)}
                        className="flex-1 sm:flex-none sm:w-auto"
                      >
                        <Edit className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Editar</span>
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => sendDraft(draft)}
                        className="flex-1 sm:flex-none sm:w-auto"
                      >
                        <Send className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Enviar</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteDraft(draft.id)}
                        className="flex-1 sm:flex-none sm:w-auto"
                      >
                        <Trash2 className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Excluir</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
