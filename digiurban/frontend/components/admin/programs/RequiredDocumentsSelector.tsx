'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Trash2,
  FileText,
  File,
  Image,
  FileCheck,
  AlertCircle
} from 'lucide-react';

interface DocumentRequirement {
  id: string;
  name: string;
  description: string;
  required: boolean;
  acceptedFormats?: string[];
  maxSizeMB?: number;
}

interface RequiredDocumentsSelectorProps {
  value: DocumentRequirement[];
  onChange: (documents: DocumentRequirement[]) => void;
}

const COMMON_DOCUMENTS = [
  {
    name: 'RG',
    description: 'Documento de Identidade (RG)',
    formats: ['pdf', 'jpg', 'png'],
  },
  {
    name: 'CPF',
    description: 'Cadastro de Pessoa Física',
    formats: ['pdf', 'jpg', 'png'],
  },
  {
    name: 'Comprovante de Residência',
    description: 'Conta de luz, água ou telefone (máx. 3 meses)',
    formats: ['pdf', 'jpg', 'png'],
  },
  {
    name: 'Certidão de Nascimento',
    description: 'Certidão de nascimento ou casamento',
    formats: ['pdf'],
  },
  {
    name: 'Declaração de Renda',
    description: 'Comprovante de renda familiar',
    formats: ['pdf', 'jpg', 'png'],
  },
  {
    name: 'Foto 3x4',
    description: 'Foto recente 3x4',
    formats: ['jpg', 'png'],
  },
  {
    name: 'Título de Eleitor',
    description: 'Título de Eleitor',
    formats: ['pdf', 'jpg', 'png'],
  },
  {
    name: 'CAR',
    description: 'Cadastro Ambiental Rural',
    formats: ['pdf'],
  },
  {
    name: 'DAP',
    description: 'Declaração de Aptidão ao PRONAF',
    formats: ['pdf'],
  },
  {
    name: 'Escritura/Posse',
    description: 'Documento de posse ou propriedade da terra',
    formats: ['pdf'],
  },
];

export function RequiredDocumentsSelector({ value, onChange }: RequiredDocumentsSelectorProps) {
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customDoc, setCustomDoc] = useState({
    name: '',
    description: '',
    formats: 'pdf,jpg,png',
  });

  const addCommonDocument = (doc: typeof COMMON_DOCUMENTS[0]) => {
    const newDoc: DocumentRequirement = {
      id: `doc_${Date.now()}`,
      name: doc.name,
      description: doc.description,
      required: true,
      acceptedFormats: doc.formats,
      maxSizeMB: 5,
    };
    onChange([...value, newDoc]);
  };

  const addCustomDocument = () => {
    if (!customDoc.name.trim()) return;

    const newDoc: DocumentRequirement = {
      id: `doc_${Date.now()}`,
      name: customDoc.name,
      description: customDoc.description,
      required: true,
      acceptedFormats: customDoc.formats.split(',').map(f => f.trim()),
      maxSizeMB: 5,
    };
    onChange([...value, newDoc]);
    setCustomDoc({ name: '', description: '', formats: 'pdf,jpg,png' });
    setShowCustomForm(false);
  };

  const removeDocument = (id: string) => {
    onChange(value.filter(doc => doc.id !== id));
  };

  const updateDocument = (id: string, updates: Partial<DocumentRequirement>) => {
    onChange(value.map(doc =>
      doc.id === id ? { ...doc, ...updates } : doc
    ));
  };

  const toggleRequired = (id: string) => {
    onChange(value.map(doc =>
      doc.id === id ? { ...doc, required: !doc.required } : doc
    ));
  };

  const isDocumentAdded = (name: string) => {
    return value.some(doc => doc.name === name);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Documentos Exigidos</h3>
        <p className="text-sm text-muted-foreground">
          Selecione os documentos necessários para inscrição no programa
        </p>
      </div>

      {/* Documentos Comuns */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documentos Comuns</CardTitle>
          <CardDescription>Clique para adicionar documentos frequentes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {COMMON_DOCUMENTS.map((doc) => (
              <Button
                key={doc.name}
                type="button"
                variant={isDocumentAdded(doc.name) ? "secondary" : "outline"}
                size="sm"
                onClick={() => !isDocumentAdded(doc.name) && addCommonDocument(doc)}
                disabled={isDocumentAdded(doc.name)}
                className="text-xs"
              >
                {isDocumentAdded(doc.name) ? '✓ ' : '+ '}
                {doc.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documento Customizado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documento Personalizado</CardTitle>
          <CardDescription>Adicione documentos específicos para este programa</CardDescription>
        </CardHeader>
        <CardContent>
          {!showCustomForm ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCustomForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Documento Customizado
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Nome do Documento</Label>
                <Input
                  value={customDoc.name}
                  onChange={(e) => setCustomDoc({ ...customDoc, name: e.target.value })}
                  placeholder="Ex: Laudo Técnico"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={customDoc.description}
                  onChange={(e) => setCustomDoc({ ...customDoc, description: e.target.value })}
                  placeholder="Ex: Laudo técnico emitido por engenheiro agrônomo"
                />
              </div>
              <div className="space-y-2">
                <Label>Formatos Aceitos (separados por vírgula)</Label>
                <Input
                  value={customDoc.formats}
                  onChange={(e) => setCustomDoc({ ...customDoc, formats: e.target.value })}
                  placeholder="pdf,jpg,png"
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={addCustomDocument}>
                  Adicionar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Documentos Selecionados */}
      {value.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Documentos Selecionados ({value.length})
            </CardTitle>
            <CardDescription>Gerencie os documentos exigidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {value.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{doc.name}</span>
                        {doc.required ? (
                          <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Opcional</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{doc.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Formatos: {doc.acceptedFormats?.join(', ').toUpperCase()}</span>
                        <span>Máx: {doc.maxSizeMB}MB</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRequired(doc.id)}
                    >
                      {doc.required ? 'Tornar Opcional' : 'Tornar Obrigatório'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDocument(doc.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {value.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhum documento selecionado.<br />
              Adicione documentos usando os botões acima.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
