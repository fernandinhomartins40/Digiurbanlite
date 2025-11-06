'use client';

import { useState, useRef } from 'react';
import { Upload, Camera, File, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CameraCapture, DocumentType } from './camera-capture';

interface DocumentUploadFieldProps {
  id: string;
  label: string;
  description?: string;
  required?: boolean;
  acceptedFormats?: string[];
  maxSizeMB?: number;
  documentType?: DocumentType;
  value?: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}

export function DocumentUploadField({
  id,
  label,
  description,
  required = false,
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
  maxSizeMB = 5,
  documentType = 'documento_generico',
  value,
  onChange,
  error
}: DocumentUploadFieldProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toUpperCase() || '';
  };

  const validateFile = (file: File): string | null => {
    // Validar tipo
    if (!acceptedFormats.includes(file.type)) {
      return `Formato não aceito. Use: ${acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}`;
    }

    // Validar tamanho
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return `Arquivo muito grande (${formatFileSize(file.size)}). Máximo: ${maxSizeMB}MB`;
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    setUploadError(null);

    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    // Gerar preview se for imagem
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    onChange(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleCameraCapture = (file: File) => {
    handleFileSelect(file);
    setShowCamera(false);
  };

  const handleRemoveFile = () => {
    onChange(null);
    setPreview(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const openCamera = () => {
    setShowCamera(true);
  };

  if (showCamera) {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <CameraCapture
          documentType={documentType}
          onCapture={handleCameraCapture}
          onCancel={() => setShowCamera(false)}
          maxSizeMB={maxSizeMB}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        id={id}
        accept={acceptedFormats.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {!value ? (
        /* Estado: Nenhum arquivo selecionado */
        <Card className={cn(
          'border-2 border-dashed transition-colors',
          error || uploadError ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
        )}>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              {/* Ícones */}
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gray-100 rounded-full">
                  <Upload className="h-8 w-8 text-gray-600" />
                </div>
                <div className="text-gray-400 font-semibold">ou</div>
                <div className="p-4 bg-gray-100 rounded-full">
                  <Camera className="h-8 w-8 text-gray-600" />
                </div>
              </div>

              {/* Texto */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Escolha como enviar o documento
                </p>
                <p className="text-xs text-gray-500">
                  Formatos aceitos: {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')} •
                  Tamanho máx: {maxSizeMB}MB
                </p>
              </div>

              {/* Botões */}
              <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
                <Button
                  type="button"
                  variant="outline"
                  onClick={openFileDialog}
                  className="flex-1 gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Escolher Arquivo
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={openCamera}
                  className="flex-1 gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Tirar Foto
                </Button>
              </div>

              {/* Erro */}
              {(error || uploadError) && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error || uploadError}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Estado: Arquivo selecionado */
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Preview ou ícone */}
              <div className="flex-shrink-0">
                {preview ? (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-green-300">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg border-2 border-green-300 bg-white flex items-center justify-center">
                    <File className="h-10 w-10 text-green-600" />
                  </div>
                )}
              </div>

              {/* Informações do arquivo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {value.name}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {getFileExtension(value.name)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatFileSize(value.size)}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                    className="text-gray-400 hover:text-red-600 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Ações */}
                <div className="flex gap-2 mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={openFileDialog}
                    className="text-xs"
                  >
                    Trocar Arquivo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={openCamera}
                    className="text-xs"
                  >
                    Tirar Nova Foto
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
