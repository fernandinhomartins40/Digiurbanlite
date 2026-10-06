'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { CitizenLayout } from '@/components/citizen/CitizenLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Send, Loader2, CheckCircle, FileText, Clock, UserCheck, Info, File, Upload, X, FileCheck, Search, User } from 'lucide-react';
import { toast } from 'sonner';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';
import { api } from '@/lib/services/api';
import { useFormPrefill } from '@/hooks/useFormPrefill';
import { ProgramSelector } from '@/components/citizen/ProgramSelector';
import { ModernMaskedInput as MaskedInput, getMaskPlaceholder } from '@/components/ui/modern-masked-input';
import { normalizeRequiredDocuments } from '@/lib/normalize-documents'
import { DocumentUpload } from '@/components/common/DocumentUpload'
import { normalizeDocumentConfig } from '@/lib/document-utils';
import { ServiceFormRenderer } from '@/components/forms/ServiceFormRenderer';
import { extractFieldsFromSchema, extractCitizenFields } from '@/lib/schema-field-extractor';
import { LocationPicker } from '@/components/common/LocationPicker';
import { getFullApiUrl } from '@/lib/api-config';

interface Service {
  id: string;
  name: string;
  description: string | null;
  estimatedDays: number | null;
  /** nível mínimo para pedir: BRONZE | SILVER | GOLD */
  minLevel?: string;
  serviceSubtype?: string | null;
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

export default function SolicitarServicoPage() {
  const router = useRouter();
  const params = useParams();
  const serviceId = params.id as string;
  const { apiRequest, citizen } = useCitizenAuth();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [locationData, setLocationData] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [showLocation, setShowLocation] = useState(false);

  // Determinar quais campos usar: do programa selecionado ou do serviço
  // useMemo para evitar recriar array em cada render
  // extractFieldsFromSchema já inclui citizenFields automaticamente
  const activeFormFields = useMemo(() => {
    const schema = selectedProgram?.formSchema || service?.formSchema;
    return extractFieldsFromSchema(schema);
  }, [selectedProgram?.formSchema, service?.formSchema]);

  // Determinar se serviço requer geolocalização específica
  const requiresSpecificLocation = useMemo(() => {
    const REQUIRES_LOCATION_MODULES = [
      'SOLICITACAO_REPARO_VIA',
      'VISTORIA_TECNICA_OBRAS',
      'DESOBSTRUCAO_BUEIRO',
      'SOLICITACAO_PODA',
      'APROVACAO_PROJETO_CONSTRUCAO',
      'SOLICITACAO_ILUMINACAO',
      'SOLICITACAO_SINALIZACAO',
      'SOLICITACAO_SEMAFORO',
      'COLETA_ENTULHO',
      'LIMPEZA_TERRENO',
      'DENUNCIA_AMBIENTAL',
      'SOLICITACAO_ANALISE_AMBIENTAL',
      'FISCALIZACAO_OBRA',
      'FISCALIZACAO_POSTURA',
      'FISCALIZACAO_SANITARIA',
    ];

    if (service?.moduleType && REQUIRES_LOCATION_MODULES.includes(service.moduleType)) {
      return true;
    }

    // Fallback por categoria
    const LOCATION_CATEGORIES = ['Manutenção', 'Vistoria', 'Fiscalização', 'Limpeza', 'Poda', 'Iluminação', 'Pavimentação', 'Obras'];
    return service?.formSchema?.properties?.categoria && LOCATION_CATEGORIES.includes(service.formSchema.properties.categoria);
  }, [service?.moduleType, service?.formSchema]);

  // Hook de pré-preenchimento (será inicializado depois que o serviço carregar)
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
        console.log(`[Solicitar] ${count} campos pré-preenchidos automaticamente`);
      }
    }
  });

  useEffect(() => {
    loadService();
  }, [serviceId]);

  const loadService = async () => {
    try {
      // ✅ SEGURANÇA: Usar apiRequest do context (httpOnly cookies)
      const data = await apiRequest(`/citizen/services/${serviceId}`);

      // Garantir que requiredDocuments seja um array
      data.service.requiredDocuments = normalizeRequiredDocuments(data.service.requiredDocuments);

      console.log('📄 Serviço carregado:', {
        name: data.service.name,
        requiresDocuments: data.service.requiresDocuments,
        requiredDocuments: data.service.requiredDocuments,
        isArray: Array.isArray(data.service.requiredDocuments),
        length: data.service.requiredDocuments?.length
      });

      setService(data.service);

      // ✅ O pré-preenchimento será feito automaticamente pelo hook useFormPrefill
      // quando o service.formSchema.fields estiver disponível
    } catch (error) {
      console.error('Erro ao carregar serviço:', error);
      toast.error('Erro ao carregar serviço');
      router.push('/cidadao/servicos');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Se for inscrição em programa, validar se programa foi selecionado
    if (isProgramEnrollment && !selectedProgram) {
      toast.error('Por favor, selecione um programa');
      return;
    }

    const hasOwnQuestions = activeFormFields.some((field) => !field.id.toLowerCase().startsWith('citizen_'));
    if (!description.trim() && !hasOwnQuestions) {
      toast.error('Conte o que você precisa');
      return;
    }

    // ✅ NOVO: Validar geolocalização se obrigatória
    if (requiresSpecificLocation && !locationData) {
      toast.error('Por favor, informe a localização do problema');
      return;
    }

    // Validar campos obrigatórios do formulário customizado (usar campos ativos)
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
      console.log('🔍 Validando documentos do serviço:', {
        requiresDocuments: service.requiresDocuments,
        docs,
        uploadedFiles: Object.keys(uploadedFiles)
      });

      const requiredDocs = docs.filter((doc: any) => {
        if (typeof doc === 'string') return true; // Strings são sempre obrigatórias
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
      // Preparar FormData para upload de arquivos
      const formData = new FormData();
      // o servidor exige descrição; quando o serviço tem perguntas próprias, ela é opcional para a pessoa
      formData.append('description', description.trim() || `Pedido de ${service?.name || 'serviço'}`);
      formData.append('priority', '3');

      // ✅ FILTRAR: Remover campos citizen_* do customFormData
      // Os campos citizen são preenchidos automaticamente pelo backend via token JWT
      // e NÃO devem ser enviados no customFormData
      const finalCustomFormData = Object.keys(customFormData)
        .filter(key => !key.toLowerCase().startsWith('citizen_'))
        .reduce((obj, key) => {
          obj[key] = customFormData[key];
          return obj;
        }, {} as Record<string, any>);

      // Adicionar programId se houver
      if (selectedProgram?.id) {
        finalCustomFormData.programId = selectedProgram.id;
      }

      // 🔍 DEBUG: Log dos dados antes de enviar
      console.log('🔍 [FRONTEND DEBUG] customFormData ORIGINAL:', customFormData);
      console.log('🔍 [FRONTEND DEBUG] customFormData FILTRADO (sem citizen_*):', finalCustomFormData);
      console.log('🔍 [FRONTEND DEBUG] activeFormFields:', activeFormFields.map(f => f.id));

      if (activeFormFields.length > 0 || selectedProgram?.id) {
        const jsonString = JSON.stringify(finalCustomFormData);
        console.log('🔍 [FRONTEND DEBUG] JSON string que será enviado:', jsonString);
        formData.append('customFormData', jsonString);
      }

      // ✅ NOVO: Adicionar locationData se existir
      if (locationData) {
        formData.append('locationData', JSON.stringify(locationData));
        console.log('[Solicitar] locationData enviado:', locationData);
      }

      // ✅ FORMATO CORRETO: Enviar com índices para compatibilidade com Multer .any()
      const filesArray = Object.entries(uploadedFiles);

      // Enviar documentTypes como array
      const documentTypesArray = filesArray.map(([docId]) => docId);
      formData.append('documentTypes', JSON.stringify(documentTypesArray));

      // Adicionar arquivos com formato indexado que funciona com upload.any()
      filesArray.forEach(([docId, file], index) => {
        formData.append(`documents[${index}][id]`, docId);
        formData.append(`documents[${index}][file]`, file);
      });

      console.log('📤 Enviando solicitação com', Object.keys(uploadedFiles).length, 'arquivo(s)');

      // ✅ SEGURANÇA: Fazer request com FormData
      const response = await fetch(getFullApiUrl(`/citizen/services/${serviceId}/request`), {
        method: 'POST',
        body: formData,
        credentials: 'include',
        // Não definir Content-Type para que o navegador defina automaticamente com boundary
      });

      if (!response.ok) {
        // Tentar extrair erro em JSON, se falhar usar status HTTP
        let errorMessage = 'Erro ao enviar solicitação';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } else {
            // Resposta não é JSON (provavelmente HTML de erro)
            const textResponse = await response.text();
            console.error('Resposta de erro (não-JSON):', textResponse.substring(0, 200));
            errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;
          }
        } catch (parseError) {
          console.error('Erro ao processar resposta de erro:', parseError);
          errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      toast.success('Pedido enviado!', {
        description: `Número do pedido: ${data.protocol.number}. Acompanhe em Meus pedidos.`,
      });

      router.push(data.protocol?.id ? `/cidadao/protocolos/${data.protocol.id}` : '/cidadao/protocolos');
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
      <CitizenLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Carregando serviço...</span>
        </div>
      </CitizenLayout>
    );
  }

  if (!service) {
    return (
      <CitizenLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Serviço não encontrado</p>
          <Button className="mt-4" onClick={() => router.push('/cidadao/servicos')}>
            Voltar para serviços
          </Button>
        </div>
      </CitizenLayout>
    );
  }

  // Verificar se é um serviço de inscrição em programas
  const isProgramEnrollment = service?.moduleType && MODULE_TO_API_TYPE[service.moduleType];
  const programApiType = isProgramEnrollment && service?.moduleType ? MODULE_TO_API_TYPE[service.moduleType] : null;

  const hasOwnQuestions = activeFormFields.some((field) => !field.id.toLowerCase().startsWith('citizen_'));
  // nível do cidadão x nível pedido pelo serviço
  const levelRank: Record<string, number> = { BRONZE: 1, SILVER: 2, GOLD: 3 };
  const myRank = citizen?.verificationStatus === 'GOLD' ? 3 : citizen?.verificationStatus === 'VERIFIED' ? 2 : 1;
  const levelBlocked = !!service && (levelRank[service.minLevel || 'BRONZE'] || 1) > myRank;
  // item só de informação (consulta): não abre pedido
  const informationOnly = service?.serviceSubtype === 'CONSULTA_PUBLICA' || service?.serviceSubtype === 'CONSULTA_AUTENTICADA';
  const showForm = !informationOnly && !levelBlocked && (!isProgramEnrollment || selectedProgram);
  const docsToSend: any[] = selectedProgram
    ? (Array.isArray(selectedProgram.requiredDocuments) ? selectedProgram.requiredDocuments : [])
    : service.requiresDocuments && Array.isArray(service.requiredDocuments)
      ? service.requiredDocuments
      : [];

  return (
    <CitizenLayout>
      <div className="mx-auto w-full max-w-2xl space-y-5">
        {/* serviço */}
        <div className="space-y-1">
          <p className="text-sm text-gray-500">{service.department.name}</p>
          <h1 className="text-2xl font-bold text-gray-900">{service.name}</h1>
          {service.description && <p className="text-sm leading-6 text-gray-600">{service.description}</p>}
          {!!service.estimatedDays && (
            <p className="inline-flex items-center gap-1.5 pt-1 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              Prazo de até {service.estimatedDays} dia{service.estimatedDays > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {informationOnly && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            <p className="font-medium">Este item é de informação e não abre pedido.</p>
            <p className="mt-1">
              {/protocolo|solicita|manifesta|atendimentos/i.test(service.name)
                ? 'Os seus pedidos e o andamento de cada um ficam em "Meus pedidos".'
                : 'Tem dúvida ou quer saber mais? Pergunte ao assistente ou procure a secretaria.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {/protocolo|solicita|manifesta|atendimentos/i.test(service.name) ? (
                <Button size="sm" onClick={() => router.push('/cidadao/protocolos')}>Abrir Meus pedidos</Button>
              ) : (
                <Button size="sm" onClick={() => router.push('/cidadao/assistente')}>Perguntar ao assistente</Button>
              )}
            </div>
          </div>
        )}

        {!informationOnly && levelBlocked && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-medium">
              {service.minLevel === 'GOLD' ? 'Este serviço pede cadastro nível Ouro.' : 'Este serviço pede cadastro conferido (nível Prata).'}
            </p>
            <p className="mt-1">
              {service.minLevel === 'GOLD'
                ? 'Envie os seus documentos e cadastre a biometria facial para liberar.'
                : 'Complete o seu perfil e aguarde a prefeitura conferir o seu cadastro.'}{' '}
              Se preferir, peça este serviço no balcão da prefeitura.
            </p>
            <Button size="sm" className="mt-3" onClick={() => router.push('/cidadao/perfil')}>
              Ver o que falta
            </Button>
          </div>
        )}

        {/* inscrição em programa: primeiro escolhe o programa */}
        {isProgramEnrollment && !selectedProgram && programApiType && (
          <ProgramSelector serviceType={programApiType} onSelectProgram={handleSelectProgram} />
        )}

        {isProgramEnrollment && selectedProgram && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs text-green-700">Programa escolhido</p>
              <p className="truncate font-medium text-green-900">{selectedProgram.name}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedProgram(null)} className="text-green-800">
              Trocar
            </Button>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border bg-white p-4 sm:p-6">
            {hasPrefilledData && (
              <p className="flex items-start gap-2 text-sm text-gray-600">
                <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                Já preenchemos o que temos do seu cadastro. Confira e complete o resto.
              </p>
            )}

            {/* dados básicos para inscrição em programa */}
            {selectedProgram && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="applicantName">Nome completo *</Label>
                  <Input id="applicantName" value={customFormData.applicantName || citizen?.name || ''} onChange={(e) => updateField('applicantName', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="applicantCpf">CPF *</Label>
                  <MaskedInput id="applicantCpf" type="cpf" value={customFormData.applicantCpf || citizen?.cpf || ''} onChange={(e) => updateField('applicantCpf', e.target.value)} placeholder={getMaskPlaceholder('cpf')} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="applicantPhone">Telefone *</Label>
                  <MaskedInput id="applicantPhone" type="phone" value={customFormData.applicantPhone || citizen?.phone || ''} onChange={(e) => updateField('applicantPhone', e.target.value)} placeholder={getMaskPlaceholder('phone')} required />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="applicantEmail">E-mail *</Label>
                  <Input id="applicantEmail" type="email" value={customFormData.applicantEmail || citizen?.email || ''} onChange={(e) => updateField('applicantEmail', e.target.value)} required />
                </div>
              </div>
            )}

            {/* perguntas do serviço */}
            {activeFormFields && activeFormFields.length > 0 && (
              <ServiceFormRenderer
                fields={activeFormFields}
                formData={customFormData}
                onChange={updateField}
                isFieldPrefilled={isFieldPrefilled}
                title={selectedProgram ? 'Mais informações' : 'Sobre o pedido'}
              />
            )}

            {/* descrição: obrigatória só quando o serviço não tem perguntas próprias */}
            <div className="space-y-1.5">
              <Label htmlFor="description">
                {hasOwnQuestions ? 'Quer acrescentar algo? (opcional)' : 'Conte o que você precisa *'}
              </Label>
              <Textarea
                id="description"
                placeholder={hasOwnQuestions ? 'Algum detalhe que ajude a equipe' : 'Ex.: onde fica, desde quando acontece, o que você precisa'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={hasOwnQuestions ? 3 : 5}
                className="resize-none"
              />
            </div>

            {/* localização: obrigatória em alguns serviços; nos outros, só se a pessoa quiser */}
            {requiresSpecificLocation || showLocation ? (
              <LocationPicker
                value={locationData}
                onChange={setLocationData}
                required={Boolean(requiresSpecificLocation)}
                serviceName={service?.name}
              />
            ) : (
              <button type="button" onClick={() => setShowLocation(true)} className="text-sm font-medium text-blue-600 hover:underline">
                + Marcar o local no mapa (opcional)
              </button>
            )}

            {/* documentos */}
            {docsToSend.length > 0 && (
              <div className="space-y-3 border-t pt-5">
                <div>
                  <h3 className="font-medium text-gray-900">Documentos</h3>
                  <p className="text-sm text-gray-500">Foto ou arquivo de cada um.</p>
                </div>
                {docsToSend.map((doc: any, index: number) => {
                  const docId = typeof doc === 'string' ? doc : doc.id || doc.name || `doc-${index}`;
                  return (
                    <DocumentUpload
                      key={docId}
                      documentConfig={normalizeDocumentConfig(doc)}
                      value={uploadedFiles[docId] || null}
                      onChange={(file) => (file ? handleFileUpload(docId, file) : handleRemoveFile(docId))}
                    />
                  );
                })}
              </div>
            )}

            <div className="space-y-2 border-t pt-5">
              <Button type="submit" size="lg" disabled={submitting} className="h-12 w-full text-base">
                {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                {submitting ? 'Enviando...' : 'Enviar pedido'}
              </Button>
              <p className="text-center text-xs text-gray-500">Você recebe um número e acompanha tudo em Meus pedidos.</p>
            </div>
          </form>
        )}
      </div>
    </CitizenLayout>
  );
}
