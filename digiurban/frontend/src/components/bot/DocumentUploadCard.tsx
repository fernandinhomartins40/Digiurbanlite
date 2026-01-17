'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, File, Check } from 'lucide-react';

interface DocumentUploadCardProps {
  onUpload: (files: File[]) => void;
  accept?: string;
  maxFiles?: number;
  maxSize?: number; // bytes
  title?: string;
}

export function DocumentUploadCard({
  onUpload,
  accept = 'image/*,.pdf',
  maxFiles = 3,
  maxSize = 5242880, // 5MB
  title = 'Envie os documentos',
}: DocumentUploadCardProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(newFiles).forEach(file => {
      // Verifica tamanho
      if (file.size > maxSize) {
        errors.push(`${file.name}: arquivo muito grande (máx ${formatSize(maxSize)})`);
        return;
      }

      // Verifica quantidade
      if (files.length + validFiles.length >= maxFiles) {
        errors.push(`Máximo de ${maxFiles} arquivos permitidos`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      setFiles([...files, ...validFiles]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleSubmit = () => {
    if (files.length > 0) {
      onUpload(files);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>

      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />

        <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="text-gray-700 font-medium mb-1">
          Arraste arquivos ou clique para selecionar
        </p>
        <p className="text-xs text-gray-500">
          Máx {maxFiles} arquivo(s), até {formatSize(maxSize)} cada
        </p>
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                      <File className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
                </div>

                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
              </div>

              <button
                onClick={e => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        {files.length > 0 && (
          <button
            onClick={() => setFiles([])}
            className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Limpar
          </button>
        )}

        <button
          onClick={handleSubmit}
          disabled={files.length === 0}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Enviar {files.length > 0 && `(${files.length})`}
        </button>
      </div>
    </div>
  );
}

export default DocumentUploadCard;
