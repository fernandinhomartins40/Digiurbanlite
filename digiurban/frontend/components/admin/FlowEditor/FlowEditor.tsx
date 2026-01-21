'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Code, CheckCircle, AlertCircle } from 'lucide-react';

interface FlowEditorProps {
  flowId?: string;
  initialData?: any;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

interface ValidationError {
  path: string;
  message: string;
}

export default function FlowEditor({
  flowId,
  initialData,
  onSave,
  onCancel,
}: FlowEditorProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    version: '1.0.0',
    isActive: true,
    isDefault: false,
    metadata: {
      icon: '📋',
      color: '#4CAF50',
      category: 'general',
    },
  });
  const [jsonContent, setJsonContent] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        version: initialData.version || '1.0.0',
        isActive: initialData.isActive ?? true,
        isDefault: initialData.isDefault ?? false,
        metadata: initialData.metadata || {
          icon: '📋',
          color: '#4CAF50',
          category: 'general',
        },
      });

      const fullJson = {
        name: initialData.name,
        description: initialData.description,
        version: initialData.version,
        metadata: initialData.metadata,
        nodes: initialData.nodes || [],
      };

      setJsonContent(JSON.stringify(fullJson, null, 2));
    } else {
      const template = {
        name: 'novo_fluxo',
        description: 'Descrição do fluxo',
        version: '1.0.0',
        metadata: {
          icon: '📋',
          color: '#4CAF50',
          category: 'general',
        },
        nodes: [
          {
            id: 'start',
            type: 'message',
            config: {
              text: 'Mensagem inicial',
            },
            transitions: [{ to: 'end' }],
          },
          {
            id: 'end',
            type: 'end',
            config: {
              message: 'Fim do fluxo',
              returnToMain: true,
            },
          },
        ],
      };
      setJsonContent(JSON.stringify(template, null, 2));
    }
  }, [initialData]);

  const validateFlowDefinition = (json: any): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!json.name || typeof json.name !== 'string') {
      errors.push({ path: 'name', message: 'Nome é obrigatório' });
    }

    if (!json.description || typeof json.description !== 'string') {
      errors.push({ path: 'description', message: 'Descrição é obrigatória' });
    }

    if (!json.version || typeof json.version !== 'string') {
      errors.push({ path: 'version', message: 'Versão é obrigatória' });
    }

    if (!json.nodes || !Array.isArray(json.nodes)) {
      errors.push({ path: 'nodes', message: 'Nodes deve ser um array' });
      return errors;
    }

    if (json.nodes.length === 0) {
      errors.push({ path: 'nodes', message: 'Deve haver pelo menos um nodo' });
      return errors;
    }

    const nodeIds = new Set<string>();
    json.nodes.forEach((node: any, index: number) => {
      if (!node.id) {
        errors.push({
          path: `nodes[${index}].id`,
          message: 'ID do nodo é obrigatório',
        });
      } else if (nodeIds.has(node.id)) {
        errors.push({
          path: `nodes[${index}].id`,
          message: `ID duplicado: ${node.id}`,
        });
      } else {
        nodeIds.add(node.id);
      }

      if (!node.type) {
        errors.push({
          path: `nodes[${index}].type`,
          message: 'Tipo do nodo é obrigatório',
        });
      }

      const validTypes = [
        'message',
        'question',
        'menu',
        'action',
        'condition',
        'form',
        'upload',
        'location',
        'end',
      ];
      if (node.type && !validTypes.includes(node.type)) {
        errors.push({
          path: `nodes[${index}].type`,
          message: `Tipo inválido: ${node.type}`,
        });
      }

      if (!node.config) {
        errors.push({
          path: `nodes[${index}].config`,
          message: 'Config é obrigatório',
        });
      }

      if (node.type !== 'end') {
        if (!node.transitions || !Array.isArray(node.transitions)) {
          errors.push({
            path: `nodes[${index}].transitions`,
            message: 'Transitions deve ser um array',
          });
        } else if (node.transitions.length === 0) {
          errors.push({
            path: `nodes[${index}].transitions`,
            message: 'Deve haver pelo menos uma transição (exceto nodos END)',
          });
        }
      }
    });

    json.nodes.forEach((node: any, index: number) => {
      if (node.transitions) {
        node.transitions.forEach((transition: any, tIndex: number) => {
          if (!transition.to) {
            errors.push({
              path: `nodes[${index}].transitions[${tIndex}].to`,
              message: 'Destino da transição é obrigatório',
            });
          } else if (!nodeIds.has(transition.to)) {
            errors.push({
              path: `nodes[${index}].transitions[${tIndex}].to`,
              message: `Nodo de destino não existe: ${transition.to}`,
            });
          }
        });
      }
    });

    return errors;
  };

  const handleValidate = () => {
    try {
      const parsed = JSON.parse(jsonContent);
      const errors = validateFlowDefinition(parsed);
      setValidationErrors(errors);

      if (errors.length === 0) {
        setError(null);
        return true;
      } else {
        setError('Há erros de validação no fluxo');
        return false;
      }
    } catch (err: any) {
      setError(`Erro ao parsear JSON: ${err.message}`);
      setValidationErrors([]);
      return false;
    }
  };

  const handleSave = async () => {
    if (!handleValidate()) {
      return;
    }

    try {
      setSaving(true);
      const parsed = JSON.parse(jsonContent);

      const dataToSave = {
        name: parsed.name,
        description: parsed.description,
        version: parsed.version,
        isActive: formData.isActive,
        isDefault: formData.isDefault,
        nodes: parsed.nodes,
        metadata: parsed.metadata || formData.metadata,
      };

      await onSave(dataToSave);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditorChange = (value: string) => {
    setJsonContent(value);
    setTimeout(() => {
      handleValidate();
    }, 1000);
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">
              {flowId ? 'Editar Fluxo' : 'Novo Fluxo'}
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleValidate}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Validar
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || validationErrors.length > 0}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <div className="font-bold mb-2">
              Erros de Validação ({validationErrors.length}):
            </div>
            {validationErrors.map((err, idx) => (
              <div key={idx} className="text-sm">
                • {err.path}: {err.message}
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {validationErrors.length === 0 && jsonContent && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ✅ Fluxo válido! Pronto para salvar.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="config">📝 Configurações</TabsTrigger>
          <TabsTrigger value="json">💻 Editor JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Fluxo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      try {
                        const parsed = JSON.parse(jsonContent);
                        parsed.name = e.target.value;
                        setJsonContent(JSON.stringify(parsed, null, 2));
                      } catch {}
                    }}
                    placeholder="ex: solicitar_servico"
                  />
                  <p className="text-sm text-muted-foreground">
                    Nome interno do fluxo
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="version">Versão</Label>
                  <Input
                    id="version"
                    value={formData.version}
                    onChange={(e) => {
                      setFormData({ ...formData, version: e.target.value });
                      try {
                        const parsed = JSON.parse(jsonContent);
                        parsed.version = e.target.value;
                        setJsonContent(JSON.stringify(parsed, null, 2));
                      } catch {}
                    }}
                    placeholder="1.0.0"
                  />
                  <p className="text-sm text-muted-foreground">
                    Versão semântica
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    try {
                      const parsed = JSON.parse(jsonContent);
                      parsed.description = e.target.value;
                      setJsonContent(JSON.stringify(parsed, null, 2));
                    } catch {}
                  }}
                  rows={3}
                  placeholder="Descrição detalhada do fluxo"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="icon">Ícone</Label>
                  <Input
                    id="icon"
                    value={formData.metadata.icon}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        metadata: { ...formData.metadata, icon: e.target.value },
                      });
                    }}
                    placeholder="📋"
                  />
                  <p className="text-sm text-muted-foreground">
                    Emoji para identificação
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Cor</Label>
                  <Input
                    id="color"
                    type="color"
                    value={formData.metadata.color}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        metadata: { ...formData.metadata, color: e.target.value },
                      });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={formData.metadata.category}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        metadata: { ...formData.metadata, category: e.target.value },
                      });
                    }}
                    placeholder="general"
                  />
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label htmlFor="isActive">Fluxo Ativo</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isDefault: checked })
                    }
                  />
                  <Label htmlFor="isDefault">Fluxo Padrão (Menu Principal)</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="json">
          <Card>
            <CardContent className="pt-6">
              <Textarea
                value={jsonContent}
                onChange={(e) => handleEditorChange(e.target.value)}
                className="font-mono text-sm min-h-[600px]"
                placeholder="Cole aqui o JSON do fluxo..."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">📚 Tipos de Nodos Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">message - Exibe mensagem</Badge>
            <Badge variant="outline">question - Pergunta com input livre</Badge>
            <Badge variant="outline">menu - Menu de opções</Badge>
            <Badge variant="outline">action - Executa ação no backend</Badge>
            <Badge variant="outline">condition - Avalia condições</Badge>
            <Badge variant="outline">form - Formulário dinâmico</Badge>
            <Badge variant="outline">upload - Upload de arquivos</Badge>
            <Badge variant="outline">location - Solicita localização</Badge>
            <Badge variant="outline">end - Finaliza fluxo</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
