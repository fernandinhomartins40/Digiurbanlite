'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, File, Check } from 'lucide-react';

interface DocumentUploadCardProps {
  onUpload: (files: File[]) => void;
  accept?: string;
  maxFiles?: number;
  maxSize?: number;
  title?: string;
}

export function DocumentUploadCard({
  onUpload,
  accept = 'image/*,.pdf',
  maxFiles = 3,
  maxSize = 5242880,
  title = 'Envie os documentos',
}: DocumentUploadCardProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const validFiles: File[] = [];
    const errors: string[] = [];
    Array.from(newFiles).forEach((file) => {
      if (file.size > maxSize) {
        errors.push(`${file.name}: arquivo muito grande (máx ${formatSize(maxSize)})`);
        return;
      }
      if (files.length + validFiles.length >= maxFiles) {
        errors.push(`Máximo de ${maxFiles} arquivos permitidos`);
        return;
      }
      validFiles.push(file);
    });
    if (errors.length > 0) alert(errors.join('\n'));
    if (validFiles.length > 0) setFiles([...files, ...validFiles]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full min-w-0 max-w-full bg-white rounded-lg border border-blue-100 shadow-sm p-3.5 sm:p-4 overflow-hidden">
      <h3 className="text-sm font-semibold mb-3 break-words">{title}</h3>

      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative min-w-0 border border-dashed rounded-lg p-4 sm:p-5 text-center cursor-pointer transition-colors overflow-hidden ${
          dragActive ? 'border-teal-600 bg-teal-50' : 'border-blue-200 hover:border-teal-500 hover:bg-blue-50/35'
        }`}
      >
        <input ref={inputRef} type="file" multiple accept={accept} onChange={(e) => handleFiles(e.target.files)} className="hidden" />
        <Upload className="w-7 h-7 mx-auto mb-2 text-blue-600" />
        <p className="text-sm text-gray-700 font-medium mb-1">Toque para selecionar</p>
        <p className="text-xs text-gray-500">Máx {maxFiles} arquivo(s), até {formatSize(maxSize)} cada</p>
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-2 p-2.5 bg-blue-50/45 rounded-lg overflow-hidden">
              <div className="shrink-0">
                {file.type.startsWith('image/') ? (
                  <img src={URL.createObjectURL(file)} alt={file.name} className="w-9 h-9 object-cover rounded-lg" />
                ) : (
                  <div className="w-9 h-9 bg-slate-200 rounded-lg flex items-center justify-center">
                    <File className="w-4 h-4 text-slate-700" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-[11px] text-gray-500">{formatSize(file.size)}</p>
              </div>
              <Check className="w-4 h-4 text-green-500 shrink-0" />
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                className="p-1 hover:bg-gray-200 rounded-lg transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
        {files.length > 0 && (
          <button
            onClick={() => setFiles([])}
            className="min-w-0 px-4 py-2.5 border border-blue-200 text-blue-800 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
          >
            Limpar
          </button>
        )}
        <button
          onClick={() => files.length > 0 && onUpload(files)}
          disabled={files.length === 0}
          className="min-w-0 px-4 py-2.5 bg-gradient-to-r from-blue-700 to-teal-700 text-white rounded-lg font-medium hover:from-blue-800 hover:to-teal-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Enviar {files.length > 0 && `(${files.length})`}
        </button>
      </div>
    </div>
  );
}

export default DocumentUploadCard;
