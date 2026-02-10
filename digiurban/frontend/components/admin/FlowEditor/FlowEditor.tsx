'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  MiniMap,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, CheckCircle, AlertCircle, Plus, Trash2 } from 'lucide-react';

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

type FlowTransition = {
  to: string;
  when?: string;
};

type FlowNodeDefinition = {
  id: string;
  type: string;
  config?: Record<string, any>;
  transitions?: FlowTransition[];
  metadata?: Record<string, any>;
};

type FlowDefinition = {
  name: string;
  description: string;
  version: string;
  metadata?: {
    icon?: string;
    color?: string;
    category?: string;
  };
  nodes: FlowNodeDefinition[];
};

const NODE_TYPES = [
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

const buildDefaultNodeConfig = (type: string) => {
  switch (type) {
    case 'message':
      return { text: 'Mensagem inicial' };
    case 'question':
      return { text: 'Pergunta', saveAs: 'resposta' };
    case 'menu':
      return {
        text: 'Menu de opcoes',
        options: [
          { id: 'opcao_1', label: 'Opcao 1', description: 'Descricao' },
        ],
      };
    case 'action':
      return { action: 'listServices', params: {}, saveResultAs: 'resultado' };
    case 'condition':
      return {
        conditions: [
          { field: 'valor', operator: 'eq', value: 'x', goto: 'destino' },
        ],
        defaultGoto: 'destino_padrao',
      };
    case 'form':
      return { text: 'Formulario', fields: [] };
    case 'upload':
      return {
        text: 'Envie os arquivos',
        maxFiles: 5,
        maxFileSize: 10,
        allowSkip: true,
      };
    case 'location':
      return { text: 'Informe a localizacao', allowManualInput: true };
    case 'end':
      return { message: 'Fim do fluxo', returnToMain: true };
    default:
      return {};
  }
};

const buildNodeLabel = (node: FlowNodeDefinition) => {
  const text = node.config?.text || node.config?.action || '';
  if (typeof text === 'string' && text.trim()) {
    const preview = text.split('\n')[0].slice(0, 40);
    return `${node.id} (${node.type}) - ${preview}`;
  }
  return `${node.id} (${node.type})`;
};

const buildReactFlowNodes = (nodes: FlowNodeDefinition[]): Node[] =>
  nodes.map((node, index) => {
    const position = node.metadata?.position || {
      x: (index % 4) * 220,
      y: Math.floor(index / 4) * 140,
    };

    return {
      id: node.id,
      position,
      data: {
        label: buildNodeLabel(node),
      },
      type: 'default',
    };
  });

const buildReactFlowEdges = (nodes: FlowNodeDefinition[]): Edge[] => {
  const edges: Edge[] = [];

  nodes.forEach((node) => {
    (node.transitions || []).forEach((transition, index) => {
      edges.push({
        id: `${node.id}-${transition.to}-${index}`,
        source: node.id,
        target: transition.to,
        type: 'smoothstep',
        label: transition.when ? `when: ${transition.when}` : undefined,
        data: { when: transition.when },
      });
    });
  });

  return edges;
};

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
      icon: 'BOT',
      color: '#4CAF50',
      category: 'general',
    },
  });
  const [flowNodes, setFlowNodes] = useState<FlowNodeDefinition[]>([]);
  const [reactNodes, setReactNodes] = useState<Node[]>([]);
  const [reactEdges, setReactEdges] = useState<Edge[]>([]);
  const [jsonContent, setJsonContent] = useState('');
  const [activeTab, setActiveTab] = useState('builder');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeIdInput, setNodeIdInput] = useState('');
  const [nodeTypeInput, setNodeTypeInput] = useState('message');
  const [nodeConfigText, setNodeConfigText] = useState('');
  const [nodeTransitionsText, setNodeTransitionsText] = useState('');
  const [nodeEditorError, setNodeEditorError] = useState<string | null>(null);

  const selectedNode = useMemo(
    () => flowNodes.find((node) => node.id === selectedNodeId) || null,
    [flowNodes, selectedNodeId]
  );

  const syncGraphFromFlow = useCallback((nodes: FlowNodeDefinition[]) => {
    setReactNodes(buildReactFlowNodes(nodes));
    setReactEdges(buildReactFlowEdges(nodes));
  }, []);

  const buildDefinition = useCallback((): FlowDefinition => ({
    name: formData.name,
    description: formData.description,
    version: formData.version,
    metadata: formData.metadata,
    nodes: flowNodes,
  }), [formData, flowNodes]);

  useEffect(() => {
    if (initialData) {
      const nodes = (initialData.nodes || []) as FlowNodeDefinition[];
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        version: initialData.version || '1.0.0',
        isActive: initialData.isActive ?? true,
        isDefault: initialData.isDefault ?? false,
        metadata: initialData.metadata || {
          icon: 'BOT',
          color: '#4CAF50',
          category: 'general',
        },
      });
      setFlowNodes(nodes);
      syncGraphFromFlow(nodes);
    } else {
      const template: FlowDefinition = {
        name: 'novo_fluxo',
        description: 'Fluxo do bot',
        version: '1.0.0',
        metadata: {
          icon: 'BOT',
          color: '#4CAF50',
          category: 'general',
        },
        nodes: [
          {
            id: 'start',
            type: 'message',
            config: { text: 'Mensagem inicial' },
            transitions: [{ to: 'end' }],
          },
          {
            id: 'end',
            type: 'end',
            config: { message: 'Fim do fluxo', returnToMain: true },
          },
        ],
      };
      setFormData({
        name: template.name,
        description: template.description,
        version: template.version,
        isActive: true,
        isDefault: false,
        metadata: {
          icon: template.metadata?.icon || 'BOT',
          color: template.metadata?.color || '#4CAF50',
          category: template.metadata?.category || 'general',
        },
      });
      setFlowNodes(template.nodes);
      syncGraphFromFlow(template.nodes);
    }
  }, [initialData, syncGraphFromFlow]);

  useEffect(() => {
    if (activeTab !== 'json') {
      setJsonContent(JSON.stringify(buildDefinition(), null, 2));
    }
  }, [activeTab, buildDefinition]);

  useEffect(() => {
    if (selectedNode) {
      setNodeIdInput(selectedNode.id);
      setNodeTypeInput(selectedNode.type);
      setNodeConfigText(JSON.stringify(selectedNode.config || {}, null, 2));
      setNodeTransitionsText(JSON.stringify(selectedNode.transitions || [], null, 2));
      setNodeEditorError(null);
    }
  }, [selectedNode]);

  const validateFlowDefinition = (json: any): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!json.name || typeof json.name !== 'string') {
      errors.push({ path: 'name', message: 'Nome obrigatorio' });
    }

    if (!json.description || typeof json.description !== 'string') {
      errors.push({ path: 'description', message: 'Descricao obrigatoria' });
    }

    if (!json.version || typeof json.version !== 'string') {
      errors.push({ path: 'version', message: 'Versao obrigatoria' });
    }

    if (!json.nodes || !Array.isArray(json.nodes)) {
      errors.push({ path: 'nodes', message: 'Nodes deve ser um array' });
      return errors;
    }

    if (json.nodes.length === 0) {
      errors.push({ path: 'nodes', message: 'Deve haver pelo menos um node' });
      return errors;
    }

    const nodeIds = new Set<string>();
    json.nodes.forEach((node: any, index: number) => {
      if (!node.id) {
        errors.push({ path: `nodes[${index}].id`, message: 'ID obrigatorio' });
      } else if (nodeIds.has(node.id)) {
        errors.push({ path: `nodes[${index}].id`, message: `ID duplicado: ${node.id}` });
      } else {
        nodeIds.add(node.id);
      }

      if (!node.type) {
        errors.push({ path: `nodes[${index}].type`, message: 'Tipo obrigatorio' });
      }

      if (node.type && !NODE_TYPES.includes(node.type)) {
        errors.push({ path: `nodes[${index}].type`, message: `Tipo invalido: ${node.type}` });
      }

      if (!node.config) {
        errors.push({ path: `nodes[${index}].config`, message: 'Config obrigatorio' });
      }

      const requiresTransitions = ['question', 'menu', 'action', 'form', 'upload', 'location'].includes(node.type);

      // message pode ser terminal (sem transições). condition usa goto/defaultGoto ao invés de transitions.
      if (requiresTransitions) {
        if (!node.transitions || !Array.isArray(node.transitions)) {
          errors.push({ path: `nodes[${index}].transitions`, message: 'Transitions deve ser um array' });
        } else if (node.transitions.length === 0) {
          errors.push({ path: `nodes[${index}].transitions`, message: 'Deve haver ao menos uma transicao' });
        }
      } else if (node.transitions !== undefined && !Array.isArray(node.transitions)) {
        errors.push({ path: `nodes[${index}].transitions`, message: 'Transitions deve ser um array' });
      }
    });

    json.nodes.forEach((node: any, index: number) => {
      if (node.type === 'condition' && node.config) {
        const conditions = Array.isArray(node.config.conditions) ? node.config.conditions : [];
        conditions.forEach((condition: any, cIndex: number) => {
          if (condition?.goto && !nodeIds.has(condition.goto)) {
            errors.push({
              path: `nodes[${index}].config.conditions[${cIndex}].goto`,
              message: `Destino nao existe: ${condition.goto}`
            });
          }
        });

        if (node.config.defaultGoto && !nodeIds.has(node.config.defaultGoto)) {
          errors.push({
            path: `nodes[${index}].config.defaultGoto`,
            message: `Destino nao existe: ${node.config.defaultGoto}`
          });
        }
      }

      if (node.transitions) {
        node.transitions.forEach((transition: any, tIndex: number) => {
          if (!transition.to) {
            errors.push({ path: `nodes[${index}].transitions[${tIndex}].to`, message: 'Destino obrigatorio' });
          } else if (!nodeIds.has(transition.to)) {
            errors.push({ path: `nodes[${index}].transitions[${tIndex}].to`, message: `Destino nao existe: ${transition.to}` });
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
      }

      setError('Existe erro de validacao no fluxo');
      return false;
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

  const handleJsonChange = (value: string) => {
    setJsonContent(value);
    try {
      const parsed = JSON.parse(value);
      const errors = validateFlowDefinition(parsed);
      setValidationErrors(errors);

      if (errors.length === 0) {
        setFormData((prev) => ({
          ...prev,
          name: parsed.name || prev.name,
          description: parsed.description || prev.description,
          version: parsed.version || prev.version,
          metadata: parsed.metadata || prev.metadata,
        }));
        const nodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
        setFlowNodes(nodes);
        syncGraphFromFlow(nodes);
        setError(null);
      }
    } catch {
      setError('JSON invalido');
    }
  };

  const handleAddNode = (type: string) => {
    const existingIds = new Set(flowNodes.map((node) => node.id));
    let baseId = type;
    let suffix = 1;
    while (existingIds.has(baseId)) {
      baseId = `${type}_${suffix}`;
      suffix += 1;
    }

    const position = {
      x: (flowNodes.length % 4) * 220,
      y: Math.floor(flowNodes.length / 4) * 140,
    };

    const newNode: FlowNodeDefinition = {
      id: baseId,
      type,
      config: buildDefaultNodeConfig(type),
      transitions: [],
      metadata: { position },
    };

    const updated = [...flowNodes, newNode];
    setFlowNodes(updated);
    syncGraphFromFlow(updated);
    setSelectedNodeId(baseId);
  };

  const handleApplyNodeChanges = () => {
    if (!selectedNode) return;

    try {
      const parsedConfig = nodeConfigText.trim()
        ? JSON.parse(nodeConfigText)
        : {};
      const parsedTransitions = nodeTransitionsText.trim()
        ? JSON.parse(nodeTransitionsText)
        : [];

      if (!Array.isArray(parsedTransitions)) {
        setNodeEditorError('Transitions deve ser um array');
        return;
      }

      const trimmedId = nodeIdInput.trim();
      if (!trimmedId) {
        setNodeEditorError('ID nao pode ficar vazio');
        return;
      }

      if (trimmedId !== selectedNode.id && flowNodes.some((node) => node.id === trimmedId)) {
        setNodeEditorError('ID ja existe em outro node');
        return;
      }

      const updatedNodes = flowNodes.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            id: trimmedId,
            type: nodeTypeInput,
            config: parsedConfig,
            transitions: parsedTransitions,
          };
        }

        if (node.transitions) {
          return {
            ...node,
            transitions: node.transitions.map((transition) =>
              transition.to === selectedNode.id
                ? { ...transition, to: trimmedId }
                : transition
            ),
          };
        }

        return node;
      });

      setFlowNodes(updatedNodes);
      syncGraphFromFlow(updatedNodes);
      setSelectedNodeId(trimmedId);
      setNodeEditorError(null);
    } catch (err: any) {
      setNodeEditorError(`Erro ao aplicar: ${err.message}`);
    }
  };

  const handleDeleteNode = () => {
    if (!selectedNode) return;

    const updated = flowNodes
      .filter((node) => node.id !== selectedNode.id)
      .map((node) => ({
        ...node,
        transitions: (node.transitions || []).filter((transition) => transition.to !== selectedNode.id),
      }));

    setFlowNodes(updated);
    syncGraphFromFlow(updated);
    setSelectedNodeId(null);
  };

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setReactNodes((nodes) => {
        const updated = applyNodeChanges(changes, nodes);
        const positions = new Map(updated.map((node) => [node.id, node.position]));
        const updatedFlow = flowNodes.map((node) => ({
          ...node,
          metadata: {
            ...node.metadata,
            position: positions.get(node.id) || node.metadata?.position,
          },
        }));
        setFlowNodes(updatedFlow);
        return updated;
      });
    },
    [flowNodes]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setReactEdges((edges) => {
        const updated = applyEdgeChanges(changes, edges);
        const transitionsBySource = new Map<string, FlowTransition[]>();

        updated.forEach((edge) => {
          const existing = transitionsBySource.get(edge.source) || [];
          existing.push({
            to: edge.target,
            when: edge.data?.when,
          });
          transitionsBySource.set(edge.source, existing);
        });

        const updatedFlow = flowNodes.map((node) => ({
          ...node,
          transitions: transitionsBySource.get(node.id) || [],
        }));
        setFlowNodes(updatedFlow);

        return updated;
      });
    },
    [flowNodes]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      setReactEdges((edges) =>
        addEdge(
          {
            ...connection,
            type: 'smoothstep',
            data: { when: undefined },
          },
          edges
        )
      );

      if (!connection.target || !connection.source) {
        return;
      }

      const targetId = connection.target;
      const sourceId = connection.source;

      const updatedFlow = flowNodes.map((node) => {
        if (node.id !== sourceId) {
          return node;
        }

        const transitions = node.transitions || [];
        if (transitions.some((transition) => transition.to === targetId)) {
          return node;
        }

        return {
          ...node,
          transitions: [...transitions, { to: targetId }],
        };
      });

      setFlowNodes(updatedFlow);
    },
    [flowNodes]
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-bold">
              {flowId ? 'Editar fluxo' : 'Novo fluxo'}
            </h2>
            <div className="flex flex-wrap gap-2">
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

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <div className="font-bold mb-2">
              Erros de validacao ({validationErrors.length}):
            </div>
            {validationErrors.map((err, idx) => (
              <div key={idx} className="text-sm">
                - {err.path}: {err.message}
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {validationErrors.length === 0 && jsonContent && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Fluxo valido. Pronto para salvar.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
          <TabsTrigger value="json">JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="builder">
          <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
            <Card className="min-h-[600px]">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Editor visual</CardTitle>
                <div className="flex flex-wrap gap-2">
                  {NODE_TYPES.map((type) => (
                    <Button
                      key={type}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddNode(type)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {type}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="h-[600px]">
                <ReactFlow
                  nodes={reactNodes}
                  edges={reactEdges}
                  onNodesChange={handleNodesChange}
                  onEdgesChange={handleEdgesChange}
                  onConnect={handleConnect}
                  onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                  fitView
                >
                  <Background gap={20} size={1} />
                  <MiniMap />
                  <Controls />
                </ReactFlow>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Inspector do node</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedNode ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="node-id">ID</Label>
                      <Input
                        id="node-id"
                        value={nodeIdInput}
                        onChange={(event) => setNodeIdInput(event.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select value={nodeTypeInput} onValueChange={setNodeTypeInput}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {NODE_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Config (JSON)</Label>
                      <Textarea
                        value={nodeConfigText}
                        onChange={(event) => setNodeConfigText(event.target.value)}
                        rows={8}
                        className="font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Transitions (JSON)</Label>
                      <Textarea
                        value={nodeTransitionsText}
                        onChange={(event) => setNodeTransitionsText(event.target.value)}
                        rows={6}
                        className="font-mono text-xs"
                      />
                    </div>

                    {nodeEditorError && (
                      <Alert variant="destructive">
                        <AlertDescription>{nodeEditorError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button onClick={handleApplyNodeChanges}>Aplicar</Button>
                      <Button variant="destructive" onClick={handleDeleteNode}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Selecione um node para editar.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do fluxo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                    placeholder="ex: solicitar_servico"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="version">Versao</Label>
                  <Input
                    id="version"
                    value={formData.version}
                    onChange={(event) => setFormData({ ...formData, version: event.target.value })}
                    placeholder="1.0.0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descricao</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="icon">Icon</Label>
                  <Input
                    id="icon"
                    value={formData.metadata.icon}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        metadata: { ...formData.metadata, icon: event.target.value },
                      })
                    }
                    placeholder="BOT"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Cor</Label>
                  <Input
                    id="color"
                    type="color"
                    value={formData.metadata.color}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        metadata: { ...formData.metadata, color: event.target.value },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={formData.metadata.category}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        metadata: { ...formData.metadata, category: event.target.value },
                      })
                    }
                    placeholder="general"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label htmlFor="isActive">Fluxo ativo</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isDefault: checked })
                    }
                  />
                  <Label htmlFor="isDefault">Fluxo padrao</Label>
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
                onChange={(event) => handleJsonChange(event.target.value)}
                className="font-mono text-sm min-h-[600px]"
                placeholder="Cole aqui o JSON do fluxo..."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Tipos de nodes disponiveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {NODE_TYPES.map((type) => (
              <Badge variant="outline" key={type}>
                {type}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
