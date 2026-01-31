'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, MapPin, User, Save, X } from 'lucide-react';

interface Equipe {
  id: string;
  nome: string;
  ine: string;
  tipo: string;
  unidade: {
    nome: string;
  };
}

interface Microarea {
  id: string;
  numero: string;
  descricao: string | null;
  acs: {
    id: string;
    nome: string;
  } | null;
}

interface Props {
  citizenId: string;
  currentEquipeId?: string | null;
  currentMicroareaId?: string | null;
  onUpdate?: () => void;
}

export function CidadaoVinculacaoESF({
  citizenId,
  currentEquipeId,
  currentMicroareaId,
  onUpdate,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [microareas, setMicroareas] = useState<Microarea[]>([]);
  const [selectedEquipe, setSelectedEquipe] = useState<Equipe | null>(null);
  const [selectedMicroarea, setSelectedMicroarea] = useState<Microarea | null>(null);

  const [formData, setFormData] = useState({
    equipeId: currentEquipeId || '',
    microareaId: currentMicroareaId || '',
  });

  useEffect(() => {
    loadEquipes();
    if (currentEquipeId) {
      loadCurrentEquipe(currentEquipeId);
      loadMicroareas(currentEquipeId);
    }
    if (currentMicroareaId) {
      loadCurrentMicroarea(currentMicroareaId);
    }
  }, [currentEquipeId, currentMicroareaId]);

  useEffect(() => {
    if (formData.equipeId) {
      loadMicroareas(formData.equipeId);
    } else {
      setMicroareas([]);
      setFormData({ ...formData, microareaId: '' });
    }
  }, [formData.equipeId]);

  const loadEquipes = async () => {
    try {
      const response = await fetch('/api/apps/saude/cadastros/equipes?ativo=true', {
        credentials: 'include',
      });
      const data = await response.json();
      setEquipes(data);
    } catch (error) {
      console.error('Erro ao carregar equipes:', error);
    }
  };

  const loadCurrentEquipe = async (equipeId: string) => {
    try {
      const response = await fetch(`/api/apps/saude/cadastros/equipes/${equipeId}`, {
        credentials: 'include',
      });
      const data = await response.json();
      setSelectedEquipe(data);
    } catch (error) {
      console.error('Erro ao carregar equipe atual:', error);
    }
  };

  const loadMicroareas = async (equipeId: string) => {
    try {
      const response = await fetch(
        `/api/apps/saude/cadastros/equipes/${equipeId}/microareas`,
        {
          credentials: 'include',
        }
      );
      const data = await response.json();
      setMicroareas(data.filter((m: any) => m.ativo));
    } catch (error) {
      console.error('Erro ao carregar microáreas:', error);
    }
  };

  const loadCurrentMicroarea = async (microareaId: string) => {
    try {
      const response = await fetch(
        `/api/apps/saude/cadastros/microareas/${microareaId}`,
        {
          credentials: 'include',
        }
      );
      const data = await response.json();
      setSelectedMicroarea(data);
    } catch (error) {
      console.error('Erro ao carregar microárea atual:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/citizens/${citizenId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          equipeId: formData.equipeId || null,
          microareaId: formData.microareaId || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar vinculação');
      }

      setEditing(false);
      onUpdate?.();

      // Recarregar dados atuais
      if (formData.equipeId) {
        loadCurrentEquipe(formData.equipeId);
      } else {
        setSelectedEquipe(null);
      }

      if (formData.microareaId) {
        loadCurrentMicroarea(formData.microareaId);
      } else {
        setSelectedMicroarea(null);
      }
    } catch (error) {
      console.error('Erro ao salvar vinculação:', error);
      alert('Erro ao salvar vinculação ESF');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      equipeId: currentEquipeId || '',
      microareaId: currentMicroareaId || '',
    });
    setEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Vinculação ESF (Estratégia Saúde da Família)
          </CardTitle>
          {!editing && (
            <Button size="sm" onClick={() => setEditing(true)}>
              Editar Vinculação
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>ℹ️ Sobre a Vinculação ESF:</strong> O cidadão é vinculado a uma{' '}
                <strong>equipe</strong> e uma <strong>microárea</strong> com base no seu
                território de residência. Esta vinculação permite o atendimento territorializado
                e o acompanhamento pelo Agente Comunitário de Saúde (ACS).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipe">Equipe de Saúde da Família</Label>
              <Select
                value={formData.equipeId}
                onValueChange={(value) =>
                  setFormData({ equipeId: value, microareaId: '' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma equipe..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem vinculação</SelectItem>
                  {equipes.map((equipe) => (
                    <SelectItem key={equipe.id} value={equipe.id}>
                      {equipe.nome} - {equipe.unidade.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.equipeId && (
              <div className="space-y-2">
                <Label htmlFor="microarea">Microárea</Label>
                <Select
                  value={formData.microareaId}
                  onValueChange={(value) => setFormData({ ...formData, microareaId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma microárea..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem microárea</SelectItem>
                    {microareas.map((microarea) => (
                      <SelectItem key={microarea.id} value={microarea.id}>
                        Microárea {microarea.numero}
                        {microarea.descricao && ` - ${microarea.descricao}`}
                        {microarea.acs && ` (ACS: ${microarea.acs.nome})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={loading}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedEquipe ? (
              <>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Equipe:</span>
                    </div>
                    <div className="ml-6">
                      <div className="font-semibold">{selectedEquipe.nome}</div>
                      <div className="text-sm text-gray-600">
                        INE: {selectedEquipe.ine}
                      </div>
                      <div className="text-sm text-gray-600">
                        {selectedEquipe.unidade.nome}
                      </div>
                      <Badge className="mt-1 bg-green-100 text-green-800">
                        {selectedEquipe.tipo}
                      </Badge>
                    </div>
                  </div>
                </div>

                {selectedMicroarea && (
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-700">
                          Microárea:
                        </span>
                      </div>
                      <div className="ml-6">
                        <div className="font-semibold">
                          Microárea {selectedMicroarea.numero}
                        </div>
                        {selectedMicroarea.descricao && (
                          <div className="text-sm text-gray-600">
                            {selectedMicroarea.descricao}
                          </div>
                        )}
                        {selectedMicroarea.acs && (
                          <div className="flex items-center gap-2 mt-1">
                            <User className="h-3 w-3 text-blue-600" />
                            <span className="text-sm text-gray-600">
                              ACS: {selectedMicroarea.acs.nome}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Cidadão não vinculado a nenhuma equipe ESF</p>
                <p className="text-sm mt-1">
                  Clique em "Editar Vinculação" para vincular a uma equipe
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
