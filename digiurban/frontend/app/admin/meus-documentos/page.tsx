'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DocumentSigningModal } from '@/components/shared/DocumentSigningModal';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  FileText,
  Upload,
  FileSignature,
  Download,
  Eye,
  Trash2,
  Shield,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExternalDocument {
  id: string;
  fileName: string;
  fileSize: number;
  description?: string;
  uploadedAt: string;
  signatures: Array<{
    id: string;
    signedAt: string;
    certificate: {
      commonName: string;
      email: string;
      type: 'ADMIN' | 'CITIZEN';
      status: string;
    };
  }>;
  _count?: {
    signatures: number;
  };
}

export default function MeusDocumentosPage() {
  const { user } = useAdminAuth();
  const [documents, setDocuments] = useState<ExternalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSigningModal, setShowSigningModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ExternalDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSignatures, setFilterSignatures] = useState<'all' | 'signed' | 'unsigned'>('all');

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/documents/my-external-documents', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setDocuments(data.documents || []);
      } else {
        throw new Error(data.message || 'Erro ao buscar documentos');
      }
    } catch (error: any) {
      console.error('Erro ao buscar documentos:', error);
      toast.error(error.message || 'Erro ao buscar documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Apenas arquivos PDF são aceitos');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo: 50MB');
        return;
      }
      setUploadFile(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error('Selecione um arquivo PDF');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('description', uploadDescription);

      const response = await fetch('/api/documents/upload-external', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Documento enviado com sucesso!');
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadDescription('');
        fetchDocuments();
      } else {
        throw new Error(data.message || 'Erro ao enviar documento');
      }
    } catch (error: any) {
      console.error('Erro ao enviar documento:', error);
      toast.error(error.message || 'Erro ao enviar documento');
    } finally {
      setUploading(false);
    }
  };

  const handleSign = (doc: ExternalDocument) => {
    setSelectedDocument(doc);
    setShowSigningModal(true);
  };

  const handleDownload = async (doc: ExternalDocument) => {
    try {
      const response = await fetch(`/api/documents/external/${doc.id}/download`);

      if (!response.ok) {
        throw new Error('Erro ao baixar documento');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Download iniciado!');
    } catch (error: any) {
      console.error('Erro ao baixar documento:', error);
      toast.error(error.message || 'Erro ao baixar documento');
    }
  };

  const handleDelete = async (doc: ExternalDocument) => {
    if (!confirm(`Deseja realmente remover "${doc.fileName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/external/${doc.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Documento removido com sucesso!');
        fetchDocuments();
      } else {
        throw new Error(data.message || 'Erro ao remover documento');
      }
    } catch (error: any) {
      console.error('Erro ao remover documento:', error);
      toast.error(error.message || 'Erro ao remover documento');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const signatureCount = doc._count?.signatures || doc.signatures?.length || 0;
    const matchesFilter =
      filterSignatures === 'all' ||
      (filterSignatures === 'signed' && signatureCount > 0) ||
      (filterSignatures === 'unsigned' && signatureCount === 0);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meus Documentos</h1>
          <p className="text-gray-600 mt-1">
            Envie documentos PDF para assinatura digital
          </p>
        </div>
        <Button onClick={() => setShowUploadModal(true)} size="lg">
          <Upload className="w-5 h-5 mr-2" />
          Enviar Documento
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Buscar por nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterSignatures === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterSignatures('all')}
              >
                Todos
              </Button>
              <Button
                variant={filterSignatures === 'signed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterSignatures('signed')}
              >
                <Shield className="w-4 h-4 mr-1" />
                Assinados
              </Button>
              <Button
                variant={filterSignatures === 'unsigned' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterSignatures('unsigned')}
              >
                Sem Assinatura
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documentos Enviados ({filteredDocuments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Nenhum documento encontrado</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchTerm || filterSignatures !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Envie seu primeiro documento para começar'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDocuments.map(doc => {
                const signatureCount = doc._count?.signatures || doc.signatures?.length || 0;
                return (
                  <Card key={doc.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <FileText className="w-10 h-10 text-blue-600 shrink-0 mt-1" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {doc.fileName}
                            </p>
                            {doc.description && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {doc.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-gray-500">
                              <span>
                                {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                              </span>
                              <span>•</span>
                              <span>
                                {format(new Date(doc.uploadedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                <span>{signatureCount} assinatura{signatureCount !== 1 ? 's' : ''}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSign(doc)}
                            title="Assinar documento"
                          >
                            <FileSignature className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(doc)}
                            title="Baixar documento"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(doc)}
                            title="Remover documento"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Enviar Documento para Assinatura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arquivo PDF
                  </label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                  {uploadFile && (
                    <p className="text-sm text-gray-600 mt-2">
                      {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição (opcional)
                  </label>
                  <Textarea
                    placeholder="Adicione uma descrição do documento..."
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    rows={3}
                    disabled={uploading}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadFile(null);
                      setUploadDescription('');
                    }}
                    disabled={uploading}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={!uploadFile || uploading}
                    className="flex-1"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Enviar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Signing Modal */}
      {showSigningModal && selectedDocument && (
        <DocumentSigningModal
          document={{
            id: selectedDocument.id,
            fileName: selectedDocument.fileName,
            fileUrl: `/api/documents/external/${selectedDocument.id}/download`,
            fileSize: selectedDocument.fileSize,
            signatures: selectedDocument.signatures,
          }}
          userType="admin"
          onClose={() => {
            setShowSigningModal(false);
            setSelectedDocument(null);
          }}
          onSuccess={() => {
            fetchDocuments();
          }}
        />
      )}
    </div>
  );
}
