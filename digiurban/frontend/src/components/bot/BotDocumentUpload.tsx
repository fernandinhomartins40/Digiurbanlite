'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Upload,
  Camera,
  SkipForward,
  Send,
  Check,
  X,
  File as FileIcon,
  AlertCircle,
} from 'lucide-react';
import { ImageCropUpload } from './ImageCropUpload';

interface RequiredDoc {
  id?: string;
  name?: string;
  description?: string;
  required?: boolean;
  acceptedFormats?: string[];
  allowCameraUpload?: boolean;
  maxSizeMB?: number;
}

interface NormalizedDoc {
  id: string;
  name: string;
  description: string;
  required: boolean;
  accept: string;
  allowCamera: boolean;
  maxSizeBytes: number;
}

interface BotDocumentUploadProps {
  requiredDocuments: (string | RequiredDoc)[];
  allowSkip?: boolean;
  maxFiles?: number;
  onSubmit: (files: File[]) => void;
  onSkip?: () => void;
}

function normalizeDoc(doc: string | RequiredDoc, index: number): NormalizedDoc {
  if (typeof doc === 'string') {
    return {
      id: `doc-${index}`,
      name: doc,
      description: '',
      required: true,
      accept: 'image/*,.pdf,.doc,.docx',
      allowCamera: true,
      maxSizeBytes: 10 * 1024 * 1024,
    };
  }

  return {
    id: doc.id || doc.name || `doc-${index}`,
    name: doc.name || `Documento ${index + 1}`,
    description: doc.description || '',
    required: doc.required !== false,
    accept: doc.acceptedFormats?.join(',') || 'image/*,.pdf,.doc,.docx',
    allowCamera: doc.allowCameraUpload !== false,
    maxSizeBytes: (doc.maxSizeMB || 10) * 1024 * 1024,
  };
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export function BotDocumentUpload({
  requiredDocuments,
  allowSkip = true,
  onSubmit,
  onSkip,
}: BotDocumentUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({});
  const [scannerOpen, setScannerOpen] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const docs = requiredDocuments.map((doc, i) => normalizeDoc(doc, i));

  const handleFileSelect = (docId: string, maxSize: number, file: File | null) => {
    if (file && file.size > maxSize) {
      alert(`Arquivo muito grande. Máximo: ${formatSize(maxSize)}`);
      return;
    }
    setUploadedFiles((prev) => ({ ...prev, [docId]: file }));
  };

  const handleCameraCapture = (docId: string, file: File) => {
    setUploadedFiles((prev) => ({ ...prev, [docId]: file }));
    setScannerOpen(null);
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
  const requiredCount = docs.filter((d) => d.required).length;
  const requiredUploaded = docs
    .filter((d) => d.required)
    .filter((d) => uploadedFiles[d.id]).length;
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

      {/* Lista de documentos */}
      <div className="space-y-3">
        {docs.map((doc) => {
          const file = uploadedFiles[doc.id];
          const hasFile = Boolean(file);

          return (
            <div
              key={doc.id}
              className={`rounded-lg border-2 p-3 transition-all ${
                hasFile
                  ? 'border-green-300 bg-green-50'
                  : doc.required
                    ? 'border-amber-200 bg-amber-50/50'
                    : 'border-gray-200 bg-gray-50'
              }`}
            >
              {/* Info do documento */}
              <div className="flex items-start gap-2 mb-2">
                <div className={`mt-0.5 ${hasFile ? 'text-green-600' : 'text-gray-400'}`}>
                  {hasFile ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {doc.name}
                    {doc.required && <span className="text-red-500 ml-1">*</span>}
                  </p>
                  {doc.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{doc.description}</p>
                  )}
                </div>
              </div>

              {/* Arquivo enviado */}
              {hasFile && file && (
                <div className="flex items-center gap-2 p-2 bg-white rounded-md mb-2">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                      <FileIcon className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
                  </div>
                  <button
                    onClick={() => setUploadedFiles((prev) => ({ ...prev, [doc.id]: null }))}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <X className="h-3 w-3 text-gray-500" />
                  </button>
                </div>
              )}

              {/* Botões de upload / câmera */}
              {!hasFile && (
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRefs.current[doc.id]?.click()}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Arquivo
                  </button>
                  {doc.allowCamera && (
                    <button
                      onClick={() => setScannerOpen(doc.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-md transition-colors"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      Câmera
                    </button>
                  )}
                  <input
                    ref={(el) => { fileInputRefs.current[doc.id] = el; }}
                    type="file"
                    accept={doc.accept}
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      handleFileSelect(doc.id, doc.maxSizeBytes, f);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          );
        })}
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

      {/* Modal de scanner/câmera */}
      {scannerOpen && (
        <ImageCropUpload
          isOpen={true}
          onClose={() => setScannerOpen(null)}
          onUpload={(file) => handleCameraCapture(scannerOpen, file)}
          title={`Digitalizar: ${docs.find((d) => d.id === scannerOpen)?.name || 'Documento'}`}
        />
      )}
    </div>
  );
}

export default BotDocumentUpload;
