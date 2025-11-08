'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, X, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type DocumentType =
  | 'rg'
  | 'cpf'
  | 'cnh'
  | 'certidao_nascimento'
  | 'certidao_casamento'
  | 'comprovante_residencia'
  | 'titulo_eleitor'
  | 'carteira_trabalho'
  | 'documento_generico'
  | 'foto_perfil';

interface DocumentGuide {
  type: DocumentType;
  aspectRatio: number; // largura / altura
  orientation: 'landscape' | 'portrait';
  label: string;
  instructions: string[];
  exampleShape: 'rectangle' | 'square';
}

const DOCUMENT_GUIDES: Record<DocumentType, DocumentGuide> = {
  rg: {
    type: 'rg',
    aspectRatio: 1.5,
    orientation: 'landscape',
    label: 'RG - Documento de Identidade',
    instructions: [
      'Posicione o RG horizontalmente',
      'Certifique-se que todos os cantos estão visíveis',
      'Evite reflexos e sombras',
      'Mantenha o documento dentro da moldura'
    ],
    exampleShape: 'rectangle'
  },
  cpf: {
    type: 'cpf',
    aspectRatio: 1.5,
    orientation: 'landscape',
    label: 'CPF - Cadastro de Pessoa Física',
    instructions: [
      'Posicione o CPF horizontalmente',
      'Deixe todos os números visíveis',
      'Evite reflexos',
      'Mantenha centralizado'
    ],
    exampleShape: 'rectangle'
  },
  cnh: {
    type: 'cnh',
    aspectRatio: 1.4,
    orientation: 'landscape',
    label: 'CNH - Carteira Nacional de Habilitação',
    instructions: [
      'Posicione a CNH horizontalmente',
      'Certifique-se que a foto está visível',
      'Evite reflexos e brilho',
      'Mantenha todos os cantos visíveis'
    ],
    exampleShape: 'rectangle'
  },
  certidao_nascimento: {
    type: 'certidao_nascimento',
    aspectRatio: 0.7,
    orientation: 'portrait',
    label: 'Certidão de Nascimento',
    instructions: [
      'Posicione verticalmente',
      'Certifique-se que todo o texto está legível',
      'Evite dobras e sombras',
      'Mantenha a certidão completa na tela'
    ],
    exampleShape: 'rectangle'
  },
  certidao_casamento: {
    type: 'certidao_casamento',
    aspectRatio: 0.7,
    orientation: 'portrait',
    label: 'Certidão de Casamento',
    instructions: [
      'Posicione verticalmente',
      'Todo o texto deve estar visível',
      'Evite dobras e sombras',
      'Mantenha a certidão completa na tela'
    ],
    exampleShape: 'rectangle'
  },
  comprovante_residencia: {
    type: 'comprovante_residencia',
    aspectRatio: 0.7,
    orientation: 'portrait',
    label: 'Comprovante de Residência',
    instructions: [
      'Posicione verticalmente',
      'Endereço deve estar legível',
      'Data recente (últimos 3 meses)',
      'Nome do titular visível'
    ],
    exampleShape: 'rectangle'
  },
  titulo_eleitor: {
    type: 'titulo_eleitor',
    aspectRatio: 1.5,
    orientation: 'landscape',
    label: 'Título de Eleitor',
    instructions: [
      'Posicione horizontalmente',
      'Número do título visível',
      'Zona e seção legíveis',
      'Mantenha todos os dados visíveis'
    ],
    exampleShape: 'rectangle'
  },
  carteira_trabalho: {
    type: 'carteira_trabalho',
    aspectRatio: 1.4,
    orientation: 'landscape',
    label: 'Carteira de Trabalho',
    instructions: [
      'Posicione horizontalmente',
      'Dados pessoais visíveis',
      'Foto legível',
      'Sem reflexos'
    ],
    exampleShape: 'rectangle'
  },
  documento_generico: {
    type: 'documento_generico',
    aspectRatio: 0.7,
    orientation: 'portrait',
    label: 'Documento',
    instructions: [
      'Posicione o documento centralmente',
      'Todos os dados devem estar legíveis',
      'Evite reflexos e sombras',
      'Mantenha dentro da moldura'
    ],
    exampleShape: 'rectangle'
  },
  foto_perfil: {
    type: 'foto_perfil',
    aspectRatio: 1,
    orientation: 'portrait',
    label: 'Foto de Perfil',
    instructions: [
      'Centralize seu rosto',
      'Fundo limpo e iluminado',
      'Olhe diretamente para a câmera',
      'Mantenha o rosto dentro do círculo'
    ],
    exampleShape: 'square'
  }
};

interface CameraCaptureProps {
  documentType?: DocumentType;
  onCapture: (file: File) => void;
  onCancel: () => void;
  maxSizeMB?: number;
}

export function CameraCapture({
  documentType = 'documento_generico',
  onCapture,
  onCancel,
  maxSizeMB = 5
}: CameraCaptureProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const guide = DOCUMENT_GUIDES[documentType];

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);

      // Preferências de câmera para captura de documentos
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: documentType === 'foto_perfil' ? 'user' : 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: guide.aspectRatio
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Erro ao acessar câmera:', err);
      setError('Não foi possível acessar a câmera. Verifique as permissões.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  // Função para processar imagem com efeito de documento digitalizado
  const processDocumentImage = (context: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Passo 1: Aumentar contraste e converter para escala de cinza
    for (let i = 0; i < data.length; i += 4) {
      // Converter para escala de cinza (média ponderada)
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

      // Aplicar contraste forte (1.5x) e brilho (+20)
      const contrast = 1.5;
      const brightness = 20;
      let adjusted = (gray - 128) * contrast + 128 + brightness;

      // Aplicar threshold para preto e branco (estilo documento escaneado)
      // Se for muito escuro ou muito claro, mantém; caso contrário, força preto ou branco
      if (adjusted < 100) {
        adjusted = 0; // Preto puro
      } else if (adjusted > 180) {
        adjusted = 255; // Branco puro
      } else {
        // Zona intermediária: força para preto ou branco baseado no threshold
        adjusted = adjusted < 140 ? 0 : 255;
      }

      data[i] = adjusted;     // R
      data[i + 1] = adjusted; // G
      data[i + 2] = adjusted; // B
      // data[i + 3] mantém alpha
    }

    // Passo 2: Aplicar sharpen (nitidez) para melhorar legibilidade do texto
    const tempData = new Uint8ClampedArray(data);
    const kernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            const pixelIdx = ((y + ky) * width + (x + kx)) * 4;
            sum += tempData[pixelIdx] * kernel[kernelIdx];
          }
        }

        const sharpened = Math.max(0, Math.min(255, sum));
        data[idx] = sharpened;
        data[idx + 1] = sharpened;
        data[idx + 2] = sharpened;
      }
    }

    context.putImageData(imageData, 0, 0);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Configurar dimensões do canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Desenhar frame atual do vídeo no canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Aplicar processamento de imagem para efeito de documento digitalizado
    // (apenas para documentos, não para fotos de perfil)
    if (documentType !== 'foto_perfil') {
      processDocumentImage(context, canvas.width, canvas.height);
    }

    // Converter para imagem com alta qualidade
    const imageData = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(imageData);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmPhoto = async () => {
    if (!capturedImage) return;

    try {
      // Converter data URL para Blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      // Verificar tamanho
      const sizeMB = blob.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        setError(`Imagem muito grande (${sizeMB.toFixed(1)}MB). Máximo: ${maxSizeMB}MB`);
        return;
      }

      // Criar arquivo
      const filename = `${documentType}_${Date.now()}.jpg`;
      const file = new File([blob], filename, { type: 'image/jpeg' });

      onCapture(file);
    } catch (err) {
      console.error('Erro ao processar imagem:', err);
      setError('Erro ao processar a imagem capturada');
    }
  };

  // Calcular dimensões do guia visual
  const getGuideDimensions = () => {
    const maxWidth = 80; // % da tela
    const maxHeight = 60; // % da tela

    if (guide.orientation === 'landscape') {
      return {
        width: `${maxWidth}%`,
        height: `${maxWidth / guide.aspectRatio}%`
      };
    } else {
      return {
        width: `${maxHeight * guide.aspectRatio}%`,
        height: `${maxHeight}%`
      };
    }
  };

  const guideDimensions = getGuideDimensions();

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-0">
        <div className="relative bg-black">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <h3 className="font-semibold">{guide.label}</h3>
                <p className="text-xs text-gray-300">Siga as instruções abaixo</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onCancel}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Área da câmera */}
          <div className="relative aspect-[4/3] bg-black">
            {!capturedImage ? (
              <>
                {/* Vídeo da câmera */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Overlay com guia visual */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Área escura ao redor */}
                  <div className="absolute inset-0 bg-black/50" />

                  {/* Moldura do documento */}
                  <div
                    className="relative z-10 border-4 border-white rounded-lg shadow-2xl transition-all"
                    style={{
                      width: guideDimensions.width,
                      height: guideDimensions.height,
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                    }}
                  >
                    {/* Cantos decorativos */}
                    <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg" />

                    {/* Círculo para foto de perfil */}
                    {documentType === 'foto_perfil' && (
                      <div className="absolute inset-4 border-4 border-green-400 rounded-full" />
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* Imagem capturada para revisão */
              <img
                src={capturedImage}
                alt="Foto capturada"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Canvas oculto para captura */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Instruções */}
          <div className="absolute bottom-32 left-0 right-0 z-20 px-4">
            <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 space-y-1">
              {guide.instructions.map((instruction, idx) => (
                <div key={idx} className="flex items-start gap-2 text-white text-sm">
                  <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>{instruction}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Controles */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/70 to-transparent p-6">
            {!capturedImage ? (
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="ghost"
                  onClick={onCancel}
                  className="text-white hover:bg-white/20"
                >
                  Cancelar
                </Button>

                <Button
                  size="lg"
                  onClick={capturePhoto}
                  disabled={!isCameraActive}
                  className="bg-white text-black hover:bg-gray-200 rounded-full w-20 h-20 p-0"
                >
                  <Camera className="h-8 w-8" />
                </Button>

                <div className="w-24" /> {/* Espaçador para centralizar */}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={retakePhoto}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Tirar Novamente
                </Button>

                <Button
                  onClick={confirmPhoto}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4" />
                  Confirmar Foto
                </Button>
              </div>
            )}
          </div>

          {/* Erro */}
          {error && (
            <div className="absolute top-20 left-4 right-4 z-30">
              <div className="bg-red-500/90 backdrop-blur-sm rounded-lg p-3 flex items-start gap-2 text-white">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Erro</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
