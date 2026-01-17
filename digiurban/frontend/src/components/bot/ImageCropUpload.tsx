'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, Upload, X, RotateCw, ZoomIn, ZoomOut, Check } from 'lucide-react';
import { Slider } from '../../../components/ui/slider';

interface ImageCropUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
  title?: string;
  aspectRatio?: number; // 1 para quadrado, 1.414 para A4, etc.
}

export function ImageCropUpload({
  isOpen,
  onClose,
  onUpload,
  title = 'Enviar Documento',
  aspectRatio = 1.414 // A4 por padrão
}: ImageCropUploadProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      // Criar elemento de vídeo temporário
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Aguardar vídeo estar pronto
      await new Promise(resolve => {
        video.onloadedmetadata = resolve;
      });

      // Capturar frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);

      // Parar stream
      stream.getTracks().forEach(track => track.stop());

      // Converter para base64
      setSelectedImage(canvas.toDataURL('image/jpeg', 0.95));
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
    }
  };

  const processImage = useCallback(async () => {
    if (!selectedImage || !canvasRef.current) return null;

    const img = new Image();
    img.src = selectedImage;

    await new Promise(resolve => {
      img.onload = resolve;
    });

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Definir tamanho do canvas
    const maxWidth = 1200;
    const maxHeight = maxWidth * aspectRatio;

    canvas.width = maxWidth;
    canvas.height = maxHeight;

    // Limpar canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Salvar contexto
    ctx.save();

    // Aplicar transformações
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    // Desenhar imagem
    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;

    ctx.drawImage(
      img,
      -scaledWidth / 2,
      -scaledHeight / 2,
      scaledWidth,
      scaledHeight
    );

    // Restaurar contexto
    ctx.restore();

    // Converter para blob
    return new Promise<File>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'documento.jpg', { type: 'image/jpeg' });
          resolve(file);
        }
      }, 'image/jpeg', 0.85); // Compressão de 85%
    });
  }, [selectedImage, rotation, zoom, brightness, contrast, aspectRatio]);

  const handleUpload = async () => {
    const processedFile = await processImage();
    if (processedFile) {
      onUpload(processedFile);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    setRotation(0);
    setZoom(1);
    setBrightness(100);
    setContrast(100);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedImage ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Botão Câmera */}
              <button
                onClick={handleCamera}
                className="p-8 border-2 border-dashed rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Camera className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="font-medium text-gray-700">Tirar Foto</p>
                <p className="text-sm text-gray-500 mt-1">
                  Use a câmera do dispositivo
                </p>
              </button>

              {/* Botão Upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="font-medium text-gray-700">Carregar Arquivo</p>
                <p className="text-sm text-gray-500 mt-1">
                  Selecione da galeria
                </p>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <>
              {/* Preview da Imagem */}
              <div className="bg-gray-100 rounded-lg p-4 relative overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="max-w-full h-auto mx-auto"
                  style={{ maxHeight: '400px' }}
                />
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="hidden"
                  crossOrigin="anonymous"
                />
              </div>

              {/* Controles */}
              <div className="space-y-4">
                {/* Rotação */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Rotação</label>
                    <span className="text-sm text-gray-500">{rotation}°</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRotation(r => (r - 90) % 360)}
                    >
                      <RotateCw className="w-4 h-4 transform -scale-x-100" />
                    </Button>
                    <Slider
                      value={[rotation]}
                      onValueChange={([value]) => setRotation(value)}
                      min={0}
                      max={360}
                      step={1}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRotation(r => (r + 90) % 360)}
                    >
                      <RotateCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Zoom */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Zoom</label>
                    <span className="text-sm text-gray-500">{zoom.toFixed(1)}x</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ZoomOut className="w-4 h-4 text-gray-500" />
                    <Slider
                      value={[zoom]}
                      onValueChange={([value]) => setZoom(value)}
                      min={0.5}
                      max={3}
                      step={0.1}
                      className="flex-1"
                    />
                    <ZoomIn className="w-4 h-4 text-gray-500" />
                  </div>
                </div>

                {/* Brilho */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Brilho</label>
                    <span className="text-sm text-gray-500">{brightness}%</span>
                  </div>
                  <Slider
                    value={[brightness]}
                    onValueChange={([value]) => setBrightness(value)}
                    min={50}
                    max={150}
                    step={1}
                    className="flex-1"
                  />
                </div>

                {/* Contraste */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Contraste</label>
                    <span className="text-sm text-gray-500">{contrast}%</span>
                  </div>
                  <Slider
                    value={[contrast]}
                    onValueChange={([value]) => setContrast(value)}
                    min={50}
                    max={150}
                    step={1}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedImage(null)}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpload}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Enviar
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
