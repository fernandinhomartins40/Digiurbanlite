'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, SkipForward, Send } from 'lucide-react';
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

  // Normalizar os documentos para DocumentConfig usando o utilitário real
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
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-blue-600" />
        <h3 className="text-base font-semibold text-gray-900">
          Documentos Necessários
        </h3>
      </div>

      {requiredCount > 0 && (
        <p className="text-xs text-gray-500 -mt-2">
          {requiredCount} documento(s) obrigatório(s) — campos com *
        </p>
      )}

      {/* Lista de documentos usando DocumentUpload real (com scanner/câmera) */}
      <div className="space-y-4">
        {docConfigs.map(({ docId, config }) => (
          <DocumentUpload
            key={docId}
            documentConfig={config}
            value={uploadedFiles[docId] || null}
            onChange={(file) => handleFileChange(docId, file)}
          />
        ))}
      </div>

      {/* Ações */}
      <div className="flex gap-2 pt-2 border-t">
        {allowSkip && (
          <Button
            variant="outline"
            onClick={handleSkip}
            className="flex-1"
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Pular
          </Button>
        )}

        <Button
          onClick={handleSubmit}
          disabled={uploadedCount === 0 || (!allRequiredDone && requiredCount > 0)}
          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
        >
          <Send className="h-4 w-4 mr-2" />
          Enviar {uploadedCount > 0 && `(${uploadedCount})`}
        </Button>
      </div>

      {!allRequiredDone && requiredCount > 0 && uploadedCount > 0 && (
        <p className="text-xs text-amber-600 text-center">
          Envie todos os documentos obrigatórios (*) para continuar
        </p>
      )}
    </div>
  );
}

export default BotDocumentUpload;
