'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Send, Loader2, CheckCircle, FileText, Clock, UserCheck, Upload, Search, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { api } from '@/lib/services/api';
import { useFormPrefill } from '@/hooks/useFormPrefill';
import { ProgramSelector } from '@/components/citizen/ProgramSelector';
import { MaskedInput, getMaskPlaceholder } from '@/components/ui/masked-input';
import { normalizeRequiredDocuments } from '@/lib/normalize-documents'
import { DocumentUpload } from '@/components/common/DocumentUpload'
import { normalizeDocumentConfig } from '@/lib/document-utils';

interface Service {
  id: string;
  name: string;
  description: string | null;
  estimatedDays: number | null;
  department: {
    name: string;
  };
  serviceType: 'INFORMATIVO' | 'COM_DADOS';
  moduleType?: string;
  requiresDocuments?: boolean;
  requiredDocuments?: any[];
  formSchema?: {
    type: string;
    fields: Array<{
      id: string;
      type: string;
      label: string;
      placeholder?: string;
      required: boolean;
      options?: string[];
    }>;
    properties?: any;
  };
}

// Mapeamento de moduleType para tipo de API de programas
const MODULE_TO_API_TYPE: Record<string, string> = {
  INSCRICAO_PROGRAMA_RURAL: 'programas-rurais',
  INSCRICAO_CURSO_RURAL: 'cursos-rurais',
  INSCRICAO_OFICINA_CULTURAL: 'oficinas-culturais',
};

export default function AdminSolicitarServicoPage() {
  const router = useRouter();
  const params = useParams();
  const serviceId = params.id as string;
  const { user, apiRequest } = useAdminAuth();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

  // Estados para seleção de cidadão
  const [selectedCitizen, setSelectedCitizen] = useState<any>(null);
  const [cpfSearch, setCpfSearch] = useState('');
  const [searchingCitizen, setSearchingCitizen] = useState(false);

  // Determinar quais campos usar: do programa selecionado ou do serviço
  const activeFormFields = useMemo(() => {
    const rawFormFields = selectedProgram?.formSchema || service?.formSchema?.fields || [];
    return Array.isArray(rawFormFields) ? rawFormFields : [];
  }, [selectedProgram?.formSchema, service?.formSchema?.fields]);

  // Hook de pré-preenchimento
  const {
    formData: customFormData,
    updateField,
    prefilledMessage,
    isFieldPrefilled,
    hasPrefilledData,
    prefilledCount
  } = useFormPrefill({
    fields: activeFormFields,
    onPrefillComplete: (count) => {
      if (count > 0) {
        console.log(`✓ ${count} campos pré-preenchidos automaticamente`);
      }
    }
  });

  useEffect(() => {
    loadService();
  }, [serviceId]);

  const loadService = async () => {
    try {
      const data = await apiRequest(`/citizen/services/${serviceId}`);
      data.service.requiredDocuments = normalizeRequiredDocuments(data.service.requiredDocuments);

      console.log('📄 Serviço carregado (Admin):', {
        name: data.service.name,
        requiresDocuments: data.service.requiresDocuments,
        requiredDocuments: data.service.requiredDocuments,
      });

      setService(data.service);
    } catch (error) {
      console.error('Erro ao carregar serviço:', error);
      toast.error('Erro ao carregar serviço');
      router.push('/admin/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProgram = (program: any) => {
    setSelectedProgram(program);
  };

  const handleFileUpload = (documentId: string, file: File) => {
    setUploadedFiles(prev => ({
      ...prev,
      [documentId]: file
    }));
    toast.success(`Arquivo "${file.name}" adicionado`);
  };

  const handleRemoveFile = (documentId: string) => {
    setUploadedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[documentId];
      return newFiles;
    });
    toast.info('Arquivo removido');
  };

  const handleSearchCitizen = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCpf = cpfSearch.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      toast.error('CPF inválido. Digite 11 dígitos.');
      return;
    }

    setSearchingCitizen(true);
    try {
      const response = await api.get(`/admin/citizens/search?q=${cleanCpf}`);

      if (response.data.success && response.data.data && response.data.data.length > 0) {
        const foundCitizen = response.data.data[0];
        setSelectedCitizen(foundCitizen);
        toast.success(`Cidadão encontrado: ${foundCitizen.name}`);
      } else {
        toast.error('Cidadão não encontrado. Verifique o CPF digitado.');
      }
    } catch (error: any) {
      console.error('Erro ao buscar cidadão:', error);
      toast.error(error.response?.data?.message || 'Erro ao buscar cidadão');
    } finally {
      setSearchingCitizen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar cidadão selecionado (obrigatório para admin)
    if (!selectedCitizen) {
      toast.error('Por favor, busque e selecione um cidadão antes de continuar');
      return;
    }

    // Se for inscrição em programa, validar se programa foi selecionado
    if (isProgramEnrollment && !selectedProgram) {
      toast.error('Por favor, selecione um programa');
      return;
    }

    if (!description.trim()) {
      toast.error('Por favor, descreva a solicitação');
      return;
    }

    // Validar campos obrigatórios do formulário customizado
    if (activeFormFields && activeFormFields.length > 0) {
      for (const field of activeFormFields) {
        if (field.required && !customFormData[field.id]) {
          toast.error(`O campo "${field.label}" é obrigatório`);
          return;
        }
      }
    }

    // Validar documentos obrigatórios do serviço
    if (!selectedProgram && service?.requiresDocuments && service?.requiredDocuments) {
      const docs = normalizeRequiredDocuments(service.requiredDocuments);
      const requiredDocs = docs.filter((doc: any) => {
        if (typeof doc === 'string') return true;
        return doc.required;
      });

      for (const doc of requiredDocs) {
        const docId = typeof doc === 'string' ? doc : (doc.id || doc.name);
        if (!uploadedFiles[docId]) {
          const docName = typeof doc === 'string' ? doc : doc.name;
          toast.error(`Por favor, envie o documento: ${docName}`);
          return;
        }
      }
    }

    // Validar documentos obrigatórios do programa
    if (selectedProgram?.requiredDocuments) {
      const programDocs = normalizeRequiredDocuments(selectedProgram.requiredDocuments);
      const requiredDocs = programDocs.filter((doc: any) => doc.required);
      for (const doc of requiredDocs) {
        if (!uploadedFiles[doc.id || doc.name]) {
          toast.error(`Documento "${doc.name}" é obrigatório`);
          return;
        }
      }
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('description', description);
      formData.append('priority', '3');
      formData.append('adminCitizenId', selectedCitizen.id);

      const finalCustomFormData = { ...customFormData };
      if (selectedProgram?.id) {
        finalCustomFormData.programId = selectedProgram.id;
      }

      if (activeFormFields.length > 0 || selectedProgram?.id) {
        formData.append('customFormData', JSON.stringify(finalCustomFormData));
      }

      const documentIds: string[] = [];
      Object.entries(uploadedFiles).forEach(([docId, file]) => {
        formData.append('documents', file);
        documentIds.push(docId);
      });

      documentIds.forEach(id => {
        formData.append('documentIds[]', id);
      });

      console.log('📤 Admin enviando solicitação com', Object.keys(uploadedFiles).length, 'arquivo(s)');

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/citizen/services/${serviceId}/request`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao enviar solicitação');
      }

      const data = await response.json();

      toast.success('Solicitação enviada com sucesso!', {
        description: `Protocolo ${data.protocol.number} gerado para ${selectedCitizen.name}`,
      });

      router.push('/admin/protocolos');
    } catch (error) {
      console.error('Erro ao solicitar serviço:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao enviar solicitação. Tente novamente.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Carregando serviço...</span>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">Serviço não encontrado</p>
          <Button className="mt-4" onClick={() => router.push('/admin/dashboard')}>
            Voltar para Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isProgramEnrollment = service?.moduleType && MODULE_TO_API_TYPE[service.moduleType];
  const programApiType = isProgramEnrollment && service?.moduleType ? MODULE_TO_API_TYPE[service.moduleType] : null;

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          {/* Badge indicando modo admin */}
          {user && (
            <div className="mb-3 inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-800 rounded-lg text-sm font-medium">
              <UserCheck className="h-4 w-4" />
              Modo Administrador - {user.name}
            </div>
          )}

          <h1 className="text-2xl font-bold text-gray-900">
            {isProgramEnrollment && !selectedProgram ? 'Selecione o Programa' : 'Solicitar Serviço para Cidadão'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isProgramEnrollment && !selectedProgram
              ? 'Escolha o programa em que deseja inscrever o cidadão'
              : 'Preencha os dados para solicitar este serviço em nome do cidadão'}
          </p>
        </div>

        {/* Informações do Serviço */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl">{service.name}</CardTitle>
                <CardDescription className="mt-1">
                  {service.department.name}
                </CardDescription>
                {service.description && (
                  <p className="text-sm text-gray-600 mt-2">{service.description}</p>
                )}
                {service.estimatedDays && (
                  <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>Prazo estimado: {service.estimatedDays} dias</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Busca de Cidadão - SEMPRE VISÍVEL para admin */}
        {!selectedCitizen && (
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <Search className="h-5 w-5" />
                Buscar Cidadão
              </CardTitle>
              <CardDescription className="text-orange-700">
                Digite o CPF do cidadão para o qual você está solicitando este serviço
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearchCitizen} className="flex gap-3">
                <div className="flex-1">
                  <Input
                    type="text"
                    value={cpfSearch}
                    onChange={(e) => setCpfSearch(e.target.value)}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    disabled={searchingCitizen}
                    className="bg-white"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={searchingCitizen}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {searchingCitizen ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Buscar
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Cidadão Selecionado */}
        {selectedCitizen && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg text-green-900 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Cidadão Selecionado
                  </CardTitle>
                  <div className="mt-3 space-y-1 text-sm text-green-800">
                    <p><strong>Nome:</strong> {selectedCitizen.name}</p>
                    <p><strong>CPF:</strong> {selectedCitizen.cpf}</p>
                    {selectedCitizen.email && <p><strong>Email:</strong> {selectedCitizen.email}</p>}
                    {selectedCitizen.phone && <p><strong>Telefone:</strong> {selectedCitizen.phone}</p>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCitizen(null);
                    setCpfSearch('');
                  }}
                  className="text-green-700 hover:text-green-900"
                >
                  Alterar
                </Button>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Seletor de Programas */}
        {isProgramEnrollment && !selectedProgram && programApiType && (
          <ProgramSelector
            serviceType={programApiType}
            onSelectProgram={handleSelectProgram}
          />
        )}

        {/* Programa Selecionado */}
        {isProgramEnrollment && selectedProgram && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg text-green-900">Programa Selecionado</CardTitle>
                  <CardDescription className="mt-1 text-green-700">
                    {selectedProgram.name}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProgram(null)}
                  className="text-green-700 hover:text-green-900"
                >
                  Alterar
                </Button>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Formulário de Solicitação */}
        {(!isProgramEnrollment || selectedProgram) && (
          <form onSubmit={handleSubmit}>
            <Card>
            <CardHeader>
              <CardTitle>Dados da Solicitação</CardTitle>
              <CardDescription>
                Forneça os detalhes da solicitação em nome do cidadão
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Aviso de Pré-preenchimento */}
              {hasPrefilledData && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <UserCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">
                      Dados pré-preenchidos automaticamente
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      {prefilledMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* Descrição do Problema */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Descrição do Problema *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Descreva detalhadamente a solicitação..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={5}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500">
                  Seja o mais específico possível para agilizar o atendimento
                </p>
              </div>

              {/* Upload de Documentos Exigidos pelo Serviço */}
              {!selectedProgram && service && service.requiresDocuments && service.requiredDocuments && Array.isArray(service.requiredDocuments) && service.requiredDocuments.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <Upload className="h-5 w-5 text-blue-600" />
                    Documentos Necessários
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Faça o upload dos documentos solicitados para completar a solicitação
                  </p>

                  {service.requiredDocuments.map((doc: any, index: number) => {
                    const docId = typeof doc === 'string' ? doc : (doc.id || doc.name || `doc-${index}`);
                    const uploadedFile = uploadedFiles[docId];
                    const documentConfig = normalizeDocumentConfig(doc);

                    return (
                      <div key={docId}>
                        <DocumentUpload
                          documentConfig={documentConfig}
                          value={uploadedFile || null}
                          onChange={(file) => {
                            if (file) {
                              handleFileUpload(docId, file);
                            } else {
                              handleRemoveFile(docId);
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Upload de Documentos Exigidos pelo Programa */}
              {selectedProgram && selectedProgram.requiredDocuments && Array.isArray(selectedProgram.requiredDocuments) && selectedProgram.requiredDocuments.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <Upload className="h-5 w-5 text-blue-600" />
                    Documentos Necessários
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Faça o upload dos documentos solicitados para completar a inscrição
                  </p>

                  {selectedProgram.requiredDocuments.map((doc: any, index: number) => {
                    const docId = doc.id || doc.name || `doc-${index}`;
                    const uploadedFile = uploadedFiles[docId];
                    const documentConfig = normalizeDocumentConfig(doc);

                    return (
                      <div key={docId}>
                        <DocumentUpload
                          documentConfig={documentConfig}
                          value={uploadedFile || null}
                          onChange={(file) => {
                            if (file) {
                              handleFileUpload(docId, file);
                            } else {
                              handleRemoveFile(docId);
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Campos Básicos para Inscrição em Programa */}
              {selectedProgram && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium text-gray-900">Dados Básicos do Inscrito</h3>

                  <div className="space-y-2">
                    <Label htmlFor="applicantName">
                      Nome Completo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="applicantName"
                      type="text"
                      value={customFormData.applicantName || selectedCitizen?.name || ''}
                      onChange={(e) => updateField('applicantName', e.target.value)}
                      placeholder="Nome completo do cidadão"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="applicantCpf">
                      CPF <span className="text-red-500">*</span>
                    </Label>
                    <MaskedInput
                      id="applicantCpf"
                      type="cpf"
                      value={customFormData.applicantCpf || selectedCitizen?.cpf || ''}
                      onChange={(e) => updateField('applicantCpf', e.target.value)}
                      placeholder={getMaskPlaceholder('cpf')}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="applicantEmail">
                      E-mail <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="applicantEmail"
                      type="email"
                      value={customFormData.applicantEmail || selectedCitizen?.email || ''}
                      onChange={(e) => updateField('applicantEmail', e.target.value)}
                      placeholder="email@example.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="applicantPhone">
                      Telefone <span className="text-red-500">*</span>
                    </Label>
                    <MaskedInput
                      id="applicantPhone"
                      type="phone"
                      value={customFormData.applicantPhone || selectedCitizen?.phone || ''}
                      onChange={(e) => updateField('applicantPhone', e.target.value)}
                      placeholder={getMaskPlaceholder('phone')}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Campos do Formulário Customizado */}
              {activeFormFields && activeFormFields.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium text-gray-900">
                    {selectedProgram ? 'Informações Adicionais' : 'Informações Específicas'}
                  </h3>
                  {activeFormFields.map((field: any) => {
                    const isPrefilled = isFieldPrefilled(field.id);

                    return (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id} className="flex items-center gap-2">
                          {field.label}
                          {field.required && <span className="text-red-500">*</span>}
                          {isPrefilled && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
                              <CheckCircle className="h-3 w-3" />
                              Auto-preenchido
                            </span>
                          )}
                        </Label>

                        {field.type === 'text' ? (
                          <input
                            id={field.id}
                            type="text"
                            required={field.required}
                            value={customFormData[field.id] || ''}
                            onChange={(e) => updateField(field.id, e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              isPrefilled
                                ? 'border-green-300 bg-green-50/30'
                                : 'border-gray-300'
                            }`}
                            placeholder={field.placeholder}
                          />
                        ) : null}

                        {field.type === 'number' && (
                          <input
                            id={field.id}
                            type="number"
                            required={field.required}
                            value={customFormData[field.id] || ''}
                            onChange={(e) => updateField(field.id, parseInt(e.target.value) || 0)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              isPrefilled
                                ? 'border-green-300 bg-green-50/30'
                                : 'border-gray-300'
                            }`}
                            placeholder={field.placeholder}
                          />
                        )}

                        {field.type === 'select' && field.options && (
                          <select
                              id={field.id}
                              required={field.required}
                              value={customFormData[field.id] || ''}
                              onChange={(e) => updateField(field.id, e.target.value)}
                              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                isPrefilled
                                  ? 'border-green-300 bg-green-50/30'
                                  : 'border-gray-300'
                              }`}
                            >
                              <option value="">Selecione...</option>
                              {field.options.map((option: string) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                        )}

                        {field.type === 'textarea' && (
                          <Textarea
                            id={field.id}
                            required={field.required}
                            value={customFormData[field.id] || ''}
                            onChange={(e) => updateField(field.id, e.target.value)}
                            rows={3}
                            className={`resize-none ${
                              isPrefilled
                                ? 'border-green-300 bg-green-50/30'
                                : ''
                            }`}
                            placeholder={field.placeholder}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={submitting}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Solicitação
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
        )}

        {/* Avisos */}
        {(!isProgramEnrollment || selectedProgram) && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Após enviar a solicitação:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>Um número de protocolo será gerado</li>
                    <li>O cidadão poderá acompanhar o andamento</li>
                    <li>Notificações serão enviadas sobre atualizações</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
