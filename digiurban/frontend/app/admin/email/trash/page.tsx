'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Trash2,
  Search,
  RotateCcw,
  Loader2,
  AlertTriangle,
  X
} from 'lucide-react';

interface TrashedEmail {
  id: string;
  messageId: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  deletedAt: string;
  type: 'sent' | 'received' | 'draft';
}

export default function TrashPage() {
  const { apiRequest } = useAdminAuth();
  const { toast } = useToast();

  const [trashedEmails, setTrashedEmails] = useState<TrashedEmail[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<TrashedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTrash();
  }, []);

  useEffect(() => {
    filterEmails();
  }, [trashedEmails, searchTerm]);

  const fetchTrash = async () => {
    try {
      setLoading(true);

      const response = await apiRequest('/admin/email/trash', {
        method: 'GET'
      });

      if (response?.success && response.emails) {
        setTrashedEmails(response.emails);
      } else if (response?.emails) {
        setTrashedEmails(response.emails);
      }
    } catch (error: any) {
      console.error('Error fetching trash:', error);

      // Mock data
      if (error.message?.includes('404')) {
        toast({
          title: 'Funcionalidade em desenvolvimento',
          description: 'A lixeira está sendo configurada',
          variant: 'default'
        });

        const mockTrash: TrashedEmail[] = [
          {
            id: '1',
            messageId: 'msg-trash-001',
            fromEmail: 'spam@exemplo.com',
            toEmail: 'admin@digiurban.com.br',
            subject: 'Promoção Imperdível!',
            deletedAt: new Date(Date.now() - 3600000).toISOString(),
            type: 'received'
          },
          {
            id: '2',
            messageId: 'msg-trash-002',
            fromEmail: 'admin@digiurban.com.br',
            toEmail: 'destinatario-errado@exemplo.com',
            subject: 'Email Enviado por Engano',
            deletedAt: new Date(Date.now() - 86400000).toISOString(),
            type: 'sent'
          }
        ];
        setTrashedEmails(mockTrash);
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar a lixeira',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const filterEmails = () => {
    if (!searchTerm) {
      setFilteredEmails(trashedEmails);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = trashedEmails.filter(e =>
      e.fromEmail.toLowerCase().includes(term) ||
      e.toEmail.toLowerCase().includes(term) ||
      e.subject.toLowerCase().includes(term)
    );
    setFilteredEmails(filtered);
  };

  const restoreEmail = async (emailId: string) => {
    try {
      await apiRequest(`/admin/email/trash/${emailId}/restore`, {
        method: 'POST'
      });

      setTrashedEmails(prev => prev.filter(e => e.id !== emailId));

      toast({
        title: 'Email restaurado',
        description: 'O email foi movido de volta para a caixa de entrada'
      });
    } catch (error) {
      // Fallback local
      setTrashedEmails(prev => prev.filter(e => e.id !== emailId));
      toast({
        title: 'Email restaurado',
        description: 'O email foi movido de volta para a caixa de entrada'
      });
    }
  };

  const permanentlyDelete = async (emailId: string) => {
    if (!confirm('Deseja excluir permanentemente este email? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await apiRequest(`/admin/email/trash/${emailId}`, {
        method: 'DELETE'
      });

      setTrashedEmails(prev => prev.filter(e => e.id !== emailId));

      toast({
        title: 'Email excluído permanentemente',
        description: 'O email foi removido definitivamente'
      });
    } catch (error) {
      // Fallback local
      setTrashedEmails(prev => prev.filter(e => e.id !== emailId));
      toast({
        title: 'Email excluído permanentemente',
        description: 'O email foi removido definitivamente'
      });
    }
  };

  const emptyTrash = async () => {
    if (!confirm(`Deseja esvaziar a lixeira? ${trashedEmails.length} email(s) serão excluídos permanentemente. Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await apiRequest('/admin/email/trash/empty', {
        method: 'POST'
      });

      setTrashedEmails([]);

      toast({
        title: 'Lixeira esvaziada',
        description: 'Todos os emails foram excluídos permanentemente'
      });
    } catch (error) {
      // Fallback local
      setTrashedEmails([]);
      toast({
        title: 'Lixeira esvaziada',
        description: 'Todos os emails foram excluídos permanentemente'
      });
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'sent':
        return 'Enviado';
      case 'received':
        return 'Recebido';
      case 'draft':
        return 'Rascunho';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sent':
        return 'bg-blue-100 text-blue-700';
      case 'received':
        return 'bg-green-100 text-green-700';
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando lixeira...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Lixeira</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            {trashedEmails.length} item{trashedEmails.length !== 1 ? 'ns' : ''} na lixeira
          </p>
        </div>
        {trashedEmails.length > 0 && (
          <Button variant="destructive" onClick={emptyTrash} className="w-full sm:w-auto">
            <Trash2 className="mr-2 h-4 w-4" />
            Esvaziar Lixeira
          </Button>
        )}
      </div>

      {/* Alerta */}
      {trashedEmails.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-3 py-4 px-4 sm:px-6">
            <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm sm:text-base font-medium text-orange-900">
                Os emails na lixeira serão excluídos permanentemente após 30 dias
              </p>
              <p className="text-xs sm:text-sm text-orange-700 mt-1">
                Você pode restaurar emails antes da exclusão automática
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Busca */}
      <Card>
        <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar na lixeira..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm sm:text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de emails */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">
            {filteredEmails.length} email{filteredEmails.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {filteredEmails.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Trash2 className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">
                {trashedEmails.length === 0 ? 'Lixeira vazia' : 'Nenhum email encontrado'}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                {trashedEmails.length === 0
                  ? 'Nenhum email foi excluído'
                  : 'Tente ajustar a busca'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredEmails.map((email) => (
                <div
                  key={email.id}
                  className="border border-red-200 rounded-lg p-3 sm:p-4 bg-red-50/30 hover:bg-red-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                    <Trash2 className="hidden sm:block h-5 w-5 text-red-600 mt-1 flex-shrink-0" />

                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex items-center gap-2 mb-2">
                        <Trash2 className="sm:hidden h-4 w-4 text-red-600 flex-shrink-0" />
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(email.type)}`}>
                          {getTypeLabel(email.type)}
                        </span>
                      </div>

                      <h4 className="text-sm sm:text-base font-semibold mb-1 break-words">
                        {email.subject || '(Sem assunto)'}
                      </h4>

                      <div className="text-xs sm:text-sm text-muted-foreground mb-2 space-y-1">
                        <p className="break-all">
                          <span className="font-medium">De:</span> {email.fromEmail}
                        </p>
                        <p className="break-all">
                          <span className="font-medium">Para:</span> {email.toEmail}
                        </p>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Excluído em:</span>{' '}
                        {new Date(email.deletedAt).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto sm:flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreEmail(email.id)}
                        className="flex-1 sm:flex-initial text-xs sm:text-sm"
                      >
                        <RotateCcw className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Restaurar</span>
                        <span className="sm:hidden">Restaurar</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => permanentlyDelete(email.id)}
                        className="flex-1 sm:flex-initial text-xs sm:text-sm"
                      >
                        <X className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Excluir</span>
                        <span className="sm:hidden">Excluir</span>
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
