'use client';

/**
 * Meus documentos — duas abas: documentos pessoais e assinaturas digitais.
 *
 * Pessoais: UM botão "Enviar documento" (escolhe o tipo → tira foto ou escolhe
 * o arquivo) e a lista do que já foi enviado. Antes eram 13 quadros com 2
 * botões cada, uma lista repetida embaixo e um quadro de dicas.
 */

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AlertCircle, Camera, ChevronRight, Download, FileText, Image as ImageIcon, Loader2, Plus, Trash2, X } from 'lucide-react';
import { CitizenLayout } from '@/components/citizen/CitizenLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { DocumentScanner } from '@/components/common/DocumentScanner';
import { AssinaturasDigitaisPanel } from '@/components/citizen/AssinaturasDigitaisPanel';
import {
  CITIZEN_DOCUMENT_TYPES,
  DOCUMENT_STATUS,
  GOLD_DOCUMENT_TYPES,
  citizenDocumentLabel,
} from '@/lib/citizen-document-types';

/** Imagem do documento (o arquivo é protegido: baixa com a sessão e mostra) */
function DocumentImage({ documentId, fileName, className }: { documentId: string; fileName: string; className?: string }) {
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let url = '';
    apiClient
      .get(`/citizen/personal-documents/${documentId}/download`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Erro ao carregar imagem');
        url = window.URL.createObjectURL(await response.blob());
        if (mounted) setImageUrl(url);
      })
      .catch(() => undefined)
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
      if (url) window.URL.revokeObjectURL(url);
    };
  }, [documentId]);

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }
  if (!imageUrl) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <FileText className="h-6 w-6 text-gray-400" />
      </div>
    );
  }
  return <img src={imageUrl} alt={fileName} className={className} />;
}

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

type Aba = 'pessoais' | 'assinaturas';
/** Envio em andamento: tipo novo ou reenvio de um documento recusado */
type Target = { type: string; label: string; reuploadId?: string };

const formatDate = (value: string) => new Date(value).toLocaleDateString('pt-BR');
const isImage = (mimeType: string) => mimeType?.startsWith('image/');

export default function DocumentosPage() {
  const [aba, setAba] = useState<Aba>('pessoais');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [target, setTarget] = useState<Target | null>(null);
  const [scanning, setScanning] = useState(false);
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState<Document | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('aba') === 'assinaturas') setAba('assinaturas');
    void loadDocuments();
  }, []);

  const trocarAba = (nova: Aba) => {
    setAba(nova);
    window.history.replaceState(null, '', nova === 'assinaturas' ? '/cidadao/documentos?aba=assinaturas' : '/cidadao/documentos');
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/citizen/personal-documents');
      if (!response.ok) throw new Error();
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  /** envia o arquivo escolhido (novo ou reenvio) */
  const send = async (file: File) => {
    if (!target) return;
    const current = target;
    setSending(true);
    try {
      const formData = new FormData();
      let response: Response;
      if (current.reuploadId) {
        formData.append('file', file);
        response = await apiClient.upload(`/citizen/personal-documents/${current.reuploadId}/reupload`, formData);
      } else {
        formData.append('documents', file);
        formData.append('documentType', current.type);
        response = await apiClient.upload('/citizen/personal-documents/upload', formData);
      }
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || error.error || 'Não foi possível enviar o documento');
      }
      toast.success(`${current.label} enviado! Agora é só aguardar a conferência.`);
      setTarget(null);
      await loadDocuments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível enviar. Tente de novo.');
    } finally {
      setSending(false);
    }
  };

  const remove = async (doc: Document) => {
    if (!confirm(`Excluir ${citizenDocumentLabel(doc.documentType)}?`)) return;
    try {
      const response = await apiClient.delete(`/citizen/personal-documents/${doc.id}`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Não foi possível excluir');
      }
      setPreview(null);
      toast.success('Documento excluído');
      await loadDocuments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível excluir');
    }
  };

  const download = async (doc: Document) => {
    try {
      const response = await apiClient.get(`/citizen/personal-documents/${doc.id}/download?download=true`);
      if (!response.ok) throw new Error();
      const url = window.URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Não foi possível baixar o documento');
    }
  };

  const sentTypes = new Set(documents.map((doc) => doc.documentType));
  const orderedTypes = [
    ...CITIZEN_DOCUMENT_TYPES.filter((t) => GOLD_DOCUMENT_TYPES.includes(t.value)),
    ...CITIZEN_DOCUMENT_TYPES.filter((t) => !GOLD_DOCUMENT_TYPES.includes(t.value)),
  ];

  return (
    <CitizenLayout>
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus documentos</h1>
          <p className="mt-0.5 text-sm text-gray-600">Guarde seus documentos aqui e use em qualquer pedido.</p>
        </div>

        <div className="flex gap-1 rounded-xl bg-gray-100 p-1" role="tablist" aria-label="Tipo de documento">
          {([
            { id: 'pessoais', label: 'Documentos pessoais' },
            { id: 'assinaturas', label: 'Assinaturas' },
          ] as { id: Aba; label: string }[]).map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={aba === opt.id}
              onClick={() => trocarAba(opt.id)}
              className={cn(
                'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                aba === opt.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {aba === 'assinaturas' ? (
          <AssinaturasDigitaisPanel />
        ) : (
          <>
            <div className="space-y-1.5">
              <Button size="lg" className="h-12 w-full text-base" onClick={() => setPickerOpen(true)} disabled={sending}>
                {sending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Plus className="mr-2 h-5 w-5" />}
                {sending ? 'Enviando...' : 'Enviar documento'}
              </Button>
              <p className="text-center text-xs text-gray-500">Dica: tire a foto com boa luz, sobre um fundo liso.</p>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center">
                <FileText className="h-10 w-10 text-gray-300" />
                <p className="font-medium text-gray-900">Nenhum documento ainda</p>
                <p className="max-w-xs text-sm text-gray-500">
                  Comece pelo RG, CPF e comprovante de residência — eles servem para a maioria dos pedidos.
                </p>
              </div>
            ) : (
              <ul className="divide-y overflow-hidden rounded-2xl border bg-white">
                {documents.map((doc) => {
                  const status = DOCUMENT_STATUS[doc.status] || DOCUMENT_STATUS.PENDING;
                  const label = citizenDocumentLabel(doc.documentType);
                  return (
                    <li key={doc.id}>
                      <button type="button" onClick={() => setPreview(doc)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border bg-gray-100">
                          {isImage(doc.mimeType) ? (
                            <DocumentImage documentId={doc.id} fileName={doc.fileName} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <FileText className="h-5 w-5 text-blue-500" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium leading-snug text-gray-900">{label}</p>
                          <p className="text-xs text-gray-500">Enviado em {formatDate(doc.uploadedAt)}</p>
                          {doc.status === 'REJECTED' && doc.notes && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-red-600">Motivo: {doc.notes}</p>
                          )}
                        </div>
                        <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-xs font-medium', status.className)}>{status.label}</span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>

      {/* 1. escolher o tipo */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Qual documento?</DialogTitle>
            <DialogDescription>Frente e verso do RG vão separados.</DialogDescription>
          </DialogHeader>
          <ul className="divide-y rounded-xl border">
            {orderedTypes.map((type) => (
              <li key={type.value}>
                <button
                  type="button"
                  onClick={() => {
                    setPickerOpen(false);
                    setTarget({ type: type.value, label: type.label });
                  }}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-900">{type.label}</span>
                  {sentTypes.has(type.value) ? (
                    <span className="text-xs text-gray-500">já enviado</span>
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      {/* 2. foto ou arquivo */}
      <Dialog open={Boolean(target) && !scanning} onOpenChange={(open) => !open && !sending && setTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{target?.reuploadId ? `Enviar de novo: ${target?.label}` : target?.label}</DialogTitle>
            <DialogDescription>Como você quer enviar?</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Button size="lg" className="h-12 justify-start text-base" onClick={() => setScanning(true)} disabled={sending}>
              <Camera className="mr-3 h-5 w-5" />
              Tirar foto do documento
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 justify-start text-base"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
            >
              {sending ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <ImageIcon className="mr-3 h-5 w-5" />}
              {sending ? 'Enviando...' : 'Escolher arquivo ou foto'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) void send(file);
        }}
      />

      {scanning && target && (
        <DocumentScanner
          documentName={target.label}
          acceptedFormats={['jpg', 'jpeg', 'png', 'pdf']}
          maxSizeMB={5}
          onCapture={async (file) => {
            setScanning(false);
            await send(file);
          }}
          onCancel={() => setScanning(false)}
        />
      )}

      {/* ver documento */}
      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {preview && (
            <>
              <DialogHeader>
                <DialogTitle>{citizenDocumentLabel(preview.documentType)}</DialogTitle>
                <DialogDescription>
                  Enviado em {formatDate(preview.uploadedAt)} ·{' '}
                  {(DOCUMENT_STATUS[preview.status] || DOCUMENT_STATUS.PENDING).label}
                </DialogDescription>
              </DialogHeader>

              {preview.status === 'REJECTED' && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{preview.notes ? `Motivo: ${preview.notes}` : 'Este documento foi recusado. Envie outra foto.'}</span>
                </div>
              )}

              <div className="flex min-h-[240px] items-center justify-center rounded-xl bg-gray-100 p-2">
                {isImage(preview.mimeType) ? (
                  <DocumentImage documentId={preview.id} fileName={preview.fileName} className="max-h-[55vh] max-w-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-gray-600">
                    <FileText className="h-12 w-12 text-gray-400" />
                    {preview.fileName}
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                {preview.status !== 'APPROVED' && (
                  <Button variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => remove(preview)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                )}
                <Button variant="outline" onClick={() => download(preview)}>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar
                </Button>
                {preview.status === 'REJECTED' && (
                  <Button
                    onClick={() => {
                      const label = citizenDocumentLabel(preview.documentType);
                      setPreview(null);
                      setTarget({ type: preview.documentType, label, reuploadId: preview.id });
                    }}
                  >
                    Enviar de novo
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </CitizenLayout>
  );
}
