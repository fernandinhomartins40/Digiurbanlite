'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, FileText, AlertCircle, CheckCircle2, Upload, X, FileCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { DocumentUploadField } from '@/components/ui/document-upload-field';
import { DocumentType } from '@/components/ui/camera-capture';

interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'email' | 'phone' | 'cpf' | 'textarea' | 'select' | 'checkbox' | 'file';
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: string[];
}

interface DocumentRequirement {
  id: string;
  name: string;
  description: string;
  required: boolean;
  acceptedFormats?: string[];
  maxSizeMB?: number;
  documentType?: DocumentType; // Tipo de documento para guia visual da câmera
}

interface Program {
  id: string;
  name: string;
  description: string;
  programType?: string;
  targetAudience?: string;
  startDate: string;
  endDate?: string;
  maxParticipants: number;
  currentParticipants: number;
  availableSlots: number;
  coordinator?: string;
  formSchema?: FormField[];
  requiredDocuments?: DocumentRequirement[];
  enrollmentSettings?: any;
}

interface DynamicEnrollmentFormProps {
  program: Program;
  serviceId: string;
  moduleType: string;
}

interface UploadedFile {
  documentId: string;
  file: File | null;
  preview?: string;
}

export function DynamicEnrollmentForm({
  program,
  serviceId,
  moduleType
}: DynamicEnrollmentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleFileUpload = (documentId: string, file: File | null) => {
    if (!file) {
      // Remover arquivo
      setUploadedFiles(prev => prev.filter(f => f.documentId !== documentId));
      return;
    }

    const existingIndex = uploadedFiles.findIndex(f => f.documentId === documentId);

    if (existingIndex >= 0) {
      // Substituir arquivo existente
      const newFiles = [...uploadedFiles];
      newFiles[existingIndex] = { documentId, file };
      setUploadedFiles(newFiles);
    } else {
      // Adicionar novo arquivo
      setUploadedFiles(prev => [...prev, { documentId, file }]);
    }

    toast.success(`Arquivo "${file.name}" adicionado`);
  };

  const handleRemoveFile = (documentId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.documentId !== documentId));
    toast.info('Arquivo removido');
  };

  const getUploadedFile = (documentId: string) => {
    return uploadedFiles.find(f => f.documentId === documentId);
  };

  const validateForm = (): boolean => {
    // Validar campos do formSchema
    if (program.formSchema) {
      for (const field of program.formSchema) {
        if (field.required && !formData[field.name]) {
          toast.error(`${field.label} é obrigatório`);
          return false;
        }
      }
    }

    // Validar documentos obrigatórios
    if (program.requiredDocuments) {
      const requiredDocs = program.requiredDocuments.filter(doc => doc.required);
      for (const doc of requiredDocs) {
        if (!uploadedFiles.find(f => f.documentId === doc.id)) {
          toast.error(`Documento "${doc.name}" é obrigatório`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Preparar FormData para upload
      const submitData = new FormData();
      submitData.append('serviceId', serviceId);
      submitData.append('moduleType', moduleType);
      submitData.append('programId', program.id);
      submitData.append('programName', program.name);
      submitData.append('formData', JSON.stringify(formData));

      // Adicionar arquivos
      uploadedFiles.forEach((upload, index) => {
        if (upload.file) {
          submitData.append(`documents[${index}][id]`, upload.documentId);
          submitData.append(`documents[${index}][file]`, upload.file);
        }
      });

      // Criar protocolo de inscrição
      const response = await fetch('/api/citizen/protocols', {
        method: 'POST',
        body: submitData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao realizar inscrição');
      }

      const data = await response.json();

      toast.success('Inscrição realizada com sucesso!', {
        description: `Protocolo: ${data.protocol.protocolNumber}`
      });

      // Redirecionar para página de protocolos
      router.push('/cidadao/protocolos');
    } catch (err) {
      console.error('Erro ao realizar inscrição:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao realizar inscrição');
    } finally {
      setLoading(false);
    }
  };

  const renderFormField = (field: FormField) => {
    const value = formData[field.name] || '';

    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={field.name}
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              rows={4}
            />
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(val) => handleFieldChange(field.name, val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || 'Selecione...'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="flex items-center space-x-2 py-2">
            <Checkbox
              id={field.name}
              checked={value}
              onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
            />
            <Label
              htmlFor={field.name}
              className="text-sm font-normal cursor-pointer"
            >
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-xs text-muted-foreground ml-6">{field.description}</p>
            )}
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              required={field.required}
            />
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      default:
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type={field.type}
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
          </div>
        );
    }
  };

  const renderDocumentUpload = (doc: DocumentRequirement) => {
    const uploadedFile = getUploadedFile(doc.id);

    // Mapear formatos aceitos para MIME types
    const mimeTypes = doc.acceptedFormats?.map(format => {
      const mimeMap: Record<string, string> = {
        'pdf': 'application/pdf',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif'
      };
      return mimeMap[format.toLowerCase()] || `image/${format}`;
    }) || ['image/jpeg', 'image/png', 'application/pdf'];

    return (
      <div key={doc.id}>
        <DocumentUploadField
          id={doc.id}
          label={doc.name}
          description={doc.description}
          required={doc.required}
          acceptedFormats={mimeTypes}
          maxSizeMB={doc.maxSizeMB || 5}
          documentType={doc.documentType || 'documento_generico'}
          value={uploadedFile?.file || null}
          onChange={(file) => handleFileUpload(doc.id, file)}
        />
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Informações do Programa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            {program.name}
          </CardTitle>
          <CardDescription>{program.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {program.programType && (
              <div>
                <span className="font-medium">Tipo:</span> {program.programType}
              </div>
            )}
            {program.targetAudience && (
              <div>
                <span className="font-medium">Público-Alvo:</span> {program.targetAudience}
              </div>
            )}
            <div>
              <span className="font-medium">Início:</span>{' '}
              {format(new Date(program.startDate), "dd/MM/yyyy", { locale: ptBR })}
            </div>
            <div>
              <span className="font-medium">Vagas Disponíveis:</span>{' '}
              <Badge variant="outline" className="ml-1">
                {program.availableSlots} de {program.maxParticipants}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Inscrição */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campos Personalizados do Programa */}
        {program.formSchema && program.formSchema.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Formulário de Inscrição</CardTitle>
              <CardDescription>
                Preencha os dados solicitados para o programa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {program.formSchema.map(renderFormField)}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload de Documentos */}
        {program.requiredDocuments && program.requiredDocuments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Documentos Necessários
              </CardTitle>
              <CardDescription>
                Faça o upload dos documentos solicitados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {program.requiredDocuments.map(renderDocumentUpload)}
            </CardContent>
          </Card>
        )}

        {/* Botões de Ação */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
            className="flex-1"
          >
            Voltar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Enviando...' : 'Confirmar Inscrição'}
          </Button>
        </div>
      </form>
    </div>
  );
}
