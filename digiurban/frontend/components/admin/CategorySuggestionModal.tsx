'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';
import { useCategorySuggestions } from '@/hooks/useCategorySuggestions';
import { toast } from 'sonner';

// ============================================================================
// INTERFACES
// ============================================================================

interface Category {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
}

interface Service {
  id: string;
  name: string;
  moduleType: string;
  departmentCode: string;
}

interface CategorySuggestion {
  id: string;
  serviceId: string;
  categoryId: string;
  matchType: string;
  confidence: number;
  matchDetails: any;
  status: string;
  createdAt: string;
  service: Service;
  category: Category;
}

interface CategorySuggestionModalProps {
  serviceId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onApproved?: () => void;
}

// ============================================================================
// COMPONENTE: Modal de Aprovação de Sugestões
// ============================================================================

export function CategorySuggestionModal({
  serviceId,
  isOpen,
  onClose,
  onApproved,
}: CategorySuggestionModalProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([]);
  const [reviewNotes, setReviewNotes] = useState<{ [key: string]: string }>({});

  const { getServiceSuggestions, approveSuggestion, rejectSuggestion } =
    useCategorySuggestions();

  // ========================================================================
  // EFFECT: Buscar sugestões quando serviceId mudar
  // ========================================================================
  useEffect(() => {
    if (serviceId && isOpen) {
      loadSuggestions();
    }
  }, [serviceId, isOpen]);

  // ========================================================================
  // HANDLERS
  // ========================================================================
  const loadSuggestions = async () => {
    if (!serviceId) return;

    try {
      setLoading(true);
      const data = await getServiceSuggestions(serviceId);

      if (data) {
        setSuggestions(data.pending);
      }
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error);
      toast.error('Erro ao buscar sugestões');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (suggestionId: string) => {
    try {
      await approveSuggestion(suggestionId, reviewNotes[suggestionId]);

      // Remover da lista local
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));

      // Callback
      if (onApproved) {
        onApproved();
      }

      // Se não houver mais sugestões, fechar modal
      if (suggestions.length === 1) {
        toast.success('Todas as sugestões foram processadas!');
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (error) {
      console.error('Erro ao aprovar sugestão:', error);
    }
  };

  const handleReject = async (suggestionId: string) => {
    try {
      await rejectSuggestion(suggestionId, reviewNotes[suggestionId] || 'Não adequado');

      // Remover da lista local
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));

      // Se não houver mais sugestões, fechar modal
      if (suggestions.length === 1) {
        toast.info('Todas as sugestões foram processadas');
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (error) {
      console.error('Erro ao rejeitar sugestão:', error);
    }
  };

  const handleNoteChange = (suggestionId: string, note: string) => {
    setReviewNotes((prev) => ({
      ...prev,
      [suggestionId]: note,
    }));
  };

  // ========================================================================
  // HELPERS
  // ========================================================================
  const getMatchTypeLabel = (matchType: string) => {
    const labels: Record<string, string> = {
      EXACT: 'Exato',
      PATTERN: 'Padrão',
      SEMANTIC: 'Semântico',
      MANUAL: 'Manual',
    };
    return labels[matchType] || matchType;
  };

  const getMatchTypeBadge = (matchType: string) => {
    const classes: Record<string, string> = {
      EXACT: 'bg-green-100 text-green-800',
      PATTERN: 'bg-blue-100 text-blue-800',
      SEMANTIC: 'bg-purple-100 text-purple-800',
      MANUAL: 'bg-gray-100 text-gray-800',
    };
    return classes[matchType] || 'bg-gray-100 text-gray-800';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 85) return 'bg-green-100 text-green-800';
    if (confidence >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-orange-100 text-orange-800';
  };

  // ========================================================================
  // RENDER
  // ========================================================================
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Sugestões de Categorização Inteligente
          </DialogTitle>
          <DialogDescription>
            O sistema identificou {suggestions.length} categoria(s) relacionada(s) a este serviço.
            Revise e aprove as sugestões.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
            <span className="ml-3 text-muted-foreground">Carregando sugestões...</span>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma sugestão pendente</h3>
            <p className="text-muted-foreground">
              Todas as sugestões para este serviço já foram processadas.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.id}
                className="border rounded-lg p-4 space-y-4 hover:border-purple-300 transition-colors"
              >
                {/* Cabeçalho da Sugestão */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {suggestion.category.icon && (
                      <span className="text-3xl">{suggestion.category.icon}</span>
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{suggestion.category.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {suggestion.category.description || suggestion.category.code}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 items-end">
                    <Badge className={getConfidenceBadge(suggestion.confidence)}>
                      {suggestion.confidence}% confiança
                    </Badge>
                    <Badge className={getMatchTypeBadge(suggestion.matchType)}>
                      {getMatchTypeLabel(suggestion.matchType)}
                    </Badge>
                  </div>
                </div>

                {/* Detalhes do Match */}
                {suggestion.matchDetails && (
                  <div className="bg-muted/50 rounded-md p-3 text-sm">
                    <div className="font-medium mb-1 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Detalhes da Correspondência
                    </div>
                    <div className="text-muted-foreground space-y-1">
                      {suggestion.matchDetails.matched_patterns && (
                        <div>
                          <strong>Padrões:</strong>{' '}
                          {Array.isArray(suggestion.matchDetails.matched_patterns)
                            ? suggestion.matchDetails.matched_patterns.join(', ')
                            : JSON.stringify(suggestion.matchDetails.matched_patterns)}
                        </div>
                      )}
                      {suggestion.matchDetails.reason && (
                        <div>
                          <strong>Razão:</strong> {suggestion.matchDetails.reason}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notas de Revisão */}
                <div className="space-y-2">
                  <Label htmlFor={`notes-${suggestion.id}`} className="text-sm">
                    Notas de Revisão (opcional)
                  </Label>
                  <Textarea
                    id={`notes-${suggestion.id}`}
                    placeholder="Adicione observações sobre esta categorização..."
                    value={reviewNotes[suggestion.id] || ''}
                    onChange={(e) => handleNoteChange(suggestion.id, e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                </div>

                {/* Ações */}
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReject(suggestion.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(suggestion.id)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Aprovar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>
              Sugestões aprovadas criarão vínculos permanentes entre serviço e categoria
            </span>
          </div>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
