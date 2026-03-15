'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, SkipForward, Send, ShieldCheck } from 'lucide-react';
import { DocumentUpload } from '@/components/common/DocumentUpload';
import { normalizeDocumentConfig, type DocumentConfig } from '@/lib/document-utils';

interface RequiredDoc {
  id?: string;
  name?: string;
  description?: string;
  required?: boolean;
  acceptedFormats?: string[];
  allowCameraUpload?: boolean;
  maxSizeMB?: number;
}

interface BotDocumentUploadProps {
  requiredDocuments: (string | RequiredDoc)[];
  allowSkip?: boolean;
  maxFiles?: number;
  onSubmit: (files: File[]) => void;
  onSkip?: () => void;
}

export function BotDocumentUpload({
  requiredDocuments,
  allowSkip = true,
  onSubmit,
  onSkip,
}: BotDocumentUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({});

  const docConfigs: { docId: string; config: DocumentConfig }[] = requiredDocuments.map(
    (doc, index) => {
      const docId =
        typeof doc === 'string'
          ? `doc-${index}`
          : doc.id || doc.name || `doc-${index}`;
      const config = normalizeDocumentConfig(doc);
      return { docId, config };
    }
  );

  const handleFileChange = (docId: string, file: File | null) => {
    setUploadedFiles((prev) => ({ ...prev, [docId]: file }));
  };

  const handleSubmit = () => {
    const files = Object.values(uploadedFiles).filter(Boolean) as File[];
    if (files.length > 0) {
      onSubmit(files);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onSubmit([]);
    }
  };

  const uploadedCount = Object.values(uploadedFiles).filter(Boolean).length;
  const requiredCount = docConfigs.filter((d) => d.config.required).length;
  const requiredUploaded = docConfigs
    .filter((d) => d.config.required)
    .filter((d) => uploadedFiles[d.docId]).length;
  const allRequiredDone = requiredUploaded >= requiredCount;

  return (
    <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Documentos necessarios</h3>
            <p className="text-sm text-slate-500">
              Envie os anexos solicitados para concluir a abertura do protocolo.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <div className="rounded-full bg-slate-100 px-3 py-1 font-medium">
            {uploadedCount} arquivo(s) pronto(s)
          </div>
          {requiredCount > 0 && (
            <div className="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700">
              {requiredUploaded}/{requiredCount} obrigatorios
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {docConfigs.map(({ docId, config }) => (
          <div key={docId} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
            <DocumentUpload
              documentConfig={config}
              value={uploadedFiles[docId] || null}
              onChange={(file) => handleFileChange(docId, file)}
            />
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Os arquivos serao enviados junto com a solicitacao.</span>
        </div>

        <div className="flex gap-2 md:justify-end">
          {allowSkip && (
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1 md:flex-none"
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Pular
            </Button>
          )}

          <Button
            onClick={handleSubmit}
            disabled={uploadedCount === 0 || (!allRequiredDone && requiredCount > 0)}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 md:flex-none"
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar {uploadedCount > 0 && `(${uploadedCount})`}
          </Button>
        </div>
      </div>

      {!allRequiredDone && requiredCount > 0 && uploadedCount > 0 && (
        <p className="mt-3 text-center text-xs text-amber-600">
          Envie todos os documentos obrigatorios para continuar
        </p>
      )}
    </div>
  );
}

export default BotDocumentUpload;
