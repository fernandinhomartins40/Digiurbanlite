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
  onSubmit: (
    files: Array<{
      docId: string;
      documentType: string;
      required: boolean;
      file: File;
    }>
  ) => void;
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
        typeof doc === 'string' ? `doc-${index}` : doc.id || doc.name || `doc-${index}`;
      const config = normalizeDocumentConfig(doc);
      return { docId, config };
    }
  );

  const handleFileChange = (docId: string, file: File | null) => {
    setUploadedFiles((prev) => ({ ...prev, [docId]: file }));
  };

  const handleSubmit = () => {
    const files = docConfigs
      .map(({ docId, config }) => {
        const file = uploadedFiles[docId];
        if (!file) return null;
        return { docId, documentType: config.name || docId, required: config.required !== false, file };
      })
      .filter(Boolean) as Array<{ docId: string; documentType: string; required: boolean; file: File }>;
    if (files.length > 0) onSubmit(files);
  };

  const handleSkip = () => {
    if (onSkip) onSkip();
    else onSubmit([]);
  };

  const uploadedCount = Object.values(uploadedFiles).filter(Boolean).length;
  const requiredCount = docConfigs.filter((d) => d.config.required).length;
  const requiredUploaded = docConfigs.filter((d) => d.config.required).filter((d) => uploadedFiles[d.docId]).length;
  const allRequiredDone = requiredUploaded >= requiredCount;

  return (
    <div className="w-full min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex min-w-0 items-start gap-3 border-b border-slate-100 pb-4 mb-4">
        <div className="shrink-0 rounded-xl bg-blue-50 p-2.5 text-blue-600">
          <FileText className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-900">Documentos necessarios</h3>
          <p className="text-xs text-slate-500 mt-0.5 break-words">
            Envie os anexos solicitados para concluir a abertura do protocolo.
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {uploadedCount} arquivo(s) pronto(s)
            </span>
            {requiredCount > 0 && (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                {requiredUploaded}/{requiredCount} obrigatorios
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Document list — 1 coluna sempre para não transbordar no mobile */}
      <div className="space-y-3">
        {docConfigs.map(({ docId, config }) => (
          <div key={docId} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 overflow-hidden">
            <DocumentUpload
              documentConfig={config}
              value={uploadedFiles[docId] || null}
              onChange={(file) => handleFileChange(docId, file)}
            />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="break-words">Os arquivos serao enviados junto com a solicitacao.</span>
        </div>

        <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
          {allowSkip && (
            <Button variant="outline" onClick={handleSkip} className="min-w-0">
              <SkipForward className="h-4 w-4 mr-2 shrink-0" />
              Pular
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={uploadedCount === 0 || (!allRequiredDone && requiredCount > 0)}
            className="min-w-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
          >
            <Send className="h-4 w-4 mr-2 shrink-0" />
            Enviar {uploadedCount > 0 && `(${uploadedCount})`}
          </Button>
        </div>

        {!allRequiredDone && requiredCount > 0 && uploadedCount > 0 && (
          <p className="text-center text-xs text-amber-600">
            Envie todos os documentos obrigatorios para continuar
          </p>
        )}
      </div>
    </div>
  );
}

export default BotDocumentUpload;
