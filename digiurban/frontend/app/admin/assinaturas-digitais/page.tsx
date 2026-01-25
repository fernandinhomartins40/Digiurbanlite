'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  FileSignature,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  Download,
  Eye,
  RefreshCw,
  Clock,
  FileText,
  Upload,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DocumentSigningModalSimple } from '@/components/shared/DocumentSigningModalSimple';

interface Signature {
  id: string;
  signedAt: string;
  verificationStatus: 'VALID' | 'INVALID' | 'EXPIRED';
  certificate: {
    id: string;
    commonName: string;
    email: string;
    type: 'SERVER' | 'CITIZEN' | 'SYSTEM';
    status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
    serialNumber: string;
  };
  document?: {
    id: string;
    fileName: string;
    fileSize: number;
  };
}

interface Document {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType?: string;
  createdAt: string;
  status?: string;
  _count?: {
    signatures: number;
  };
  signatures?: Signature[];
}

export default function AssinaturasDigitaisPage() {
  const { user } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [mySignatures, setMySignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSignModal, setShowSignModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  useEffect(() => {
    fetchDocuments();
    fetchMySignatures();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/external-documents', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao carregar documentos');
      }

      const data = await response.json();

      if (data.success) {
        setDocuments(data.documents || []);
      } else {
        throw new Error(data.message || 'Erro ao carregar documentos');
      }
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
      toast.error('Erro ao carregar documentos');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMySignatures = async () => {
    try {
      const response = await fetch('/api/signatures/my-signatures', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao carregar assinaturas');
      }

      const data = await response.json();

      if (data.success) {
        setMySignatures(data.signatures || []);
      }
    } catch (error) {
      console.error('Erro ao buscar assinaturas:', error);
      setMySignatures([]);
    }
  };

  const handleUploadDocument = async (file: File) => {
    if (!file) return;

    setUploadingDocument(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', 'Documento para assinatura digital');

      const response = await fetch('/api/external-documents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Documento enviado com sucesso!');
        fetchDocuments();
      } else {
        throw new Error(data.message || 'Erro ao enviar documento');
      }
    } catch (error: any) {
      console.error('Erro ao enviar documento:', error);
      toast.error(error.message || 'Erro ao enviar documento');
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleSignDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setShowSignModal(true);
  };

  const handleSignSuccess = (signature: any) => {
    toast.success('Documento assinado com sucesso!');
    setShowSignModal(false);
    setSelectedDocument(null);
    fetchDocuments();
    fetchMySignatures();
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const response = await fetch(doc.fileUrl);
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
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      toast.error('Erro ao baixar documento');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VALID':
        return (
          <Badge className="bg-green-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Válida
          </Badge>
        );
      case 'INVALID':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Inválida
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Expirada
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingDocuments = filteredDocuments.filter(doc =>
    !doc.signatures || doc.signatures.length === 0 ||
    !doc.signatures.some(sig => sig.certificate.email === user?.email)
  );

  const signedDocuments = filteredDocuments.filter(doc =>
    doc.signatures && doc.signatures.some(sig => sig.certificate.email === user?.email)
  );

  const stats = {
    pending: pendingDocuments.length,
    signed: signedDocuments.length,
    mySignatures: mySignatures.length,
    total: documents.length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileSignature className="w-8 h-8 text-blue-600" />
            Assinaturas Digitais
          </h1>
          <p className="text-gray-600 mt-1">
            Assine documentos digitalmente e gerencie suas assinaturas
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={fetchDocuments}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.pdf,.doc,.docx';
              input.onchange = (e: any) => {
                const file = e.target?.files?.[0];
                if (file) handleUploadDocument(file);
              };
              input.click();
            }}
            disabled={uploadingDocument}
          >
            {uploadingDocument ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Enviar Documento
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes de Assinatura</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Documentos Assinados</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.signed}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Minhas Assinaturas</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.mySignatures}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Documentos</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pendentes ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="signed" className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Assinados ({stats.signed})
          </TabsTrigger>
          <TabsTrigger value="my-signatures" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Minhas Assinaturas ({stats.mySignatures})
          </TabsTrigger>
        </TabsList>

        {/* Tab: Pending Documents */}
        <TabsContent value="pending" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Documentos Pendentes de Assinatura
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-600">Carregando documentos...</p>
                </div>
              ) : pendingDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum documento pendente de assinatura</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900">
                              {doc.fileName}
                            </h3>
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                              <Clock className="w-3 h-3 mr-1" />
                              Pendente
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {format(new Date(doc.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FileText className="w-4 h-4" />
                              <span>{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Shield className="w-4 h-4" />
                              <span>{doc._count?.signatures || 0} assinatura(s)</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadDocument(doc)}
                            title="Baixar documento"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleSignDocument(doc)}
                          >
                            <FileSignature className="w-4 h-4 mr-2" />
                            Assinar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Signed Documents */}
        <TabsContent value="signed" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Documentos que Você Assinou
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-600">Carregando documentos...</p>
                </div>
              ) : signedDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <FileSignature className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Você ainda não assinou nenhum documento</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {signedDocuments.map((doc) => {
                    const mySignature = doc.signatures?.find(sig => sig.certificate.email === user?.email);
                    return (
                      <div
                        key={doc.id}
                        className="border border-gray-200 rounded-lg p-6 hover:border-green-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <FileText className="w-5 h-5 text-green-600" />
                              <h3 className="text-lg font-semibold text-gray-900">
                                {doc.fileName}
                              </h3>
                              <Badge className="bg-green-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Assinado
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  Assinado em {mySignature && format(new Date(mySignature.signedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <FileText className="w-4 h-4" />
                                <span>{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                              </div>

                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Shield className="w-4 h-4" />
                                <span>{doc._count?.signatures || 0} assinatura(s) total</span>
                              </div>
                            </div>

                            {mySignature && (
                              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-900">
                                  <span className="font-medium">Certificado usado:</span> {mySignature.certificate.commonName}
                                </p>
                                <p className="text-sm text-green-800 mt-1">
                                  <span className="font-medium">Status:</span> {getStatusBadge(mySignature.verificationStatus)}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadDocument(doc)}
                              title="Baixar documento"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: My Signatures */}
        <TabsContent value="my-signatures" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Histórico de Assinaturas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mySignatures.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhuma assinatura registrada</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mySignatures.map((signature) => (
                    <div
                      key={signature.id}
                      className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <Shield className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900">
                              {signature.document?.fileName || 'Documento'}
                            </h3>
                            {getStatusBadge(signature.verificationStatus)}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {format(new Date(signature.signedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="w-4 h-4" />
                              <span>{signature.certificate.commonName}</span>
                            </div>
                          </div>

                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-900">
                              <span className="font-medium">Certificado:</span> {signature.certificate.serialNumber}
                            </p>
                            <p className="text-sm text-blue-800 mt-1">
                              <span className="font-medium">Email:</span> {signature.certificate.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Signing Modal */}
      {showSignModal && selectedDocument && (
        <DocumentSigningModalSimple
          document={selectedDocument}
          userType="admin"
          onClose={() => {
            setShowSignModal(false);
            setSelectedDocument(null);
          }}
          onSuccess={handleSignSuccess}
        />
      )}
    </div>
  );
}
