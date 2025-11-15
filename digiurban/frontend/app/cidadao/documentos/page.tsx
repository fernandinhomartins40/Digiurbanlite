'use client';

import { useState, useEffect, useRef } from 'react';
import { CitizenLayout } from '@/components/citizen/CitizenLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Trash2, Upload, Calendar, CheckCircle, AlertCircle, Camera, Image as ImageIcon } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { DocumentScanner } from '@/components/common/DocumentScanner';

interface Document {
  id: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: 'PENDING' | 'UPLOADED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  notes?: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

const DOCUMENT_TYPES = [
  { value: 'rg_frente', label: 'RG (Frente)' },
  { value: 'rg_verso', label: 'RG (Verso)' },
  { value: 'cpf', label: 'CPF' },
  { value: 'comprovante_residencia', label: 'Comprovante de Residência' },
  { value: 'certidao_nascimento', label: 'Certidão de Nascimento' },
  { value: 'certidao_casamento', label: 'Certidão de Casamento' },
  { value: 'titulo_eleitor', label: 'Título de Eleitor' },
  { value: 'carteira_trabalho', label: 'Carteira de Trabalho' },
  { value: 'comprovante_renda', label: 'Comprovante de Renda' },
  { value: 'declaracao_escolar', label: 'Declaração Escolar' },
  { value: 'cartao_sus', label: 'Cartão do SUS' },
  { value: 'laudo_medico', label: 'Laudo Médico' },
  { value: 'outro', label: 'Outro Documento' }
];

export default function DocumentosPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState<{type: string, label: string} | null>(null);
  const fileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);

      const response = await apiClient.get('/citizen/personal-documents');

      if (!response.ok) {
        throw new Error('Erro ao carregar documentos');
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (type: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await handleUpload(type, file);
  };

  const handleCameraCapture = (type: string, label: string) => {
    setShowScanner({ type, label });
  };

  const handleScanComplete = async (file: File) => {
    if (!showScanner) return;

    const docType = showScanner.type;
    setShowScanner(null);
    await handleUpload(docType, file);
  };

  const handleUpload = async (type: string, file: File) => {
    try {
      setUploadingType(type);

      const formData = new FormData();
      formData.append('documents', file);
      formData.append('documentType', type);

      const response = await apiClient.upload('/citizen/personal-documents/upload', formData);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao enviar documento');
      }

      const data = await response.json();

      // Recarregar lista de documentos
      await loadDocuments();

      alert('Documento enviado com sucesso! Aguardando análise.');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert(error instanceof Error ? error.message : 'Erro ao enviar documento. Tente novamente.');
    } finally {
      setUploadingType(null);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Deseja realmente excluir este documento?')) return;

    try {
      const response = await apiClient.delete(`/citizen/personal-documents/${documentId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao excluir documento');
      }

      // Recarregar lista de documentos
      await loadDocuments();

      alert('Documento excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      alert(error instanceof Error ? error.message : 'Erro ao excluir documento. Tente novamente.');
    }
  };

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const response = await apiClient.get(`/citizen/personal-documents/${documentId}/download`);

      if (!response.ok) {
        throw new Error('Erro ao fazer download');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      alert('Erro ao fazer download do documento.');
    }
  };

  const getDocumentLabel = (type: string) => {
    return DOCUMENT_TYPES.find(dt => dt.value === type)?.label || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="secondary"><Calendar className="w-3 h-3 mr-1" />Em Análise</Badge>;
      case 'UPLOADED':
        return <Badge variant="secondary"><CheckCircle className="w-3 h-3 mr-1" />Enviado</Badge>;
      case 'EXPIRED':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Expirado</Badge>;
      default:
        return <Badge variant="secondary"><Calendar className="w-3 h-3 mr-1" />Pendente</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <CitizenLayout>
        <div className="text-center py-8">Carregando documentos...</div>
      </CitizenLayout>
    );
  }

  return (
    <CitizenLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Documentos</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Gerencie seus documentos digitalizados. Utilize a câmera para melhor qualidade de digitalização.
          </p>
        </div>


      {/* Upload de Novos Documentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Enviar Novo Documento
          </CardTitle>
          <CardDescription>
            Selecione o tipo de documento e faça upload de uma imagem ou utilize a câmera para digitalizar.
            Para melhor resultado, tire a foto com fundo liso e branco.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DOCUMENT_TYPES.map((docType) => {
              const existingDoc = documents.find(d => d.documentType === docType.value);
              const isUploading = uploadingType === docType.value;

              return (
                <div key={docType.value} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-sm">{docType.label}</h3>
                      {existingDoc && (
                        <div className="mt-1">
                          {getStatusBadge(existingDoc.status)}
                        </div>
                      )}
                    </div>
                    <FileText className="w-5 h-5 text-gray-400" />
                  </div>

                  {existingDoc ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center h-32 bg-gray-100 rounded border">
                        <FileText className="w-12 h-12 text-gray-400" />
                      </div>
                      <div className="text-xs text-gray-500">
                        Enviado em {formatDate(existingDoc.uploadedAt)}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="file"
                        ref={(el) => { fileInputRefs.current[docType.value] = el; }}
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileSelect(docType.value, e)}
                        className="hidden"
                        disabled={isUploading}
                      />

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRefs.current[docType.value]?.click()}
                        disabled={isUploading}
                        className="w-full"
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Escolher Arquivo
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleCameraCapture(docType.value, docType.label)}
                        disabled={isUploading}
                        className="w-full"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Digitalizar
                      </Button>

                      {isUploading && (
                        <div className="text-xs text-center text-gray-500">
                          Enviando...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Documentos Enviados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documentos Enviados
          </CardTitle>
          <CardDescription>
            Histórico completo de documentos enviados e seus status de aprovação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum documento enviado ainda. Comece fazendo upload dos seus documentos acima.
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <FileText className="w-8 h-8 text-blue-500" />
                    <div>
                      <h3 className="font-semibold">{getDocumentLabel(doc.documentType)}</h3>
                      <p className="text-sm text-gray-500">{doc.fileName}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Enviado em {formatDate(doc.uploadedAt)}
                      </p>
                      {doc.notes && (
                        <p className="text-xs text-orange-600 mt-1">
                          Observação: {doc.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(doc.status)}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc.id, doc.fileName)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>

                      {doc.status !== 'APPROVED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(doc.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações Importantes */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2 flex items-center gap-2 text-blue-900">
            <AlertCircle className="w-5 h-5" />
            Dicas para Digitalização de Documentos
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Utilize a câmera para melhor qualidade - o sistema aplica efeito de scanner profissional</li>
            <li>• Posicione o documento em uma superfície plana com fundo liso e branco</li>
            <li>• Certifique-se de que há boa iluminação e sem sombras</li>
            <li>• Alinhe o documento dentro da guia retangular antes de capturar</li>
            <li>• Evite reflexos e borrões - mantenha a câmera estável</li>
            <li>• Documentos frente/verso devem ser enviados separadamente</li>
            <li>• Após aprovação, os documentos ficam disponíveis para uso em solicitações de serviços</li>
          </ul>
        </CardContent>
      </Card>

      {/* Scanner de Documentos */}
      {showScanner && (
        <DocumentScanner
          documentName={showScanner.label}
          acceptedFormats={['jpg', 'jpeg', 'png', 'pdf']}
          maxSizeMB={5}
          onCapture={handleScanComplete}
          onCancel={() => setShowScanner(null)}
        />
      )}
      </div>
    </CitizenLayout>
  );
}
